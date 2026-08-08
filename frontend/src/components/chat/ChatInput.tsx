"use client";
import { useState, useRef, useCallback } from "react";
import { Send, StopCircle, BookMarked, Paperclip } from "lucide-react";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  disabled?: boolean;
  onUsePrompt?: () => void;
}

export function ChatInput({ onSend, onStop, disabled, onUsePrompt }: Props) {
  const [text, setText] = useState("");
  const isGenerating = useAppStore((s) => s.isGenerating);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (!text.trim() || isGenerating) return;
    onSend(text.trim());
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, isGenerating, onSend]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <div className={cn(
        "relative flex items-end gap-3 bg-card border border-border rounded-2xl px-4 py-3 transition-all",
        "focus-within:border-nvidia-green/50 focus-within:shadow-[0_0_0_3px_rgba(118,185,0,0.1)]"
      )}>
        {/* Prompt library shortcut */}
        {onUsePrompt && (
          <button
            onClick={onUsePrompt}
            className="shrink-0 text-muted-foreground hover:text-nvidia-green transition-colors pb-0.5"
            title="Prompt Library"
          >
            <BookMarked className="w-5 h-5" />
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={autoResize}
          onKeyDown={handleKey}
          disabled={disabled}
          rows={1}
          placeholder="Message ChatNemo… (Shift+Enter for newline)"
          className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed placeholder:text-muted-foreground max-h-[180px] overflow-y-auto disabled:opacity-50"
        />

        {isGenerating ? (
          <button
            onClick={onStop}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
          >
            <StopCircle className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim() || disabled}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-nvidia-green hover:bg-nvidia-green/90 text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-center text-[10px] text-muted-foreground mt-2">
        ChatNemo can make mistakes. Verify important information.
      </p>
    </div>
  );
}
