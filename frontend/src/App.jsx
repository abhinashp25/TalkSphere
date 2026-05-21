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

function App() {
  const location = useLocation();
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();
  const { applyStoredTheme } = useSettingsStore();
  useEffect(() => { checkAuth(); applyStoredTheme(); }, [checkAuth]);
  
  useEffect(() => {
    if (authUser) {
      useCallStore.getState().initListeners();
    }
    
    const handleOffline = () => toast.error("You are offline. Messages will be queued.", { duration: 4000 });
    const handleOnline = () => {
      toast.success("Back online!", { duration: 3000 });
      import('./store/useChatStore').then(mod => mod.useChatStore.getState().processOfflineQueue());
    };
    
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [authUser]);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="min-h-screen min-h-[100dvh] text-white">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"       element={authUser ? <ChatPage />  : <Navigate to="/login" />} />
          <Route path="/login"  element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        </Routes>
      </AnimatePresence>
      <CommandPalette />
      <CallOverlay />
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1f2c34', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '14px' },
        }}
      />
    </div>
  );
}
export default App;
