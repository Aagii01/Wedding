import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { EventData } from "../../types/event";

// ─── palette ─────────────────────────────────────────────────────────────────
const BURGUNDY       = "#66021F";
const CREAM          = "#FFFAF8";
const INK            = "#3A3A3A";
const ENVELOPE_BG    = "#E8E3DC";
const NAVY_ENVELOPE  = "#0f1b35";
const NAVY_TOP_FLAP  = "#162240";
const NAVY_SIDE_FLAP = "#0d1a32";
const SHELL_SEAL_PHOTO = ""; // Pearl/shell зургийн URL эндээ оруулна

// ─── font helpers ─────────────────────────────────────────────────────────────
const playfair  = { fontFamily: "'Playfair Display', serif" } as const;
const playfairI = { fontFamily: "'Playfair Display', serif", fontStyle: "italic" } as const;
const ovo       = { fontFamily: "'Ovo', serif" } as const;

function Amp({ size }: { size?: number }) {
  return (
    <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: size }}>
      &amp;
    </span>
  );
}

function NavyWaxSeal({ size = 200 }: { size?: number }) {
  const S = "rgba(188,212,238,0.90)";  // silver botanical color
  const SD = "rgba(165,192,220,0.75)"; // slightly darker silver
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 8px 28px rgba(0,0,0,0.70))", display: "block" }}>
      <defs>
        <radialGradient id="waxBg" cx="36%" cy="30%" r="72%">
          <stop offset="0%"   stopColor="#1e3565"/>
          <stop offset="45%"  stopColor="#0e2248"/>
          <stop offset="100%" stopColor="#071530"/>
        </radialGradient>
        <radialGradient id="waxRim" cx="36%" cy="30%" r="72%">
          <stop offset="0%"   stopColor="#25407a"/>
          <stop offset="55%"  stopColor="#152d60"/>
          <stop offset="100%" stopColor="#0a1c44"/>
        </radialGradient>
        <filter id="waxEdge" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="turbulence" baseFrequency="0.038" numOctaves="4" seed="5" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5"
            xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>

      {/* Outer wax ring — bumpy melted-wax edge */}
      <circle cx="100" cy="100" r="91" fill="url(#waxRim)" filter="url(#waxEdge)"/>

      {/* Inner face */}
      <circle cx="100" cy="100" r="77" fill="url(#waxBg)"/>

      {/* Inner rim */}
      <circle cx="100" cy="100" r="77" fill="none"
        stroke="rgba(180,205,238,0.22)" strokeWidth="1.2"/>

      {/* ── Botanical embossing ─────────────────────────── */}

      {/* Main center-left large flower — 5 petals */}
      {([0,1,2,3,4] as number[]).map(i => {
        const a = (i * 72 - 90) * Math.PI / 180;
        const pr = 12;
        const px = 87 + pr * Math.cos(a);
        const py = 113 + pr * Math.sin(a);
        return (
          <ellipse key={i} cx={px} cy={py} rx={7} ry={14}
            fill={S} transform={`rotate(${i * 72 - 90}, ${px}, ${py})`}/>
        );
      })}
      <circle cx="87" cy="113" r="5.5" fill="rgba(210,230,248,0.95)"/>
      <circle cx="87" cy="113" r="2.5" fill="rgba(145,175,215,0.85)"/>

      {/* Small top flower — 4 petals */}
      {([0,1,2,3] as number[]).map(i => {
        const a = (i * 90 - 45) * Math.PI / 180;
        const pr = 8;
        const px = 112 + pr * Math.cos(a);
        const py = 70 + pr * Math.sin(a);
        return (
          <ellipse key={i} cx={px} cy={py} rx={5} ry={9}
            fill={S} transform={`rotate(${i * 90 - 45}, ${px}, ${py})`}/>
        );
      })}
      <circle cx="112" cy="70" r="3.5" fill="rgba(210,230,248,0.92)"/>

      {/* Main stem */}
      <path d="M87 143 C86 132,88 120,87 104 C87 88,96 78,112 70"
        stroke={SD} strokeWidth="1.6" strokeLinecap="round" fill="none"/>

      {/* Side branch stems */}
      <path d="M87 118 C77 113,65 117,57 112"
        stroke={SD} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M88 105 C98 100,114 104,122 100"
        stroke={SD} strokeWidth="1.2" strokeLinecap="round" fill="none"/>

      {/* Leaves */}
      <ellipse cx="72" cy="107" rx="13" ry="5"
        fill={SD} transform="rotate(-28, 72, 107)"/>
      <ellipse cx="104" cy="98" rx="12" ry="4.5"
        fill={SD} transform="rotate(22, 104, 98)"/>

      {/* Long grass blades at bottom */}
      <ellipse cx="83" cy="140" rx="3.5" ry="18"
        fill={SD} transform="rotate(-8, 83, 140)"/>
      <ellipse cx="92" cy="142" rx="3" ry="16"
        fill={SD} transform="rotate(6, 92, 142)"/>
      <ellipse cx="100" cy="141" rx="2.5" ry="14"
        fill={SD} transform="rotate(14, 100, 141)"/>

      {/* Baby's breath — left cluster */}
      {([[58,82],[63,75],[54,89],[69,80],[56,95]] as [number,number][]).map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={2.8} fill={S}/>
      ))}
      <path d="M74 104 C68 96,61 90,58 82" stroke={SD} strokeWidth="0.9" strokeLinecap="round" fill="none"/>
      <path d="M74 104 C69 94,65 84,63 75" stroke={SD} strokeWidth="0.9" strokeLinecap="round" fill="none"/>
      <path d="M74 104 C66 99,57 93,54 89" stroke={SD} strokeWidth="0.9" strokeLinecap="round" fill="none"/>
      <path d="M74 104 C70 93,71 86,69 80" stroke={SD} strokeWidth="0.9" strokeLinecap="round" fill="none"/>
      <path d="M74 104 C65 101,59 97,56 95" stroke={SD} strokeWidth="0.9" strokeLinecap="round" fill="none"/>

      {/* Baby's breath — right cluster */}
      {([[130,80],[138,87],[132,94],[142,78]] as [number,number][]).map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={2.8} fill={S}/>
      ))}
      <path d="M122 105 C130 96,132 87,130 80" stroke={SD} strokeWidth="0.9" strokeLinecap="round" fill="none"/>
      <path d="M122 105 C130 97,136 91,138 87" stroke={SD} strokeWidth="0.9" strokeLinecap="round" fill="none"/>
      <path d="M122 105 C128 97,132 97,132 94" stroke={SD} strokeWidth="0.9" strokeLinecap="round" fill="none"/>

      {/* Small buds on right stem */}
      <ellipse cx="120" cy="110" rx="3.5" ry="6.5"
        fill={S} transform="rotate(10, 120, 110)"/>
      <ellipse cx="117" cy="123" rx="3" ry="6"
        fill={S} transform="rotate(18, 117, 123)"/>

      {/* Bottom right small bud cluster */}
      <circle cx="127" cy="128" r="4" fill={S}/>
      <circle cx="121" cy="135" r="3" fill={S}/>
      <circle cx="133" cy="134" r={2.5} fill={S}/>
    </svg>
  );
}

