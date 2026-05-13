import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { EventData } from "../../types/event";

// ─── palette ─────────────────────────────────────────────────────────────────
const BURGUNDY = "#66021F";
const CREAM    = "#FFFAF8";
const INK      = "#3A3A3A";
const ENVELOPE_BG = "#E8E3DC";

// ─── font helpers ─────────────────────────────────────────────────────────────
const playfair  = { fontFamily: "'Playfair Display', serif" } as const;
const playfairI = { fontFamily: "'Playfair Display', serif", fontStyle: "italic" } as const;
const ovo       = { fontFamily: "'Ovo', serif" } as const;

// ─── Wavy divider ─────────────────────────────────────────────────────────────
function WavyBottom({ fill = BURGUNDY }: { fill?: string }) {
  return (
    <div style={{ lineHeight: 0, marginTop: -1 }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 523 60" preserveAspectRatio="none" width="100%" height="40">
        <path d="M0,30 C40,0 80,60 120,30 C160,0 200,60 240,30 C280,0 320,60 360,30 C400,0 440,60 480,30 L523,30 L523,60 L0,60 Z" fill={fill} />
      </svg>
    </div>
  );
}

function WavyTop({ fill = BURGUNDY }: { fill?: string }) {
  return (
    <div style={{ lineHeight: 0, marginBottom: -1 }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 523 60" preserveAspectRatio="none" width="100%" height="40">
        <path d="M0,30 C40,60 80,0 120,30 C160,60 200,0 240,30 C280,60 320,0 360,30 C400,60 440,0 480,30 L523,30 L523,0 L0,0 Z" fill={fill} />
      </svg>
    </div>
  );
}

// ─── Scroll reveal ─────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, style = {} }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 1.8, delay, ease: "easeOut" }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Peony SVG ────────────────────────────────────────────────────────────────
function PeonySVG({ size = 120, color = "#E8A0BF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Center */}
      <circle cx="60" cy="60" r="12" fill="#F5C2D4" />
      {/* Petals layer 1 */}
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <ellipse
          key={i}
          cx="60" cy="60"
          rx="10" ry="22"
          fill={color}
          opacity="0.85"
          transform={`rotate(${deg} 60 60) translate(0 -20)`}
        />
      ))}
      {/* Petals layer 2 */}
      {[22,67,112,157,202,247,292,337].map((deg, i) => (
        <ellipse
          key={i}
          cx="60" cy="60"
          rx="8" ry="18"
          fill={color}
          opacity="0.6"
          transform={`rotate(${deg} 60 60) translate(0 -26)`}
        />
      ))}
      {/* Stamens */}
      {[0,60,120,180,240,300].map((deg, i) => (
        <circle
          key={i}
          cx={60 + 8 * Math.cos((deg * Math.PI) / 180)}
          cy={60 + 8 * Math.sin((deg * Math.PI) / 180)}
          r="2"
          fill="#F9E0AC"
        />
      ))}
    </svg>
  );
}

// ─── Wax seal SVG ─────────────────────────────────────────────────────────────
function WaxSeal() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" fill={BURGUNDY} />
      <circle cx="60" cy="60" r="50" fill="none" stroke="#C8A08A" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="42" fill="none" stroke="#C8A08A" strokeWidth="0.8" strokeDasharray="4 3" />
      {/* monogram V & P */}
      <text x="60" y="55" textAnchor="middle" fill="#F5E6D8" fontSize="18" fontFamily="Playfair Display, serif" fontStyle="italic">V</text>
      <text x="60" y="70" textAnchor="middle" fill="#F5E6D8" fontSize="11" fontFamily="Playfair Display, serif">&amp;</text>
      <text x="60" y="84" textAnchor="middle" fill="#F5E6D8" fontSize="18" fontFamily="Playfair Display, serif" fontStyle="italic">P</text>
    </svg>
  );
}

