import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Conversation, Message, Model, ChatSettings } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";

interface AppStore {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;

  // Conversations
  conversations: Conversation[];
  setConversations: (convs: Conversation[]) => void;
  addConversation: (conv: Conversation) => void;
  updateConversation: (id: string, data: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;

  activeConvId: string | null;
  setActiveConvId: (id: string | null) => void;

  // Messages
  messages: Message[];
  setMessages: (msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  updateLastMessage: (content: string, done?: boolean) => void;

  // Models
  models: Model[];
  setModels: (models: Model[]) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;

  // Settings
  settings: ChatSettings;
  updateSettings: (s: Partial<ChatSettings>) => void;

  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),

      // Conversations
      conversations: [],
      setConversations: (conversations) => set({ conversations }),
      addConversation: (conv) =>
        set((s) => ({ conversations: [conv, ...s.conversations] })),
      updateConversation: (id, data) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        })),
      removeConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          activeConvId: s.activeConvId === id ? null : s.activeConvId,
        })),

      activeConvId: null,
      setActiveConvId: (id) => set({ activeConvId: id, messages: [] }),

      // Messages
      messages: [],
      setMessages: (messages) => set({ messages }),
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      updateLastMessage: (content, done = false) =>
        set((s) => {
          const msgs = [...s.messages];
          const last = msgs[msgs.length - 1];
          if (last && last.role === "assistant") {
            msgs[msgs.length - 1] = {
              ...last,
              content,
              isStreaming: !done,
            };
          }
          return { messages: msgs };
        }),

      // Models
      models: [],
      setModels: (models) => set({ models }),
      selectedModel: "nvidia/nemotron-3-ultra-550b-a55b",
      setSelectedModel: (selectedModel) => set({ selectedModel }),

      // Settings
      settings: DEFAULT_SETTINGS,
      updateSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),

      // UI
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      isGenerating: false,
      setIsGenerating: (isGenerating) => set({ isGenerating }),
    }),
    {
      name: "chatnemo-store",
      partialize: (s) => ({ settings: s.settings, selectedModel: s.selectedModel }),
    }
  )
);
