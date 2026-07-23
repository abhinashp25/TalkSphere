import { useState } from "react";
import { Check } from "lucide-react";
import { useSettingsStore, THEMES } from "../../store/useSettingsStore";

export default function AppearancePanel() {
  const {
    activeTheme, setTheme, fontSize, setFontSize,
    bubbleStyle, setBubbleStyle, chatTextColor, setChatTextColor
  } = useSettingsStore();

  const colorOptions = [
    { id: "default", label: "Default", color: "var(--text-primary)" },
    { id: "cyan",    label: "Cyber Cyan", color: "#00f3ff" },
    { id: "emerald", label: "Emerald", color: "#10b981" },
    { id: "amber",   label: "Amber", color: "#f59e0b" },
    { id: "rose",    label: "Rose Pink", color: "#f43f5e" },
    { id: "purple",  label: "Violet", color: "#c084fc" },
  ];

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
              <span className="block text-[14px] font-bold">Aa</span>
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
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { id: "liquid", label: "Liquid Glass", preview: "rounded-[24px] backdrop-blur-md shadow-lg border border-white/20" },
            { id: "rounded", label: "Rounded Capsule", preview: "rounded-2xl" },
            { id: "sharp", label: "Sharp Modern", preview: "rounded-md" },
            { id: "minimal", label: "Minimalist", preview: "rounded-lg" },
          ].map(style => (
            <button
              key={style.id}
              onClick={() => setBubbleStyle(style.id)}
              className="py-3 px-2 flex flex-col items-center gap-2 transition-all border"
              style={{
                background: bubbleStyle === style.id ? "var(--bg-active)" : "var(--bg-input)",
                borderColor: bubbleStyle === style.id ? "var(--accent)" : "var(--border)",
                borderRadius: 12,
                color: "var(--text-primary)",
              }}
            >
              <div className={`w-12 h-6 ${style.preview}`}
                style={{ background: "var(--accent)", opacity: 0.85 }} />
              <span className="text-[11.5px] font-medium">{style.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Chat Text Color
        </p>
        <div className="grid grid-cols-3 gap-2">
          {colorOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setChatTextColor(opt.id)}
              className="p-2.5 rounded-xl border flex items-center gap-2 text-[12px] font-medium transition-all"
              style={{
                background: chatTextColor === opt.id ? "var(--bg-active)" : "var(--bg-input)",
                borderColor: chatTextColor === opt.id ? "var(--accent)" : "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <span className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/20" style={{ background: opt.color }} />
              <span className="truncate">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
