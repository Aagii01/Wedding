import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { EventData } from "../../types/event";
import { getPoemLines, getSchedule } from "../../lib/eventContent";
import { cfg, sectionOn } from "../../lib/eventConfig";
import { normalizeUrl } from "../../lib/url";

// ─── Template 22 — "Hero" ─────────────────────────────────────────────────────
// Эрэгтэй хүүхдийн сэвлэг үргээх ёслол / төрсөн өдрийн урилга. Template21
// ("Belle")-ийн бүтцийг (intro видео → hero → урилгын үг → цомог → тоологч →
// хөтөлбөр → байршил → хүсэлт → ерөөл → ирц → footer) яг хэвээр авсан ч
// супер баатрын (Superman / Spider-Man) өнгө — улаан, хөх, шар — ба comic
// эффект (хөвөх од, аянгын цахилгаан, halftone цэг, шугаман хурдны зураас)
// бүхий тусдаа загвар.
//
// Тохиргоо: T21 шиг slug map БАЙХГҮЙ. Бүгд events.config (jsonb)-оос cfg()-ээр
// уншигдана — захиалагч бүрд код засахгүй. Түлхүүрүүд: docs/event-config.md § T22.

// ─── palette ─────────────────────────────────────────────────────────────────
const NAVY      = "#0B1A3A";   // гүн шөнийн хөх (T21-ийн DEEP-ийн оронд)
const BLUE      = "#1E4FD8";   // Superman хөх
const BLUE_DK   = "#12307F";
const RED       = "#D62828";   // нөмрөгийн улаан
const RED_DK    = "#A31621";
const YELLOW    = "#FFC53D";   // эмблемийн шар (T21-ийн GOLD-ийн үүрэг)
const YELLOW_LT = "#FFE08A";
const SKY       = "#F3F6FF";   // цайвар хэсгүүдийн дэвсгэр (T21-ийн CREAM)
const INK       = "#121C33";

// ─── font helpers ─────────────────────────────────────────────────────────────
// Russo One — кирилл дэмждэг, супер баатрын лого маягийн тод фонт (гарчиг, нэр, тоо).
// PT Sans — кирилл бүрэн, бүх энгийн бичвэрт. Хоёулаа index.html-д ачаалагдана.
const sans   = { fontFamily: "'PT Sans', 'Segoe UI', sans-serif" } as const;
const sansB  = { fontFamily: "'PT Sans', 'Segoe UI', sans-serif", fontWeight: 700 } as const;
const hero   = { fontFamily: "'Russo One', 'PT Sans', sans-serif" } as const;

// ─── Зурагны fallback ────────────────────────────────────────────────────────
const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800",
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800",
  "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800",
  "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800",
];

// Цомгийн зураг дээр гарах бяцхан ишлэлүүд
const QUOTES = [
  "Бяцхан баатар минь, чи бол бидний хамгийн том хүч.",
  "Инээмсэглэл чинь аянгаас ч хурдан гэрэлтдэг.",
  "Эхний алхам, эхний нислэг — бүгд дурсамж.",
  "Чи ирснээр манай гэр супер боллоо.",
  "Өдөр бүр чинь шинэ адал явдал.",
  "Бяцхан гарууд том мөрөөдлийг өргөдөг.",
  "Зоригтой зүрх чиний цээжинд цохилдог.",
  "Нэг нас — мянган баатарлаг дурсамж.",
];

// ─── Хөвөх од + аянгын цахилгаан (comic overlay) ─────────────────────────────
const BOLTS = [
  { id: 0, left: 8,  delay: 0,   dur: 12, size: 14, drift:  36, rot: -12 },
  { id: 1, left: 22, delay: 3,   dur: 15, size: 10, drift: -30, rot:  14 },
  { id: 2, left: 37, delay: 1.4, dur: 13, size: 16, drift:  26, rot:  -6 },
  { id: 3, left: 52, delay: 5,   dur: 16, size: 11, drift: -40, rot:  20 },
  { id: 4, left: 66, delay: 2.4, dur: 14, size: 12, drift:  32, rot: -18 },
  { id: 5, left: 80, delay: 6,   dur: 13, size: 9,  drift: -24, rot:  10 },
  { id: 6, left: 92, delay: 1.8, dur: 17, size: 15, drift:  42, rot:  -8 },
];
const BOLT_COLORS = [YELLOW, RED, YELLOW_LT, RED, YELLOW];

const STARS = [
  { id: 0, left: 10, top: 16, delay: 0,   dur: 3.2, size: 9  },
  { id: 1, left: 26, top: 64, delay: 1.1, dur: 4.0, size: 6  },
  { id: 2, left: 43, top: 28, delay: 2.0, dur: 3.6, size: 11 },
  { id: 3, left: 60, top: 76, delay: 0.6, dur: 4.4, size: 7  },
  { id: 4, left: 75, top: 22, delay: 1.7, dur: 3.0, size: 10 },
  { id: 5, left: 89, top: 57, delay: 2.6, dur: 3.8, size: 6  },
  { id: 6, left: 33, top: 90, delay: 3.1, dur: 3.4, size: 8  },
  { id: 7, left: 69, top: 10, delay: 1.4, dur: 4.2, size: 7  },
];

