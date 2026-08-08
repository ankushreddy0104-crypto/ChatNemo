import Cookies from "js-cookie";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const V = `${BASE}/api/v1`;

function getToken(): string | undefined {
  return Cookies.get("chatnemo_token");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${V}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (data: { email: string; password: string; full_name: string }) =>
      request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    me: () => request("/auth/me"),
    updateProfile: (data: object) =>
      request("/auth/me", { method: "PATCH", body: JSON.stringify(data) }),
  },

  // ── Models ────────────────────────────────────────────────────────────────
  models: {
    list: () => request<{ models: import("@/types").Model[] }>("/chat/models"),
  },

  // ── Conversations ─────────────────────────────────────────────────────────
  conversations: {
    create: (data: { title?: string; model: string }) =>
      request("/chat/conversations", { method: "POST", body: JSON.stringify(data) }),
    list: (search = "") =>
      request(`/chat/conversations?search=${encodeURIComponent(search)}`),
    get: (id: string) => request(`/chat/conversations/${id}`),
    update: (id: string, data: object) =>
      request(`/chat/conversations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/chat/conversations/${id}`, { method: "DELETE" }),
    messages: (id: string) => request(`/chat/conversations/${id}/messages`),
    exportUrl: (id: string, format: "markdown" | "pdf") =>
      `${V}/chat/conversations/${id}/export?format=${format}`,
  },

  // ── Streaming send ────────────────────────────────────────────────────────
  sendMessage: (
    convId: string,
    body: {
      message: string;
      model: string;
      temperature: number;
      max_tokens: number;
      top_p: number;
      system_prompt?: string;
    },
    signal?: AbortSignal
  ): Promise<Response> => {
    const token = getToken();
    return fetch(`${V}/chat/conversations/${convId}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  },

  // ── Prompt library ────────────────────────────────────────────────────────
  prompts: {
    list: (params?: { category?: string; favorites?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.category) q.set("category", params.category);
      if (params?.favorites) q.set("favorites", "true");
      return request(`/chat/prompts?${q.toString()}`);
    },
    create: (data: object) =>
      request("/chat/prompts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: object) =>
      request(`/chat/prompts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/chat/prompts/${id}`, { method: "DELETE" }),
  },
};

// ── Token helpers ─────────────────────────────────────────────────────────────
export function saveToken(token: string) {
  Cookies.set("chatnemo_token", token, { expires: 7, sameSite: "strict" });
}
export function clearToken() {
  Cookies.remove("chatnemo_token");
}
export function hasToken() {
  return !!getToken();
}
