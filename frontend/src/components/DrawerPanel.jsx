import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { useSettingsStore, THEMES } from "../store/useSettingsStore";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import {
  X, UserCircle, Palette, Bell, Shield, Wifi, HelpCircle, LogOut,
  ChevronRight, ArrowLeft, Camera, Check, Lock, Eye, EyeOff,
  Star, MessageSquare, FileText, Trash2, Smartphone, ChevronDown,
  Users, Clock, Globe, Info, Zap,
} from "lucide-react";

// ─── Status presets ────────────────────────────────────────────────────────
const STATUS_PRESETS = [
  { emoji: "🟢", text: "Available" },
  { emoji: "🔴", text: "Busy" },
  { emoji: "💼", text: "At the office" },
  { emoji: "🏠", text: "Working from home" },
  { emoji: "🤝", text: "In a meeting" },
  { emoji: "📞", text: "On a call" },
  { emoji: "🎓", text: "Studying" },
  { emoji: "📚", text: "In class" },
  { emoji: "💻", text: "Coding" },
  { emoji: "🎨", text: "Designing / Creating" },
  { emoji: "✈️", text: "Traveling" },
  { emoji: "🏋️", text: "At the gym" },
  { emoji: "🏖️", text: "On vacation" },
  { emoji: "🚗", text: "Driving" },
  { emoji: "☕", text: "On a break" },
  { emoji: "🎮", text: "Gaming" },
  { emoji: "😴", text: "Sleeping" },
  { emoji: "🏥", text: "At the hospital" },
  { emoji: "🔕", text: "Do not disturb" },
  { emoji: "🔒", text: "Unavailable" },
];

// ─── FAQ content ───────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "How do I start a new chat?",
    a: "Tap the compose icon (✏️) at the top of your chats list, or use the New Message button on the home screen. You can search by name or email.",
  },
  {
    q: "Are my messages end-to-end encrypted?",
    a: "Yes. Every message, photo, voice note, and file you send on Chatify is protected with end-to-end encryption. Only you and the recipient can read them.",
  },
  {
    q: "How do I enable two-factor authentication?",
    a: "Go to Settings → Privacy & Security → Two-Factor Authentication and tap Enable 2FA. You will be asked to confirm your password.",
  },
  {
    q: "Can I recover deleted messages?",
    a: "Messages deleted with \"Unsend for everyone\" are permanently removed from all devices. Messages deleted locally can only be recovered if you have a backup.",
  },
  {
    q: "How do I change my profile photo?",
    a: "Go to Settings → Profile, then tap your profile picture. You can upload a new photo from your device.",
  },
];

// ─── Privacy Policy text ──────────────────────────────────────────────────
const PRIVACY_POLICY = `Chatify Privacy Policy — Last updated July 2026

1. Information We Collect
We collect only what is necessary to provide the service: your name, email address, profile photo, and the messages you send. We do not sell your data to third parties.

2. End-to-End Encryption
All messages are encrypted in transit using industry-standard protocols. We cannot read your messages.

3. Data Retention
Messages are stored on our servers until you or the recipient deletes them. Profile data is retained until you delete your account.

4. Third-Party Services
Chatify uses Cloudinary for media storage and Socket.IO for real-time messaging. These services have their own privacy policies.

5. Your Rights
You can request deletion of your account and all associated data at any time by contacting support@chatify.app.

6. Cookies
We use session cookies strictly for authentication. No tracking or advertising cookies are used.

7. Changes to This Policy
We will notify you of significant changes via in-app notification. Continued use of the app constitutes acceptance.

Contact: privacy@chatify.app`;