// Од, цахилгаан хоёулаа урилгын 523px-ийн хүрээнд л хөвнө
function ComicOverlay() {
  return (
    <>
      <style>{`
        @keyframes t22BoltFall {
          0%   { opacity: 0;    transform: translateY(-6vh) rotate(0deg) translateX(0); }
          10%  { opacity: 0.9; }
          88%  { opacity: 0.6; }
          100% { opacity: 0;    transform: translateY(106vh) rotate(40deg) translateX(var(--t22-drift)); }
        }
        @keyframes t22Twinkle {
          0%, 100% { opacity: 0;   transform: scale(0.4) rotate(0deg); }
          50%      { opacity: 1;   transform: scale(1)   rotate(72deg); }
        }
      `}</style>

      <div style={{
        position: "fixed", top: 0, bottom: 0,
        left: "50%", transform: "translateX(-50%)",
        width: "min(523px, 100%)",
        pointerEvents: "none", overflow: "hidden", zIndex: 6,
      }}>
        {BOLTS.map((b) => (
          <div
            key={"b" + b.id}
            style={{
              position: "absolute", left: b.left + "%", top: 0,
              animation: `t22BoltFall ${b.dur}s ${b.delay}s ease-in-out infinite`,
              willChange: "transform, opacity",
              ["--t22-drift" as string]: b.drift + "px",
            }}
          >
            <svg width={b.size} height={b.size * 1.6} viewBox="0 0 20 32"
              style={{ transform: `rotate(${b.rot}deg)` }}
              fill={BOLT_COLORS[b.id % BOLT_COLORS.length]}>
              <path d="M12 0 L2 18 L9 18 L6 32 L18 12 L11 12 Z" opacity="0.85" />
            </svg>
          </div>
        ))}

        {STARS.map((s) => (
          <div
            key={"s" + s.id}
            style={{
              position: "absolute", left: s.left + "%", top: s.top + "%",
              animation: `t22Twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
              willChange: "transform, opacity",
            }}
          >
            <svg width={s.size} height={s.size} viewBox="0 0 20 20" fill={YELLOW_LT}>
              <path d="M10 0 L12.4 7.6 L20 10 L12.4 12.4 L10 20 L7.6 12.4 L0 10 L7.6 7.6 Z" />
            </svg>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Баатрын эмблем (бамбай + үсэг / од) ────────────────────────────────────
// T21-ийн EnchantedRose-ийн үүрэгтэй чимэглэл. letter өгвөл дотор нь үсэг,
// үгүй бол од гарна.
function HeroEmblem({ size = 120, opacity = 1, letter = "" }: { size?: number; opacity?: number; letter?: string }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 100 110" fill="none" style={{ opacity }}>
      {/* гадна улаан бамбай */}
      <path d="M50 4 L94 22 L94 52 C94 80, 72 100, 50 108 C28 100, 6 80, 6 52 L6 22 Z" fill={RED} />
      <path d="M50 4 L94 22 L94 52 C94 80, 72 100, 50 108 C28 100, 6 80, 6 52 L6 22 Z" stroke={YELLOW} strokeWidth="3" />
      {/* дотор хөх талбар */}
      <path d="M50 16 L84 30 L84 52 C84 74, 67 90, 50 97 C33 90, 16 74, 16 52 L16 30 Z" fill={BLUE} />
      <path d="M50 16 L84 30 L84 52 C84 74, 67 90, 50 97 C33 90, 16 74, 16 52 L16 30 Z" stroke={YELLOW_LT} strokeWidth="1.5" opacity="0.8" />
      {/* гэрлийн тусгал */}
      <path d="M24 32 L50 22 L50 30 L28 38 Z" fill="#fff" opacity="0.18" />
      {letter ? (
        <text x="50" y="70" textAnchor="middle" fontFamily="'Russo One', 'PT Sans', sans-serif"
          fontSize="40" fill={YELLOW} stroke={RED_DK} strokeWidth="1.2">
          {letter}
        </text>
      ) : (
        <path d="M50 36 L56 52 L73 53 L60 63 L64 80 L50 70 L36 80 L40 63 L27 53 L44 52 Z" fill={YELLOW} stroke={RED_DK} strokeWidth="1.2" />
      )}
    </svg>
  );
}

// ─── Аянгын чимэглэлт зураас ─────────────────────────────────────────────────
function BoltDivider({ color = YELLOW, width = 220 }: { color?: string; width?: number }) {
  return (
    <svg width={width} height="20" viewBox="0 0 220 20" fill="none" style={{ display: "block", margin: "0 auto" }}>
      <path d="M6 10 H90" stroke={color} strokeWidth="1.5" opacity="0.75" />
      <path d="M130 10 H214" stroke={color} strokeWidth="1.5" opacity="0.75" />
      <path d="M113 0 L104 11 L110 11 L107 20 L116 8 L110 8 Z" fill={color} />
      <circle cx="96" cy="10" r="2.2" fill={color} opacity="0.85" />
      <circle cx="124" cy="10" r="2.2" fill={color} opacity="0.85" />
    </svg>
  );
}

// ─── Шүдлэг (comic) тусгаарлагч ──────────────────────────────────────────────
function ZigBottom({ fill = NAVY }: { fill?: string }) {
  return (
    <div style={{ lineHeight: 0, marginTop: -1 }}>
      <svg viewBox="0 0 523 40" preserveAspectRatio="none" width="100%" height="30">
        <path d="M0,40 L0,22 L44,6 L87,26 L131,8 L174,28 L218,10 L261,30 L305,10 L348,28 L392,8 L436,26 L479,6 L523,22 L523,40 Z" fill={fill} />
      </svg>
    </div>
  );
}

function ZigTop({ fill = NAVY }: { fill?: string }) {
  return (
    <div style={{ lineHeight: 0, marginBottom: -1 }}>
      <svg viewBox="0 0 523 40" preserveAspectRatio="none" width="100%" height="30">
        <path d="M0,0 L0,18 L44,34 L87,14 L131,32 L174,12 L218,30 L261,10 L305,30 L348,12 L392,32 L436,14 L479,34 L523,18 L523,0 Z" fill={fill} />
      </svg>
    </div>
  );
}

// Comic halftone цэгэн дэвсгэр — бараан хэсгүүдийн буланд бүдэгхэн.
const halftone = (color: string, size = 14): React.CSSProperties => ({
  backgroundImage: `radial-gradient(${color} 1.2px, transparent 1.4px)`,
  backgroundSize: `${size}px ${size}px`,
});

// ─── Scroll reveal ───────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, style = {} }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 1.2, delay, ease: "easeOut" }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Дугтуй нээгдэх видео intro ──────────────────────────────────────────────
const T22_INTRO_VIDEO_URL =
  "https://premiumelegante.thedigitalyes.com/assets/intro-video-new-XmwQeafK.mp4";

// Hero-гийн бичвэрүүд видео дуусаж бүдгэрэх үед сая гарч ирнэ
const INTRO_DELAY = 3.9;

function VideoIntro({ src, audioRef }: {
  src: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  const handleEnded = () => {
    if (exiting) return;
    audioRef.current?.play().catch(() => {});
    setExiting(true);
    setTimeout(() => setVisible(false), 1600);
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: "fixed", inset: 0, background: "#000",
        zIndex: 9999, overflow: "hidden",
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleEnded}
        onError={handleEnded}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    </motion.div>
  );
}

// ─── Music player ────────────────────────────────────────────────────────────
function MusicPlayer({ src, audioRef }: { src?: string; audioRef: React.RefObject<HTMLAudioElement | null> }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay  = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("play", onPlay);
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
        aria-label="Дуу"
        style={{
          width: 54, height: 54, borderRadius: "50%",
          background: `linear-gradient(140deg, ${RED}, ${RED_DK})`,
          border: `2px solid ${YELLOW}`, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 18px rgba(214,40,40,0.45)",
        }}
      >
        {playing ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill={YELLOW_LT}>
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill={YELLOW_LT}>
            <polygon points="6,3 20,12 6,21" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ─── Нэрийн туслахууд ────────────────────────────────────────────────────────
// "Э.ГэрэгэЗэмдэнэ" → "ГэрэгэЗэмдэнэ" (овгийн үсгийг хасна)
function givenName(full: string) {
  return (full || "").replace(/^[А-ЯЁӨҮA-Z]\.\s*/u, "").trim();
}
// Эмблем дээрх үсэг: нэрийн эхний үсэг
function initialOf(full: string) {
  const g = givenName(full);
  return g ? g[0].toUpperCase() : "";
}

// ─── Hero ────────────────────────────────────────────────────────────────────
function fmtHeroDate(d: string) {
  const parts = (d || "").split("-");
  if (parts.length === 3) return parts[0] + " · " + parts[1] + " · " + parts[2];
  return d;
}

function T22Hero({ event }: { event: EventData }) {
  const name    = cfg(event.config, "hero.name", event.person1_name || "Бяцхан баатар");
  const age     = cfg<string | number | null>(event.config, "hero.age", null);
  const eyebrow = cfg(event.config, "hero.eyebrow", "Сэвлэг үргээх ёслолын урилга");
  const emblem  = cfg(event.config, "hero.emblem", initialOf(name));

  // Russo One өргөн фонт тул T21-ээс арай жижиг хэмжээ
  const nameSize =
    name.length <= 8  ? "clamp(38px, 12vw, 66px)" :
    name.length <= 12 ? "clamp(30px, 9vw, 54px)" :
    name.length <= 16 ? "clamp(24px, 7vw, 42px)" :
                        "clamp(20px, 5.6vw, 34px)";

  return (
    <div style={{
      minHeight: "100svh", background: NAVY,
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
    }}>
      {event.main_image && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${event.main_image})`,
          backgroundSize: "cover", backgroundPosition: "center",
        }} />
      )}

      {/* Дээрээс хөх, доороос улаан-навy туяа + бичвэр уншигдах бараан налуу */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        background: "radial-gradient(120% 70% at 50% 18%, rgba(30,79,216,0.28) 0%, rgba(0,0,0,0) 55%)",
      }} />
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        background: "linear-gradient(to bottom, rgba(11,26,58,0.35) 0%, rgba(11,26,58,0.08) 38%, rgba(11,26,58,0.76) 78%, rgba(11,26,58,0.94) 100%)",
      }} />
      {/* comic halftone — доод буланд */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: "34%", zIndex: 0,
        ...halftone("rgba(255,197,61,0.18)", 12),
        maskImage: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
        WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
      }} />

      {/* Улаан-шар давхар хүрээ */}
      <div style={{
        position: "absolute", inset: 14, zIndex: 1,
        border: `2px solid ${RED}`, opacity: 0.7, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", inset: 20, zIndex: 1,
        border: `1px solid ${YELLOW}`, opacity: 0.45, pointerEvents: "none",
      }} />

      {/* Эмблем — дээд төвд */}
      <motion.div initial={{ opacity: 0, y: -16, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, delay: INTRO_DELAY + 0.1, ease: "easeOut" }}
        style={{ position: "absolute", top: 40, left: 0, right: 0, zIndex: 2, display: "flex", justifyContent: "center" }}>
        <div style={{ filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.5))" }}>
          <HeroEmblem size={74} letter={emblem} />
        </div>
      </motion.div>

      <div style={{
        position: "relative", zIndex: 2, textAlign: "center",
        padding: "0 26px 14vh", maxWidth: "100%", boxSizing: "border-box",
      }}>
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: INTRO_DELAY + 0.25, ease: "easeOut" }}
          style={{ ...sansB, color: YELLOW, fontSize: 12, letterSpacing: "0.36em", textTransform: "uppercase", marginBottom: 16 }}>
          {eyebrow}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.3, delay: INTRO_DELAY + 0.45, ease: "easeOut" }}
          style={{
            ...hero, color: "#fff", fontSize: nameSize, lineHeight: 1.08, textTransform: "uppercase",
            letterSpacing: "0.02em",
            textShadow: `3px 3px 0 ${RED}, 0 8px 26px rgba(0,0,0,0.6)`,
            maxWidth: "100%", overflowWrap: "break-word", wordBreak: "break-word",
          }}>
          {name}
        </motion.div>

        {age !== null && age !== "" && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: INTRO_DELAY + 0.75, ease: "easeOut" }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              marginTop: 20, padding: "8px 22px",
              border: `2px solid ${YELLOW}`, borderRadius: 999,
              background: "rgba(30,79,216,0.55)",
              backdropFilter: "blur(2px)",
              boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
            }}>
            <span style={{ ...hero, color: YELLOW, fontSize: 28, lineHeight: 1 }}>{String(age)}</span>
            <span style={{ ...sansB, color: "#fff", fontSize: 14, letterSpacing: "0.22em" }}>НАС</span>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: INTRO_DELAY + 1.0, ease: "easeOut" }}
          style={{ marginTop: 24 }}>
          <BoltDivider color={YELLOW} width={200} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: INTRO_DELAY + 1.15, ease: "easeOut" }}
          style={{ ...sansB, color: "rgba(255,255,255,0.92)", fontSize: 15, letterSpacing: "0.2em", marginTop: 16 }}>
          {fmtHeroDate(event.date)}
          {event.time ? " · " + event.time : ""}
        </motion.div>
      </div>

      {/* Доош гүйлгэхийг сануулах */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 0.85 }}
        transition={{ duration: 1.2, delay: INTRO_DELAY + 1.55, ease: "easeOut" }}
        style={{ position: "absolute", bottom: 26, left: 0, right: 0, zIndex: 2, textAlign: "center", color: YELLOW_LT }}
      >
        <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>
          <div style={{ ...sans, fontSize: 12, letterSpacing: "0.14em" }}>Урилгыг доош гүйлгэж үзнэ үү</div>
          <svg width="18" height="10" viewBox="0 0 18 10" fill="none" style={{ display: "block", margin: "6px auto 0" }}>
            <path d="M1 1L9 8L17 1" stroke={YELLOW_LT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Урилгын үг ──────────────────────────────────────────────────────────────
// events.poem хоосон үед харагдах үндсэн бичвэр
const T22_DEFAULT_POEM = [
  "Бяцхан баатрын маань амьдралд",
  "онцгой өдөр ирлээ —",
  "сэвлэг үргээх ёслол.",
  "",
  "Үсийг нь анх удаа хайчилж,",
  "эрүүл энх, урт насыг ерөөх энэ өдрийг",
  "Эрхэм таньтай хамт өнгөрүүлэхийг хүсэж байна.",
];

function T22Letter({ event }: { event: EventData }) {
  return (
    <div style={{ background: NAVY }}>
      <ZigTop fill={SKY} />
      <div style={{ background: NAVY, padding: "44px 32px 52px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, ...halftone("rgba(30,79,216,0.35)", 16), opacity: 0.5, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -14, right: -22, opacity: 0.12, pointerEvents: "none" }}>
          <HeroEmblem size={180} />
        </div>

        <FadeUp>
          <div style={{ marginBottom: 22 }}>
            <BoltDivider color={YELLOW} width={190} />
          </div>
          {/* Шүлэг тул мөр бүр тусдаа эгнээнд, хоосон мөр нь зай болно */}
          <div style={{ ...sans, color: "rgba(243,246,255,0.95)", fontSize: 18, lineHeight: 1.9, maxWidth: 420, margin: "0 auto", position: "relative", zIndex: 1 }}>
            {getPoemLines(event, T22_DEFAULT_POEM).map((line, i) =>
              line === ""
                ? <div key={i} style={{ height: 18 }} />
                : <div key={i}>{line}</div>
            )}
          </div>
          <div style={{ marginTop: 24 }}>
            <BoltDivider color={YELLOW} width={190} />
          </div>
        </FadeUp>
      </div>
      <ZigBottom fill={SKY} />
    </div>
  );
}

// ─── Цомгийн карт ────────────────────────────────────────────────────────────
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
      borderRadius: 16, overflow: "hidden",
      boxShadow: `0 10px 34px rgba(11,26,58,0.3), 0 0 0 3px ${RED}`,
      border: `3px solid ${YELLOW}`,
      position: "relative", flexShrink: 0,
      background: NAVY,
    }}>
      {/* Дэвсгэр: бүдэгрүүлсэн хувилбар — өргөн зураг contain болоход хоосон
          зурвасыг дүүргэнэ */}
      <img
        src={src} alt="" aria-hidden="true"
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", filter: "blur(14px)", transform: "scale(1.15)", display: "block",
        }}
      />
      <img
        src={src} alt=""
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "contain", display: "block",
        }}
      />
      {quote && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: size === "large" ? "14px 12px" : "8px 8px",
          background: "linear-gradient(to top, rgba(11,26,58,0.88), transparent)",
        }}>
          <p style={{ ...sans, fontSize: size === "large" ? 11 : 9, color: SKY, lineHeight: 1.55, margin: 0 }}>
            {quote}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Цомог (fan carousel) ────────────────────────────────────────────────────
