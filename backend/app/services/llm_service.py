"""
LLM Service — provider-agnostic wrapper.
Currently wired to NVIDIA NIM (OpenAI-compatible).
Adding GPT/Claude/Gemini: create a new client, add to PROVIDER_MAP.
"""

import time
import json
from typing import AsyncGenerator, List
from openai import AsyncOpenAI
from app.config import get_settings
from app.schemas.chat import MessageSchema

settings = get_settings()

# ── Provider registry ──────────────────────────────────────────────────────────
PROVIDER_MAP = {
    # NVIDIA NIM models
    "nvidia/nemotron-3-ultra-550b-a55b":          "nvidia",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning": "nvidia",
    "meta/llama-3.3-70b-instruct":            "nvidia",
    "deepseek-ai/deepseek-v4-flash":             "nvidia",
    # Future providers — just add client + map entry:
    # "gpt-4o":          "openai",
    # "claude-3-5-sonnet": "anthropic",
    # "gemini-1.5-pro":  "google",
}

MODEL_LABELS = {
    "nvidia/nemotron-3-ultra-550b-a55b":                  "Nemotron 3 Ultra 550B",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning":  "Nemotron Nano 30B",
    "meta/llama-3.3-70b-instruct":                    "Llama 3.3 70B",
    "deepseek-ai/deepseek-v4-flash":             "DeepSeek V4 Flash",
}


def _get_nvidia_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.NVIDIA_API_KEY,
        base_url=settings.NVIDIA_BASE_URL,
    )


def get_available_models() -> list[dict]:
    return [
        {"id": model_id, "label": label, "provider": PROVIDER_MAP.get(model_id, "nvidia")}
        for model_id, label in MODEL_LABELS.items()
    ]


async def stream_chat(
    messages: List[MessageSchema],
    model: str,
    temperature: float,
    max_tokens: int,
    top_p: float,
) -> AsyncGenerator[str, None]:
    """Yield ChatNemo SSE events while streaming from NVIDIA's OpenAI-compatible API."""
    if model not in PROVIDER_MAP:
        yield f"data: {json.dumps({'type': 'error', 'message': 'Unsupported model'})}\n\n"
        return

    client = _get_nvidia_client()
    start = time.monotonic()
    total_tokens = 0

    try:
        stream = await client.chat.completions.create(
            model=model,
            messages=[{"role": m.role, "content": m.content} for m in messages],
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p,
            stream=True,
            stream_options={"include_usage": True},
        )

        async for chunk in stream:
            if getattr(chunk, "usage", None):
                total_tokens = getattr(chunk.usage, "total_tokens", None) or total_tokens

            if not chunk.choices:
                continue

            choice = chunk.choices[0]
            delta = choice.delta
            if delta and delta.content:
                payload = json.dumps({"type": "delta", "content": delta.content})
                yield f"data: {payload}\n\n"

            if choice.finish_reason:
                elapsed_ms = int((time.monotonic() - start) * 1000)
                done_payload = json.dumps({
                    "type": "done",
                    "tokens": total_tokens,
                    "response_time_ms": elapsed_ms,
                })
                yield f"data: {done_payload}\n\n"
                break

    except Exception as e:
        error_payload = json.dumps({"type": "error", "message": str(e)})
        yield f"data: {error_payload}\n\n"


async def generate_title(messages: List[MessageSchema], model: str) -> str:
    """Generate a short conversation title from the first exchange."""
    client = _get_nvidia_client()
    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "Generate a short (4-6 word) title for this conversation. Return only the title, no punctuation.",
                },
                {"role": "user", "content": messages[0].content if messages else "New Chat"},
            ],
            temperature=0.3,
            max_tokens=20,
            stream=False,
        )
        return resp.choices[0].message.content.strip()[:100]
    except Exception:
        return "New Chat"
