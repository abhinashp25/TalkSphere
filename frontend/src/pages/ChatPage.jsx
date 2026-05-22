import { useState, useEffect } from "react";
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
import StatusTray         from "../components/StatusTray";
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
    isSidebarCollapsed, setSidebarCollapsed 
  } = useChatStore();
  const {
    groups, selectedGroup, setSelectedGroup,
    fetchGroups, subscribeToGroupMessages, unsubscribeFromGroupMessages,
  } = useGroupStore();
  const { applyStoredTheme } = useSettingsStore();

  const [showAI,       setShowAI]       = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showStarred,  setShowStarred]  = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
    subscribeToGroupMessages();
    applyStoredTheme();
    return () => unsubscribeFromGroupMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="flex flex-col-reverse sm:flex-row w-full h-screen overflow-hidden text-white" style={{ background: "var(--bg-primary)" }}>

      {/* Column 1: Native 60px Nav Rail (Bottom on Mobile, Left on Desktop) */}
      <LeftRail activeTab={activeTab} setActiveTab={setActiveTab} isHiddenOnMobile={panelOpen} />

      {/* Column 2: Collapsible Middle Chat List Panel */}
      <aside
        className={`sidebar-collapse flex-shrink-0 flex flex-col z-10 relative
          ${isSidebarCollapsed
            ? "w-0 opacity-0 pointer-events-none"
            : "w-full sm:w-[320px] md:w-[360px] lg:w-[380px] opacity-100"}
          ${panelOpen ? "hidden sm:flex" : "flex"}`}
        style={{
          background: "var(--bg-primary)",
          borderRight: isSidebarCollapsed ? "none" : "1px solid var(--border)",
        }}
      >
        {(!activeTab || ["chats", "chatify-ai", "settings"].includes(activeTab)) && (
          <ChatsList 
            onSelectUser={openChat} 
            onSelectGroup={openGroup} 
            onShowNewGroup={() => setShowNewGroup(true)} 
            onShowStarred={() => setShowStarred(true)} 
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        )}
        {activeTab === "contacts"    && <div className="flex-1 overflow-y-auto"><ContactList /></div>}
        {activeTab === "profile"     && <ProfileSection onClose={() => setActiveTab("chats")} />}
        {activeTab === "communities" && (
          <div className="flex-1 overflow-y-auto">
            <GroupsList groups={groups} selected={selectedGroup} onSelect={openGroup} />
          </div>
        )}
        {activeTab === "calls"    && <CallsList />}
        {activeTab === "archived" && <ArchivedChats onClose={() => setActiveTab("chats")} />}
        {activeTab === "status"   && <div className="flex-1 overflow-y-auto"><StatusTray /></div>}
      </aside>

      {/* Column 3: Main conversation area — always visible on sm+ when panel is open */}
      <main className={`flex-1 flex flex-col min-w-0 relative
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
    </div>
  );
}


function GroupsList({ groups, selected, onSelect }) {
  if (!groups.length) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No communities yet</p>
    </div>
  );

  return (
    <div>
      {groups.map((g) => (
        <div key={String(g._id)} onClick={() => onSelect(g)}
          className={`chat-row ${selected?._id === g._id || String(selected?._id) === String(g._id) ? "active" : ""}`}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold border border-[#262626]"
            style={{ background: '#111111', color: 'white' }}>
            {g.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{g.name}</p>
            <p className="text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>
              {g.lastMessage || `${g.members?.length || 0} members`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatPage;
