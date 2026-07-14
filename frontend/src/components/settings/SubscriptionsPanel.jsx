import { useState } from "react";
import { Award, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function SubscriptionsPanel() {
  const [premiumPlan, setPremiumPlan] = useState("monthly");
  const [isSubscribed, setIsSubscribed] = useState(false);

  return (
    <div className="space-y-6">
      {/* Premium Branding banner */}
      <div className="p-5 rounded-2xl text-center space-y-2.5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)", border: "1px solid rgba(99,102,241,0.2)" }}>
        <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center mx-auto">
          <Award size={26} />
        </div>
        <div>
          <h3 className="text-white font-bold text-[17px]">TalkSphere Premium</h3>
          <p className="text-xs text-white/60 mt-1">Unlock limits and explore advanced options</p>
        </div>
      </div>

      {/* Premium Perks */}
      <div className="space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3 mt-5" style={{ color: "var(--text-muted)" }}>
          Premium Perks
        </p>
        {[
          { title: "HD Media Transfer", desc: "No compression on photos or videos" },
          { title: "Unlimited Status Duration", desc: "Keep statuses active up to 7 days" },
          { title: "Exclusive UI Themes", desc: "Access 8 additional dark mode setups" },
          { title: "Extended Audio limit", desc: "Record up to 30 minute audio notes" }
        ].map(perk => (
          <div key={perk.title} className="flex gap-3 text-left">
            <CheckCircle size={18} className="text-[#00a884] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-[13.5px] font-medium">{perk.title}</p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{perk.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Plan selection */}
      <div className="space-y-3 text-left">
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3 mt-5" style={{ color: "var(--text-muted)" }}>
          Choose Plan
        </p>
        <div className="flex gap-2">
          {["monthly", "yearly"].map(plan => (
            <button key={plan} onClick={() => setPremiumPlan(plan)}
              className="flex-1 p-4 rounded-xl border text-center transition-all"
              style={{
                background: premiumPlan === plan ? "var(--bg-active)" : "var(--bg-input)",
                borderColor: premiumPlan === plan ? "var(--accent)" : "var(--border)",
                color: "var(--text-primary)"
              }}>
              <p className="font-bold text-[14px] capitalize">{plan}</p>
              <p className="text-xs font-semibold mt-1 text-[#00a884]">
                {plan === "monthly" ? "$2.99 / mo" : "$24.99 / yr"}
              </p>
              {plan === "yearly" && (
                <span className="inline-block mt-2 text-[9px] bg-[#00a884]/20 text-[#00a884] px-2 py-0.5 rounded-full font-bold uppercase">
                  Save 30%
                </span>
              )}
            </button>
          ))}
        </div>

        <button onClick={() => { setIsSubscribed(true); toast.success("Subscribed to TalkSphere Premium!"); }}
          disabled={isSubscribed}
          className="w-full mt-4 py-3 rounded-xl font-bold transition-all text-[14px]"
          style={{ background: isSubscribed ? "var(--bg-input)" : "var(--accent)", color: isSubscribed ? "var(--text-muted)" : "var(--bg-primary)" }}>
          {isSubscribed ? "Premium Active" : `Subscribe to Premium`}
        </button>
      </div>
    </div>
  );
}
