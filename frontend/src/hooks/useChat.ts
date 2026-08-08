"use client";
import { useCallback, useRef } from "react";
import { useAppStore } from "@/store";
import { api } from "@/lib/api";
import type { Message } from "@/types";
import { nanoid } from "@/lib/utils";

export function useChat() {
  const {
    activeConvId, selectedModel, settings,
    addMessage, updateLastMessage, setIsGenerating,
    updateConversation, messages,
  } = useAppStore();
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string, convId?: string) => {
      const cid = convId ?? activeConvId;
      if (!cid || !text.trim()) return;

      // Optimistic user message
      const userMsg: Message = {
        id: nanoid(),
        role: "user",
        content: text.trim(),
        model: null,
        tokens_used: null,
        response_time_ms: null,
        created_at: new Date().toISOString(),
      };
      addMessage(userMsg);

      // Placeholder assistant message
      const assistantMsg: Message = {
        id: nanoid(),
        role: "assistant",
        content: "",
        model: selectedModel,
        tokens_used: null,
        response_time_ms: null,
        created_at: new Date().toISOString(),
        isStreaming: true,
      };
      addMessage(assistantMsg);
      setIsGenerating(true);

      abortRef.current = new AbortController();
      let accumulated = "";

      try {
        const res = await api.sendMessage(cid, {
          message: text.trim(),
          model: selectedModel,
          temperature: settings.temperature,
          max_tokens: settings.max_tokens,
          top_p: settings.top_p,
          system_prompt: settings.system_prompt || undefined,
        }, abortRef.current.signal);

        if (!res.body) throw new Error("No response body");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

          const events = buffer.split("\n\n");
          buffer = done ? "" : (events.pop() ?? "");

          for (const event of events) {
            const line = event.split("\n").find((item) => item.startsWith("data: "));
            if (!line) continue;
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.type === "delta") {
                accumulated += payload.content;
                updateLastMessage(accumulated, false);
              } else if (payload.type === "done") {
                updateLastMessage(accumulated, true);
                updateConversation(cid, { updated_at: new Date().toISOString() });
              } else if (payload.type === "error") {
                updateLastMessage(`❌ ${payload.message}`, true);
              }
            } catch {
              // Ignore incomplete/malformed SSE events.
            }
          }
          if (done) break;
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          updateLastMessage(`❌ ${err.message}`, true);
        }
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [activeConvId, selectedModel, settings, addMessage, updateLastMessage, setIsGenerating, updateConversation]
  );

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
    // Mark last streaming message as done
    const msgs = useAppStore.getState().messages;
    const last = msgs[msgs.length - 1];
    if (last?.isStreaming) {
      updateLastMessage(last.content, true);
    }
  }, [setIsGenerating, updateLastMessage]);

  return { sendMessage, stopGenerating };
}
