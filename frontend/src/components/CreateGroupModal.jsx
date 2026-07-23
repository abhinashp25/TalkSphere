import { useEffect, useRef, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore }  from "../store/useChatStore";
import { useAuthStore }  from "../store/useAuthStore";
import { XIcon, CameraIcon, UsersIcon, SearchIcon, CheckIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function CreateGroupModal({ onClose }) {
  const { createGroup } = useGroupStore();
  const { allContacts, getAllContacts } = useChatStore();
  const { authUser } = useAuthStore();

  const [name, setName]           = useState("");
  const [description, setDesc]    = useState("");
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState([]);
  const [groupPic, setGroupPic]   = useState(null);
  const [picPreview, setPicPreview] = useState(null);
  const [loading, setLoading]     = useState(false);
  const fileRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { getAllContacts(); }, []);

  const filtered = allContacts.filter(
    (c) =>
      c._id !== authUser._id &&
      c.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const toggleMember = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePic = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setGroupPic(reader.result);
      setPicPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Group name is required"); return; }
    if (selected.length < 1) { toast.error("Add at least 1 member"); return; }
    setLoading(true);
    try {
      const payload = { name: name.trim(), description, memberIds: selected };
      if (groupPic) payload.groupPic = groupPic; // only include when truthy — null fails Zod z.string()
      await createGroup(payload);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-header)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(79,209,197,0.15)" }}>
              <UsersIcon className="w-4 h-4" style={{ color: "var(--accent)" }} />
            </div>
            <h2 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>
              New Group
            </h2>
          </div>
          <button onClick={onClose} className="icon-btn">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-4">
          {/* Group photo + name row */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center transition-all hover:opacity-90"
              style={{
                background: picPreview
                  ? "transparent"
                  : "linear-gradient(135deg, rgba(79,209,197,0.2), rgba(102,126,234,0.2))",
                border: "2px dashed rgba(79,209,197,0.35)",
              }}
            >
              {picPreview ? (
                <img src={picPreview} className="w-full h-full rounded-full object-cover" alt="group" />
              ) : (
                <CameraIcon className="w-6 h-6" style={{ color: "var(--accent)" }} />
              )}
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: "var(--accent)" }}
              >
                <CameraIcon className="w-3 h-3 text-white" />
              </div>
            </button>
            <input type="file" accept="image/*" ref={fileRef} onChange={handlePic} className="hidden" />

            <div className="flex-1 flex flex-col gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name (required)"
                maxLength={80}
                className="input text-[14px]"
                style={{ padding: "10px 14px" }}
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Description (optional)"
                maxLength={300}
                className="input text-[13px]"
                style={{ padding: "10px 14px" }}
              />
            </div>
          </div>

          {/* Members section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Add members
              </p>
              {selected.length > 0 && (
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(79,209,197,0.15)", color: "var(--accent)" }}
                >
                  {selected.length} selected
                </span>
              )}
            </div>

            {/* Search contacts */}
            <div className="relative mb-3">
              <SearchIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts…"
                className="input text-[13px] pl-9"
                style={{ padding: "9px 14px 9px 36px" }}
              />
            </div>

            {/* Selected avatars strip */}
            {selected.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {selected.map((id) => {
                  const c = allContacts.find((x) => x._id === id);
                  if (!c) return null;
                  return (
                    <div key={id} className="flex flex-col items-center gap-1">
                      <div className="relative">
                        <img
                          src={c.profilePic || "/avatar.png"}
                          alt={c.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                          style={{ border: "2px solid var(--accent)" }}
                        />
                        <button
                          onClick={() => toggleMember(id)}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: "#fc8181" }}
                        >
                          <XIcon className="w-2.5 h-2.5 text-white" />
                        </button>
                      </div>
                      <span className="text-[9px] text-center max-w-[48px] truncate"
                        style={{ color: "var(--text-muted)" }}>
                        {c.fullName.split(" ")[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Contact list */}
            <div
              className="rounded-xl overflow-y-auto"
              style={{ maxHeight: 220, border: "1px solid var(--border)" }}
            >
              {filtered.length === 0 ? (
                <p className="text-[13px] text-center py-6" style={{ color: "var(--text-muted)" }}>
                  No contacts found
                </p>
              ) : (
                filtered.map((c) => {
                  const isSelected = selected.includes(c._id);
                  return (
                    <button
                      key={c._id}
                      onClick={() => toggleMember(c._id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <img
                        src={c.profilePic || "/avatar.png"}
                        alt={c.fullName}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {c.fullName}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                          {c.status || "Hey there! I am using TalkSphere."}
                        </p>
                      </div>
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: isSelected ? "var(--accent)" : "transparent",
                          border: isSelected ? "none" : "2px solid var(--border)",
                        }}
                      >
                        {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Create button */}
        <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim() || selected.length < 1}
            className="w-full py-3 rounded-xl font-bold text-[14px] text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, var(--accent), #38b2ac)",
              boxShadow: "0 4px 18px rgba(79,209,197,0.3)",
            }}
          >
            {loading ? "Creating…" : `Create Group${selected.length > 0 ? ` · ${selected.length + 1} members` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
