import json
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, Response
from app.schemas.chat import (
    ChatRequest, ConversationCreate, ConversationUpdate,
    ConversationResponse, MessageResponse, SavedPromptCreate, SavedPromptResponse,
)
from app.services import llm_service, conversation_service, export_service
from app.services.auth_service import get_user_by_id
from app.middleware.auth import get_current_user_id
from supabase import create_client
from app.config import get_settings
from datetime import datetime, timezone

router = APIRouter(prefix="/chat", tags=["chat"])
settings = get_settings()


# ── Models ────────────────────────────────────────────────────────────────────

@router.get("/models")
async def list_models():
    return {"models": llm_service.get_available_models()}


# ── Conversations ─────────────────────────────────────────────────────────────

@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    data: ConversationCreate,
    user_id: str = Depends(get_current_user_id),
):
    return await conversation_service.create_conversation(user_id, data)


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    search: str = Query(default=""),
    user_id: str = Depends(get_current_user_id),
):
    return await conversation_service.list_conversations(user_id, search)


@router.get("/conversations/{conv_id}", response_model=ConversationResponse)
async def get_conversation(conv_id: str, user_id: str = Depends(get_current_user_id)):
    return await conversation_service.get_conversation(user_id, conv_id)


@router.patch("/conversations/{conv_id}", response_model=ConversationResponse)
async def update_conversation(
    conv_id: str,
    data: ConversationUpdate,
    user_id: str = Depends(get_current_user_id),
):
    return await conversation_service.update_conversation(user_id, conv_id, data)


@router.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: str, user_id: str = Depends(get_current_user_id)):
    await conversation_service.delete_conversation(user_id, conv_id)
    return {"ok": True}


@router.get("/conversations/{conv_id}/messages", response_model=list[MessageResponse])
async def get_messages(conv_id: str, user_id: str = Depends(get_current_user_id)):
    return await conversation_service.get_messages(user_id, conv_id)


# ── Send Message (streaming) ──────────────────────────────────────────────────

@router.post("/conversations/{conv_id}/send")
async def send_message(
    conv_id: str,
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id),
):
    # Verify ownership and reject arbitrary/unsupported model IDs.
    await conversation_service.get_conversation(user_id, conv_id)
    if request.model not in llm_service.PROVIDER_MAP:
        raise HTTPException(status_code=400, detail="Unsupported model")

    # Load existing messages for context
    existing = await conversation_service.get_messages(user_id, conv_id)

    from app.schemas.chat import MessageSchema
    history = [MessageSchema(role=m.role, content=m.content) for m in existing]

    # Prepend system prompt if set
    if request.system_prompt:
        history.insert(0, MessageSchema(role="system", content=request.system_prompt))

    # Add new user message
    user_msg = MessageSchema(role="user", content=request.message)
    history.append(user_msg)

    # Save user message immediately
    await conversation_service.save_message(conv_id, "user", request.message)

    # Auto-generate title on first message
    if len(existing) == 0:
        title = await llm_service.generate_title([user_msg], request.model)
        await conversation_service.update_title(conv_id, title)

    # Collect full response for saving
    full_response = []
    final_tokens = 0
    final_rt = 0

    async def event_generator():
        nonlocal full_response, final_tokens, final_rt
        async for chunk in llm_service.stream_chat(
            messages=history,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            top_p=request.top_p,
        ):
            # Parse chunk to capture metadata
            if chunk.startswith("data: "):
                try:
                    payload = json.loads(chunk[6:])
                    if payload["type"] == "delta":
                        full_response.append(payload["content"])
                    elif payload["type"] == "done":
                        final_tokens = payload.get("tokens", 0)
                        final_rt = payload.get("response_time_ms", 0)
                        # Save assistant message
                        await conversation_service.save_message(
                            conv_id, "assistant",
                            "".join(full_response),
                            model=request.model,
                            tokens=final_tokens,
                            rt_ms=final_rt,
                        )
                except Exception:
                    pass
            yield chunk

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ── Export ────────────────────────────────────────────────────────────────────

@router.get("/conversations/{conv_id}/export")
async def export_conversation(
    conv_id: str,
    format: str = Query(default="markdown", pattern="^(markdown|pdf)$"),
    user_id: str = Depends(get_current_user_id),
):
    conv = await conversation_service.get_conversation(user_id, conv_id)
    messages = await conversation_service.get_messages(user_id, conv_id)

    if format == "markdown":
        content = export_service.export_as_markdown(conv.title, messages)
        return Response(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="{conv.title}.md"'},
        )
    else:
        try:
            from weasyprint import HTML
            html = export_service.export_as_html(conv.title, messages)
            pdf_bytes = HTML(string=html).write_pdf()
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="{conv.title}.pdf"'},
            )
        except ImportError:
            raise HTTPException(status_code=501, detail="PDF export not available on this server")


# ── Prompt Library ────────────────────────────────────────────────────────────

@router.post("/prompts", response_model=SavedPromptResponse)
async def create_prompt(data: SavedPromptCreate, user_id: str = Depends(get_current_user_id)):
    db = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    result = db.table("saved_prompts").insert({
        "user_id": user_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()
    return _to_prompt(result.data[0])


@router.get("/prompts", response_model=list[SavedPromptResponse])
async def list_prompts(
    category: str = Query(default=""),
    favorites: bool = Query(default=False),
    user_id: str = Depends(get_current_user_id),
):
    db = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    q = db.table("saved_prompts").select("*").eq("user_id", user_id).order("created_at", desc=True)
    if category:
        q = q.eq("category", category)
    if favorites:
        q = q.eq("is_favorite", True)
    result = q.execute()
    return [_to_prompt(p) for p in result.data]


@router.patch("/prompts/{prompt_id}", response_model=SavedPromptResponse)
async def update_prompt(prompt_id: str, data: SavedPromptCreate, user_id: str = Depends(get_current_user_id)):
    db = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    result = db.table("saved_prompts").update(data.model_dump()).eq("id", prompt_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(404, "Prompt not found")
    return _to_prompt(result.data[0])


@router.delete("/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str, user_id: str = Depends(get_current_user_id)):
    db = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    db.table("saved_prompts").delete().eq("id", prompt_id).eq("user_id", user_id).execute()
    return {"ok": True}


def _to_prompt(p: dict) -> SavedPromptResponse:
    return SavedPromptResponse(
        id=p["id"], title=p["title"], content=p["content"],
        category=p["category"], is_favorite=p["is_favorite"],
        created_at=p["created_at"],
    )
