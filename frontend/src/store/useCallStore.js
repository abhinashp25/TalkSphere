import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

// Fallback ICE while we fetch from backend
const FALLBACK_ICE = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// Guard: prevent adding duplicate socket listeners on React re-renders
let listenersReady = false;

export const useCallStore = create(persist((set, get) => ({

  // ── ICE config (fetched from backend – keeps API key server-side) ─────────
  iceServers: FALLBACK_ICE,

  // ── Live media objects (never persisted) ─────────────────────────────────
  localStream:       null,
  remoteStream:      null,
  peerConnection:    null,
  iceCandidateQueue: [],

  // ── Call state ─────────────────────────────────────────────────────────────
  callState:         "IDLE",   // IDLE | RINGING | IN_CALL
  incomingCall:      null,
  isRemoteRinging:   false,
  isMuted:           false,
  isVideoOff:        false,
  isSpeaker:         true,
  connectionQuality: "good",
  callDuration:      0,
  callDurationTimer: null,
  noAnswerTimer:     null,    // 30-second no-answer auto-log

  // ── Per-call metadata ─────────────────────────────────────────────────────
  currentCallUser:      null,
  currentCallUserName:  null,
  currentCallUserPic:   null,
  currentCallIsVideo:   false,
  currentCallType:      null,
  currentCallStartTime: null,

  // ── Persistent call history ───────────────────────────────────────────────
  callHistory: [],

  // ── Fetch Metered TURN credentials (API key stays on server) ─────────────
  fetchIceServers: async () => {
    try {
      const res = await axiosInstance.get("/calls/ice-servers");
      if (Array.isArray(res.data) && res.data.length > 0) {
        set({ iceServers: res.data });
      }
    } catch {
      // stay with FALLBACK_ICE
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Socket listener management
  // ─────────────────────────────────────────────────────────────────────────

  resetListeners: () => {
    listenersReady = false;
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("callUser");
      socket.off("ringing");
      socket.off("callAccepted");
      socket.off("iceCandidate");
      socket.off("callEnded");
      socket.off("callRejected");
    }
  },

  initListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    if (listenersReady) return;
    listenersReady = true;

    // Fetch fresh ICE servers on init
    get().fetchIceServers();

    socket.on("callUser", (data) => {
      set({ incomingCall: data, callState: "RINGING" });
      socket.emit("ringing", { to: data.from });
    });

    socket.on("ringing", () => {
      set({ isRemoteRinging: true });

      // 30-second no-answer timeout
      const timer = setTimeout(() => {
        if (get().callState === "RINGING") {
          const { currentCallUser, currentCallIsVideo } = get();
          const authUser = useAuthStore.getState().authUser;
          axiosInstance.post("/calls/save", {
            callerId:   authUser._id,
            receiverId: currentCallUser,
            type:       "missed",
            isVideo:    currentCallIsVideo,
            duration:   null,
          }).then(() => get().fetchCallHistory()).catch(() => {});
          get().endCall(false);
          toast("No answer", { icon: "📵" });
        }
      }, 30000);
      set({ noAnswerTimer: timer });
    });

    socket.on("callAccepted", async (signal) => {
      const pc = get().peerConnection;
      if (!pc) return;

      clearTimeout(get().noAnswerTimer);
      set({ noAnswerTimer: null });

      await pc.setRemoteDescription(new RTCSessionDescription(signal));

      for (const c of get().iceCandidateQueue) {
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      }

      const timer = setInterval(() => {
        set((s) => ({ callDuration: s.callDuration + 1 }));
      }, 1000);

      set({ callState: "IN_CALL", iceCandidateQueue: [], callDurationTimer: timer, callDuration: 0 });
    });

    socket.on("iceCandidate", async (candidate) => {
      const pc = get().peerConnection;
      if (!pc || pc.remoteDescription == null) {
        set((s) => ({ iceCandidateQueue: [...s.iceCandidateQueue, candidate] }));
        return;
      }
      await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    });

    socket.on("callEnded",   () => get().endCall(false));
    socket.on("callRejected",() => get().endCall(false));
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Outgoing call
  // ─────────────────────────────────────────────────────────────────────────

  startCall: async (userToCall, isVideo = true) => {
    const socket   = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    const remoteId = typeof userToCall === "object" ? userToCall._id : userToCall;

    if (remoteId === authUser._id) {
      toast.error("You cannot call yourself.");
      return;
    }

    const selectedUser = useChatStore.getState().selectedUser;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000 },
        video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } : false,
      });
    } catch (err) {
      toast.error("Could not access microphone or camera.");
      console.warn("getUserMedia error:", err.message);
      return;
    }

    set({
      localStream:          stream,
      callState:            "RINGING",
      isRemoteRinging:      false,
      isVideoOff:           !isVideo,
      currentCallUser:      remoteId,
      currentCallUserName:  selectedUser?.fullName   || null,
      currentCallUserPic:   selectedUser?.profilePic || null,
      currentCallIsVideo:   isVideo,
      currentCallType:      "outgoing",
      currentCallStartTime: Date.now(),
      callDuration:         0,
    });

    const pc = get().createPeerConnection(remoteId);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("callUser", {
      userToCall: remoteId,
      signalData: offer,
      from:       authUser._id,
      name:       authUser.fullName,
      profilePic: authUser.profilePic || null,
      isVideo,
    });
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Answer incoming call
  // ✅ CRITICAL FIX: local tracks added to pc BEFORE setRemoteDescription
  //    so they are negotiated into the SDP answer (no tracks = silence).
  // ─────────────────────────────────────────────────────────────────────────

  answerCall: async () => {
    const socket = useAuthStore.getState().socket;
    const { incomingCall } = get();
    if (!incomingCall) return;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000 },
        video: incomingCall.isVideo
          ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
          : false,
      });
    } catch (err) {
      toast.error("Could not access microphone or camera.");
      console.warn("getUserMedia error:", err.message);
      return;
    }

    const timer = setInterval(() => {
      set((s) => ({ callDuration: s.callDuration + 1 }));
    }, 1000);

    set({
      localStream:          stream,
      callState:            "IN_CALL",
      isVideoOff:           !incomingCall.isVideo,
      currentCallUser:      incomingCall.from,
      currentCallUserName:  incomingCall.name       || null,
      currentCallUserPic:   incomingCall.profilePic || null,
      currentCallIsVideo:   incomingCall.isVideo,
      currentCallType:      "incoming",
      currentCallStartTime: Date.now(),
      callDuration:         0,
      callDurationTimer:    timer,
    });

    const pc = get().createPeerConnection(incomingCall.from);

    // ✅ ADD LOCAL TRACKS FIRST — before setRemoteDescription
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));

    for (const c of get().iceCandidateQueue) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("answerCall", { to: incomingCall.from, signal: answer });
    set({ incomingCall: null, iceCandidateQueue: [] });
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Reject incoming call
  // ─────────────────────────────────────────────────────────────────────────

  rejectCall: () => {
    const socket = useAuthStore.getState().socket;
    const { incomingCall } = get();
    if (!incomingCall) return;

    socket.emit("rejectCall", { to: incomingCall.from });

    const authUser = useAuthStore.getState().authUser;
    axiosInstance.post("/calls/save", {
      callerId:   incomingCall.from,
      receiverId: authUser._id,
      type:       "missed",
      isVideo:    incomingCall.isVideo,
      duration:   null,
    }).then(() => get().fetchCallHistory()).catch(() => {});

    const { selectedUser } = useChatStore.getState();
    if (selectedUser?._id === incomingCall.from) {
      axiosInstance.post(`/messages/send/${incomingCall.from}`, {
        text: `📵 Missed ${incomingCall.isVideo ? "video" : "voice"} call`,
      }).catch(() => {});
    }

    set({ incomingCall: null, callState: "IDLE" });
  },

  // ─────────────────────────────────────────────────────────────────────────
  // End active call
  // ─────────────────────────────────────────────────────────────────────────

  endCall: (emit = true) => {
    const socket = useAuthStore.getState().socket;
    const {
      peerConnection, localStream, callDurationTimer, noAnswerTimer,
      currentCallUser, currentCallStartTime, currentCallIsVideo,
      currentCallType, callState,
    } = get();

    if (emit && socket && currentCallUser) {
      socket.emit("endCall", { to: currentCallUser });
    }

    clearInterval(callDurationTimer);
    clearTimeout(noAnswerTimer);
    if (peerConnection) peerConnection.close();
    if (localStream) localStream.getTracks().forEach((t) => t.stop());

    if (currentCallStartTime && currentCallUser) {
      const diffSecs  = Math.floor((Date.now() - currentCallStartTime) / 1000);
      const isMissed  = callState === "RINGING";
      const dur       = `${Math.floor(diffSecs / 60)}:${String(diffSecs % 60).padStart(2, "0")}`;
      const typeLabel = currentCallIsVideo ? "video" : "voice";
      const msg       = isMissed
        ? `📵 Missed ${typeLabel} call`
        : `📞 ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} call · ${dur}`;

      const authUser = useAuthStore.getState().authUser;
      axiosInstance.post("/calls/save", {
        callerId:   currentCallType === "outgoing" ? authUser._id : currentCallUser,
        receiverId: currentCallType === "outgoing" ? currentCallUser : authUser._id,
        type:       isMissed ? "missed" : (currentCallType === "outgoing" ? "outgoing" : "incoming"),
        isVideo:    currentCallIsVideo,
        duration:   isMissed ? null : dur,
        timestamp:  currentCallStartTime,
      }).then(() => get().fetchCallHistory()).catch(() => {});

      axiosInstance.post(`/messages/send/${currentCallUser}`, { text: msg }).catch(() => {});
    }

    set({
      localStream: null, remoteStream: null, peerConnection: null,
      iceCandidateQueue: [], callState: "IDLE", incomingCall: null,
      isMuted: false, isVideoOff: false, isSpeaker: true,
      connectionQuality: "good", callDuration: 0,
      callDurationTimer: null, noAnswerTimer: null,
      currentCallUser: null, currentCallUserName: null,
      currentCallUserPic: null, currentCallIsVideo: false,
      currentCallType: null, currentCallStartTime: null,
      isRemoteRinging: false,
    });
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Build RTCPeerConnection with Metered TURN
  // ─────────────────────────────────────────────────────────────────────────

  createPeerConnection: (remoteUserId) => {
    const socket = useAuthStore.getState().socket;
    const { iceServers } = get();

    const pc = new RTCPeerConnection({
      iceServers,
      bundlePolicy:  "max-bundle",
      rtcpMuxPolicy: "require",
    });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit("iceCandidate", { to: remoteUserId, candidate });
    };

    // Capture all tracks (audio + video) from remote stream
    pc.ontrack = ({ streams }) => {
      if (streams && streams[0]) set({ remoteStream: streams[0] });
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      set({ connectionQuality: s === "connected" ? "good" : s === "connecting" ? "connecting" : "poor" });
    };

    set({ peerConnection: pc });
    return pc;
  },

  // ── Media controls ────────────────────────────────────────────────────────

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => { t.enabled = isMuted; });
    set({ isMuted: !isMuted });
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => { t.enabled = isVideoOff; });
    set({ isVideoOff: !isVideoOff });
  },

  toggleSpeaker: () => set((s) => ({ isSpeaker: !s.isSpeaker })),

  flipCamera: async () => {
    const { localStream, peerConnection, isVideoOff } = get();
    if (!localStream || isVideoOff) return;
    const oldTrack = localStream.getVideoTracks()[0];
    if (!oldTrack) return;
    const nextFacing = oldTrack.getSettings().facingMode === "user" ? "environment" : "user";
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: nextFacing }, audio: false });
      const newTrack  = newStream.getVideoTracks()[0];
      const sender    = peerConnection?.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(newTrack);
      localStream.removeTrack(oldTrack);
      localStream.addTrack(newTrack);
      oldTrack.stop();
    } catch { /* silent */ }
  },

  // ── History ───────────────────────────────────────────────────────────────

  fetchCallHistory: async () => {
    try {
      const res = await axiosInstance.get("/calls/history");
      set({ callHistory: res.data });
    } catch (e) {
      console.error("Failed to fetch call history:", e);
    }
  },

  deleteCallLog: async (id) => {
    try {
      await axiosInstance.delete(`/calls/delete/${id}`);
      set((s) => ({ callHistory: s.callHistory.filter((c) => c._id !== id) }));
      toast.success("Call log deleted");
    } catch {
      toast.error("Failed to delete call log");
    }
  },

  clearCallHistory: async () => {
    try {
      await axiosInstance.delete("/calls/clear");
      set({ callHistory: [] });
      toast.success("Call history cleared");
    } catch {
      toast.error("Failed to clear call history");
    }
  },

}), {
  name: "call-history-storage",
  partialize: () => ({}),
}));