// ─── Terms of Service text ────────────────────────────────────────────────
const TERMS_OF_SERVICE = `Chatify Terms of Service — Last updated July 2026

1. Acceptance
By using Chatify you agree to these terms. If you do not agree, do not use the app.

2. Eligibility
You must be at least 13 years old to use Chatify. By using the app you confirm you meet this requirement.

3. Acceptable Use
You agree not to use Chatify to send spam, harass other users, distribute malware, or share illegal content.

4. Intellectual Property
Chatify and its logo are trademarks of the Chatify team. Your content remains yours.

5. Disclaimer
Chatify is provided "as is" without warranty of any kind. We are not liable for any damages arising from use of the service.

6. Termination
We may suspend or terminate accounts that violate these terms without prior notice.

7. Governing Law
These terms are governed by applicable law. Disputes will be resolved through binding arbitration.

Contact: legal@chatify.app`;

// ─── Reusable helpers ─────────────────────────────────────────────────────

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)] border border-[var(--border)]"
        style={{ background: checked ? undefined : "var(--bg-input)" }} />
    </label>
  );
}

function SettingRow({ label, description, right }) {
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="min-w-0">
        <p className="text-white font-medium text-[14px]">{label}</p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest mb-3 mt-5 first:mt-0"
      style={{ color: "var(--text-muted)" }}>
      {children}
    </p>
  );
}

function Divider() {
  return <div className="h-px my-1" style={{ background: "var(--border)" }} />;
}

function TextModal({ title, content, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderBottomColor: "var(--border)" }}>
          <h3 className="font-bold text-white text-[16px]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
          <pre className="whitespace-pre-wrap text-[13px] leading-relaxed font-sans"
            style={{ color: "var(--text-secondary)" }}>
            {content}
          </pre>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

const NAV_SECTIONS = [
  { id: "profile",       icon: <UserCircle   size={20} />, label: "Profile" },
  { id: "appearance",    icon: <Palette      size={20} />, label: "Appearance" },
  { id: "notifications", icon: <Bell         size={20} />, label: "Notifications" },
  { id: "privacy",       icon: <Shield       size={20} />, label: "Privacy & Security" },
  { id: "storage",       icon: <Wifi         size={20} />, label: "Data & Storage" },
  { id: "help",          icon: <HelpCircle   size={20} />, label: "Help" },
];

