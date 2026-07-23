import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

/**
 * AvatarViewer — WhatsApp-style full-screen profile picture viewer.
 * - Click outside or ✕ to close
 * - Scroll (via non-passive wheel listener) to zoom
 * - Double-tap/click to toggle zoom
 * - Drag to pan when zoomed
 */
export default function AvatarViewer({ src, name, onClose }) {
  const [scale, setScale]       = useState(1);
  const [pos, setPos]           = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const containerRef  = useRef(null);
  const dragStart     = useRef(null);
  const scaleRef      = useRef(1);   // kept in sync so wheel handler (closure) reads latest

  // ── Non-passive wheel listener (must use addEventListener, not onWheel prop) ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.2 : 0.2;
      const next = Math.max(1, Math.min(4, +(scaleRef.current + delta).toFixed(1)));
      scaleRef.current = next;
      setScale(next);
      if (next === 1) setPos({ x: 0, y: 0 });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const resetView = useCallback(() => {
    scaleRef.current = 1;
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const zoom = useCallback((delta) => {
    const next = Math.max(1, Math.min(4, +(scaleRef.current + delta).toFixed(1)));
    scaleRef.current = next;
    setScale(next);
    if (next === 1) setPos({ x: 0, y: 0 });
  }, []);

  // ── Drag handlers ──
  const onMouseDown = (e) => {
    if (scale <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  const onMouseMove = (e) => {
    if (!dragging || !dragStart.current) return;
    setPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const onMouseUp = () => { setDragging(false); dragStart.current = null; };

  // ── Touch drag ──
  const onTouchStart = (e) => {
    if (e.touches.length !== 1 || scale <= 1) return;
    const t = e.touches[0];
    dragStart.current = { x: t.clientX - pos.x, y: t.clientY - pos.y };
  };
  const onTouchMove = (e) => {
    if (!dragStart.current || e.touches.length !== 1) return;
    const t = e.touches[0];
    setPos({ x: t.clientX - dragStart.current.x, y: t.clientY - dragStart.current.y });
  };
  const onTouchEnd = () => { dragStart.current = null; };

  if (!src) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="avatar-viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[9999] flex flex-col"
        style={{ background: "#000" }}
      >
        {/* ── Top bar ── */}
        <div
          className="flex items-center gap-3 px-2 py-2 flex-shrink-0"
          style={{ background: "rgba(0,0,0,0.85)" }}
        >
          <button
            onClick={onClose}
            className="p-2.5 rounded-full transition-colors hover:bg-white/10 active:bg-white/20"
            style={{ color: "#e0e0e0" }}
          >
            <X size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-white leading-tight truncate">{name}</p>
            <p className="text-[11px] text-white/45">Profile photo</p>
          </div>
          <div className="flex items-center gap-0.5 pr-1">
            <button
              onClick={() => zoom(-0.2)}
              disabled={scale <= 1}
              className="p-2 rounded-full transition-colors hover:bg-white/10 disabled:opacity-30"
              style={{ color: "#e0e0e0" }}
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-[11px] text-white/40 w-9 text-center tabular-nums">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => zoom(0.2)}
              disabled={scale >= 4}
              className="p-2 rounded-full transition-colors hover:bg-white/10 disabled:opacity-30"
              style={{ color: "#e0e0e0" }}
            >
              <ZoomIn size={20} />
            </button>
          </div>
        </div>

        {/* ── Image area ── */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center overflow-hidden select-none"
          style={{ cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
          onClick={(e) => { if (e.target === e.currentTarget && scale === 1) onClose(); }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <motion.img
            src={src}
            alt={name}
            referrerPolicy="no-referrer"
            draggable={false}
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onDoubleClick={() => scale === 1 ? zoom(1) : resetView()}
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
              transformOrigin: "center center",
              transition: dragging ? "none" : "transform 0.15s ease",
              /* WhatsApp style: circular when at 1×, rect when zoomed */
              borderRadius: scale > 1 ? "8px" : "50%",
              width: "min(72vw, 360px)",
              height: "min(72vw, 360px)",
              objectFit: "cover",
              boxShadow: "0 0 80px rgba(0,0,0,0.9)",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* ── Bottom name chip ── */}
        <div
          className="flex items-center justify-center py-4 flex-shrink-0"
          style={{ background: "rgba(0,0,0,0.85)" }}
        >
          <span className="text-[13px] text-white/40">
            {scale > 1 ? "Double-tap to reset · Drag to pan" : "Double-tap to zoom · Scroll to zoom"}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