// ─── Envelope ─────────────────────────────────────────────────────────────────
function EnvelopeOverlay({ onOpen }: { onOpen: () => void }) {
  const [clicked, setClicked] = useState(false);
  const [hidden, setHidden] = useState(false);

  const handleClick = useCallback(() => {
    if (clicked) return;
    setClicked(true);
    setTimeout(() => setHidden(true), 4600);
  }, [clicked]);

  if (hidden) return null;

  return (
    <div
      onClick={!clicked ? handleClick : undefined}
      style={{
        position: "fixed", inset: 0,
        background: ENVELOPE_BG,
        zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: clicked ? "default" : "pointer",
        overflow: "hidden",
      }}
    >
      {/* Envelope body */}
      <div style={{ position: "relative", width: 320, height: 240 }}>
        {/* Left flap */}
        <div style={{
          position: "absolute", top: 0, left: 0, width: "50%", height: "100%",
          background: "#D4CCBF",
          clipPath: "polygon(0 0, 100% 50%, 0 100%)",
          transition: clicked ? "transform 2s ease 2.5s, opacity 0.5s ease 0.5s" : "none",
          transform: clicked ? "translateX(-560px)" : "none",
          opacity: clicked ? 0 : 1,
        }} />
        {/* Right flap */}
        <div style={{
          position: "absolute", top: 0, right: 0, width: "50%", height: "100%",
          background: "#CEC6BA",
          clipPath: "polygon(100% 0, 0 50%, 100% 100%)",
          transition: clicked ? "transform 2s ease 2.5s, opacity 0.5s ease 0.5s" : "none",
          transform: clicked ? "translateX(560px)" : "none",
          opacity: clicked ? 0 : 1,
        }} />
        {/* Bottom flap */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, width: "100%", height: "50%",
          background: "#C8C0B4",
          clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
          transition: clicked ? "transform 1.5s ease 2.5s, opacity 0.5s ease 0.5s" : "none",
          transform: clicked ? "translateY(566px)" : "none",
          opacity: clicked ? 0 : 1,
        }} />
        {/* Top flap */}
        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "50%",
          background: "#D9D1C5",
          clipPath: "polygon(0 0, 50% 100%, 100% 0)",
          transition: clicked ? "transform 1.5s ease 2.5s, opacity 0.5s ease 0.5s" : "none",
          transform: clicked ? "translateY(-430px)" : "none",
          opacity: clicked ? 0 : 1,
          zIndex: 2,
        }} />
        {/* Envelope center background */}
        <div style={{
          position: "absolute", inset: 0,
          background: "#E0D9CF",
          zIndex: 0,
        }} />
        {/* Wax seal */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 3,
          transition: clicked ? "transform 1.5s ease 1s, opacity 1.5s ease 1s" : "none",
          ...(clicked ? { transform: "translate(-50%, -50%) scale(1.22)", opacity: 0 } : {}),
        }}>
          <WaxSeal />
        </div>
      </div>

      {/* "Click to open" text */}
      <div style={{
        position: "absolute",
        bottom: "calc(50% - 150px)",
        left: "50%",
        transform: "translateX(-50%)",
        color: BURGUNDY,
        ...playfairI,
        fontSize: 15,
        transition: clicked ? "opacity 1.5s ease 0s" : "none",
        opacity: clicked ? 0 : 1,
        whiteSpace: "nowrap",
      }}>
        Click to open
      </div>

      {/* Animated peony on hover */}
      <div style={{ position: "absolute", top: 20, right: 20, opacity: 0.4, pointerEvents: "none" }}>
        <PeonySVG size={80} color="#C8A08A" />
      </div>
      <div style={{ position: "absolute", bottom: 20, left: 20, opacity: 0.4, pointerEvents: "none" }}>
        <PeonySVG size={70} color="#D4B0A0" />
      </div>
    </div>
  );
}

