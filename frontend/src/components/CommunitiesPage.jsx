import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Users, Crown, X, ChevronRight, UserPlus, Hash, Globe, Lock } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const COMMUNITY_GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#0ea5e9,#06b6d4)",
  "linear-gradient(135deg,#10b981,#059669)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
  "linear-gradient(135deg,#f97316,#f59e0b)",
  "linear-gradient(135deg,#3b82f6,#6366f1)",
  "linear-gradient(135deg,#14b8a6,#06b6d4)",
];

function getCommunityGradient(idx) {
  return COMMUNITY_GRADIENTS[idx % COMMUNITY_GRADIENTS.length];
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// ── Empty state when no groups ──────────────────────────────────────────────
function CommunitiesEmpty({ onCreateGroup }) {
  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[64px] flex-shrink-0"
        style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
        <h1 className="text-[20px] font-bold brand-font" style={{ color: "var(--text-primary)" }}>Communities</h1>
        <button
          onClick={onCreateGroup}
          className="p-2 rounded-full transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: "var(--accent)" }}
          title="Create a group"
        >
          <Plus size={22} />
        </button>
      </div>

      {/* Empty Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 pb-20">
        {/* Liquid glass icon */}
        <div className="relative">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              boxShadow: "0 16px 48px rgba(99,102,241,0.35)"
            }}
          >
            <Users size={40} className="text-white" />
          </div>
          <div
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: "var(--accent)", boxShadow: "0 4px 16px rgba(0,168,132,0.4)" }}
          >
            <Plus size={16} className="text-white" />
          </div>
        </div>

        <div className="text-center space-y-2 max-w-xs">
          <h2 className="font-bold text-[20px]" style={{ color: "var(--text-primary)" }}>No communities yet</h2>
          <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Communities bring groups together under one topic. Create or join a group to get started.
          </p>
        </div>

        {/* Feature cards */}
        <div className="w-full space-y-3 mt-2">
          {[
            {
              icon: <UserPlus size={20} />,
              color: "#818cf8",
              bg: "rgba(99,102,241,0.12)",
              title: "Create a Group",
              sub: "Chat with multiple people at once",
              action: onCreateGroup,
            },
            {
              icon: <Hash size={20} />,
              color: "#34d399",
              bg: "rgba(16,185,129,0.12)",
              title: "Organised by Topic",
              sub: "Keep conversations focused and clear",
              action: null,
            },
            {
              icon: <Globe size={20} />,
              color: "#fbbf24",
              bg: "rgba(245,158,11,0.12)",
              title: "Share with Everyone",
              sub: "Broadcast announcements to all members",
              action: null,
            },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.action || undefined}
              disabled={!item.action}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
                cursor: item.action ? "pointer" : "default",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: item.bg, color: item.color }}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13.5px]" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{item.sub}</p>
              </div>
              {item.action && <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Group Detail Panel ──────────────────────────────────────────────────────
function GroupDetailPanel({ group, gradient, onClose, onOpen }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[998] flex items-end sm:items-center justify-center"
      style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl mx-0 sm:mx-4"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient banner */}
        <div className="h-24 relative flex items-end px-5 pb-3" style={{ background: gradient }}>
          <button onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/25 flex items-center justify-center">
            <X size={14} className="text-white" />
          </button>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg border-2 border-white/20"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}>
            {group.name[0].toUpperCase()}
          </div>
        </div>

        {/* Info */}
        <div className="px-5 py-4">
          <h3 className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>{group.name}</h3>
          {group.description && (
            <p className="text-[13px] mt-1" style={{ color: "var(--text-secondary)" }}>{group.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Users size={13} style={{ color: "var(--text-muted)" }} />
            <span className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>
              {group.members?.length || 0} member{group.members?.length !== 1 ? "s" : ""}
            </span>
            {group.isPrivate ? (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ml-1"
                style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}>
                <Lock size={10} /> Private
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ml-1"
                style={{ background: "rgba(16,185,129,0.12)", color: "#34d399" }}>
                <Globe size={10} /> Public
              </span>
            )}
          </div>
        </div>

        {/* Members preview */}
        {group.members?.length > 0 && (
          <div className="px-5 pb-4">
            <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Members</p>
            <div className="flex flex-wrap gap-2">
              {group.members.slice(0, 6).map((m, i) => (
                <div key={i} className="w-9 h-9 rounded-full border-2 overflow-hidden flex-shrink-0"
                  style={{ borderColor: "var(--border)" }}>
                  <img
                    src={m.profilePic || "/avatar.png"}
                    alt={m.fullName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
              {group.members.length > 6 && (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold border-2"
                  style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  +{group.members.length - 6}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Open button */}
        <div className="px-5 pb-5">
          <button
            onClick={onOpen}
            className="w-full py-3 rounded-2xl font-bold text-[14px] text-white transition-all"
            style={{
              background: gradient,
              boxShadow: "0 4px 20px rgba(99,102,241,0.3)"
            }}
          >
            Open Group Chat
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main CommunitiesPage ────────────────────────────────────────────────────
export default function CommunitiesPage({ onSelectGroup, onCreateGroup }) {
  const { groups, selectedGroup } = useGroupStore();
  const { authUser } = useAuthStore();
  const [search, setSearch] = useState("");
  const [detailGroup, setDetailGroup] = useState(null);

  const filtered = groups.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (!groups.length) {
    return <CommunitiesEmpty onCreateGroup={onCreateGroup} />;
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[64px] flex-shrink-0"
        style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <h1 className="text-[20px] font-bold brand-font" style={{ color: "var(--text-primary)" }}>Communities</h1>
          <span className="text-[12px] px-2.5 py-0.5 rounded-full font-semibold"
            style={{ background: "rgba(0,168,132,0.12)", color: "var(--accent)" }}>
            {groups.length}
          </span>
        </div>
        <button
          onClick={onCreateGroup}
          className="p-2 rounded-full transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: "var(--accent)" }}
          title="Create a group"
        >
          <Plus size={22} />
        </button>
      </div>

      {/* Search bar – liquid glass */}
      <div className="px-4 py-3 flex-shrink-0" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-full border"
          style={{
            background: "var(--bg-input)",
            borderColor: "var(--border)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search communities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13.5px] focus:outline-none placeholder:opacity-50"
            style={{ color: "var(--text-primary)" }}
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={14} style={{ color: "var(--text-muted)" }} />
            </button>
          )}
        </div>
      </div>

      {/* Group list */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 sm:pb-4 px-3 pt-2 space-y-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <span className="text-2xl opacity-40">🔍</span>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No communities found for "{search}"
            </p>
          </div>
        )}

        {filtered.map((group, idx) => {
          const gradient = getCommunityGradient(idx);
          const isActive = String(selectedGroup?._id) === String(group._id);
          const isAdmin = group.admin === authUser?._id || group.admin?._id === authUser?._id;
          const lastActivity = group.lastMessageAt || group.updatedAt;

          return (
            <motion.div
              key={String(group._id)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer transition-all border group"
              style={{
                background: isActive ? "var(--bg-active)" : "var(--bg-secondary)",
                borderColor: isActive ? "var(--accent)" : "var(--border)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
              onClick={() => onSelectGroup && onSelectGroup(group)}
              onDoubleClick={() => setDetailGroup({ group, gradient })}
              onContextMenu={e => { e.preventDefault(); setDetailGroup({ group, gradient }); }}
            >
              {/* Gradient avatar */}
              <div
                className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-[20px] font-bold text-white shadow-md flex-shrink-0"
                style={{ background: gradient }}
              >
                {group.name[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 justify-between">
                  <p className="text-[14.5px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {group.name}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isAdmin && (
                      <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}>
                        <Crown size={9} /> Admin
                      </span>
                    )}
                    {lastActivity && (
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {timeAgo(lastActivity)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Users size={12} style={{ color: "var(--text-muted)" }} />
                  <p className="text-[12px] truncate" style={{ color: "var(--text-secondary)" }}>
                    {group.members?.length || 0} member{group.members?.length !== 1 ? "s" : ""}
                    {group.lastMessage
                      ? ` · ${typeof group.lastMessage === "string" ? group.lastMessage : group.lastMessage.text || "📷 Media"}`
                      : ""}
                  </p>
                </div>
              </div>

              {/* Right arrow */}
              <ChevronRight size={16} className="opacity-0 group-hover:opacity-60 transition-opacity"
                style={{ color: "var(--text-muted)" }} />
            </motion.div>
          );
        })}
      </div>

      {/* Group detail panel */}
      <AnimatePresence>
        {detailGroup && (
          <GroupDetailPanel
            group={detailGroup.group}
            gradient={detailGroup.gradient}
            onClose={() => setDetailGroup(null)}
            onOpen={() => {
              onSelectGroup && onSelectGroup(detailGroup.group);
              setDetailGroup(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