function T22Gallery({ event }: { event: EventData }) {
  const [current, setCurrent] = useState(0);
  const title = cfg(event.config, "gallery.title", "Бяцхан баатрын цомог");

  // Оруулсан зурагны тоогоор л slide үүсгэнэ — дутууг нь нөхөхгүй.
  const photos  = (event.gallery2_photos || []).filter(Boolean);
  const sources = photos.length ? photos : FALLBACK_PHOTOS;
  const showQuotes = cfg<unknown>(event.config, "gallery.quotes", true) !== false;
  const slides = sources.map((src, i) => ({
    src,
    quote: showQuotes ? QUOTES[i % QUOTES.length] : "",
  }));

  const prev  = (current - 1 + slides.length) % slides.length;
  const prev2 = (current - 2 + slides.length) % slides.length;
  const next  = (current + 1) % slides.length;
  const next2 = (current + 2) % slides.length;

  const showSide = slides.length >= 3;
  const showFar  = slides.length >= 5;

  return (
    <div style={{ background: SKY, paddingTop: 58, paddingBottom: 44, overflow: "hidden" }}>
      <FadeUp>
        <div style={{ textAlign: "center", marginBottom: 34, padding: "0 24px" }}>
          <div style={{ ...hero, fontSize: 26, color: BLUE_DK, marginBottom: 12, lineHeight: 1.3, textTransform: "uppercase" }}>
            {title}
          </div>
          <BoltDivider color={RED} width={200} />
        </div>
      </FadeUp>

      <motion.div
        style={{
          position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
          height: 460, cursor: "grab", touchAction: "none", userSelect: "none",
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60 || info.velocity.x < -400) setCurrent(next);
          else if (info.offset.x > 60 || info.velocity.x > 400) setCurrent(prev);
        }}
      >
        {showFar && (
          <div style={{ position: "absolute", transform: "translateX(-340px) scale(0.62)", opacity: 0.3, zIndex: 0, pointerEvents: "none" }}>
            <GalleryCard src={slides[prev2].src} quote={slides[prev2].quote} size="tiny" />
          </div>
        )}
        {showSide && (
          <div style={{ position: "absolute", transform: "translateX(-210px) scale(0.82)", opacity: 0.65, zIndex: 1, pointerEvents: "none" }}>
            <GalleryCard src={slides[prev].src} quote={slides[prev].quote} size="small" />
          </div>
        )}
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
        {showSide && (
          <div style={{ position: "absolute", transform: "translateX(210px) scale(0.82)", opacity: 0.65, zIndex: 1, pointerEvents: "none" }}>
            <GalleryCard src={slides[next].src} quote={slides[next].quote} size="small" />
          </div>
        )}
        {showFar && (
          <div style={{ position: "absolute", transform: "translateX(340px) scale(0.62)", opacity: 0.3, zIndex: 0, pointerEvents: "none" }}>
            <GalleryCard src={slides[next2].src} quote={slides[next2].quote} size="tiny" />
          </div>
        )}
      </motion.div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28, flexWrap: "wrap", padding: "0 24px" }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={"Зураг " + (i + 1)}
            style={{
              height: 8, borderRadius: 4, border: "none", cursor: "pointer",
              background: i === current ? RED : "rgba(30,79,216,0.28)",
              width: i === current ? 24 : 8,
              transition: "all 0.4s", padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Тоологч ─────────────────────────────────────────────────────────────────
// "2026-10-17" → "2026 оны 10 сарын 17"
function fmtEventDate(d: string) {
  const [y, m, day] = (d || "").split("-");
  if (!y || !m || !day) return d;
  return y + " оны " + Number(m) + " сарын " + Number(day);
}

function T22Countdown({ event }: { event: EventData }) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(`${event.date}T${event.time || "13:00"}:00`);
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
    <div style={{ background: SKY, padding: "52px 24px 58px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", bottom: -20, left: -26, opacity: 0.09, pointerEvents: "none" }}>
        <HeroEmblem size={170} />
      </div>

      <FadeUp>
        <div style={{ ...hero, fontSize: 26, color: BLUE_DK, marginBottom: 12, textTransform: "uppercase" }}>
          Баяр хүртэл
        </div>
        <BoltDivider color={RED} width={200} />
        <div style={{ ...sansB, fontSize: 18, color: RED, letterSpacing: "0.06em", margin: "16px 0 32px" }}>
          {fmtEventDate(event.date)}
          {event.time ? " · " + event.time : ""}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          {units.map((u, i) => (
            <div key={u.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                textAlign: "center", minWidth: 64, padding: "12px 6px 10px",
                background: BLUE, borderRadius: 12,
                border: `2px solid ${YELLOW}`,
                boxShadow: `0 6px 0 ${BLUE_DK}, 0 10px 22px rgba(30,79,216,0.3)`,
              }}>
                <div style={{ ...hero, fontSize: 34, lineHeight: 1, color: "#fff" }}>
                  {pad(u.val)}
                </div>
                <div style={{ ...sansB, fontSize: 10, color: YELLOW, marginTop: 8, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  {u.label}
                </div>
              </div>
              {i < 3 && (
                <div style={{ ...hero, fontSize: 26, color: RED, marginBottom: 6, opacity: 0.7 }}>:</div>
              )}
            </div>
          ))}
        </div>
      </FadeUp>
    </div>
  );
}

// ─── Хөтөлбөр ────────────────────────────────────────────────────────────────
function T22Schedule({ event }: { event: EventData }) {
  const time = event.time || "13:00";
  const [hh, mm] = time.split(":").map(Number);
  const fmt = (h: number, m: number) =>
    String(h % 24).padStart(2, "0") + ":" + String(m).padStart(2, "0");

  // events.schedule хоосон бол event.time-аас тооцсон үндсэн хөтөлбөр гарна
  const items = getSchedule(event, [
    { time: fmt(hh, mm),           label: "Зочид хүрэлцэн ирэх" },
    { time: fmt(hh, mm + 30),      label: "Дурсгалын зураг авахуулах" },
    { time: fmt(hh + 1, mm),       label: "Сэвлэг үргээх ёслол" },
    { time: fmt(hh + 1, mm + 30),  label: "Хүндэтгэлийн зоог" },
    { time: fmt(hh + 2, mm + 30),  label: "Бялуу хөндөх, лаа үлээх" },
    { time: fmt(hh + 3, mm),       label: "Хүүхдийн тоглоом, урлагийн хөтөлбөр" },
    { time: fmt(hh + 4, mm),       label: "Бэлэг гардуулах, хамтдаа зураг авах" },
  ]);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div style={{ background: NAVY }}>
      <ZigTop fill={NAVY} />
      <div style={{ background: NAVY, padding: "46px 24px 56px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, ...halftone("rgba(30,79,216,0.35)", 16), opacity: 0.5, pointerEvents: "none" }} />
        <FadeUp>
          <div style={{ ...hero, fontSize: 26, color: "#fff", marginBottom: 12, textTransform: "uppercase" }}>Хөтөлбөр</div>
          <div style={{ marginBottom: 38 }}>
            <BoltDivider color={YELLOW} width={200} />
          </div>
        </FadeUp>

        <div ref={containerRef} style={{ position: "relative", display: "inline-block", textAlign: "left" }}>
          {/* Scroll-той хамт уртсах босоо шугам — одон дээр төвлөрнө */}
          <div style={{ position: "absolute", left: 94, top: 0, bottom: 0, width: 2, overflow: "hidden" }}>
            <motion.div style={{ width: "100%", height: lineHeight, background: "rgba(255,197,61,0.5)" }} />
          </div>

          {items.map((item, i) => (
            <FadeUp key={i} delay={i * 0.12}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 26, position: "relative" }}>
                <div style={{ ...hero, fontSize: 17, color: YELLOW, minWidth: 70, textAlign: "right" }}>
                  {item.time}
                </div>
                <svg width="14" height="14" viewBox="0 0 20 20" style={{ flexShrink: 0, position: "relative", zIndex: 1 }}>
                  <path d="M10 0 L12.4 7.6 L20 10 L12.4 12.4 L10 20 L7.6 12.4 L0 10 L7.6 7.6 Z" fill={RED} stroke={YELLOW} strokeWidth="1" />
                </svg>
                <div>
                  <div style={{ ...sansB, fontSize: 16, color: SKY }}>{item.label}</div>
                  {item.desc && (
                    <div style={{ ...sans, fontSize: 13, color: "rgba(243,246,255,0.62)", marginTop: 3 }}>
                      {item.desc}
                    </div>
                  )}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
      <ZigBottom fill={SKY} />
    </div>
  );
}

// ─── Байршил ─────────────────────────────────────────────────────────────────
function T22Location({ event }: { event: EventData }) {
  // Газрын зургийн зураг + товчийг config.sections.map: true үед л харуулна (анхдагч нуух)
  const showMap = sectionOn(event.config, "map", false);
  return (
    <div style={{ background: SKY, padding: "52px 32px", textAlign: "center" }}>
      <FadeUp>
        <div style={{ ...hero, fontSize: 26, color: RED, marginBottom: 12, textTransform: "uppercase" }}>Байршил</div>
        <div style={{ marginBottom: 20 }}><BoltDivider color={BLUE} width={200} /></div>
        {event.venue_name && (
          <div style={{ ...sansB, fontSize: 20, color: INK, marginBottom: 8 }}>
            {event.venue_name}
          </div>
        )}
        {event.venue_address && (
          <div style={{ ...sans, fontSize: 15, color: INK, opacity: 0.7, marginBottom: 26, lineHeight: 1.6 }}>
            {event.venue_address}
          </div>
        )}
      </FadeUp>

      {showMap && event.maps_photo && (
        <FadeUp delay={0.15}>
          <img
            src={event.maps_photo}
            alt={event.venue_name}
            style={{
              width: "100%", maxWidth: 440, height: 250, objectFit: "cover",
              borderRadius: 12, display: "block", margin: "0 auto 24px",
              border: `3px solid ${YELLOW}`,
              boxShadow: `0 0 0 3px ${BLUE}, 0 12px 30px rgba(11,26,58,0.2)`,
            }}
          />
        </FadeUp>
      )}

      {showMap && event.venue_map_url && (
        <FadeUp delay={0.25}>
          <a
            href={normalizeUrl(event.venue_map_url)}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              background: `linear-gradient(140deg, ${RED}, ${RED_DK})`,
              color: "#fff", ...sansB, fontSize: 15,
              padding: "12px 36px", borderRadius: 30, textDecoration: "none",
              border: `2px solid ${YELLOW}`,
              boxShadow: "0 6px 18px rgba(214,40,40,0.38)",
            }}
          >
            Газрын зурагт нээх
          </a>
        </FadeUp>
      )}
    </div>
  );
}

// ─── Хүсэлт (dress code) ─────────────────────────────────────────────────────
function T22Request({ event }: { event: EventData }) {
  const title = cfg(event.config, "request.title", "Бяцхан хүсэлт");
  const text  = cfg(event.config, "request.text",
    "Супер баатрын энэ өдрийг хамтдаа бүтээж, бяцхан баатрын маань сэвлэг үргээх ёслолыг дурсамж дүүрэн өнгөрүүлье.");
  const icons = [
    { emoji: "🦸", label: "Супер баатар" },
    { emoji: "⚡", label: "Улаан, хөх өнгө" },
    { emoji: "🎂", label: "Бялууны цаг" },
    { emoji: "📸", label: "Дурсамж хамтдаа" },
  ];

  return (
    <div style={{ background: NAVY }}>
      <ZigTop fill={NAVY} />
      <div style={{ background: NAVY, padding: "46px 32px 56px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, ...halftone("rgba(214,40,40,0.3)", 16), opacity: 0.45, pointerEvents: "none" }} />
        <FadeUp>
          <div style={{ ...hero, fontSize: 26, color: "#fff", marginBottom: 12, textTransform: "uppercase" }}>{title}</div>
          <div style={{ marginBottom: 30 }}><BoltDivider color={YELLOW} width={200} /></div>
        </FadeUp>

        {/* config.sections.requestIcons: true үед л харуулна (анхдагч нуух) */}
        {sectionOn(event.config, "requestIcons", false) && (
        <FadeUp delay={0.1}>
          {/* 4 icon нэг мөрөнд: 390px дэлгэц − 64 padding = 326 → 4×68 + 3×10 = 302 */}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 30, flexWrap: "wrap", position: "relative" }}>
            {icons.map(({ emoji, label }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 68 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: BLUE,
                  border: `2px solid ${YELLOW}`,
                  boxShadow: `0 4px 0 ${BLUE_DK}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                }}>
                  {emoji}
                </div>
                <span style={{ ...sans, fontSize: 10, color: "rgba(243,246,255,0.75)", letterSpacing: "0.04em", lineHeight: 1.4 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </FadeUp>
        )}

        <FadeUp delay={0.2}>
          <p style={{ ...sans, fontSize: 16, color: SKY, maxWidth: 360, margin: "0 auto", lineHeight: 1.85, position: "relative" }}>
            {text}
          </p>
        </FadeUp>

        <FadeUp delay={0.3}>
          <div style={{ marginTop: 30, display: "flex", justifyContent: "center", position: "relative" }}>
            <HeroEmblem size={104} opacity={0.95} letter={cfg(event.config, "hero.emblem", initialOf(event.person1_name))} />
          </div>
        </FadeUp>
      </div>
      <ZigBottom fill={SKY} />
    </div>
  );
}

// ─── Ерөөл (wishes) ──────────────────────────────────────────────────────────
function T22Wishes({ eventId }: { eventId: string }) {
  const [name, setName]       = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  const submit = async () => {
    if (!name.trim() || !message.trim()) return;
    setSending(true);
    // Demo горимд бодит DB руу бичихгүй (event id нь uuid биш)
    if (eventId === "demo") {
      setSending(false);
      setSent(true);
      return;
    }
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
    border: `2px solid rgba(30,79,216,0.35)`,
    borderRadius: 10, ...sans, fontSize: 15, color: INK,
    background: "white", boxSizing: "border-box", outline: "none",
  };

  return (
    <div style={{ background: SKY, padding: "52px 32px 60px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -16, right: -26, opacity: 0.08, pointerEvents: "none" }}>
        <HeroEmblem size={190} />
      </div>

      <FadeUp>
        <div style={{ ...hero, fontSize: 26, color: RED, marginBottom: 10, textAlign: "center", textTransform: "uppercase" }}>
          Ерөөлийн дэвтэр
        </div>
        <div style={{ marginBottom: 14 }}><BoltDivider color={BLUE} width={200} /></div>
        <p style={{ ...sans, fontSize: 14, color: INK, opacity: 0.65, textAlign: "center", marginBottom: 28 }}>
          Бяцхан баатарт минь ерөөлийн үгээ үлдээнэ үү
        </p>

        {sent ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", padding: "26px 0" }}>
            <div style={{ ...hero, fontSize: 24, color: BLUE, marginBottom: 10 }}>Баярлалаа!</div>
            <p style={{ ...sans, fontSize: 15, color: INK, opacity: 0.75, lineHeight: 1.7 }}>
              Таны ерөөлийг хүлээн авлаа.
            </p>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 420, margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div>
              <label style={{ ...sansB, fontSize: 13, color: INK, opacity: 0.7, display: "block", marginBottom: 6 }}>
                Нэр
              </label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Нэрээ бичнэ үү" style={inputStyle} />
            </div>
            <div>
              <label style={{ ...sansB, fontSize: 13, color: INK, opacity: 0.7, display: "block", marginBottom: 6 }}>
                Ерөөлийн үг
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ерөөлөө бичнэ үү..."
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
                background: `linear-gradient(140deg, ${BLUE}, ${BLUE_DK})`,
                color: "#fff", border: `2px solid ${YELLOW}`, borderRadius: 10,
                ...sansB, fontSize: 16,
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

// ─── Ирц бүртгэл ─────────────────────────────────────────────────────────────
function T22RSVP({ event }: { event: EventData }) {
  const eventId   = event.id;
  const maxGuests = cfg(event.config, "rsvp.maxGuests", 20);
  const note      = cfg(event.config, "rsvp.note", "Баярын өдрөөс өмнө бүртгэлээ хийнэ үү.");
  const [name, setName]             = useState("");
  const [attending, setAttending]   = useState<boolean | null>(null);
  const [guests, setGuests]         = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);

  const submit = async () => {
    if (!name.trim() || attending === null) return;
    setSubmitting(true);
    // Demo горимд бодит DB руу бичихгүй (event id нь uuid биш)
    if (eventId === "demo") {
      setSubmitting(false);
      setDone(true);
      return;
    }
    const { error } = await supabase.from("rsvp").insert({
      event_id: eventId,
      name: name.trim(),
      guests: attending ? guests : 0,
    });
    setSubmitting(false);
    if (error) { toast.error("Алдаа гарлаа. Дахин оролдоно уу."); return; }
    setDone(true);
  };

  const counterBtn: React.CSSProperties = {
    width: 44, height: 44,
    border: "2px solid rgba(255,197,61,0.45)",
    background: "transparent", color: SKY,
    ...sansB, fontSize: 20, lineHeight: 1, cursor: "pointer",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px",
    border: "2px solid rgba(255,197,61,0.45)",
    borderRadius: 10, ...sans, fontSize: 15, color: INK,
    background: "white", boxSizing: "border-box", outline: "none",
  };

  return (
    <div style={{ background: NAVY, padding: "56px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, ...halftone("rgba(30,79,216,0.35)", 16), opacity: 0.5, pointerEvents: "none" }} />
      <FadeUp style={{ position: "relative" }}>
        <div style={{ ...hero, fontSize: 26, color: "#fff", marginBottom: 12, textTransform: "uppercase" }}>Ирцээ бүртгүүлэх</div>
        <div style={{ marginBottom: 16 }}><BoltDivider color={YELLOW} width={200} /></div>
        <p style={{ ...sans, fontSize: 16, color: "rgba(243,246,255,0.82)", maxWidth: 380, margin: "0 auto 30px", lineHeight: 1.7 }}>
          {note}
        </p>

        {done ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} style={{ maxWidth: 420, margin: "0 auto" }}>
            <div style={{ ...hero, fontSize: 26, color: YELLOW, marginBottom: 10 }}>Баярлалаа!</div>
            <p style={{ ...sans, fontSize: 16, color: "rgba(243,246,255,0.88)", lineHeight: 1.75 }}>
              Таны бүртгэлийг хүлээн авлаа.<br />Таньтай уулзахыг тэсэн ядан хүлээж байна.
            </p>
          </motion.div>
        ) : (
          <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "left" }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Таны нэр"
              style={{ ...inputStyle, marginBottom: 20 }}
            />

            <p style={{ ...sansB, fontSize: 15, color: SKY, marginBottom: 10 }}>Та ирэх үү?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {[
                { val: true,  label: "Тийм, заавал ирнэ" },
                { val: false, label: "Харамсалтай нь очиж чадахгүй" },
              ].map(({ val, label }) => (
                <label
                  key={String(val)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                    ...sans, fontSize: 15, color: SKY,
                    background: attending === val ? "rgba(30,79,216,0.45)" : "transparent",
                    border: `2px solid ${attending === val ? YELLOW : "rgba(255,197,61,0.25)"}`,
                    borderRadius: 10, padding: "11px 14px", transition: "all 0.25s",
                  }}
                >
                  <input
                    type="radio"
                    name="attending"
                    checked={attending === val}
                    onChange={() => setAttending(val)}
                    style={{ accentColor: RED, width: 16, height: 16 }}
                  />
                  {label}
                </label>
              ))}
            </div>

            {/* Хүний тоо — "Ирэхгүй" сонгосон үед хэрэггүй тул нуана */}
            {attending !== false && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ ...sansB, fontSize: 15, color: SKY, marginBottom: 10 }}>
                  Хэдүүлээ ирэх вэ?
                  {maxGuests < 20 && <span style={{ opacity: 0.7, fontWeight: 400 }}> (дээд тал нь {maxGuests})</span>}
                </p>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <button onClick={() => setGuests((g) => Math.max(1, g - 1))} style={counterBtn} aria-label="Хасах">−</button>
                  <div style={{
                    ...hero, fontSize: 18, color: YELLOW,
                    width: 64, height: 44,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderTop: "2px solid rgba(255,197,61,0.45)",
                    borderBottom: "2px solid rgba(255,197,61,0.45)",
                  }}>
                    {guests}
                  </div>
                  <button onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))} style={counterBtn} aria-label="Нэмэх">+</button>
                </div>
              </div>
            )}

            <button
              onClick={submit}
              disabled={submitting || !name.trim() || attending === null}
              style={{
                width: "100%", padding: "14px",
                background: `linear-gradient(140deg, ${RED}, ${RED_DK})`,
                color: "#fff", border: `2px solid ${YELLOW}`, borderRadius: 10,
                ...sansB, fontSize: 17,
                cursor: submitting ? "wait" : "pointer",
                opacity: (!name.trim() || attending === null) ? 0.55 : 1,
                transition: "opacity 0.25s",
              }}
            >
              {submitting ? "Илгээж байна..." : "Илгээх"}
            </button>
          </div>
        )}
      </FadeUp>
    </div>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function T22Footer({ event }: { event: EventData }) {
  const name      = cfg(event.config, "hero.name", event.person1_name || "Бяцхан баатар");
  const age       = cfg<string | number | null>(event.config, "hero.age", null);
  const title     = cfg(event.config, "footer.title", "Таньтай уулзахыг тэсэн ядан хүлээж байна!");
  const dressNote = cfg<string | null>(event.config, "footer.note", null);
  const lines     = cfg<string[]>(event.config, "footer.lines", []);
  const phones    = cfg<string[]>(event.config, "footer.phones", []);
  // Үндсэндээ gallery_photos-ийн эхний зураг гарна; config.footer.image-ээр солино.
  const footerImg = cfg<string | null>(event.config, "footer.image", null) || event.gallery_photos?.[0];

  return (
    <div style={{ background: NAVY, padding: "0 32px 76px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <ZigTop fill={NAVY} />
      <div style={{ position: "absolute", inset: 0, ...halftone("rgba(214,40,40,0.3)", 16), opacity: 0.4, pointerEvents: "none" }} />

      {footerImg && (
        <FadeUp style={{ position: "relative" }}>
          <img
            src={footerImg}
            alt={name}
            style={{
              width: "88%", maxWidth: 380, height: "auto",
              borderRadius: 14, display: "block", margin: "8px auto 30px",
              border: `3px solid ${YELLOW}`,
              boxShadow: `0 0 0 3px ${RED}, 0 14px 40px rgba(0,0,0,0.45)`,
            }}
          />
        </FadeUp>
      )}

      <FadeUp delay={0.12} style={{ position: "relative" }}>
        <div style={{ ...hero, fontSize: 22, color: "#fff", marginBottom: 14, lineHeight: 1.4, textTransform: "uppercase" }}>
          {title}
        </div>
        {dressNote && (
          <p style={{
            ...sans, fontSize: 16, color: YELLOW_LT, opacity: 0.95,
            maxWidth: 340, margin: "0 auto 18px", lineHeight: 1.8,
          }}>
            {dressNote}
          </p>
        )}
        <BoltDivider color={YELLOW} width={200} />
        <div style={{ ...hero, fontSize: 22, color: YELLOW, marginTop: 16, textTransform: "uppercase" }}>
          {name}{age !== null && age !== "" ? " · " + String(age) + " нас" : ""}
        </div>

        {(lines.length > 0 || phones.length > 0) && (
          <div style={{ marginTop: 22 }}>
            {lines.map((line) => (
              <div key={line} style={{ ...sans, fontSize: 16, color: SKY, opacity: 0.88, lineHeight: 1.9 }}>
                {line}
              </div>
            ))}
            {phones.length > 0 && (
              <div style={{ ...sans, fontSize: 16, color: SKY, opacity: 0.88, marginTop: 12 }}>
                Утас:{" "}
                {phones.map((tel, i) => (
                  <span key={tel}>
                    {i > 0 && ", "}
                    <a href={`tel:${tel}`} style={{ color: YELLOW, textDecoration: "none" }}>{tel}</a>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </FadeUp>

      <FadeUp delay={0.2} style={{ position: "relative" }}>
        <div style={{ marginTop: 34, display: "flex", justifyContent: "center", opacity: 0.7 }}>
          <HeroEmblem size={88} letter={cfg(event.config, "hero.emblem", initialOf(event.person1_name))} />
        </div>
      </FadeUp>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
export default function Template22({ event }: { event: EventData }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // config.intro.video: өөр видео URL эсвэл false (intro-гүй)
  const introVideo = cfg<string | false>(event.config, "intro.video", T22_INTRO_VIDEO_URL);

  // Дуу шууд автоматаар эхэлнэ. Browser autoplay-г хоригловол хэрэглэгчийн
  // анхны хөдөлгөөн (tap / scroll / keydown) дээр асаана.
  useEffect(() => {
    if (!event.music_url) return;
    const startMusic = () => {
      const a = audioRef.current;
      if (!a) return;
      a.play().then(cleanup).catch(() => {});
    };
    const events = ["pointerdown", "touchstart", "keydown", "scroll"] as const;
    const cleanup = () => events.forEach((e) => window.removeEventListener(e, startMusic));
    startMusic();
    events.forEach((e) => window.addEventListener(e, startMusic, { passive: true }));
    return cleanup;
  }, [event.music_url]);

  return (
    <div style={{ maxWidth: 523, margin: "0 auto", ...sans, overflowX: "hidden", background: SKY }}>
      {introVideo && <VideoIntro src={introVideo} audioRef={audioRef} />}
      <ComicOverlay />

      <T22Hero event={event} />
      <T22Letter event={event} />
      <T22Gallery event={event} />
      <T22Countdown event={event} />
      {sectionOn(event.config, "schedule") && <T22Schedule event={event} />}
      <T22Location event={event} />
      {sectionOn(event.config, "request") && <T22Request event={event} />}
      {sectionOn(event.config, "wishes") && <T22Wishes eventId={event.id} />}
      {sectionOn(event.config, "rsvp") && <T22RSVP event={event} />}
      <T22Footer event={event} />

      {event.music_url && <MusicPlayer src={event.music_url} audioRef={audioRef} />}
      <Toaster />
    </div>
  );
}
