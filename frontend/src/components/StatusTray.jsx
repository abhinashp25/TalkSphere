import { useEffect, useState, useRef } from "react";
import { Plus, Camera, Type, X, ChevronRight } from "lucide-react";
import { useStatusStore } from "../store/useStatusStore";
import { useAuthStore } from "../store/useAuthStore";
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

export default function StatusTray() {
  const { statuses, fetchStatuses, uploadStatus, isUploading } = useStatusStore();
  const { authUser } = useAuthStore();
  const [activeStatus, setActiveStatus] = useState(null);
  
  // Local viewed statuses tracking
  const [viewedIds, setViewedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("chatify-viewed-statuses") || "[]"));
    } catch {
      return new Set();
    }
  });

  // Modal forms
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [selectedGradIndex, setSelectedGradIndex] = useState(0);

  const fileInputRef = useRef(null);

  const gradients = [
    "linear-gradient(135deg, #120c1f 0%, #201335 100%)",
    "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
    "linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)",
    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)"
  ];

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const markAsViewed = (id) => {
    setViewedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("chatify-viewed-statuses", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Group statuses by user
  const groupedStatuses = statuses.reduce((acc, status) => {
    if (!status.userId || !status.userId._id) return acc;
    const userId = status.userId._id;
    if (!acc[userId]) acc[userId] = { user: status.userId, items: [] };
    acc[userId].items.push(status);
    return acc;
  }, {});

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

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      await uploadStatus(reader.result, "image");
    };
    reader.readAsDataURL(file);
  };

  // Status Reply logic
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeStatus) return;

    setSendingReply(true);
    try {
      const currentItem = activeStatus.items[activeStatus.currentIndex];
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
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  // Safe parsed display logic
  const renderStatusBody = (status) => {
    if (status.type === "image") {
      return <img src={status.content} className="w-full h-full object-contain" alt="Status" />;
    }

    let isJson = false;
    let parsed = {};
    try {
      if (status.content.startsWith("{")) {
        parsed = JSON.parse(status.content);
        isJson = true;
      }
    } catch {}

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
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        
        {/* My Status Section Card */}
        <div className="rounded-2xl p-4 flex items-center justify-between border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="relative w-[52px] h-[52px]">
              <img src={authUser?.profilePic || "/avatar.png"} alt="me" className="w-full h-full rounded-2xl object-cover border" style={{ borderColor: "var(--border)" }} />
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
                        <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="w-full h-full object-cover" />
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
                        {new Date(items[items.length - 1].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

      {/* Write Rich Text Status Modal */}
      <AnimatePresence>
        {isTextModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
        )}
      </AnimatePresence>

      {/* Advanced Full-Screen Status Viewer Modal with Auto 5s Progression */}
      <AnimatePresence>
        {activeStatus && (
          <StatusViewer 
            activeStatus={activeStatus} 
            setActiveStatus={setActiveStatus} 
            markAsViewed={markAsViewed}
            replyText={replyText}
            setReplyText={setReplyText}
            handleSendReply={handleSendReply}
            sendingReply={sendingReply}
            renderStatusBody={renderStatusBody}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Separate component to handle internal state & layout of full screen viewer cleanly
function StatusViewer({ 
  activeStatus, 
  setActiveStatus, 
  markAsViewed, 
  replyText, 
  setReplyText, 
  handleSendReply, 
  sendingReply, 
  renderStatusBody 
}) {
  const currentItem = activeStatus.items[activeStatus.currentIndex];

  useEffect(() => {
    if (currentItem) {
      markAsViewed(currentItem._id);
    }
  }, [activeStatus.currentIndex, currentItem]);

  // Handle 5-second automatic progression
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeStatus.currentIndex < activeStatus.items.length - 1) {
        setActiveStatus(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
      } else {
        setActiveStatus(null);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [activeStatus.currentIndex, activeStatus.items.length]);

  const handlePrev = (e) => {
    e.stopPropagation();
    if (activeStatus.currentIndex > 0) {
      setActiveStatus(prev => ({ ...prev, currentIndex: prev.currentIndex - 1 }));
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (activeStatus.currentIndex < activeStatus.items.length - 1) {
      setActiveStatus(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    } else {
      setActiveStatus(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#07080a] flex flex-col items-center justify-center p-4"
    >
      {/* Container holding layout */}
      <div className="relative max-w-lg w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden flex items-center justify-center text-center shadow-2xl border border-white/5">
        
        {/* Dynamic progress bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-40">
          {activeStatus.items.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
              {i < activeStatus.currentIndex ? (
                <div className="h-full bg-white w-full" />
              ) : i === activeStatus.currentIndex ? (
                <motion.div 
                  key={activeStatus.currentIndex}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="h-full bg-white"
                />
              ) : (
                <div className="h-full bg-white w-0" />
              )}
            </div>
          ))}
        </div>

        {/* User Card Header */}
        <div className="absolute top-8 left-4 flex items-center gap-3 z-40">
          <img 
            src={activeStatus.user.profilePic || "/avatar.png"} 
            className="w-10 h-10 rounded-full object-cover border border-white/10" 
            alt={activeStatus.user.fullName} 
          />
          <div className="text-left">
            <p className="text-white font-semibold text-sm">{activeStatus.user.fullName}</p>
            <p className="text-white/60 text-xs mt-0.5">
              {new Date(currentItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Exit Button */}
        <button 
          className="absolute top-8 right-4 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full z-50 transition-colors"
          onClick={() => setActiveStatus(null)}
        >
          <X size={16} />
        </button>

        {/* Content Body Viewer */}
        <div className="w-full h-full">
          {renderStatusBody(currentItem)}
        </div>

        {/* Left/Right manual tap controls */}
        <div className="absolute inset-x-0 inset-y-16 flex z-30">
          <div className="w-1/2 h-full cursor-pointer" onClick={handlePrev} />
          <div className="w-1/2 h-full cursor-pointer" onClick={handleNext} />
        </div>

        {/* Status reply input section */}
        <form onSubmit={handleSendReply} className="absolute bottom-6 left-4 right-4 z-50 flex gap-2" onClick={e => e.stopPropagation()}>
          <input
            type="text"
            placeholder="Type a reply..."
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
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
