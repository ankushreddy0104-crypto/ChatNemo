"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Pin, Trash2, Edit3, MessageSquare,
  BookMarked, Settings, LogOut, X, ChevronLeft, ChevronRight,
  Star
} from "lucide-react";
import { useAppStore } from "@/store";
import { api, clearToken } from "@/lib/api";
import { cn, formatDate, truncate } from "@/lib/utils";
import type { Conversation } from "@/types";

export function Sidebar() {
  const router = useRouter();
  const {
    user, conversations, setConversations, addConversation, updateConversation,
    removeConversation, activeConvId, setActiveConvId, setMessages,
    sidebarOpen, setSidebarOpen, selectedModel,
  } = useAppStore();

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );
  const pinned = filtered.filter((c) => c.pinned);
  const unpinned = filtered.filter((c) => !c.pinned);

  const newChat = useCallback(async () => {
    setLoading(true);
    try {
      const conv = await api.conversations.create({ model: selectedModel }) as Conversation;
      addConversation(conv);
      setActiveConvId(conv.id);
      setMessages([]);
      router.push(`/chat/${conv.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedModel, addConversation, setActiveConvId, setMessages, router]);

  const openConv = useCallback((id: string) => {
    setActiveConvId(id);
    router.push(`/chat/${id}`);
  }, [setActiveConvId, router]);

  const deleteConv = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await api.conversations.delete(id);
    removeConversation(id);
    if (activeConvId === id) router.push("/chat");
  };

  const togglePin = async (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    const updated = await api.conversations.update(conv.id, { pinned: !conv.pinned }) as Conversation;
    updateConversation(conv.id, { pinned: updated.pinned });
  };

  const saveTitle = async (id: string) => {
    if (!editTitle.trim()) return setEditingId(null);
    await api.conversations.update(id, { title: editTitle.trim() });
    updateConversation(id, { title: editTitle.trim() });
    setEditingId(null);
  };

  const logout = () => {
    clearToken();
    useAppStore.getState().setUser(null);
    router.push("/auth");
  };

  function ConvItem({ conv }: { conv: Conversation }) {
    const active = conv.id === activeConvId;
    const isEditing = editingId === conv.id;

    return (
      <div
        onClick={() => openConv(conv.id)}
        className={cn(
          "group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm",
          active
            ? "bg-nvidia-green/15 text-foreground border border-nvidia-green/30"
            : "hover:bg-accent text-muted-foreground hover:text-foreground"
        )}
      >
        {conv.pinned ? (
          <Pin className="w-3.5 h-3.5 shrink-0 text-nvidia-green" />
        ) : (
          <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
        )}

        {isEditing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => saveTitle(conv.id)}
            onKeyDown={(e) => { if (e.key === "Enter") saveTitle(conv.id); if (e.key === "Escape") setEditingId(null); }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-background border border-border rounded px-1.5 py-0.5 text-xs outline-none focus:border-nvidia-green"
          />
        ) : (
          <span className="flex-1 truncate text-xs">{conv.title}</span>
        )}

        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingId(conv.id); setEditTitle(conv.title); }}
            className="p-1 hover:text-foreground rounded"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button onClick={(e) => togglePin(e, conv)} className="p-1 hover:text-nvidia-green rounded">
            <Pin className="w-3 h-3" />
          </button>
          <button onClick={(e) => deleteConv(e, conv.id)} className="p-1 hover:text-red-400 rounded">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center py-4 px-2 w-14 border-r border-border bg-card h-full">
        <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-accent rounded-xl text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={newChat} className="p-2 hover:bg-nvidia-green/20 rounded-xl text-muted-foreground hover:text-nvidia-green transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-64 border-r border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-nvidia-green rounded-lg flex items-center justify-center">
            <span className="text-black font-black text-sm">N</span>
          </div>
          <span className="font-bold text-sm">ChatNemo</span>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={newChat}
          disabled={loading}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-nvidia-green hover:bg-nvidia-green/90 text-black font-semibold rounded-xl text-sm transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats…"
            className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-nvidia-green/50 placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1">
        {pinned.length > 0 && (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 py-1 flex items-center gap-1">
              <Star className="w-2.5 h-2.5" /> Pinned
            </p>
            {pinned.map((c) => <ConvItem key={c.id} conv={c} />)}
            {unpinned.length > 0 && <div className="border-t border-border my-2" />}
          </>
        )}
        {unpinned.length > 0 && (
          <>
            {pinned.length > 0 && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 py-1">
                Recent
              </p>
            )}
            {unpinned.map((c) => <ConvItem key={c.id} conv={c} />)}
          </>
        )}
        {filtered.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">
            {search ? "No chats found" : "No conversations yet"}
          </p>
        )}
      </div>

      {/* Bottom nav */}
      <div className="border-t border-border p-3 space-y-1">
        <button
          onClick={() => router.push("/prompt-library")}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all text-xs"
        >
          <BookMarked className="w-4 h-4" /> Prompt Library
        </button>
        <button
          onClick={() => router.push("/settings")}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all text-xs"
        >
          <Settings className="w-4 h-4" /> Settings
        </button>

        {/* User profile */}
        <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
          <div className="w-7 h-7 rounded-full bg-nvidia-green/20 border border-nvidia-green/30 flex items-center justify-center shrink-0">
            <span className="text-nvidia-green text-xs font-bold">
              {user?.full_name?.charAt(0) ?? user?.email?.charAt(0) ?? "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.full_name ?? "User"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button onClick={logout} className="text-muted-foreground hover:text-red-400 transition-colors p-1 rounded">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
