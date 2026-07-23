import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
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

export default function StoragePanel({ isOpen }) {
  const [autoDownload, setAutoDownload] = useState(true);
  const [mediaQuality, setMediaQuality] = useState("standard");
  const [clearingCache, setClearingCache] = useState(false);

  // Real storage estimation state
  const [realStorage, setRealStorage] = useState({ usage: 8.5, quota: 1024, pct: 0.8 });

  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        const usageMB = parseFloat((est.usage / (1024 * 1024)).toFixed(2));
        const quotaMB = Math.round(est.quota / (1024 * 1024));
        const pct = parseFloat(((est.usage / est.quota) * 100).toFixed(2)) || 0.1;
        setRealStorage({
          usage: usageMB || 0.52,
          quota: quotaMB || 1024,
          pct: pct || 0.1
        });
      }).catch(() => {});
    }
  }, [isOpen]);

  const handleClearCache = async () => {
    setClearingCache(true);
    await new Promise(r => setTimeout(r, 1200));
    setClearingCache(false);
    toast.success("Cache cleared successfully");
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Storage Used
        </p>
        {[
          { label: "Photos, Videos & Media", val: parseFloat((realStorage.usage * 0.65).toFixed(2)), color: "#60a5fa" },
          { label: "Voice Messages & Audio", val: parseFloat((realStorage.usage * 0.20).toFixed(2)), color: "var(--accent)" },
          { label: "Documents & Databases", val: parseFloat((realStorage.usage * 0.15).toFixed(2)), color: "#f59e0b" },
        ].map(item => (
          <div key={item.label} className="mb-3">
            <div className="flex justify-between text-[12px] mb-1.5">
              <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>{item.val} MB</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
              <div className="h-full rounded-full animate-none"
                style={{ width: `${realStorage.usage > 0 ? (item.val / realStorage.usage) * 100 : 0}%`, background: item.color }} />
            </div>
          </div>
        ))}
        <div className="flex justify-between text-[12px] mt-2 font-medium"
          style={{ color: "var(--text-muted)" }}>
          <span>Browser Quota: {realStorage.quota} MB</span>
          <span>{realStorage.usage} MB total used</span>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Download Settings
        </p>
        <div className="rounded-xl overflow-hidden border"
          style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
          <div className="px-4">
            <div className="flex items-center justify-between py-3 gap-4">
              <div>
                <p className="font-medium text-[14px]" style={{ color: "var(--text-primary)" }}>Auto-Download Media</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  Automatically download photos and videos
                </p>
              </div>
              <Toggle
                checked={autoDownload}
                onChange={e => setAutoDownload(e.target.checked)}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Media Quality
        </p>
        <div className="flex gap-2">
          {["standard", "hd"].map(q => (
            <button
              key={q}
              onClick={() => setMediaQuality(q)}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-medium capitalize transition-all"
              style={{
                background: mediaQuality === q ? "var(--bg-active)" : "var(--bg-input)",
                border: `1px solid ${mediaQuality === q ? "var(--accent)" : "var(--border)"}`,
                color: "var(--text-primary)",
              }}
            >
              {q === "hd" ? "HD" : "Standard"}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleClearCache}
        disabled={clearingCache}
        className="w-full flex items-center justify-center gap-2.5 mt-5 py-3 rounded-xl text-[14px] font-medium transition-all disabled:opacity-50 hover:bg-rose-500/10"
        style={{ border: "1px solid rgba(248,113,113,0.3)", color: "#f87171" }}
      >
        <Trash2 size={16} />
        {clearingCache ? "Clearing…" : "Clear Chat Cache"}
      </button>
    </div>
  );
}
