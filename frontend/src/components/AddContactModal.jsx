import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

export default function AddContactModal({ isOpen, onClose }) {
  const [query, setQuery]             = useState("");
  const [allContacts, setAllContacts] = useState([]);
  const [loading, setLoading]         = useState(false);
  const { setSelectedUser } = useChatStore();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setLoading(true), 0);
      axiosInstance.get("/messages/contacts")
        .then(res => setAllContacts(res.data))
        .catch((err) => {
          console.error(err);
          toast.error("Failed to load contacts list");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = allContacts.filter(c =>
    c.fullName?.toLowerCase().includes(query.toLowerCase()) ||
    c.email?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{
              background: "var(--bg-header)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Start new chat
            </h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-full transition-colors hover:bg-white/10"
              style={{ color: "var(--text-secondary)" }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Bar */}
          <div
            className="p-4 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div
              className="relative flex items-center rounded-xl overflow-hidden h-[44px] transition-all"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="pl-4 pr-3" style={{ color: "var(--text-muted)" }}>
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search name or email"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-[14px] focus:outline-none"
                style={{
                  color: "var(--text-primary)",
                  caretColor: "var(--accent)",
                }}
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex justify-center p-8">
                <div
                  className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: "var(--accent) transparent transparent transparent" }}
                />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="text-4xl mb-3 opacity-30">🔍</span>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {query ? `No contacts found for "${query}"` : "No contacts available"}
                </p>
              </div>
            ) : (
              filtered.map(contact => (
                <button
                  key={contact._id}
                  onClick={() => { setSelectedUser(contact); onClose(); }}
                  className="w-full flex items-center gap-4 p-3 rounded-xl transition-colors text-left group"
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <img
                    src={contact.profilePic || "/avatar.png"}
                    alt={contact.fullName}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    style={{ border: "1px solid var(--border)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[15px] font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {contact.fullName}
                    </p>
                    <p
                      className="text-[13px] truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {contact.bio || "TalkSphere user"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
