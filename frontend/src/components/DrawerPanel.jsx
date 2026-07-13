import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import {
  X, LogOut, ChevronRight, ArrowLeft, Plus, Users, UserPlus, CheckCircle,
  CreditCard, Award, Key, Lock, Layers, MessageSquare, Palette, Radio,
  Bell, Wifi, Tv, Globe, HelpCircle, Shield
} from "lucide-react";

// Sub-panels
import PaymentsPanel from "./settings/PaymentsPanel";
import SubscriptionsPanel from "./settings/SubscriptionsPanel";
import AccountPanel from "./settings/AccountPanel";
import PrivacyPanel from "./settings/PrivacyPanel";
import ListsPanel from "./settings/ListsPanel";
import ChatsPanel from "./settings/ChatsPanel";
import AppearancePanel from "./settings/AppearancePanel";
import BroadcastsPanel from "./settings/BroadcastsPanel";
import NotificationsPanel from "./settings/NotificationsPanel";
import StoragePanel from "./settings/StoragePanel";
import AccessibilityPanel from "./settings/AccessibilityPanel";
import LanguagePanel from "./settings/LanguagePanel";
import HelpPanel from "./settings/HelpPanel";
import ProfilePanel from "./settings/ProfilePanel";

// ─── NAV SECTIONS list matching WhatsApp ────────────────────────────────────
const NAV_SECTIONS = [
  { id: "payments",      icon: <CreditCard   size={20} />, label: "Payments",            desc: "Send and receive money safely" },
  { id: "subscriptions", icon: <Award        size={20} />, label: "Subscriptions",       desc: "Explore premium benefits & features" },
  { id: "account",       icon: <Key          size={20} />, label: "Account",             desc: "Security, change phone number" },
  { id: "privacy",       icon: <Lock         size={20} />, label: "Privacy",             desc: "Blocked contacts, disappear messages" },
  { id: "lists",         icon: <Layers       size={20} />, label: "Lists",               desc: "Organise contacts & groups" },
  { id: "chats",         icon: <MessageSquare size={20} />, label: "Chats",               desc: "Theme, wallpaper, chat history" },
  { id: "appearance",    icon: <Palette      size={20} />, label: "Appearance",          desc: "Dark mode, font scales, bubbles" },
  { id: "broadcasts",    icon: <Radio        size={20} />, label: "Broadcasts",          desc: "Send mass announcement lists" },
  { id: "notifications", icon: <Bell         size={20} />, label: "Notifications",       desc: "Message, group & call sounds" },
  { id: "storage",       icon: <Wifi         size={20} />, label: "Storage and data",    desc: "Network usage, auto-download" },
  { id: "accessibility", icon: <Tv           size={20} />, label: "Accessibility",       desc: "High contrast, animation settings" },
  { id: "language",      icon: <Globe        size={20} />, label: "App language",        desc: "Change default language" },
  { id: "help",          icon: <HelpCircle   size={20} />, label: "Help and feedback",   desc: "FAQ, privacy policy, contact support" },
];

