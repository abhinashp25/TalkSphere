import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Lock, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function PrivacyGuard({ children }) {
  const [isShieldActive, setIsShieldActive] = useState(false);

  useEffect(() => {
    // 1. Prevent print, save page, and inspection shortcuts
    const handleKeyDown = (e) => {
      // PrintScreen Key
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        toast.error("Screenshots are restricted for user privacy.", {
          id: "screenshot-restricted",
          duration: 3000,
        });
      }

      // Ctrl+P / Cmd+P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        toast.error("Printing pages is disabled for security.", {
          id: "print-disabled",
        });
      }

      // Ctrl+S / Cmd+S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        toast.error("Saving pages is disabled for security.", {
          id: "save-disabled",
        });
      }

      // Ctrl+U / Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && e.key === "u") {
        e.preventDefault();
        toast.error("Source inspection shortcut is restricted.", {
          id: "source-restricted",
        });
      }
    };

    // 2. Shield app content when window loses focus (Snipping tool / multitasking)
    const handleBlur = () => {
      setIsShieldActive(true);
    };

    const handleFocus = () => {
      setIsShieldActive(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsShieldActive(true);
      } else {
        setIsShieldActive(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-screen">
      {/* Main app content */}
      <div
        className="w-full h-full transition-all duration-300"
        style={{
          filter: isShieldActive ? "blur(25px) grayscale(40%)" : "none",
          pointerEvents: isShieldActive ? "none" : "auto",
        }}
      >
        {children}
      </div>

      {/* iOS style Screen Shield overlay */}
      <AnimatePresence>
        {isShieldActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 text-center"
            style={{
              background: "rgba(10, 10, 10, 0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="max-w-xs p-6 rounded-2xl flex flex-col items-center gap-4"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(0, 168, 132, 0.15)",
                  color: "var(--accent, #00a884)",
                }}
              >
                <Lock size={22} className="animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-[17px] font-bold text-white leading-snug">
                  Screen Protected
                </h3>
                <p className="text-[13px] text-white/50 leading-relaxed">
                  For your privacy, chat content is shielded while TalkSphere is out of focus.
                </p>
              </div>

              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-white/40">
                <EyeOff size={12} />
                <span>Encrypted Connection</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
