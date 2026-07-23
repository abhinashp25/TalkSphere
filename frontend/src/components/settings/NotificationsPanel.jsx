import { useState, useEffect } from "react";
import { useChatStore } from "../../store/useChatStore";
import { MessageSquare, Users, CircleDot, Phone, Bell, Check, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)] border border-[var(--border)]"
        style={{ background: checked ? undefined : "var(--bg-input)" }} />
    </label>
  );
}

const MSG_TONE_OPTIONS = [
  { file: "button-tap-sound.mp3", label: "Default Tone (Button Tap)" },
  { file: "bubble-pop-up.wav", label: "Bubble Pop Up" },
  { file: "correct-answer-tone.wav", label: "Correct Answer" },
  { file: "dry-pop-up.wav", label: "Dry Pop Up" },
  { file: "light-button.wav", label: "Light Button" },
  { file: "long-pop.wav", label: "Long Pop" },
  { file: "message-pop.mp3", label: "Message Pop" },
  { file: "notification-1.mp3", label: "Notification 1" },
  { file: "nterface_click.mp3", label: "Interface Click" },
  { file: "positive.wav", label: "Positive Tone" },
  { file: "software-interface-start.wav", label: "Software Start" },
  { file: "software-interface.wav", label: "Software Tone" },
  { file: "ui-app-notification.mp3", label: "UI App Notification" },
  { file: "ui-pop-sound.mp3", label: "UI Pop Sound" },
];

const CALL_RINGTONE_OPTIONS = [
  { file: "ringtone.mp3", label: "Default Ringtone" },
  { file: "call_ringtone.mp3", label: "Call Ringtone" },
  { file: "community-phone-ringing.mp3", label: "Community Telephone" },
  { file: "ElevenLabs_Romantic_piano_ballad_ringtone,_slow_emotional_melody.mp3", label: "Romantic Piano" },
  { file: "freesound_community-telephone-electronic-42654.mp3", label: "Electronic Beep" },
  { file: "incoming-phone.mp3", label: "Incoming Phone" },
  { file: "mixkit-on-hold-ringtone-1361.wav", label: "On Hold Ringtone" },
  { file: "suzume_kalimba.mp3", label: "Suzume Kalimba" },
  { file: "tanjiro_kamado.mp3", label: "Tanjiro Kamado" },
];

