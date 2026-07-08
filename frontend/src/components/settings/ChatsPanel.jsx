import { useState } from "react";
import { ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)] border border-[var(--border)]"
        style={{ background: checked ? undefined : "var(--bg-input)" }} />
    </label>
  );
}

export default function ChatsPanel() {
  const [enterIsSend, setEnterIsSend] = useState(true);
  const [mediaVisibility, setMediaVisibility] = useState(true);

  return (
    <div className="space-y-6 text-left">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Chat Settings
        </p>
        <div className="rounded-xl overflow-hidden px-4 border"
          style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
          <div className="flex items-center justify-between py-3 gap-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="min-w-0">
              <p className="text-white font-medium text-[14px]">Enter is Send</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Enter key sends message on keyboard
              </p>
            </div>
            <Toggle checked={enterIsSend} onChange={e => setEnterIsSend(e.target.checked)} />
          </div>

          <div className="flex items-center justify-between py-3 gap-4">
            <div className="min-w-0">
              <p className="text-white font-medium text-[14px]">Media visibility</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Show newly downloaded media in device gallery
              </p>
            </div>
            <Toggle checked={mediaVisibility} onChange={e => setMediaVisibility(e.target.checked)} />
          </div>
        </div>
      </div>

      <button onClick={() => toast.success("Select a wallpaper style from Chats interface")}
        className="w-full flex items-center justify-between p-4 rounded-xl border hover:bg-[var(--bg-hover)] transition-colors text-left"
        style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
        <span className="text-white text-[14px] font-medium">Chat Wallpaper</span>
        <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
      </button>
    </div>
  );
}
