import { useEffect, useState, useRef } from "react";
import { Plus, Camera, Type, X, ChevronRight } from "lucide-react";
import { useStatusStore } from "../store/useStatusStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

// Custom Segmented Ring around contact avatars
function StatusRing({ total, viewedCount, size = 52 }) {
  const radius = size / 2 - 3;
  const circumference = 2 * Math.PI * radius;
  
  if (total === 1) {
    const strokeColor = viewedCount > 0 ? "rgba(255, 255, 255, 0.15)" : "#00a884";
    return (
      <svg width={size} height={size} className="absolute inset-0 z-10 rotate-[-90deg]">
        <circle
          cx={size/2}
          cy={size/2}
          r={radius}
          stroke={strokeColor}
          strokeWidth="2.5"
          fill="transparent"
        />
      </svg>
    );
  }

  const gap = total > 5 ? 3 : 4; 
  const segmentLength = (circumference - (total * gap)) / total;
  const dashArray = `${segmentLength} ${gap}`;

  return (
    <svg width={size} height={size} className="absolute inset-0 z-10 rotate-[-90deg]">
      {Array.from({ length: total }).map((_, i) => {
        const isSegmentViewed = i < viewedCount;
        const color = isSegmentViewed ? "rgba(255, 255, 255, 0.15)" : "#00a884";
        const offset = -i * (segmentLength + gap);
        return (
          <circle
            key={i}
            cx={size/2}
            cy={size/2}
            r={radius}
            stroke={color}
            strokeWidth="2.5"
            fill="transparent"
            strokeDasharray={dashArray}
            strokeDashoffset={offset}
          />
        );
      })}
    </svg>
  );
}

const gradients = [
  "linear-gradient(135deg, #120c1f 0%, #201335 100%)",
  "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)",
  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)"
];