// ─── Gallery quotes & fallbacks ───────────────────────────────────────────────
const QUOTES = [
  '"Чамайг хайрлах нь нарны туяа шиг — нуугдсан ч дулааныг нь мэднэ."',
  '"Хоёр зүрх нэгдэхэд дэлхий бүхэл бүтэн болно."',
  '"Хайрын утас зайн холоор тасардаггүй."',
  '"Чиний инээмсэглэл бол миний өдрийн хамгийн сайхан мөч."',
  '"Хайрласан хүнтэйгээ байхад цаг яарамгай өнгөрнө."',
  '"Нүдний цэнхэр тэнгэрт чиний дүр харагдана."',
  '"Хоёр хүний хайр бол хаврын анхны цэцэг шиг эмзэг ч хүчтэй."',
  '"Чамтай байх агшин бүр зүрхэнд мөнхөд үлдэнэ."',
];
const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800",
  "https://images.unsplash.com/photo-1529636798458-92182e662485?w=800",
  "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800",
  "https://images.unsplash.com/photo-1761211488173-a7154314420a?w=800",
];

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
      <circle cx="60" cy="60" r="12" fill="#F5C2D4" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <ellipse key={i} cx="60" cy="60" rx="10" ry="22" fill={color} opacity="0.85"
          transform={`rotate(${deg} 60 60) translate(0 -20)`} />
      ))}
      {[22,67,112,157,202,247,292,337].map((deg, i) => (
        <ellipse key={i} cx="60" cy="60" rx="8" ry="18" fill={color} opacity="0.6"
          transform={`rotate(${deg} 60 60) translate(0 -26)`} />
      ))}
      {[0,60,120,180,240,300].map((deg, i) => (
        <circle key={i}
          cx={60 + 8 * Math.cos((deg * Math.PI) / 180)}
          cy={60 + 8 * Math.sin((deg * Math.PI) / 180)}
          r="2" fill="#F9E0AC" />
      ))}
    </svg>
  );
}