export default function NotificationsPanel() {
  const { isSoundEnabled, toggleSound } = useChatStore();

  // Local settings bound to LocalStorage
  const [msgTone, setMsgTone] = useState(() => localStorage.getItem("msg_tone") || "button-tap-sound.mp3");
  const [groupTone, setGroupTone] = useState(() => localStorage.getItem("group_tone") || "button-tap-sound.mp3");
  const [callRingtone, setCallRingtone] = useState(() => localStorage.getItem("call_ringtone") || "ringtone.mp3");
  
  const [vibrateOn, setVibrateOn] = useState(() => localStorage.getItem("vibrate_mode") !== "false");
  const [outgoingSound, setOutgoingSound] = useState(() => localStorage.getItem("outgoing_sound_enabled") !== "false");
  const [showPreviews, setShowPreviews] = useState(() => localStorage.getItem("notif_previews") !== "false");
  
  const [notifBanner, setNotifBanner] = useState(() => localStorage.getItem("notif_banner") || "always");
  const [taskbarBadge, setTaskbarBadge] = useState(() => localStorage.getItem("taskbar_badge") || "always");

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem("msg_tone", msgTone);
  }, [msgTone]);

  useEffect(() => {
    localStorage.setItem("group_tone", groupTone);
  }, [groupTone]);

  useEffect(() => {
    localStorage.setItem("call_ringtone", callRingtone);
  }, [callRingtone]);

  useEffect(() => {
    localStorage.setItem("vibrate_mode", String(vibrateOn));
  }, [vibrateOn]);

  useEffect(() => {
    localStorage.setItem("outgoing_sound_enabled", String(outgoingSound));
  }, [outgoingSound]);

  useEffect(() => {
    localStorage.setItem("notif_previews", String(showPreviews));
  }, [showPreviews]);

  useEffect(() => {
    localStorage.setItem("notif_banner", notifBanner);
  }, [notifBanner]);

  useEffect(() => {
    localStorage.setItem("taskbar_badge", taskbarBadge);
  }, [taskbarBadge]);

  // Audio preview helper
  const playTonePreview = (url) => {
    if (!isSoundEnabled) return;
    const audio = new Audio(url);
    audio.volume = 0.4;
    audio.play().catch(() => {});
  };

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Banner / Badge Global Controls */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Global Settings
        </p>
        <div className="rounded-xl overflow-hidden px-4 border space-y-4 py-4"
          style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[14px]" style={{ color: "var(--text-primary)" }}>Show notification banner</span>
              <select
                value={notifBanner}
                onChange={e => setNotifBanner(e.target.value)}
                className="p-1.5 rounded-lg text-[12.5px] outline-none border"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                <option value="always">Always</option>
                <option value="never">Never</option>
                <option value="active">Only when active</option>
              </select>
            </div>
            <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Specify banner appearance criteria</p>
          </div>

          <div className="h-px" style={{ background: "var(--border)" }} />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[14px]" style={{ color: "var(--text-primary)" }}>Show taskbar notification badge</span>
              <select
                value={taskbarBadge}
                onChange={e => setTaskbarBadge(e.target.value)}
                className="p-1.5 rounded-lg text-[12.5px] outline-none border"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                <option value="always">Always</option>
                <option value="never">Never</option>
              </select>
            </div>
            <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Toggle status bar indicators</p>
          </div>

          <div className="h-px" style={{ background: "var(--border)" }} />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[14px]" style={{ color: "var(--text-primary)" }}>System Sounds</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Enable incoming alerts globally
              </p>
            </div>
            <Toggle checked={isSoundEnabled} onChange={toggleSound} />
          </div>
        </div>
      </div>

      {/* Ringtones Config */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Notification Sound Profiles
        </p>
        <div className="rounded-xl overflow-hidden px-4 border py-4 space-y-4"
          style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
          
          {/* Messages */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <MessageSquare size={17} className="text-emerald-400" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-[14px] block" style={{ color: "var(--text-primary)" }}>Messages</span>
                <span className="text-[11px] block mt-0.5" style={{ color: "var(--text-muted)" }}>Incoming message sound</span>
              </div>
            </div>
            <select
              value={msgTone}
              onChange={e => { setMsgTone(e.target.value); playTonePreview(`/Notifications/${e.target.value}`); }}
              className="w-full p-2 border text-[13px] rounded-xl outline-none"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              {MSG_TONE_OPTIONS.map(opt => (
                <option key={opt.file} value={opt.file}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="h-px" style={{ background: "var(--border)" }} />

          {/* Groups */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Users size={17} className="text-[#6366f1]" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-[14px] block" style={{ color: "var(--text-primary)" }}>Groups</span>
                <span className="text-[11px] block mt-0.5" style={{ color: "var(--text-muted)" }}>Incoming group message sound</span>
              </div>
            </div>
            <select
              value={groupTone}
              onChange={e => { setGroupTone(e.target.value); playTonePreview(`/Notifications/${e.target.value}`); }}
              className="w-full p-2 border text-[13px] rounded-xl outline-none"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              {MSG_TONE_OPTIONS.map(opt => (
                <option key={opt.file} value={opt.file}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="h-px" style={{ background: "var(--border)" }} />

          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CircleDot size={17} className="text-orange-400" />
              <div>
                <span className="font-medium text-[14px] block" style={{ color: "var(--text-primary)" }}>Status updates</span>
                <span className="text-[11px] mt-0.5 block" style={{ color: "var(--text-muted)" }}>Status notify indicators</span>
              </div>
            </div>
            <Toggle checked={true} onChange={() => {}} />
          </div>

          <div className="h-px" style={{ background: "var(--border)" }} />

          {/* Calls */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Phone size={17} className="text-[#8b5cf6]" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-[14px] block" style={{ color: "var(--text-primary)" }}>Calls Ringtone</span>
                <span className="text-[11px] block mt-0.5" style={{ color: "var(--text-muted)" }}>Incoming WebRTC ringtone</span>
              </div>
            </div>
            <select
              value={callRingtone}
              onChange={e => { setCallRingtone(e.target.value); playTonePreview(`/Call_ringtones/${e.target.value}`); }}
              className="w-full p-2 border text-[13px] rounded-xl outline-none"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              {CALL_RINGTONE_OPTIONS.map(opt => (
                <option key={opt.file} value={opt.file}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Previews / Vibration / Outgoing Toggles */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Preferences
        </p>
        <div className="rounded-xl overflow-hidden px-4 border py-4 space-y-4"
          style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[14px]" style={{ color: "var(--text-primary)" }}>Show previews</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Preview message text inside message notifications
              </p>
            </div>
            <Toggle checked={showPreviews} onChange={e => setShowPreviews(e.target.checked)} />
          </div>

          <div className="h-px" style={{ background: "var(--border)" }} />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[14px]" style={{ color: "var(--text-primary)" }}>Play sound for outgoing messages</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Send message tone (button-tap-sound.mp3)
              </p>
            </div>
            <Toggle checked={outgoingSound} onChange={e => setOutgoingSound(e.target.checked)} />
          </div>

          <div className="h-px" style={{ background: "var(--border)" }} />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[14px]" style={{ color: "var(--text-primary)" }}>Vibration alert</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Play vibrations on incoming items
              </p>
            </div>
            <Toggle checked={vibrateOn} onChange={e => setVibrateOn(e.target.checked)} />
          </div>
        </div>
      </div>
    </div>
  );
}
