import { create } from "zustand";

export const THEMES = {
  default: {
    name: "Midnight",
    emoji: "🌑",
    vars: {
      "--bg-primary":    "#050508",
      "--bg-secondary":  "#0c0d14",
      "--bg-panel":      "#11121d",
      "--bg-header":     "#161726",
      "--bg-input":      "#0d0d12",
      "--bg-hover":      "rgba(255,255,255,0.05)",
      "--bg-active":     "rgba(0,168,132,0.10)",
      "--accent":        "#00a884",
      "--accent-dim":    "rgba(0,168,132,0.15)",
      "--bubble-mine":   "#005c4b",
      "--bubble-theirs": "#202c33",
      "--text-primary":  "#e9edef",
      "--text-secondary":"#8696a0",
      "--text-muted":    "#667781",
      "--border":        "rgba(255,255,255,0.08)",
    },
  },
  ocean: {
    name: "Deep Ocean",
    emoji: "🌊",
    vars: {
      "--bg-primary":    "#0a0f1e",
      "--bg-secondary":  "#0d1630",
      "--bg-panel":      "#111d3a",
      "--bg-header":     "#162347",
      "--bg-input":      "#1a2c58",
      "--bg-hover":      "rgba(99,179,237,0.06)",
      "--bg-active":     "rgba(99,179,237,0.12)",
      "--accent":        "#63b3ed",
      "--accent-dim":    "rgba(99,179,237,0.15)",
      "--bubble-mine":   "#1a3a5c",
      "--bubble-theirs": "#0f1e3a",
      "--text-primary":  "#e2ecf9",
      "--text-secondary":"#7da8c8",
      "--text-muted":    "#3a5472",
      "--border":        "rgba(99,179,237,0.08)",
    },
  },
  forest: {
    name: "Forest",
    emoji: "🌲",
    vars: {
      "--bg-primary":    "#0b1512",
      "--bg-secondary":  "#101e18",
      "--bg-panel":      "#152619",
      "--bg-header":     "#1a2e1e",
      "--bg-input":      "#1f3825",
      "--bg-hover":      "rgba(72,187,120,0.06)",
      "--bg-active":     "rgba(72,187,120,0.12)",
      "--accent":        "#68d391",
      "--accent-dim":    "rgba(72,187,120,0.15)",
      "--bubble-mine":   "#1a3d24",
      "--bubble-theirs": "#122018",
      "--text-primary":  "#e2f0e8",
      "--text-secondary":"#7aab8a",
      "--text-muted":    "#3a5c44",
      "--border":        "rgba(72,187,120,0.08)",
    },
  },
  sunset: {
    name: "Sunset",
    emoji: "🌅",
    vars: {
      "--bg-primary":    "#1a0f0a",
      "--bg-secondary":  "#261510",
      "--bg-panel":      "#301b14",
      "--bg-header":     "#3a2118",
      "--bg-input":      "#472820",
      "--bg-hover":      "rgba(246,135,85,0.06)",
      "--bg-active":     "rgba(246,135,85,0.12)",
      "--accent":        "#f6875a",
      "--accent-dim":    "rgba(246,135,85,0.15)",
      "--bubble-mine":   "#4a2010",
      "--bubble-theirs": "#2a1810",
      "--text-primary":  "#f2e0d8",
      "--text-secondary":"#c47d5a",
      "--text-muted":    "#6a3a26",
      "--border":        "rgba(246,135,85,0.08)",
    },
  },
  purple: {
    name: "Galaxy",
    emoji: "🔮",
    vars: {
      "--bg-primary":    "#0e0b1a",
      "--bg-secondary":  "#130f24",
      "--bg-panel":      "#1a152e",
      "--bg-header":     "#211a38",
      "--bg-input":      "#2a2245",
      "--bg-hover":      "rgba(159,122,234,0.06)",
      "--bg-active":     "rgba(159,122,234,0.12)",
      "--accent":        "#9f7aea",
      "--accent-dim":    "rgba(159,122,234,0.15)",
      "--bubble-mine":   "#2d1f5e",
      "--bubble-theirs": "#1a1530",
      "--text-primary":  "#ede8f9",
      "--text-secondary":"#9070c4",
      "--text-muted":    "#4a3672",
      "--border":        "rgba(159,122,234,0.08)",
    },
  },
  rose: {
    name: "Rose",
    emoji: "🌸",
    vars: {
      "--bg-primary":    "#1a0d12",
      "--bg-secondary":  "#241018",
      "--bg-panel":      "#2e1520",
      "--bg-header":     "#391a28",
      "--bg-input":      "#452030",
      "--bg-hover":      "rgba(245,101,136,0.06)",
      "--bg-active":     "rgba(245,101,136,0.12)",
      "--accent":        "#f56588",
      "--accent-dim":    "rgba(245,101,136,0.15)",
      "--bubble-mine":   "#4a1a2e",
      "--bubble-theirs": "#2a1020",
      "--text-primary":  "#f5e0e8",
      "--text-secondary":"#c46080",
      "--text-muted":    "#6a3048",
      "--border":        "rgba(245,101,136,0.08)",
    },
  },
  arctic: {
    name: "Arctic",
    emoji: "🧊",
    vars: {
      "--bg-primary":    "#0c1419",
      "--bg-secondary":  "#101c24",
      "--bg-panel":      "#15242e",
      "--bg-header":     "#1a2c38",
      "--bg-input":      "#1f3545",
      "--bg-hover":      "rgba(118,224,244,0.05)",
      "--bg-active":     "rgba(118,224,244,0.10)",
      "--accent":        "#76e0f4",
      "--accent-dim":    "rgba(118,224,244,0.15)",
      "--bubble-mine":   "#1a3d4a",
      "--bubble-theirs": "#12242e",
      "--text-primary":  "#e0f2f8",
      "--text-secondary":"#6aabbc",
      "--text-muted":    "#365e6a",
      "--border":        "rgba(118,224,244,0.07)",
    },
  },
  mono: {
    name: "Monochrome",
    emoji: "⬛",
    vars: {
      "--bg-primary":    "#0a0a0a",
      "--bg-secondary":  "#111111",
      "--bg-panel":      "#1a1a1a",
      "--bg-header":     "#202020",
      "--bg-input":      "#2a2a2a",
      "--bg-hover":      "rgba(255,255,255,0.04)",
      "--bg-active":     "rgba(255,255,255,0.08)",
      "--accent":        "#e0e0e0",
      "--accent-dim":    "rgba(224,224,224,0.12)",
      "--bubble-mine":   "#303030",
      "--bubble-theirs": "#1e1e1e",
      "--text-primary":  "#f0f0f0",
      "--text-secondary":"#888888",
      "--text-muted":    "#404040",
      "--border":        "rgba(255,255,255,0.06)",
    },
  },
  oled: {
    name: "OLED True Black",
    emoji: "🖤",
    vars: {
      "--bg-primary":    "#000000",
      "--bg-secondary":  "#050505",
      "--bg-panel":      "#0a0a0a",
      "--bg-header":     "#0f0f0f",
      "--bg-input":      "#121212",
      "--bg-hover":      "rgba(255,255,255,0.05)",
      "--bg-active":     "rgba(0,230,153,0.12)",
      "--accent":        "#00e699",
      "--accent-dim":    "rgba(0,230,153,0.15)",
      "--bubble-mine":   "#004d33",
      "--bubble-theirs": "#171717",
      "--text-primary":  "#ffffff",
      "--text-secondary":"#a0a0a0",
      "--text-muted":    "#666666",
      "--border":        "rgba(255,255,255,0.10)",
    },
  },
  light: {
    name: "Pro Light",
    emoji: "☀️",
    vars: {
      "--bg-primary":    "#f8fafc",
      "--bg-secondary":  "#ffffff",
      "--bg-panel":      "#f1f5f9",
      "--bg-header":     "#ffffff",
      "--bg-input":      "#e2e8f0",
      "--bg-hover":      "rgba(37,99,235,0.06)",
      "--bg-active":     "rgba(37,99,235,0.12)",
      "--accent":        "#2563eb",
      "--accent-dim":    "rgba(37,99,235,0.15)",
      "--bubble-mine":   "#2563eb",
      "--bubble-theirs": "#e2e8f0",
      "--text-primary":  "#0f172a",
      "--text-secondary":"#475569",
      "--text-muted":    "#94a3b8",
      "--border":        "rgba(0,0,0,0.08)",
    },
  },
  cyberpunk: {
    name: "Cyberpunk Neon",
    emoji: "⚡",
    vars: {
      "--bg-primary":    "#060713",
      "--bg-secondary":  "#0b0d21",
      "--bg-panel":      "#101330",
      "--bg-header":     "#161a42",
      "--bg-input":      "#1e2359",
      "--bg-hover":      "rgba(0,243,255,0.08)",
      "--bg-active":     "rgba(0,243,255,0.16)",
      "--accent":        "#00f3ff",
      "--accent-dim":    "rgba(0,243,255,0.20)",
      "--bubble-mine":   "#240046",
      "--bubble-theirs": "#101330",
      "--text-primary":  "#f0fbff",
      "--text-secondary":"#70bbfd",
      "--text-muted":    "#38669e",
      "--border":        "rgba(0,243,255,0.15)",
    },
  },
  emerald: {
    name: "Emerald Luxury",
    emoji: "💎",
    vars: {
      "--bg-primary":    "#04120e",
      "--bg-secondary":  "#091c16",
      "--bg-panel":      "#0e261f",
      "--bg-header":     "#13332a",
      "--bg-input":      "#1a4237",
      "--bg-hover":      "rgba(16,185,129,0.08)",
      "--bg-active":     "rgba(16,185,129,0.16)",
      "--accent":        "#10b981",
      "--accent-dim":    "rgba(16,185,129,0.20)",
      "--bubble-mine":   "#065f46",
      "--bubble-theirs": "#0e261f",
      "--text-primary":  "#ecfdf5",
      "--text-secondary":"#6ee7b7",
      "--text-muted":    "#34d399",
      "--border":        "rgba(16,185,129,0.12)",
    },
  },
};

