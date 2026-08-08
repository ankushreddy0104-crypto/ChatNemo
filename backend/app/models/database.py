"""
Supabase table definitions (SQL migration — see supabase/migrations/).
Python-side type representations for use across services.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List, Any
import uuid


@dataclass
class User:
    id: str
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime
    settings: dict  # JSON column


@dataclass
class Conversation:
    id: str
    user_id: str
    title: str
    model: str
    pinned: bool
    created_at: datetime
    updated_at: datetime


@dataclass
class Message:
    id: str
    conversation_id: str
    role: str          # "user" | "assistant" | "system"
    content: str
    model: Optional[str]
    tokens_used: Optional[int]
    response_time_ms: Optional[int]
    created_at: datetime


@dataclass
class SavedPrompt:
    id: str
    user_id: str
    title: str
    content: str
    category: str
    is_favorite: bool
    created_at: datetime
