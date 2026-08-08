"use client";
import { ChevronDown, Cpu } from "lucide-react";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

const PROVIDER_COLORS: Record<string, string> = {
  nvidia: "text-nvidia-green",
  openai: "text-emerald-400",
  anthropic: "text-orange-400",
  google: "text-blue-400",
};

export function ModelSelector() {
  const { models, selectedModel, setSelectedModel } = useAppStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const current = models.find((m) => m.id === selectedModel);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card hover:bg-accent transition-all text-sm"
      >
        <Cpu className="w-4 h-4 text-nvidia-green" />
        <span className="font-medium max-w-[180px] truncate">{current?.label ?? "Select Model"}</span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-2xl shadow-2xl z-50 py-2 animate-fade-in">
          {/* Group by provider */}
          {["nvidia", "openai", "anthropic", "google"].map((provider) => {
            const providerModels = models.filter((m) => m.provider === provider);
            if (!providerModels.length) return null;
            return (
              <div key={provider}>
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {provider.toUpperCase()}
                </p>
                {providerModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => { setSelectedModel(model.id); setOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors text-left",
                      selectedModel === model.id && "bg-nvidia-green/10"
                    )}
                  >
                    <div className={cn("w-2 h-2 rounded-full bg-current", PROVIDER_COLORS[provider] ?? "text-muted-foreground")} />
                    <div>
                      <p className="text-sm font-medium">{model.label}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{model.id}</p>
                    </div>
                    {selectedModel === model.id && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-nvidia-green" />
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
