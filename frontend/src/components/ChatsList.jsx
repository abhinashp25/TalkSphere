import { useEffect, useState, useMemo } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { MessageSquarePlus, Search, ArrowLeft, Heart, Menu } from "lucide-react";
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
  const { onlineUsers } = useAuthStore();
  
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

      {/* Chat Rows */}
      <div className="flex-1 overflow-y-auto w-full no-scrollbar pt-1 pb-4" style={{ background: "var(--bg-primary)" }}>
        <AnimatePresence>
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
                className={`chat-row group ${isActive ? "active" : ""}`}
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
                    {conv.sortTime > 0 && (
                      <span className="text-[11px] font-medium flex-shrink-0" style={{ color: unread > 0 ? '#6366f1' : '#71717a' }}>
                        {timeAgo(conv.sortTime)}
                      </span>
                    )}
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
