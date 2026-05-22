import { MessageSquare, Phone, Users, CircleDot, Archive, Settings, Zap } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { motion } from "framer-motion";

export default function LeftRail({ activeTab, setActiveTab, isHiddenOnMobile }) {
  const { unreadCounts } = useChatStore();
  const { authUser } = useAuthStore();
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <div
      className={`sm:flex items-center justify-between sm:justify-start px-4 sm:px-0 pt-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))] sm:py-4 gap-2 flex-shrink-0 w-full sm:w-[72px] h-[calc(60px+env(safe-area-inset-bottom,0px))] sm:h-auto border-t sm:border-t-0 sm:border-r sm:flex-col ${isHiddenOnMobile ? "hidden" : "flex"}`}
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border)",
      }}
    >
      {/* Profile Avatar (Top on Desktop, Hidden/Left on Mobile) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setActiveTab("profile")}
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden sm:mb-6 flex-shrink-0 relative hidden sm:block"
        style={{
          border: activeTab === "profile" ? "2px solid var(--accent)" : "2px solid transparent",
          transition: "border-color 0.2s",
        }}
      >
        <img src={authUser?.profilePic || "/avatar.png"} alt="me" className="w-full h-full object-cover" />
      </motion.button>

      {/* Primary Nav */}
      <div className="flex sm:flex-col w-full sm:w-auto justify-around sm:justify-start items-center gap-2 sm:gap-2 flex-1 sm:flex-none">
        <NavBtn label="Chats" active={!activeTab || activeTab === "chats"} badge={totalUnread} onClick={() => setActiveTab("chats")}>
          <MessageSquare size={20} strokeWidth={2} />
        </NavBtn>

        <NavBtn label="Calls" active={activeTab === "calls"} onClick={() => setActiveTab("calls")}>
          <Phone size={20} strokeWidth={2} />
        </NavBtn>

        <NavBtn label="Status" active={activeTab === "status"} onClick={() => setActiveTab("status")}>
          <CircleDot size={20} strokeWidth={2} />
        </NavBtn>

        <NavBtn label="Communities" active={activeTab === "communities"} onClick={() => setActiveTab("communities")}>
          <Users size={20} strokeWidth={2} />
        </NavBtn>
      </div>

      {/* Spacer for Desktop */}
      <div className="hidden sm:block flex-1" />

      {/* Chatify AI & Settings (Bottom on Desktop, Right on Mobile) */}
      <div className="flex sm:flex-col items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Chatify AI"
          onClick={() => setActiveTab("chatify-ai")}
          className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all border hover:bg-[var(--bg-hover)]"
          style={{
            background: activeTab === "chatify-ai" ? "var(--bg-active)" : "var(--bg-input)",
            color: activeTab === "chatify-ai" ? "var(--accent)" : "var(--text-secondary)",
            borderColor: activeTab === "chatify-ai" ? "var(--accent)" : "var(--border)",
          }}
        >
          <Zap size={20} strokeWidth={2} />
          {activeTab === "chatify-ai" && (
            <span className="absolute left-[-14px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full hidden sm:block" style={{ background: "var(--accent)" }} />
          )}
        </motion.button>

        <div className="my-1 sm:my-2 hidden sm:block" />

        <div className="hidden sm:flex flex-col gap-2">
          <NavBtn label="Archive" active={activeTab === "archived"} onClick={() => setActiveTab("archived")}>
            <Archive size={20} strokeWidth={2} />
          </NavBtn>

          <NavBtn label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")}>
            <Settings size={20} strokeWidth={2} />
          </NavBtn>
        </div>
        
        {/* Profile Avatar for Mobile */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("profile")}
          className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 relative sm:hidden ml-2"
          style={{
            border: activeTab === "profile" ? "2px solid var(--accent)" : "2px solid transparent",
          }}
        >
          <img src={authUser?.profilePic || "/avatar.png"} alt="me" className="w-full h-full object-cover" />
        </motion.button>
      </div>
    </div>
  );
}

function NavBtn({ children, label, active, badge, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      title={label}
      onClick={onClick}
      className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all hover:bg-[var(--bg-hover)]"
      style={{
        background: active ? "var(--bg-active)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-secondary)",
      }}
    >
      {children}
      {badge > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] px-1 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center shadow-sm"
          style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {active && (
        <span className="absolute left-[-14px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full hidden sm:block" style={{ background: "var(--accent)" }} />
      )}
    </motion.button>
  );
}
