"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAppStore } from "@/store";
import ChatLayout from "@/app/chat/layout";
import type { SavedPrompt, Conversation } from "@/types";
import { Plus, Star, Trash2, Edit3, Send, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["General", "Coding", "Writing", "Analysis", "Creative", "Research", "Business"];

export default function PromptLibraryPage() {
  const router = useRouter();
  const { selectedModel, addConversation, setActiveConvId } = useAppStore();
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [category, setCategory] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "General", is_favorite: false });

  useEffect(() => {
    load();
  }, [category, favOnly]);

  async function load() {
    const data = await api.prompts.list({ category: category || undefined, favorites: favOnly || undefined }) as SavedPrompt[];
    setPrompts(data);
  }

  async function save() {
    if (editId) {
      await api.prompts.update(editId, form);
    } else {
      await api.prompts.create(form);
    }
    setShowForm(false);
    setEditId(null);
    setForm({ title: "", content: "", category: "General", is_favorite: false });
    load();
  }

  async function del(id: string) {
    await api.prompts.delete(id);
    setPrompts(p => p.filter(x => x.id !== id));
  }

  async function usePrompt(content: string) {
    const conv = await api.conversations.create({ model: selectedModel }) as Conversation;
    addConversation(conv);
    setActiveConvId(conv.id);
    router.push(`/chat/${conv.id}?q=${encodeURIComponent(content)}`);
  }

  function startEdit(p: SavedPrompt) {
    setEditId(p.id);
    setForm({ title: p.title, content: p.content, category: p.category, is_favorite: p.is_favorite });
    setShowForm(true);
  }

  return (
    <ChatLayout>
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Prompt Library</h1>
              <p className="text-muted-foreground text-sm mt-1">Save and reuse your best prompts</p>
            </div>
            <button
              onClick={() => { setShowForm(true); setEditId(null); setForm({ title: "", content: "", category: "General", is_favorite: false }); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-nvidia-green hover:bg-nvidia-green/90 text-black font-semibold rounded-xl text-sm"
            >
              <Plus className="w-4 h-4" /> New Prompt
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => { setFavOnly(!favOnly); }}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                favOnly ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400" : "border-border text-muted-foreground hover:border-border/80")}
            >
              <Star className="w-3.5 h-3.5" /> Favorites
            </button>
            <button
              onClick={() => setCategory("")}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                !category ? "bg-nvidia-green/20 border-nvidia-green/30 text-nvidia-green" : "border-border text-muted-foreground hover:border-border/80")}
            >
              All
            </button>
            {CATEGORIES.map(c => (
              <button key={c}
                onClick={() => setCategory(c === category ? "" : c)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  category === c ? "bg-nvidia-green/20 border-nvidia-green/30 text-nvidia-green" : "border-border text-muted-foreground hover:border-border/80")}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Form modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{editId ? "Edit Prompt" : "New Prompt"}</h2>
                  <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Prompt title…"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-nvidia-green"
                />
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-nvidia-green"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={6}
                  placeholder="Write your prompt here…"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-nvidia-green resize-none placeholder:text-muted-foreground"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setForm({ ...form, is_favorite: !form.is_favorite })}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all",
                      form.is_favorite ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400" : "border-border text-muted-foreground")}
                  >
                    <Star className="w-3 h-3" /> Favorite
                  </button>
                  <button onClick={save} className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-nvidia-green text-black font-semibold rounded-lg text-xs">
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Prompts grid */}
          {prompts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium mb-1">No prompts yet</p>
              <p className="text-sm">Create your first prompt to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {prompts.map(p => (
                <div key={p.id} className="bg-card border border-border rounded-2xl p-4 space-y-3 hover:border-border/80 transition-all group">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{p.title}</h3>
                        {p.is_favorite && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                      </div>
                      <span className="text-[10px] text-nvidia-green bg-nvidia-green/10 px-2 py-0.5 rounded-full">{p.category}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(p)} className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => del(p.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{p.content}</p>
                  <button
                    onClick={() => usePrompt(p.content)}
                    className="flex items-center gap-1.5 text-xs text-nvidia-green hover:text-nvidia-green/80 font-medium transition-colors"
                  >
                    <Send className="w-3 h-3" /> Use this prompt
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ChatLayout>
  );
}
