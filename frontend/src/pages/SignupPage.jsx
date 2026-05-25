import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { User, Mail, Lock, ArrowRight, Loader2, Apple, CheckCircle2, Shield, Zap, Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function SignupPage() {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [tooltip, setTooltip] = useState(null);
  const { signup, googleLogin, isSigningUp, isLoggingIn } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    signup(formData);
  };

  const set = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  // Dynamic Password Validation
  const pwdLength = formData.password.length >= 6;
  const pwdUpper = /[A-Z]/.test(formData.password);
  const pwdNumber = /[0-9]/.test(formData.password);
  
  const score = (pwdLength ? 1 : 0) + (pwdUpper ? 1 : 0) + (pwdNumber ? 1 : 0);
  const getStrengthBarColor = () => {
    if (score === 0) return "bg-[rgba(255,255,255,0.1)]";
    if (score === 1) return "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]";
    if (score === 2) return "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]";
    return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
  };

  const features = [
    { icon: <Shield size={24} className="text-emerald-400" />, title: 'End-to-End Encryption', desc: 'Military-grade security. Your messages are strictly private.' },
    { icon: <Zap size={24} className="text-amber-400" />, title: 'Ultra-Low Latency', desc: 'Real-time sync globally in milliseconds under any network.' },
    { icon: <Bot size={24} className="text-indigo-400" />, title: 'AI Automation', desc: 'Smart replies, translation, and proactive assistant features.' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row-reverse bg-[#050505] overflow-hidden text-white selection:bg-[#0ea5e9]/30"
    >
      
      {/* Right Hemisphere: Auth Form (On the right for logical flow difference) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto aurora-bg z-10">
        {/* Floating Background Chat Bubbles for Mobile Viewport Visual Context */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
          <div className="floating-bubble-bg floating-bubble-1 flex items-center gap-2 text-white/30 text-xs">
            <span>💬</span> <span>Let's sync up!</span>
          </div>
          <div className="floating-bubble-bg floating-bubble-2 flex items-center gap-2 text-white/30 text-xs">
            <span>🎤</span> <span>Voice note 0:12</span>
          </div>
          <div className="floating-bubble-bg floating-bubble-3 flex items-center gap-2 text-white/30 text-xs">
            <span>Awesome project! 🚀</span>
          </div>
          <div className="floating-bubble-bg floating-bubble-4 flex items-center gap-2 text-white/30 text-xs">
            <span>❤️</span> <span>Reaction</span>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-[420px] relative z-10 glass-card p-8 sm:p-10"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0ea5e9] to-[#6366f1] flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.4)]">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain drop-shadow-md brightness-0 invert" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white brand-font">Chatify</span>
          </div>

          <h2 className="text-3xl font-semibold mb-2 tracking-tight brand-font">Create Account</h2>
          <p className="text-[#a1a1aa] text-sm mb-6 font-light">Join millions of users instantly.</p>

          <form onSubmit={handleSubmit}>
            <div className="floating-input-group">
              <input
                type="text"
                value={formData.fullName}
                onChange={set("fullName")}
                className="floating-input"
                placeholder=" "
                required
              />
              <label className="floating-label flex items-center gap-2">
                <User size={16} /> Full Name
              </label>
            </div>

            <div className="floating-input-group mt-5">
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

            <div className="floating-input-group mt-5 mb-2">
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
            
            <AnimatePresence>
              {formData.password.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8 overflow-hidden"
                >
                  <div className="flex gap-1.5 h-1.5 rounded-full overflow-hidden w-full bg-[rgba(255,255,255,0.05)] mt-3">
                    <div className={`h-full w-1/3 transition-all duration-300 rounded-full ${score >= 1 ? getStrengthBarColor() : 'bg-transparent'}`} />
                    <div className={`h-full w-1/3 transition-all duration-300 rounded-full ${score >= 2 ? getStrengthBarColor() : 'bg-transparent'}`} />
                    <div className={`h-full w-1/3 transition-all duration-300 rounded-full ${score >= 3 ? getStrengthBarColor() : 'bg-transparent'}`} />
                  </div>
                  <div className="flex justify-between items-center mt-2.5 text-[10px] text-[#71717a] font-medium uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className={pwdLength ? 'text-emerald-400' : ''} /> 6+ Chars</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className={pwdUpper ? 'text-emerald-400' : ''} /> Upper</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className={pwdNumber ? 'text-emerald-400' : ''} /> Number</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isSigningUp || score === 0}
              className="w-full btn-primary liquid-glass-btn flex items-center justify-center gap-2 py-3.5 mb-6 mt-4"
              style={{
                background: score > 0 ? "linear-gradient(135deg, #0ea5e9, #6366f1)" : "rgba(255,255,255,0.05)",
                pointerEvents: score === 0 ? "none" : "auto",
                opacity: score === 0 ? 0.5 : 1
              }}
            >
              {isSigningUp ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Get Started <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </button>
          </form>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-[rgba(255,255,255,0.1)]"></div>
            <span className="flex-shrink-0 mx-4 text-[#a1a1aa] text-xs font-medium uppercase tracking-wider">Or continue with</span>
            <div className="flex-grow border-t border-[rgba(255,255,255,0.1)]"></div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => googleLogin(true)}
              disabled={isLoggingIn}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)] transition-colors text-sm font-medium"
            >
              <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="Google" className="w-5 h-5" />
              Google
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-[#a1a1aa]">
            Already have an account?{" "}
            <Link to="/login" className="text-[#0ea5e9] font-semibold hover:text-[#0284c7] transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Left Hemisphere: Branding & Features (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-center p-12 overflow-hidden animated-gradient-bg z-20 shadow-[20px_0_40px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.2] mix-blend-overlay pointer-events-none" />
        
        <div className="relative z-10 max-w-md mx-auto xl:ml-auto">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="text-[44px] leading-[1.1] font-semibold tracking-tight mb-16 brand-font text-white drop-shadow-lg"
          >
            Start your journey,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300 filter drop-shadow-sm">securely.</span>
          </motion.h1>
          
          <div className="space-y-6">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.5, delay: 0.3 + (i * 0.1) }}
                className="relative group p-5 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 hover:border-white/30 transition-all cursor-default"
                onMouseEnter={() => setTooltip(i)}
                onMouseLeave={() => setTooltip(null)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shadow-inner">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold text-white tracking-wide">{feature.title}</h4>
                    <p className="text-[13px] text-white/70 mt-1 leading-snug">{feature.desc}</p>
                  </div>
                </div>

                {/* Tooltip */}
                <AnimatePresence>
                  {tooltip === i && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute -top-12 left-0 right-0 mx-auto w-max px-4 py-2 bg-white text-black text-xs font-bold rounded-lg shadow-xl"
                    >
                      Premium Feature Active
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

    </motion.div>
  );
}