export default function DrawerPanel({ isOpen, onClose }) {
  const [view, setView] = useState("main");
  const { authUser, logout, updatePrivacy, toggle2FA } = useAuthStore();
  const [contacts, setContacts] = useState([]);

  // Fetch contacts only when Payments panel is active to prevent lag during slide-in
  useEffect(() => {
    if (view === "payments") {
      axiosInstance.get("/messages/contacts")
        .then(res => setContacts(res.data))
        .catch(() => {});
    }
  }, [view]);

  const handleLogout = () => {
    logout();
    onClose();
  };

  const currentSection = NAV_SECTIONS.find(s => s.id === view);

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="drawer-wrapper-div" className="fixed inset-0 z-50 flex justify-end">

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

                {/* ── MAIN SETTINGS VIEW ────────────────────────── */}
                {view === "main" && (
                  <motion.div key="main"
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>

                    {/* WhatsApp Style Profile Card */}
                    <div
                      className="p-5 flex items-center justify-between border-b cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                      style={{ borderBottomColor: "var(--border)" }}
                      onClick={() => setView("profile")}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={authUser?.profilePic || "/avatar.png"}
                            alt={authUser?.fullName}
                            className="w-[60px] h-[60px] rounded-full object-cover"
                            style={{ border: "2px solid var(--accent)" }}
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full border-2 border-[var(--bg-panel)] flex items-center justify-center bg-[#00a884] text-white text-[10px] font-bold">
                            <Plus size={10} />
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[17px] font-bold text-white truncate">{authUser?.fullName}</h3>
                          <div className="flex items-center gap-1.5 mt-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                            <span className="text-[11.5px] font-medium text-white/70 truncate max-w-[150px]">
                              {authUser?.status || "I'm feeling..."}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); toast.success("My Personal QR Code"); }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
                          <Users size={16} />
                        </button>
                        <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
                      </div>
                    </div>

                    {/* Nav list */}
                    <div className="p-3 space-y-1">
                      {NAV_SECTIONS.map(section => (
                        <button key={section.id}
                          onClick={() => setView(section.id)}
                          className="w-full flex items-center justify-between p-3 rounded-xl transition-all group hover:bg-[var(--bg-hover)]">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                              style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>
                              {section.icon}
                            </div>
                            <div className="text-left min-w-0">
                              <span className="font-medium text-[14.5px] text-white block">{section.label}</span>
                              <span className="text-[11.5px] block truncate text-white/50">{section.desc}</span>
                            </div>
                          </div>
                          <ChevronRight size={16} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                        </button>
                      ))}

                      {/* Invite / Updates elements */}
                      <div className="pt-3 border-t mt-3 space-y-1" style={{ borderColor: "var(--border)" }}>
                        <button onClick={() => toast.success("Invite link copied to clipboard!")}
                          className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-[var(--bg-hover)] text-left">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-white/70">
                            <UserPlus size={18} />
                          </div>
                          <div>
                            <span className="font-medium text-[14.5px] text-white block">Invite a friend</span>
                            <span className="text-[11.5px] text-white/50 block">Share Chatify with friends</span>
                          </div>
                        </button>

                        <button onClick={() => toast.success("Chatify is up to date! (v3.0.0)")}
                          className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-[var(--bg-hover)] text-left">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-white/70">
                            <CheckCircle size={18} />
                          </div>
                          <div>
                            <span className="font-medium text-[14.5px] text-white block">App updates</span>
                            <span className="text-[11.5px] text-white/50 block">Check current application build</span>
                          </div>
                        </button>
                      </div>

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

                {/* ── PROFILE SUB-PANEL ─────────────────────────── */}
                {view === "profile" && (
                  <motion.div key="profile"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">
                    <ProfilePanel />
                  </motion.div>
                )}

                {/* ── PAYMENTS SUB-PANEL ────────────────────────── */}
                {view === "payments" && (
                  <motion.div key="payments"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">
                    <PaymentsPanel contacts={contacts} />
                  </motion.div>
                )}

                {/* ── SUBSCRIPTIONS SUB-PANEL ───────────────────── */}
                {view === "subscriptions" && (
                  <motion.div key="subscriptions"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">
                    <SubscriptionsPanel />
                  </motion.div>
                )}

                {/* ── ACCOUNT SUB-PANEL ─────────────────────────── */}
                {view === "account" && (
                  <motion.div key="account"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">
                    <AccountPanel />
                  </motion.div>
                )}

                {/* ── PRIVACY SUB-PANEL ─────────────────────────── */}
                {view === "privacy" && (
                  <motion.div key="privacy"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">
                    <PrivacyPanel authUser={authUser} updatePrivacy={updatePrivacy} toggle2FA={toggle2FA} />
                  </motion.div>
                )}

                {/* ── LISTS SUB-PANEL ───────────────────────────── */}
                {view === "lists" && (
                  <motion.div key="lists"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">
                    <ListsPanel />
                  </motion.div>
                )}

                {/* ── CHATS SUB-PANEL ───────────────────────────── */}
                {view === "chats" && (
                  <motion.div key="chats"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">
                    <ChatsPanel />
                  </motion.div>
                )}

                {/* ── APPEARANCE SUB-PANEL ──────────────────────── */}
                {view === "appearance" && (
                  <motion.div key="appearance"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">
                    <AppearancePanel />
                  </motion.div>
                )}

                {/* ── BROADCASTS SUB-PANEL ──────────────────────── */}
                {view === "broadcasts" && (
                  <motion.div key="broadcasts"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">
                    <BroadcastsPanel />
                  </motion.div>
                )}

                {/* ── NOTIFICATIONS SUB-PANEL ───────────────────── */}
                {view === "notifications" && (
                  <motion.div key="notifications"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">
                    <NotificationsPanel />
                  </motion.div>
                )}

                {/* ── STORAGE SUB-PANEL ─────────────────────────── */}
                {view === "storage" && (
                  <motion.div key="storage"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">
                    <StoragePanel isOpen={isOpen} />
                  </motion.div>
                )}

                {/* ── ACCESSIBILITY SUB-PANEL ───────────────────── */}
                {view === "accessibility" && (
                  <motion.div key="accessibility"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">
                    <AccessibilityPanel />
                  </motion.div>
                )}

                {/* ── APP LANGUAGE SUB-PANEL ────────────────────── */}
                {view === "language" && (
                  <motion.div key="language"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">
                    <LanguagePanel />
                  </motion.div>
                )}

                {/* ── HELP SUB-PANEL ────────────────────────────── */}
                {view === "help" && (
                  <motion.div key="help"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} className="p-5">
                    <HelpPanel />
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