export const useSettingsStore = create((set, get) => ({
  activeTheme: localStorage.getItem("talksphere-theme") || localStorage.getItem("chatify-theme") || "default",
  fontSize:    localStorage.getItem("talksphere-fontsize") || localStorage.getItem("chatify-fontsize") || "medium",
  bubbleStyle: localStorage.getItem("talksphere-bubblestyle") || "liquid",
  chatTextColor: localStorage.getItem("talksphere-chat-textcolor") || "default",
  appLanguage: localStorage.getItem("talksphere-lang") || "english",
  enterToSend: JSON.parse(localStorage.getItem("talksphere-enter") ?? localStorage.getItem("chatify-enter") ?? "true"),

  setTheme: (themeKey) => {
    const theme = THEMES[themeKey];
    if (!theme) return;
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([key, val]) => root.style.setProperty(key, val));
    localStorage.setItem("talksphere-theme", themeKey);
    set({ activeTheme: themeKey });
  },

  setFontSize: (size) => {
    const map = { small: "14px", medium: "16px", large: "18px" };
    document.documentElement.style.fontSize = map[size] || "16px";
    localStorage.setItem("talksphere-fontsize", size);
    set({ fontSize: size });
  },

  setBubbleStyle: (styleKey) => {
    const radiusMap = {
      liquid: "24px",
      rounded: "18px",
      sharp: "6px",
      minimal: "12px",
    };
    document.documentElement.style.setProperty("--bubble-radius", radiusMap[styleKey] || "18px");
    localStorage.setItem("talksphere-bubblestyle", styleKey);
    set({ bubbleStyle: styleKey });
  },

  setChatTextColor: (colorKey) => {
    const colorMap = {
      default: "",
      cyan: "#00f3ff",
      emerald: "#10b981",
      amber: "#f59e0b",
      rose: "#f43f5e",
      purple: "#c084fc",
    };
    const root = document.documentElement;
    if (colorMap[colorKey]) {
      root.style.setProperty("--chat-font-color", colorMap[colorKey]);
    } else {
      root.style.removeProperty("--chat-font-color");
    }
    localStorage.setItem("talksphere-chat-textcolor", colorKey);
    set({ chatTextColor: colorKey });
  },

  setAppLanguage: (langKey) => {
    localStorage.setItem("talksphere-lang", langKey);
    localStorage.setItem("chatify-lang", langKey);
    set({ appLanguage: langKey });
  },

  setEnterToSend: (v) => {
    localStorage.setItem("talksphere-enter", v);
    set({ enterToSend: v });
  },

  applyStoredTheme: () => {
    const key = localStorage.getItem("talksphere-theme") || localStorage.getItem("chatify-theme") || "default";
    get().setTheme(key);
    const size = localStorage.getItem("talksphere-fontsize") || localStorage.getItem("chatify-fontsize") || "medium";
    get().setFontSize(size);
    const bStyle = localStorage.getItem("talksphere-bubblestyle") || "liquid";
    get().setBubbleStyle(bStyle);
    const chatCol = localStorage.getItem("talksphere-chat-textcolor") || "default";
    get().setChatTextColor(chatCol);
    const lang = localStorage.getItem("talksphere-lang") || "english";
    get().setAppLanguage(lang);
  },
}));
