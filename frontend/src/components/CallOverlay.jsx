import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCallStore } from "../store/useCallStore";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Phone,
  Volume2, VolumeX, RefreshCw, Lock, Wifi, WifiOff,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

// ── Round control button (iOS style) ─────────────────────────────────────

function ControlBtn({ icon, label, active, onPress }) {
  return (
    <button onClick={onPress} className="flex flex-col items-center gap-2">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
        style={{
          background: active
            ? "rgba(255,255,255,0.35)"
            : "rgba(255,255,255,0.15)",
        }}
      >
        {icon}
      </div>
      <span className="text-[11px] font-medium text-white/60">{label}</span>
    </button>
  );
}

// ── Animated ring pulse ───────────────────────────────────────────────────

function PulseRing({ delay = 0 }) {
  return (
    <motion.div
      className="absolute rounded-full border border-white/20"
      style={{ inset: 0 }}
      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
      transition={{ duration: 1.8, delay, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

// ── E2EE badge ─────────────────────────────────────────────────────────────

function EncryptedBadge() {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1 rounded-full"
      style={{ background: "rgba(255,255,255,0.1)" }}
    >
      <Lock size={10} className="text-green-400" />
      <span className="text-[11px] font-medium text-white/60">
        End-to-end encrypted
      </span>
    </div>
  );
}

// ── Avatar with optional pulse rings ─────────────────────────────────────

function Avatar({ src, name, size = 112, pulse = false }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {pulse && (
        <>
          <PulseRing delay={0} />
          <PulseRing delay={0.5} />
          <PulseRing delay={1} />
        </>
      )}
      <img
        src={src || "/avatar.png"}
        alt={name}
        className="rounded-full object-cover relative z-10"
        style={{
          width:  size,
          height: size,
          border: "3px solid rgba(255,255,255,0.25)",
        }}
      />
    </div>
  );
}

// ── Connection quality dot ────────────────────────────────────────────────

function QualityIndicator({ quality }) {
  return (
    <div className="flex items-center gap-1.5">
      {quality === "good" && <Wifi size={11} className="text-green-400" />}
      {quality === "connecting" && <Wifi size={11} className="text-yellow-400" />}
      {quality === "poor" && <WifiOff size={11} className="text-red-400" />}
      <span className="text-[11px] text-white/50 capitalize">{quality}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function CallOverlay() {
  const {
    callState, incomingCall,
    localStream, remoteStream,
    answerCall, rejectCall, endCall,
    toggleMute, toggleVideo, toggleSpeaker, flipCamera,
    isMuted, isVideoOff, isSpeaker,
    connectionQuality, callDuration,
    currentCallUserName, currentCallUserPic, currentCallIsVideo,
  } = useCallStore();

  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Ringtone / Ringing audio refs
  const ringtoneAudioRef = useRef(null);
  const ringingAudioRef = useRef(null);
  const vibrateAudioRef = useRef(null);

  useEffect(() => {
    const stopAllSounds = () => {
      if (ringtoneAudioRef.current) {
        try { ringtoneAudioRef.current.pause(); } catch (_) {}
        ringtoneAudioRef.current = null;
      }
      if (ringingAudioRef.current) {
        try { ringingAudioRef.current.pause(); } catch (_) {}
        ringingAudioRef.current = null;
      }
      if (vibrateAudioRef.current) {
        try { vibrateAudioRef.current.pause(); } catch (_) {}
        vibrateAudioRef.current = null;
      }
    };

    if (callState === "RINGING") {
      stopAllSounds();

      if (incomingCall) {
        // ── Incoming Call Sound & Vibration ──
        const customRingtone = localStorage.getItem("call_ringtone") || "ringtone.mp3";
        const ringtoneUrl = `/Call_ringtones/${customRingtone}`;
        
        const rTone = new Audio(ringtoneUrl);
        rTone.loop = true;
        ringtoneAudioRef.current = rTone;
        rTone.play().catch(() => {});

        const isVibrateEnabled = localStorage.getItem("vibrate_mode") !== "false";
        if (isVibrateEnabled) {
          const vib = new Audio("/vibration/freesound_community-phone-vibrate-68632.mp3");
          vib.loop = true;
          vibrateAudioRef.current = vib;
          vib.play().catch(() => {});
        }
      } else {
        // ── Outgoing Call Ringing (Default: community-ring-tone.mp3) ──
        const ringUrl = "/ringing/community-ring-tone.mp3";
        const rRing = new Audio(ringUrl);
        rRing.loop = true;
        ringingAudioRef.current = rRing;
        rRing.play().catch(() => {});
      }
    } else {
      stopAllSounds();
    }

    return () => {
      stopAllSounds();
    };
  }, [callState, incomingCall]);

  // Nothing to render when idle
  if (callState === "IDLE" && !incomingCall) return null;

  const isVideo      = callState === "IN_CALL" ? currentCallIsVideo : incomingCall?.isVideo;
  const remoteName   = callState === "IN_CALL" ? currentCallUserName  : incomingCall?.name;
  const remotePic    = callState === "IN_CALL" ? currentCallUserPic   : incomingCall?.profilePic;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0d1b2a 0%, #1b2838 55%, #0f2744 100%)",
        }}
      >
        {/* ── Remote video (full-screen background) ─────────────── */}
        {remoteStream && !isVideoOff && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Soft dark vignette over remote video */}
        {remoteStream && (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 35%, transparent 60%, rgba(0,0,0,0.7) 100%)",
            }}
          />
        )}

        {/* ── Local video PiP — draggable ───────────────────────── */}
        {localStream && callState === "IN_CALL" && isVideo && (
          <motion.div
            drag
            dragMomentum={false}
            dragConstraints={{ top: 60, left: 12, right: 0, bottom: 0 }}
            className="absolute top-20 right-4 z-20 cursor-grab active:cursor-grabbing"
            style={{
              width:        110,
              height:       160,
              borderRadius: 14,
              overflow:     "hidden",
              boxShadow:    "0 8px 32px rgba(0,0,0,0.7)",
              border:       "2px solid rgba(255,255,255,0.2)",
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          </motion.div>
        )}

        {/* ── INCOMING CALL ─────────────────────────────────────── */}
        <AnimatePresence>
          {callState === "RINGING" && incomingCall && (
            <motion.div
              key="incoming"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="absolute inset-0 flex flex-col items-center justify-between px-8 py-16 sm:py-20"
            >
              {/* Top: E2EE + avatar + name */}
              <div className="flex flex-col items-center gap-6">
                <EncryptedBadge />

                <Avatar
                  src={remotePic}
                  name={remoteName}
                  size={120}
                  pulse
                />

                <div className="text-center">
                  <h2 className="text-[30px] font-bold text-white leading-tight">
                    {remoteName || "Unknown"}
                  </h2>
                  <p className="mt-2 text-[15px] text-white/55">
                    Incoming {incomingCall.isVideo ? "Video" : "Voice"} Call
                  </p>
                </div>
              </div>

              {/* Bottom: Decline / Accept — iOS layout */}
              <div className="flex items-end justify-center gap-20 w-full">
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={rejectCall}
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-90"
                    style={{ background: "#ff3b30" }}
                  >
                    <PhoneOff size={28} className="text-white" />
                  </button>
                  <span className="text-white/65 text-[13px] font-medium">Decline</span>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <motion.button
                    onClick={answerCall}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.3, repeat: Infinity }}
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-xl"
                    style={{ background: "#34c759" }}
                  >
                    <Phone size={28} className="text-white" />
                  </motion.button>
                  <span className="text-white/65 text-[13px] font-medium">Accept</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── OUTGOING CALL ─────────────────────────────────────── */}
        <AnimatePresence>
          {callState === "RINGING" && !incomingCall && (
            <motion.div
              key="outgoing"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="absolute inset-0 flex flex-col items-center justify-between px-8 py-16 sm:py-20"
            >
              <div className="flex flex-col items-center gap-6">
                <EncryptedBadge />

                <Avatar src={remotePic} name={remoteName} size={120} pulse />

                <div className="text-center">
                  <h2 className="text-[30px] font-bold text-white leading-tight">
                    {remoteName || "…"}
                  </h2>
                  <motion.p
                    className="mt-2 text-[15px] text-white/55"
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Calling…
                  </motion.p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => endCall(true)}
                  className="w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-90"
                  style={{ background: "#ff3b30" }}
                >
                  <PhoneOff size={28} className="text-white" />
                </button>
                <span className="text-white/65 text-[13px] font-medium">Cancel</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── IN CALL ───────────────────────────────────────────── */}
        <AnimatePresence>
          {callState === "IN_CALL" && (
            <motion.div
              key="incall"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Top bar: avatar, name, timer, quality */}
              <div className="flex flex-col items-center pt-14 pb-4 px-4">
                {!isVideo && (
                  <Avatar src={remotePic} name={remoteName} size={80} />
                )}
                <h3
                  className="font-semibold text-white mt-3"
                  style={{ fontSize: isVideo ? 16 : 20 }}
                >
                  {remoteName || "Connected"}
                </h3>

                <p className="text-[28px] font-light text-white tracking-widest mt-1">
                  {formatDuration(callDuration)}
                </p>

                <div className="flex items-center gap-3 mt-2">
                  <QualityIndicator quality={connectionQuality} />
                  <span className="text-white/25">·</span>
                  <div className="flex items-center gap-1">
                    <Lock size={10} className="text-green-400" />
                    <span className="text-[11px] text-white/50">Encrypted</span>
                  </div>
                </div>
              </div>

              {/* Middle: soft avatar for audio-only calls */}
              {!isVideo && (
                <div className="flex-1 flex items-center justify-center">
                  <div
                    className="w-[160px] h-[160px] rounded-full overflow-hidden opacity-20"
                    style={{ filter: "blur(12px)" }}
                  >
                    <img
                      src={remotePic || "/avatar.png"}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Bottom controls — iOS grid */}
              <div className="pb-10 px-6">
                <div className="grid grid-cols-4 gap-3 mb-8">
                  <ControlBtn
                    icon={
                      isMuted
                        ? <MicOff size={22} className="text-white" />
                        : <Mic size={22} className="text-white" />
                    }
                    label={isMuted ? "Unmute" : "Mute"}
                    active={isMuted}
                    onPress={toggleMute}
                  />

                  <ControlBtn
                    icon={
                      isSpeaker
                        ? <Volume2 size={22} className="text-white" />
                        : <VolumeX size={22} className="text-white" />
                    }
                    label="Speaker"
                    active={isSpeaker}
                    onPress={toggleSpeaker}
                  />

                  <ControlBtn
                    icon={
                      isVideoOff
                        ? <VideoOff size={22} className="text-white" />
                        : <Video size={22} className="text-white" />
                    }
                    label={isVideoOff ? "Cam Off" : "Camera"}
                    active={isVideoOff}
                    onPress={toggleVideo}
                  />

                  <ControlBtn
                    icon={<RefreshCw size={22} className="text-white" />}
                    label="Flip"
                    onPress={flipCamera}
                  />
                </div>

                {/* End call — centred, prominent */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => endCall(true)}
                      className="w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-90"
                      style={{ background: "#ff3b30" }}
                    >
                      <PhoneOff size={28} className="text-white" />
                    </button>
                    <span className="text-white/55 text-[12px] font-medium">End Call</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
