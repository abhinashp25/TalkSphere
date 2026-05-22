import { useEffect, useState, useMemo } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { MessageSquarePlus, Search, ArrowLeft, Heart, Menu, Camera, Sparkles, Pin } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

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
  if (hrs  < 24) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (days < 7)  return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function ChatsList({ onSelectUser, onSelectGroup, onOpenDrawer }) {
  const {
    getMyChatPartners, chats, isUsersLoading, setSelectedUser,
    selectedUser, unreadCounts, activeFilter, setActiveFilter, sidebarSearch, setSidebarSearch,
    favourites = [], toggleFavourite, setActiveTab, typingUsers
  } = useChatStore();
  const { groups, selectedGroup } = useGroupStore();
  const { onlineUsers, authUser } = useAuthStore();
  
  const [searchFocused, setSearchFocused] = useState(false);
  const [localSearch, setLocalSearch] = useState(sidebarSearch);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSidebarSearch(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, setSidebarSearch]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { getMyChatPartners(); }, []);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

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
  ].sort((a, b) => b.sortTime - a.sortTime);

  const visible = allConversations.filter((c) => {
    if (c.isArchived) return false;
    if (sidebarSearch && !c.displayName.toLowerCase().includes(sidebarSearch.toLowerCase())) return false;
    
    if (activeFilter === "unread") return c.unreadBadge > 0;
    if (activeFilter === "favourites") return favourites.includes(c._id);
    if (activeFilter === "groups") return c.isGroup;
    return true; // "all"
  });

  const handleConversationClick = (conv) => {
    if (conv.isGroup) {
      if (onSelectGroup) onSelectGroup(conv);
    } else {
      if (onSelectUser) onSelectUser(conv);
      else setSelectedUser(conv);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      
      {/* ── DESKTOP HEADER, SEARCH BAR & FILTER PILLS (Hidden on Mobile) ── */}
      <div className="hidden sm:flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-[64px] flex-shrink-0" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
          <h1 className="text-[20px] font-bold brand-font tracking-wide text-white">Chats</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => setActiveTab("contacts")} className="p-2 rounded-full text-[#a3a3a3] hover:text-white hover:bg-white/5 transition-colors" title="New Chat">
              <MessageSquarePlus size={20} />
            </button>
            <button onClick={onOpenDrawer} className="p-2 rounded-full text-[#a3a3a3] hover:text-white hover:bg-white/5 transition-colors" title="Menu">
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
        <div className="flex items-center justify-between px-4 h-[56px] flex-shrink-0" style={{ background: "var(--bg-secondary)" }}>
          <h1 className="text-[22px] font-bold brand-font tracking-wide text-white flex items-center gap-0.5">
            Chatify<span style={{ color: "var(--accent)" }}>.</span>
          </h1>
          <div className="flex items-center gap-1.5">
            <button onClick={() => toast.success("Camera activated (demo)")} className="p-2 rounded-full text-white/70 active:bg-white/10 transition-colors" title="Camera/QR">
              <Camera size={20} />
            </button>
            <button onClick={() => setSearchFocused(true)} className="p-2 rounded-full text-white/70 active:bg-white/10 transition-colors" title="Search">
              <Search size={20} />
            </button>
            <button onClick={onOpenDrawer} className="w-8 h-8 rounded-full overflow-hidden ml-1 border border-white/10 active:scale-95 transition-transform" title="Profile/Settings">
              <img src={authUser?.profilePic || "/avatar.png"} alt="profile" className="w-full h-full object-cover" />
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

      {/* Chat Rows */}
      <div className="flex-1 overflow-y-auto w-full no-scrollbar pt-1 pb-4 relative" style={{ background: "var(--bg-primary)" }}>
        <AnimatePresence>
          {/* Pinned Chatify AI Row */}
          {(!localSearch || "chatify ai".includes(localSearch.toLowerCase())) && (activeFilter === "all" || !activeFilter) && (
            <motion.div 
              layout
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
                  <p className="text-[15.5px] text-white truncate brand-font tracking-wide font-semibold flex items-center gap-1.5">
                    Chatify AI
                    <span className="w-[18px] h-[18px] rounded-full bg-violet-500/20 text-[#8b5cf6] flex items-center justify-center border border-[#8b5cf6]/30 flex-shrink-0">
                      <Sparkles size={9} className="text-violet-400 fill-violet-400/30" />
                    </span>
                  </p>
                  <span className="text-[11px] font-semibold text-violet-400 flex-shrink-0">
                    AI Assistant
                  </span>
                </div>
                
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <div className="text-[14px] truncate flex-1 font-normal text-[#a3a3a3] flex items-center gap-1">
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
              <p className="font-medium text-[#a1a1aa]">Your inbox is empty</p>
              <p className="text-sm text-[#71717a]">Start a conversation to get going.</p>
            </motion.div>
          )}
          {allConversations.length > 0 && !visible.length && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-sm text-[#71717a]">
                {sidebarSearch ? `No results for "${sidebarSearch}"` : `No ${activeFilter} conversations`}
              </p>
            </motion.div>
          )}

          {visible.map((conv) => {
            const isOnline = !conv.isGroup && onlineUsers.includes(conv._id);
            const isActive = conv.isGroup ? selectedGroup?._id === conv._id : selectedUser?._id === conv._id;
            const unread   = conv.unreadBadge;
            const isFav    = favourites?.includes(conv._id);
            const isTyping = !conv.isGroup && typingUsers[conv._id];

            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={conv._id} 
                className={`chat-row group ${isActive ? "active" : ""} ${isFav ? "favorite-pinned" : ""}`}
                onClick={() => handleConversationClick(conv)}
              >
                {/* Avatar with online dot */}
                <div className="relative flex-shrink-0">
                  {conv.isGroup ? (
                    <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-xl font-bold brand-font border"
                      style={{ background: 'var(--bg-panel)', borderColor: 'var(--border)', color: 'white' }}>
                      {conv.displayName[0].toUpperCase()}
                    </div>
                  ) : (
                    <img src={conv.displayPic} alt={conv.displayName} className="w-[52px] h-[52px] rounded-2xl object-cover border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }} />
                  )}
                  {isOnline && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] bg-[#10b981] z-10" style={{ borderColor: 'var(--bg-primary)' }} />
                  )}
                </div>

                {/* Content / Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[15.5px] text-white truncate brand-font tracking-wide" style={{ fontWeight: unread > 0 ? "600" : "500" }}>
                      {sidebarSearch ? highlight(conv.displayName, sidebarSearch) : conv.displayName}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isFav && <Pin size={11} className="text-violet-400 transform rotate-[45deg] flex-shrink-0" />}
                      {conv.sortTime > 0 && (
                        <span className="text-[11px] font-medium" style={{ color: unread > 0 ? 'var(--accent)' : '#71717a' }}>
                          {timeAgo(conv.sortTime)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className="text-[14px] truncate flex-1 font-normal text-[#a3a3a3]">
                      {isTyping ? (
                        <div className="flex items-center gap-1.5 text-white">
                          <span className="italic">Typing</span>
                          <div className="flex gap-0.5 pt-1">
                            <span className="w-1 h-1 bg-white rounded-full typing-dot"></span>
                            <span className="w-1 h-1 bg-white rounded-full typing-dot"></span>
                            <span className="w-1 h-1 bg-white rounded-full typing-dot"></span>
                          </div>
                        </div>
                      ) : conv.lastMsgObj ? (
                        <>
                          {conv.lastMsgObj.isMine && !conv.lastMsgObj.isDeleted && (<span className="text-[#e5e5e5]">You: </span>)}
                          {conv.isGroup && typeof conv.lastMsgObj === 'string' ? conv.lastMsgObj : conv.lastMsgObj.text || "📷 Image"}
                        </>
                      ) : (
                        <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Start chatting</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavourite && toggleFavourite(conv._id); }}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-[var(--bg-hover)] ${isFav ? "!opacity-100" : ""}`}
                      >
                        <Heart size={14} className={isFav ? "fill-white text-white" : "text-[#737373]"} />
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
          title="Ask Chatify AI"
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
