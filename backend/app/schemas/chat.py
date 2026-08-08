from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal
from datetime import datetime
import bleach


class MessageSchema(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

    @field_validator("content")
    @classmethod
    def sanitize_content(cls, v: str) -> str:
        return bleach.clean(v, tags=[], strip=True)


class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=32000)
    model: str = Field(default="nvidia/nemotron-3-ultra-550b-a55b")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2048, ge=1, le=8192)
    top_p: float = Field(default=0.95, ge=0.0, le=1.0)
    system_prompt: Optional[str] = Field(default=None, max_length=4000)
    stream: bool = True

    @field_validator("message")
    @classmethod
    def sanitize_message(cls, v: str) -> str:
        return v.strip()


class ConversationCreate(BaseModel):
    title: str = Field(default="New Chat", max_length=200)
    model: str = Field(default="nvidia/nemotron-3-ultra-550b-a55b")


class ConversationUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    pinned: Optional[bool] = None


class ConversationResponse(BaseModel):
    id: str
    title: str
    model: str
    pinned: bool
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    model: Optional[str]
    tokens_used: Optional[int]
    response_time_ms: Optional[int]
    created_at: datetime


class SavedPromptCreate(BaseModel):
    title: str = Field(..., max_length=200)
    content: str = Field(..., max_length=8000)
    category: str = Field(default="General", max_length=100)
    is_favorite: bool = False


class SavedPromptResponse(BaseModel):
    id: str
    title: str
    content: str
    category: str
    is_favorite: bool
    created_at: datetime
