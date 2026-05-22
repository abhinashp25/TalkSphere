import { useState, useRef, useEffect } from "react";
import { useAIStore } from "../store/useAIStore";
import { useChatStore } from "../store/useChatStore";
import { XIcon, SparklesIcon, RefreshCwIcon, ArrowLeftIcon, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIChatWindow({ onClose }) {
  const { isSidebarCollapsed, toggleSidebar } = useChatStore();
  const { aiMessages, isAILoading, sendAIMessage, clearAI, retryAfter } = useAIStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = (smooth = false) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => { scrollToBottom(true); }, [aiMessages, isAILoading]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const isBlocked = isAILoading || retryAfter > 0;

  const handleSend = async () => {
    if (!input.trim() || isBlocked) return;
    const text = input.trim();
    setInput("");
    await sendAIMessage(text);
  };

  const STARTERS = [
    "✍️ Help me write a message",
    "💡 What can you do?",
    "🌍 Tell me a fun fact",
    "🗓️ Help me plan my day",
    "🧑‍💻 Explain a coding concept",
    "😄 Tell me a joke",
  ];

  return (
    <div className="flex flex-col h-full border-l" style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-[64px] flex-shrink-0 relative border-b" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, var(--accent) 0%, var(--bg-hover) 100%)' }} />

        {/* Mobile Back Arrow — takes user back to chats list */}
        <button
          onClick={onClose}
          className="sm:hidden flex items-center justify-center w-9 h-9 rounded-full -ml-1 mr-1 transition-all active:scale-90"
          style={{ color: 'var(--text-primary)' }}
          title="Back"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        {/* Desktop sidebar toggle */}
        <button 
          onClick={toggleSidebar} 
          className="hidden sm:flex icon-btn text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? (
            <svg className="w-[18px] h-[18px] transition-transform duration-300 hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2"/>
              <path d="M9 3v18"/>
              <path d="m14 9 3 3-3 3"/>
            </svg>
          ) : (
            <svg className="w-[18px] h-[18px] transition-transform duration-300 hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2"/>
              <path d="M9 3v18"/>
              <path d="m16 15-3-3 3-3"/>
            </svg>
          )}
        </button>

        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--bg-panel) 0%, var(--bg-secondary) 100%)', boxShadow: '0 4px 16px rgba(0, 168, 132, 0.15)', border: '1px solid var(--border)' }}>
          <img src="/ai-avatar.png" alt="Chatify AI" className="w-9 h-9 object-contain" style={{ filter: 'drop-shadow(0 1px 4px rgba(0,168,132,0.3))' }} />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px]"
            style={{ background: 'var(--accent)', border: '1.5px solid var(--bg-primary)', color: 'var(--bg-primary)' }}>✦</span>
        </div>

        <div className="flex-1">
          <p className="text-[15px] font-bold text-white">Chatify AI</p>
          <p className="text-[11px]" style={{ color: retryAfter > 0 ? '#f6ad55' : 'var(--text-secondary)' }}>
            {retryAfter > 0 ? `⏳ Cooling down ${retryAfter}s…` : "Always online · Powered by Gemini AI"}
          </p>
        </div>

        {retryAfter > 0 && (
          <div className="px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ background: 'rgba(246,173,85,0.15)', border: '1px solid rgba(246,173,85,0.3)', color: '#f6ad55' }}>
            {retryAfter}s
          </div>
        )}

        <button onClick={clearAI} className="icon-btn" title="New chat">
          <RefreshCwIcon className="w-4 h-4" />
        </button>
        {/* Close button — desktop only */}
        <button onClick={onClose} className="hidden sm:flex icon-btn" title="Close">
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        {aiMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-active)', border: '1px solid var(--border)' }}>
              <SparklesIcon className="w-9 h-9" style={{ color: 'var(--accent)' }} />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Hi! I'm Chatify AI</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Ask me anything — I'm here to help</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
              {STARTERS.map((s) => (
                <button 
                  key={s} 
                  onClick={() => { setInput(s.replace(/^[^\s]+\s/, "")); inputRef.current?.focus(); }}
                  className="text-left text-[12.5px] p-3 rounded-xl transition-all hover:scale-[1.02] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border active:scale-95 duration-200"
                  style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {aiMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                style={{ background: msg.isError ? 'rgba(246,173,85,0.3)' : 'var(--accent)' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" style={{ color: msg.isError ? 'orange' : 'var(--bg-primary)' }}>
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
            )}
            <div className="max-w-[80%] px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap border shadow-sm"
              style={{
                background: msg.role === "user" ? 'var(--bubble-mine)' 
                  : msg.isError ? 'rgba(246,173,85,0.15)'
                  : 'var(--bubble-theirs)',
                color: msg.isError ? '#f6ad55' : 'var(--text-primary)',
                borderColor: msg.isError ? 'rgba(246,173,85,0.2)' : 'var(--border)',
                borderRadius: msg.role === "user" ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
              }}>
              {msg.content}
            </div>
          </div>
        ))}

        {isAILoading && (
          <div className="flex justify-start gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'var(--accent)' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--bg-primary)' }}>
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm border"
              style={{ background: 'var(--bg-panel)', borderColor: 'var(--border)' }}>
              {[0, 150, 300].map((d) => (
                <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: 'var(--accent)', animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Rate limit banner */}
      {retryAfter > 0 && (
        <div className="mx-4 mb-2 px-4 py-2.5 rounded-xl flex items-center gap-3 text-[13px]"
          style={{ background: 'rgba(246,173,85,0.08)', border: '1px solid rgba(246,173,85,0.2)', color: '#f6ad55' }}>
          <span className="text-lg">⏳</span>
          <div>
            <p className="font-semibold">Rate limit reached — free tier is ~15 msg/min</p>
            <p className="text-[11px] opacity-70">Ready again in <strong>{retryAfter}s</strong>. Consider upgrading your Gemini API plan.</p>
          </div>
        </div>
      )}

      {/* ── Premium Input Bar ──────────────────────────────────── */}
      <div
        className="px-3 py-2.5 flex-shrink-0 border-t"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
        }}
      >
        <div className="flex items-end gap-2.5">
          {/* Input Pill */}
          <div
            className="flex-1 rounded-[22px] overflow-hidden transition-all"
            style={{
              background: "var(--bg-input)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }}
          >
            <div className="px-4 py-3">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // auto-grow
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={retryAfter > 0 ? `Cooling down… ${retryAfter}s` : "Ask me anything…"}
                disabled={isBlocked}
                className="w-full bg-transparent border-none focus:outline-none resize-none text-[15px] leading-[1.5] no-scrollbar"
                style={{
                  color: isBlocked ? 'var(--text-muted)' : 'var(--text-primary)',
                  fontFamily: 'inherit',
                  maxHeight: '120px',
                  minHeight: '24px',
                  overflowY: 'auto',
                  caretColor: 'var(--accent)',
                }}
              />
            </div>
          </div>

          {/* Send FAB */}
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || isBlocked}
            className="w-[46px] h-[46px] rounded-full flex-shrink-0 flex items-center justify-center shadow-lg"
            animate={{
              background: !input.trim() || isBlocked ? 'var(--bg-input)' : 'var(--accent)',
              opacity: isBlocked ? 0.5 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            whileTap={{ scale: 0.88 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={input.trim() ? "active" : "idle"}
                initial={{ rotate: -20, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 20, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex items-center justify-center"
              >
                <Send
                  size={18}
                  className="ml-0.5"
                  style={{ color: !input.trim() || isBlocked ? 'var(--text-muted)' : 'var(--bg-primary)' }}
                />
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
