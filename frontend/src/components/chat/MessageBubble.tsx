"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, User, Bot, Clock, Hash } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

interface Props {
  message: Message;
  modelLabel?: string;
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-border">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{language || "code"}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-nvidia-green" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: "0.8rem",
          background: "hsl(224 71% 4%)",
          padding: "1rem",
        }}
        showLineNumbers
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

export function MessageBubble({ message, modelLabel }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-4 py-4 animate-fade-in", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
        isUser
          ? "bg-nvidia-green/20 border border-nvidia-green/30"
          : "bg-card border border-border"
      )}>
        {isUser
          ? <User className="w-4 h-4 text-nvidia-green" />
          : <Bot className="w-4 h-4 text-muted-foreground" />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0 max-w-[85%]", isUser && "flex flex-col items-end")}>
        {/* Role label */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
          {isUser ? "You" : (modelLabel ?? "ChatNemo")}
        </p>

        {/* Bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-3",
          isUser
            ? "bg-nvidia-green/10 border border-nvidia-green/20"
            : "bg-card border border-border"
        )}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className={cn("prose-chat", message.isStreaming && "typing-cursor")}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className ?? "");
                    const inline = !match;
                    return inline ? (
                      <code className="bg-accent text-nvidia-green px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      <CodeBlock language={match[1]} value={String(children).replace(/\n$/, "")} />
                    );
                  },
                  pre({ children }) { return <>{children}</>; },
                }}
              >
                {message.content || " "}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Meta */}
        {!isUser && !message.isStreaming && (message.tokens_used || message.response_time_ms) && (
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
            {message.response_time_ms && (
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {(message.response_time_ms / 1000).toFixed(1)}s
              </span>
            )}
            {message.tokens_used && (
              <span className="flex items-center gap-1">
                <Hash className="w-2.5 h-2.5" />
                {message.tokens_used} tokens
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
