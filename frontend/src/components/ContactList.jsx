import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { Search, X } from "lucide-react";

function lastSeenText(isoStr) {
  if (!isoStr) return "last seen a while ago";
  const d    = new Date(isoStr);
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  if (mins < 2)  return "last seen just now";
  if (mins < 60) return `last seen ${mins} min ago`;
  if (hrs  < 24) return `last seen today at ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  return `last seen ${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
}

function highlight(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded px-0.5" style={{ background: 'rgba(79,209,197,0.25)', color: 'inherit' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function ContactList() {
  const {
    getAllContacts, allContacts, setSelectedUser,
    isUsersLoading, selectedUser, lastSeenMap,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [searchVal, setSearchVal] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { getAllContacts(); }, []);
  if (isUsersLoading) return <UsersLoadingSkeleton />;

  const filtered = allContacts.filter((c) => {
    if (c.isArchived) return false;
    return !searchVal || c.fullName.toLowerCase().includes(searchVal.toLowerCase());
  });

  const online  = filtered.filter((c) => onlineUsers.map(String).includes(String(c._id)));
  const offline = filtered.filter((c) => !onlineUsers.map(String).includes(String(c._id)));

  if (!filtered.length) return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search contacts bar */}
      <div className="p-3 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="relative flex items-center h-[38px] w-full rounded-full border" style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
          <div className="w-10 h-full flex items-center justify-center flex-shrink-0">
            <Search size={16} className="text-[#a3a3a3]" />
          </div>
          <input
            type="text"
            placeholder="Search or start new chat..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="flex-1 bg-transparent text-[14px] focus:outline-none text-[#e5e5e5] placeholder:text-[#737373] h-full"
          />
          {searchVal && (
            <button onClick={() => setSearchVal("")} className="w-10 h-full flex items-center justify-center text-[#a3a3a3] hover:text-white transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4 px-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-panel)' }}>
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            style={{ color: 'var(--text-muted)' }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No contacts found</p>
        <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
          {searchVal ? `No results for "${searchVal}"` : "Contacts will appear here once you chat with someone"}
        </p>
      </div>
    </div>
  );

  // Group offline by letter
  const groups = offline.reduce((acc, c) => {
    const letter = c.fullName[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(c);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search contacts bar */}
      <div className="p-3 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="relative flex items-center h-[38px] w-full rounded-full border" style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
          <div className="w-10 h-full flex items-center justify-center flex-shrink-0">
            <Search size={16} className="text-[#a3a3a3]" />
          </div>
          <input
            type="text"
            placeholder="Search or start new chat..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="flex-1 bg-transparent text-[14px] focus:outline-none text-[#e5e5e5] placeholder:text-[#737373] h-full"
          />
          {searchVal && (
            <button onClick={() => setSearchVal("")} className="w-10 h-full flex items-center justify-center text-[#a3a3a3] hover:text-white transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Online section */}
        {online.length > 0 && (
          <>
            <SectionLabel label={`Online — ${online.length}`} color="var(--online)" />
            {online.map((c) => (
              <ContactRow key={c._id}
                contact={c} isOnline selected={selectedUser?._id === c._id}
                lastSeenMap={lastSeenMap} sidebarSearch={searchVal}
                onChat={() => setSelectedUser(c)} />
            ))}
          </>
        )}

        {/* Alphabetical offline */}
        {Object.keys(groups).sort().map((letter) => (
          <div key={letter}>
            <SectionLabel label={letter} />
            {groups[letter].map((c) => (
              <ContactRow key={c._id}
                contact={c} isOnline={false} selected={selectedUser?._id === c._id}
                lastSeenMap={lastSeenMap} sidebarSearch={searchVal}
                onChat={() => setSelectedUser(c)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ label, color }) {
  return (
    <div className="px-5 py-2 text-xs font-bold uppercase tracking-wider sticky top-0 z-10"
      style={{
        background: "var(--bg-panel)",
        color: color || "var(--text-muted)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {label}
    </div>
  );
}

function ContactRow({ contact, isOnline, selected, lastSeenMap, sidebarSearch, onChat }) {
  const lastSeen = lastSeenMap?.[contact._id] || contact.lastSeen;

  return (
    <div onClick={onChat}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors group ${selected ? "active" : ""}`}
      style={{ background: selected ? 'var(--bg-active)' : 'transparent' }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}>

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img src={contact.profilePic || "/avatar.png"} alt={contact.fullName}
          className="w-12 h-12 rounded-full object-cover"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }} />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            style={{ background: '#48bb78', borderColor: 'var(--bg-secondary)' }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
          {sidebarSearch ? highlight(contact.fullName, sidebarSearch) : contact.fullName}
        </p>
        <p className="text-[12px] mt-0.5 truncate"
          style={{ color: isOnline ? '#48bb78' : 'var(--text-muted)' }}>
          {isOnline ? "● Online" : lastSeenText(lastSeen)}
        </p>
      </div>

      {/* Chat button */}
      <button
        onClick={(e) => { e.stopPropagation(); onChat(); }}
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        style={{ background: 'var(--bg-active)' }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--accent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-active)'; }}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: 'var(--accent)' }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    </div>
  );
}
