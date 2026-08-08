"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { useAppStore } from "@/store";
import { api, hasToken } from "@/lib/api";
import type { Conversation, Model, User } from "@/types";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser, setConversations, setModels, sidebarOpen } = useAppStore();

  useEffect(() => {
    if (!hasToken()) { router.push("/auth"); return; }

    async function init() {
      try {
        const [user, convs, modelsRes] = await Promise.all([
          api.auth.me() as Promise<User>,
          api.conversations.list() as Promise<Conversation[]>,
          api.models.list(),
        ]);
        setUser(user);
        setConversations(convs);
        setModels(modelsRes.models);
      } catch {
        router.push("/auth");
      }
    }
    init();
  }, [router, setUser, setConversations, setModels]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — hidden on mobile, overlaid on sm */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transition-transform duration-200
        md:relative md:translate-x-0 md:flex
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:w-14"}
      `}>
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => useAppStore.getState().setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