// ─── Wax seal SVG ─────────────────────────────────────────────────────────────
function WaxSeal({ i1 = "V", i2 = "P" }: { i1?: string; i2?: string }) {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" fill={BURGUNDY} />
      <circle cx="60" cy="60" r="50" fill="none" stroke="#C8A08A" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="42" fill="none" stroke="#C8A08A" strokeWidth="0.8" strokeDasharray="4 3" />
      <text x="60" y="55" textAnchor="middle" fill="#F5E6D8" fontSize="18"
        fontFamily="Playfair Display, serif" fontStyle="italic">{i1}</text>
      <text x="60" y="70" textAnchor="middle" fill="#F5E6D8" fontSize="11"
        fontFamily="Georgia, serif">&amp;</text>
      <text x="60" y="84" textAnchor="middle" fill="#F5E6D8" fontSize="18"
        fontFamily="Playfair Display, serif" fontStyle="italic">{i2}</text>
    </svg>
  );
}

// ─── Envelope ─────────────────────────────────────────────────────────────────
type EnvPhase = "idle" | "opening" | "flying" | "done";

function EnvelopeOverlay({ onOpen, event, audioRef }: {
  onOpen: () => void; event: EventData;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const [phase, setPhase] = useState<EnvPhase>("idle");

  const handleClick = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("opening");
    audioRef.current?.play().catch(() => {});
    setTimeout(() => setPhase("flying"), 3200);
    setTimeout(() => { setPhase("done"); onOpen(); }, 4400);
  }, [phase, onOpen, audioRef]);

  if (phase === "done") return null;
  const isOpen   = phase !== "idle";
  const isFlying = phase === "flying";

  return (
    <motion.div
      onClick={phase === "idle" ? handleClick : undefined}
      animate={isFlying ? { y: "110vh" } : { y: 0 }}
      transition={{ duration: 1.0, ease: [0.4, 0, 0.6, 1], delay: isFlying ? 0.2 : 0 }}
      style={{
        position: "fixed", inset: 0,
        background: NAVY_ENVELOPE,
        zIndex: 9999,
        cursor: phase === "idle" ? "pointer" : "default",
        overflow: "hidden",
      }}
    >
      {/* Subtle fabric texture overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)",
        backgroundSize: "5px 5px",
        pointerEvents: "none",
      }} />

      {/* Bottom flap */}
      <div style={{
        position: "absolute", inset: 0,
        background: NAVY_TOP_FLAP,
        clipPath: "polygon(0 100%, 50% 52%, 100% 100%)",
        pointerEvents: "none",
      }} />

      {/* Left flap */}
      <div style={{
        position: "absolute", inset: 0,
        background: NAVY_SIDE_FLAP,
        clipPath: "polygon(0 0, 50% 52%, 0 100%)",
        pointerEvents: "none",
      }} />

      {/* Right flap */}
      <div style={{
        position: "absolute", inset: 0,
        background: NAVY_SIDE_FLAP,
        clipPath: "polygon(100% 0, 50% 52%, 100% 100%)",
        pointerEvents: "none",
      }} />

      {/* Hero image peek — top flap-н доор, нэгдэх үед харагдана */}
      {event.main_image && (
        <motion.div
          style={{
            position: "absolute", inset: 0,
            clipPath: "polygon(0 0, 100% 0, 50% 52%)",
            overflow: "hidden",
            pointerEvents: "none",
          }}
          initial={{ opacity: 0 }}
          animate={isOpen ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.4, delay: isOpen ? 0.4 : 0 }}
        >
          <img src={event.main_image} alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(8,18,40,0.45)" }} />
        </motion.div>
      )}

      {/* Top flap — дарахад дээш хэв нэмэгдэж нэгдэнэ */}
      <motion.div
        style={{
          position: "absolute", inset: 0,
          background: NAVY_TOP_FLAP,
          clipPath: "polygon(0 0, 100% 0, 50% 52%)",
          transformOrigin: "top center",
          pointerEvents: "none",
        }}
        animate={isOpen ? { scaleY: 0 } : { scaleY: 1 }}
        transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      />

      {/* Fold seam lines — corner-аас center рүү */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <line x1="0"   y1="0"   x2="50" y2="52" stroke="rgba(190,210,240,0.18)" strokeWidth="0.25"/>
        <line x1="100" y1="0"   x2="50" y2="52" stroke="rgba(190,210,240,0.18)" strokeWidth="0.25"/>
        <line x1="0"   y1="100" x2="50" y2="52" stroke="rgba(190,210,240,0.13)" strokeWidth="0.25"/>
        <line x1="100" y1="100" x2="50" y2="52" stroke="rgba(190,210,240,0.13)" strokeWidth="0.25"/>
      </svg>

      {/* Shell / pearl wax seal — fold intersection дээр */}
      <motion.div
        style={{
          position: "absolute",
          top: "52%", left: "50%",
          marginLeft: -100, marginTop: -100,
          pointerEvents: "none",
        }}
        animate={
          isOpen
            ? { scale: 0, opacity: 0 }
            : { scale: [1, 1.04, 1], opacity: 1 }
        }
        transition={
          isOpen
            ? { duration: 0.35 }
            : { repeat: Infinity, duration: 2.8, ease: "easeInOut" }
        }
      >
        {SHELL_SEAL_PHOTO ? (
          <img
            src={SHELL_SEAL_PHOTO}
            alt="seal"
            style={{ width: 200, height: 200, objectFit: "cover", borderRadius: "50%" }}
          />
        ) : (
          <NavyWaxSeal size={200} />
        )}
      </motion.div>

      {/* "Дарж нээх" hint */}
      <motion.div
        animate={
          phase === "idle"
            ? { y: [0, -6, 0], opacity: 1 }
            : { opacity: 0 }
        }
        transition={
          phase === "idle"
            ? { repeat: Infinity, duration: 1.8, ease: "easeInOut" }
            : { duration: 0.2 }
        }
        style={{
          position: "absolute",
          bottom: "8%",
          left: 0, right: 0,
          color: "rgba(210,225,245,0.45)",
          ...playfairI,
          fontSize: 14,
          letterSpacing: "0.14em",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}
      >
        <span>↓</span> Дарж нээх <span>↓</span>
      </motion.div>
    </motion.div>
  );
}

