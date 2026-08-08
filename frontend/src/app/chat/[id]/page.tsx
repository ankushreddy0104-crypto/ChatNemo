"use client";
import { useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAppStore } from "@/store";
import { api } from "@/lib/api";
import { useChat } from "@/hooks/useChat";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import type { Message } from "@/types";
import { Loader2 } from "lucide-react";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { messages, setMessages, setActiveConvId, models, selectedModel, isGenerating } = useAppStore();
  const { sendMessage, stopGenerating } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef<string | null>(null);

  const currentModel = models.find((m) => m.id === selectedModel);

  // Load messages
  useEffect(() => {
    if (!id || loadedRef.current === id) return;
    loadedRef.current = id;
    setActiveConvId(id);

    async function load() {
      const msgs = await api.conversations.messages(id) as Message[];
      setMessages(msgs);

      // Handle ?q= from index page to auto-send first message
      const q = searchParams.get("q");
      if (q && msgs.length === 0) {
        // Small delay to ensure store is ready
        setTimeout(() => sendMessage(q, id), 100);
      }
    }
    load();
  }, [id, setActiveConvId, setMessages, searchParams, sendMessage]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback((text: string) => {
    sendMessage(text, id);
  }, [sendMessage, id]);

  const handleRegenerate = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) handleSend(lastUser.content);
  }, [messages, handleSend]);

  return (
    <div className="flex flex-col h-full">
      <ChatHeader convId={id} onRegenerate={messages.length > 0 ? handleRegenerate : undefined} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && !isGenerating ? (
            <div className="flex items-center justify-center h-full py-20">
              <div className="text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Loading conversation…</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  modelLabel={currentModel?.label}
                />
              ))}
            </>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      <div className="max-w-3xl w-full mx-auto">
        <ChatInput onSend={handleSend} onStop={stopGenerating} />
      </div>
    </div>
  );
}
