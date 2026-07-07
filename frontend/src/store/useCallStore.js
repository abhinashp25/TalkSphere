import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";
import { axiosInstance } from "../lib/axios";

// Multiple STUN + public TURN servers for reliable NAT traversal across all networks
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  // Public TURN relay — ensures calls work even through strict NATs/firewalls
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

// Guard: prevent adding duplicate socket listeners on React re-renders
let listenersReady = false;

export const useCallStore = create(persist((set, get) => ({

  // ── Live media objects (never persisted) ─────────────────────────────────
  localStream:       null,
  remoteStream:      null,
  peerConnection:    null,
  iceCandidateQueue: [], // buffer ICE candidates received before setRemoteDescription

  // ── Call state ─────────────────────────────────────────────────────────────
  callState:         "IDLE", // IDLE | RINGING | IN_CALL
  incomingCall:      null,   // { from, name, profilePic, signal, isVideo }
  isMuted:           false,
  isVideoOff:        false,
  isSpeaker:         true,
  connectionQuality: "good", // connecting | good | poor
  callDuration:      0,      // seconds elapsed (ticks while IN_CALL)
  callDurationTimer: null,   // setInterval handle

  // ── Per-call metadata ─────────────────────────────────────────────────────
  currentCallUser:      null, // remote user _id
  currentCallUserName:  null,
  currentCallUserPic:   null,
  currentCallIsVideo:   false,
  currentCallType:      null, // "outgoing" | "incoming"
  currentCallStartTime: null,

  // ── Persistent call history ───────────────────────────────────────────────
  callHistory: [],

  // ─────────────────────────────────────────────────────────────────────────
  // Initialise socket listeners — safe to call multiple times
  // ─────────────────────────────────────────────────────────────────────────

  initListeners: () => {
    if (listenersReady) return;
    listenersReady = true;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Someone is calling us
    socket.on("callUser", (data) => {
      set({ incomingCall: data, callState: "RINGING" });
    });

    // Our offer was accepted — finish handshake
    socket.on("callAccepted", async (signal) => {
      const pc = get().peerConnection;
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(signal));

      // Drain any ICE candidates that arrived before the remote description was set
      for (const c of get().iceCandidateQueue) {
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      }

      const timer = setInterval(() => {
        set((s) => ({ callDuration: s.callDuration + 1 }));
      }, 1000);

      set({ callState: "IN_CALL", iceCandidateQueue: [], callDurationTimer: timer, callDuration: 0 });
    });

    // ICE candidate from the other peer
    socket.on("iceCandidate", async (candidate) => {
      const pc = get().peerConnection;
      // If remote description not set yet, buffer it
      if (!pc || pc.remoteDescription == null) {
        set((s) => ({ iceCandidateQueue: [...s.iceCandidateQueue, candidate] }));
        return;
      }
      await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    });

    // Remote side hung up
    socket.on("callEnded", () => get().endCall(false));

    // Remote side declined
    socket.on("callRejected", () => get().endCall(false));
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Start an outgoing call
  // ─────────────────────────────────────────────────────────────────────────

  startCall: async (userToCall, isVideo = true) => {
    const socket   = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    const remoteId = typeof userToCall === "object" ? userToCall._id : userToCall;

    // Get the remote user's display info from the chat store
    const selectedUser = useChatStore.getState().selectedUser;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation:  true,
          noiseSuppression:  true,
          autoGainControl:   true,
          sampleRate:        48000,
        },
        video: isVideo
          ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
          : false,
      });
    } catch (err) {
      console.warn("Could not access media devices:", err.message);
      return;
    }

    set({
      localStream:          stream,
      callState:            "RINGING",
      isVideoOff:           !isVideo,
      currentCallUser:      remoteId,
      currentCallUserName:  selectedUser?.fullName  || null,
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
  // Answer an incoming call
  // ─────────────────────────────────────────────────────────────────────────

  answerCall: async () => {
    const socket       = useAuthStore.getState().socket;
    const { incomingCall } = get();
    if (!incomingCall) return;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation:  true,
          noiseSuppression:  true,
          autoGainControl:   true,
          sampleRate:        48000,
        },
        video: incomingCall.isVideo
          ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
          : false,
      });
    } catch (err) {
      console.warn("Could not access media devices:", err.message);
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
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));

    // Drain buffered ICE candidates
    for (const c of get().iceCandidateQueue) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("answerCall", { to: incomingCall.from, signal: answer });
    set({ incomingCall: null, iceCandidateQueue: [] });
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Reject an incoming call
  // ─────────────────────────────────────────────────────────────────────────

  rejectCall: () => {
    const socket = useAuthStore.getState().socket;
    const { incomingCall } = get();
    if (!incomingCall) return;

    socket.emit("rejectCall", { to: incomingCall.from });

    const missed = {
      _id:       Date.now().toString(),
      userId:    incomingCall.from,
      type:      "missed",
      isVideo:   incomingCall.isVideo,
      timestamp: Date.now(),
      duration:  null,
    };

    // Post missed-call record to the chat thread if that user is open
    const { selectedUser } = useChatStore.getState();
    if (selectedUser?._id === incomingCall.from) {
      axiosInstance.post(`/messages/send/${incomingCall.from}`, {
        text: `📵 Missed ${incomingCall.isVideo ? "video" : "voice"} call`,
      }).catch(() => {});
    }

    set({
      incomingCall: null,
      callState:    "IDLE",
      callHistory:  [missed, ...get().callHistory],
    });
  },

  // ─────────────────────────────────────────────────────────────────────────
  // End the active call
  //   emit = false when the remote side already hung up
  // ─────────────────────────────────────────────────────────────────────────

  endCall: (emit = true) => {
    const socket = useAuthStore.getState().socket;
    const {
      peerConnection, localStream, callDurationTimer,
      currentCallUser, currentCallStartTime,
      currentCallIsVideo, currentCallType,
      callState, callHistory,
    } = get();

    if (emit && socket && currentCallUser) {
      socket.emit("endCall", { to: currentCallUser });
    }

    clearInterval(callDurationTimer);
    if (peerConnection) peerConnection.close();
    if (localStream) localStream.getTracks().forEach((t) => t.stop());

    let finalHistory = callHistory;
    if (currentCallStartTime && currentCallUser) {
      const diffSecs = Math.floor((Date.now() - currentCallStartTime) / 1000);
      const isMissed = callState === "RINGING";
      const dur = `${Math.floor(diffSecs / 60)}:${String(diffSecs % 60).padStart(2, "0")}`;
      const typeLabel = currentCallIsVideo ? "video" : "voice";
      const msg = isMissed
        ? `📵 Missed ${typeLabel} call`
        : `📞 ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} call · ${dur}`;

      finalHistory = [
        {
          _id:       Date.now().toString(),
          userId:    currentCallUser,
          type:      isMissed ? "missed" : currentCallType,
          isVideo:   currentCallIsVideo,
          timestamp: currentCallStartTime,
          duration:  isMissed ? null : dur,
        },
        ...callHistory,
      ];

      axiosInstance.post(`/messages/send/${currentCallUser}`, { text: msg }).catch(() => {});
    }

    set({
      localStream:          null,
      remoteStream:         null,
      peerConnection:       null,
      iceCandidateQueue:    [],
      callState:            "IDLE",
      incomingCall:         null,
      isMuted:              false,
      isVideoOff:           false,
      isSpeaker:            true,
      connectionQuality:    "good",
      callDuration:         0,
      callDurationTimer:    null,
      currentCallUser:      null,
      currentCallUserName:  null,
      currentCallUserPic:   null,
      currentCallIsVideo:   false,
      currentCallType:      null,
      currentCallStartTime: null,
      callHistory:          finalHistory,
    });
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Build RTCPeerConnection with privacy-safe, low-latency config
  // ─────────────────────────────────────────────────────────────────────────

  createPeerConnection: (remoteUserId) => {
    const socket = useAuthStore.getState().socket;

    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      // Bundle all media on one port — fewer open connections, better privacy
      bundlePolicy:   "max-bundle",
      rtcpMuxPolicy:  "require",
    });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit("iceCandidate", { to: remoteUserId, candidate });
      }
    };

    pc.ontrack = ({ streams }) => {
      if (streams[0]) set({ remoteStream: streams[0] });
    };

    // Track connection quality for the UI indicator
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      const quality = s === "connected"  ? "good"
                    : s === "connecting" ? "connecting"
                    : "poor";
      set({ connectionQuality: quality });
    };

    set({ peerConnection: pc });
    return pc;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Media controls
  // ─────────────────────────────────────────────────────────────────────────

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

  toggleSpeaker: () => {
    set((s) => ({ isSpeaker: !s.isSpeaker }));
  },

  flipCamera: async () => {
    const { localStream, peerConnection, isVideoOff } = get();
    if (!localStream || isVideoOff) return;

    const oldTrack = localStream.getVideoTracks()[0];
    if (!oldTrack) return;

    const currentFacing = oldTrack.getSettings().facingMode;
    const nextFacing    = currentFacing === "user" ? "environment" : "user";

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
        audio: false,
      });
      const newTrack = newStream.getVideoTracks()[0];

      // Swap the sender track so the remote peer sees the new camera
      const sender = peerConnection?.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(newTrack);

      // Update local stream reference
      localStream.removeTrack(oldTrack);
      localStream.addTrack(newTrack);
      oldTrack.stop();
    } catch {
      // Camera flip is not available on desktop — silently ignore
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // History
  // ─────────────────────────────────────────────────────────────────────────

  clearCallHistory: () => set({ callHistory: [] }),

}), {
  name: "call-history-storage",
  // Only persist the history list — streams and connections cannot be serialised
  partialize: (state) => ({ callHistory: state.callHistory }),
}));