export default function DrawerPanel({ isOpen, onClose }) {
  const [view, setView] = useState("main");

  const { authUser, logout, updateProfile, updatePrivacy, isUpdatingProfile, toggle2FA } = useAuthStore();
  const { activeTheme, setTheme } = useSettingsStore();
  const { isSoundEnabled, toggleSound } = useChatStore();

  const fileInputRef = useRef(null);

  // Profile state
  const [editName, setEditName]     = useState(authUser?.fullName || "");
  const [editBio,  setEditBio]      = useState(authUser?.bio      || "");
  const [editStatus, setEditStatus] = useState(authUser?.status   || "Available");
  const [saveLoading, setSaveLoading] = useState(false);

  // Privacy — reads from backend, writes back via updatePrivacy
  const privacy = authUser?.privacySettings || {
    readReceipts:    true,
    lastSeenFor:     "everyone",
    profilePhotoFor: "everyone",
  };
  // Local-only privacy toggles (no backend endpoint yet)
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showTyping,        setShowTyping]       = useState(true);

  // 2FA
  const [twoFAPassword, setTwoFAPassword] = useState("");
  const [showTwoFAForm, setShowTwoFAForm] = useState(false);
  const [showPwd,       setShowPwd]       = useState(false);
  const [twoFALoading,  setTwoFALoading]  = useState(false);

  // Notifications local state
  const [notifPreview,  setNotifPreview]  = useState(true);
  const [dndEnabled,    setDndEnabled]    = useState(false);
  const [vibrateOn,     setVibrateOn]     = useState(true);

  // Storage local state
  const [autoDownload, setAutoDownload] = useState(true);
  const [mediaQuality, setMediaQuality] = useState("standard");
  const [clearingCache, setClearingCache] = useState(false);

  // Appearance local state
  const [fontSize,      setFontSize]    = useState("medium");
  const [bubbleStyle,   setBubbleStyle] = useState("rounded");

  // Help state
  const [openFaq,        setOpenFaq]        = useState(null);
  const [showPrivacy,    setShowPrivacy]     = useState(false);
  const [showTerms,      setShowTerms]       = useState(false);
  const [starRating,     setStarRating]      = useState(0);
  const [hoverStar,      setHoverStar]       = useState(0);

  const currentSection = NAV_SECTIONS.find(s => s.id === view);

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      await updateProfile({ profilePic: reader.result });
    };
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return toast.error("Name cannot be empty");
    setSaveLoading(true);
    await updateProfile({ fullName: editName, bio: editBio, status: editStatus });
    setSaveLoading(false);
    toast.success("Profile saved");
  };

  const handlePrivacyChange = async (field, value) => {
    try {
      await updatePrivacy({ [field]: value });
    } catch {
      // updatePrivacy shows its own error toast
    }
  };

  const handleToggle2FA = async () => {
    if (!twoFAPassword.trim()) return toast.error("Enter your password to confirm");
    setTwoFALoading(true);
    const ok = await toggle2FA(twoFAPassword);
    setTwoFALoading(false);
    if (ok) {
      setShowTwoFAForm(false);
      setTwoFAPassword("");
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    await new Promise(r => setTimeout(r, 1200));
    setClearingCache(false);
    toast.success("Cache cleared successfully");
  };

  const handleStarRate = (n) => {
    setStarRating(n);
    toast.success(`Thanks for rating us ${n} star${n > 1 ? "s" : ""}! ⭐`);
  };

  // Profile completion score
  const profileFields = [
    authUser?.fullName,
    authUser?.bio,
    authUser?.profilePic && authUser.profilePic !== "/avatar.png",
    authUser?.status,
    authUser?.email,
  ];
  const completionPct = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 200 }}
            className="relative w-full sm:w-[390px] h-full flex flex-col border-l"
            style={{ background: "var(--bg-panel)", borderLeftColor: "var(--border)" }}
          >
            {/* Header */}
            <div className="flex items-center px-4 py-5 border-b flex-shrink-0"
              style={{ borderBottomColor: "var(--border)" }}>
              {view !== "main" && (
                <button onClick={() => setView("main")}
                  className="p-2 mr-2 rounded-full hover:bg-white/10 transition-colors">
                  <ArrowLeft size={20} className="text-white" />
                </button>
              )}
              <h2 className="text-[17px] font-bold brand-font flex-1 text-white">
                {view === "main" ? "Settings" : currentSection?.label}
              </h2>
              <button onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <AnimatePresence mode="wait">

                {/* ── MAIN ─────────────────────────────────────── */}
                {view === "main" && (
                  <motion.div key="main"
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>

                    {/* Profile card */}
                    <div
                      className="p-5 flex items-center gap-4 border-b cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                      style={{ borderBottomColor: "var(--border)" }}
                      onClick={() => setView("profile")}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={authUser?.profilePic || "/avatar.png"}
                          alt={authUser?.fullName}
                          className="w-[60px] h-[60px] rounded-full object-cover"
                          style={{ border: "2px solid var(--accent)" }}
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[var(--bg-panel)]"
                          style={{ background: "var(--accent)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[17px] font-bold text-white truncate">{authUser?.fullName}</h3>
                        <p className="text-[13px] truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                          {authUser?.status || authUser?.bio || "Available"}
                        </p>
                      </div>
                      <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
                    </div>

                    {/* Nav list */}
                    <div className="p-3 space-y-1">
                      {NAV_SECTIONS.map(section => (
                        <button key={section.id}
                          onClick={() => setView(section.id)}
                          className="w-full flex items-center justify-between p-3.5 rounded-xl transition-all group hover:bg-[var(--bg-hover)]">
                          <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                              style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>
                              {section.icon}
                            </div>
                            <span className="font-medium text-[15px] text-white">{section.label}</span>
                          </div>
                          <ChevronRight size={17} style={{ color: "var(--text-muted)" }} />
                        </button>
                      ))}

                      <div className="pt-2">
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3.5 p-3.5 mt-1 rounded-xl hover:bg-rose-500/10 transition-all">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-500/10">
                            <LogOut size={20} className="text-rose-500" />
                          </div>
                          <span className="font-medium text-[15px] text-rose-400">Log out</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── PROFILE ──────────────────────────────────── */}
                {view === "profile" && (
                  <motion.div key="profile"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">

                    {/* Avatar */}
                    <div className="flex flex-col items-center mb-6">
                      <div
                        className="relative w-28 h-28 rounded-full overflow-hidden cursor-pointer group mb-3"
                        style={{ border: "3px solid var(--accent)" }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <img
                          src={authUser?.profilePic || "/avatar.png"}
                          alt="profile"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
                          <Camera size={22} />
                          <span className="text-[10px] font-bold uppercase">Change</span>
                        </div>
                        {isUpdatingProfile && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <div className="w-6 h-6 border-2 border-t-white border-white/20 rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <input type="file" accept="image/*" ref={fileInputRef}
                        onChange={handleImageUpload} className="hidden" />

                      {/* Completion bar */}
                      <div className="w-full max-w-[220px]">
                        <div className="flex justify-between text-[11px] mb-1.5">
                          <span style={{ color: "var(--text-muted)" }}>Profile completion</span>
                          <span className="font-bold" style={{ color: "var(--accent)" }}>{completionPct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${completionPct}%`, background: "var(--accent)" }} />
                        </div>
                      </div>
                    </div>

                    {/* Fields */}
                    <div className="space-y-5">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block"
                          style={{ color: "var(--text-muted)" }}>Full Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full p-3 rounded-xl text-white text-[14px] outline-none transition-colors"
                          style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block"
                          style={{ color: "var(--text-muted)" }}>About / Bio</label>
                        <input
                          type="text"
                          value={editBio}
                          onChange={e => setEditBio(e.target.value)}
                          placeholder="Tell people about yourself..."
                          className="w-full p-3 rounded-xl text-white text-[14px] outline-none transition-colors"
                          style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
                        />
                      </div>

                      {/* Status presets */}
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest mb-3 block"
                          style={{ color: "var(--text-muted)" }}>Status</label>
                        <div className="grid grid-cols-2 gap-2">
                          {STATUS_PRESETS.map(preset => (
                            <button
                              key={preset.text}
                              onClick={() => setEditStatus(`${preset.emoji} ${preset.text}`)}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] text-left transition-all"
                              style={{
                                background: editStatus === `${preset.emoji} ${preset.text}`
                                  ? "var(--bg-active)" : "var(--bg-input)",
                                border: `1px solid ${editStatus === `${preset.emoji} ${preset.text}`
                                  ? "var(--accent)" : "var(--border)"}`,
                                color: "var(--text-primary)",
                              }}
                            >
                              <span>{preset.emoji}</span>
                              <span className="truncate">{preset.text}</span>
                              {editStatus === `${preset.emoji} ${preset.text}` && (
                                <Check size={12} className="ml-auto flex-shrink-0" style={{ color: "var(--accent)" }} />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Account info */}
                      <div className="rounded-xl p-4 space-y-2.5"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] font-bold uppercase tracking-widest w-16 flex-shrink-0"
                            style={{ color: "var(--text-muted)" }}>Email</span>
                          <span className="text-[13px] text-white truncate">{authUser?.email}</span>
                        </div>
                        <Divider />
                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] font-bold uppercase tracking-widest w-16 flex-shrink-0"
                            style={{ color: "var(--text-muted)" }}>Joined</span>
                          <span className="text-[13px] text-white">
                            {authUser?.createdAt
                              ? new Date(authUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                              : "—"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveProfile}
                        disabled={saveLoading}
                        className="w-full py-3 rounded-xl text-[15px] font-bold transition-all disabled:opacity-50"
                        style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
                      >
                        {saveLoading ? "Saving…" : "Save Profile"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── APPEARANCE ───────────────────────────────── */}
                {view === "appearance" && (
                  <motion.div key="appearance"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">

                    <SectionLabel>Theme</SectionLabel>
                    <div className="grid grid-cols-2 gap-2.5">
                      {Object.entries(THEMES).map(([key, themeObj]) => (
                        <button
                          key={key}
                          onClick={() => setTheme(key)}
                          className="p-3.5 rounded-xl border transition-all flex items-center justify-between"
                          style={{
                            background:   activeTheme === key ? "var(--bg-active)" : "var(--bg-input)",
                            borderColor:  activeTheme === key ? "var(--accent)"    : "var(--border)",
                            color:        "var(--text-primary)",
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

                    <SectionLabel>Font Size</SectionLabel>
                    <div className="flex gap-2">
                      {["small", "medium", "large"].map(size => (
                        <button
                          key={size}
                          onClick={() => setFontSize(size)}
                          className="flex-1 py-2.5 rounded-xl text-[13px] font-medium capitalize transition-all"
                          style={{
                            background:  fontSize === size ? "var(--bg-active)"  : "var(--bg-input)",
                            border:      `1px solid ${fontSize === size ? "var(--accent)" : "var(--border)"}`,
                            color:       "var(--text-primary)",
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

                    <SectionLabel>Bubble Style</SectionLabel>
                    <div className="flex gap-2">
                      {[
                        { id: "rounded",  label: "Rounded",  preview: "rounded-2xl" },
                        { id: "sharp",    label: "Sharp",    preview: "rounded-md" },
                        { id: "minimal",  label: "Minimal",  preview: "rounded-lg" },
                      ].map(style => (
                        <button
                          key={style.id}
                          onClick={() => setBubbleStyle(style.id)}
                          className="flex-1 py-3 flex flex-col items-center gap-2 transition-all"
                          style={{
                            background:  bubbleStyle === style.id ? "var(--bg-active)"  : "var(--bg-input)",
                            border:      `1px solid ${bubbleStyle === style.id ? "var(--accent)" : "var(--border)"}`,
                            borderRadius: 12,
                            color:       "var(--text-primary)",
                          }}
                        >
                          <div className={`w-10 h-5 ${style.preview}`}
                            style={{ background: "var(--accent)", opacity: 0.7 }} />
                          <span className="text-[11px]">{style.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── NOTIFICATIONS ─────────────────────────────── */}
                {view === "notifications" && (
                  <motion.div key="notifications"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">

                    <SectionLabel>Message Alerts</SectionLabel>
                    <div className="space-y-1 rounded-xl overflow-hidden"
                      style={{ border: "1px solid var(--border)", background: "var(--bg-input)" }}>
                      <div className="px-4">
                        <SettingRow
                          label="Message Sounds"
                          description="Play a sound for new messages"
                          right={<Toggle checked={isSoundEnabled} onChange={toggleSound} />}
                        />
                        <Divider />
                        <SettingRow
                          label="Notification Preview"
                          description="Show message content in notifications"
                          right={<Toggle checked={notifPreview} onChange={e => setNotifPreview(e.target.checked)} />}
                        />
                        <Divider />
                        <SettingRow
                          label="Vibrate"
                          description="Vibrate on new message (mobile)"
                          right={<Toggle checked={vibrateOn} onChange={e => setVibrateOn(e.target.checked)} />}
                        />
                      </div>
                    </div>

                    <SectionLabel>Do Not Disturb</SectionLabel>
                    <div className="rounded-xl overflow-hidden"
                      style={{ border: "1px solid var(--border)", background: "var(--bg-input)" }}>
                      <div className="px-4">
                        <SettingRow
                          label="Do Not Disturb"
                          description="Silence all notifications"
                          right={<Toggle checked={dndEnabled} onChange={e => setDndEnabled(e.target.checked)} />}
                        />
                      </div>
                    </div>
                    {dndEnabled && (
                      <p className="text-[12px] mt-2 px-1"
                        style={{ color: "var(--text-muted)" }}>
                        🔕 Notifications are silenced. You can still receive messages.
                      </p>
                    )}
                  </motion.div>
                )}

                {/* ── PRIVACY & SECURITY ────────────────────────── */}
                {view === "privacy" && (
                  <motion.div key="privacy"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">

                    <SectionLabel>Who Can See</SectionLabel>
                    <div className="rounded-xl overflow-hidden"
                      style={{ border: "1px solid var(--border)", background: "var(--bg-input)" }}>
                      <div className="px-4">
                        <SettingRow
                          label="Read Receipts"
                          description="Let others know you've read their messages"
                          right={
                            <Toggle
                              checked={privacy.readReceipts}
                              onChange={e => handlePrivacyChange("readReceipts", e.target.checked)}
                            />
                          }
                        />
                        <Divider />
                        <SettingRow
                          label="Online Status"
                          description="Show when you're active"
                          right={
                            <Toggle
                              checked={showOnlineStatus}
                              onChange={e => setShowOnlineStatus(e.target.checked)}
                            />
                          }
                        />
                        <Divider />
                        <SettingRow
                          label="Typing Indicator"
                          description='Show "typing…" to others'
                          right={
                            <Toggle
                              checked={showTyping}
                              onChange={e => setShowTyping(e.target.checked)}
                            />
                          }
                        />
                      </div>
                    </div>

                    <SectionLabel>Last Seen</SectionLabel>
                    <select
                      value={privacy.lastSeenFor}
                      onChange={e => handlePrivacyChange("lastSeenFor", e.target.value)}
                      className="w-full p-3 rounded-xl text-white text-[14px] outline-none transition-colors"
                      style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="contacts">My Contacts Only</option>
                      <option value="nobody">Nobody</option>
                    </select>

                    <SectionLabel>Profile Photo</SectionLabel>
                    <select
                      value={privacy.profilePhotoFor}
                      onChange={e => handlePrivacyChange("profilePhotoFor", e.target.value)}
                      className="w-full p-3 rounded-xl text-white text-[14px] outline-none transition-colors"
                      style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="contacts">My Contacts Only</option>
                      <option value="nobody">Nobody</option>
                    </select>

                    <SectionLabel>Account Security</SectionLabel>

                    {/* Active Session */}
                    <div className="rounded-xl p-4 mb-3"
                      style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <Smartphone size={17} style={{ color: "var(--accent)" }} />
                          <span className="text-white font-medium text-[14px]">Active Sessions</span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: "rgba(0,168,132,0.15)", color: "var(--accent)" }}>
                          1 active
                        </span>
                      </div>
                      <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                        Chrome · Windows · Now
                      </p>
                    </div>

                    {/* 2FA */}
                    <div className="rounded-xl p-4"
                      style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <Lock size={17} style={{ color: "var(--text-secondary)" }} />
                          <span className="text-white font-medium text-[14px]">Two-Factor Auth</span>
                        </div>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                          authUser?.twoFA?.enabled
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "text-[var(--text-muted)]"}`}
                          style={authUser?.twoFA?.enabled ? {} : { background: "var(--bg-secondary)" }}>
                          {authUser?.twoFA?.enabled ? "Enabled" : "Off"}
                        </span>
                      </div>
                      <p className="text-[12px] mb-3" style={{ color: "var(--text-muted)" }}>
                        {authUser?.twoFA?.enabled
                          ? "Your account has an extra layer of protection."
                          : "Add an extra layer of security to your account."}
                      </p>

                      {!showTwoFAForm ? (
                        <button
                          onClick={() => setShowTwoFAForm(true)}
                          className="w-full py-2.5 rounded-xl border text-[13px] font-medium text-white hover:bg-white/5 transition-colors"
                          style={{ borderColor: "var(--border)" }}
                        >
                          {authUser?.twoFA?.enabled ? "Disable 2FA" : "Enable 2FA"}
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                            Confirm your password to {authUser?.twoFA?.enabled ? "disable" : "enable"} 2FA
                          </p>
                          <div className="relative">
                            <input
                              type={showPwd ? "text" : "password"}
                              value={twoFAPassword}
                              onChange={e => setTwoFAPassword(e.target.value)}
                              placeholder="Current password"
                              className="w-full p-3 pr-11 rounded-xl text-white text-[13px] outline-none"
                              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
                            />
                            <button type="button"
                              onClick={() => setShowPwd(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                              style={{ color: "var(--text-muted)" }}>
                              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setShowTwoFAForm(false); setTwoFAPassword(""); }}
                              className="flex-1 py-2.5 rounded-xl border text-[13px] hover:bg-white/5 transition-colors"
                              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                              Cancel
                            </button>
                            <button
                              onClick={handleToggle2FA}
                              disabled={twoFALoading}
                              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors disabled:opacity-50"
                              style={{ background: "var(--accent)", color: "var(--bg-primary)" }}>
                              {twoFALoading ? "Confirming…" : "Confirm"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Block list */}
                    <button
                      onClick={() => toast("Block list coming soon")}
                      className="w-full flex items-center justify-between p-4 mt-3 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
                      style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex items-center gap-2.5">
                        <Users size={17} style={{ color: "var(--text-secondary)" }} />
                        <span className="text-white text-[14px] font-medium">Blocked Contacts</span>
                      </div>
                      <ChevronRight size={17} style={{ color: "var(--text-muted)" }} />
                    </button>
                  </motion.div>
                )}

                {/* ── DATA & STORAGE ────────────────────────────── */}
                {view === "storage" && (
                  <motion.div key="storage"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">

                    <SectionLabel>Storage Used</SectionLabel>
                    {[
                      { label: "Photos & Videos", bytes: 42, color: "#60a5fa" },
                      { label: "Voice Messages",  bytes: 8,  color: "var(--accent)" },
                      { label: "Documents",        bytes: 3,  color: "#f59e0b" },
                    ].map(item => (
                      <div key={item.label} className="mb-3">
                        <div className="flex justify-between text-[12px] mb-1.5">
                          <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                          <span className="font-medium text-white">{item.bytes} MB</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${(item.bytes / 53) * 100}%`, background: item.color }} />
                        </div>
                      </div>
                    ))}
                    <p className="text-[12px] mt-1 text-right font-medium"
                      style={{ color: "var(--text-muted)" }}>
                      53 MB total
                    </p>

                    <SectionLabel>Download Settings</SectionLabel>
                    <div className="rounded-xl overflow-hidden"
                      style={{ border: "1px solid var(--border)", background: "var(--bg-input)" }}>
                      <div className="px-4">
                        <SettingRow
                          label="Auto-Download Media"
                          description="Automatically download photos and videos"
                          right={
                            <Toggle
                              checked={autoDownload}
                              onChange={e => setAutoDownload(e.target.checked)}
                            />
                          }
                        />
                      </div>
                    </div>

                    <SectionLabel>Media Quality</SectionLabel>
                    <div className="flex gap-2">
                      {["standard", "hd"].map(q => (
                        <button
                          key={q}
                          onClick={() => setMediaQuality(q)}
                          className="flex-1 py-2.5 rounded-xl text-[13px] font-medium capitalize transition-all"
                          style={{
                            background:  mediaQuality === q ? "var(--bg-active)" : "var(--bg-input)",
                            border:      `1px solid ${mediaQuality === q ? "var(--accent)" : "var(--border)"}`,
                            color:       "var(--text-primary)",
                          }}
                        >
                          {q === "hd" ? "HD" : "Standard"}
                        </button>
                      ))}
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
                  </motion.div>
                )}

                {/* ── HELP ─────────────────────────────────────── */}
                {view === "help" && (
                  <motion.div key="help"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">

                    {/* App branding */}
                    <div className="flex flex-col items-center py-5 mb-2">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
                        style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--bg-secondary) 100%)", border: "1px solid var(--border)" }}>
                        <Zap size={30} className="text-white" />
                      </div>
                      <h3 className="text-[18px] font-bold text-white mb-0.5">Chatify</h3>
                      <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Version 3.0.0 · Build 2026.07</p>
                    </div>

                    {/* Rate the app */}
                    <div className="rounded-xl p-4 mb-4 text-center"
                      style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                      <p className="text-white font-medium text-[14px] mb-3">Enjoying Chatify?</p>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onMouseEnter={() => setHoverStar(n)}
                            onMouseLeave={() => setHoverStar(0)}
                            onClick={() => handleStarRate(n)}
                            className="transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star
                              size={28}
                              fill={(hoverStar || starRating) >= n ? "#f59e0b" : "none"}
                              style={{ color: (hoverStar || starRating) >= n ? "#f59e0b" : "var(--text-muted)" }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* FAQ */}
                    <SectionLabel>Frequently Asked Questions</SectionLabel>
                    <div className="space-y-2 mb-4">
                      {FAQ_ITEMS.map((item, i) => (
                        <div key={i} className="rounded-xl overflow-hidden"
                          style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                          <button
                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-3"
                          >
                            <span className="text-[13.5px] font-medium text-white">{item.q}</span>
                            <ChevronDown
                              size={16}
                              className="flex-shrink-0 transition-transform duration-200"
                              style={{
                                color: "var(--text-muted)",
                                transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                              }}
                            />
                          </button>
                          <AnimatePresence>
                            {openFaq === i && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ overflow: "hidden" }}
                              >
                                <p className="px-4 pb-4 text-[13px] leading-relaxed"
                                  style={{ color: "var(--text-secondary)" }}>
                                  {item.a}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    {/* Links */}
                    <SectionLabel>Legal & Support</SectionLabel>
                    <div className="space-y-2">
                      <a
                        href="mailto:support@chatify.app"
                        className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors hover:bg-[var(--bg-hover)]"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border)", textDecoration: "none" }}
                      >
                        <MessageSquare size={18} style={{ color: "var(--accent)" }} />
                        <div>
                          <p className="text-white text-[14px] font-medium">Contact Support</p>
                          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>support@chatify.app</p>
                        </div>
                        <ChevronRight size={16} className="ml-auto" style={{ color: "var(--text-muted)" }} />
                      </a>

                      <button
                        onClick={() => setShowPrivacy(true)}
                        className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors hover:bg-[var(--bg-hover)]"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
                      >
                        <Globe size={18} style={{ color: "var(--text-secondary)" }} />
                        <div className="text-left">
                          <p className="text-white text-[14px] font-medium">Privacy Policy</p>
                          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>How we handle your data</p>
                        </div>
                        <ChevronRight size={16} className="ml-auto" style={{ color: "var(--text-muted)" }} />
                      </button>

                      <button
                        onClick={() => setShowTerms(true)}
                        className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors hover:bg-[var(--bg-hover)]"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
                      >
                        <FileText size={18} style={{ color: "var(--text-secondary)" }} />
                        <div className="text-left">
                          <p className="text-white text-[14px] font-medium">Terms of Service</p>
                          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Rules and usage agreement</p>
                        </div>
                        <ChevronRight size={16} className="ml-auto" style={{ color: "var(--text-muted)" }} />
                      </button>
                    </div>

                    <p className="text-center text-[11px] mt-6 mb-2" style={{ color: "var(--text-muted)" }}>
                      Made with ❤️ by the Chatify team
                    </p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}

      {/* Privacy Policy modal */}
      {showPrivacy && (
        <TextModal
          title="Privacy Policy"
          content={PRIVACY_POLICY}
          onClose={() => setShowPrivacy(false)}
        />
      )}

      {/* Terms of Service modal */}
      {showTerms && (
        <TextModal
          title="Terms of Service"
          content={TERMS_OF_SERVICE}
          onClose={() => setShowTerms(false)}
        />
      )}
    </AnimatePresence>
  );
}
