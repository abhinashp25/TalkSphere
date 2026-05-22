import { SearchIcon, XIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useGroupStore } from "../store/useGroupStore";

const TABS = ["chats", "contacts", "groups"];

export default function ActiveTabSwitch({ extraActions }) {
  const {
    activeTab, setActiveTab, activeFilter, setActiveFilter,
    chats, unreadCounts, sidebarSearch, setSidebarSearch,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { groups } = useGroupStore();

  const visibleChats = chats.filter((c) => !c.isArchived);
  // Count of contacts with unread — not total message count
  const totalUnread  = visibleChats.filter((c) => (unreadCounts[c._id] ?? c.unreadCount ?? 0) > 0).length;
  const totalOnline  = visibleChats.filter((c) => onlineUsers.includes(c._id)).length;

  return (
    <div className="flex-shrink-0" style={{ background: 'var(--bg-secondary)' }}>

      {/* Search bar — WhatsApp pill style */}
      <div className="px-3 pt-2.5 pb-2">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-3.5 w-4 h-4 pointer-events-none z-10"
            style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            placeholder={
              activeTab === "chats"    ? "Search or start new chat" :
              activeTab === "contacts" ? "Search contacts…" : "Search groups…"
            }
            className="w-full pl-10 pr-9 text-[14px] border-none focus:outline-none transition-shadow"
            style={{
              height: 38,
              background: 'var(--bg-input)',
              borderRadius: 9999,
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          />
          {sidebarSearch && (
            <button onClick={() => setSidebarSearch("")}
              className="absolute right-3 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'var(--text-muted)' }}>
              <XIcon className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Filter pills — All / Unread / Online */}
      {activeTab === "chats" && (
        <div className="flex items-center gap-2 px-3 pb-2.5 overflow-x-auto no-scrollbar">
          <Pill
            label="All"
            active={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
          />
          <Pill
            label={totalUnread > 0 ? `Unread  ${totalUnread}` : "Unread"}
            active={activeFilter === "unread"}
            badge={totalUnread}
            onClick={() => setActiveFilter("unread")}
          />
          <Pill
            label={totalOnline > 0 ? `Online  ${totalOnline}` : "Online"}
            active={activeFilter === "online"}
            onClick={() => setActiveFilter("online")}
          />
        </div>
      )}

      {/* Tab row — Chats / Contacts / Groups */}
      <div className="flex items-center" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSidebarSearch(""); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold relative capitalize transition-colors"
            style={{ color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            <TabIcon tab={tab} active={activeTab === tab} />
            <span className="hidden sm:inline">{tab}</span>
            {tab === "chats" && totalUnread > 0 && (
              <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white"
                style={{ background: 'var(--accent)' }}>
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
            {tab === "groups" && groups.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white"
                style={{ background: 'var(--accent-secondary, #6366f1)' }}>
                {groups.length}
              </span>
            )}
            {/* Active indicator line */}
            <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full transition-all duration-300"
              style={{ background: activeTab === tab ? 'var(--accent)' : 'transparent' }} />
          </button>
        ))}
        {extraActions && <div className="pr-2 flex-shrink-0">{extraActions}</div>}
      </div>
    </div>
  );
}

function TabIcon({ tab, active }) {
  const color = active ? 'var(--accent)' : 'var(--text-muted)';
  if (tab === "chats") return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
  if (tab === "contacts") return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>
    </svg>
  );
}

function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className="flex-shrink-0 px-3 py-1 text-[12px] font-semibold rounded-full transition-all"
      style={{
        background: active ? 'var(--accent)' : 'var(--bg-input)',
        color: active ? 'var(--bg-primary)' : 'var(--text-secondary)',
        border: active ? 'none' : '1px solid var(--border)',
      }}>
      {label}
    </button>
  );
}
