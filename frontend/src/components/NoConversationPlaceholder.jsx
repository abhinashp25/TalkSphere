export default function NoConversationPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8 select-none">

      {/* Animated logo circle */}
      <div className="relative">
        <div
          className="w-[140px] h-[140px] rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(79,209,197,0.12) 0%, rgba(102,126,234,0.06) 100%)',
            border: '1px solid rgba(79,209,197,0.15)',
            boxShadow: '0 0 40px rgba(79,209,197,0.08)',
          }}
        >
          {/* Chat bubble icon */}
          <svg className="w-16 h-16" viewBox="0 0 48 48" fill="none">
            <path d="M8 6h32a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H14l-8 8V10a4 4 0 0 1 4-4z"
              fill="rgba(79,209,197,0.15)" stroke="#4fd1c5" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="16" cy="17" r="2" fill="#4fd1c5" opacity="0.7" />
            <circle cx="24" cy="17" r="2" fill="#4fd1c5" opacity="0.7" />
            <circle cx="32" cy="17" r="2" fill="#4fd1c5" opacity="0.7" />
          </svg>
        </div>

        {/* Floating status dots */}
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center"
          style={{ background: '#48bb78', borderColor: 'var(--bg-primary)' }}>
          <span className="text-[9px] text-white font-bold">✓</span>
        </div>
      </div>

      <div className="text-center space-y-3 max-w-[280px]">
        <h2 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)' }}>
          TalkSphere for Web
        </h2>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Select a conversation to start messaging, or find a contact to begin a new chat.
        </p>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-2 max-w-[260px]">
        {[
          { icon: "⚡", label: "Real-time" },
          { icon: "🔒", label: "Encrypted" },
          { icon: "😊", label: "Reactions" },
          { icon: "🔔", label: "Notifications" },
        ].map(({ icon, label }) => (
          <div key={label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
            style={{
              background: 'rgba(79,209,197,0.06)',
              border: '1px solid rgba(79,209,197,0.15)',
              color: 'var(--text-secondary)',
            }}>
            <span>{icon}</span>
            {label}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        End-to-end encrypted
      </div>
    </div>
  );
}
