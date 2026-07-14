import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, Zap, Shield, Circle, ArrowRight, X } from "lucide-react";

const ONBOARDING_TABS = [
  {
    id: "tour",
    icon: "🗺️",
    label: "Quick Tour",
    title: "Everything at a glance",
    subtitle: "Here's how TalkSphere OS is laid out",
    steps: [
      {
        icon: "💬",
        heading: "Your Chats",
        body: "Tap the chat icon on the left rail to see all conversations. Filter by Unread, Favourites, or Groups."
      },
      {
        icon: "📞",
        heading: "Calls & Status",
        body: "Use the Phone and Circle icons to make calls or view status updates from your contacts."
      },
      {
        icon: "👥",
        heading: "Communities",
        body: "Tap the Groups icon to join or create community group chats with multiple people."
      },
      {
        icon: "⚙️",
        heading: "Settings",
        body: "Personalise your theme (Midnight, Ocean, Forest, Galaxy…), font size, and chat preferences in Settings."
      },
    ]
  },
  {
    id: "ai",
    icon: "🤖",
    label: "TalkSphere AI",
    title: "Your smart assistant",
    subtitle: "Powered by Gemini AI — always by your side",
    steps: [
      {
        icon: "⚡",
        heading: "Instant Answers",
        body: "Click the lightning bolt icon or say 'TalkSphere AI' to open your AI assistant at any time."
      },
      {
        icon: "✍️",
        heading: "Message Drafting",
        body: "Stuck on what to say? Ask the AI to help you craft the perfect reply or message."
      },
      {
        icon: "🌍",
        heading: "Translation",
        body: "Long-press any message and tap 'Translate to English' to instantly translate it with AI."
      },
      {
        icon: "📊",
        heading: "Chat Insights",
        body: "Open any chat and tap the Sparkles icon to see AI-powered conversation insights and summaries."
      },
    ]
  },
  {
    id: "privacy",
    icon: "🔒",
    label: "Privacy & Safety",
    title: "Security you can trust",
    subtitle: "Your conversations are protected",
    steps: [
      {
        icon: "🔐",
        heading: "End-to-End Encrypted",
        body: "Every message you send is encrypted in transit. Only you and your recipient can read it."
      },
      {
        icon: "👻",
        heading: "Disappearing Messages",
        body: "Enable disappearing messages in any chat so messages auto-delete after a set time."
      },
      {
        icon: "🚫",
        heading: "Block & Report",
        body: "Long-press a contact to block them. All your messages from them vanish immediately."
      },
      {
        icon: "⭐",
        heading: "Starred Messages",
        body: "Star important messages by long-pressing and choosing ⭐. Find them later in Starred Messages."
      },
    ]
  }
];

