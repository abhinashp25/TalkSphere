import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useChatStore }   from "../store/useChatStore";
import { useGroupStore }  from "../store/useGroupStore";
import { useAuthStore }   from "../store/useAuthStore";
import { useSettingsStore } from "../store/useSettingsStore";
import ProfileHeader      from "../components/ProfileHeader";
import ActiveTabSwitch    from "../components/ActiveTabSwitch";
import ChatsList          from "../components/ChatsList";
import ContactList        from "../components/ContactList";
import ChatContainer      from "../components/ChatContainer";
import GroupChatWindow    from "../components/GroupChatWindow";
import AIChatWindow       from "../components/AIChatWindow";
import ArchivedChats      from "../components/ArchivedChats";
import StarredMessages    from "../components/StarredMessages";
import StatusTray, { StatusViewer, WriteStatusModal } from "../components/StatusTray";
import { useStatusStore } from "../store/useStatusStore";
import CreateGroupModal   from "../components/CreateGroupModal";
import NativeEmptyState   from "../components/NativeEmptyState";
import LeftRail           from "../components/LeftRail";
import CallsList          from "../components/CallsList";
import DrawerPanel        from "../components/DrawerPanel";
import ProfileSection     from "../components/ProfileSection";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

function ChatPage() {
  const { 
    activeTab, setActiveTab, selectedUser, setSelectedUser, chats, unreadCounts,
    isSidebarCollapsed, setSidebarCollapsed, subscribeToMessages, unsubscribeFromMessages
  } = useChatStore();
  const {
    groups, selectedGroup, setSelectedGroup,
    fetchGroups, subscribeToGroupMessages, unsubscribeFromGroupMessages,
  } = useGroupStore();
  const { applyStoredTheme } = useSettingsStore();
  const { activeStatus, isTextModalOpen } = useStatusStore();

  const [showAI,       setShowAI]       = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showStarred,  setShowStarred]  = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [swipeDelta, setSwipeDelta]   = useState(0);  // live finger offset px
  const [isSwiping, setIsSwiping]     = useState(false);
  const swipeRef = useRef(null); // { startX, startY, startTab }
  const sidebarRef = useRef(null);

  const MOBILE_TAB_SEQUENCE = ["chats", "status", "communities", "calls"];

  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;

    const handleStart = (e) => {
      if (e.touches.length !== 1) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      setTouchStart({ x, y });
      const cur = !activeTab || !MOBILE_TAB_SEQUENCE.includes(activeTab) ? "chats" : activeTab;
      swipeRef.current = { startX: x, startY: y, startTab: cur, locked: null };
    };

    const handleMove = (e) => {
      if (!swipeRef.current) return;
      const dx = e.touches[0].clientX - swipeRef.current.startX;
      const dy = e.touches[0].clientY - swipeRef.current.startY;

      // Lock swipe axis on first movement
      if (!swipeRef.current.locked) {
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
          swipeRef.current.locked = "h";
        } else if (Math.abs(dy) > 8) {
          swipeRef.current.locked = "v";
          return;
        } else return;
      }
      if (swipeRef.current.locked !== "h") return;

      const idx = MOBILE_TAB_SEQUENCE.indexOf(swipeRef.current.startTab);
      // Clamp: can't drag past the ends
      const atStart = idx === 0 && dx > 0;
      const atEnd   = idx === MOBILE_TAB_SEQUENCE.length - 1 && dx < 0;
      const clamped = atStart || atEnd ? dx * 0.25 : dx;
      setSwipeDelta(clamped);
      setIsSwiping(true);
      
      // Crucial: call preventDefault natively on non-passive listener to block scroll/swipe-back
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const handleEnd = (e) => {
      if (!swipeRef.current) return;
      const dx = e.changedTouches[0].clientX - swipeRef.current.startX;
      const dy = e.changedTouches[0].clientY - swipeRef.current.startY;

      setSwipeDelta(0);
      setIsSwiping(false);

      if (swipeRef.current.locked !== "h") { swipeRef.current = null; return; }
      if (Math.abs(dx) > 55 && Math.abs(dy) < 50) {
        const currentTabKey = swipeRef.current.startTab;
        const currentIndex  = MOBILE_TAB_SEQUENCE.indexOf(currentTabKey);
        if (currentIndex !== -1) {
          if (dx < 0 && currentIndex < MOBILE_TAB_SEQUENCE.length - 1) {
            setActiveTab(MOBILE_TAB_SEQUENCE[currentIndex + 1]);
          } else if (dx > 0 && currentIndex > 0) {
            setActiveTab(MOBILE_TAB_SEQUENCE[currentIndex - 1]);
          }
        }
      }
      swipeRef.current = null;
    };

    el.addEventListener("touchstart", handleStart, { passive: true });
    el.addEventListener("touchmove", handleMove, { passive: false });
    el.addEventListener("touchend", handleEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleStart);
      el.removeEventListener("touchmove", handleMove);
      el.removeEventListener("touchend", handleEnd);
    };
  }, [activeTab, setActiveTab, isSwiping]);

  useEffect(() => {
    fetchGroups();
    subscribeToGroupMessages();
    subscribeToMessages();
    applyStoredTheme();
    return () => {
      unsubscribeFromGroupMessages();
      unsubscribeFromMessages();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Browser / Hardware Back Button Support ──────────────────────────────
  useEffect(() => {
    const pushState = () => window.history.pushState(null, "", window.location.href);
    // Push initial state so first back press can be intercepted
    pushState();

    const handlePopState = () => {
      // Re-push so the next back press is also interceptable
      pushState();
      // Close things in reverse-open order:
      if (isDrawerOpen) { setIsDrawerOpen(false); return; }
      if (activeTab === "settings") { setActiveTab("chats"); return; }
      if (showAI || activeTab === "chatify-ai") { setShowAI(false); setActiveTab("chats"); return; }
      if (selectedGroup) { setSelectedGroup(null); return; }
      if (selectedUser) { setSelectedUser(null); return; }
      // If nothing open, tab defaults to chats
      if (activeTab && activeTab !== "chats") { setActiveTab("chats"); return; }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen, activeTab, showAI, selectedGroup, selectedUser]);

  useEffect(() => {
    const handleResize = () => {
      // On desktop (>= 1024px), always expand sidebar
      if (window.innerWidth >= 1024) setSidebarCollapsed(false);
    };
    handleResize(); // run once on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarCollapsed]);

  const totalUnread   = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const archivedCount = chats.filter(c => c.isArchived).length;
  const groupCount    = groups.length;

  // Auto-collapse on tablet viewport (640–1023px)
  const autoCollapse = () => {
    if (window.innerWidth >= 640 && window.innerWidth < 1024) setSidebarCollapsed(true);
    else setSidebarCollapsed(false);
  };

  // ── When user clicks a chat: clear group + AI so chat opens properly ──
  const openChat = (user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
    setShowAI(false);
    setActiveTab("chats"); // Switch back to chats tab immediately
    autoCollapse();
  };

  // ── When user clicks a group: clear selectedUser + AI ─────────────────
  const openGroup = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
    setShowAI(false);
    setActiveTab("chats"); // Switch back to chats tab immediately
    autoCollapse();
  };

  const rightPanel = () => {
    if (activeTab === "chatify-ai" || showAI) return <AIChatWindow onClose={() => { setShowAI(false); setActiveTab("chats"); }} />;
    if (selectedGroup) return <GroupChatWindow group={selectedGroup} onClose={() => setSelectedGroup(null)} />;
    if (selectedUser)  return <ChatContainer />;
    return <NativeEmptyState onActivateMetaAI={() => { setActiveTab("chatify-ai"); autoCollapse(); }} />;
  };

  const isAITab  = activeTab === "chatify-ai" || showAI;
  const panelOpen = selectedUser || selectedGroup || showAI || isAITab;

  if (showArchived) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <aside className="flex-shrink-0 flex flex-col w-full sm:w-[360px] md:w-[400px] sidebar-glass">
          <ArchivedChats onClose={() => setShowArchived(false)} />
        </aside>
        <main className="flex-1 hidden sm:flex flex-col chat-bg"><NoConversationPlaceholder /></main>
      </div>
    );
  }

  if (showStarred) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <aside className="flex-shrink-0 flex flex-col w-full sm:w-[360px] md:w-[400px] sidebar-glass">
          <StarredMessages onClose={() => setShowStarred(false)} />
        </aside>
        <main className="flex-1 hidden sm:flex flex-col chat-bg"><NoConversationPlaceholder /></main>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row w-full h-screen overflow-hidden text-white" style={{ background: "var(--bg-primary)" }}>

      {/* Column 1: Native 60px Nav Rail (Bottom on Mobile, Left on Desktop) */}
      <LeftRail activeTab={activeTab} setActiveTab={setActiveTab} isHiddenOnMobile={panelOpen} />

      {/* Column 2: Collapsible Middle Chat List Panel */}
      <aside
        ref={sidebarRef}
        className={`sidebar-collapse flex-shrink-0 flex flex-col z-10 relative h-full
          ${isSidebarCollapsed
            ? "w-0 opacity-0 pointer-events-none"
            : "w-full sm:w-[320px] md:w-[360px] lg:w-[380px] opacity-100"}
          ${panelOpen ? "hidden sm:flex" : "flex"}`}
        style={{
          background: "var(--bg-primary)",
          borderRight: isSidebarCollapsed ? "none" : "1px solid var(--border)",
          transform: `translateX(${swipeDelta}px)`,
          transition: isSwiping ? "none" : "transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)",
          willChange: "transform",
          touchAction: "pan-y",
        }}
      >
        {/* Show Chats list for chats / chatify-ai / settings / default */}
        {(!activeTab || ["chats", "chatify-ai", "settings"].includes(activeTab)) && (
          <ChatsList
            onSelectUser={openChat}
            onSelectGroup={openGroup}
            onShowNewGroup={() => setShowNewGroup(true)}
            onShowStarred={() => setShowStarred(true)}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        )}
        {activeTab === "contacts"    && <div className="flex-1 overflow-y-auto pb-24 sm:pb-0"><ContactList /></div>}
        {activeTab === "profile"     && <ProfileSection onClose={() => setActiveTab("chats")} />}
        {activeTab === "communities" && (
          <div className="flex flex-col flex-1 min-h-0 pb-24 sm:pb-0" style={{ background: "var(--bg-secondary)" }}>
            <GroupsList groups={groups} selected={selectedGroup} onSelect={openGroup} />
          </div>
        )}
        {activeTab === "calls"    && <CallsList />}
        {activeTab === "archived" && <ArchivedChats onClose={() => setActiveTab("chats")} />}
        {activeTab === "status"   && <StatusTray />}
      </aside>

      {/* Column 3: Main conversation area — always visible on sm+ when panel is open */}
      <main className={`flex-1 flex flex-col min-w-0 min-h-0 relative h-full
        ${panelOpen ? "flex" : "hidden sm:flex"}`} style={{ background: "var(--bg-primary)" }}>
        {rightPanel()}
      </main>

      {showNewGroup  && <CreateGroupModal onClose={() => setShowNewGroup(false)} />}
      
      {/* Conditional settings drawer mount under AnimatePresence for instant snappy animation */}
      <AnimatePresence>
        {(isDrawerOpen || activeTab === "settings") && (
          <DrawerPanel 
            isOpen={true} 
            onClose={() => { 
              setIsDrawerOpen(false); 
              if (activeTab === "settings") setActiveTab("chats"); 
            }} 
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activeStatus && <StatusViewer />}
      </AnimatePresence>
      <AnimatePresence>
        {isTextModalOpen && <WriteStatusModal />}
      </AnimatePresence>
    </div>
  );
}


function GroupsList({ groups, selected, onSelect }) {
  const [search, setSearch] = useState("");

  const COMMUNITY_COLORS = [
    "linear-gradient(135deg,#6366f1,#8b5cf6)",
    "linear-gradient(135deg,#0ea5e9,#06b6d4)",
    "linear-gradient(135deg,#10b981,#059669)",
    "linear-gradient(135deg,#f59e0b,#ef4444)",
    "linear-gradient(135deg,#ec4899,#8b5cf6)",
    "linear-gradient(135deg,#f97316,#f59e0b)",
  ];

  if (!groups.length) {
    return (
      <div className="flex flex-col h-full" style={{ background: "var(--bg-secondary)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
          <h1 className="text-[22px] font-bold brand-font" style={{ color: "var(--text-primary)" }}>Communities</h1>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 pb-20">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="text-center space-y-2">
            <h2 className="font-bold text-[18px]" style={{ color: "var(--text-primary)" }}>No communities yet</h2>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Communities bring groups together under one topic. Create a group first, then it will appear here.
            </p>
          </div>
          <div className="w-full space-y-3 mt-2">
            <div className="flex items-center gap-3 p-4 rounded-2xl border" style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.2)" }}>
                <svg className="w-5 h-5" style={{ color: "#818cf8" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[13.5px]" style={{ color: "var(--text-primary)" }}>Create a Group</p>
                <p className="text-[11.5px]" style={{ color: "var(--text-muted)" }}>Chat with multiple people at once</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl border" style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.2)" }}>
                <svg className="w-5 h-5" style={{ color: "#34d399" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[13.5px]" style={{ color: "var(--text-primary)" }}>Invite Members</p>
                <p className="text-[11.5px]" style={{ color: "var(--text-muted)" }}>Add friends to your communities</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl border" style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.2)" }}>
                <svg className="w-5 h-5" style={{ color: "#fbbf24" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[13.5px]" style={{ color: "var(--text-primary)" }}>Organised by Topic</p>
                <p className="text-[11.5px]" style={{ color: "var(--text-muted)" }}>Keep conversations focused and clear</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-secondary)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <h1 className="text-[22px] font-bold brand-font text-white">Communities</h1>
        <span className="text-[12px] px-2.5 py-1 rounded-full font-semibold"
          style={{ background: "rgba(0,168,132,0.15)", color: "var(--accent)" }}>
          {groups.length} {groups.length === 1 ? "group" : "groups"}
        </span>
      </div>

      {/* Search */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
          style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
          <svg className="w-4 h-4" style={{ color: "var(--text-muted)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search communities..."
            value={search}
            onChange={e => {/* handled below */}}
            className="flex-1 bg-transparent text-white text-[13.5px] outline-none placeholder:text-white/30"
          />
        </div>
      </div>

      {/* Group list */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 sm:pb-0 px-4 space-y-2">
        {groups.map((g, idx) => {
          const gradBg = COMMUNITY_COLORS[idx % COMMUNITY_COLORS.length];
          const isActive = String(selected?._id) === String(g._id);
          return (
            <div
              key={String(g._id)}
              onClick={() => onSelect(g)}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all"
              style={{
                background: isActive ? "var(--bg-active)" : "var(--bg-input)",
                border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
              }}>
              {/* Avatar */}
              <div
                className="w-[50px] h-[50px] rounded-xl flex items-center justify-center flex-shrink-0 text-[20px] font-bold text-white shadow-md"
                style={{ background: gradBg }}>
                {g.name[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[14.5px] font-semibold truncate text-white">{g.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <svg className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-muted)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <p className="text-[12px] truncate" style={{ color: "var(--text-muted)" }}>
                    {g.members?.length || 0} member{g.members?.length !== 1 ? "s" : ""}
                    {g.lastMessage ? ` · ${g.lastMessage}` : ""}
                  </p>
                </div>
              </div>

              {/* Chevron */}
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ChatPage;
