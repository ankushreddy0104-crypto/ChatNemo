export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model: string | null;
  tokens_used: number | null;
  response_time_ms: number | null;
  created_at: string;
  // UI-only
  isStreaming?: boolean;
}

export interface Model {
  id: string;
  label: string;
  provider: string;
}

export interface SavedPrompt {
  id: string;
  title: string;
  content: string;
  category: string;
  is_favorite: boolean;
  created_at: string;
}

export interface ChatSettings {
  temperature: number;
  max_tokens: number;
  top_p: number;
  system_prompt: string;
  default_model: string;
}

export const DEFAULT_SETTINGS: ChatSettings = {
  temperature: 0.7,
  max_tokens: 2048,
  top_p: 0.95,
  system_prompt: "",
  default_model: "nvidia/nemotron-3-ultra-550b-a55b",
};
