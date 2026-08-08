"use client";
import { useAppStore } from "@/store";
import { api } from "@/lib/api";
import { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { DEFAULT_SETTINGS } from "@/types";
import ChatLayout from "@/app/chat/layout";

function Slider({ label, value, min, max, step, onChange, description }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; description?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm font-mono text-nvidia-green bg-nvidia-green/10 px-2 py-0.5 rounded-lg">
          {value}
        </span>
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-nvidia-green"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings, models, selectedModel, setSelectedModel } = useAppStore();
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await api.auth.updateProfile({ settings });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => updateSettings(DEFAULT_SETTINGS);

  return (
    <ChatLayout>
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-6 py-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">Customize your ChatNemo experience</p>
          </div>

          {/* Model */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold">Default Model</h2>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-nvidia-green"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </section>

          {/* Generation params */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <h2 className="font-semibold">Generation Parameters</h2>
            <Slider
              label="Temperature"
              value={settings.temperature}
              min={0} max={2} step={0.05}
              onChange={(v) => updateSettings({ temperature: v })}
              description="Higher = more creative, lower = more deterministic"
            />
            <Slider
              label="Max Tokens"
              value={settings.max_tokens}
              min={256} max={8192} step={256}
              onChange={(v) => updateSettings({ max_tokens: v })}
              description="Maximum length of the response"
            />
            <Slider
              label="Top P"
              value={settings.top_p}
              min={0} max={1} step={0.01}
              onChange={(v) => updateSettings({ top_p: v })}
              description="Nucleus sampling — controls diversity"
            />
          </section>

          {/* System prompt */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold">System Prompt</h2>
            <p className="text-xs text-muted-foreground">
              Sets the assistant's behavior and persona for all conversations.
            </p>
            <textarea
              value={settings.system_prompt}
              onChange={(e) => updateSettings({ system_prompt: e.target.value })}
              rows={5}
              placeholder="You are a helpful, precise AI assistant…"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-nvidia-green resize-none placeholder:text-muted-foreground"
            />
          </section>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={save}
              className="flex items-center gap-2 px-5 py-2.5 bg-nvidia-green hover:bg-nvidia-green/90 text-black font-semibold rounded-xl text-sm transition-all"
            >
              <Save className="w-4 h-4" />
              {saved ? "Saved!" : "Save Settings"}
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 border border-border hover:bg-accent text-muted-foreground hover:text-foreground rounded-xl text-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Defaults
            </button>
          </div>
        </div>
      </div>
    </ChatLayout>
  );
}
