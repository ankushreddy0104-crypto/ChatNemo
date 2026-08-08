"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, saveToken } from "@/lib/api";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

export default function AuthPage() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await (mode === "login"
        ? api.auth.login({ email: form.email, password: form.password })
        : api.auth.register(form)) as { access_token: string; user: User };
      saveToken(res.access_token);
      setUser(res.user);
      router.push("/chat");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-nvidia-green/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-nvidia-green mb-4">
            <span className="text-black font-black text-2xl">N</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">ChatNemo</h1>
          <p className="text-muted-foreground text-sm mt-1">Powered by NVIDIA NIM</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          {/* Tab switcher */}
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                  mode === m
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Your name"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green/30 transition-all placeholder:text-muted-foreground"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green/30 transition-all placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green/30 transition-all placeholder:text-muted-foreground"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-nvidia-green hover:bg-nvidia-green/90 text-black font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Your conversations are private and encrypted.
        </p>
      </div>
    </div>
  );
}
