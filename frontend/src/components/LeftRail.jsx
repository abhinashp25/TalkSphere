import { MessageSquare, Phone, Users, CircleDot, Archive, Settings, Zap } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { motion } from "framer-motion";

export default function LeftRail({ activeTab, setActiveTab, isHiddenOnMobile }) {
  const { unreadCounts, isStatusViewerOpen } = useChatStore();
  const { authUser } = useAuthStore();
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  // Hide bottom nav when status viewer is open (prevents z-index conflict with reply input)
  const shouldHideBottomNav = isHiddenOnMobile || isStatusViewerOpen;

  return (
    <>
      {/* Desktop Vertical Navigation Rail (Hidden on mobile) */}
      <div
        className="hidden sm:flex items-center justify-start py-4 gap-2 flex-shrink-0 w-[72px] h-auto border-r flex-col"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border)",
        }}
      >
        {/* Profile Avatar (Top on Desktop) */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("profile")}
          className="w-10 h-10 rounded-full overflow-hidden mb-6 flex-shrink-0 relative"
          style={{
            border: activeTab === "profile" ? "2px solid var(--accent)" : "2px solid transparent",
            transition: "border-color 0.2s",
          }}
        >
          <img src={authUser?.profilePic || "/avatar.png"} alt="me" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </motion.button>

        {/* Primary Nav */}
        <div className="flex flex-col w-auto justify-start items-center gap-2 flex-none">
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
        <div className="flex-1" />

        {/* TalkSphere AI & Settings (Bottom on Desktop) */}
        <div className="flex flex-col items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="TalkSphere AI"
            onClick={() => setActiveTab("chatify-ai")}
            className="relative flex items-center justify-center w-11 h-11 rounded-xl transition-all border hover:bg-[var(--bg-hover)]"
            style={{
              background: activeTab === "chatify-ai" ? "var(--bg-active)" : "var(--bg-input)",
              color: activeTab === "chatify-ai" ? "var(--accent)" : "var(--text-secondary)",
              borderColor: activeTab === "chatify-ai" ? "var(--accent)" : "var(--border)",
            }}
          >
            <Zap size={20} strokeWidth={2} />
            {activeTab === "chatify-ai" && (
              <span className="absolute left-[-14px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: "var(--accent)" }} />
            )}
          </motion.button>

          <div className="my-2" />

          <div className="flex flex-col gap-2">
            <NavBtn label="Archive" active={activeTab === "archived"} onClick={() => setActiveTab("archived")}>
              <Archive size={20} strokeWidth={2} />
            </NavBtn>

            <NavBtn label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")}>
              <Settings size={20} strokeWidth={2} />
            </NavBtn>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation (Hidden on desktop, matches approved WhatsApp design) */}
      {!shouldHideBottomNav && (
        <div className="sm:hidden mobile-bottom-nav">
          <MobileNavTab
            label="Chats"
            active={!activeTab || activeTab === "chats"}
            badge={totalUnread}
            onClick={() => setActiveTab("chats")}
          >
            <MessageSquare size={20} strokeWidth={!activeTab || activeTab === "chats" ? 2.5 : 2} />
          </MobileNavTab>

          <MobileNavTab
            label="Updates"
            active={activeTab === "status"}
            onClick={() => setActiveTab("status")}
          >
            <CircleDot size={20} strokeWidth={activeTab === "status" ? 2.5 : 2} />
          </MobileNavTab>

          <MobileNavTab
            label="Communities"
            active={activeTab === "communities"}
            onClick={() => setActiveTab("communities")}
          >
            <Users size={20} strokeWidth={activeTab === "communities" ? 2.5 : 2} />
          </MobileNavTab>

          <MobileNavTab
            label="Calls"
            active={activeTab === "calls"}
            onClick={() => setActiveTab("calls")}
          >
            <Phone size={20} strokeWidth={activeTab === "calls" ? 2.5 : 2} />
          </MobileNavTab>
        </div>
      )}
    </>
  );
}

function MobileNavTab({ children, label, active, badge, onClick }) {
  return (
    <button onClick={onClick} className={`mobile-nav-btn ${active ? "active" : ""}`}>
      <div className="mobile-nav-pill relative">
        {active && (
          <motion.div
            layoutId="activeMobileTabPill"
            className="absolute inset-0 rounded-full"
            style={{
              background: "var(--bg-active)",
              border: "1px solid var(--border)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center justify-center">
          {children}
        </span>
      </div>
      <span className="mobile-nav-label relative z-10">{label}</span>

      {badge > 0 && (
        <span className="mobile-nav-badge">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
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
