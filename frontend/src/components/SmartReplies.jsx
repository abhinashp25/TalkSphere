import { useEffect } from "react";
import { useAIStore } from "../store/useAIStore";
import { useChatStore } from "../store/useChatStore";
import { motion, AnimatePresence } from "framer-motion";

// Contextual emojis to rotate through suggestion chips
const CHIP_EMOJIS = ["💬", "👍", "😊", "✅", "🙌", "💡", "🔥", "❤️"];

export default function SmartReplies({ lastMessage }) {
  const { smartReplies, fetchSmartReplies, clearSmartReplies } = useAIStore();
  const { setPendingInput } = useChatStore();

  useEffect(() => {
    if (lastMessage) fetchSmartReplies(lastMessage);
    else clearSmartReplies();
  }, [lastMessage, fetchSmartReplies, clearSmartReplies]);

  if (!smartReplies.length) return null;

  const handleSelect = (reply) => {
    setPendingInput(reply);
    clearSmartReplies();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-2 px-3 pb-1.5 pt-1 overflow-x-auto no-scrollbar"
        style={{ background: "var(--bg-secondary)" }}
      >
        {/* Tiny AI spark indicator */}
        <span className="text-[13px] flex-shrink-0 opacity-50">✨</span>

        {smartReplies.map((reply, i) => (
          <motion.button
            key={reply}
            onClick={() => handleSelect(reply)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.14 }}
            className="flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-colors"
            style={{
              background: "var(--bg-input)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--text-primary)",
            }}
          >
            <span className="text-[13px]">{CHIP_EMOJIS[i % CHIP_EMOJIS.length]}</span>
            {reply}
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

