import { Check } from "lucide-react";
import toast from "react-hot-toast";
import { useSettingsStore } from "../../store/useSettingsStore";

export default function LanguagePanel() {
  const { appLanguage, setAppLanguage } = useSettingsStore();

  const handleLangSelect = (key, label) => {
    setAppLanguage(key);
    toast.success(`Language set to ${label}`, { icon: "🌐" });
  };

  const languages = [
    { key: "odia",       label: "ଓଡ଼ିଆ (Odia)",       native: "Odia - Odisha, India" },
    { key: "english",    label: "English",           native: "English (Default)" },
    { key: "hindi",      label: "हिन्दी (Hindi)",     native: "Hindi" },
    { key: "bengali",    label: "বাংলা (Bengali)",   native: "Bengali" },
    { key: "spanish",    label: "Español",           native: "Spanish" },
    { key: "french",     label: "Français",          native: "French" },
    { key: "german",     label: "Deutsch",           native: "German" },
    { key: "portuguese", label: "Português",         native: "Portuguese" },
    { key: "japanese",   label: "日本語 (Japanese)", native: "Japanese" },
    { key: "arabic",     label: "العربية (Arabic)",  native: "Arabic" },
    { key: "chinese",    label: "中文 (Chinese)",    native: "Mandarin Chinese" },
    { key: "russian",    label: "Русский (Russian)",  native: "Russian" },
  ];

  return (
    <div className="space-y-2 text-left max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
      {languages.map(lang => (
        <button
          key={lang.key}
          onClick={() => handleLangSelect(lang.key, lang.label)}
          className="w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all hover:opacity-95"
          style={{
            background: appLanguage === lang.key ? "var(--bg-active)" : "var(--bg-input)",
            borderColor: appLanguage === lang.key ? "var(--accent)" : "var(--border)",
            color: "var(--text-primary)"
          }}
        >
          <div>
            <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>{lang.label}</p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{lang.native}</p>
          </div>
          {appLanguage === lang.key && <Check size={16} style={{ color: "var(--accent)" }} />}
        </button>
      ))}
    </div>
  );
}
