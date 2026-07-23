import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ListsPanel() {
  const [customLists, setCustomLists] = useState(["Favourites", "Work colleagues", "Family"]);
  const [newListVal, setNewListVal] = useState("");

  const handleAddList = () => {
    if (!newListVal.trim()) return;
    setCustomLists(prev => [...prev, newListVal.trim()]);
    setNewListVal("");
    toast.success("List created!");
  };

  const handleRemoveList = (index) => {
    setCustomLists(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Create New List
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newListVal}
            onChange={e => setNewListVal(e.target.value)}
            placeholder="e.g. Work colleagues"
            className="flex-1 p-2.5 bg-[var(--bg-input)] border border-[var(--border)] text-[13px] outline-none rounded-xl"
            style={{ color: "var(--text-primary)" }}
          />
          <button onClick={handleAddList}
            className="px-4 bg-[#00a884] text-white rounded-xl flex items-center justify-center hover:bg-[#009675] transition-colors">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Your Custom Lists
        </p>
        <div className="space-y-2">
          {customLists.map((l, i) => (
            <div key={l} className="p-3.5 rounded-xl flex items-center justify-between border"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2.5">
                <span className="text-xs">📂</span>
                <span className="text-[13.5px] font-medium" style={{ color: "var(--text-primary)" }}>{l}</span>
              </div>
              <button onClick={() => handleRemoveList(i)}
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
