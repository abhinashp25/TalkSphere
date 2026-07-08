import { useState } from "react";
import { Smartphone, Lock, EyeOff, Eye, Users, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)] border border-[var(--border)]"
        style={{ background: checked ? undefined : "var(--bg-input)" }} />
    </label>
  );
}

export default function PrivacyPanel({ authUser, updatePrivacy, toggle2FA }) {
  const privacy = authUser?.privacySettings || {
    readReceipts: true,
    lastSeenFor: "everyone",
    profilePhotoFor: "everyone",
  };

  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showTyping, setShowTyping] = useState(true);

  // 2FA state
  const [twoFAPassword, setTwoFAPassword] = useState("");
  const [showTwoFAForm, setShowTwoFAForm] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);

  const handlePrivacyChange = async (field, value) => {
    try {
      await updatePrivacy({ [field]: value });
    } catch {
      // updatePrivacy shows its own error toast
    }
  };

  const handleToggle2FA = async () => {
    if (!twoFAPassword.trim()) return toast.error("Enter your password to confirm");
    setTwoFALoading(true);
    const ok = await toggle2FA(twoFAPassword);
    setTwoFALoading(false);
    if (ok) {
      setShowTwoFAForm(false);
      setTwoFAPassword("");
    }
  };

  return (
    <div className="space-y-5 text-left">
      <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
        Who Can See
      </p>
      <div className="rounded-xl overflow-hidden border"
        style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
        <div className="px-4">
          <div className="flex items-center justify-between py-3 gap-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div>
              <p className="text-white font-medium text-[14px]">Read Receipts</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Let others know you've read their messages
              </p>
            </div>
            <Toggle
              checked={privacy.readReceipts}
              onChange={e => handlePrivacyChange("readReceipts", e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between py-3 gap-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div>
              <p className="text-white font-medium text-[14px]">Online Status</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Show when you're active
              </p>
            </div>
            <Toggle checked={showOnlineStatus} onChange={e => setShowOnlineStatus(e.target.checked)} />
          </div>

          <div className="flex items-center justify-between py-3 gap-4">
            <div>
              <p className="text-white font-medium text-[14px]">Typing Indicator</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Show "typing…" to others
              </p>
            </div>
            <Toggle checked={showTyping} onChange={e => setShowTyping(e.target.checked)} />
          </div>
        </div>
      </div>

      <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
        Last Seen
      </p>
      <select
        value={privacy.lastSeenFor}
        onChange={e => handlePrivacyChange("lastSeenFor", e.target.value)}
        className="w-full p-3 rounded-xl text-white text-[14px] outline-none border"
        style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}
      >
        <option value="everyone">Everyone</option>
        <option value="contacts">My Contacts Only</option>
        <option value="nobody">Nobody</option>
      </select>

      <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
        Profile Photo
      </p>
      <select
        value={privacy.profilePhotoFor}
        onChange={e => handlePrivacyChange("profilePhotoFor", e.target.value)}
        className="w-full p-3 rounded-xl text-white text-[14px] outline-none border"
        style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}
      >
        <option value="everyone">Everyone</option>
        <option value="contacts">My Contacts Only</option>
        <option value="nobody">Nobody</option>
      </select>

      <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
        Account Security
      </p>

      {/* Active Session */}
      <div className="rounded-xl p-4 border"
        style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <Smartphone size={17} style={{ color: "var(--accent)" }} />
            <span className="text-white font-medium text-[14px]">Active Sessions</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "rgba(0,168,132,0.15)", color: "var(--accent)" }}>
            1 active
          </span>
        </div>
        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          Chrome · Windows · Now
        </p>
      </div>

      {/* 2FA */}
      <div className="rounded-xl p-4 border"
        style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <Lock size={17} style={{ color: "var(--text-secondary)" }} />
            <span className="text-white font-medium text-[14px]">Two-Factor Auth</span>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
            authUser?.twoFA?.enabled
              ? "bg-emerald-500/15 text-emerald-400"
              : "text-[var(--text-muted)]"}`}
            style={authUser?.twoFA?.enabled ? {} : { background: "var(--bg-secondary)" }}>
            {authUser?.twoFA?.enabled ? "Enabled" : "Off"}
          </span>
        </div>
        <p className="text-[12px] mb-3" style={{ color: "var(--text-muted)" }}>
          {authUser?.twoFA?.enabled
            ? "Your account has an extra layer of protection."
            : "Add an extra layer of security to your account."}
        </p>

        {!showTwoFAForm ? (
          <button
            onClick={() => setShowTwoFAForm(true)}
            className="w-full py-2.5 rounded-xl border text-[13px] font-medium text-white hover:bg-white/5 transition-colors"
            style={{ borderColor: "var(--border)" }}
          >
            {authUser?.twoFA?.enabled ? "Disable 2FA" : "Enable 2FA"}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
              Confirm your password to {authUser?.twoFA?.enabled ? "disable" : "enable"} 2FA
            </p>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={twoFAPassword}
                onChange={e => setTwoFAPassword(e.target.value)}
                placeholder="Current password"
                className="w-full p-3 pr-11 rounded-xl text-white text-[13px] outline-none border"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
              />
              <button type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowTwoFAForm(false); setTwoFAPassword(""); }}
                className="flex-1 py-2.5 rounded-xl border text-[13px] hover:bg-white/5 transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                Cancel
              </button>
              <button
                onClick={handleToggle2FA}
                disabled={twoFALoading}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors disabled:opacity-50"
                style={{ background: "var(--accent)", color: "var(--bg-primary)" }}>
                {twoFALoading ? "Confirming…" : "Confirm"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Block list */}
      <button
        onClick={() => toast("Block list coming soon")}
        className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-[var(--bg-hover)] transition-colors border text-left"
        style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <Users size={17} style={{ color: "var(--text-secondary)" }} />
          <span className="text-white text-[14px] font-medium">Blocked Contacts</span>
        </div>
        <ChevronRight size={17} style={{ color: "var(--text-muted)" }} />
      </button>
    </div>
  );
}
