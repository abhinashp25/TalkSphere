import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

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
    isUsersLoading, selectedUser, sidebarSearch, lastSeenMap,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { getAllContacts(); }, []);
  if (isUsersLoading) return <UsersLoadingSkeleton />;

  const filtered = allContacts.filter((c) => {
    if (c.isArchived) return false;
    return !sidebarSearch || c.fullName.toLowerCase().includes(sidebarSearch.toLowerCase());
  });

  const online  = filtered.filter((c) => onlineUsers.includes(c._id));
  const offline = filtered.filter((c) => !onlineUsers.includes(c._id));

  if (!filtered.length) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 px-6">
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
        {sidebarSearch ? `No results for "${sidebarSearch}"` : "Contacts will appear here once you chat with someone"}
      </p>
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
    <div>
      {/* Online section */}
      {online.length > 0 && (
        <>
          <SectionLabel label={`Online — ${online.length}`} color="var(--online)" />
          {online.map((c) => (
            <ContactRow key={c._id}
              contact={c} isOnline selected={selectedUser?._id === c._id}
              lastSeenMap={lastSeenMap} sidebarSearch={sidebarSearch}
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
              lastSeenMap={lastSeenMap} sidebarSearch={sidebarSearch}
              onChat={() => setSelectedUser(c)} />
          ))}
        </div>
      ))}
    </div>
  );
}

function SectionLabel({ label, color }) {
  return (
    <div className="px-4 py-1.5 sticky top-0 z-10"
      style={{ background: 'var(--bg-secondary)' }}>
      <p className="text-[11px] font-bold uppercase tracking-widest"
        style={{ color: color || 'var(--text-muted)' }}>
        {label}
      </p>
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
