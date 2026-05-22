import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import {
  XIcon, PhoneIcon, VideoIcon, StarIcon, BellOffIcon, BellIcon,
  TrashIcon, MessageSquareXIcon, TimerIcon, ChevronRightIcon,
  QrCodeIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import StarredMessages from "./StarredMessages";
import DisappearTimerPicker from "./DisappearTimerPicker";
import ContactQRModal from "./ContactQRModal";

export default function ContactInfoPanel({ user, onClose, onClearChat, onArchive }) {
  const { onlineUsers } = useAuthStore();
  const { lastSeenMap, toggleStarMessage, disappearSeconds, setDisappearSeconds,
          blockUser, unblockUser, isUserBlocked } = useChatStore();

  const [notifications, setNotifications]   = useState(true);
  const [showStarred,   setShowStarred]     = useState(false);
  const [showDisappear, setShowDisappear]   = useState(false);
  const [showQR,        setShowQR]          = useState(false);
  const [blocked,       setBlocked]         = useState(isUserBlocked(user._id));

  const isOnline = onlineUsers.includes(user._id);
  const lastSeen = lastSeenMap[user._id] || user.lastSeen;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setBlocked(isUserBlocked(user._id));
  }, [user._id, isUserBlocked]);

  function lastSeenLabel(iso) {
    if (!iso) return "";
    const d    = new Date(iso);
    const diff = now - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 2)  return "last seen just now";
    if (mins < 60) return `last seen ${mins} min ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24)  return `last seen today at ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
    return `last seen ${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
  }

  const disappearLabel =
    disappearSeconds === 0       ? "Off"
    : disappearSeconds === 3600   ? "1 hour"
    : disappearSeconds === 86400  ? "24 hours"
    : disappearSeconds === 604800 ? "7 days"
    : "Custom";

  const handleBlock = async () => {
    if (blocked) {
      await unblockUser(user._id);
      setBlocked(false);
    } else {
      await blockUser(user._id);
      setBlocked(true);
    }
  };

  if (showStarred) {
    return (
      <motion.div className="absolute inset-0 z-50" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}>
        <StarredMessages onClose={() => setShowStarred(false)} />
      </motion.div>
    );
  }

  if (showDisappear) {
    return (
      <DisappearTimerPicker
        partnerId={user._id}
        onClose={() => setShowDisappear(false)}
        onChanged={s => setDisappearSeconds(s)}
      />
    );
  }

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 bottom-0 z-40 flex flex-col w-full sm:w-[380px]"
      style={{
        background: "var(--bg-primary)",
        borderLeft: "1px solid var(--border)",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 h-[64px] flex-shrink-0"
        style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--border)" }}
      >
        <button
          onClick={onClose}
          className="p-1.5 rounded-full transition-colors hover:bg-white/10"
        >
          <XIcon className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </button>
        <p className="text-[16px] font-medium" style={{ color: "var(--text-primary)" }}>Contact info</p>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto" style={{ background: "var(--bg-secondary)" }}>

        {/* Profile card */}
        <div
          className="flex flex-col items-center py-8 px-6 mb-2"
          style={{ background: "var(--bg-panel)" }}
        >
          <img
            src={user.profilePic || "/avatar.png"}
            alt={user.fullName}
            className="w-44 h-44 rounded-full object-cover mb-5"
            style={{ border: "3px solid var(--border)" }}
          />
          <h2
            className="text-2xl font-semibold text-center"
            style={{ color: "var(--text-primary)" }}
          >
            {user.fullName}
          </h2>
          <p className="text-[15px] mt-1" style={{ color: "var(--text-secondary)" }}>{user.email}</p>
          <p
            className="text-[13px] mt-1"
            style={{ color: isOnline ? "var(--online, #10b981)" : "var(--text-muted)" }}
          >
            {isOnline ? "Online now" : lastSeenLabel(lastSeen)}
          </p>

          {/* Quick-action buttons */}
          <div className="flex items-center justify-center gap-6 mt-6">
            {[
              { icon: <PhoneIcon size={22} />, label: "Audio" },
              { icon: <VideoIcon size={22} />, label: "Video" },
              { icon: <QrCodeIcon size={22} />, label: "QR Code", action: () => setShowQR(true) },
            ].map(btn => (
              <button
                key={btn.label}
                onClick={btn.action}
                className="flex flex-col items-center gap-2 transition-opacity hover:opacity-75"
                style={{ color: "var(--text-primary)" }}
              >
                <div
                  className="p-3 rounded-xl"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {btn.icon}
                </div>
                <span className="text-[12px] font-medium">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="px-5 py-4 mb-2" style={{ background: "var(--bg-panel)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>About</p>
          <p className="text-[15px]" style={{ color: "var(--text-primary)" }}>
            {user.bio || user.status || "Hey there! I am using Chatify."}
          </p>
        </div>

        {/* Config section */}
        <div className="mb-2" style={{ background: "var(--bg-panel)" }}>
          {/* Mute notifications */}
          <button
            onClick={() => setNotifications(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 transition-colors"
            style={{ borderBottom: "1px solid var(--border)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div className="flex items-center gap-4">
              <div style={{ color: "var(--text-secondary)" }}>
                {notifications ? <BellIcon size={20} /> : <BellOffIcon size={20} />}
              </div>
              <span className="text-[15px]" style={{ color: "var(--text-primary)" }}>Mute notifications</span>
            </div>
            <label className="relative inline-flex items-center pointer-events-none">
              <input type="checkbox" className="sr-only peer" checked={!notifications} readOnly />
              <div
                className="w-9 h-5 rounded-full peer transition-all"
                style={{
                  background: !notifications ? "var(--accent)" : "rgba(255,255,255,0.15)",
                  position: "relative",
                }}
              >
                <div
                  className="absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white transition-transform"
                  style={{ transform: !notifications ? "translateX(16px)" : "translateX(0)" }}
                />
              </div>
            </label>
          </button>

          {/* Starred messages */}
          <button
            onClick={() => setShowStarred(true)}
            className="w-full flex items-center justify-between px-5 py-4 transition-colors"
            style={{ borderBottom: "1px solid var(--border)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div className="flex items-center gap-4">
              <StarIcon size={20} style={{ color: "var(--text-secondary)" }} />
              <span className="text-[15px]" style={{ color: "var(--text-primary)" }}>Starred messages</span>
            </div>
            <ChevronRightIcon size={16} style={{ color: "var(--text-muted)" }} />
          </button>

          {/* Disappearing messages */}
          <button
            onClick={() => setShowDisappear(true)}
            className="w-full flex flex-col items-start px-5 py-4 transition-colors"
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div className="flex items-center gap-4 w-full justify-between">
              <div className="flex items-center gap-4">
                <TimerIcon size={20} style={{ color: "var(--text-secondary)" }} />
                <span className="text-[15px]" style={{ color: "var(--text-primary)" }}>Disappearing messages</span>
              </div>
              <ChevronRightIcon size={16} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-[13px] pl-9 mt-0.5" style={{ color: "var(--text-muted)" }}>{disappearLabel}</p>
          </button>
        </div>

        {/* Danger actions */}
        <div className="mb-8" style={{ background: "var(--bg-panel)" }}>
          <button
            onClick={handleBlock}
            className="w-full flex items-center gap-4 px-5 py-4 transition-colors text-red-500"
            style={{ borderBottom: "1px solid var(--border)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <MessageSquareXIcon size={20} />
            <span className="text-[15px]">
              {blocked ? `Unblock ${user.fullName}` : `Block ${user.fullName}`}
            </span>
          </button>
          {onClearChat && (
            <button
              onClick={onClearChat}
              className="w-full flex items-center gap-4 px-5 py-4 transition-colors text-red-500"
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <TrashIcon size={20} />
              <span className="text-[15px]">Clear chat</span>
            </button>
          )}
        </div>
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && <ContactQRModal user={user} onClose={() => setShowQR(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
