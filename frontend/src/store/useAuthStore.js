import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { auth, googleProvider } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  signInWithPopup,
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  getAdditionalUserInfo
} from "firebase/auth";
import {
  requestNotificationPermission,
  subscribeToNotifications,
} from "../hooks/usePushNotifications";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

const mapFirebaseError = (error) => {
  switch(error.code) {
    case 'auth/email-already-in-use': return 'Email is already taken';
    case 'auth/invalid-credential': return 'Invalid email or password';
    case 'auth/weak-password': return 'Password is too weak';
    case 'auth/popup-closed-by-user': return 'Google login was cancelled';
    case 'auth/too-many-requests': return 'Too many attempts. Try again later.';
    default: return error.message.replace('Firebase: ', '');
  }
};

export const useAuthStore = create((set, get) => ({
  authUser:         null,
  isCheckingAuth:   true,
  isSigningUp:      false,
  isLoggingIn:      false,
  isUpdatingProfile: false,
  socket:           null,
  onlineUsers:      [],
  _contactsCache:   {},

  syncWithBackend: async (firebaseUser, extraData = {}) => {
    try {
      const res = await axiosInstance.post("/auth/firebase-sync", {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        phoneNumber: firebaseUser.phoneNumber,
        fullName: extraData.fullName || firebaseUser.displayName || "User",
        profilePic: firebaseUser.photoURL || undefined,
      });
      set({ authUser: res.data });
      get().connectSocket();
      return { requiresOTP: false };
    } catch (error) {
      console.error("Backend sync failed:", error);
      throw error;
    }
  },

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      if (res.data) {
        set({ authUser: res.data });
        get().connectSocket();
      } else {
        set({ authUser: null });
      }
    } catch {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await sendEmailVerification(userCredential.user);
      await get().syncWithBackend(userCredential.user, { fullName: data.fullName });
      
      toast.success("Account created! Please check your email for verification.");
      return true;
    } catch (error) {
      toast.error(mapFirebaseError(error) || "Signup failed");
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      
      if (!userCredential.user.emailVerified) {
        toast.error("Please verify your email first.");
        set({ isLoggingIn: false });
        return { requiresOTP: false };
      }

      await get().syncWithBackend(userCredential.user);
      toast.success("Logged in successfully");
      return { requiresOTP: false };
    } catch (error) {
      toast.error(mapFirebaseError(error) || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  googleLogin: async (isSignup = false) => {
    set({ isLoggingIn: true });
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const isNewUser = getAdditionalUserInfo(userCredential)?.isNewUser;

      // Professional Guard: Prevent new users from creating an account via the Login page
      if (!isSignup && isNewUser) {
        await userCredential.user.delete(); // Delete the mistakenly created Firebase account
        toast.error("Account does not exist. Please create an account first.");
        return false;
      }

      // Contextual Professional Success Messages
      if (isSignup && !isNewUser) {
        toast.success("Account already exists. Logging you in!");
      } else if (isSignup && isNewUser) {
        toast.success("Account created securely with Google!");
      } else {
        toast.success("Logged in with Google successfully");
      }

      await get().syncWithBackend(userCredential.user);
      return true;
    } catch (error) {
      toast.error(mapFirebaseError(error));
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  setupRecaptcha: (buttonId) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
        size: 'invisible'
      });
    }
  },

  sendPhoneOTP: async (phoneNumber) => {
    set({ isLoggingIn: true });
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      toast.success("OTP sent to " + phoneNumber);
      return true;
    } catch (error) {
      console.error("OTP Error:", error);
      
      // Cleanup recaptcha so the user can try again safely
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }

      // Professional error message mapping
      let errorMsg = "Failed to send OTP. Please check the number and try again.";
      if (error.code === 'auth/invalid-phone-number') {
        errorMsg = "Invalid phone number format.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = "Too many requests. Please try again later.";
      } else if (error.code === 'auth/billing-not-enabled') {
        errorMsg = "Firebase Billing not enabled. Upgrade to Blaze plan in Firebase Console to send SMS.";
      }
      
      toast.error(errorMsg);
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  submitPhoneOTP: async (code) => {
    set({ isLoggingIn: true });
    try {
      const userCredential = await window.confirmationResult.confirm(code);
      await get().syncWithBackend(userCredential.user);
      toast.success("Phone verified and logged in!");
      return true;
    } catch (error) {
      toast.error("Invalid verification code");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  verify2FA: async (userId, otp) => {
    try {
      const res = await axiosInstance.post("/auth/2fa/verify", { userId, otp });
      set({ authUser: res.data });
      toast.success("Verified! Welcome back.");
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid code");
      return false;
    }
  },

  toggle2FA: async (password) => {
    try {
      const res = await axiosInstance.post("/auth/2fa/toggle", { password });
      set({ authUser: { ...get().authUser, twoFA: { ...get().authUser?.twoFA, enabled: res.data.enabled } } });
      toast.success(res.data.enabled ? "Two-factor auth enabled" : "Two-factor auth disabled");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle 2FA");
      return false;
    }
  },

  logout: async () => {
    try {
      await signOut(auth); // Sign out of Firebase first
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch {
      toast.error("Error logging out");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  updatePrivacy: async (updates) => {
    try {
      const res = await axiosInstance.patch("/auth/privacy", updates);
      set({ authUser: res.data });
    } catch (error) {
      toast.error("Could not save privacy settings");
      throw error;
    }
  },

  cacheContact: (userId, name) => {
    set({ _contactsCache: { ...get()._contactsCache, [userId]: name } });
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, { withCredentials: true });
    socket.connect();
    set({ socket });
    socket.on("getOnlineUsers", (userIds) => set({ onlineUsers: userIds }));
    requestNotificationPermission();
    subscribeToNotifications(socket, (senderId) => get()._contactsCache[senderId]);
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
