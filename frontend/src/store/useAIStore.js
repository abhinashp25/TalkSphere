import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useAIStore = create((set, get) => ({
  aiMessages:   [],
  isAILoading:  false,
  smartReplies: [],
  rateLimitUntil: 0,
  retryAfter: 0,
  rateLimitIntervalId: null,

  clearAI: () => set({ aiMessages: [], smartReplies: [] }),

  sendAIMessage: async (userText) => {
    if (!userText.trim()) return;

    const now = Date.now();
    const { rateLimitUntil } = get();
    if (rateLimitUntil > now) {
      const secs = Math.ceil((rateLimitUntil - now) / 1000);
      const warnMsg = {
        role: "assistant",
        content: `⏳ Still cooling down. Please wait ${secs} more second${secs !== 1 ? "s" : ""}.`,
        id: Date.now() + 1,
        isError: true,
      };
      set({ aiMessages: [...get().aiMessages, warnMsg] });
      return;
    }

    const newMsg = { role: "user", content: userText, id: Date.now() };
    const history = [...get().aiMessages, newMsg];
    set({ aiMessages: history, isAILoading: true, smartReplies: [] });

    try {
      const res = await axiosInstance.post("/ai/chat", {
        messages: history.map(({ role, content }) => ({ role, content })),
      });
      const aiMsg = { role: "assistant", content: res.data.reply, id: Date.now() + 1 };
      set({ aiMessages: [...get().aiMessages, aiMsg], rateLimitUntil: 0, retryAfter: 0 });
    } catch (e) {
      const status = e?.response?.status;
      let errText = e?.response?.data?.message || "Something went wrong.";
      let cooldown = 0;

      if (status === 429) {
        const serverCooldown = e?.response?.data?.retryAfter;
        cooldown = typeof serverCooldown === "number" ? serverCooldown : 60;
        errText = `⏳ Assistant rate limit hit. I'll be ready again in ${cooldown}s.`;
        set({ rateLimitUntil: Date.now() + cooldown * 1000, retryAfter: cooldown });

        const existingInterval = get().rateLimitIntervalId;
        if (existingInterval) clearInterval(existingInterval);

        const tick = setInterval(() => {
          const remaining = Math.ceil((get().rateLimitUntil - Date.now()) / 1000);
          if (remaining <= 0) {
            clearInterval(tick);
            set({ retryAfter: 0, rateLimitIntervalId: null });
          } else {
            set({ retryAfter: remaining });
          }
        }, 1000);
        set({ rateLimitIntervalId: tick });
      }

      const errMsg = {
        role: "assistant",
        content: errText,
        id: Date.now() + 1,
        isError: true,
      };
      set({ aiMessages: [...get().aiMessages, errMsg] });
    } finally {
      set({ isAILoading: false });
    }
  },

  fetchSmartReplies: async (lastMessage) => {
    if (!lastMessage?.trim()) return;
    try {
      const res = await axiosInstance.post("/ai/smart-replies", { lastMessage });
      set({ smartReplies: res.data.suggestions || [] });
    } catch {
      set({ smartReplies: ["👍", "Thanks!", "Sure!", "Got it!"] });
    }
  },

  clearSmartReplies: () => set({ smartReplies: [] }),

  translateMessage: async (text, targetLang = "English") => {
    if (!text?.trim()) return text;
    try {
      const res = await axiosInstance.post("/ai/translate", { text, targetLang });
      return res.data.translation || text;
    } catch {
      return text;
    }
  },
}));
