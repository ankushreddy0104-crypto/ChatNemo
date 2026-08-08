from supabase import create_client
from fastapi import HTTPException
from app.config import get_settings
from app.schemas.chat import (
    ConversationCreate, ConversationUpdate, ConversationResponse, MessageResponse,
)
from datetime import datetime, timezone

settings = get_settings()


def _db():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


async def create_conversation(user_id: str, data: ConversationCreate) -> ConversationResponse:
    db = _db()
    now = datetime.now(timezone.utc).isoformat()
    result = db.table("conversations").insert({
        "user_id": user_id,
        "title": data.title,
        "model": data.model,
        "pinned": False,
        "created_at": now,
        "updated_at": now,
    }).execute()
    c = result.data[0]
    return _to_conv_response(c)


async def list_conversations(user_id: str, search: str = "") -> list[ConversationResponse]:
    db = _db()
    query = db.table("conversations").select("*, messages(count)").eq("user_id", user_id).order("pinned", desc=True).order("updated_at", desc=True)
    if search:
        query = query.ilike("title", f"%{search}%")
    result = query.execute()
    return [_to_conv_response(c) for c in result.data]


async def get_conversation(user_id: str, conv_id: str) -> ConversationResponse:
    db = _db()
    result = db.table("conversations").select("*").eq("id", conv_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return _to_conv_response(result.data[0])


async def update_conversation(user_id: str, conv_id: str, data: ConversationUpdate) -> ConversationResponse:
    db = _db()
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = db.table("conversations").update(updates).eq("id", conv_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return _to_conv_response(result.data[0])


async def delete_conversation(user_id: str, conv_id: str) -> None:
    db = _db()
    db.table("messages").delete().eq("conversation_id", conv_id).execute()
    db.table("conversations").delete().eq("id", conv_id).eq("user_id", user_id).execute()


async def get_messages(user_id: str, conv_id: str) -> list[MessageResponse]:
    db = _db()
    # verify ownership
    conv = db.table("conversations").select("id").eq("id", conv_id).eq("user_id", user_id).execute()
    if not conv.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    result = db.table("messages").select("*").eq("conversation_id", conv_id).order("created_at").execute()
    return [_to_msg_response(m) for m in result.data]


async def save_message(conv_id: str, role: str, content: str,
                       model: str = None, tokens: int = None, rt_ms: int = None) -> MessageResponse:
    db = _db()
    now = datetime.now(timezone.utc).isoformat()
    result = db.table("messages").insert({
        "conversation_id": conv_id,
        "role": role,
        "content": content,
        "model": model,
        "tokens_used": tokens,
        "response_time_ms": rt_ms,
        "created_at": now,
    }).execute()
    # bump conversation updated_at
    db.table("conversations").update({"updated_at": now}).eq("id", conv_id).execute()
    return _to_msg_response(result.data[0])


async def update_title(conv_id: str, title: str) -> None:
    db = _db()
    db.table("conversations").update({
        "title": title,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", conv_id).execute()


def _to_conv_response(c: dict) -> ConversationResponse:
    count = 0
    if "messages" in c and c["messages"]:
        count = c["messages"][0].get("count", 0) if isinstance(c["messages"], list) else 0
    return ConversationResponse(
        id=c["id"], title=c["title"], model=c["model"],
        pinned=c.get("pinned", False),
        created_at=c["created_at"], updated_at=c["updated_at"],
        message_count=count,
    )


def _to_msg_response(m: dict) -> MessageResponse:
    return MessageResponse(
        id=m["id"], role=m["role"], content=m["content"],
        model=m.get("model"), tokens_used=m.get("tokens_used"),
        response_time_ms=m.get("response_time_ms"),
        created_at=m["created_at"],
    )
