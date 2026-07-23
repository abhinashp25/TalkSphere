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
import CommunitiesPage    from "../components/CommunitiesPage";

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
          <div className="flex flex-col flex-1 min-h-0 pb-24 sm:pb-0">
            <CommunitiesPage
              onSelectGroup={openGroup}
              onCreateGroup={() => setShowNewGroup(true)}
            />
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

export default ChatPage;
