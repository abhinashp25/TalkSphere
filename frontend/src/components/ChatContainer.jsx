import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore }  from "../store/useAuthStore";
import { useChatStore }  from "../store/useChatStore";
import ChatHeader        from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput      from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import MessageTicks      from "./MessageTicks";
import SmartReplies      from "./SmartReplies";
import ForwardModal      from "./ForwardModal";
import LinkPreviewCard   from "./LinkPreviewCard";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ChevronDown, Languages, Loader2, Mic, CornerUpLeft, PhoneMissed, VideoOff } from "lucide-react";
import { useAIStore } from "../store/useAIStore";

const REACTION_EMOJIS = ["👍","❤️","😂","😮","😢","🔥"];

/* Parser for Status Replies */
const parseStatusReply = (text) => {
  if (!text) return { isStatus: false };
  const match = text.match(/^\*Replied to status:\*\s*"([\s\S]*?)"\n([\s\S]*)$/);
  if (match) {
    return {
      isStatus: true,
      statusQuote: match[1],
      replyText: match[2]
    };
  }
  const fallbackMatch = text.match(/^\*Replied to status:\*\s*"([\s\S]*?)"\s*([\s\S]*)$/);
  if (fallbackMatch) {
    return {
      isStatus: true,
      statusQuote: fallbackMatch[1],
      replyText: fallbackMatch[2]
    };
  }
  return { isStatus: false };
};