export default function NativeEmptyState({ onActivateMetaAI }) {
  const [activeTab, setActiveTab] = useState("tour");
  const [activeStep, setActiveStep] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);

  const currentTab = ONBOARDING_TABS.find(t => t.id === activeTab);

  const handleNextStep = () => {
    if (activeStep < currentTab.steps.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      // cycle to next tab or close
      const tabIdx = ONBOARDING_TABS.findIndex(t => t.id === activeTab);
      if (tabIdx < ONBOARDING_TABS.length - 1) {
        setActiveTab(ONBOARDING_TABS[tabIdx + 1].id);
        setActiveStep(0);
      } else {
        setGuideOpen(false);
      }
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setActiveStep(0);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden"
      style={{ background: "var(--bg-primary)" }}>

      {/* Background concentric rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[80, 60, 42].map((size, i) => (
          <div
            key={i}
            className="absolute rounded-full border"
            style={{
              width: `${size}vw`,
              height: `${size}vw`,
              maxWidth: `${size * 10}px`,
              maxHeight: `${size * 10}px`,
              borderColor: "var(--border)",
              opacity: 0.4 - i * 0.12,
            }}
          />
        ))}
      </div>

      {/* Accent radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 50%, var(--bg-active) 0%, transparent 70%)",
          opacity: 0.5
        }}
      />

      {/* Central Content */}
      <div className="relative z-10 max-w-[520px] flex flex-col items-center">

        {/* Logo Badge */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-20 h-20 mb-8 flex items-center justify-center"
        >
          <img src="/TalkSphere_logo.png" alt="TalkSphere" className="w-full h-full object-contain" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-4xl font-bold text-white tracking-tight brand-font mb-3"
        >
          TalkSphere OS
        </motion.h1>

        <motion.p
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="text-[15px] leading-[1.6] font-light max-w-[360px]"
          style={{ color: "var(--text-secondary)" }}
        >
          Experience uncompromised privacy and speed. Select a conversation from the sidebar or start fresh.
        </motion.p>

        {/* Quick Action Buttons */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex items-center justify-center gap-3 flex-wrap"
        >
          <button
            className="flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium border rounded-xl transition-all hover:bg-[var(--bg-hover)]"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            <MessageSquarePlus size={17} style={{ color: "var(--text-secondary)" }} />
            New Message
          </button>

          <button
            onClick={onActivateMetaAI}
            className="flex items-center gap-2.5 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:opacity-90"
            style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
          >
            <Zap size={17} />
            TalkSphere AI
          </button>

          <button
            onClick={() => setGuideOpen(true)}
            className="flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium border rounded-xl transition-all hover:bg-[var(--bg-hover)]"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            <span className="text-base">📖</span>
            Quick Guide
          </button>
        </motion.div>

        {/* Feature highlights strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.45 }}
          className="mt-12 grid grid-cols-3 gap-3 w-full max-w-[380px]"
        >
          {[
            { icon: "⚡", text: "Lightning Fast" },
            { icon: "🔐", text: "E2E Encrypted" },
            { icon: "🎨", text: "8 Themes" },
          ].map((feat) => (
            <div
              key={feat.text}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border text-center"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
            >
              <span className="text-xl">{feat.icon}</span>
              <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>{feat.text}</span>
            </div>
          ))}
        </motion.div>

        {/* E2E footer disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.65 }}
          className="mt-8 flex items-center gap-2 text-[11px] font-medium tracking-widest uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          End-to-End Encrypted
        </motion.div>
      </div>

      {/* Interactive Onboarding Guide Modal */}
      <AnimatePresence>
        {guideOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: "blur(24px)", background: "rgba(0,0,0,0.75)" }}
            onClick={() => setGuideOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="w-full max-w-md rounded-3xl overflow-hidden border shadow-2xl"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                    Quick Start Guide
                  </p>
                  <h2 className="text-xl font-bold text-white brand-font mt-1">
                    {currentTab.title}
                  </h2>
                  <p className="text-[12.5px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {currentTab.subtitle}
                  </p>
                </div>
                <button
                  onClick={() => setGuideOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center border transition-all hover:bg-[var(--bg-hover)] flex-shrink-0 ml-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <X size={16} style={{ color: "var(--text-secondary)" }} />
                </button>
              </div>

              {/* Tab Switchers */}
              <div className="flex px-6 gap-2 mb-4">
                {ONBOARDING_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium rounded-xl border transition-all"
                    style={{
                      background: activeTab === tab.id ? "var(--bg-active)" : "var(--bg-input)",
                      borderColor: activeTab === tab.id ? "var(--accent)" : "var(--border)",
                      color: activeTab === tab.id ? "var(--accent)" : "var(--text-secondary)"
                    }}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Step Progress Dots */}
              <div className="flex items-center gap-1.5 px-6 mb-5">
                {currentTab.steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className="transition-all rounded-full"
                    style={{
                      width: activeStep === i ? "20px" : "6px",
                      height: "6px",
                      background: activeStep === i ? "var(--accent)" : "var(--border)"
                    }}
                  />
                ))}
              </div>

              {/* Step Card with animated transitions */}
              <div className="px-6 pb-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeTab}-${activeStep}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22 }}
                    className="rounded-2xl p-5 border mb-5"
                    style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl border"
                        style={{ background: "var(--bg-active)", borderColor: "var(--border)" }}
                      >
                        {currentTab.steps[activeStep].icon}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[15px] font-semibold text-white mb-1.5">
                          {currentTab.steps[activeStep].heading}
                        </p>
                        <p className="text-[13px] leading-[1.6]" style={{ color: "var(--text-secondary)" }}>
                          {currentTab.steps[activeStep].body}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                    disabled={activeStep === 0 && activeTab === ONBOARDING_TABS[0].id}
                    className="flex-1 py-2.5 text-sm font-medium border rounded-xl transition-all hover:bg-[var(--bg-hover)] disabled:opacity-30"
                    style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  >
                    Back
                  </button>

                  <button
                    onClick={handleNextStep}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90"
                    style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
                  >
                    {activeStep === currentTab.steps.length - 1 && activeTab === ONBOARDING_TABS[ONBOARDING_TABS.length - 1].id
                      ? "Got it! 🎉"
                      : (
                        <>
                          Next
                          <ArrowRight size={15} />
                        </>
                      )
                    }
                  </button>
                </div>

                {/* Skip to start chatting */}
                <button
                  onClick={() => setGuideOpen(false)}
                  className="w-full mt-3 text-center text-[12px] transition-colors hover:text-white"
                  style={{ color: "var(--text-muted)" }}
                >
                  Skip guide — I'll figure it out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
