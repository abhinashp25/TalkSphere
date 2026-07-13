import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore }  from "../store/useAuthStore";
import { useChatStore }  from "../store/useChatStore";
import {
  ArrowLeftIcon, UsersIcon, MoreVerticalIcon, SendIcon,
  XIcon, LogOutIcon, Mic, Send,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from "./EmojiPicker";
import VoiceRecorder from "./VoiceRecorder";

const STOP_DELAY = 1500;

export default function GroupChatWindow({ group, onClose }) {
  const { authUser } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar } = useChatStore();
  const {
    groupMessages, fetchGroupMessages, sendGroupMessage,
    leaveGroup, groupTypingUsers, emitGroupTyping, emitGroupStopTyping,
  } = useGroupStore();

  const [text, setText]           = useState("");
  const [imgPreview, setImg]      = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [membersOpen, setMembers] = useState(false);
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);
  const timerRef  = useRef(null);
  const typingRef = useRef(false);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  const msgs   = useMemo(() => groupMessages[group._id] || [], [groupMessages, group._id]);
  const typers = groupTypingUsers[group._id] || {};
  const typingNames = Object.values(typers)
    .filter((n) => n !== authUser?.fullName)
    .join(", ");

  useEffect(() => { fetchGroupMessages(group._id); }, [group._id, fetchGroupMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const handleTyping = useCallback((val) => {
    if (val.length > 0 && !typingRef.current) {
      typingRef.current = true;
      emitGroupTyping?.(group._id);
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      typingRef.current = false;
      emitGroupStopTyping?.(group._id);
    }, STOP_DELAY);
    if (val.length === 0) {
      clearTimeout(timerRef.current);
      typingRef.current = false;
      emitGroupStopTyping?.(group._id);
    }
  }, [group._id, emitGroupTyping, emitGroupStopTyping]);

  const handleSend = async () => {
    if (!text.trim() && !imgPreview) return;
    clearTimeout(timerRef.current);
    typingRef.current = false;
    emitGroupStopTyping?.(group._id);
    await sendGroupMessage(group._id, { text: text.trim(), image: imgPreview });
    setText(""); setImg(null); setEmojiOpen(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImg(reader.result);
    reader.readAsDataURL(file);
  };

  const handleVoiceSend = (audioBase64) => {
    sendGroupMessage(group._id, { audio: audioBase64 });
    setVoiceMode(false);
  };

  const insertEmoji = (em) => {
    setText((t) => t + em);
    setEmojiOpen(false);
  };

  const canSend = text.trim() || imgPreview;

  return (
    <div className="flex flex-col h-full relative">

      {/* Header */}
      <div className="flex items-center gap-2 px-3 h-[64px] flex-shrink-0 relative header-glass">
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, #667eea 0%, #4fd1c5 100%)', opacity: 0.7 }} />

        <button onClick={onClose} className="icon-btn sm:hidden">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        <button 
          onClick={toggleSidebar} 
          className="hidden sm:flex icon-btn text-[#a3a3a3] hover:text-white transition-all duration-200"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? (
            <svg className="w-[18px] h-[18px] transition-transform duration-300 hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2"/>
              <path d="M9 3v18"/>
              <path d="m14 9 3 3-3 3"/>
            </svg>
          ) : (
            <svg className="w-[18px] h-[18px] transition-transform duration-300 hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2"/>
              <path d="M9 3v18"/>
              <path d="m16 15-3-3 3-3"/>
            </svg>
          )}
        </button>

        {/* Group avatar */}
        {group.groupPic ? (
          <img src={group.groupPic} alt={group.name}
            className="w-10 h-10 rounded-xl object-cover flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
            onClick={() => setMembers(true)} />
        ) : (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base font-bold cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #667eea, #4fd1c5)', color: 'white', boxShadow: '0 4px 12px rgba(102,126,234,0.35)' }}
            onClick={() => setMembers(true)}>
            {group.name[0].toUpperCase()}
          </div>
        )}

        {/* Name + typing */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setMembers(true)}>
          <p className="text-[15px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {group.name}
          </p>
          {typingNames ? (
            <p className="text-[12px]" style={{ color: '#4fd1c5' }}>{typingNames} typing…</p>
          ) : (
            <p className="text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>
              {group.members?.length || 0} members
            </p>
          )}
        </div>

        <button className="icon-btn" onClick={() => setMembers(true)} title="Members">
          <UsersIcon className="w-[17px] h-[17px]" />
        </button>

        <div className="relative">
          <button className={`icon-btn ${menuOpen ? "active" : ""}`}
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}>
            <MoreVerticalIcon className="w-[17px] h-[17px]" />
          </button>
          {menuOpen && (
            <div className="dropdown-menu animate-dropdown" style={{ top: 44, right: 0 }}
              onClick={(e) => e.stopPropagation()}>
              <button className="dropdown-item" onClick={() => { setMembers(true); setMenuOpen(false); }}>
                <UsersIcon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                View members
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" style={{ color: '#fc8181' }}
                onClick={() => { leaveGroup(group._id); setMenuOpen(false); onClose(); }}>
                <LogOutIcon className="w-4 h-4" /> Leave group
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Members slide panel */}
      {membersOpen && (
        <div className="absolute inset-0 z-40 flex items-start justify-end"
          onClick={() => setMembers(false)}>
          <div className="w-72 h-full overflow-y-auto panel-glass"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="font-bold text-[14px]" style={{ color: 'var(--text-primary)' }}>
                Members ({group.members?.length || 0})
              </p>
              <button className="icon-btn" onClick={() => setMembers(false)}>
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            {(group.members || []).map((m) => (
              <div key={m._id || m} className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <img src={m.profilePic || "/avatar.png"} alt={m.fullName}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {m.fullName || "Member"}
                  </p>
                  {group.admins?.some((a) => String(a._id || a) === String(m._id || m)) && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(79,209,197,0.12)', color: '#4fd1c5' }}>
                      Admin
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 chat-bg">
        {msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'rgba(79,209,197,0.08)', border: '1px solid rgba(79,209,197,0.15)' }}>
              👋
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Say hello to the group!</p>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-1">
          {msgs.map((msg, i) => {
            const isMine  = String(msg.senderId?._id || msg.senderId) === String(authUser?._id);
            const sender  = msg.senderId;
            const prevSenderId = String(msgs[i-1]?.senderId?._id || msgs[i-1]?.senderId);
            const thisSenderId = String(sender?._id || sender);
            const showAvatar = !isMine && (i === 0 || prevSenderId !== thisSenderId);

            return (
              <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"} gap-2`}>
                {!isMine && (
                  <div className="w-7 flex-shrink-0 mt-auto">
                    {showAvatar && (
                      <img src={sender?.profilePic || "/avatar.png"} alt=""
                        className="w-7 h-7 rounded-full object-cover" />
                    )}
                  </div>
                )}
                <div style={{ maxWidth: "min(75%, 480px)" }}>
                  {!isMine && showAvatar && (
                    <p className="text-[11px] font-semibold mb-0.5 px-1" style={{ color: '#4fd1c5' }}>
                      {sender?.fullName || "Member"}
                    </p>
                  )}
                  <div className={isMine ? "bubble-mine" : "bubble-theirs"}>
                    {msg.isDeletedForAll ? (
                      <p className="text-[13px] italic opacity-40">This message was unsent.</p>
                    ) : (
                      <>
                        {msg.image && (
                          <img src={msg.image} alt="Shared"
                            className="rounded-xl max-h-[220px] w-full object-cover mb-1.5" />
                        )}
                        {msg.audio && <AudioPlayer src={msg.audio} isMine={isMine} />}
                        {msg.text && (
                          <p className="text-[14px] leading-[1.5] break-words">{msg.text}</p>
                        )}
                      </>
                    )}
                    <div className="flex items-center justify-end gap-1 mt-1" style={{ opacity: 0.5 }}>
                      <span className="text-[10px]">
                        {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input area — Premium WhatsApp-style ──────────────────────── */}
      <div
        className="flex-shrink-0"
        style={{
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Image preview */}
        {imgPreview && (
          <div className="px-4 pt-3">
            <div className="relative inline-block">
              <img src={imgPreview} alt="Preview"
                className="w-20 h-20 object-cover rounded-xl"
                style={{ border: '2px solid var(--accent)' }} />
              <button onClick={() => { setImg(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold bg-[#ef4444]">×</button>
            </div>
          </div>
        )}

        {/* Emoji picker */}
        <AnimatePresence>
          {emojiOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="px-3 pt-2 absolute bottom-20 left-0 right-0 bg-[#0d0d0d] rounded-t-2xl shadow-2xl z-40 border border-white/5"
            >
              <EmojiPicker onSelect={insertEmoji} onClose={() => setEmojiOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2.5 px-3 py-2.5">
          {voiceMode ? (
            <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setVoiceMode(false)} />
          ) : (
            <>
              {/* Premium Input Pill */}
              <div
                className="flex-1 flex flex-col rounded-[22px] overflow-hidden transition-all duration-200"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }}
              >
                {/* Action buttons row */}
                <div className="flex items-center gap-1 px-2 pt-1.5 pb-1">
                  {/* Emoji */}
                  <button
                    type="button"
                    onClick={() => setEmojiOpen(v => !v)}
                    className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 transition-all hover:bg-white/5 active:scale-90"
                    style={{ color: emojiOpen ? 'var(--accent)' : '#737373' }}
                    title="Emoji"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 13s1.5 2 4 2 4-2 4-2" />
                      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
                      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
                    </svg>
                  </button>

                  {/* Attach image */}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 transition-all hover:bg-white/5 active:scale-90"
                    style={{ color: '#737373' }}
                    title="Attach image"
                  >
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </button>

                  <input type="file" accept="image/*" ref={fileRef} onChange={handleImage} className="hidden" />
                </div>

                {/* Text input area */}
                <div className="px-4 pb-2.5">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    rows={1}
                    onChange={(e) => {
                      setText(e.target.value);
                      handleTyping(e.target.value);
                      // auto-grow
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Type a message…"
                    className="w-full bg-transparent border-none focus:outline-none resize-none text-[14.5px] leading-[1.5] no-scrollbar"
                    style={{
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit',
                      maxHeight: '120px',
                      minHeight: '24px',
                      overflowY: 'auto',
                      caretColor: 'var(--accent)',
                    }}
                  />
                </div>
              </div>

              {/* Send / Mic FAB */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.88 }}
                onClick={canSend ? handleSend : () => setVoiceMode(true)}
                title={canSend ? "Send" : "Record voice"}
                className="w-[46px] h-[46px] rounded-full flex-shrink-0 flex items-center justify-center shadow-lg select-none"
                animate={{
                  background: canSend ? "var(--accent)" : "var(--bg-input)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {canSend ? (
                    <motion.span
                      key="send"
                      initial={{ rotate: -30, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 30, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center justify-center"
                      style={{ color: "var(--bg-primary)" }}
                    >
                      <Send size={18} className="ml-0.5" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="mic"
                      initial={{ rotate: 30, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -30, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center justify-center"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <Mic size={20} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AudioPlayer({ src, isMine }) {
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  const fmtTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const pct  = duration > 0 ? (progress / duration) * 100 : 0;
  const BARS = [3,5,8,6,9,4,7,10,6,8,5,4,9,7,6,8,5,3,7,9,4,6,8,5,7,9,6,4,8,6];

  return (
    <div className="flex items-center gap-2.5 mb-1" style={{ minWidth: 230, maxWidth: 290 }}>
      <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden"
        style={{ background: isMine ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.15)" }}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full p-2"
          style={{ color: isMine ? "rgba(255,255,255,0.7)" : "white" }}>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
        </svg>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <button onClick={toggle}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ background: isMine ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)" }}>
            {playing ? (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" style={{ color: "white" }}>
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 ml-0.5" viewBox="0 0 24 24" fill="currentColor" style={{ color: "white" }}>
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
          </button>
          <div className="flex items-center gap-[2px] flex-1 cursor-pointer h-8"
            onClick={(e) => {
              if (!audioRef.current || !duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const p = (e.clientX - rect.left) / rect.width;
              audioRef.current.currentTime = p * duration;
              setProgress(p * duration);
            }}>
            {BARS.map((h, i) => {
              const barPct = (i / BARS.length) * 100;
              const active = barPct <= pct;
              return (
                <div key={i} className="rounded-full flex-1 transition-all"
                  style={{
                    height: `${h * 2.5}px`,
                    background: active
                      ? (isMine ? "rgba(255,255,255,0.9)" : "white")
                      : (isMine ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.2)"),
                  }} />
              );
            })}
          </div>
        </div>
        <p className="text-[10px] mt-0.5 pl-10" style={{ color: isMine ? "rgba(255,255,255,0.5)" : "#a3a3a3" }}>
          {fmtTime(playing || progress > 0 ? progress : duration)}
        </p>
      </div>
      <audio ref={audioRef} src={src} preload="metadata"
        onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
        onTimeUpdate={() => { if (audioRef.current) setProgress(audioRef.current.currentTime); }}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        className="hidden" />
    </div>
  );
}
