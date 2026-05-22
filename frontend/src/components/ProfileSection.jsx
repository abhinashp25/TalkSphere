import { useState, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { CameraIcon, Edit2Icon, CheckIcon, UserIcon, ArrowLeftIcon, InfoIcon } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function ProfileSection({ onClose }) {
  const { authUser, updateProfile, isUpdatingProfile } = useAuthStore();
  const fileInputRef = useRef(null);

  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState(authUser?.fullName || "");
  const [editBio, setEditBio] = useState(false);
  const [bioVal, setBioVal] = useState(authUser?.bio || "");

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      await updateProfile({ profilePic: base64Image });
    };
  };

  const saveName = async () => {
    if (!nameVal.trim()) return toast.error("Name cannot be empty");
    setEditName(false);
    if (nameVal !== authUser.fullName) {
      await updateProfile({ fullName: nameVal });
    }
  };

  const saveBio = async () => {
    setEditBio(false);
    if (bioVal !== authUser.bio) {
      await updateProfile({ bio: bioVal });
    }
  };

  return (
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: 0 }}
      exit={{ x: "-100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex flex-col h-full absolute inset-0 z-20"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-5 h-16 sm:h-[68px] flex-shrink-0" style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--border)", color: "var(--text-primary)" }}>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeftIcon className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </button>
        <h1 className="text-[19px] font-semibold">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ background: "var(--bg-primary)" }}>
        {/* Avatar Section */}
        <div className="flex justify-center py-8">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img
              src={authUser.profilePic || "/avatar.png"}
              alt="Profile"
              className="w-40 h-40 rounded-full object-cover transition-opacity duration-300 group-hover:opacity-60 border-2 border-transparent relative z-10"
            />
            <div className="absolute inset-0 z-20 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
              <CameraIcon className="w-8 h-8 text-white mb-2" />
              <span className="text-white text-xs text-center px-4 uppercase font-medium">
                Change<br/>Profile Photo
              </span>
            </div>
            {isUpdatingProfile && (
              <div className="absolute inset-0 z-30 flex items-center justify-center rounded-full bg-black/60">
                <div className="w-8 h-8 border-4 border-t-white border-white/20 rounded-full animate-spin" />
              </div>
            )}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
          </div>
        </div>

        {/* Name Section */}
        <div className="px-7 py-4" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
          <p className="text-[14px] mb-2 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <UserIcon className="w-4 h-4" />
            Your name
          </p>
          <div className="flex items-center justify-between">
            {editName ? (
              <input
                autoFocus
                type="text"
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                className="w-full bg-transparent focus:outline-none border-b-2 pb-1 text-[17px]"
                style={{ color: "var(--text-primary)", borderColor: "var(--accent)" }}
              />
            ) : (
              <p className="text-[17px] truncate" style={{ color: "var(--text-primary)" }}>{authUser.fullName}</p>
            )}
            <button onClick={() => editName ? saveName() : setEditName(true)} className="ml-4 p-1 rounded-full transition-colors" style={{ color: "var(--text-muted)" }}>
              {editName ? <CheckIcon className="w-5 h-5" style={{ color: "var(--accent)" }} /> : <Edit2Icon className="w-5 h-5 hover:text-white" />}
            </button>
          </div>
        </div>

        <div className="px-7 py-4 text-[14px]" style={{ color: "var(--text-muted)" }}>
          This is not your username or pin. This name will be visible to your Chatify contacts.
        </div>

        {/* About Section */}
        <div className="px-7 py-4 mt-2" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
          <p className="text-[14px] mb-2 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <InfoIcon className="w-4 h-4" />
            About
          </p>
          <div className="flex items-center justify-between">
            {editBio ? (
              <input
                autoFocus
                type="text"
                value={bioVal}
                onChange={(e) => setBioVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveBio()}
                className="w-full bg-transparent focus:outline-none border-b-2 pb-1 text-[17px]"
                style={{ color: "var(--text-primary)", borderColor: "var(--accent)" }}
              />
            ) : (
              <p className="text-[17px] truncate" style={{ color: "var(--text-primary)" }}>{authUser.bio || "Available"}</p>
            )}
            <button onClick={() => editBio ? saveBio() : setEditBio(true)} className="ml-4 p-1 rounded-full transition-colors" style={{ color: "var(--text-muted)" }}>
              {editBio ? <CheckIcon className="w-5 h-5" style={{ color: "var(--accent)" }} /> : <Edit2Icon className="w-5 h-5 hover:text-white" />}
            </button>
          </div>
        </div>
        
        {/* Additional Detail - Read-Only */}
        <div className="px-7 py-4 mt-6 text-[14px]" style={{ color: "var(--text-muted)" }}>
          Account Information
        </div>
        <div className="px-7 py-4" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Email</p>
            <p className="text-[15px]" style={{ color: "var(--text-primary)" }}>{authUser.email}</p>
          </div>
          <div className="mt-4">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Member since</p>
            <p className="text-[15px]" style={{ color: "var(--text-primary)" }}>{new Date(authUser.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}