// ─── Music player ─────────────────────────────────────────────────────────────
function MusicPlayer({ src, audioRef }: { src?: string; audioRef: React.RefObject<HTMLAudioElement | null> }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay  = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("play",  onPlay);
    a.addEventListener("pause", onPause);
    return () => { a.removeEventListener("play", onPlay); a.removeEventListener("pause", onPause); };
  }, [audioRef]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000 }}>
      <audio ref={audioRef} loop src={src ?? ""} preload="auto" />
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
  const name1 = event.person1_name || "Болд";
  const name2 = event.person2_name || "Сарнай";

  const fmtDate = (d: string) => {
    const parts = d.split("-");
    if (parts.length === 3) return `${parts[0]} · ${parts[1]} · ${parts[2]}`;
    return d;
  };

  return (
    <div style={{
      minHeight: "100svh",
      background: "#1a0812",
      position: "relative",
      overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {event.main_image && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${event.main_image})`,
          backgroundSize: "cover", backgroundPosition: "center",
        }} />
      )}
      {/* Subtle gradient so white text stays readable */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.65) 100%)",
        zIndex: 0,
      }} />

      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.55, scale: 1 }}
        transition={{ duration: 2, delay: 4, ease: "easeOut" }}
        style={{ position: "absolute", top: -20, left: -20, zIndex: 1 }}>
        <PeonySVG size={160} color="#F5C8DC" />
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.55, scale: 1 }}
        transition={{ duration: 2.5, delay: 4.2, ease: "easeOut" }}
        style={{ position: "absolute", top: 40, right: -30, zIndex: 1 }}>
        <PeonySVG size={140} color="#F8D0E0" />
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.5, scale: 1 }}
        transition={{ duration: 2.7, delay: 4.4, ease: "easeOut" }}
        style={{ position: "absolute", bottom: 20, left: 10, zIndex: 1 }}>
        <PeonySVG size={120} color="#F0C0D4" />
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.55, scale: 1 }}
        transition={{ duration: 2.3, delay: 4.6, ease: "easeOut" }}
        style={{ position: "absolute", bottom: -10, right: 0, zIndex: 1 }}>
        <PeonySVG size={150} color="#F5C8DA" />
      </motion.div>

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 24px" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 4, ease: "easeOut" }}
          style={{ color: "white", ...playfairI, fontSize: 36, marginBottom: 8 }}>
          Хурим
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 4.15, ease: "easeOut" }}
          style={{ color: "white", ...ovo, fontSize: 16, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 28, opacity: 0.85 }}>
          {fmtDate(event.date)}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 4.3, ease: "easeOut" }}
          style={{ color: "white", ...playfairI, fontSize: 76, lineHeight: 1, marginBottom: 0 }}>
          {name1}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 4.45, ease: "easeOut" }}
          style={{ color: "white", ...playfairI, fontSize: 44, lineHeight: 1.2 }}>
          <Amp size={44} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 4.6, ease: "easeOut" }}
          style={{ color: "white", ...playfairI, fontSize: 76, lineHeight: 1 }}>
          {name2}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Gallery card ─────────────────────────────────────────────────────────────
function GalleryCard({ src, quote, size }: {
  src: string; quote: string; size: "large" | "small" | "tiny";
}) {
  const dims = {
    large: { width: 260, height: 420 },
    small: { width: 148, height: 260 },
    tiny:  { width: 100, height: 195 },
  }[size];

  return (
    <div style={{
      width: dims.width, height: dims.height,
      borderRadius: 18,
      overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
      border: `3px solid rgba(102,2,31,0.35)`,
      position: "relative",
      flexShrink: 0,
    }}>
      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: size === "large" ? "14px 12px" : "8px 8px",
        background: "linear-gradient(to top, rgba(0,0,0,0.72), transparent)",
      }}>
        <p style={{
          ...playfairI,
          fontSize: size === "large" ? 11 : 9,
          color: "white", lineHeight: 1.55, margin: 0,
        }}>
          {quote}
        </p>
      </div>
    </div>
  );
}

// ─── Gallery carousel ─────────────────────────────────────────────────────────
function T13Gallery({ event }: { event: EventData }) {
  const [current, setCurrent] = useState(0);

  const slides = QUOTES.map((quote, i) => ({
    src: event.gallery2_photos?.[i] || FALLBACK_PHOTOS[i],
    quote,
  }));

  const prev  = (current - 1 + slides.length) % slides.length;
  const prev2 = (current - 2 + slides.length) % slides.length;
  const next  = (current + 1) % slides.length;
  const next2 = (current + 2) % slides.length;

  return (
    <div style={{ background: CREAM, paddingTop: 60, paddingBottom: 44, overflow: "hidden" }}>
      <FadeUp>
        <div style={{ textAlign: "center", marginBottom: 44, padding: "0 24px" }}>
          <div style={{ ...playfairI, fontSize: 32, color: INK, marginBottom: 10 }}>
            Бидний хайрын түүх
          </div>
          {event.person2_name && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ ...playfair, fontSize: 15, color: INK }}>{event.person1_name}</span>
              <span style={{ color: "#F87171", fontSize: 14 }}>♥</span>
              <span style={{ ...playfair, fontSize: 15, color: INK }}>{event.person2_name}</span>
            </div>
          )}
        </div>
      </FadeUp>

      {/* 5-card fan carousel */}
      <motion.div
        style={{
          position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          height: 460,
          cursor: "grab",
          touchAction: "none",
          userSelect: "none",
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60 || info.velocity.x < -400) setCurrent(next);
          else if (info.offset.x > 60 || info.velocity.x > 400) setCurrent(prev);
        }}
      >
        {/* Far left */}
        <div style={{ position: "absolute", transform: "translateX(-340px) scale(0.62)", opacity: 0.3, zIndex: 0, pointerEvents: "none" }}>
          <GalleryCard src={slides[prev2].src} quote={slides[prev2].quote} size="tiny" />
        </div>
        {/* Left */}
        <div style={{ position: "absolute", transform: "translateX(-210px) scale(0.82)", opacity: 0.65, zIndex: 1, pointerEvents: "none" }}>
          <GalleryCard src={slides[prev].src} quote={slides[prev].quote} size="small" />
        </div>
        {/* Center */}
        <div style={{ position: "absolute", zIndex: 10, pointerEvents: "none" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <GalleryCard src={slides[current].src} quote={slides[current].quote} size="large" />
            </motion.div>
          </AnimatePresence>
        </div>
        {/* Right */}
        <div style={{ position: "absolute", transform: "translateX(210px) scale(0.82)", opacity: 0.65, zIndex: 1, pointerEvents: "none" }}>
          <GalleryCard src={slides[next].src} quote={slides[next].quote} size="small" />
        </div>
        {/* Far right */}
        <div style={{ position: "absolute", transform: "translateX(340px) scale(0.62)", opacity: 0.3, zIndex: 0, pointerEvents: "none" }}>
          <GalleryCard src={slides[next2].src} quote={slides[next2].quote} size="tiny" />
        </div>
      </motion.div>

      {/* Dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28 }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              height: 8, borderRadius: 4, border: "none", cursor: "pointer",
              background: i === current ? BURGUNDY : "rgba(102,2,31,0.22)",
              width: i === current ? 24 : 8,
              transition: "all 0.4s",
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Letter ───────────────────────────────────────────────────────────────────
function T13Letter({ event }: { event: EventData }) {
  const name1 = event.person1_name || "Болд";
  const name2 = event.person2_name || "Сарнай";
  return (
    <div style={{ background: BURGUNDY }}>
      <WavyTop fill={CREAM} />
      <div style={{ background: BURGUNDY, padding: "48px 32px 56px", textAlign: "center" }}>
        <FadeUp>
          <div style={{ color: "white", ...playfairI, fontSize: 28, marginBottom: 20 }}>
            Хайрт найзууд болон гэр бүлийнхэн,
          </div>
          <p style={{ color: "rgba(255,255,255,0.88)", ...ovo, fontSize: 17, lineHeight: 1.85, maxWidth: 420, margin: "0 auto" }}>
            Бид хоёрын хамгийн тусгай өдөр болох хуримдаа та бүхнийг урьж байна.
            Та нарын дэмжлэг, хайр бидэнд дэлхийн хамгийн үнэтэй зүйл юм.
            {name1} ба {name2} нарын шинэ амьдралын эхлэлийг хамт тэмдэглэе.
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
    { val: time.days,    label: "Өдөр" },
    { val: time.hours,   label: "Цаг" },
    { val: time.minutes, label: "Минут" },
    { val: time.seconds, label: "Секунд" },
  ];

  return (
    <div style={{ background: CREAM, padding: "56px 24px", textAlign: "center" }}>
      <FadeUp>
        <div style={{ ...playfairI, fontSize: 32, color: INK, marginBottom: 10 }}>
          Хурим хүртэл
        </div>
        <div style={{ ...ovo, fontSize: 13, color: INK, opacity: 0.5, letterSpacing: "0.15em", marginBottom: 36 }}>
          ───── ✦ ─────
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {units.map((u, i) => (
            <div key={u.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ textAlign: "center", minWidth: 56 }}>
                <div style={{ ...ovo, fontSize: 44, fontWeight: 700, color: INK, lineHeight: 1 }}>
                  {pad(u.val)}
                </div>
                <div style={{ ...ovo, fontSize: 11, color: BURGUNDY, marginTop: 6, letterSpacing: "0.1em" }}>
                  {u.label}
                </div>
              </div>
              {i < 3 && (
                <div style={{ ...ovo, fontSize: 36, color: BURGUNDY, marginBottom: 18, opacity: 0.5 }}>:</div>
              )}
            </div>
          ))}
        </div>
      </FadeUp>
    </div>
  );
}

// ─── Schedule ─────────────────────────────────────────────────────────────────
function T13Schedule({ event }: { event: EventData }) {
  const time = event.time || "16:00";
  const [hh, mm] = time.split(":").map(Number);
  const fmt = (h: number, m: number) =>
    `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  const items = [
    { time: fmt(hh, mm),         label: "Зочид цугларах" },
    { time: fmt(hh + 1, mm),     label: "Дурсамж зураг татуулах" },
    { time: fmt(hh + 2, mm),     label: "Гэрлэлтийн баярын ёслол" },
        { time: fmt(hh + 3, mm),     label: "Хүндэтгэлийн зоог" },
            { time: fmt(hh + 4, mm),     label: "Ерөөл, бэлэг дэвшүүлэх" },
            { time: fmt(hh + 5, mm),     label: "Чөлөөт хөтөлбөр, диско цаг эхлэх" },

  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div style={{ background: BURGUNDY }}>
      <WavyTop fill={BURGUNDY} />
      <div style={{ background: BURGUNDY, padding: "52px 24px 60px", textAlign: "center" }}>
        <FadeUp>
          <div style={{ ...playfairI, fontSize: 34, color: CREAM, marginBottom: 44 }}>
            Цагийн хуваарь
          </div>
        </FadeUp>
        <div ref={containerRef} style={{ position: "relative", display: "inline-block", textAlign: "left" }}>
          {/* Scroll-driven vertical line — centered on diamond (70+20+5=95px) */}
          <div style={{
            position: "absolute",
            left: 94, top: 0, bottom: 0,
            width: 2,
            overflow: "hidden",
          }}>
            <motion.div style={{
              width: "100%",
              height: lineHeight,
              background: "rgba(255,255,255,0.35)",
            }} />
          </div>

          {items.map((item, i) => (
            <FadeUp key={i} delay={i * 0.15}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, position: "relative" }}>
                <div style={{ ...ovo, fontSize: 20, fontWeight: 700, color: "white", width: 70, textAlign: "right" }}>
                  {item.time}
                </div>
                <div style={{
                  width: 10, height: 10,
                  background: "white",
                  transform: "rotate(45deg)",
                  flexShrink: 0,
                  position: "relative", zIndex: 1,
                }} />
                <div style={{ ...ovo, fontSize: 18, color: CREAM }}>{item.label}</div>
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
        <div style={{ ...playfairI, fontSize: 34, color: BURGUNDY, marginBottom: 16 }}>
          Байршил
        </div>
        {event.venue_name && (
          <div style={{ ...playfairI, fontSize: 20, fontWeight: 600, color: INK, marginBottom: 8 }}>
            {event.venue_name}
          </div>
        )}
        {event.venue_address && (
          <div style={{ ...ovo, fontSize: 15, color: INK, opacity: 0.7, marginBottom: 28, lineHeight: 1.6 }}>
            {event.venue_address}
          </div>
        )}
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
            Газрын зурагт нээх
          </a>
        </FadeUp>
      )}
    </div>
  );
}

// ─── Dress Code ───────────────────────────────────────────────────────────────
function T13DressCode() {
  const icons = [
    { emoji: "🌸", label: "Хүлээн авалт" },
    { emoji: "📵", label: "Утасгүй мөч" },
    { emoji: "⏰", label: "Цаг баримтлах" },
    { emoji: "🥂", label: "Хамтдаа баярлах" },
  ];

  return (
    <div style={{ background: BURGUNDY }}>
      <WavyTop fill={BURGUNDY} />
      <div style={{ background: BURGUNDY, padding: "52px 32px 60px", textAlign: "center" }}>
        <FadeUp>
          <div style={{ ...playfairI, fontSize: 34, color: CREAM, marginBottom: 28 }}>
            Хурмын хүсэлт
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 28 }}>
            {icons.map(({ emoji, label }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: "50%",
                  background: "rgba(255,255,255,0.12)",
                  border: `2px solid ${CREAM}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                }}>
                  {emoji}
                </div>
                <span style={{ ...ovo, fontSize: 10, color: `${CREAM}aa`, letterSpacing: "0.05em" }}>{label}</span>
              </div>
            ))}
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <p style={{ ...ovo, fontSize: 17, color: CREAM, maxWidth: 360, margin: "0 auto 40px", lineHeight: 1.8 }}>
            Энэхүү онцгой мөчийг хамтдаа бүтэн зүрхээр угтан авч, дурсамж болгон үлдээе.
          </p>
        </FadeUp>

        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8, padding: "20px 14px",
              flex: 1, textAlign: "center",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <PeonySVG size={56} color="#D4B0A0" />
            </div>
            <p style={{ ...ovo, fontSize: 13, color: CREAM, lineHeight: 1.65 }}>
              <strong>Хүлээн авалт:</strong> Чөлөөт цаг эхлэтэл та бүхэн хүлээлгийн зоог барьж, дурсамж зургаа авахуулна уу.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8, padding: "20px 14px",
              flex: 1, textAlign: "center",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <PeonySVG size={56} color="#E8A0BF" />
            </div>
            <p style={{ ...ovo, fontSize: 13, color: CREAM, lineHeight: 1.65 }}>
              <strong>Цаг:</strong> Ёслол эхлэхээс 15 минутын өмнө ирж суудалдаа заларна уу.
            </p>
          </motion.div>
        </div>
      </div>
      <WavyBottom fill={CREAM} />
    </div>
  );
}

// ─── Wishes ───────────────────────────────────────────────────────────────────
function T13Wishes({ eventId }: { eventId: string }) {
  const [name, setName]       = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  const submit = async () => {
    if (!name.trim() || !message.trim()) return;
    setSending(true);
    const { error } = await supabase.from("wishes").insert({
      event_id: eventId,
      name: name.trim(),
      message: message.trim(),
    });
    setSending(false);
    if (error) { toast.error("Алдаа гарлаа. Дахин оролдоно уу."); return; }
    setSent(true);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px",
    border: `1px solid rgba(102,2,31,0.22)`,
    borderRadius: 8,
    ...ovo, fontSize: 15, color: INK,
    background: "white",
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <div style={{ background: CREAM, padding: "56px 32px 64px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -30, right: -20, opacity: 0.08, pointerEvents: "none" }}>
        <PeonySVG size={220} color={BURGUNDY} />
      </div>
      <div style={{ position: "absolute", bottom: -40, left: -20, opacity: 0.07, pointerEvents: "none" }}>
        <PeonySVG size={190} color={BURGUNDY} />
      </div>

      <FadeUp>
        <div style={{ ...playfairI, fontSize: 34, color: BURGUNDY, marginBottom: 8, textAlign: "center" }}>
          Мэндчилгээ
        </div>
        <p style={{ ...ovo, fontSize: 14, color: INK, opacity: 0.6, textAlign: "center", marginBottom: 32 }}>
          Баяр хүргэх үгээ үлдээнэ үү
        </p>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", padding: "28px 0" }}
          >
            <div style={{ ...playfairI, fontSize: 26, color: BURGUNDY, marginBottom: 10 }}>
              Баярлалаа!
            </div>
            <p style={{ ...ovo, fontSize: 15, color: INK, opacity: 0.75, lineHeight: 1.7 }}>
              Таны мэндчилгээг хүлээн авлаа.
            </p>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ ...ovo, fontSize: 13, color: INK, opacity: 0.65, display: "block", marginBottom: 6 }}>
                Нэр
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Нэрээ бичнэ үү"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ ...ovo, fontSize: 13, color: INK, opacity: 0.65, display: "block", marginBottom: 6 }}>
                Мэндчилгээний үг
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Мэндчилгээ бичнэ үү..."
                rows={5}
                style={{ ...inputStyle, resize: "none", lineHeight: 1.65 }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={submit}
              disabled={sending || !name.trim() || !message.trim()}
              style={{
                width: "100%", padding: "13px",
                background: BURGUNDY, color: "white",
                border: "none", borderRadius: 8,
                ...ovo, fontSize: 16, fontWeight: 600,
                cursor: sending ? "wait" : "pointer",
                opacity: (!name.trim() || !message.trim()) ? 0.5 : 1,
                marginTop: 4,
              }}
            >
              {sending ? "Илгээж байна..." : "Илгээх"}
            </motion.button>
          </div>
        )}
      </FadeUp>
    </div>
  );
}

// ─── RSVP Modal ───────────────────────────────────────────────────────────────
function RSVPModal({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const [name, setName]         = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [food, setFood]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);

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
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
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
                Баярлалаа!
              </div>
              <p style={{ ...ovo, color: INK, lineHeight: 1.7 }}>
                Таны бүртгэлийг хүлээн авлаа.<br />Тантай уулзахыг тэсэн ядан хүлээж байна.
              </p>
            </div>
          ) : (
            <>
              <div style={{ ...playfair, fontSize: 22, color: INK, textAlign: "center", marginBottom: 6 }}>
                Ирцээ бүртгүүлэх
              </div>
              <p style={{ ...ovo, fontSize: 14, color: INK, opacity: 0.6, textAlign: "center", marginBottom: 24 }}>
                Хурмын өдрөөс өмнө бүртгэлээ хийнэ үү
              </p>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Таны нэр"
                style={{
                  width: "100%", padding: "11px 14px",
                  border: `1px solid rgba(102,2,31,0.25)`,
                  borderRadius: 6, marginBottom: 18,
                  ...ovo, fontSize: 15, color: INK,
                  background: "white", boxSizing: "border-box",
                  outline: "none",
                }}
              />

              <p style={{ ...ovo, fontSize: 14, color: INK, marginBottom: 10 }}>Та ирэх үү?</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                {[
                  { val: true,  label: "Тийм, заавал ирнэ" },
                  { val: false, label: "Харамсалтай нь очиж чадахгүй" },
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
                placeholder="Хоолны хязгаарлалт байна уу?"
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
                {submitting ? "Илгээж байна..." : "Илгээх"}
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
          Ирцээ бүртгүүлэх
        </div>
        <p style={{ ...ovo, fontSize: 17, color: "rgba(255,250,248,0.85)", maxWidth: 380, margin: "0 auto 36px", lineHeight: 1.75 }}>
          Тантай хамт баярлахын тулд ирцийн мэдээллээ илгээнэ үү.
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
          Бүртгүүлэх
        </motion.button>
      </FadeUp>

      {open && <RSVPModal eventId={eventId} onClose={() => setOpen(false)} />}
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function T13Footer({ event }: { event: EventData }) {
  const name1 = event.person1_name || "Болд";
  const name2 = event.person2_name || "Сарнай";

  return (
    <div style={{ background: BURGUNDY, padding: "56px 32px 80px", textAlign: "center" }}>
      <WavyTop fill={BURGUNDY} />
      {event.gallery_photos?.[0] && (
        <FadeUp>
          <img
            src={event.gallery_photos[0]}
            alt="couple"
            style={{
              width: "88%", maxWidth: 380, height: 320,
              objectFit: "cover",
              borderRadius: 12,
              display: "block", margin: "0 auto 32px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
              border: "4px solid rgba(255,250,248,0.25)",
            }}
          />
        </FadeUp>
      )}
      <FadeUp delay={0.15}>
        <div style={{ ...playfairI, fontSize: 34, color: CREAM, marginBottom: 12 }}>
          Тантай уулзахыг тэсэн ядан хүлээж байна!
        </div>
        <div style={{ ...playfair, fontSize: 20, color: CREAM, opacity: 0.8 }}>
          {name1} <Amp /> {name2}
        </div>
      </FadeUp>

      <div style={{ marginTop: 40, opacity: 0.3 }}>
        <PeonySVG size={90} color="#E8A0BF" />
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Template13({ event }: { event: EventData }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <div style={{ maxWidth: 523, margin: "0 auto", fontFamily: "'Ovo', serif", overflowX: "hidden" }}>
      {/* Envelope is position:fixed — content renders behind it, revealed as envelope slides away */}
      <EnvelopeOverlay onOpen={() => {}} event={event} audioRef={audioRef} />

      <T13Hero event={event} />
      <T13Letter event={event} />
      <T13Gallery event={event} />
      <T13Countdown event={event} />
      <T13Schedule event={event} />
      <T13Location event={event} />
      <T13DressCode />
      <T13Wishes eventId={event.id} />
      <T13RSVP eventId={event.id} />
      <T13Footer event={event} />

      {event.music_url && <MusicPlayer src={event.music_url} audioRef={audioRef} />}
      <Toaster />
    </div>
  );
}