export default function StatusTray() {
  const { 
    statuses, fetchStatuses, uploadStatus, isUploading,
    activeStatus, setActiveStatus, viewedIds,
    setIsTextModalOpen
  } = useStatusStore();
  const { authUser } = useAuthStore();
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  // Group statuses by user
  const groupedStatuses = statuses.reduce((acc, status) => {
    if (!status.userId || !status.userId._id) return acc;
    const userId = status.userId._id;
    if (!acc[userId]) acc[userId] = { user: status.userId, items: [] };
    acc[userId].items.push(status);
    return acc;
  }, {});

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      await uploadStatus(reader.result, "image");
    };
    reader.readAsDataURL(file);
  };

  // Segment ring helper calculations
  const getSegmentStats = (items) => {
    const total = items.length;
    const viewedCount = items.filter(item => viewedIds.has(item._id)).length;
    return { total, viewedCount };
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[64px] flex-shrink-0" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
        <h1 className="text-[20px] font-bold brand-font tracking-wide text-white">Status</h1>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 sm:pb-4 flex flex-col gap-6">
        
        {/* My Status Section Card */}
        <div className="rounded-2xl p-4 flex items-center justify-between border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="relative w-[52px] h-[52px]">
              <img src={authUser?.profilePic || "/avatar.png"} alt="me" className="w-full h-full rounded-2xl object-cover border" style={{ borderColor: "var(--border)" }} referrerPolicy="no-referrer" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00a884] flex items-center justify-center border border-[var(--bg-secondary)] shadow-sm">
                <Plus className="text-white w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white">My Status</p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Update your daily updates</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setIsTextModalOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover)] border transition-all text-[#00a884]"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}
              title="Add text status"
            >
              <Type size={18} />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover)] border transition-all text-[#00a884]"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}
              title="Upload status image"
            >
              <Camera size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageSelect} 
            />
          </div>
        </div>

        {/* Status Feed List */}
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider mb-3 pl-1" style={{ color: "var(--text-secondary)" }}>Recent updates</p>
          
          {Object.keys(groupedStatuses).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <span className="text-3xl opacity-40">✨</span>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No status updates yet</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Be the first to share one!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {Object.values(groupedStatuses).map(({ user, items }) => {
                const { total, viewedCount } = getSegmentStats(items);
                const isFullyViewed = viewedCount === total;
                return (
                  <div 
                    key={user._id} 
                    onClick={() => setActiveStatus({ user, items, currentIndex: 0 })}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-[var(--bg-hover)] cursor-pointer transition-all border border-transparent"
                  >
                    <div className="relative w-[52px] h-[52px] flex-shrink-0">
                      <StatusRing total={total} viewedCount={viewedCount} />
                      <div className="absolute inset-[3px] rounded-2xl overflow-hidden bg-slate-900">
                        <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[14.5px] font-semibold text-white truncate">{user.fullName}</p>
                        {!isFullyViewed && (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#00a884]" />
                        )}
                      </div>
                      <p className="text-[12px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        {new Date(items[items.length - 1].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                    <ChevronRight size={16} className="opacity-40" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// Write status modal component to escape CSS constraints of sidebar
export function WriteStatusModal() {
  const { isTextModalOpen, setIsTextModalOpen, uploadStatus, isUploading } = useStatusStore();
  const [statusText, setStatusText] = useState("");
  const [selectedGradIndex, setSelectedGradIndex] = useState(0);

  if (!isTextModalOpen) return null;

  const handlePostTextStatus = async (e) => {
    e.preventDefault();
    if (!statusText.trim()) return;

    const payload = JSON.stringify({
      text: statusText.trim(),
      gradient: gradients[selectedGradIndex]
    });

    await uploadStatus(payload, "text");
    setStatusText("");
    setIsTextModalOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(20px)", background: "rgba(0,0,0,0.85)" }}
    >
      <motion.form 
        onSubmit={handlePostTextStatus}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border"
        style={{ background: gradients[selectedGradIndex], borderColor: "rgba(255,255,255,0.1)" }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <span className="text-white font-semibold text-sm">Write a status update</span>
          <button type="button" onClick={() => setIsTextModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Input Area */}
        <div className="p-8 flex flex-col items-center justify-center min-h-[220px]">
          <textarea
            value={statusText}
            onChange={(e) => setStatusText(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-transparent text-white text-xl font-bold leading-normal text-center placeholder:text-white/40 focus:outline-none resize-none overflow-y-auto no-scrollbar"
            maxLength={120}
            rows={4}
            autoFocus
          />
        </div>

        {/* Dynamic Gradient Selectors */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between gap-4" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="flex gap-2">
            {gradients.map((grad, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedGradIndex(idx)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${selectedGradIndex === idx ? "scale-110 border-white" : "border-transparent opacity-60"}`}
                style={{ background: grad }}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={!statusText.trim() || isUploading}
            className="bg-white text-black font-semibold text-sm px-5 py-2 rounded-full hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isUploading ? "Posting..." : "Share Status"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

// Separate component to handle internal state & layout of full screen viewer cleanly
export function StatusViewer() {
  const { activeStatus, setActiveStatus, markAsViewed } = useStatusStore();
  const { setStatusViewerOpen } = useChatStore();

  const statusViewerRef = useRef(null);
  
  // Real-time pausing states
  const [isPaused, setIsPaused] = useState(false);
  const [isHolding, setIsHolding] = useState(false);

  // Zoom state for image statuses
  const [imgZoom, setImgZoom]   = useState(1);
  const [imgOrigin, setImgOrigin] = useState({ x: 50, y: 50 });
  const pinchRef     = useRef(null); // { startDist, startZoom }
  const lastTapRef   = useRef(0);

  // Status Reply logic
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const inputRef = useRef(null);

  // Swipe-down-to-dismiss state
  const [dismissY, setDismissY]       = useState(0);  // live drag offset
  const [isDragging, setIsDragging]   = useState(false);
  const dismissRef = useRef(null);  // { startY, startX, locked }

  useEffect(() => {
    const el = statusViewerRef.current;
    if (!el) return;

    const onDismissStart = (e) => {
      if (imgZoom > 1) return;
      if (e.touches.length !== 1) return;
      dismissRef.current = { startY: e.touches[0].clientY, startX: e.touches[0].clientX, locked: null, lastY: 0 };
    };

    const onDismissMove = (e) => {
      if (!dismissRef.current || imgZoom > 1) return;
      const dy = e.touches[0].clientY - dismissRef.current.startY;
      const dx = e.touches[0].clientX - dismissRef.current.startX;
      if (!dismissRef.current.locked) {
        if (Math.abs(dy) > Math.abs(dx) && dy > 8) dismissRef.current.locked = "v";
        else if (Math.abs(dx) > 8) { dismissRef.current.locked = "h"; return; }
        else return;
      }
      if (dismissRef.current.locked !== "v") return;
      if (dy < 0) return; // only downward
      setDismissY(dy);
      setIsDragging(true);
      dismissRef.current.lastY = dy;
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const onDismissEnd = () => {
      if (!dismissRef.current) return;
      const finalY = dismissRef.current.lastY || 0;
      if (finalY > 90) {
        setActiveStatus(null);
      }
      setDismissY(0);
      setIsDragging(false);
      dismissRef.current = null;
    };

    el.addEventListener("touchstart", onDismissStart, { passive: true });
    el.addEventListener("touchmove", onDismissMove, { passive: false });
    el.addEventListener("touchend", onDismissEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onDismissStart);
      el.removeEventListener("touchmove", onDismissMove);
      el.removeEventListener("touchend", onDismissEnd);
    };
  }, [imgZoom, setIsDragging, setActiveStatus, setDismissY]);

  // Sync viewer open state with store so bottom nav gets hidden on mobile
  useEffect(() => {
    if (activeStatus) {
      setStatusViewerOpen(true);
    }
    return () => setStatusViewerOpen(false);
  }, [setStatusViewerOpen, activeStatus]);

  useEffect(() => {
    if (activeStatus && activeStatus.items && activeStatus.items[activeStatus.currentIndex]) {
      markAsViewed(activeStatus.items[activeStatus.currentIndex]._id);
    }
    // Reset zoom when navigating to a new status item
    setImgZoom(1);
    setImgOrigin({ x: 50, y: 50 });
  }, [activeStatus?.currentIndex, activeStatus, markAsViewed]);

  // Handle automatic progression (pauses when isPaused is true)
  useEffect(() => {
    if (!activeStatus || isPaused || isHolding) return;

    const timer = setTimeout(() => {
      if (activeStatus && activeStatus.currentIndex < activeStatus.items.length - 1) {
        setActiveStatus(prev => prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : null);
      } else {
        setActiveStatus(null);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [activeStatus?.currentIndex, activeStatus?.items?.length, isPaused, isHolding, setActiveStatus, activeStatus]);

  if (!activeStatus) return null;

  const currentItem = activeStatus.items[activeStatus.currentIndex];

  const handlePrev = (e) => {
    e.stopPropagation();
    if (activeStatus && activeStatus.currentIndex > 0) {
      setActiveStatus(prev => prev ? { ...prev, currentIndex: prev.currentIndex - 1 } : null);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (activeStatus && activeStatus.currentIndex < activeStatus.items.length - 1) {
      setActiveStatus(prev => prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : null);
    } else {
      setActiveStatus(null);
    }
  };

  // Safe pause triggers for input
  const handleInputChange = (e) => {
    const text = e.target.value;
    setReplyText(text);
    if (text.trim()) {
      setIsPaused(true);
    } else {
      setIsPaused(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeStatus) return;

    setSendingReply(true);
    try {
      let statusQuote = "";
      
      try {
        if (currentItem.type === "text" && currentItem.content.startsWith("{")) {
          statusQuote = JSON.parse(currentItem.content).text;
        } else {
          statusQuote = currentItem.type === "image" ? "📷 Status Photo" : currentItem.content;
        }
      } catch {
        statusQuote = currentItem.content;
      }

      const prefix = `*Replied to status:* "${statusQuote.slice(0, 40)}${statusQuote.length > 40 ? "..." : ""}"\n`;
      await axiosInstance.post(`/messages/send/${activeStatus.user._id}`, {
        text: `${prefix}${replyText.trim()}`
      });

      toast.success("Reply sent directly to chat!");
      setReplyText("");
      setIsPaused(false);
      inputRef.current?.blur();
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  // Safe parsed display logic
  const renderStatusBody = (status) => {
    if (status.type === "image") {
      return (
        <ImageStatusBody
          status={status}
          imgZoom={imgZoom}
          setImgZoom={setImgZoom}
          imgOrigin={imgOrigin}
          setImgOrigin={setImgOrigin}
          pinchRef={pinchRef}
          lastTapRef={lastTapRef}
          setIsHolding={setIsHolding}
        />
      );
    }

    let isJson = false;
    let parsed = {};
    try {
      if (status.content.startsWith("{")) {
        parsed = JSON.parse(status.content);
        isJson = true;
      }
    } catch (e) {
      // not valid JSON, treat content as plain text status
    }

    if (isJson) {
      return (
        <div className="w-full h-full flex items-center justify-center p-8" style={{ background: parsed.gradient || gradients[0] }}>
          <p className="text-white text-2xl font-bold leading-normal text-center select-none" style={{ wordBreak: 'break-word' }}>
            {parsed.text}
          </p>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <p className="text-white text-2xl font-semibold leading-normal text-center select-none" style={{ wordBreak: 'break-word' }}>
          {status.content}
        </p>
      </div>
    );
  };

  // Swipe-down dismiss handlers — logic handled natively via useEffect & statusViewerRef
  return (
    <motion.div 
      ref={statusViewerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#07080a] flex flex-col items-center justify-center sm:p-4 overscroll-none"
    >
      <style>{`
        @keyframes status-progression {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .status-progression-active {
          height: 100%;
          background-color: white;
          animation: status-progression 5s linear forwards;
        }
      `}</style>

      {/* Container — slides down live while dragging, opacity fades the backdrop */}
      <div
        className="relative w-full h-full sm:max-w-lg sm:h-auto sm:aspect-[9/16] bg-black sm:rounded-3xl overflow-hidden flex items-center justify-center text-center shadow-2xl sm:border sm:border-white/5"
        style={{
          transform: `translateY(${dismissY}px)`,
          transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
          opacity: 1 - Math.min(dismissY / 200, 0.6),
          willChange: "transform",
        }}>
        
        {/* Dynamic progress bars */}
        <div className={`absolute top-4 left-4 right-4 flex gap-1 z-40 transition-opacity duration-250 ${isHolding ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
          {activeStatus.items.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
              {i < activeStatus.currentIndex ? (
                <div className="h-full bg-white w-full" />
              ) : i === activeStatus.currentIndex ? (
                <div 
                  key={activeStatus.currentIndex}
                  className="status-progression-active"
                  style={{ animationPlayState: (isPaused || isHolding) ? "paused" : "running" }}
                />
              ) : (
                <div className="h-full bg-white w-0" />
              )}
            </div>
          ))}
        </div>

        {/* User Card Header - elegant slide & fade animation when holding */}
        <div className={`absolute top-8 left-4 flex items-center gap-3 z-40 transition-all duration-300 ${isHolding ? "opacity-0 -translate-y-2 pointer-events-none" : "opacity-100 translate-y-0"}`}>
          <img 
            src={activeStatus.user.profilePic || "/avatar.png"} 
            className="w-10 h-10 rounded-full object-cover border border-white/10" 
            alt={activeStatus.user.fullName} 
            referrerPolicy="no-referrer"
          />
          <div className="text-left">
            <p className="text-white font-semibold text-sm">{activeStatus.user.fullName}</p>
            <p className="text-white/60 text-xs mt-0.5">
              {new Date(currentItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
            </p>
          </div>
        </div>

        {/* Exit Button */}
        <button 
          className={`absolute top-8 right-4 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full z-50 transition-all duration-300 ${isHolding ? "opacity-0 -translate-y-2 pointer-events-none" : "opacity-100 translate-y-0"}`}
          onClick={() => setActiveStatus(null)}
        >
          <X size={16} />
        </button>

        {/* Content Body Viewer — hold to pause (text/non-image statuses use this; images manage their own hold) */}
        <div 
          className="w-full h-full cursor-pointer select-none"
          onMouseDown={() => { if (currentItem.type !== "image") setIsHolding(true); }}
          onMouseUp={() => { if (currentItem.type !== "image") setIsHolding(false); }}
          onMouseLeave={() => { if (currentItem.type !== "image") setIsHolding(false); }}
          onTouchStart={() => { if (currentItem.type !== "image") setIsHolding(true); }}
          onTouchEnd={() => { if (currentItem.type !== "image") setIsHolding(false); }}
        >
          {renderStatusBody(currentItem)}
        </div>

        {/* Left/Right manual tap controls — hidden while zoomed in so panning doesn't accidentally skip */}
        {imgZoom <= 1 && (
          <div className="absolute inset-x-0 inset-y-16 flex z-30">
            <div className="w-1/4 h-full cursor-pointer" onClick={handlePrev} />
            <div className="w-2/4 h-full cursor-pointer" />
            <div className="w-1/4 h-full cursor-pointer" onClick={handleNext} />
          </div>
        )}

        {/* Status reply input section - fades away cleanly on hold for premium, zero-distraction view */}
        <form 
          onSubmit={handleSendReply} 
          className={`absolute bottom-6 left-4 right-4 z-50 flex gap-2 transition-all duration-300 ${isHolding ? "opacity-0 translate-y-2 pointer-events-none" : "opacity-100 translate-y-0"}`} 
          onClick={e => e.stopPropagation()}
        >
          <input
            type="text"
            ref={inputRef}
            placeholder="Type a reply..."
            value={replyText}
            onChange={handleInputChange}
            onFocus={() => setIsPaused(true)}
            onBlur={() => { if (!replyText.trim()) setIsPaused(false); }}
            className="flex-1 bg-white/10 text-white rounded-full px-5 py-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-[#00a884] placeholder:text-white/40 border border-white/10"
          />
          <button
            type="submit"
            disabled={!replyText.trim() || sendingReply}
            className="bg-[#00a884] hover:bg-[#008f72] text-white p-2.5 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4 rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function ImageStatusBody({ status, imgZoom, setImgZoom, imgOrigin, setImgOrigin, pinchRef, lastTapRef, setIsHolding }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleImgTouchStart = (e) => {
      setIsHolding(true);
      e.stopPropagation();

      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchRef.current = { startDist: Math.hypot(dx, dy), startZoom: imgZoom };
        if (e.cancelable) e.preventDefault();
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          setImgZoom(prev => {
            const next = prev > 1 ? 1 : 2.5;
            if (next === 1) setTimeout(() => setIsHolding(false), 150);
            return next;
          });
          lastTapRef.current = 0;
        } else {
          lastTapRef.current = now;
        }
      }
    };

    const handleImgTouchMove = (e) => {
      e.stopPropagation();
      if (e.touches.length === 2 && pinchRef.current) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const ratio = dist / pinchRef.current.startDist;
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const rect = el.getBoundingClientRect();
        setImgOrigin({
          x: ((midX - rect.left) / rect.width) * 100,
          y: ((midY - rect.top) / rect.height) * 100,
        });
        setImgZoom(Math.min(5, Math.max(1, pinchRef.current.startZoom * ratio)));
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleImgTouchEnd = (e) => {
      e.stopPropagation();
      pinchRef.current = null;
      setImgZoom(prev => {
        if (prev <= 1) {
          setTimeout(() => setIsHolding(false), 0);
        }
        return prev;
      });
    };

    el.addEventListener("touchstart", handleImgTouchStart, { passive: false });
    el.addEventListener("touchmove", handleImgTouchMove, { passive: false });
    el.addEventListener("touchend", handleImgTouchEnd, { passive: false });

    return () => {
      el.removeEventListener("touchstart", handleImgTouchStart);
      el.removeEventListener("touchmove", handleImgTouchMove);
      el.removeEventListener("touchend", handleImgTouchEnd);
    };
  }, [imgZoom, setImgZoom, imgOrigin, setImgOrigin, setIsHolding, pinchRef, lastTapRef]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden"
      onMouseDown={(e) => { setIsHolding(true); e.stopPropagation(); }}
      onMouseUp={(e) => { setIsHolding(false); e.stopPropagation(); }}
      onMouseLeave={(e) => { setIsHolding(false); e.stopPropagation(); }}
      style={{ touchAction: imgZoom > 1 ? "none" : "pan-y" }}
    >
      <img
        src={status.content}
        className="w-full h-full select-none"
        alt="Status"
        draggable={false}
        style={{
          objectFit: "contain",
          transform: `scale(${imgZoom})`,
          transformOrigin: `${imgOrigin.x}% ${imgOrigin.y}%`,
          transition: pinchRef.current ? "none" : "transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94)",
          cursor: imgZoom > 1 ? "zoom-out" : "default",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onDoubleClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setImgOrigin({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
          });
          setImgZoom(prev => {
            const next = prev > 1 ? 1 : 2.5;
            if (next === 1) setTimeout(() => setIsHolding(false), 150);
            return next;
          });
        }}
      />
    </div>
  );
}

