import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

// Cross-browser MIME type detection
function getBestMimeType() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
  ];
  return types.find((t) => {
    try { return MediaRecorder.isTypeSupported(t); } catch { return false; }
  }) || "";
}

function pad(n) { return String(n).padStart(2, "0"); }
function fmt(s) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }

export default function VoiceRecorder({ onSend, onCancel }) {
  const [phase, setPhase]            = useState("recording"); // recording | preview
  const [isPaused, setIsPaused]      = useState(false);
  const [audioBlob, setBlob]         = useState(null);
  const [audioURL,  setURL]          = useState(null);
  const [seconds,   setSeconds]      = useState(0);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [transcript, setTranscript]  = useState("");
  const [bars, setBars]              = useState(Array(24).fill(4));

  // Custom preview player state
  const [playing,  setPlaying]       = useState(false);
  const [progress, setProgress]      = useState(0);
  const [duration, setDuration]      = useState(0);
  const [previewBars, setPreviewBars] = useState([]);

  const mediaRef       = useRef(null);
  const timerRef       = useRef(null);
  const chunksRef      = useRef([]);
  const recognitionRef = useRef(null);
  const analyserRef    = useRef(null);
  const animFrameRef   = useRef(null);
  const audioRef       = useRef(null);

  useEffect(() => {
    startRecording();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = () => {
    cancelAnimationFrame(animFrameRef.current);
    clearInterval(timerRef.current);
    try { mediaRef.current?.stop(); } catch {}
    try { recognitionRef.current?.stop(); } catch {}
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Waveform visualiser via AnalyserNode
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const src  = ctx.createMediaStreamSource(stream);
      const an   = ctx.createAnalyser();
      an.fftSize = 64;
      src.connect(an);
      analyserRef.current = an;

      const drawBars = () => {
        const data = new Uint8Array(an.frequencyBinCount);
        an.getByteFrequencyData(data);
        const mapped = Array.from({ length: 24 }, (_, i) => {
          const idx = Math.floor((i / 24) * data.length);
          return Math.max(4, (data[idx] / 255) * 32);
        });
        setBars(mapped);
        animFrameRef.current = requestAnimationFrame(drawBars);
      };
      drawBars();

      const mimeType = getBestMimeType();
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      
      mr.onstop = async () => {
        // ALWAYS stop timer immediately so countdown halts
        clearInterval(timerRef.current);
        stream.getTracks().forEach((t) => t.stop());
        ctx.close().catch(() => {});
        cancelAnimationFrame(animFrameRef.current);

        const actualMime = mr.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: actualMime });
        setBlob(blob);
        const url = URL.createObjectURL(blob);
        setURL(url);

        // Generate synthetic or decoded waveform bars for preview (WhatsApp style)
        const generatedBars = Array.from({ length: 28 }, () => Math.floor(Math.random() * 18) + 6);
        setPreviewBars(generatedBars);

        // Compute exact duration using AudioContext decodeAudioData
        try {
          const arrayBuffer = await blob.arrayBuffer();
          const decodeCtx = new (window.AudioContext || window.webkitAudioContext)();
          const decoded = await decodeCtx.decodeAudioData(arrayBuffer);
          const exactSecs = decoded.duration;
          decodeCtx.close().catch(() => {});
          if (exactSecs && isFinite(exactSecs) && exactSecs > 0) {
            setRecordedDuration(exactSecs);
            setDuration(exactSecs);
          }
        } catch {
          // fallback to timer seconds
        }

        setPhase("preview");
      };

      mr.start(100); // collect in 100ms chunks for real-time data
      mediaRef.current = mr;

      useChatStore.getState().emitTyping("recording");

      // Speech recognition — non-continuous for mobile compatibility
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        try {
          const rec = new SR();
          rec.lang = navigator.language || "en-US";
          rec.continuous = false;
          rec.interimResults = true;
          rec.onresult = (e) => {
            let text = "";
            for (let i = e.resultIndex; i < e.results.length; ++i) {
              text += e.results[i][0].transcript;
            }
            setTranscript(text);
          };
          rec.start();
          recognitionRef.current = rec;
        } catch {}
      }

      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      setSeconds(0);
      setRecordedDuration(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          setRecordedDuration(next);
          return next;
        });
      }, 1000);
    } catch {
      toast.error("Microphone access denied.");
      onCancel();
    }
  };

  const pauseRecording = () => {
    if (mediaRef.current && mediaRef.current.state === "recording") {
      mediaRef.current.pause();
      clearInterval(timerRef.current);
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRef.current && mediaRef.current.state === "paused") {
      mediaRef.current.resume();
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          setRecordedDuration(next);
          return next;
        });
      }, 1000);
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    try { recognitionRef.current?.stop(); } catch {}
    mediaRef.current?.stop();
  };

  const handleSend = () => {
    if (!audioBlob) return;
    if (audioRef.current) audioRef.current.pause();
    const reader = new FileReader();
    reader.onloadend = () => onSend(reader.result);
    reader.readAsDataURL(audioBlob);
    useChatStore.getState().emitStopTyping();
  };

  const handleDelete = () => {
    cleanup();
    useChatStore.getState().emitStopTyping();
    setBlob(null); setURL(null); setSeconds(0); setRecordedDuration(0); setTranscript("");
    setProgress(0); setDuration(0); setPlaying(false);
    onCancel();
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const effectiveDuration = (duration && duration !== Infinity && !isNaN(duration) && duration > 0)
    ? duration
    : (recordedDuration || seconds || 1);

  const pct = Math.min(100, Math.max(0, (progress / effectiveDuration) * 100));

  // ── PREVIEW PHASE ─────────────────────────────────────────────────────────
  if (phase === "preview" && audioURL) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="flex items-center gap-2 flex-1 px-3 py-2 rounded-2xl w-full min-w-0"
        style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(139,92,246,0.3)",
        }}
      >
        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={audioURL}
          preload="auto"
          onLoadedMetadata={() => {
            if (audioRef.current) {
              const d = audioRef.current.duration;
              if (d && d !== Infinity && !isNaN(d) && d > 0) setDuration(d);
            }
          }}
          onTimeUpdate={() => {
            if (audioRef.current) setProgress(audioRef.current.currentTime);
          }}
          onEnded={() => {
            setPlaying(false);
            setProgress(0);
          }}
          className="hidden"
        />

        {/* Delete button */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleDelete}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform"
          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
          title="Delete recording"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </motion.button>

        {/* Play/Pause Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-md"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
              <rect x="5" y="4" width="4" height="16" rx="1"/>
              <rect x="15" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white" className="ml-0.5">
              <polygon points="5 3 19 12 5 21"/>
            </svg>
          )}
        </motion.button>

        {/* WhatsApp-style Waveform Seek Bar + Time display */}
        <div className="flex-1 flex items-center gap-2 min-w-0 px-1">
          <div
            className="flex-1 flex items-center gap-[2.5px] cursor-pointer h-7 select-none py-1"
            onClick={(e) => {
              if (!audioRef.current || !effectiveDuration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const newTime = clickPct * effectiveDuration;
              audioRef.current.currentTime = newTime;
              setProgress(newTime);
            }}
          >
            {(previewBars.length > 0 ? previewBars : Array(28).fill(12)).map((h, i) => {
              const barPct = (i / 28) * 100;
              const active = barPct <= pct;
              return (
                <div
                  key={i}
                  className="rounded-full flex-1 transition-colors duration-150"
                  style={{
                    height: `${Math.max(4, h)}px`,
                    background: active ? "var(--accent)" : "var(--border)",
                  }}
                />
              );
            })}
          </div>

          <span className="text-[11.5px] font-mono flex-shrink-0 tabular-nums min-w-[76px] text-right" style={{ color: "var(--text-secondary)" }}>
            {fmt(Math.floor(progress))} / {fmt(Math.floor(effectiveDuration))}
          </span>
        </div>

        {/* Send button */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleSend}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
          style={{ background: "var(--accent)" }}
          title="Send voice message"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </motion.button>
      </motion.div>
    );
  }

  // ── RECORDING PHASE ───────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="flex items-center gap-3 flex-1 px-3 rounded-2xl relative overflow-hidden shadow-sm"
      style={{
        background: "var(--bg-input)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid var(--border)",
        minHeight: 48,
      }}
    >
      {/* Animated glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at left, rgba(0,168,132,0.08) 0%, transparent 65%)" }}
      />

      {/* Pulsing mic dot & Timer */}
      <div className="flex items-center gap-2 z-10 flex-shrink-0">
        <motion.div
          animate={isPaused ? { scale: 1, opacity: 0.5 } : { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"
        />
        <span className="text-[13px] font-mono w-10 tabular-nums font-semibold" style={{ color: "var(--text-primary)" }}>
          {fmt(seconds)}
        </span>
      </div>

      {/* Live waveform / transcript */}
      <div className="flex-1 flex flex-col justify-center min-w-0 z-10">
        <AnimatePresence mode="wait">
          {transcript ? (
            <motion.p
              key="transcript"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[11.5px] truncate italic"
              style={{ color: "var(--accent)" }}
            >
              "{transcript}"
            </motion.p>
          ) : (
            <motion.div key="bars" className="flex items-end gap-[2px] h-6">
              {bars.map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: isPaused ? 4 : h }}
                  transition={{ duration: 0.1 }}
                  className="w-[2px] rounded-full"
                  style={{ background: "var(--accent)", minHeight: 3 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* WhatsApp style Controls: Pause/Resume, Stop/Preview, Delete */}
      <div className="flex items-center gap-1.5 z-10 flex-shrink-0">
        {/* Pause / Resume */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={isPaused ? resumeRecording : pauseRecording}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          title={isPaused ? "Resume recording" : "Pause recording"}
        >
          {isPaused ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
              <polygon points="5 3 19 12 5 21"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="4" width="4" height="16" rx="1"/>
              <rect x="15" y="4" width="4" height="16" rx="1"/>
            </svg>
          )}
        </motion.button>

        {/* Stop to Preview */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={stopRecording}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "rgba(0,168,132,0.15)", border: "1px solid rgba(0,168,132,0.3)", color: "var(--accent)" }}
          title="Stop & preview recording"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
          </svg>
        </motion.button>

        {/* Delete */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleDelete}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-rose-500/10 text-rose-500"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
          title="Discard recording"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
}
