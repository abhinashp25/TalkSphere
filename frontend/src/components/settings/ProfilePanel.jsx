import { useState, useRef } from "react";
import { Camera, Check } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import toast from "react-hot-toast";

const STATUS_PRESETS = [
  { emoji: "🟢", text: "Available" },
  { emoji: "🔴", text: "Busy" },
  { emoji: "💼", text: "At the office" },
  { emoji: "🏠", text: "Working from home" },
  { emoji: "🤝", text: "In a meeting" },
  { emoji: "📞", text: "On a call" },
  { emoji: "🎓", text: "Studying" },
  { emoji: "📚", text: "In class" },
  { emoji: "💻", text: "Coding" },
  { emoji: "🎨", text: "Designing / Creating" },
  { emoji: "✈️", text: "Traveling" },
  { emoji: "🏋️", text: "At the gym" },
  { emoji: "🏖️", text: "On vacation" },
  { emoji: "🚗", text: "Driving" },
  { emoji: "☕", text: "On a break" },
  { emoji: "🎮", text: "Gaming" },
  { emoji: "😴", text: "Sleeping" },
  { emoji: "🏥", text: "At the hospital" },
  { emoji: "🔕", text: "Do not disturb" },
  { emoji: "🔒", text: "Unavailable" },
];

export default function ProfilePanel() {
  const { authUser, updateProfile, isUpdatingProfile } = useAuthStore();
  const fileInputRef = useRef(null);

  const [editName, setEditName] = useState(authUser?.fullName || "");
  const [editBio, setEditBio] = useState(authUser?.bio || "");
  const [editStatus, setEditStatus] = useState(authUser?.status || "Available");
  const [saveLoading, setSaveLoading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      await updateProfile({ profilePic: reader.result });
    };
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return toast.error("Name cannot be empty");
    setSaveLoading(true);
    await updateProfile({ fullName: editName, bio: editBio, status: editStatus });
    setSaveLoading(false);
    toast.success("Profile saved");
  };

  const profileFields = [
    authUser?.fullName,
    authUser?.bio,
    authUser?.profilePic && authUser.profilePic !== "/avatar.png",
    authUser?.status,
    authUser?.email,
  ];
  const completionPct = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  return (
    <div className="space-y-6 text-left">
      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div
          className="relative w-28 h-28 rounded-full overflow-hidden cursor-pointer group mb-3"
          style={{ border: "3px solid var(--accent)" }}
          onClick={() => fileInputRef.current?.click()}
        >
          <img
            src={authUser?.profilePic || "/avatar.png"}
            alt="profile"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
            <Camera size={22} />
            <span className="text-[10px] font-bold uppercase">Change</span>
          </div>
          {isUpdatingProfile && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="w-6 h-6 border-2 border-t-white border-white/20 rounded-full animate-spin" />
            </div>
          )}
        </div>
        <input type="file" accept="image/*" ref={fileInputRef}
          onChange={handleImageUpload} className="hidden" />

        {/* Completion bar */}
        <div className="w-full max-w-[220px]">
          <div className="flex justify-between text-[11px] mb-1.5">
            <span style={{ color: "var(--text-muted)" }}>Profile completion</span>
            <span className="font-bold" style={{ color: "var(--accent)" }}>{completionPct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${completionPct}%`, background: "var(--accent)" }} />
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-5">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block"
            style={{ color: "var(--text-muted)" }}>Full Name</label>
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            className="w-full p-3 rounded-xl text-white text-[14px] outline-none transition-colors border"
            style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}
          />
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block"
            style={{ color: "var(--text-muted)" }}>About / Bio</label>
          <input
            type="text"
            value={editBio}
            onChange={e => setEditBio(e.target.value)}
            placeholder="Tell people about yourself..."
            className="w-full p-3 rounded-xl text-white text-[14px] outline-none transition-colors border"
            style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}
          />
        </div>

        {/* Status presets */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest mb-3 block"
            style={{ color: "var(--text-muted)" }}>Status</label>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_PRESETS.map(preset => (
              <button
                key={preset.text}
                onClick={() => setEditStatus(`${preset.emoji} ${preset.text}`)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] text-left transition-all"
                style={{
                  background: editStatus === `${preset.emoji} ${preset.text}`
                    ? "var(--bg-active)" : "var(--bg-input)",
                  border: `1px solid ${editStatus === `${preset.emoji} ${preset.text}`
                    ? "var(--accent)" : "var(--border)"}`,
                  color: "var(--text-primary)",
                }}
              >
                <span>{preset.emoji}</span>
                <span className="truncate">{preset.text}</span>
                {editStatus === `${preset.emoji} ${preset.text}` && (
                  <Check size={12} className="ml-auto flex-shrink-0" style={{ color: "var(--accent)" }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Email and Joining Date Card */}
        <div className="rounded-xl p-4 space-y-3 border" style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between text-[13px] py-0.5">
            <span className="font-bold uppercase tracking-wider text-white/40 text-[10.5px]">Email</span>
            <span className="text-white font-medium truncate max-w-[220px]">{authUser?.email || "N/A"}</span>
          </div>
          <div className="h-px" style={{ background: "var(--border)" }} />
          <div className="flex items-center justify-between text-[13px] py-0.5">
            <span className="font-bold uppercase tracking-wider text-white/40 text-[10.5px]">Joined</span>
            <span className="text-white font-medium">
              {authUser?.createdAt
                ? new Date(authUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                : "April 2026"}
            </span>
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saveLoading}
          className="w-full py-3 rounded-xl text-[15px] font-bold transition-all disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
        >
          {saveLoading ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
