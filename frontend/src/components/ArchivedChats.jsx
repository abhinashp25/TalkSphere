import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useChatStore }   from "../store/useChatStore";
import { useAuthStore }   from "../store/useAuthStore";
import { ArchiveIcon, ArrowLeftIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function ArchivedChats({ onClose }) {
  const [archived, setArchived]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const { setSelectedUser, setActiveTab } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    axiosInstance.get("/messages/archived")
      .then((r) => setArchived(r.data))
      .catch(() => toast.error("Could not load archived chats"))
      .finally(() => setLoading(false));
  }, []);

  const unarchive = async (partnerId, e) => {
    e.stopPropagation();
    try {
      await axiosInstance.put(`/messages/archive/${partnerId}`);
      setArchived((a) => a.filter((u) => u._id !== partnerId));
      toast.success("Chat unarchived");
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 h-[64px] flex-shrink-0"
        style={{
          background: "var(--bg-header)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full transition-colors hover:bg-white/5"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <ArchiveIcon className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        <p className="font-bold text-[15px]" style={{ color: "var(--text-primary)" }}>
          Archived Chats
        </p>
      </div>

      {/* Scroll Container */}
      <div className="flex-1 overflow-y-auto pb-24 sm:pb-0">
        {loading && (
          <div className="flex justify-center py-10">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--accent) transparent transparent transparent" }}
            />
          </div>
        )}

        {!loading && archived.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ArchiveIcon className="w-12 h-12" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No archived chats</p>
          </div>
        )}

        {archived.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          return (
            <div key={user._id}
              className="chat-row"
              onClick={() => { setSelectedUser(user); setActiveTab("chats"); onClose(); }}>
              {/* Avatar with online indicator */}
              <div className="relative flex-shrink-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {isOnline && (
                  <span
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                    style={{
                      background: "var(--online, #10b981)",
                      borderColor: "var(--bg-primary)",
                    }}
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {user.fullName}
                </p>
                <p className="text-[12px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Archived conversation
                </p>
              </div>

              {/* Unarchive Button */}
              <button
                onClick={(e) => unarchive(user._id, e)}
                className="text-[11px] px-3 py-1.5 rounded-full font-semibold transition-all flex-shrink-0"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "var(--text-primary)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              >
                Unarchive
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
