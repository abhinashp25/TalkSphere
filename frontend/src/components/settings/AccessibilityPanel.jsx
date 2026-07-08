import { useState } from "react";

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)] border border-[var(--border)]"
        style={{ background: checked ? undefined : "var(--bg-input)" }} />
    </label>
  );
}

export default function AccessibilityPanel() {
  const [highContrast, setHighContrast] = useState(false);
  const [disableAnimations, setDisableAnimations] = useState(false);

  return (
    <div className="space-y-6 text-left">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Visual Enhancements
        </p>
        <div className="rounded-xl overflow-hidden px-4 border"
          style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
          <div className="flex items-center justify-between py-3 gap-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="min-w-0">
              <p className="text-white font-medium text-[14px]">High Contrast</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Increase visibility of standard app text fields
              </p>
            </div>
            <Toggle checked={highContrast} onChange={e => setHighContrast(e.target.checked)} />
          </div>

          <div className="flex items-center justify-between py-3 gap-4">
            <div className="min-w-0">
              <p className="text-white font-medium text-[14px]">Disable Animations</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Reduces tab sliding and fade motions
              </p>
            </div>
            <Toggle checked={disableAnimations} onChange={e => setDisableAnimations(e.target.checked)} />
          </div>
        </div>
      </div>
    </div>
  );
}
