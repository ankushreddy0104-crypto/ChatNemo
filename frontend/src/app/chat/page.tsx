"use client";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { api } from "@/lib/api";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { Sparkles, Zap, Code2, Globe } from "lucide-react";
import type { Conversation } from "@/types";

const STARTERS = [
  { icon: Code2, label: "Write code", prompt: "Write a Python async REST API with FastAPI and JWT auth" },
  { icon: Sparkles, label: "Brainstorm", prompt: "Give me 10 creative SaaS product ideas for developers" },
  { icon: Zap, label: "Explain anything", prompt: "Explain how transformer attention mechanisms work" },
  { icon: Globe, label: "Summarize", prompt: "What are the most important AI developments in 2025?" },
];

export default function ChatIndexPage() {
  const router = useRouter();
  const { selectedModel, addConversation, setActiveConvId } = useAppStore();

  async function startChat(text: string) {
    const conv = await api.conversations.create({ model: selectedModel }) as Conversation;
    addConversation(conv);
    setActiveConvId(conv.id);
    router.push(`/chat/${conv.id}?q=${encodeURIComponent(text)}`);
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {/* Hero */}
        <div className="text-center space-y-3 max-w-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-nvidia-green/15 border border-nvidia-green/30 mb-2">
            <div className="w-8 h-8 bg-nvidia-green rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-lg">N</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold">How can I help you?</h1>
          <p className="text-muted-foreground">
            Powered by NVIDIA Nemotron. Ask anything — code, analysis, creative writing, research.
          </p>
        </div>

        {/* Starter chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
          {STARTERS.map(({ icon: Icon, label, prompt }) => (
            <button
              key={label}
              onClick={() => startChat(prompt)}
              className="flex flex-col items-start gap-2 p-4 rounded-2xl border border-border bg-card hover:border-nvidia-green/40 hover:bg-nvidia-green/5 transition-all text-left group"
            >
              <Icon className="w-5 h-5 text-nvidia-green" />
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{prompt}</span>
            </button>
          ))}
        </div>
      </div>

      <ChatInput onSend={startChat} onStop={() => {}} />
    </div>
  );
}
