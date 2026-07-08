import { useState } from "react";
import { Zap, Star, ChevronDown, MessageSquare, ChevronRight, Globe, FileText, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const FAQ_ITEMS = [
  {
    q: "How do I start a new chat?",
    a: "Tap the compose icon (✏️) at the top of your chats list, or use the New Message button on the home screen. You can search by name or email.",
  },
  {
    q: "Are my messages end-to-end encrypted?",
    a: "Yes. Every message, photo, voice note, and file you send on Chatify is protected with end-to-end encryption. Only you and the recipient can read them.",
  },
  {
    q: "How do I enable two-factor authentication?",
    a: "Go to Settings → Privacy & Security → Two-Factor Authentication and tap Enable 2FA. You will be asked to confirm your password.",
  },
  {
    q: "Can I recover deleted messages?",
    a: "Messages deleted with \"Unsend for everyone\" are permanently removed from all devices. Messages deleted locally can only be recovered if you have a backup.",
  },
  {
    q: "How do I change my profile photo?",
    a: "Go to Settings → Profile, then tap your profile picture. You can upload a new photo from your device.",
  },
];

const PRIVACY_POLICY = `Chatify Privacy Policy — Last updated July 2026

1. Information We Collect
We collect only what is necessary to provide the service: your name, email address, profile photo, and the messages you send. We do not sell your data to third parties.

2. End-to-End Encryption
All messages are encrypted in transit using industry-standard protocols. We cannot read your messages.

3. Data Retention
Messages are stored on our servers until you or the recipient deletes them. Profile data is retained until you delete your account.

4. Third-Party Services
Chatify uses Cloudinary for media storage and Socket.IO for real-time messaging. These services have their own privacy policies.

5. Your Rights
You can request deletion of your account and all associated data at any time by contacting support@chatify.app.

6. Cookies
We use session cookies strictly for authentication. No tracking or advertising cookies are used.

7. Changes to This Policy
We will notify you of significant changes via in-app notification. Continued use of the app constitutes acceptance.

Contact: privacy@chatify.app`;

const TERMS_OF_SERVICE = `Chatify Terms of Service — Last updated July 2026

1. Acceptance
By using Chatify you agree to these terms. If you do not agree, do not use the app.

2. Eligibility
You must be at least 13 years old to use Chatify. By using the app you confirm you meet this requirement.

3. Acceptable Use
You agree not to use Chatify to send spam, harass other users, distribute malware, or share illegal content.

4. Intellectual Property
Chatify and its logo are trademarks of the Chatify team. Your content remains yours.

5. Disclaimer
Chatify is provided "as is" without warranty of any kind. We are not liable for any damages arising from use of the service.

6. Termination
We may suspend or terminate accounts that violate these terms without prior notice.

7. Governing Law
These terms are governed by applicable law. Disputes will be resolved through binding arbitration.

Contact: legal@chatify.app`;

function TextModal({ title, content, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderBottomColor: "var(--border)" }}>
          <h3 className="font-bold text-white text-[16px]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
          <pre className="whitespace-pre-wrap text-[13px] leading-relaxed font-sans"
            style={{ color: "var(--text-secondary)" }}>
            {content}
          </pre>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function HelpPanel() {
  const [openFaq, setOpenFaq] = useState(null);
  const [starRating, setStarRating] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleStarRate = (n) => {
    setStarRating(n);
    toast.success(`Thanks for rating us ${n} star${n > 1 ? "s" : ""}! ⭐`);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col items-center py-5 mb-2">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
          style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--bg-secondary) 100%)", border: "1px solid var(--border)" }}>
          <Zap size={30} className="text-white" />
        </div>
        <h3 className="text-[18px] font-bold text-white mb-0.5">Chatify</h3>
        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Version 3.0.0 · Build 2026.07</p>
      </div>

      <div className="rounded-xl p-4 mb-4 text-center border"
        style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
        <p className="text-white font-medium text-[14px] mb-3">Enjoying Chatify?</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onMouseEnter={() => setHoverStar(n)}
              onMouseLeave={() => setHoverStar(0)}
              onClick={() => handleStarRate(n)}
              className="transition-transform hover:scale-110 active:scale-95 animate-none"
            >
              <Star
                size={28}
                fill={(hoverStar || starRating) >= n ? "#f59e0b" : "none"}
                style={{ color: (hoverStar || starRating) >= n ? "#f59e0b" : "var(--text-muted)" }}
              />
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
        Frequently Asked Questions
      </p>
      <div className="space-y-2 mb-4">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="rounded-xl overflow-hidden border"
            style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-3"
            >
              <span className="text-[13.5px] font-medium text-white">{item.q}</span>
              <ChevronDown
                size={16}
                className="flex-shrink-0 transition-transform duration-200"
                style={{
                  color: "var(--text-muted)",
                  transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>
            <AnimatePresence>
              {openFaq === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <p className="px-4 pb-4 text-[13px] leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}>
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
        Legal & Support
      </p>
      <div className="space-y-2">
        <a
          href="mailto:support@chatify.app"
          className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors hover:bg-[var(--bg-hover)] border"
          style={{ background: "var(--bg-input)", borderColor: "var(--border)", textDecoration: "none" }}
        >
          <MessageSquare size={18} style={{ color: "var(--accent)" }} />
          <div>
            <p className="text-white text-[14px] font-medium">Contact Support</p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>support@chatify.app</p>
          </div>
          <ChevronRight size={16} className="ml-auto" style={{ color: "var(--text-muted)" }} />
        </a>

        <button
          onClick={() => setShowPrivacy(true)}
          className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors hover:bg-[var(--bg-hover)] border"
          style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}
        >
          <Globe size={18} style={{ color: "var(--text-secondary)" }} />
          <div className="text-left">
            <p className="text-white text-[14px] font-medium">Privacy Policy</p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>How we handle your data</p>
          </div>
          <ChevronRight size={16} className="ml-auto" style={{ color: "var(--text-muted)" }} />
        </button>

        <button
          onClick={() => setShowTerms(true)}
          className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors hover:bg-[var(--bg-hover)] border"
          style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}
        >
          <FileText size={18} style={{ color: "var(--text-secondary)" }} />
          <div className="text-left">
            <p className="text-white text-[14px] font-medium">Terms of Service</p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Rules and usage agreement</p>
          </div>
          <ChevronRight size={16} className="ml-auto" style={{ color: "var(--text-muted)" }} />
        </button>
      </div>

      <p className="text-center text-[11px] mt-6 mb-2" style={{ color: "var(--text-muted)" }}>
        Made with ❤️ by the Chatify team
      </p>

      {/* Privacy Policy modal */}
      <AnimatePresence>
        {showPrivacy && (
          <TextModal
            title="Privacy Policy"
            content={PRIVACY_POLICY}
            onClose={() => setShowPrivacy(false)}
          />
        )}
      </AnimatePresence>

      {/* Terms of Service modal */}
      <AnimatePresence>
        {showTerms && (
          <TextModal
            title="Terms of Service"
            content={TERMS_OF_SERVICE}
            onClose={() => setShowTerms(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