// ─── Music player ─────────────────────────────────────────────────────────────
function MusicPlayer({ src }: { src?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play(); setPlaying(true); }
    else { a.pause(); setPlaying(false); }
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000 }}>
      <audio ref={audioRef} loop src={src ?? ""} preload="none" />
      <button
        onClick={toggle}
        style={{
          width: 54, height: 54,
          borderRadius: "50%",
          background: BURGUNDY,
          border: "none",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(102,2,31,0.4)",
        }}
      >
        {playing ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <polygon points="6,3 20,12 6,21" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function T13Hero({ event }: { event: EventData }) {
  const name1 = event.person1_name || "Viktor";
  const name2 = event.person2_name || "Paula";

  const fmtDate = (d: string) => {
    const parts = d.split("-");
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0].slice(2)}`;
    return d;
  };

  return (
    <div style={{
      minHeight: "100svh",
      background: BURGUNDY,
      position: "relative",
      overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* bg image overlay */}
      {event.main_image && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${event.main_image})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.35,
        }} />
      )}

      {/* Peony decorations */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, delay: 3, ease: "easeOut" }}
        style={{ position: "absolute", top: -20, left: -20 }}
      >
        <PeonySVG size={160} color="#E8A0BF" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.5, delay: 3.2, ease: "easeOut" }}
        style={{ position: "absolute", top: 40, right: -30 }}
      >
        <PeonySVG size={140} color="#F0B8CC" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.7, delay: 3.4, ease: "easeOut" }}
        style={{ position: "absolute", bottom: 20, left: 10 }}
      >
        <PeonySVG size={120} color="#E0A0B8" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.3, delay: 3.6, ease: "easeOut" }}
        style={{ position: "absolute", bottom: -10, right: 0 }}
      >
        <PeonySVG size={150} color="#F5B0CA" />
      </motion.div>

      {/* Text */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 24px" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 3, ease: "easeOut" }}
          style={{ color: "white", ...playfairI, fontSize: 36, marginBottom: 8 }}
        >
          Wedding Day
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 3.15, ease: "easeOut" }}
          style={{ color: "white", ...ovo, fontSize: 18, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 28 }}
        >
          {fmtDate(event.date)}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 3.3, ease: "easeOut" }}
          style={{ color: "white", ...playfairI, fontSize: 76, lineHeight: 1, marginBottom: 0 }}
        >
          {name1}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 3.45, ease: "easeOut" }}
          style={{ color: "white", ...playfairI, fontSize: 44, lineHeight: 1.2 }}
        >
          &amp;
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 3.6, ease: "easeOut" }}
          style={{ color: "white", ...playfairI, fontSize: 76, lineHeight: 1 }}
        >
          {name2}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Letter ───────────────────────────────────────────────────────────────────
function T13Letter() {
  return (
    <div style={{ background: BURGUNDY }}>
      <WavyTop fill={CREAM} />
      <div style={{ background: BURGUNDY, padding: "48px 32px 56px", textAlign: "center" }}>
        <FadeUp>
          <div style={{ color: "white", ...playfairI, fontSize: 30, marginBottom: 20 }}>
            Dear Friends and Family,
          </div>
          <p style={{ color: "rgba(255,255,255,0.88)", ...ovo, fontSize: 17, lineHeight: 1.8, maxWidth: 420, margin: "0 auto" }}>
            As we get ready to say "I do," we feel grateful for the wonderful people in our lives.
            Your support means the world to us, and we would be honored to have you with us as we begin our life together.
          </p>
        </FadeUp>
      </div>
      <WavyBottom fill={CREAM} />
    </div>
  );
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function T13Countdown({ event }: { event: EventData }) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(`${event.date}T${event.time || "16:00"}:00`);
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [event.date, event.time]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const units = [
    { val: time.days,    label: "Days" },
    { val: time.hours,   label: "Hours" },
    { val: time.minutes, label: "Minutes" },
    { val: time.seconds, label: "Seconds" },
  ];

  return (
    <div style={{ background: CREAM, padding: "56px 24px", textAlign: "center" }}>
      <FadeUp>
        <div style={{ ...playfairI, fontSize: 34, color: INK, marginBottom: 36 }}>
          The Celebration Begins In
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {units.map((u, i) => (
            <div key={u.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ ...ovo, fontSize: 44, fontWeight: 700, color: INK, lineHeight: 1 }}>
                  {pad(u.val)}
                </div>
                <div style={{ ...ovo, fontSize: 12, color: INK, marginTop: 6, letterSpacing: "0.1em" }}>
                  {u.label}
                </div>
              </div>
              {i < 3 && (
                <div style={{ ...ovo, fontSize: 36, color: BURGUNDY, marginBottom: 18, opacity: 0.7 }}>:</div>
              )}
            </div>
          ))}
        </div>
      </FadeUp>
    </div>
  );
}

// ─── Schedule ─────────────────────────────────────────────────────────────────
function T13Schedule() {
  const items = [
    { time: "16:00", label: "Wedding Ceremony" },
    { time: "17:00", label: "Cocktail Hour" },
    { time: "19:00", label: "Dinner", flower: true },
    { time: "20:00", label: "Party" },
  ];

  return (
    <div style={{ background: BURGUNDY }}>
      <WavyTop fill={BURGUNDY} />
      <div style={{ background: BURGUNDY, padding: "52px 24px 60px", textAlign: "center" }}>
        <FadeUp>
          <div style={{ ...playfairI, fontSize: 36, color: CREAM, marginBottom: 44 }}>
            Schedule of Events
          </div>
        </FadeUp>
        <div style={{ position: "relative", display: "inline-block", textAlign: "left" }}>
          {/* vertical line */}
          <div style={{
            position: "absolute",
            left: "50%", top: 0, bottom: 0,
            width: 2, background: "rgba(255,255,255,0.5)",
            transform: "translateX(-50%)",
          }} />
          {items.map((item, i) => (
            <FadeUp key={i} delay={i * 0.15}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, position: "relative" }}>
                <div style={{ ...ovo, fontSize: 22, fontWeight: 700, color: "white", width: 70, textAlign: "right" }}>
                  {item.time}
                </div>
                {/* diamond */}
                <div style={{
                  width: 10, height: 10,
                  background: "white",
                  transform: "rotate(45deg)",
                  flexShrink: 0,
                  position: "relative", zIndex: 1,
                }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ ...ovo, fontSize: 18, color: CREAM }}>
                    {item.label}
                  </div>
                  {item.flower && <PeonySVG size={44} color="#E8A0BF" />}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
      <WavyBottom fill={CREAM} />
    </div>
  );
}

// ─── Location ─────────────────────────────────────────────────────────────────
function T13Location({ event }: { event: EventData }) {
  return (
    <div style={{ background: CREAM, padding: "56px 32px", textAlign: "center" }}>
      <FadeUp>
        <div style={{ ...playfairI, fontSize: 36, color: BURGUNDY, marginBottom: 16 }}>
          Location
        </div>
        <div style={{ ...playfairI, fontSize: 20, fontWeight: 600, color: INK, marginBottom: 8 }}>
          {event.venue_name}
        </div>
        <div style={{ ...ovo, fontSize: 15, color: INK, opacity: 0.75, marginBottom: 28, lineHeight: 1.6 }}>
          {event.venue_address}
        </div>
      </FadeUp>

      {event.maps_photo && (
        <FadeUp delay={0.2}>
          <img
            src={event.maps_photo}
            alt={event.venue_name}
            style={{
              width: "100%", maxWidth: 440, height: 260,
              objectFit: "cover",
              borderRadius: 6,
              display: "block", margin: "0 auto 24px",
              boxShadow: "0 8px 32px rgba(102,2,31,0.15)",
            }}
          />
        </FadeUp>
      )}

      {event.venue_map_url && (
        <FadeUp delay={0.3}>
          <a
            href={event.venue_map_url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              background: BURGUNDY, color: "white",
              ...ovo, fontSize: 15,
              padding: "12px 36px",
              borderRadius: 30,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(102,2,31,0.3)",
            }}
          >
            Open in Maps
          </a>
        </FadeUp>
      )}
    </div>
  );
}

// ─── Dress Code ───────────────────────────────────────────────────────────────
function T13DressCode() {
  const swatches = ["#60603B", "#360C1A", "#40312C", "#EFDDCD"];

  return (
    <div style={{ background: BURGUNDY }}>
      <WavyTop fill={BURGUNDY} />
      <div style={{ background: BURGUNDY, padding: "52px 32px 60px", textAlign: "center" }}>
        <FadeUp>
          <div style={{ ...playfairI, fontSize: 36, color: CREAM, marginBottom: 28 }}>
            Dress Code
          </div>
        </FadeUp>

        {/* Color swatches */}
        <FadeUp delay={0.1}>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 28 }}>
            {swatches.map((c) => (
              <div
                key={c}
                style={{
                  width: 50, height: 50, borderRadius: "50%",
                  background: c,
                  border: `2px solid ${CREAM}`,
                }}
              />
            ))}
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <p style={{ ...ovo, fontSize: 18, color: CREAM, maxWidth: 380, margin: "0 auto 40px", lineHeight: 1.75 }}>
            We kindly invite you to dress in elegant attire that reflects the style and spirit of our special day.
          </p>
        </FadeUp>

        {/* Two cards */}
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: `1px solid rgba(255,255,255,0.2)`,
              borderRadius: 8, padding: "24px 20px",
              maxWidth: 200, textAlign: "center",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <PeonySVG size={60} color="#D4B0A0" />
            </div>
            <p style={{ ...ovo, fontSize: 14, color: CREAM, lineHeight: 1.65 }}>
              <strong>Gentlemen:</strong> Well-tailored suits with classic dress shoes are preferred.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: `1px solid rgba(255,255,255,0.2)`,
              borderRadius: 8, padding: "24px 20px",
              maxWidth: 200, textAlign: "center",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <PeonySVG size={60} color="#E8A0BF" />
            </div>
            <p style={{ ...ovo, fontSize: 14, color: CREAM, lineHeight: 1.65 }}>
              <strong>Ladies:</strong> Formal dresses in elegant, polished styles are encouraged.
            </p>
          </motion.div>
        </div>
      </div>
      <WavyBottom fill={CREAM} />
    </div>
  );
}

// ─── Details ──────────────────────────────────────────────────────────────────
function T13Details({ event }: { event: EventData }) {
  const contact = event.person1_name || "Organizer";
  const phone   = event.person1_instagram || "";

  return (
    <div style={{ background: CREAM, padding: "56px 32px 64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      {/* background peony parallax decoration */}
      <div style={{ position: "absolute", top: -30, right: -20, opacity: 0.12, pointerEvents: "none" }}>
        <PeonySVG size={240} color={BURGUNDY} />
      </div>
      <div style={{ position: "absolute", bottom: -40, left: -20, opacity: 0.1, pointerEvents: "none" }}>
        <PeonySVG size={200} color={BURGUNDY} />
      </div>

      <FadeUp>
        <div style={{ ...playfairI, fontSize: 36, color: BURGUNDY, marginBottom: 28 }}>
          Details
        </div>
        <p style={{ ...ovo, fontSize: 16, color: INK, lineHeight: 1.8, marginBottom: 12 }}>
          For additional information or questions,<br />please contact the wedding organizers.
        </p>
        <p style={{ ...playfair, fontSize: 18, color: BURGUNDY, fontWeight: 600, marginBottom: 4 }}>
          {contact}
        </p>
        {phone && (
          <p style={{ ...ovo, fontSize: 15, color: INK, marginBottom: 24 }}>
            {phone}
          </p>
        )}
        <p style={{ ...ovo, fontSize: 15, color: INK, lineHeight: 1.8, maxWidth: 380, margin: "0 auto", opacity: 0.8 }}>
          Your presence is the greatest gift to us. However, if you wish to honor us with a present,
          a contribution toward our future would be sincerely appreciated.
        </p>
      </FadeUp>
    </div>
  );
}

// ─── RSVP Modal ───────────────────────────────────────────────────────────────
function RSVPModal({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [food, setFood] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!name.trim() || attending === null) return;
    setSubmitting(true);
    const { error } = await supabase.from("rsvp").insert({
      event_id: eventId,
      name: name.trim(),
      guests: attending ? 1 : 0,
      message: food.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error("Алдаа гарлаа. Дахин оролдоно уу."); return; }
    setDone(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 5000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            background: CREAM,
            borderRadius: 12,
            padding: "36px 32px",
            maxWidth: 420, width: "100%",
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 12, right: 16,
              background: "none", border: "none",
              fontSize: 22, cursor: "pointer", color: INK, lineHeight: 1,
            }}
          >×</button>

          {done ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ ...playfairI, fontSize: 28, color: BURGUNDY, marginBottom: 12 }}>
                Thank you!
              </div>
              <p style={{ ...ovo, color: INK }}>
                We look forward to celebrating with you.
              </p>
            </div>
          ) : (
            <>
              <div style={{ ...playfair, fontSize: 22, color: INK, textAlign: "center", marginBottom: 6 }}>
                Confirm Your Attendance
              </div>
              <p style={{ ...ovo, fontSize: 14, color: INK, opacity: 0.65, textAlign: "center", marginBottom: 24 }}>
                Please RSVP before the wedding date
              </p>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={{
                  width: "100%", padding: "11px 14px",
                  border: `1px solid rgba(102,2,31,0.25)`,
                  borderRadius: 6, marginBottom: 18,
                  ...ovo, fontSize: 15, color: INK,
                  background: "white", boxSizing: "border-box",
                  outline: "none",
                }}
              />

              <p style={{ ...ovo, fontSize: 14, color: INK, marginBottom: 10 }}>Will you come?</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                {[
                  { val: true,  label: "Yes, I will" },
                  { val: false, label: "Unfortunately, I can't :(" },
                ].map(({ val, label }) => (
                  <label key={String(val)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", ...ovo, fontSize: 15, color: INK }}>
                    <input
                      type="radio"
                      name="attending"
                      checked={attending === val}
                      onChange={() => setAttending(val)}
                      style={{ accentColor: BURGUNDY, width: 16, height: 16 }}
                    />
                    {label}
                  </label>
                ))}
              </div>

              <input
                value={food}
                onChange={(e) => setFood(e.target.value)}
                placeholder="Do you have any food intolerances?"
                style={{
                  width: "100%", padding: "11px 14px",
                  border: `1px solid rgba(102,2,31,0.25)`,
                  borderRadius: 6, marginBottom: 24,
                  ...ovo, fontSize: 15, color: INK,
                  background: "white", boxSizing: "border-box",
                  outline: "none",
                }}
              />

              <button
                onClick={submit}
                disabled={submitting || !name.trim() || attending === null}
                style={{
                  width: "100%", padding: "13px",
                  background: BURGUNDY, color: "white",
                  border: "none", borderRadius: 8,
                  ...ovo, fontSize: 16, fontWeight: 600,
                  cursor: submitting ? "wait" : "pointer",
                  opacity: (!name.trim() || attending === null) ? 0.5 : 1,
                }}
              >
                {submitting ? "Sending…" : "Submit"}
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── RSVP Section ─────────────────────────────────────────────────────────────
function T13RSVP({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ background: BURGUNDY, padding: "60px 32px", textAlign: "center" }}>
      <FadeUp>
        <div style={{ ...playfairI, fontSize: 34, color: CREAM, marginBottom: 16 }}>
          Confirm Your Attendance
        </div>
        <p style={{ ...ovo, fontSize: 18, color: "rgba(255,250,248,0.85)", marginBottom: 36, maxWidth: 380, margin: "0 auto 36px" }}>
          To help us prepare for a joyful celebration, kindly confirm your attendance.
        </p>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}
          onClick={() => setOpen(true)}
          style={{
            background: CREAM, color: BURGUNDY,
            border: "none", borderRadius: 30,
            padding: "13px 52px",
            ...ovo, fontSize: 20, fontWeight: 700,
            cursor: "pointer",
          }}
        >
          RSVP
        </motion.button>
      </FadeUp>

      {open && <RSVPModal eventId={eventId} onClose={() => setOpen(false)} />}
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function T13Footer({ event }: { event: EventData }) {
  const name1 = event.person1_name || "Viktor";
  const name2 = event.person2_name || "Paula";

  return (
    <div style={{ background: BURGUNDY, padding: "56px 32px 80px", textAlign: "center" }}>
      <WavyTop fill={BURGUNDY} />
      {event.gallery_photos?.[0] && (
        <FadeUp>
          <img
            src={event.gallery_photos[0]}
            alt="couple"
            style={{
              width: 200, height: 260,
              objectFit: "cover",
              borderRadius: 8,
              display: "block", margin: "0 auto 32px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
              border: "4px solid rgba(255,250,248,0.25)",
            }}
          />
        </FadeUp>
      )}
      <FadeUp delay={0.15}>
        <div style={{ ...playfairI, fontSize: 36, color: CREAM, marginBottom: 12 }}>
          Hope to see you there!
        </div>
        <div style={{ ...playfair, fontSize: 22, color: CREAM, opacity: 0.85 }}>
          {name1} and {name2}
        </div>
      </FadeUp>

      {/* Peony decoration bottom */}
      <div style={{ marginTop: 40, opacity: 0.3 }}>
        <PeonySVG size={90} color="#E8A0BF" />
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Template13({ event }: { event: EventData }) {
  const [envelopeDone, setEnvelopeDone] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setEnvelopeDone(true), 5000);
    return () => clearTimeout(id);
  }, []);

  return (
    <div style={{ maxWidth: 523, margin: "0 auto", fontFamily: "'Ovo', serif", overflowX: "hidden" }}>
      <EnvelopeOverlay onOpen={() => setEnvelopeDone(true)} />

      <AnimatePresence>
        {envelopeDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <T13Hero event={event} />
            <T13Letter />
            <T13Countdown event={event} />
            <T13Schedule />
            <T13Location event={event} />
            <T13DressCode />
            <T13Details event={event} />
            <T13RSVP eventId={event.id} />
            <T13Footer event={event} />
          </motion.div>
        )}
      </AnimatePresence>

      <MusicPlayer />
      <Toaster />
    </div>
  );
}
