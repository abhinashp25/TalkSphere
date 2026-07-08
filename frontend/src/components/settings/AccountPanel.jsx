import { useState } from "react";
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

export default function AccountPanel() {
  const [secNotifs, setSecNotifs] = useState(true);
  const [oldPhone, setOldPhone] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [numberStep, setNumberStep] = useState(1);

  return (
    <div className="space-y-6 text-left">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Security Info
        </p>
        <div className="rounded-xl overflow-hidden px-4 border"
          style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
          <div className="flex items-center justify-between py-3 gap-4">
            <div className="min-w-0">
              <p className="text-white font-medium text-[14px]">Security Notifications</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Show notification indicators when contacts change security details
              </p>
            </div>
            <Toggle checked={secNotifs} onChange={e => setSecNotifs(e.target.checked)} />
          </div>
        </div>
      </div>

      {/* Change Number step block */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Change Phone Number
        </p>
        <div className="p-4 rounded-xl space-y-3 border"
          style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
          {numberStep === 1 ? (
            <>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Changing your number will migrate account settings, group lists, and profile info.
              </p>
              <input
                type="tel"
                value={oldPhone}
                onChange={e => setOldPhone(e.target.value)}
                placeholder="Enter old phone number"
                className="w-full p-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white text-[13px] outline-none"
              />
              <input
                type="tel"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="Enter new phone number"
                className="w-full p-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white text-[13px] outline-none"
              />
              <button onClick={() => { if(oldPhone && newPhone) setNumberStep(2); else toast.error("Fill both numbers"); }}
                className="w-full py-2 bg-white text-black font-bold rounded-lg text-xs hover:bg-neutral-200 transition-colors">
                Next Step
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-[#00a884] font-medium">
                Enter the verification code sent to {newPhone}
              </p>
              <input
                type="text"
                maxLength={6}
                placeholder="6-digit code"
                className="w-full p-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white text-[13px] outline-none text-center tracking-widest font-mono"
              />
              <div className="flex gap-2">
                <button onClick={() => setNumberStep(1)}
                  className="flex-1 py-2 border border-[var(--border)] text-white font-bold rounded-lg text-xs hover:bg-white/5 transition-colors">
                  Back
                </button>
                <button onClick={() => { setNumberStep(1); setOldPhone(""); setNewPhone(""); toast.success("Number verified successfully!"); }}
                  className="flex-1 py-2 bg-[#00a884] text-white font-bold rounded-lg text-xs hover:bg-[#009675] transition-colors">
                  Verify
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
