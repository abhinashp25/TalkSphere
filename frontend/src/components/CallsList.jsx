import { useState, useEffect } from "react";
import { Phone, Video, PlusCircle, X, Search, PhoneCall, VideoIcon, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export default function CallsList() {
  const { chats } = useChatStore();
  const { startCall, callHistory, fetchCallHistory, deleteCallLog, clearCallHistory } = useCallStore();
  const [activeCallFilter, setActiveCallFilter] = useState("all");
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [newCallSearch, setNewCallSearch] = useState("");

  useEffect(() => {
    fetchCallHistory();
  }, [fetchCallHistory]);

  const getUserData = (userId) => chats.find(c => c._id === userId) || { fullName: "Unknown User", profilePic: "/avatar.png", _id: userId };

  const enrichedHistory = callHistory.map(call => {
    const defaultUser = getUserData(call.userId);
    return {
      ...call,
      user: {
        _id: call.userId,
        fullName: call.fullName || defaultUser.fullName,
        profilePic: call.profilePic || defaultUser.profilePic,
        bio: call.bio || defaultUser.bio,
      },
      timestamp: new Date(call.timestamp)
    };
  });

  const filtered = activeCallFilter === "missed"
    ? enrichedHistory.filter(c => c.type === "missed")
    : enrichedHistory;

  const filteredContacts = chats.filter(c =>
    c.fullName?.toLowerCase().includes(newCallSearch.toLowerCase())
  );

  function formatTime(date) {
    if (!date) return "";
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    if (days === 1) return "Yesterday";
    if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { day: "numeric", month: "short" });
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-secondary)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <h1 className="text-[22px] font-bold brand-font text-white">Calls</h1>
        <div className="flex items-center gap-1">
          {callHistory.length > 0 && (
            <button
              onClick={() => {
                toast((t) => (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">Clear all call history?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { clearCallHistory(); toast.dismiss(t.id); }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                      >Clear All</button>
                      <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}
                      >Cancel</button>
                    </div>
                  </div>
                ), { duration: 8000 });
              }}
              className="hover:bg-white/10 p-2 rounded-full transition-colors text-red-400/80 hover:text-red-400"
              title="Clear call history"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={() => setShowNewCallModal(true)}
            className="hover:bg-white/10 p-2 rounded-full transition-colors"
            style={{ color: "var(--accent)" }}
            title="New call">
            <PlusCircle size={22} />
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 px-4 pb-3 flex-shrink-0">
        <button
          onClick={() => setActiveCallFilter("all")}
          className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${activeCallFilter === "all"
            ? "text-white"
            : "text-[#a3a3a3]"
            }`}
          style={{
            background: activeCallFilter === "all" ? "var(--accent)" : "var(--bg-input)",
            border: "1px solid var(--border)"
          }}>
          All
        </button>
        <button
          onClick={() => setActiveCallFilter("missed")}
          className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${activeCallFilter === "missed" ? "text-red-400" : "text-[#a3a3a3]"
            }`}
          style={{
            background: activeCallFilter === "missed" ? "rgba(239,68,68,0.15)" : "var(--bg-input)",
            border: `1px solid ${activeCallFilter === "missed" ? "rgba(239,68,68,0.3)" : "var(--border)"}`
          }}>
          Missed
        </button>
      </div>

      {/* Call list */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 sm:pb-0">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--bg-input)" }}>
              <Phone size={28} style={{ color: "var(--text-muted)" }} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-white/80 text-[15px]">No calls yet</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Tap the + button to start a call</p>
            </div>
          </div>
        )}
        {filtered.map((call) => (
          <motion.div
            key={call._id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 group transition-colors hover:bg-white/[0.04] border-b"
            style={{ borderColor: "var(--border)" }}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={call.user.profilePic || "/avatar.png"}
                alt={call.user.fullName}
                className="w-12 h-12 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Video/Voice badge on avatar */}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: call.isVideo ? "#6366f1" : "#059669", border: "2px solid var(--bg-secondary)" }}
              >
                {call.isVideo
                  ? <Video size={10} className="text-white" />
                  : <Phone size={10} className="text-white" />}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`text-[14.5px] font-semibold truncate ${call.type === "missed" ? "text-red-400" : "text-white"}`}>
                {call.user.fullName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CallTypeIcon type={call.type} />
                <span className={`text-[12px] ${call.type === "missed" ? "text-red-400/80" : "text-[#a3a3a3]"}`}>
                  {call.type === "missed" ? "Missed" : call.type === "incoming" ? "Incoming" : "Outgoing"}
                  {call.duration ? ` · ${formatDuration(call.duration)}` : ""}
                </span>
              </div>
            </div>

            {/* Right side: time + actions */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span className="text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                {formatTime(call.timestamp)}
              </span>
              <div className="flex items-center gap-1.5">
                {/* Delete (hover only on desktop) */}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteCallLog(call._id); }}
                  className="p-1.5 rounded-full text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all sm:opacity-0 sm:group-hover:opacity-100 opacity-100"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
                {/* Call-back button — always visible */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={(e) => { e.stopPropagation(); startCall(call.user._id, call.isVideo); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: call.isVideo ? "rgba(99,102,241,0.15)" : "rgba(5,150,105,0.15)",
                    border: call.isVideo ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(5,150,105,0.3)",
                    color: call.isVideo ? "#818cf8" : "#10b981",
                  }}
                  title={`${call.isVideo ? "Video" : "Voice"} call back`}
                >
                  {call.isVideo ? <Video size={13} /> : <Phone size={13} />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── New Call Modal (Portal to body to escape translateX transform on container) ── */}
      {createPortal(
        <AnimatePresence>
          {showNewCallModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
              style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
              onClick={() => { setShowNewCallModal(false); setNewCallSearch(""); }}>
              <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
                style={{
                  background: "rgba(18,22,26,0.92)",
                  backdropFilter: "blur(28px) saturate(180%)",
                  WebkitBackdropFilter: "blur(28px) saturate(180%)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "0 -8px 48px rgba(0,0,0,0.5)",
                  maxHeight: "75vh"
                }}
                onClick={e => e.stopPropagation()}>
                {/* Handle + Header */}
                <div className="flex-shrink-0 px-5 py-4">
                  <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[17px] font-bold text-white">New Call</h2>
                    <button
                      onClick={() => { setShowNewCallModal(false); setNewCallSearch(""); }}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                      style={{ color: "var(--text-muted)" }}>
                      <X size={17} />
                    </button>
                  </div>
                  {/* Search */}
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Search size={15} style={{ color: "var(--text-muted)" }} />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search contacts..."
                      value={newCallSearch}
                      onChange={e => setNewCallSearch(e.target.value)}
                      className="flex-1 bg-transparent text-white text-[14px] outline-none placeholder:text-white/30"
                    />
                  </div>
                </div>

                {/* Contact List */}
                <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
                  {filteredContacts.length === 0 && (
                    <div className="flex flex-col items-center py-10 gap-3">
                      <p className="text-white/40 text-[13px]">No contacts found</p>
                    </div>
                  )}
                  {filteredContacts.map(contact => (
                    <div
                      key={contact._id}
                      className="flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={contact.profilePic || "/avatar.png"}
                          alt={contact.fullName}
                          className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="text-white font-semibold text-[14px] truncate">{contact.fullName}</p>
                          <p className="text-[11.5px] truncate" style={{ color: "var(--text-muted)" }}>
                            {contact.bio || "TalkSphere user"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {/* Voice call */}
                        <button
                          onClick={() => { startCall(contact._id, false); setShowNewCallModal(false); setNewCallSearch(""); }}
                          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                          style={{ background: "rgba(0,168,132,0.15)", border: "1px solid rgba(0,168,132,0.3)", color: "var(--accent)" }}
                          title="Voice call">
                          <PhoneCall size={16} />
                        </button>
                        {/* Video call */}
                        <button
                          onClick={() => { startCall(contact._id, true); setShowNewCallModal(false); setNewCallSearch(""); }}
                          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                          style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8" }}
                          title="Video call">
                          <VideoIcon size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>

  );
}

// Format call duration from "m:ss" to "m min ss sec" or just "0:ss"
function formatDuration(dur) {
  if (!dur) return "";
  const [m, s] = dur.split(":").map(Number);
  if (!m && !s) return "";
  if (m === 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

// WhatsApp-style directional arrow icons
function CallTypeIcon({ type }) {
  if (type === "missed") {
    return (
      <span title="Missed call" className="flex-shrink-0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Arrow pointing bottom-left = missed/declined */}
          <line x1="17" y1="7" x2="7" y2="17" />
          <polyline points="7 7 7 17 17 17" />
        </svg>
      </span>
    );
  }
  if (type === "incoming") {
    return (
      <span title="Incoming call" className="flex-shrink-0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Arrow pointing bottom-right = incoming */}
          <line x1="7" y1="7" x2="17" y2="17" />
          <polyline points="17 7 17 17 7 17" />
        </svg>
      </span>
    );
  }
  return (
    <span title="Outgoing call" className="flex-shrink-0">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        {/* Arrow pointing top-right = outgoing */}
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="7 7 17 7 17 17" />
      </svg>
    </span>
  );
}
