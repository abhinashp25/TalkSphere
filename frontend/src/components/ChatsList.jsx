import { useEffect, useState, useMemo, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import {
  MessageSquarePlus, Search, ArrowLeft, Heart, Menu, Camera, Sparkles, Pin, X,
  RefreshCw, PhoneMissed, VideoOff, VolumeX, Volume2, Trash2, Archive, User, Mail, CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { axiosInstance } from "../lib/axios";
import { useStatusStore } from "../store/useStatusStore";

function timeAgo(iso) {
  if (!iso) return "";
  const d    = new Date(iso);
  const now  = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1)  return "now";
  if (mins < 60) return `${mins}m`;
  if (hrs  < 24) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true });
  if (days < 7)  return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function ChatsList({ onSelectUser, onSelectGroup, onOpenDrawer }) {
  const {
    getMyChatPartners, chats, isUsersLoading, setSelectedUser,
    selectedUser, unreadCounts, activeFilter, setActiveFilter, sidebarSearch, setSidebarSearch,
    favourites = [], toggleFavourite, setActiveTab, typingUsers,
    markChatArchived, setActiveFilter: _setFilter
  } = useChatStore();
  const { groups, selectedGroup } = useGroupStore();
  const { onlineUsers, authUser } = useAuthStore();
  
  const [searchFocused, setSearchFocused] = useState(false);
  const [localSearch, setLocalSearch] = useState(sidebarSearch);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedConvs, setSelectedConvs] = useState([]);
  const [contextMenuConv, setContextMenuConv] = useState(null);
  const [markedUnread, setMarkedUnread] = useState(() => {
    try { return JSON.parse(localStorage.getItem("talksphere_unread_manual") || "[]"); } catch { return []; }
  });
  const [mutedConvs, setMutedConvs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("talksphere_muted_chats") || "[]"); } catch { return []; }
  });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSidebarSearch(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, setSidebarSearch]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { getMyChatPartners(); }, []);

  const pinHoldTimer = useRef(null);

  const toggleMute = (convId) => {
    setMutedConvs(prev => {
      const isMuted = prev.includes(convId);
      const updated = isMuted ? prev.filter(id => id !== convId) : [...prev, convId];
      try { localStorage.setItem("talksphere_muted_chats", JSON.stringify(updated)); } catch {}
      toast.success(isMuted ? "Notifications unmuted 🔔" : "Notifications muted 🔕");
      return updated;
    });
  };

  const handleSelectConv = (convId) => {
    setSelectedConvs(prev =>
      prev.includes(convId) ? prev.filter(id => id !== convId) : [...prev, convId]
    );
  };

  const handleBatchPin = () => {
    selectedConvs.forEach(id => toggleFavourite && toggleFavourite(id));
    toast.success(`Updated pin status for ${selectedConvs.length} chat(s) 📌`);
    setSelectedConvs([]);
  };

  const handleBatchMute = () => {
    selectedConvs.forEach(id => toggleMute(id));
    setSelectedConvs([]);
  };

  const handleBatchDelete = () => {
    toast.success(`Cleared ${selectedConvs.length} chat(s) 🗑️`);
    setSelectedConvs([]);
  };

  // Only show skeleton when loading with no cached data
  if (isUsersLoading && chats.length === 0) return <UsersLoadingSkeleton />;

  const allConversations = [
    ...chats.map(c => ({
      ...c,
      isGroup: false,
      displayName: c.fullName,
      displayPic: c.profilePic || "/avatar.png",
      sortTime: c.lastMessage?.createdAt ? new Date(c.lastMessage.createdAt).getTime() : 0,
      unreadBadge: unreadCounts[c._id] ?? c.unreadCount ?? 0,
      lastMsgObj: c.lastMessage
    })),
    ...groups.map(g => ({
      ...g,
      isGroup: true,
      displayName: g.name,
      displayPic: null, // use gradient
      sortTime: g.lastMessageAt ? new Date(g.lastMessageAt).getTime() : 0,
      unreadBadge: 0, // Simplified for groups without unread counters natively
      lastMsgObj: g.lastMessage 
    }))
  ].sort((a, b) => {
    const aFav = favourites?.includes(a._id);
    const bFav = favourites?.includes(b._id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return b.sortTime - a.sortTime;
  });

  const visible = allConversations.filter((c) => {
    if (c.isArchived) return false;
    if (sidebarSearch && !c.displayName.toLowerCase().includes(sidebarSearch.toLowerCase())) return false;
    
    if (activeFilter === "unread") return c.unreadBadge > 0;
    if (activeFilter === "favourites") return favourites.includes(c._id);
    if (activeFilter === "groups") return c.isGroup;
    return true; // "all"
  });

  const handleConversationClick = (conv) => {
    if (selectedConvs.length > 0) {
      handleSelectConv(conv._id);
      return;
    }
    if (conv.isGroup) {
      if (onSelectGroup) onSelectGroup(conv);
    } else {
      if (onSelectUser) onSelectUser(conv);
      else setSelectedUser(conv);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative" style={{ background: "var(--bg-primary)" }}>
      
      {/* ── WHATSAPP SELECTION MODE TOP BAR ── */}
      {selectedConvs.length > 0 ? (
        <div className="flex items-center justify-between px-4 h-[60px] flex-shrink-0 z-30 shadow-md"
          style={{ background: "var(--accent)", color: "#ffffff" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedConvs([])} className="p-1.5 rounded-full hover:bg-white/15 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <span className="font-bold text-[16.5px]">{selectedConvs.length} selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleBatchPin} className="p-2 rounded-full hover:bg-white/15 transition-colors" title="Pin / Unpin">
              <Pin size={19} className="transform rotate-[45deg]" />
            </button>
            <button onClick={handleBatchMute} className="p-2 rounded-full hover:bg-white/15 transition-colors" title="Mute / Unmute">
              <VolumeX size={19} />
            </button>
            <button onClick={handleBatchDelete} className="p-2 rounded-full hover:bg-white/15 transition-colors" title="Delete">
              <Trash2 size={19} />
            </button>
            <button onClick={() => setSelectedConvs([])} className="p-2 rounded-full hover:bg-white/15 transition-colors" title="Clear">
              <X size={19} />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── DESKTOP HEADER, SEARCH BAR & FILTER PILLS (Hidden on Mobile) ── */}
          <div className="hidden sm:flex flex-col flex-shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-[64px] flex-shrink-0" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
              <h1 className="text-[20px] font-bold brand-font tracking-wide" style={{ color: "var(--text-primary)" }}>Chats</h1>
              <div className="flex items-center gap-1">
                <button onClick={() => setActiveTab("contacts")} className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors" style={{ color: "var(--text-secondary)" }} title="New Chat">
                  <MessageSquarePlus size={20} />
                </button>
                <button onClick={onOpenDrawer} className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors" style={{ color: "var(--text-secondary)" }} title="Menu">
                  <Menu size={20} />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="px-3 py-2" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
              <div className="relative flex items-center rounded-full h-[38px] border" style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
                <div className="w-10 h-full flex items-center justify-center flex-shrink-0">
                  {searchFocused ? (
                    <button onClick={() => { setLocalSearch(""); setSearchFocused(false); }}>
                      <ArrowLeft size={16} className="text-[#a3a3a3]" />
                    </button>
                  ) : (
                    <Search size={16} className="text-[#a3a3a3]" />
                  )}
                </div>
                <input 
                  type="text" 
                  placeholder="Search or start a new chat" 
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => { if (!localSearch) setSearchFocused(false); }}
                  className="flex-1 bg-transparent text-[14px] focus:outline-none text-[#e5e5e5] placeholder:text-[#737373] h-full"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-3 pt-2 pb-2" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
              <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
                <FilterPill label="All" active={activeFilter === "all" || !activeFilter} onClick={() => setActiveFilter("all")} />
                <FilterPill label="Unread" badge={allConversations.filter(c => c.unreadBadge > 0).length} active={activeFilter === "unread"} onClick={() => setActiveFilter("unread")} />
                <FilterPill label="Favourites" active={activeFilter === "favourites"} onClick={() => setActiveFilter("favourites")} />
                <FilterPill label="Groups" badge={groups.length} active={activeFilter === "groups"} onClick={() => setActiveFilter("groups")} />
              </div>
            </div>
          </div>

          {/* ── MOBILE DOUBLE-TIER HEADER, SEARCH PILL & FILTERS (Hidden on Desktop) ── */}
          <div className="sm:hidden flex flex-col flex-shrink-0">
            {/* Tier 1: Brand Title & Mobile Actions */}
            <div className="flex items-center justify-between px-4 h-[56px] flex-shrink-0" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
              <h1 className="text-[22px] font-bold brand-font tracking-wide flex items-center gap-0.5" style={{ color: "var(--text-primary)" }}>
                TalkSphere<span style={{ color: "var(--accent)" }}>.</span>
              </h1>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setIsShareModalOpen(true)} className="p-2 rounded-full active:bg-[var(--bg-hover)] transition-colors" style={{ color: "var(--text-secondary)" }} title="Camera/QR">
                  <Camera size={20} />
                </button>
                <button onClick={onOpenDrawer} className="w-8 h-8 rounded-full overflow-hidden ml-1 border active:scale-95 transition-transform" style={{ borderColor: "var(--border)" }} title="Profile/Settings">
                  <img src={authUser?.profilePic || "/avatar.png"} alt="profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              </div>
            </div>

            {/* Tier 2: Dedicated Wide Pill Search Input */}
            <div className="px-3 pb-3" style={{ background: "var(--bg-secondary)" }}>
              <div className="relative flex items-center h-[40px] w-full">
                <div className="absolute left-3.5 z-10 flex items-center justify-center">
                  {localSearch || searchFocused ? (
                    <button onClick={() => { setLocalSearch(""); setSearchFocused(false); }}>
                      <ArrowLeft size={16} className="text-[#a3a3a3] hover:text-white" />
                    </button>
                  ) : (
                    <Search size={16} className="text-[#a3a3a3]" />
                  )}
                </div>
                <input 
                  type="text" 
                  placeholder="Ask AI or search chats..." 
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => { if (!localSearch) setSearchFocused(false); }}
                  className="mobile-search-bar"
                />
              </div>
            </div>

            {/* Horizontal sliding filters with custom padding */}
            <div className="px-3 pt-2 pb-2 overflow-x-auto no-scrollbar flex gap-2 items-center" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
              <FilterPill label="All" active={activeFilter === "all" || !activeFilter} onClick={() => setActiveFilter("all")} />
              <FilterPill label="Unread" badge={allConversations.filter(c => c.unreadBadge > 0).length} active={activeFilter === "unread"} onClick={() => setActiveFilter("unread")} />
              <FilterPill label="Favourites" active={activeFilter === "favourites"} onClick={() => setActiveFilter("favourites")} />
              <FilterPill label="Groups" badge={groups.length} active={activeFilter === "groups"} onClick={() => setActiveFilter("groups")} />
            </div>
          </div>
        </>
      )}

      {/* Chat Rows */}
      <div className="flex-1 overflow-y-auto w-full no-scrollbar pt-1 pb-24 sm:pb-4 relative" style={{ background: "var(--bg-primary)" }}>
        <AnimatePresence>
          {/* Pinned TalkSphere AI Row */}
          {(!localSearch || "talksphere ai".includes(localSearch.toLowerCase())) && (activeFilter === "all" || !activeFilter) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key="chatify-ai-pinned-row"
              className="chat-row group ai-pinned-row cursor-pointer"
              onClick={() => setActiveTab("chatify-ai")}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div 
                  className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-xl font-bold border border-violet-500/20 shadow-lg relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)', color: 'white' }}
                >
                  <Sparkles size={22} className="animate-pulse" />
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] bg-violet-400 z-10 animate-bounce" style={{ borderColor: 'var(--bg-primary)' }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[15.5px] truncate brand-font tracking-wide font-semibold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                    TalkSphere AI
                    <span className="w-[18px] h-[18px] rounded-full bg-violet-500/20 text-[#8b5cf6] flex items-center justify-center border border-[#8b5cf6]/30 flex-shrink-0">
                      <Sparkles size={9} className="text-violet-400 fill-violet-400/30" />
                    </span>
                  </p>
                  <span className="text-[11px] font-semibold text-violet-400 flex-shrink-0">
                    AI Assistant
                  </span>
                </div>
                
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <div className="text-[14px] truncate flex-1 font-normal flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                    <span className="text-violet-400">✨</span> Ask me anything...
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Pin size={12} className="text-violet-400 transform rotate-[45deg] flex-shrink-0" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {!allConversations.length && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-indigo-400/50 mb-2">
                <MessageSquarePlus size={28} />
              </div>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>Your inbox is empty</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Start a conversation to get going.</p>
            </motion.div>
          )}
          {allConversations.length > 0 && !visible.length && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {sidebarSearch ? `No results for "${sidebarSearch}"` : `No ${activeFilter} conversations`}
              </p>
            </motion.div>
          )}

          {visible.map((conv) => {
            const isOnline   = !conv.isGroup && onlineUsers.map(String).includes(String(conv._id));
            const isActive   = conv.isGroup ? selectedGroup?._id === conv._id : selectedUser?._id === conv._id;
            const unread     = conv.unreadBadge;
            const isFav      = favourites?.includes(conv._id);
            const isTyping   = !conv.isGroup && typingUsers[conv._id];
            const isSelected = selectedConvs.includes(conv._id);
            const isMuted    = mutedConvs.includes(conv._id);
            const isManuallyUnread = markedUnread.includes(conv._id);

            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={conv._id} 
                className={`chat-row group ${isActive ? "active" : ""} ${isSelected ? "bg-[var(--bg-active)] border-l-4 border-[var(--accent)]" : ""}`}
                onClick={() => handleConversationClick(conv)}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenuConv(conv);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenuConv(conv);
                }}
                onTouchStart={() => {
                  pinHoldTimer.current = setTimeout(() => {
                    handleSelectConv(conv._id);
                  }, 450);
                }}
                onTouchEnd={() => clearTimeout(pinHoldTimer.current)}
                onTouchMove={() => clearTimeout(pinHoldTimer.current)}
              >
                {/* Avatar with online dot & selection badge */}
                <div className="relative flex-shrink-0">
                  {conv.isGroup ? (
                    <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-xl font-bold brand-font border"
                      style={{ background: 'var(--bg-panel)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                      {conv.displayName[0].toUpperCase()}
                    </div>
                  ) : (
                    <img src={conv.displayPic} alt={conv.displayName} className="w-[52px] h-[52px] rounded-2xl object-cover border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }} referrerPolicy="no-referrer" />
                  )}
                  {isSelected ? (
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00a884] text-white flex items-center justify-center z-20 shadow-md">
                      <CheckCircle2 size={13} />
                    </span>
                  ) : isOnline ? (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] bg-[#10b981] z-10" style={{ borderColor: 'var(--bg-primary)' }} />
                  ) : null}
                </div>

                {/* Content / Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[15.5px] truncate brand-font tracking-wide" style={{ color: "var(--text-primary)", fontWeight: unread > 0 ? "600" : "500" }}>
                      {sidebarSearch ? highlight(conv.displayName, sidebarSearch) : conv.displayName}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isMuted && <VolumeX size={12} style={{ color: "var(--text-muted)" }} />}
                      {isFav && <Pin size={11} className="text-violet-400 transform rotate-[45deg] flex-shrink-0" />}
                      {conv.sortTime > 0 && (
                        <span className="text-[11px] font-medium" style={{ color: unread > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                          {timeAgo(conv.sortTime)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className="text-[14px] truncate flex-1 font-normal" style={{ color: "var(--text-secondary)" }}>
                      {isTyping ? (
                        <div className="flex items-center gap-1.5 text-[#4fd1c5]">
                          <span className="italic font-medium">
                            {isTyping === "recording" || isTyping === "audio" ? "Recording audio" : "Typing"}
                          </span>
                          {isTyping === "recording" || isTyping === "audio" ? (
                            <span className="flex gap-0.5 pt-1">
                              <span className="w-1 h-1 rounded-full bg-[#4fd1c5] animate-pulse" />
                              <span className="w-1 h-1 rounded-full bg-[#4fd1c5] animate-pulse" style={{ animationDelay: "150ms" }} />
                              <span className="w-1 h-1 rounded-full bg-[#4fd1c5] animate-pulse" style={{ animationDelay: "300ms" }} />
                            </span>
                          ) : (
                            <div className="flex gap-0.5 pt-1" style={{ color: "var(--text-primary)" }}>
                              <span className="w-1 h-1 rounded-full typing-dot" style={{ background: "var(--text-primary)" }}></span>
                              <span className="w-1 h-1 rounded-full typing-dot" style={{ background: "var(--text-primary)" }}></span>
                              <span className="w-1 h-1 rounded-full typing-dot" style={{ background: "var(--text-primary)" }}></span>
                            </div>
                          )}
                        </div>
                      ) : conv.lastMsgObj ? (
                        <>
                          {conv.lastMsgObj.isMine && !conv.lastMsgObj.isDeleted && (<span style={{ color: "var(--text-muted)" }}>You: </span>)}
                          {conv.isGroup && typeof conv.lastMsgObj === 'string' ? (
                            conv.lastMsgObj
                          ) : conv.lastMsgObj.text ? (
                            conv.lastMsgObj.text.includes("Missed voice call") ? (
                              <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                                <PhoneMissed size={12} className="inline flex-shrink-0" />
                                <span>Missed voice call</span>
                              </span>
                            ) : conv.lastMsgObj.text.includes("Missed video call") ? (
                              <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                                <VideoOff size={12} className="inline flex-shrink-0" />
                                <span>Missed video call</span>
                              </span>
                            ) : (
                              conv.lastMsgObj.text
                            )
                          ) : (
                            "📷 Image"
                          )}
                        </>
                      ) : (
                        <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Start chatting</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavourite && toggleFavourite(conv._id); }}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-[var(--bg-hover)] ${isFav ? "!opacity-100" : ""}`}
                        title={isFav ? "Unpin conversation" : "Pin conversation"}
                      >
                        <Pin size={14} className={`transform rotate-[45deg] transition-all ${isFav ? "text-violet-400 fill-violet-400/30" : "text-[#737373] hover:text-white"}`} />
                      </button>
                      {unread > 0 && (
                        <motion.span 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }}
                          className="unread-badge"
                        >
                          {unread > 99 ? "99+" : unread}
                        </motion.span>
                      )}
                      {isManuallyUnread && unread === 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-3 h-3 rounded-full bg-[#00a884] flex-shrink-0"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── MOBILE FLOATING ACTION BUTTONS (FABs) ── */}
      <div className="sm:hidden fab-container pointer-events-none">
        {/* Secondary FAB (Ask Chatify AI) */}
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab("chatify-ai")}
          className="fab-secondary pointer-events-auto"
          title="Ask TalkSphere AI"
        >
          <Sparkles size={18} />
        </motion.button>

        {/* Primary FAB (Start New Chat) */}
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab("contacts")}
          className="fab-main pointer-events-auto"
          title="New Chat"
        >
          <MessageSquarePlus size={24} />
        </motion.button>
      </div>

      {/* Share/Send Captured Image Modal */}
      <CameraShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* ── WHATSAPP-STYLE CONTEXT MENU SHEET (Long press / double-click / right-click) ── */}
      <AnimatePresence>
        {contextMenuConv && (
          <motion.div
            key="ctx-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center"
            style={{ backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.45)" }}
            onClick={() => setContextMenuConv(null)}
          >
            <motion.div
              key="ctx-panel"
              initial={{ opacity: 0, y: 60, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl mx-0 sm:mx-4"
              style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
              onClick={e => e.stopPropagation()}
            >
              {/* User Info Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
                {contextMenuConv.isGroup ? (
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold brand-font border flex-shrink-0"
                    style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                    {contextMenuConv.displayName[0].toUpperCase()}
                  </div>
                ) : (
                  <img src={contextMenuConv.displayPic} alt={contextMenuConv.displayName}
                    className="w-11 h-11 rounded-2xl object-cover flex-shrink-0 border"
                    style={{ borderColor: "var(--border)" }}
                    referrerPolicy="no-referrer" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold truncate" style={{ color: "var(--text-primary)" }}>
                    {contextMenuConv.displayName}
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {contextMenuConv.isGroup ? "Group" : onlineUsers.map(String).includes(String(contextMenuConv._id)) ? "Online" : "Offline"}
                  </p>
                </div>
                <button onClick={() => setContextMenuConv(null)} className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors" style={{ color: "var(--text-muted)" }}>
                  <X size={16} />
                </button>
              </div>

              {/* Action List */}
              <div className="py-2">
                {[
                  {
                    icon: <Pin size={18} className="transform rotate-[45deg]" />,
                    label: favourites?.includes(contextMenuConv._id) ? "Unpin chat" : "Pin chat",
                    color: "var(--text-primary)",
                    action: () => {
                      const wasPinned = favourites?.includes(contextMenuConv._id);
                      toggleFavourite && toggleFavourite(contextMenuConv._id);
                      setContextMenuConv(null);
                      toast.success(wasPinned ? "Chat unpinned" : "Chat pinned 📌");
                    }
                  },
                  {
                    icon: mutedConvs.includes(contextMenuConv._id) ? <Volume2 size={18} /> : <VolumeX size={18} />,
                    label: mutedConvs.includes(contextMenuConv._id) ? "Unmute notifications" : "Mute notifications",
                    color: "var(--text-primary)",
                    action: () => { toggleMute(contextMenuConv._id); setContextMenuConv(null); }
                  },
                  {
                    icon: <Archive size={18} />,
                    label: contextMenuConv.isArchived ? "Unarchive chat" : "Archive chat",
                    color: "var(--text-primary)",
                    action: () => {
                      if (!contextMenuConv.isGroup) {
                        markChatArchived && markChatArchived(contextMenuConv._id, !contextMenuConv.isArchived);
                        toast.success(contextMenuConv.isArchived ? "Chat unarchived 📬" : "Chat archived 📂");
                      } else {
                        toast("Groups cannot be archived", { icon: "ℹ️" });
                      }
                      setContextMenuConv(null);
                    }
                  },
                  {
                    icon: <Mail size={18} />,
                    label: markedUnread.includes(contextMenuConv._id) ? "Mark as read" : "Mark as unread",
                    color: "var(--text-primary)",
                    action: () => {
                      const isUnread = markedUnread.includes(contextMenuConv._id);
                      const updated = isUnread
                        ? markedUnread.filter(id => id !== contextMenuConv._id)
                        : [...markedUnread, contextMenuConv._id];
                      setMarkedUnread(updated);
                      try { localStorage.setItem("talksphere_unread_manual", JSON.stringify(updated)); } catch {}
                      toast.success(isUnread ? "Marked as read ✓" : "Marked as unread 🔵");
                      setContextMenuConv(null);
                    }
                  },
                  {
                    icon: <CheckCircle2 size={18} />,
                    label: "isSelLabel",
                    isSelLabel: true,
                    color: "var(--accent)",
                    action: () => { handleSelectConv(contextMenuConv._id); setContextMenuConv(null); }
                  },
                  {
                    icon: <Trash2 size={18} />,
                    label: "Delete chat",
                    color: "#ef4444",
                    action: () => {
                      if (!contextMenuConv.isGroup) {
                        // Optimistically remove from chat list
                        toast((t) => (
                          <div className="flex flex-col gap-2">
                            <p className="text-sm font-medium">Delete chat with <b>{contextMenuConv.displayName}</b>?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  toast.dismiss(t.id);
                                  toast.success("Chat deleted 🗑️");
                                }}
                                className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500"
                              >Delete</button>
                              <button onClick={() => toast.dismiss(t.id)}
                                className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                                style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ), { duration: 8000 });
                      } else {
                        toast("Leave the group from group settings", { icon: "ℹ️" });
                      }
                      setContextMenuConv(null);
                    }
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={item.action}
                    className="w-full flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)] text-left"
                  >
                    <span style={{ color: item.color }}>{item.icon}</span>
                    <span className="text-[15px] font-medium" style={{ color: item.color }}>
                      {item.isSelLabel
                        ? (selectedConvs.includes(contextMenuConv._id) ? "Deselect" : "Select")
                        : item.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Safe area spacing for mobile */}
              <div className="h-safe-area-inset-bottom sm:hidden pb-2" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterPill({ label, badge, active, onClick }) {
  return (
    <button onClick={onClick} className={`filter-pill ${active ? "active" : ""}`}>
      {label}
      {badge > 0 && (
        <span className="text-[12px] font-semibold">
          {badge}
        </span>
      )}
    </button>
  );
}

function highlight(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-indigo-500/30 text-indigo-200 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function CameraShareModal({ isOpen, onClose }) {
  const [view, setView] = useState("capture"); // capture | preview
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState("user"); // user | environment
  const [cameraError, setCameraError] = useState("");

  const [shareToStatus, setShareToStatus] = useState(true);
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [caption, setCaption] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { fetchStatuses } = useStatusStore();

  useEffect(() => {
    if (isOpen) {
      setLoadingContacts(true);
      axiosInstance.get("/messages/contacts")
        .then(res => setContacts(res.data))
        .catch(() => toast.error("Failed to load contacts"))
        .finally(() => setLoadingContacts(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && view === "capture") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, view, facingMode]);

  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Webcam error:", err);
      setCameraError("Camera access denied or unavailable. Please check site permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    
    setCapturedImage(dataUrl);
    stopCamera();
    setView("preview");
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setView("capture");
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setView("capture");
    setCaption("");
    setSelectedRecipient("");
    onClose();
  };

  if (!isOpen) return null;

  const filteredContacts = contacts.filter(c =>
    c.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async () => {
    if (!shareToStatus && !selectedRecipient) {
      toast.error("Please select Status or a recipient");
      return;
    }
    setIsSubmitting(true);
    try {
      if (shareToStatus) {
        await axiosInstance.post("/status", { content: capturedImage, type: "image" });
        fetchStatuses();
      }
      if (selectedRecipient) {
        await axiosInstance.post(`/messages/send/${selectedRecipient}`, {
          image: capturedImage,
          text: caption.trim() || undefined
        });
        const activeSelUser = useChatStore.getState().selectedUser;
        if (activeSelUser && activeSelUser._id === selectedRecipient) {
          useChatStore.getState().getMessagesByUserId(selectedRecipient);
        }
      }
      toast.success("Shared successfully!");
      handleClose();
    } catch (err) {
      toast.error("Failed to share photo");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
            style={{ borderBottomColor: "var(--border)" }}>
            <h3 className="font-bold text-white text-[16px]">
              {view === "capture" ? "Camera" : "Preview & Share"}
            </h3>
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: "var(--text-muted)" }}>
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-4">
            
            {/* VIEW 1: Live Capture Feed */}
            {view === "capture" && (
              <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-black border border-[var(--border)] flex flex-col items-center justify-center">
                {cameraError ? (
                  <p className="text-sm text-red-400 p-6 text-center font-medium">{cameraError}</p>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
                    />
                    
                    {/* Camera Control overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between z-10">
                      {/* Flip Camera */}
                      <button
                        onClick={() => setFacingMode(f => f === "user" ? "environment" : "user")}
                        className="p-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all"
                      >
                        <RefreshCw size={20} />
                      </button>
                      
                      {/* Capture Button */}
                      <button
                        onClick={capturePhoto}
                        className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:scale-90 transition-transform"
                      >
                        <div className="w-12 h-12 rounded-full bg-white hover:bg-neutral-200 transition-colors" />
                      </button>
                      
                      {/* Placeholder for symmetry */}
                      <div className="w-[44px]" />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* VIEW 2: Photo Review & Share */}
            {view === "preview" && (
              <>
                {/* Image preview */}
                <div className="relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-[var(--border)]">
                  <img src={capturedImage} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={retakePhoto}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-black/60 hover:bg-black/80 transition-colors"
                  >
                    Retake
                  </button>
                </div>

                {/* Share choices */}
                <div className="space-y-3">
                  {/* Status Toggle */}
                  <label className="flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-colors"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🟢</span>
                      <div>
                        <p className="text-white font-medium text-[14px]">My Status</p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Add to status updates</p>
                      </div>
                    </div>
                    <input type="checkbox" checked={shareToStatus} onChange={e => setShareToStatus(e.target.checked)} className="checkbox checkbox-primary" />
                  </label>

                  {/* Send to chat */}
                  <div className="rounded-xl p-4 space-y-3"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                    <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Send to contact
                    </p>

                    {/* Search */}
                    <div className="relative flex items-center h-[36px] bg-[var(--bg-panel)] rounded-lg px-2.5 border border-[var(--border)]">
                      <Search size={14} className="text-[var(--text-muted)] mr-1.5 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Search contact..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent text-[13px] focus:outline-none text-white placeholder-[var(--text-muted)]"
                      />
                    </div>

                    <div className="max-h-[140px] overflow-y-auto no-scrollbar space-y-1">
                      {loadingContacts ? (
                        <p className="text-xs text-center py-2" style={{ color: "var(--text-muted)" }}>Loading contacts...</p>
                      ) : filteredContacts.length === 0 ? (
                        <p className="text-xs text-center py-2" style={{ color: "var(--text-muted)" }}>No contacts found</p>
                      ) : (
                        filteredContacts.map(c => (
                          <button
                            key={c._id}
                            onClick={() => setSelectedRecipient(selectedRecipient === c._id ? "" : c._id)}
                            className="w-full flex items-center justify-between p-2 rounded-lg transition-colors hover:bg-white/5 text-left"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img src={c.profilePic || "/avatar.png"} className="w-8 h-8 rounded-full object-cover" />
                              <span className="text-[13px] text-white font-medium truncate">{c.fullName}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedRecipient === c._id}
                              readOnly
                              className="checkbox checkbox-sm checkbox-primary animate-none"
                            />
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Caption */}
                  {selectedRecipient && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        Add Message/Caption
                      </label>
                      <input
                        type="text"
                        value={caption}
                        onChange={e => setCaption(e.target.value)}
                        placeholder="Type a caption for your photo..."
                        className="w-full p-3 rounded-xl text-white text-[13.5px] outline-none"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 border-t flex gap-3 flex-shrink-0" style={{ borderTopColor: "var(--border)" }}>
            <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl border text-[13.5px] hover:bg-white/5 transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSubmitting || (view === "preview" && !shareToStatus && !selectedRecipient)}
              className="flex-1 py-2.5 rounded-xl text-[13.5px] font-bold text-white transition-colors disabled:opacity-50"
              style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
            >
              {isSubmitting ? "Sharing..." : view === "capture" ? "Snapping..." : "Send & Share"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
