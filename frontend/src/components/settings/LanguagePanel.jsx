import { useState } from "react";
import { Check } from "lucide-react";
import toast from "react-hot-toast";

export default function LanguagePanel() {
  const [appLang, setAppLang] = useState("english");

  return (
    <div className="space-y-2 text-left">
      {[
        { key: "english", label: "English", native: "Device language" },
        { key: "spanish", label: "Español", native: "Spanish" },
        { key: "french", label: "Français", native: "French" },
        { key: "german", label: "Deutsch", native: "German" },
        { key: "hindi", label: "हिन्दी", native: "Hindi" },
        { key: "portuguese", label: "Português", native: "Portuguese" }
      ].map(lang => (
        <button key={lang.key} onClick={() => { setAppLang(lang.key); toast.success(`Language changed to ${lang.label}`); }}
          className="w-full flex items-center justify-between p-3.5 rounded-xl border text-left"
          style={{
            background: appLang === lang.key ? "var(--bg-active)" : "var(--bg-input)",
            borderColor: appLang === lang.key ? "var(--accent)" : "var(--border)",
            color: "var(--text-primary)"
          }}>
          <div>
            <p className="text-[14px] font-semibold text-white">{lang.label}</p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{lang.native}</p>
          </div>
          {appLang === lang.key && <Check size={16} style={{ color: "var(--accent)" }} />}
        </button>
      ))}
    </div>
  );
}
