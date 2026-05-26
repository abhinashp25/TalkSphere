import { useState, useRef, useEffect } from "react";
import { MicIcon, StopCircleIcon, SendIcon, XIcon, WavesIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

export default function VoiceRecorder({ onSend, onCancel }) {
  const [recording, setRecording]   = useState(false);
  const [audioBlob, setBlob]        = useState(null);
  const [audioURL,  setURL]         = useState(null);
  const [seconds,   setSeconds]     = useState(0);
  const [transcript, setTranscript] = useState("");
  
  const mediaRef       = useRef(null);
  const timerRef       = useRef(null);
  const chunksRef      = useRef([]);
  const recognitionRef = useRef(null);

  // Animated bars for visualizer
  const [bars, setBars] = useState(Array(12).fill(0));

  useEffect(() => {
    startRecording();
    return () => {
      mediaRef.current?.stop();
      recognitionRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let intv;
    if (recording) {
      intv = setInterval(() => {
        setBars(Array.from({ length: 12 }, () => Math.random() * 20 + 4));
      }, 150);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBars(Array(12).fill(4));
    }
    return () => clearInterval(intv);
  }, [recording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setBlob(blob);
        setURL(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      
      // Emit recording state via socket
      useChatStore.getState().emitTyping("recording");
      
      // Start Live Transcription Preview if available
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (e) => {
          let final = "";
          for (let i = e.resultIndex; i < e.results.length; ++i) final += e.results[i][0].transcript;
          setTranscript(prev => prev + (prev && final ? " " : "") + final);
        };
        recognition.start();
        recognitionRef.current = recognition;
      }

      setRecording(true);
      setSeconds(0);
      setTranscript("");
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      toast.error("Microphone access denied or not supported.");
      onCancel();
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    recognitionRef.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
    useChatStore.getState().emitStopTyping();
  };

  const handleSend = () => {
    if (!audioBlob) return;
    const reader = new FileReader();
    reader.onloadend = () => onSend(reader.result);
    reader.readAsDataURL(audioBlob);
    useChatStore.getState().emitStopTyping();
  };

  const handleCancel = () => {
    if (recording) stopRecording();
    else useChatStore.getState().emitStopTyping();
    setBlob(null); setURL(null); setSeconds(0); setTranscript("");
    onCancel();
  };

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  if (audioURL) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
        className="flex mb-1.5 items-center gap-2 flex-1 rounded-2xl px-4 py-1.5"
        style={{ background: 'rgba(79, 209, 197, 0.1)', border: '1px solid rgba(79, 209, 197, 0.2)' }}>
        <audio src={audioURL} controls className="flex-1 h-8" style={{ accentColor: '#4fd1c5' }} />
        <button onClick={handleSend} className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #4fd1c5, #38b2ac)', boxShadow: '0 4px 12px rgba(79,209,197,0.3)' }}>
          <SendIcon className="w-4 h-4 ml-0.5" />
        </button>
        <button onClick={handleCancel} className="icon-btn flex-shrink-0 text-[#ef4444]"><XIcon className="w-5 h-5" /></button>
      </motion.div>
    );
  }

  if (recording) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 flex-1 px-4 mb-1.5 rounded-2xl relative overflow-hidden"
        style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.1)', minHeight: 44 }}>
        
        {/* Glow effect */}
        <div className="absolute top-0 left-0 bottom-0 w-32 "
             style={{ background: 'radial-gradient(ellipse at left, rgba(79,209,197,0.15) 0%, transparent 70%)'}} />

        {/* Action icons */}
        <div className="flex items-center gap-2 z-10">
          <WavesIcon size={18} className="text-[#4fd1c5] animate-pulse" />
          <span className="text-[13px] font-mono font-medium text-white/90 w-10">{fmt(seconds)}</span>
        </div>

        {/* Live Visualizer + Transcript */}
        <div className="flex-1 flex flex-col justify-center min-w-0 z-10 border-l border-white/10 pl-3">
          {transcript ? (
             <p className="text-[12px] text-[#4fd1c5] truncate font-medium italic">
                "{transcript}"
             </p>
          ) : (
            <div className="flex items-center gap-[2px]">
              {bars.map((h, i) => (
                <motion.div key={i} animate={{ height: h }} transition={{ duration: 0.15 }}
                  className="w-1 rounded-full bg-[#4fd1c5]" style={{ minHeight: 4 }} />
              ))}
              <span className="text-[11px] text-[#a3a3a3] ml-2 italic">Listening...</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 z-10">
          <button onClick={stopRecording}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition text-white">
            <StopCircleIcon className="w-4 h-4" />
          </button>
          <button onClick={handleCancel} className="icon-btn text-[#ef4444] hover:bg-[#ef4444]/10"><XIcon className="w-4 h-4" /></button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 mb-1.5 rounded-2xl flex-1"
         style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.1)', minHeight: 44 }}>
      <button onClick={startRecording} className="icon-btn text-[#a3a3a3] hover:text-[#4fd1c5] flex items-center gap-2" title="Record voice message">
        <MicIcon className="w-5 h-5 animate-pulse text-[#4fd1c5]" />
        <span className="text-[12px] text-[#a3a3a3] italic">Connecting microphone...</span>
      </button>
      <div className="flex-1" />
      <button onClick={handleCancel} className="icon-btn text-[#ef4444] hover:bg-[#ef4444]/10 p-1 rounded-full"><XIcon className="w-4 h-4" /></button>
    </div>
  );
}
