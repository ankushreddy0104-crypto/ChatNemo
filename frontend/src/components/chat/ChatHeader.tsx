"use client";
import { Download, RefreshCw, Menu } from "lucide-react";
import { ModelSelector } from "./ModelSelector";
import { useAppStore } from "@/store";
import { api } from "@/lib/api";
import { useState } from "react";

interface Props {
  convId?: string;
  onRegenerate?: () => void;
}

export function ChatHeader({ convId, onRegenerate }: Props) {
  const { setSidebarOpen, sidebarOpen, conversations, activeConvId } = useAppStore();
  const [exportLoading, setExportLoading] = useState(false);

  const conv = conversations.find((c) => c.id === (convId ?? activeConvId));

  const exportChat = async (format: "markdown" | "pdf") => {
    if (!convId) return;
    setExportLoading(true);
    try {
      const url = api.conversations.exportUrl(convId, format);
      const token = document.cookie.match(/chatnemo_token=([^;]+)/)?.[1];
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${conv?.title ?? "chat"}.${format === "pdf" ? "pdf" : "md"}`;
      a.click();
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-accent rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <ModelSelector />
        {conv && (
          <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-[200px]">
            {conv.title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate
          </button>
        )}

        {convId && (
          <div className="relative group">
            <button
              disabled={exportLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-xl shadow-xl z-50 py-1 hidden group-hover:block">
              <button onClick={() => exportChat("markdown")} className="w-full px-3 py-2 text-xs text-left hover:bg-accent transition-colors">
                📄 Markdown (.md)
              </button>
              <button onClick={() => exportChat("pdf")} className="w-full px-3 py-2 text-xs text-left hover:bg-accent transition-colors">
                📋 PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
