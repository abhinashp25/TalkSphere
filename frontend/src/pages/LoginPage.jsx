import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login, isLoggingIn, googleLogin } = useAuthStore();

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  const set = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row bg-[#050505] overflow-hidden text-white selection:bg-[#6366f1]/30"
    >
      {/* Left Hemisphere: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto aurora-bg z-10">
        {/* Floating Background Chat Bubbles for Mobile Viewport Visual Context */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
          <div className="floating-bubble-bg floating-bubble-1 flex items-center gap-2 text-white/30 text-xs">
            <span>💬</span> <span>Hey! Are we meeting today?</span>
          </div>
          <div className="floating-bubble-bg floating-bubble-2 flex items-center gap-2 text-white/30 text-xs">
            <span>📷</span> <span>Photo sent</span>
          </div>
          <div className="floating-bubble-bg floating-bubble-3 flex items-center gap-2 text-white/30 text-xs">
            <span>Yes, in 10 mins! 🙌</span>
          </div>
          <div className="floating-bubble-bg floating-bubble-4 flex items-center gap-2 text-white/30 text-xs">
            <span>👍🏼</span> <span>Reaction</span>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-[420px] relative z-10 glass-card p-8 sm:p-10"
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-sm">
              <img src="/TalkSphere_logo.png" alt="TalkSphere Logo" className="w-6.5 h-6.5 object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white brand-font">TalkSphere</span>
          </div>

          <h2 className="text-3xl font-semibold mb-2 tracking-tight brand-font">Welcome back</h2>
          <p className="text-[#a1a1aa] text-sm mb-8 font-light">Enter your details to access your premium account.</p>

          <form onSubmit={handleEmailSubmit}>
            <div className="floating-input-group">
              <input
                type="email"
                value={formData.email}
                onChange={set("email")}
                className="floating-input"
                placeholder=" "
                required
              />
              <label className="floating-label flex items-center gap-2">
                <Mail size={16} /> Email Address
              </label>
            </div>

            <div className="floating-input-group mt-6">
              <input
                type="password"
                value={formData.password}
                onChange={set("password")}
                className="floating-input"
                placeholder=" "
                required
              />
              <label className="floating-label flex items-center gap-2">
                <Lock size={16} /> Password
              </label>
            </div>

            <div className="flex items-center justify-end -mt-2 mb-6">
              <Link to="#" className="text-xs text-[#6366f1] hover:text-[#4f46e5] font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full btn-primary liquid-glass-btn flex items-center justify-center gap-2 py-3.5 mb-6"
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </button>
          </form>

          <div className="relative flex items-center py-5">
            <div className="flex-grow border-t border-[rgba(255,255,255,0.1)]"></div>
            <span className="flex-shrink-0 mx-4 text-[#a1a1aa] text-xs font-medium uppercase tracking-wider">Or continue with</span>
            <div className="flex-grow border-t border-[rgba(255,255,255,0.1)]"></div>
          </div>

          <button 
            onClick={() => googleLogin(false)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)] transition-colors text-sm font-medium"
          >
            <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>

          <p className="mt-8 text-center text-sm text-[#a1a1aa]">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#6366f1] font-semibold hover:text-[#4f46e5] transition-colors">
              Create one now
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Hemisphere: Branding & Promo (Hidden on mobile) */}
      <div 
        className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden border-l z-20"
        style={{
          background: "linear-gradient(135deg, #070914 0%, #0c102b 50%, #160d33 100%)",
          borderColor: "rgba(255, 255, 255, 0.1)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.8)"
        }}
      >
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.15] mix-blend-overlay pointer-events-none" />
        
        {/* Ambient glowing glass orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md mx-auto xl:mr-auto flex flex-col justify-center h-full">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[48px] leading-[1.1] font-semibold tracking-tight mb-8 brand-font drop-shadow-md text-white"
          >
            Connect with the world,<br/>
            <span className="text-[#a78bfa] font-bold">beautifully.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
            className="text-slate-300 text-lg leading-relaxed font-light backdrop-blur-sm"
          >
            Experience secure, ultra-fast real-time messaging designed for the modern era. Join the world's most elegant communication platform.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-14 inline-flex items-center bg-white/5 backdrop-blur-xl border border-white/15 rounded-full p-2.5 pr-7 shadow-2xl"
          >
            {/* Mock avatars */}
            <div className="flex">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-10 h-10 rounded-full border-[3px] border-slate-900 overflow-hidden relative z-[4-i]" style={{ marginLeft: i !== 0 ? '-14px' : 0 }}>
                  <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="User" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            {/* Live Counter animation */}
            <div className="ml-4 flex flex-col justify-center">
              <span className="text-slate-400 uppercase tracking-widest font-semibold" style={{ fontSize: '10px' }}>Active Users</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-white font-bold brand-font text-lg">2,045,982</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

    </motion.div>
  );
}
