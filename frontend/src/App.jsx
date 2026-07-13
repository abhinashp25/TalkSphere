import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ChatPage    from './pages/ChatPage';
import LoginPage   from './pages/LoginPage';
import SignUpPage  from './pages/SignupPage';
import { useAuthStore } from "./store/useAuthStore";
import { useSettingsStore } from "./store/useSettingsStore";
import PageLoader  from './components/PageLoader';
import { Toaster, toast } from 'react-hot-toast';
import CommandPalette from './components/CommandPalette';
import CallOverlay from './components/CallOverlay';
import { useCallStore } from './store/useCallStore';

import { useChatStore } from './store/useChatStore';
import PrivacyGuard from './components/PrivacyGuard';

function App() {
  const location = useLocation();
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();
  const { applyStoredTheme } = useSettingsStore();
  useEffect(() => { checkAuth(); applyStoredTheme(); }, [checkAuth]);
  
  useEffect(() => {
    if (!authUser) return;
    // Give the socket a moment to fully connect before registering listeners.
    // connectSocket() is sync but the underlying socket.io handshake is async.
    const t = setTimeout(() => {
      useCallStore.getState().initListeners();
    }, 300);
    return () => clearTimeout(t);
  }, [authUser]);

  useEffect(() => {
    const handleOffline = () => toast.error("You are offline. Messages will be queued.", { duration: 4000 });
    const handleOnline = () => {
      toast.success("Back online!", { duration: 3000 });
      useChatStore.getState().processOfflineQueue();
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="min-h-screen min-h-[100dvh] text-white">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"       element={authUser ? <PrivacyGuard><ChatPage /></PrivacyGuard>  : <Navigate to="/login" />} />
          <Route path="/login"  element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        </Routes>
      </AnimatePresence>
      <CommandPalette />
      <CallOverlay />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--bg-panel)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </div>
  );
}
export default App;
