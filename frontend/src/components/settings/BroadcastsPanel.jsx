import { useState } from "react";
import { Radio, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function BroadcastsPanel() {
  const [broadcasts, setBroadcasts] = useState(["Announcements List", "Weekend Plans"]);
  const [newBroadcastVal, setNewBroadcastVal] = useState("");

  const handleAddBroadcast = () => {
    if (!newBroadcastVal.trim()) return;
    setBroadcasts(prev => [...prev, newBroadcastVal.trim()]);
    setNewBroadcastVal("");
    toast.success("Broadcast list created!");
  };

  const handleRemoveBroadcast = (index) => {
    setBroadcasts(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 text-left">
      <div className="p-4 rounded-xl text-center space-y-2 text-white/50 text-xs border"
        style={{ background: "rgba(255,255,255,0.02)", borderColor: "var(--border)" }}>
        <Radio size={24} className="mx-auto text-indigo-400" />
        <p>
          Only contacts with your number in their address book will receive your broadcast messages.
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Create Broadcast List
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newBroadcastVal}
            onChange={e => setNewBroadcastVal(e.target.value)}
            placeholder="e.g. Announcements List"
            className="flex-1 p-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-white text-[13px] outline-none"
          />
          <button onClick={handleAddBroadcast}
            className="px-4 bg-[#00a884] text-white rounded-xl flex items-center justify-center hover:bg-[#009675] transition-colors">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Active Broadcasts
        </p>
        <div className="space-y-2">
          {broadcasts.map((b, i) => (
            <div key={b} className="p-3.5 rounded-xl flex items-center justify-between border"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2.5">
                <Radio size={16} className="text-[#00a884]" />
                <span className="text-[13.5px] font-medium text-white">{b}</span>
              </div>
              <button onClick={() => handleRemoveBroadcast(i)}
                className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
