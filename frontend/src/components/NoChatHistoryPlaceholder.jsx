import { useChatStore } from "../store/useChatStore";

export default function NoChatHistoryPlaceholder({ name }) {
  const { sendMessage } = useChatStore();
  const quickSend = (text) => sendMessage({ text, image: null });

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-8 select-none">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center border shadow-sm"
        style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: "var(--text-muted)" }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="font-bold text-[16px]" style={{ color: "var(--text-primary)" }}>Start chatting with {name}</p>
        <p className="text-[13px] mt-1 font-medium" style={{ color: "var(--text-secondary)" }}>Messages are sent in real-time</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {["👋 Say Hello", "😊 How are you?", "📅 Meet up soon?"].map((msg) => (
          <button key={msg} onClick={() => quickSend(msg)}
            className="px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border transition-all hover:scale-105 active:scale-95 shadow-xs"
            style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
            {msg}
          </button>
        ))}
      </div>
    </div>
  );
}
