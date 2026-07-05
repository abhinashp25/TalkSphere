import { useState, useRef, useEffect } from "react";
import { useAIStore } from "../store/useAIStore";
import { useChatStore } from "../store/useChatStore";
import { XIcon, RefreshCwIcon, ArrowLeftIcon, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STARTERS = [
  { emoji: "✍️", label: "Help me write a message" },
  { emoji: "💡", label: "What can you do?" },
  { emoji: "🌍", label: "Tell me a fun fact" },
  { emoji: "🗓️", label: "Help me plan my day" },
  { emoji: "🧑‍💻", label: "Explain a coding concept" },
  { emoji: "😄", label: "Tell me a joke" },
];

export default function AIChatWindow({ onClose }) {
  const { isSidebarCollapsed, toggleSidebar } = useChatStore();
  const { aiMessages, isAILoading, sendAIMessage, clearAI, retryAfter } = useAIStore();
  const [input, setInput] = useState("");
  const inputRef  = useRef(null);
  const bottomRef = useRef(null);
  const listRef   = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [aiMessages, isAILoading]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const isBlocked = isAILoading || retryAfter > 0;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isBlocked) return;
    setInput("");
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto";
    await sendAIMessage(text);
  };

  const handleStarterClick = (label) => {
    setInput(label);
    inputRef.current?.focus();
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--bg-primary)", borderLeft: "1px solid var(--border)" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-4 h-[60px] flex-shrink-0"
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Mobile back */}
        <button
          onClick={onClose}
          className="sm:hidden flex items-center justify-center w-9 h-9 rounded-full -ml-1 transition-all active:scale-90"
          style={{ color: "var(--text-primary)" }}
        >
          <ArrowLeftIcon size={20} />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden sm:flex icon-btn"
          style={{ color: "var(--text-secondary)" }}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2"/>
            <path d="M9 3v18"/>
            {isSidebarCollapsed ? <path d="m14 9 3 3-3 3"/> : <path d="m16 15-3-3 3-3"/>}
          </svg>
        </button>

        {/* AI Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 relative"
          style={{ background: "var(--accent)" }}
        >
          <span className="text-[16px]">✦</span>
          {/* Online dot */}
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{ background: "#22c55e", borderColor: "var(--bg-secondary)" }}
          />
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
            Chatify AI
          </p>
          <p className="text-[11.5px] leading-tight" style={{ color: retryAfter > 0 ? "#f6ad55" : "var(--text-secondary)" }}>
            {retryAfter > 0 ? `⏳ Cooling down ${retryAfter}s…` : "Always online · Powered by Gemini"}
          </p>
        </div>

        {/* Actions */}
        <button
          onClick={clearAI}
          className="icon-btn"
          style={{ color: "var(--text-secondary)" }}
          title="Clear conversation"
        >
          <RefreshCwIcon size={16} />
        </button>
        <button
          onClick={onClose}
          className="hidden sm:flex icon-btn"
          style={{ color: "var(--text-secondary)" }}
          title="Close"
        >
          <XIcon size={16} />
        </button>
      </div>

      {/* ── Messages Area ── */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar"
        style={{ background: "var(--bg-primary)" }}
      >
        {/* Empty state — starter prompts */}
        {aiMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 pb-4">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-[28px] shadow-lg"
                style={{ background: "var(--accent)" }}
              >
                ✦
              </div>
              <div className="text-center">
                <p className="text-[17px] font-bold" style={{ color: "var(--text-primary)" }}>
                  Hi, I'm Chatify AI
                </p>
                <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  Ask me anything — I'm here to help
                </p>
              </div>
            </div>

            {/* Starter grid */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
              {STARTERS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleStarterClick(s.label)}
                  className="flex items-center gap-2 text-left text-[12.5px] p-3 rounded-2xl transition-all active:scale-95"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span className="text-[16px] flex-shrink-0">{s.emoji}</span>
                  <span className="leading-snug">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {aiMessages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2`}
                >
                  {/* AI avatar — only on AI messages */}
                  {!isUser && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-auto mb-1 text-[11px]"
                      style={{ background: msg.isError ? "rgba(246,173,85,0.3)" : "var(--accent)" }}
                    >
                      ✦
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className="max-w-[78%] px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap break-words shadow-sm"
                    style={{
                      background: isUser
                        ? "var(--bubble-mine)"
                        : msg.isError
                        ? "rgba(246,173,85,0.12)"
                        : "var(--bubble-theirs)",
                      color: msg.isError ? "#f6ad55" : "var(--text-primary)",
                      borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing indicator */}
          {isAILoading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start gap-2"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-auto mb-1 text-[11px]"
                style={{ background: "var(--accent)" }}
              >
                ✦
              </div>
              <div
                className="flex items-center gap-1 px-4 py-3 rounded-[18px] rounded-bl-[4px]"
                style={{ background: "var(--bubble-theirs)" }}
              >
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="w-[7px] h-[7px] rounded-full animate-bounce"
                    style={{ background: "var(--text-secondary)", animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div ref={bottomRef} />
      </div>

      {/* Rate limit banner */}
      {retryAfter > 0 && (
        <div
          className="mx-3 mb-2 px-4 py-2.5 rounded-xl flex items-center gap-3 text-[12.5px]"
          style={{
            background: "rgba(246,173,85,0.08)",
            border: "1px solid rgba(246,173,85,0.2)",
            color: "#f6ad55",
          }}
        >
          <span>⏳</span>
          <div>
            <p className="font-semibold">Rate limit — free tier is ~15 msg/min</p>
            <p className="opacity-70">Ready in <strong>{retryAfter}s</strong></p>
          </div>
        </div>
      )}

      {/* ── Input Bar ── */}
      <div
        className="px-3 py-2.5 flex-shrink-0"
        style={{
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
        }}
      >
        <div className="flex items-end gap-2">
          {/* Input pill */}
          <div
            className="flex-1 rounded-[22px] overflow-hidden"
            style={{
              background: "var(--bg-input)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="px-4 py-2.5">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder={retryAfter > 0 ? `Cooling down… ${retryAfter}s` : "Ask me anything…"}
                disabled={isBlocked}
                className="w-full bg-transparent border-none focus:outline-none resize-none text-[15px] leading-[1.5] no-scrollbar"
                style={{
                  color: isBlocked ? "var(--text-muted)" : "var(--text-primary)",
                  fontFamily: "inherit",
                  maxHeight: "120px",
                  minHeight: "24px",
                  overflowY: "auto",
                  caretColor: "var(--accent)",
                }}
              />
            </div>
          </div>

          {/* Send button */}
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || isBlocked}
            className="w-[44px] h-[44px] rounded-full flex-shrink-0 flex items-center justify-center shadow-md mb-0.5"
            animate={{
              background: !input.trim() || isBlocked ? "var(--bg-input)" : "var(--accent)",
              opacity: isBlocked ? 0.5 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            whileTap={{ scale: 0.9 }}
          >
            <Send
              size={17}
              className="ml-0.5"
              style={{ color: !input.trim() || isBlocked ? "var(--text-muted)" : "var(--bg-primary)" }}
            />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
