import { useState } from "react";
import { Check } from "lucide-react";
import { useSettingsStore, THEMES } from "../../store/useSettingsStore";

export default function AppearancePanel() {
  const { activeTheme, setTheme } = useSettingsStore();
  const [fontSize, setFontSize] = useState("medium");
  const [bubbleStyle, setBubbleStyle] = useState("rounded");

  return (
    <div className="space-y-6 text-left">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Theme
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {Object.entries(THEMES).map(([key, themeObj]) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className="p-3.5 rounded-xl border transition-all flex items-center justify-between"
              style={{
                background: activeTheme === key ? "var(--bg-active)" : "var(--bg-input)",
                borderColor: activeTheme === key ? "var(--accent)" : "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <span className="flex items-center gap-2 text-[13px]">
                <span>{themeObj.emoji}</span>
                <span className="font-medium">{themeObj.name}</span>
              </span>
              {activeTheme === key && (
                <Check size={14} style={{ color: "var(--accent)" }} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Font Size
        </p>
        <div className="flex gap-2">
          {["small", "medium", "large"].map(size => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-medium capitalize transition-all"
              style={{
                background: fontSize === size ? "var(--bg-active)" : "var(--bg-input)",
                border: `1px solid ${fontSize === size ? "var(--accent)" : "var(--border)"}`,
                color: "var(--text-primary)",
              }}
            >
              {size === "small" ? "Aa" : size === "medium" ? "Aa" : "Aa"}
              <span className="block text-[10px] mt-0.5 capitalize"
                style={{ color: "var(--text-muted)", fontSize: size === "small" ? 10 : size === "large" ? 14 : 12 }}>
                {size}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Bubble Style
        </p>
        <div className="flex gap-2">
          {[
            { id: "rounded", label: "Rounded", preview: "rounded-2xl" },
            { id: "sharp", label: "Sharp", preview: "rounded-md" },
            { id: "minimal", label: "Minimal", preview: "rounded-lg" },
          ].map(style => (
            <button
              key={style.id}
              onClick={() => setBubbleStyle(style.id)}
              className="flex-1 py-3 flex flex-col items-center gap-2 transition-all"
              style={{
                background: bubbleStyle === style.id ? "var(--bg-active)" : "var(--bg-input)",
                border: `1px solid ${bubbleStyle === style.id ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 12,
                color: "var(--text-primary)",
              }}
            >
              <div className={`w-10 h-5 ${style.preview}`}
                style={{ background: "var(--accent)", opacity: 0.7 }} />
              <span className="text-[11px]">{style.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