/* ── AI Summary Overlay ───────────────────────────────────────────────── */
function AISummaryOverlay({ messages, user, onClose }) {
  const recentTexts = messages.filter(m => m.text && !m.isDeletedForAll).slice(-20);
  const totalMsgs   = messages.length;
  const myMsgs      = messages.filter(m => m.isMine).length;

  // Simple keyword extraction
  const allText  = recentTexts.map(m => m.text).join(" ");
  const keywords = Array.from(new Set(
    allText.toLowerCase().match(/\b[a-z]{5,}\b/g) || []
  )).slice(0, 6);

  const lastSender = recentTexts[recentTexts.length - 1];
  const sentiment  = totalMsgs > 30 ? "Active" : totalMsgs > 10 ? "Engaged" : "New";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ backdropFilter: "blur(20px)", background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-sm mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#111111", border: "1px solid #262626" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ background: "#0a0a0a", borderBottom: "1px solid #262626" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white text-[13px] font-semibold leading-none">AI Conversation Intel</p>
              <p className="text-white/60 text-[11px] mt-0.5">with {user?.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <X size={14} className="text-white" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 p-4">
          {[
            { label: "Messages", value: totalMsgs },
            { label: "Sent", value: myMsgs },
            { label: "Received", value: totalMsgs - myMsgs }
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "#1a1a1a" }}>
              <p className="text-[20px] font-bold text-white">{s.value}</p>
              <p className="text-[11px] text-[#a3a3a3] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sentiment + Status */}
        <div className="px-4 pb-3">
          <div className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: "#1a1a1a" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.1)" }}>
              <span className="text-xl">{sentiment === "Active" ? "🔥" : sentiment === "Engaged" ? "💬" : "✨"}</span>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#e9edef]">Conversation Status</p>
              <p className="text-[12px] text-white">{sentiment} · {totalMsgs} total messages</p>
            </div>
          </div>
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-[11px] font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">Key Topics</p>
            <div className="flex flex-wrap gap-2">
              {keywords.map(k => (
                <span key={k} className="px-2.5 py-1 rounded-full text-[12px] font-medium capitalize"
                  style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}>
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Last message preview */}
        {lastSender?.text && (
          <div className="px-4 pb-4">
            <p className="text-[11px] font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">Latest Message</p>
            <div className="rounded-xl p-3" style={{ background: "#1a1a1a" }}>
              <p className="text-[13px] text-[#d1d7db] line-clamp-2">{lastSender.text}</p>
            </div>
          </div>
        )}

        <div className="px-4 pb-4">
          <p className="text-[11px] text-center text-[#667781]">AI-powered conversation insights</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ChatContainer() {
  const {
    selectedUser, getMessagesByUserId, markMessagesAsRead,
    messages, isMessagesLoading,
    toggleReaction, deleteMessage, searchQuery,
    setReplyingTo, toggleStarMessage, togglePinMessage, pinnedMessage, typingUsers
  } = useChatStore();
  const { authUser } = useAuthStore();

  const bottomRef      = useRef(null);
  const containerRef   = useRef(null);
  const holdTimer      = useRef(null);
  // Track previous message list so we only scroll on genuinely NEW messages,
  // not on metadata updates (read receipts, reactions, isRead flag changes).
  const prevMsgCount   = useRef(0);
  const prevLastMsgId  = useRef(null);

  // Swipe-to-reply: tracks how far each message bubble has been swiped (in px)
  const [swipeOffsets, setSwipeOffsets] = useState({});
  // Per-touch: start X position and which message is being swiped
  const swipeTouchX   = useRef(null);
  const swipeMsgId    = useRef(null);
  // Minimum swipe distance (px) to trigger a reply action
  const SWIPE_TRIGGER = 60;

  const [ctx,           setCtx]           = useState(null);
  const [hoveredMsg,    setHovered]        = useState(null);
  const [forwardMsg,    setForwardMsg]     = useState(null);
  const [currentInput,  setCurrentInput]   = useState("");
  const [showScrollBtn, setShowScrollBtn]  = useState(false);
  const [showAISummary, setShowAISummary]  = useState(false);
  const [translations,  setTranslations]   = useState({});
  const [translatingId, setTranslatingId]  = useState(null);
  const { translateMessage } = useAIStore();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Reset scroll tracking each time we open a different chat
    prevMsgCount.current  = 0;
    prevLastMsgId.current = null;
    getMessagesByUserId(selectedUser._id);
    markMessagesAsRead(selectedUser._id);
  }, [selectedUser._id]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 300);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // WhatsApp-style scroll: only react to GENUINELY NEW messages.
  // Metadata updates (read status, reactions) must NOT move the scroll position.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!messages || messages.length === 0) {
      prevMsgCount.current  = 0;
      prevLastMsgId.current = null;
      return;
    }
    const el      = containerRef.current;
    if (!el) return;

    const lastMsg  = messages[messages.length - 1];
    const lastId   = lastMsg._id;
    const count    = messages.length;

    // ── Initial load: jump straight to the bottom instantly ──
    if (prevMsgCount.current === 0) {
      el.scrollTop          = el.scrollHeight;
      prevMsgCount.current  = count;
      prevLastMsgId.current = lastId;
      return;
    }

    // ── Metadata-only update (same count, same last ID) ──
    // Happens when isRead, reactions, isPinned etc. change.
    // Do NOT scroll — the user may be reading old messages.
    if (count === prevMsgCount.current && lastId === prevLastMsgId.current) {
      return;
    }

    prevMsgCount.current  = count;
    prevLastMsgId.current = lastId;

    // ── A genuinely new message arrived ──
    const isMyMsg    = lastMsg.senderId === authUser?._id || lastMsg.senderId?._id === authUser?._id;
    // Check live scroll position — is the user within 150px of the bottom?
    const distBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distBottom < 150;

    if (isMyMsg) {
      // I just sent a message — always snap to bottom
      el.scrollTop = el.scrollHeight;
    } else if (nearBottom) {
      // Received a message while already near the bottom — smooth scroll down
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
    // If user is reading old messages (not near bottom), leave them alone.
    // The scroll-to-bottom button will appear to let them jump down manually.
  }, [messages, authUser?._id]);

  useEffect(() => {
    const close = () => setCtx(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const visible = searchQuery.trim()
    ? (messages || []).filter((m) => m.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    : (messages || []);

  const myReactionOn = (msg) =>
    msg.reactions?.find((r) => r.userId === authUser._id || r.userId?._id === authUser._id)?.emoji;

  const groupReactions = (reactions = []) =>
    reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {});

  const handleReply = useCallback((msg) => {
    const isMine = msg.senderId === authUser._id || msg.senderId?._id === authUser._id;
    setReplyingTo({
      messageId:  msg._id,
      text:       msg.text || null,
      image:      msg.image || null,
      audio:      msg.audio || null,
      senderName: isMine ? "You" : selectedUser.fullName,
    });
    setCtx(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser._id, selectedUser?.fullName]);

  // Swipe-to-reply touch handlers — only swipe RIGHT to reply
  const onSwipeTouchStart = useCallback((e, msgId) => {
    swipeTouchX.current = e.touches[0].clientX;
    swipeMsgId.current  = msgId;
  }, []);

  const onSwipeTouchMove = useCallback((e, msgId) => {
    if (swipeTouchX.current === null || swipeMsgId.current !== msgId) return;
    const delta = e.touches[0].clientX - swipeTouchX.current;
    if (delta < 0) return; // only allow right swipe
    // Cap the drag at 80px to prevent going too far
    const clamped = Math.min(delta, 80);
    setSwipeOffsets((prev) => ({ ...prev, [msgId]: clamped }));
  }, []);

  const onSwipeTouchEnd = useCallback((e, msg) => {
    const offset = swipeOffsets[msg._id] || 0;
    if (offset >= SWIPE_TRIGGER && !msg.isDeletedForAll) {
      handleReply(msg);
    }
    // Snap back with a brief delay so the user sees the motion
    setSwipeOffsets((prev) => ({ ...prev, [msg._id]: 0 }));
    swipeTouchX.current = null;
    swipeMsgId.current  = null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swipeOffsets, handleReply]);

  const handleTranslate = async (msg) => {
    if (!msg.text) return;
    setCtx(null);
    if (translations[msg._id]) {
      // Toggle off
      setTranslations(p => { const next = {...p}; delete next[msg._id]; return next; });
      return;
    }
    setTranslatingId(msg._id);
    const translated = await translateMessage(msg.text, "English");
    setTranslations(p => ({ ...p, [msg._id]: translated }));
    setTranslatingId(null);
  };

  const disappearLabel = (msg) => {
    if (!msg.expiresAt) return null;
    const diff = new Date(msg.expiresAt) - new Date();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (d > 1) return `${d}d`;
    if (h > 0) return `${h}h`;
    const m = Math.floor(diff / 60000);
    return `${m}m`;
  };

  // Group messages by date
  const groupedMessages = visible.reduce((acc, msg, idx) => {
    const showDate = idx === 0 || !sameDay(new Date(visible[idx - 1]?.createdAt), new Date(msg.createdAt));
    if (showDate) acc.push({ type: 'date', id: `date-${idx}`, date: msg.createdAt });
    acc.push({ type: 'message', ...msg });
    return acc;
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0 relative" onClick={() => setCtx(null)}>
      <ChatHeader onAISummary={() => setShowAISummary(true)} />

      {/* Pinned message banner */}
      {pinnedMessage && !pinnedMessage.isDeletedForAll && (
        <div className="flex items-center gap-3 px-4 py-2 cursor-pointer flex-shrink-0 pinned-glass"
          onClick={() => {
            const el = document.getElementById(`msg-${pinnedMessage._id}`);
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}>
          <div className="w-0.5 h-7 rounded-full flex-shrink-0" style={{ background: "white" }} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white">📌 Pinned Message</p>
            <p className="text-[12px] truncate text-[#a3a3a3]">
              {pinnedMessage.document ? "📄 Document" : pinnedMessage.image ? "📷 Photo" : pinnedMessage.audio ? "🎤 Voice" : pinnedMessage.text}
            </p>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-2 sm:px-3 py-3 chat-bg no-scrollbar"
        style={{ overflowAnchor: "none" }}
      >
        {isMessagesLoading ? <MessagesLoadingSkeleton /> :
         visible.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="text-5xl opacity-30">🔍</div>
            <p className="text-sm text-[#a3a3a3]">No results for "{searchQuery}"</p>
          </div>
        ) : visible.length === 0 ? (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        ) : (
          <div className="max-w-[760px] mx-auto">
            <AnimatePresence initial={false}>
            {groupedMessages.map((item) => {
              if (item.type === 'date') {
                return <DatePill key={item.id} date={item.date} />;
              }
              const msg       = item;
              const isMine    = msg.senderId === authUser._id || msg.senderId?._id === authUser._id;
              const myReaction= myReactionOn(msg);
              const grouped   = groupReactions(msg.reactions);
              const hasReacts = Object.keys(grouped).length > 0;
              const isHovered = hoveredMsg === msg._id;
              const timeLeft  = disappearLabel(msg);

              return (
                <motion.div
                  key={msg._id}
                  id={`msg-${msg._id}`}
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`flex ${isMine ? "justify-end" : "justify-start"} mb-[2px] px-2 relative`}
                  style={{ touchAction: "pan-y" }}
                  // Long-press on touch to open context menu
                  onTouchStart={(e) => {
                    onSwipeTouchStart(e, msg._id);
                    holdTimer.current = setTimeout(() => {
                      setCtx({ msgId: msg._id, isMine, touch: true, x: 100, y: 300 });
                    }, 500);
                  }}
                  onTouchMove={(e) => {
                    // If the user is swiping, cancel the long-press
                    clearTimeout(holdTimer.current);
                    onSwipeTouchMove(e, msg._id);
                  }}
                  onTouchEnd={(e) => {
                    clearTimeout(holdTimer.current);
                    onSwipeTouchEnd(e, msg);
                  }}
                >
                  {/* Swipe-to-reply arrow — visible as the bubble slides right */}
                  <AnimatePresence>
                    {(swipeOffsets[msg._id] || 0) > 10 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{
                          opacity: Math.min((swipeOffsets[msg._id] || 0) / SWIPE_TRIGGER, 1),
                          scale:   Math.min(0.6 + (swipeOffsets[msg._id] || 0) / SWIPE_TRIGGER * 0.4, 1),
                        }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center z-10 pointer-events-none"
                        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                      >
                        <CornerUpLeft size={14} className="text-white/70" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div
                    className="relative"
                    style={{
                      maxWidth: "min(72%, 500px)",
                      // Slide the bubble as the user swipes right
                      transform: `translateX(${swipeOffsets[msg._id] || 0}px)`,
                      transition: swipeTouchX.current === null ? "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)" : "none",
                    }}
                    onMouseEnter={() => setHovered(msg._id)}
                    onMouseLeave={() => setHovered(null)}
                  >

                    {/* Reaction emoji tray */}
                    <AnimatePresence>
                      {!msg.isDeletedForAll && !msg.isOptimistic && isHovered && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.85, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.85, y: 4 }}
                          transition={{ duration: 0.12 }}
                          className={`absolute z-30 -top-9 ${isMine ? "right-0" : "left-0"} flex items-center gap-[2px] px-2 py-1.5 rounded-full shadow-2xl`}
                          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 20px rgba(0,0,0,0.6)" }}
                          onMouseEnter={() => setHovered(msg._id)}
                          onMouseLeave={() => setHovered(null)}
                        >
                          {REACTION_EMOJIS.map((emoji) => (
                            <button key={emoji}
                              onClick={(e) => { e.stopPropagation(); toggleReaction(msg._id, emoji); setHovered(null); }}
                              className="text-[18px] leading-none p-1 rounded-full transition-transform duration-100 hover:scale-125"
                              style={{ background: myReaction === emoji ? "rgba(0,168,132,0.2)" : "transparent" }}
                            >{emoji}</button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bubble */}
                    <div
                      className={`${isMine ? "bubble-mine" : "bubble-theirs"} 
                        ${searchQuery && msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) ? "ring-2 ring-yellow-400/40" : ""} 
                        ${msg.isPinned ? "ring-1 ring-white/30" : ""} bubble ${msg.isWhisper ? "whisper-blur" : ""}`}
                      onContextMenu={(e) => {
                        if (msg.isOptimistic || msg.isDeletedForAll) return;
                        e.preventDefault(); e.stopPropagation();
                        setCtx({ msgId: msg._id, x: e.clientX, y: e.clientY, isMine, msg });
                      }}
                    >
                      {/* Forwarded label */}
                      {msg.isForwarded && !msg.isDeletedForAll && (
                        <p className="text-[11px] italic mb-1.5 flex items-center gap-1 text-[#a3a3a3]">
                          <span className="opacity-60">↪</span> Forwarded
                        </p>
                      )}

                      {/* Status Reply Quote Preview Card */}
                      {(() => {
                        if (!msg.text || !msg.text.startsWith('*Replied to status:*') || msg.isDeletedForAll) return null;
                        const parsed = parseStatusReply(msg.text);
                        if (!parsed.isStatus) return null;
                        const isPhoto = parsed.statusQuote.includes("Status Photo") || parsed.statusQuote.includes("📷");
                        return (
                          <div className="mb-2.5 px-3 py-2 rounded-xl relative overflow-hidden flex items-center justify-between gap-3 border-l-4 border-emerald-500 shadow-sm"
                            style={{ background: isMine ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.04)" }}>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-emerald-400 tracking-wide uppercase mb-1">Status Update</p>
                              <p className="text-[13px] text-white/90 truncate leading-relaxed">
                                {isPhoto ? "📷 Photo" : parsed.statusQuote}
                              </p>
                            </div>
                            <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/10"
                              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.3) 100%)' }}>
                              {isPhoto ? (
                                <span className="text-sm">📷</span>
                              ) : (
                                <span className="text-[10px] text-emerald-300 font-bold font-mono">Aa</span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Reply quote */}
                      {msg.replyTo?.senderName && !msg.isDeletedForAll && (
                        <div className="mb-2 px-2.5 py-1.5 rounded-lg relative overflow-hidden"
                          style={{ background: isMine ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.25)", borderLeft: "3px solid white" }}>
                          <p className="text-[11px] font-semibold mb-0.5 text-white">{msg.replyTo.senderName}</p>
                          {msg.replyTo.image && <p className="text-[12px] text-[#a3a3a3]">📷 Photo</p>}
                          {msg.replyTo.audio && <p className="text-[12px] text-[#a3a3a3]">🎤 Voice message</p>}
                          {msg.replyTo.document && <p className="text-[12px] text-[#a3a3a3]">📄 Document</p>}
                          {msg.replyTo.text && <p className="text-[12px] text-[#d1d7db] line-clamp-2">{msg.replyTo.text}</p>}
                        </div>
                      )}

                      {msg.isDeletedForAll ? (
                        <p className="text-[13px] italic text-[#a3a3a3] flex items-center gap-1.5">
                          <span className="text-base">🚫</span> This message was deleted
                        </p>
                      ) : (
                        <>
                          {msg.image    && <ImageBubble src={msg.image} isMine={isMine} />}
                          {msg.audio    && <AudioBubble src={msg.audio} isMine={isMine} />}
                          {msg.document && <DocumentBubble doc={msg.document} isMine={isMine} />}
                          {msg.text && (
                            <p className="text-[14.2px] leading-[1.5] break-words whitespace-pre-wrap">
                              {msg.text.includes("Missed voice call") ? (
                                <span className="flex items-center gap-1.5 text-red-400 font-semibold py-0.5">
                                  <PhoneMissed size={16} className="text-red-500 flex-shrink-0" />
                                  <span>Missed voice call</span>
                                </span>
                              ) : msg.text.includes("Missed video call") ? (
                                <span className="flex items-center gap-1.5 text-red-400 font-semibold py-0.5">
                                  <VideoOff size={16} className="text-red-500 flex-shrink-0" />
                                  <span>Missed video call</span>
                                </span>
                              ) : msg.text.startsWith('*Replied to status:*') ? (
                                searchQuery ? highlightMatch(parseStatusReply(translations[msg._id] || msg.text).replyText, searchQuery) : parseStatusReply(translations[msg._id] || msg.text).replyText
                              ) : (
                                searchQuery ? highlightMatch(translations[msg._id] || msg.text, searchQuery) : (translations[msg._id] || msg.text)
                              )}
                            </p>
                          )}

                          {translatingId === msg._id && (
                            <div className="flex items-center gap-1.5 mt-1.5 opacity-60">
                              <Loader2 size={12} className="animate-spin" />
                              <span className="text-[10px]">Translating...</span>
                            </div>
                          )}
                          {translations[msg._id] && translatingId !== msg._id && (
                            <div className="flex items-center gap-1 mt-1 opacity-60 text-[10px] italic">
                              <Languages size={10} /> Translated
                            </div>
                          )}
                          {msg.linkPreview?.title && (
                            <LinkPreviewCard preview={msg.linkPreview} isMine={isMine} />
                          )}
                        </>
                      )}

                      {msg._starred && (
                        <span className="text-[10px] absolute -top-2 -right-1">⭐</span>
                      )}

                      {/* Time + ticks */}
                      <div className={`flex items-center justify-end gap-1 mt-1 select-none`}>
                        {msg.isPinned && <span className="text-[9px]">📌</span>}
                        {timeLeft && (
                          <span className="text-[9px] flex items-center gap-0.5 opacity-60">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            {timeLeft}
                          </span>
                        )}
                        <span className="text-[11px]" style={{ color: isMine ? "rgba(255,255,255,0.45)" : "#a3a3a3" }}>
                          {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isMine && <MessageTicks message={msg} />}
                      </div>
                    </div>

                    {/* Reactions row */}
                    {hasReacts && !msg.isDeletedForAll && (
                      <div className={`flex gap-1 mt-1 flex-wrap ${isMine ? "justify-end" : "justify-start"}`}>
                        {Object.entries(grouped).map(([emoji, count]) => (
                          <button key={emoji}
                            onClick={(e) => { e.stopPropagation(); toggleReaction(msg._id, emoji); }}
                            className="text-[12px] px-2 py-0.5 rounded-full border transition-all"
                            style={{
                              background: myReaction === emoji ? "rgba(255,255,255,0.15)" : "rgba(26,34,53,0.85)",
                              borderColor: myReaction === emoji ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
                              color: "var(--text-primary)",
                            }}>
                            {emoji}{count > 1 ? ` ${count}` : ""}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            
            {typingUsers[selectedUser._id] && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="flex justify-start mb-[4px] px-2"
              >
                <div className="typing-bubble gap-2 shadow-[0_4px_15px_rgba(0,0,0,0.2)] border border-white/5 backdrop-blur-md rounded-2xl p-4 bg-white/5 flex items-center">
                  {typingUsers[selectedUser._id] === "recording" || typingUsers[selectedUser._id] === "audio" ? (
                    <>
                      <Mic size={15} className="text-[#4fd1c5] animate-pulse" />
                      <span className="text-[13px] text-[#4fd1c5] font-medium italic">Recording audio...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot"></span>
                    </>
                  )}
                </div>
              </motion.div>
            )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Scroll-to-bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            onClick={() => {
              const el = containerRef.current;
              if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
            }}
            className="absolute bottom-24 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-20"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <ChevronDown size={18} className="text-[#aebac1]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Context menu — Liquid Glass iOS style */}
      <AnimatePresence>
        {ctx && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed z-50 rounded-2xl overflow-hidden py-1"
            style={{
              top: Math.min(ctx.y, window.innerHeight - 310),
              left: Math.min(ctx.x, window.innerWidth - 230),
              minWidth: 215,
              background: "rgba(22,26,30,0.82)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
            onClick={(e) => e.stopPropagation()}>
            <CtxItem
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>}
              label="Reply"
              onClick={() => { handleReply(ctx.msg || messages.find(m=>m._id===ctx.msgId)); setCtx(null); }} />
            <CtxItem
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>}
              label="Forward"
              onClick={() => { setForwardMsg(ctx.msg || messages.find(m=>m._id===ctx.msgId)); setCtx(null); }} />
            <CtxItem
              icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-[17px] h-[17px]" style={{color:"#f59e0b"}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
              label="Star message"
              onClick={() => { toggleStarMessage(ctx.msgId); setCtx(null); }} />
            {ctx.msg?.text && (
              <CtxItem
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]" style={{color:"#60a5fa"}}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
                label={translations[ctx.msgId] ? "Show original" : "Translate to English"}
                onClick={() => { handleTranslate(ctx.msg); }} />
            )}
            <CtxItem
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]" style={{color:"#a78bfa"}}><line x1="12" y1="17" x2="12" y2="17.01"/><path d="M10 8V8a2 2 0 0 1 4 0v4"/><path d="m9 11-3 3 3 3m6-6 3 3-3 3"/><line x1="12" y1="2" x2="12" y2="3"/></svg>}
              label={messages.find(m=>m._id===ctx.msgId)?.isPinned ? "Unpin" : "Pin message"}
              onClick={() => { togglePinMessage(ctx.msgId); setCtx(null); }} />
            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "3px 10px" }} />
            <CtxItem
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>}
              label="Delete for me" danger
              onClick={() => { deleteMessage(ctx.msgId, false); setCtx(null); }} />
            {ctx.isMine && (
              <CtxItem
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="#fc8181" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
                label="Unsend for everyone" danger
                onClick={() => { deleteMessage(ctx.msgId, true); setCtx(null); }} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart replies */}
      {!searchQuery && messages.length > 0 && !currentInput && (
        <SmartReplies
          lastMessage={messages.filter((m) => {
            const sid = m.senderId?._id || m.senderId;
            return sid !== authUser._id && m.text;
          }).slice(-1)[0]?.text}
        />
      )}

      <MessageInput onTextChange={setCurrentInput} />

      {forwardMsg && <ForwardModal message={forwardMsg} onClose={() => setForwardMsg(null)} />}

      {/* AI Summary */}
      <AnimatePresence>
        {showAISummary && (
          <AISummaryOverlay
            messages={messages}
            user={selectedUser}
            onClose={() => setShowAISummary(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CtxItem({ icon, label, onClick, danger }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      className="w-full text-left flex items-center gap-3 transition-colors"
      style={{
        color: danger ? "#fc8181" : "#e5e7eb",
        padding: "10px 14px",
        margin: "1px 4px",
        width: "calc(100% - 8px)",
        borderRadius: 10,
        background: hovered ? "rgba(255,255,255,0.10)" : "transparent",
        fontSize: 13.5,
        cursor: "pointer",
        border: "none",
        outline: "none",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
      <span style={{ width: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: danger ? "#f87171" : "rgba(255,255,255,0.55)" }}>{icon}</span>
      <span style={{ fontWeight: 500 }}>{label}</span>
    </button>
  );
}

function DatePill({ date }) {
  const d = new Date(date); const now = new Date();
  let label;
  if (sameDay(d, now)) label = "Today";
  else {
    const y = new Date(); y.setDate(now.getDate() - 1);
    label = sameDay(d, y) ? "Yesterday" : d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  }
  return (
    <div className="flex justify-center my-4">
      <span className="text-[12px] px-4 py-1 rounded-full select-none"
        style={{ background: "#111111", color: "#a3a3a3", border: "1px solid rgba(255,255,255,0.06)" }}>
        {label}
      </span>
    </div>
  );
}

function sameDay(a, b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (<>{text.slice(0, idx)}<mark className="bg-yellow-400/40 text-inherit rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>{text.slice(idx + query.length)}</>);
}

function ImageBubble({ src, isMine }) {
  // Sender already has the image — show it directly.
  // Receiver gets the blur + click-to-view experience (like WhatsApp).
  const [opened, setOpened] = useState(isMine);
  const [lightbox, setLightbox] = useState(false);

  if (!opened) {
    return (
      <div className="relative rounded-xl overflow-hidden mb-1.5 cursor-pointer group"
        style={{ width: 220, height: 185, background: "rgba(0,0,0,0.35)" }}
        onClick={() => setOpened(true)}>
        <img src={src} alt="img" className="w-full h-full object-cover" style={{ filter: "blur(14px)", transform: "scale(1.12)" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)", border: "1.5px solid rgba(255,255,255,0.25)" }}>
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v12m0 0l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/>
            </svg>
          </div>
          <span className="text-[11px] text-white/70 font-medium">Click to view</span>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="relative rounded-xl overflow-hidden mb-1.5 cursor-zoom-in group" onClick={() => setLightbox(true)}>
        <img
          src={src}
          alt="img"
          className="rounded-xl w-full object-cover"
          style={{ maxHeight: 260, minHeight: 120, display: "block" }}
        />
        {/* Download button on hover */}
        <a href={src} download target="_blank" rel="noreferrer"
          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgba(0,0,0,0.6)" }} onClick={(e) => e.stopPropagation()}>
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v12m0 0l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/>
          </svg>
        </a>
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.94)" }} onClick={() => setLightbox(false)}>
          <img src={src} alt="full" className="max-w-[90vw] max-h-[88vh] rounded-2xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <div className="absolute top-4 right-4 flex gap-2">
            <a href={src} download target="_blank" rel="noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }} onClick={(e) => e.stopPropagation()}>
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v12m0 0l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/>
              </svg>
            </a>
            <button onClick={() => setLightbox(false)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function AudioBubble({ src, isMine }) {
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

function DocumentBubble({ doc, isMine }) {
  const ext = (doc.filename || "").split('.').pop().toLowerCase();
  
  // Choose an icon based on extension
  let IconSVG;
  if (['pdf'].includes(ext)) {
    IconSVG = (
      <svg className="w-5 h-5" style={{ color: "#ef4444" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M10 18v-2h4v2" />
        <path d="M8 18v-2h2v2" />
      </svg>
    );
  } else if (['doc', 'docx'].includes(ext)) {
    IconSVG = (
      <svg className="w-5 h-5" style={{ color: "#3b82f6" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13l-4 4-4-4" />
      </svg>
    );
  } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
    IconSVG = (
      <svg className="w-5 h-5" style={{ color: "#10b981" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h2v4H8z" />
        <path d="M14 13h2v4h-2z" />
      </svg>
    );
  } else if (['zip', 'rar', '7z', 'tar'].includes(ext)) {
    IconSVG = (
      <svg className="w-5 h-5" style={{ color: "#eab308" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 10h8" />
        <path d="M8 14h8" />
        <path d="M8 18h8" />
      </svg>
    );
  } else {
    IconSVG = (
      <svg className="w-5 h-5" style={{ color: "#9ca3af" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    );
  }

  return (
    <a href={doc.url} target="_blank" rel="noreferrer" download={doc.filename}
      className="flex items-center gap-3 p-3 mb-1.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
      style={{ background: isMine ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.2)", maxWidth: 290, minWidth: 240 }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: isMine ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)" }}>
        {IconSVG}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate text-white">{doc.filename || "Document"}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] uppercase font-bold" style={{ color: isMine ? "rgba(255,255,255,0.55)" : "#a3a3a3" }}>
            {ext || "?"}
          </span>
          <span className="text-[10px]" style={{ color: isMine ? "rgba(255,255,255,0.4)" : "#667781" }}>
            • {(doc.size / 1024).toFixed(1)} KB
          </span>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-black/40"
        style={{ background: isMine ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.05)" }}>
        <svg className="w-4 h-4 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>
    </a>
  );
}
