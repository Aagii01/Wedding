import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { EventData } from "../../types/event";
import { getPoemLines, getSchedule } from "../../lib/eventContent";
import { normalizeUrl } from "../../lib/url";

// ─── Template 21 — "Belle" ────────────────────────────────────────────────────
// Хүүхдийн төрсөн өдрийн урилга. Template13-ийн бүтцийг (hero → урилгын үг →
// цомог → тоологч → хөтөлбөр → байршил → ерөөл → ирц → footer) баримталсан ч
// "Гоо бүсгүй ба мангас" үлгэрийн өнгө (алт, улаан сарнай, лааны гэрэл) ба
// эффектүүд (унах сарнайн дэлбээ, алтан гялтгануур, шилэн бүрхүүлт сарнай)
// бүхий тусдаа загвар. T13-ыг олон хурим ашиглаж байгаа тул хуулбар үүсгэв.

// ─── palette ─────────────────────────────────────────────────────────────────
const GOLD    = "#C8962B";
const GOLD_LT = "#F0D183";
const ROSE    = "#9E1B32";
const ROSE_LT = "#D34157";
const DEEP    = "#2A1710";
const CREAM   = "#FFF9EF";
const INK     = "#3B2A1D";

// ─── font helpers ─────────────────────────────────────────────────────────────
// PT Serif — монгол кирилл (ө, ү) бүрэн дэмждэг тул бүх монгол бичвэрт энэ.
// Cinzel Decorative нь кириллгүй — зөвхөн тоо, латин чимэглэлд ашиглана.
const serif  = { fontFamily: "'PT Serif', serif" } as const;
const serifI = { fontFamily: "'PT Serif', serif", fontStyle: "italic" } as const;
const deco   = { fontFamily: "'Cinzel Decorative', 'PT Serif', serif" } as const;

// ─── Slug тохиргоо ────────────────────────────────────────────────────────────
// events хүснэгтэд "нас" гэсэн багана байхгүй тул slug-аар нь энд бичнэ.
const AGE: Record<string, string> = {
  "bella": "1",
};

// Hero дээрх нэрийн дээд талын жижиг бичиг.
const EYEBROW: Record<string, string> = {
  "bella": "Бяцхан гүнж",
};

// Цомгийн гарчиг.
const GALLERY_TITLE: Record<string, string> = {
  "bella": "Миний эхний жил",
};

// Цомгийн зураг дээрх бичвэрийг нуух slug-ууд.
const HIDE_PHOTO_QUOTES = new Set<string>([]);

// Хэсгүүдийг нуух slug-ууд.
const HIDE_SCHEDULE = new Set<string>([]);
const HIDE_RSVP     = new Set<string>([]);
const HIDE_WISHES   = new Set<string>([]);

// Footer-ийн хамгийн доор гарах мөрүүд (Хүндэтгэсэн, хүүхдийн нэр г.м.) ба утас.
const FOOTER_FAMILY: Record<string, { lines: string[]; phones?: string[] }> = {
  "bella": { lines: ["Хүндэтгэсэн: Эрхбаяр, Нандин-эрдэнэ"] },
};

// Footer-ийн зургийг slug-аар нь тогтооно. Бүртгээгүй урилга дээр
// gallery_photos-ийн эхний зураг хэвээр гарна.
const FOOTER_IMAGE: Record<string, string> = {
  "bella":
    "https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/bella/belle.jpeg",
};

// "Таньтай уулзахыг тэсэн ядан хүлээж байна" мөрийн доор гарах хувцаслалтын
// хүсэлт — зөвхөн бүртгэсэн slug дээр.
const DRESS_NOTE: Record<string, string> = {
  "bella": "Хүүхэд бүр “Belle” хүүхэлдэй баатрын дүрээр ирэхийг хүсэж байна.",
};

// Ирцийн дээд тоо. Бүртгээгүй урилга дээр 20.
const MAX_GUESTS: Record<string, number> = {};

// ─── Зурагны fallback ────────────────────────────────────────────────────────
const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800",
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800",
  "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800",
  "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800",
];

// Цомгийн зураг дээр гарах бяцхан ишлэлүүд
const QUOTES = [
  "Бяцхан зүрх минь, чи бол бидний хамгийн сайхан үлгэр.",
  "Инээмсэглэл чинь лааны гэрлээс ч дулаан.",
  "Эхний алхам, эхний инээд — бүгд эрдэнэ.",
  "Чи ирснээр манай гэр илүү гэрэлтэй боллоо.",
  "Өдөр бүр чинь үлгэрийн нэгэн хуудас.",
  "Бяцхан гарууд том мөрөөдлийг тэвэрдэг.",
  "Хайр гэдэг чиний нүдэнд байдаг.",
  "Нэгэн нас — мянган дурсамж.",
];

// ─── Унах сарнайн дэлбээ + алтан гялтгануур ──────────────────────────────────
const PETALS = [
  { id: 0, left: 6,  delay: 0,   dur: 11, size: 13, drift:  40, rot: 10  },
  { id: 1, left: 18, delay: 3,   dur: 14, size: 10, drift: -32, rot: 60  },
  { id: 2, left: 31, delay: 1.2, dur: 12, size: 15, drift:  28, rot: 110 },
  { id: 3, left: 45, delay: 5,   dur: 15, size: 11, drift: -44, rot: 150 },
  { id: 4, left: 58, delay: 2.2, dur: 13, size: 12, drift:  36, rot: 25  },
  { id: 5, left: 71, delay: 6,   dur: 12, size: 9,  drift: -26, rot: 80  },
  { id: 6, left: 83, delay: 1.8, dur: 16, size: 14, drift:  46, rot: 170 },
  { id: 7, left: 93, delay: 4.4, dur: 13, size: 10, drift: -38, rot: 210 },
];
const PETAL_COLORS = ["#9E1B32", "#C42B45", "#7E1226", "#D34157", "#A81E33"];

const SPARKS = [
  { id: 0, left: 12, top: 18, delay: 0,   dur: 3.4, size: 7 },
  { id: 1, left: 27, top: 62, delay: 1.1, dur: 4.2, size: 5 },
  { id: 2, left: 44, top: 30, delay: 2.0, dur: 3.8, size: 9 },
  { id: 3, left: 61, top: 74, delay: 0.6, dur: 4.6, size: 6 },
  { id: 4, left: 76, top: 24, delay: 1.7, dur: 3.2, size: 8 },
  { id: 5, left: 88, top: 55, delay: 2.6, dur: 4.0, size: 5 },
  { id: 6, left: 34, top: 88, delay: 3.1, dur: 3.6, size: 7 },
  { id: 7, left: 68, top: 12, delay: 1.4, dur: 4.4, size: 6 },
];

// Дэлбээ, гялтгануур хоёулаа урилгын 523px-ийн хүрээнд л унана
function MagicOverlay() {
  return (
    <>
      <style>{`
        @keyframes t21PetalFall {
          0%   { opacity: 0;    transform: translateY(-6vh) rotate(0deg) translateX(0); }
          10%  { opacity: 0.85; }
          88%  { opacity: 0.6; }
          100% { opacity: 0;    transform: translateY(106vh) rotate(560deg) translateX(var(--t21-drift)); }
        }
        @keyframes t21Twinkle {
          0%, 100% { opacity: 0;   transform: scale(0.4) rotate(0deg); }
          50%      { opacity: 0.9; transform: scale(1)   rotate(90deg); }
        }
      `}</style>

      <div style={{
        position: "fixed", top: 0, bottom: 0,
        left: "50%", transform: "translateX(-50%)",
        width: "min(523px, 100%)",
        pointerEvents: "none", overflow: "hidden", zIndex: 6,
      }}>
        {PETALS.map((p) => (
          <div
            key={"p" + p.id}
            style={{
              position: "absolute", left: p.left + "%", top: 0,
              animation: `t21PetalFall ${p.dur}s ${p.delay}s ease-in-out infinite`,
              willChange: "transform, opacity",
              ["--t21-drift" as string]: p.drift + "px",
            }}
          >
            <svg width={p.size} height={p.size * 1.35} viewBox="0 0 20 27"
              style={{ transform: `rotate(${p.rot}deg)` }}
              fill={PETAL_COLORS[p.id % PETAL_COLORS.length]}>
              <path d="M10 0 C18 6, 20 15, 10 27 C0 15, 2 6, 10 0Z" opacity="0.8" />
            </svg>
          </div>
        ))}

        {SPARKS.map((s) => (
          <div
            key={"s" + s.id}
            style={{
              position: "absolute", left: s.left + "%", top: s.top + "%",
              animation: `t21Twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
              willChange: "transform, opacity",
            }}
          >
            <svg width={s.size} height={s.size} viewBox="0 0 20 20" fill={GOLD_LT}>
              <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" />
            </svg>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Шилэн бүрхүүлт ид шидийн сарнай ─────────────────────────────────────────
function EnchantedRose({ size = 120, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size * 1.28} viewBox="0 0 100 128" fill="none" style={{ opacity }}>
      {/* шилэн бүрхүүл */}
      <path d="M20 104 L20 56 C20 30, 80 30, 80 56 L80 104 Z" fill={GOLD_LT} opacity="0.10" />
      <path d="M20 104 L20 56 C20 30, 80 30, 80 56 L80 104" stroke={GOLD} strokeWidth="1.6" fill="none" opacity="0.75" />
      <circle cx="50" cy="30" r="3.4" fill={GOLD} opacity="0.8" />
      {/* суурь */}
      <rect x="12" y="104" width="76" height="8" rx="3" fill={GOLD} opacity="0.85" />
      <rect x="18" y="112" width="64" height="6" rx="3" fill={GOLD} opacity="0.55" />
      {/* иш ба навч */}
      <path d="M50 96 L50 66" stroke="#4B6B3A" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M50 84 C40 82, 34 76, 33 70 C42 70, 48 76, 50 84 Z" fill="#4B6B3A" opacity="0.9" />
      <path d="M50 78 C60 76, 66 70, 67 64 C58 64, 52 70, 50 78 Z" fill="#5C7F47" opacity="0.9" />
      {/* сарнайн толгой */}
      <circle cx="50" cy="58" r="15" fill={ROSE} />
      <path d="M50 44 C60 48, 64 58, 50 72 C36 58, 40 48, 50 44 Z" fill={ROSE_LT} opacity="0.75" />
      <circle cx="50" cy="57" r="6.5" fill="#6E0E1E" opacity="0.75" />
      {/* унасан дэлбээ */}
      <path d="M34 100 C38 98, 41 100, 40 103 C37 105, 34 103, 34 100 Z" fill={ROSE} opacity="0.9" />
      <path d="M62 101 C66 99, 69 101, 68 104 C65 106, 62 104, 62 101 Z" fill={ROSE_LT} opacity="0.85" />
    </svg>
  );
}

// ─── Алтан чимэглэлт зураас ──────────────────────────────────────────────────
function GoldDivider({ color = GOLD, width = 220 }: { color?: string; width?: number }) {
  return (
    <svg width={width} height="18" viewBox="0 0 220 18" fill="none" style={{ display: "block", margin: "0 auto" }}>
      <path d="M6 9 H88" stroke={color} strokeWidth="1" opacity="0.7" />
      <path d="M132 9 H214" stroke={color} strokeWidth="1" opacity="0.7" />
      <path d="M110 1 L114 9 L110 17 L106 9 Z" fill={color} opacity="0.9" />
      <circle cx="96" cy="9" r="2" fill={color} opacity="0.8" />
      <circle cx="124" cy="9" r="2" fill={color} opacity="0.8" />
    </svg>
  );
}

// ─── Долгионт тусгаарлагч ────────────────────────────────────────────────────
function WavyBottom({ fill = DEEP }: { fill?: string }) {
  return (
    <div style={{ lineHeight: 0, marginTop: -1 }}>
      <svg viewBox="0 0 523 60" preserveAspectRatio="none" width="100%" height="38">
        <path d="M0,30 C40,0 80,60 120,30 C160,0 200,60 240,30 C280,0 320,60 360,30 C400,0 440,60 480,30 L523,30 L523,60 L0,60 Z" fill={fill} />
      </svg>
    </div>
  );
}

function WavyTop({ fill = DEEP }: { fill?: string }) {
  return (
    <div style={{ lineHeight: 0, marginBottom: -1 }}>
      <svg viewBox="0 0 523 60" preserveAspectRatio="none" width="100%" height="38">
        <path d="M0,30 C40,60 80,0 120,30 C160,60 200,0 240,30 C280,60 320,0 360,30 C400,60 440,0 480,30 L523,30 L523,0 L0,0 Z" fill={fill} />
      </svg>
    </div>
  );
}

// ─── Scroll reveal ───────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, style = {} }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 1.4, delay, ease: "easeOut" }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Дугтуй нээгдэх видео intro ──────────────────────────────────────────────
const T21_INTRO_VIDEO_URL =
  "https://premiumelegante.thedigitalyes.com/assets/intro-video-new-XmwQeafK.mp4";

// Hero-гийн бичвэрүүд видео дуусаж бүдгэрэх үед сая гарч ирнэ
const INTRO_DELAY = 3.9;

function VideoIntro({ audioRef }: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Видеог дуугүйгээр шууд автоматаар тоглуулна (browser зөвшөөрдөг)
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
        src={T21_INTRO_VIDEO_URL}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleEnded}
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
          background: `linear-gradient(140deg, ${GOLD_LT}, ${GOLD})`,
          border: `1px solid ${GOLD}`, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 18px rgba(200,150,43,0.45)",
        }}
      >
        {playing ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill={DEEP}>
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill={DEEP}>
            <polygon points="6,3 20,12 6,21" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────
function fmtHeroDate(d: string) {
  const parts = (d || "").split("-");
  if (parts.length === 3) return parts[0] + " · " + parts[1] + " · " + parts[2];
  return d;
}

function T21Hero({ event }: { event: EventData }) {
  const name = event.person1_name || "Белла";
  const age  = AGE[event.slug];
  const eyebrow = EYEBROW[event.slug] ?? "Төрсөн өдрийн урилга";

  // Урт нэр дэлгэцэнд багтахгүй байсан тул үсгийн хэмжээг нэрний уртаас
  // хамааруулж, дээрээс нь vw-ээр хязгаарлана
  const nameSize =
    name.length <= 8  ? "clamp(44px, 14vw, 78px)" :
    name.length <= 12 ? "clamp(34px, 10.5vw, 62px)" :
    name.length <= 16 ? "clamp(27px, 8vw, 48px)" :
                        "clamp(22px, 6.4vw, 38px)";

  return (
    <div style={{
      minHeight: "100svh", background: DEEP,
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

      {/* Лааны гэрэл мэт дулаан туяа + доод бараан налуу (бичвэр уншигдана) */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        background: "radial-gradient(120% 70% at 50% 22%, rgba(255,214,130,0.22) 0%, rgba(0,0,0,0) 55%)",
      }} />
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        background: "linear-gradient(to bottom, rgba(20,10,6,0.30) 0%, rgba(20,10,6,0.10) 38%, rgba(20,10,6,0.72) 78%, rgba(20,10,6,0.92) 100%)",
      }} />

      {/* Алтан хүрээ */}
      <div style={{
        position: "absolute", inset: 14, zIndex: 1,
        border: `1px solid ${GOLD}`, opacity: 0.55, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", inset: 20, zIndex: 1,
        border: `1px solid ${GOLD_LT}`, opacity: 0.28, pointerEvents: "none",
      }} />

      <div style={{
        position: "relative", zIndex: 2, textAlign: "center",
        padding: "0 26px 14vh", maxWidth: "100%", boxSizing: "border-box",
      }}>
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: INTRO_DELAY + 0.25, ease: "easeOut" }}
          style={{ ...serif, color: GOLD_LT, fontSize: 13, letterSpacing: "0.42em", textTransform: "uppercase", marginBottom: 18 }}>
          {eyebrow}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: INTRO_DELAY + 0.45, ease: "easeOut" }}
          style={{
            ...serifI, color: "#fff", fontSize: nameSize, lineHeight: 1.05,
            textShadow: "0 4px 26px rgba(0,0,0,0.55)",
            maxWidth: "100%", overflowWrap: "break-word", wordBreak: "break-word",
          }}>
          {name}
        </motion.div>

        {age && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: INTRO_DELAY + 0.75, ease: "easeOut" }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              marginTop: 20, padding: "8px 22px",
              border: `1px solid ${GOLD}`, borderRadius: 999,
              background: "rgba(42,23,16,0.45)",
              backdropFilter: "blur(2px)",
            }}>
            <span style={{ ...deco, color: GOLD_LT, fontSize: 30, lineHeight: 1 }}>{age}</span>
            <span style={{ ...serif, color: GOLD_LT, fontSize: 15, letterSpacing: "0.22em" }}>НАС</span>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: INTRO_DELAY + 1.0, ease: "easeOut" }}
          style={{ marginTop: 24 }}>
          <GoldDivider color={GOLD_LT} width={200} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: INTRO_DELAY + 1.15, ease: "easeOut" }}
          style={{ ...serif, color: "rgba(255,255,255,0.9)", fontSize: 15, letterSpacing: "0.2em", marginTop: 16 }}>
          {fmtHeroDate(event.date)}
          {event.time ? " · " + event.time : ""}
        </motion.div>
      </div>

      {/* Доош гүйлгэхийг сануулах */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 0.85 }}
        transition={{ duration: 1.4, delay: INTRO_DELAY + 1.55, ease: "easeOut" }}
        style={{ position: "absolute", bottom: 26, left: 0, right: 0, zIndex: 2, textAlign: "center", color: GOLD_LT }}
      >
        <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>
          <div style={{ ...serif, fontSize: 12, letterSpacing: "0.14em" }}>Урилгыг доош гүйлгэж үзнэ үү</div>
          <svg width="18" height="10" viewBox="0 0 18 10" fill="none" style={{ display: "block", margin: "6px auto 0" }}>
            <path d="M1 1L9 8L17 1" stroke={GOLD_LT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Урилгын үг ──────────────────────────────────────────────────────────────
// events.poem хоосон үед харагдах үндсэн бичвэр
const T21_DEFAULT_POEM = [
  "Үлгэрийн ертөнцөд хамгийн сайхан өдөр ирлээ —",
  "бяцхан гүнжийн маань төрсөн өдөр.",
  "",
  "Лаа асаж, сарнай дэлгэрч,",
  "инээд хөөрөөр дүүрэн энэ өдрийг",
  "Эрхэм таньтай хамт өнгөрүүлэхийг хүсэж байна.",
];

function T21Letter({ event }: { event: EventData }) {
  return (
    <div style={{ background: DEEP }}>
      <WavyTop fill={CREAM} />
      <div style={{ background: DEEP, padding: "44px 32px 52px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -18, right: -26, opacity: 0.10, pointerEvents: "none" }}>
          <EnchantedRose size={190} />
        </div>

        <FadeUp>
          <div style={{ marginBottom: 22 }}>
            <GoldDivider color={GOLD} width={190} />
          </div>
          {/* Шүлэг тул мөр бүр тусдаа эгнээнд, хоосон мөр нь зай болно */}
          <div style={{ ...serif, color: "rgba(255,249,239,0.94)", fontSize: 18, lineHeight: 1.95, maxWidth: 420, margin: "0 auto", position: "relative", zIndex: 1 }}>
            {getPoemLines(event, T21_DEFAULT_POEM).map((line, i) =>
              line === ""
                ? <div key={i} style={{ height: 18 }} />
                : <div key={i}>{line}</div>
            )}
          </div>
          <div style={{ marginTop: 24 }}>
            <GoldDivider color={GOLD} width={190} />
          </div>
        </FadeUp>
      </div>
      <WavyBottom fill={CREAM} />
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
      boxShadow: "0 10px 34px rgba(42,23,16,0.28)",
      border: `3px solid ${GOLD}`,
      position: "relative", flexShrink: 0,
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
      {/* Урд талд: зураг бүтнээр багтана */}
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
          background: "linear-gradient(to top, rgba(42,23,16,0.82), transparent)",
        }}>
          <p style={{ ...serifI, fontSize: size === "large" ? 11 : 9, color: CREAM, lineHeight: 1.55, margin: 0 }}>
            {quote}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Цомог (fan carousel) ────────────────────────────────────────────────────
function T21Gallery({ event }: { event: EventData }) {
  const [current, setCurrent] = useState(0);
  const title = GALLERY_TITLE[event.slug] ?? "Дурсамжийн цомог";

  // Оруулсан зурагны тоогоор л slide үүсгэнэ — дутууг нь нөхөхгүй.
  // Огт зураггүй үед л үндсэн (fallback) зургууд гарна.
  const photos  = (event.gallery2_photos || []).filter(Boolean);
  const sources = photos.length ? photos : FALLBACK_PHOTOS;
  const hideQuotes = HIDE_PHOTO_QUOTES.has(event.slug);
  const slides = sources.map((src, i) => ({
    src,
    quote: hideQuotes ? "" : QUOTES[i % QUOTES.length],
  }));

  const prev  = (current - 1 + slides.length) % slides.length;
  const prev2 = (current - 2 + slides.length) % slides.length;
  const next  = (current + 1) % slides.length;
  const next2 = (current + 2) % slides.length;

  // Зураг цөөн үед хажуугийн картууд давхардахгүйн тулд нуана
  const showSide = slides.length >= 3;
  const showFar  = slides.length >= 5;

  return (
    <div style={{ background: CREAM, paddingTop: 58, paddingBottom: 44, overflow: "hidden" }}>
      <FadeUp>
        <div style={{ textAlign: "center", marginBottom: 34, padding: "0 24px" }}>
          <div style={{ ...serifI, fontSize: 31, color: INK, marginBottom: 12, lineHeight: 1.3 }}>
            {title}
          </div>
          <GoldDivider width={200} />
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
              background: i === current ? GOLD : "rgba(200,150,43,0.28)",
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

function T21Countdown({ event }: { event: EventData }) {
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
    <div style={{ background: CREAM, padding: "52px 24px 58px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", bottom: -24, left: -30, opacity: 0.08, pointerEvents: "none" }}>
        <EnchantedRose size={180} />
      </div>

      <FadeUp>
        <div style={{ ...serifI, fontSize: 31, color: INK, marginBottom: 12 }}>
          Баяр хүртэл
        </div>
        <GoldDivider width={200} />
        <div style={{ ...serif, fontSize: 19, color: ROSE, letterSpacing: "0.06em", margin: "16px 0 32px" }}>
          {fmtEventDate(event.date)}
          {event.time ? " · " + event.time : ""}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          {units.map((u, i) => (
            <div key={u.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ textAlign: "center", minWidth: 58 }}>
                <div style={{
                  ...deco, fontSize: 40, fontWeight: 700, lineHeight: 1,
                  color: INK,
                }}>
                  {pad(u.val)}
                </div>
                <div style={{ ...serif, fontSize: 11, color: GOLD, marginTop: 8, letterSpacing: "0.14em" }}>
                  {u.label}
                </div>
              </div>
              {i < 3 && (
                <div style={{ ...deco, fontSize: 30, color: GOLD, marginBottom: 18, opacity: 0.55 }}>:</div>
              )}
            </div>
          ))}
        </div>
      </FadeUp>
    </div>
  );
}

// ─── Хөтөлбөр ────────────────────────────────────────────────────────────────
function T21Schedule({ event }: { event: EventData }) {
  const time = event.time || "13:00";
  const [hh, mm] = time.split(":").map(Number);
  const fmt = (h: number, m: number) =>
    String(h % 24).padStart(2, "0") + ":" + String(m).padStart(2, "0");

  // events.schedule хоосон бол event.time-аас тооцсон үндсэн хөтөлбөр гарна
  const items = getSchedule(event, [
    { time: fmt(hh, mm),           label: "Зочид хүрэлцэн ирэх" },
    { time: fmt(hh, mm + 30),      label: "Дурсгалын зураг авахуулах" },
    { time: fmt(hh + 1, mm),       label: "Нээлт — бяцхан гүнжийн орох ёслол" },
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
    <div style={{ background: DEEP }}>
      <WavyTop fill={DEEP} />
      <div style={{ background: DEEP, padding: "46px 24px 56px", textAlign: "center" }}>
        <FadeUp>
          <div style={{ ...serifI, fontSize: 32, color: CREAM, marginBottom: 12 }}>Хөтөлбөр</div>
          <div style={{ marginBottom: 38 }}>
            <GoldDivider color={GOLD_LT} width={200} />
          </div>
        </FadeUp>

        <div ref={containerRef} style={{ position: "relative", display: "inline-block", textAlign: "left" }}>
          {/* Scroll-той хамт уртсах босоо шугам — очир (diamond) дээр төвлөрнө */}
          <div style={{ position: "absolute", left: 94, top: 0, bottom: 0, width: 2, overflow: "hidden" }}>
            <motion.div style={{ width: "100%", height: lineHeight, background: "rgba(240,209,131,0.45)" }} />
          </div>

          {items.map((item, i) => (
            <FadeUp key={i} delay={i * 0.12}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 26, position: "relative" }}>
                <div style={{ ...serif, fontSize: 19, fontWeight: 700, color: GOLD_LT, minWidth: 70, textAlign: "right" }}>
                  {item.time}
                </div>
                <div style={{
                  width: 10, height: 10, background: GOLD,
                  transform: "rotate(45deg)", flexShrink: 0,
                  position: "relative", zIndex: 1,
                }} />
                <div>
                  <div style={{ ...serif, fontSize: 17, color: CREAM }}>{item.label}</div>
                  {item.desc && (
                    <div style={{ ...serif, fontSize: 13, color: "rgba(255,249,239,0.6)", marginTop: 3 }}>
                      {item.desc}
                    </div>
                  )}
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

// ─── Байршил ─────────────────────────────────────────────────────────────────
function T21Location({ event }: { event: EventData }) {
  return (
    <div style={{ background: CREAM, padding: "52px 32px", textAlign: "center" }}>
      <FadeUp>
        <div style={{ ...serifI, fontSize: 32, color: ROSE, marginBottom: 12 }}>Байршил</div>
        <div style={{ marginBottom: 20 }}><GoldDivider width={200} /></div>
        {event.venue_name && (
          <div style={{ ...serifI, fontSize: 20, fontWeight: 700, color: INK, marginBottom: 8 }}>
            {event.venue_name}
          </div>
        )}
        {event.venue_address && (
          <div style={{ ...serif, fontSize: 15, color: INK, opacity: 0.7, marginBottom: 26, lineHeight: 1.6 }}>
            {event.venue_address}
          </div>
        )}
      </FadeUp>

      {event.maps_photo && (
        <FadeUp delay={0.15}>
          <img
            src={event.maps_photo}
            alt={event.venue_name}
            style={{
              width: "100%", maxWidth: 440, height: 250, objectFit: "cover",
              borderRadius: 8, display: "block", margin: "0 auto 24px",
              border: `2px solid ${GOLD}`,
              boxShadow: "0 10px 30px rgba(42,23,16,0.18)",
            }}
          />
        </FadeUp>
      )}

      {event.venue_map_url && (
        <FadeUp delay={0.25}>
          <a
            href={normalizeUrl(event.venue_map_url)}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              background: `linear-gradient(140deg, ${GOLD_LT}, ${GOLD})`,
              color: DEEP, ...serif, fontSize: 15, fontWeight: 700,
              padding: "12px 36px", borderRadius: 30, textDecoration: "none",
              boxShadow: "0 6px 18px rgba(200,150,43,0.38)",
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
function T21Request() {
  const icons = [
    { emoji: "👑", label: "Гүнж, ханхүү" },
    { emoji: "🌹", label: "Алт, улаан өнгө" },
    { emoji: "🎂", label: "Бялууны цаг" },
    { emoji: "📸", label: "Дурсамж хамтдаа" },
  ];

  return (
    <div style={{ background: DEEP }}>
      <WavyTop fill={DEEP} />
      <div style={{ background: DEEP, padding: "46px 32px 56px", textAlign: "center" }}>
        <FadeUp>
          <div style={{ ...serifI, fontSize: 32, color: CREAM, marginBottom: 12 }}>Бяцхан хүсэлт</div>
          <div style={{ marginBottom: 30 }}><GoldDivider color={GOLD_LT} width={200} /></div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 30, flexWrap: "wrap" }}>
            {icons.map(({ emoji, label }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 76 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: "50%",
                  background: "rgba(240,209,131,0.10)",
                  border: `1px solid ${GOLD}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                }}>
                  {emoji}
                </div>
                <span style={{ ...serif, fontSize: 10, color: "rgba(255,249,239,0.7)", letterSpacing: "0.04em", lineHeight: 1.4 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <p style={{ ...serif, fontSize: 16, color: CREAM, maxWidth: 360, margin: "0 auto", lineHeight: 1.85 }}>
            Үлгэрийн энэ өдрийг хамтдаа бүтээж, бяцхан гүнжийн маань
            хамгийн анхны төрсөн өдрийг дурсамж дүүрэн өнгөрүүлье.
          </p>
        </FadeUp>

        <FadeUp delay={0.3}>
          <div style={{ marginTop: 30, display: "flex", justifyContent: "center" }}>
            <EnchantedRose size={110} opacity={0.9} />
          </div>
        </FadeUp>
      </div>
      <WavyBottom fill={CREAM} />
    </div>
  );
}

// ─── Ерөөл (wishes) ──────────────────────────────────────────────────────────
function T21Wishes({ eventId }: { eventId: string }) {
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
    border: `1px solid rgba(200,150,43,0.45)`,
    borderRadius: 8, ...serif, fontSize: 15, color: INK,
    background: "white", boxSizing: "border-box", outline: "none",
  };

  return (
    <div style={{ background: CREAM, padding: "52px 32px 60px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -30, opacity: 0.07, pointerEvents: "none" }}>
        <EnchantedRose size={200} />
      </div>

      <FadeUp>
        <div style={{ ...serifI, fontSize: 32, color: ROSE, marginBottom: 10, textAlign: "center" }}>
          Ерөөлийн дэвтэр
        </div>
        <div style={{ marginBottom: 14 }}><GoldDivider width={200} /></div>
        <p style={{ ...serif, fontSize: 14, color: INK, opacity: 0.65, textAlign: "center", marginBottom: 28 }}>
          Бяцхан үрд минь ерөөлийн үгээ үлдээнэ үү
        </p>

        {sent ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", padding: "26px 0" }}>
            <div style={{ ...serifI, fontSize: 26, color: ROSE, marginBottom: 10 }}>Баярлалаа!</div>
            <p style={{ ...serif, fontSize: 15, color: INK, opacity: 0.75, lineHeight: 1.7 }}>
              Таны ерөөлийг хүлээн авлаа.
            </p>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 420, margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div>
              <label style={{ ...serif, fontSize: 13, color: INK, opacity: 0.65, display: "block", marginBottom: 6 }}>
                Нэр
              </label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Нэрээ бичнэ үү" style={inputStyle} />
            </div>
            <div>
              <label style={{ ...serif, fontSize: 13, color: INK, opacity: 0.65, display: "block", marginBottom: 6 }}>
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
                background: `linear-gradient(140deg, ${GOLD_LT}, ${GOLD})`,
                color: DEEP, border: "none", borderRadius: 8,
                ...serif, fontSize: 16, fontWeight: 700,
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
function T21RSVP({ eventId, slug }: { eventId: string; slug?: string }) {
  const maxGuests = (slug && MAX_GUESTS[slug]) ?? 20;
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
    border: "1px solid rgba(240,209,131,0.35)",
    background: "transparent", color: CREAM,
    ...serif, fontSize: 20, lineHeight: 1, cursor: "pointer",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px",
    border: "1px solid rgba(240,209,131,0.4)",
    borderRadius: 6, ...serif, fontSize: 15, color: INK,
    background: "white", boxSizing: "border-box", outline: "none",
  };

  return (
    <div style={{ background: DEEP, padding: "56px 32px", textAlign: "center" }}>
      <FadeUp>
        <div style={{ ...serifI, fontSize: 32, color: CREAM, marginBottom: 12 }}>Ирцээ бүртгүүлэх</div>
        <div style={{ marginBottom: 16 }}><GoldDivider color={GOLD_LT} width={200} /></div>
        <p style={{ ...serif, fontSize: 16, color: "rgba(255,249,239,0.8)", maxWidth: 380, margin: "0 auto 30px", lineHeight: 1.7 }}>
          Баярын өдрөөс өмнө бүртгэлээ хийнэ үү.
        </p>

        {done ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} style={{ maxWidth: 420, margin: "0 auto" }}>
            <div style={{ ...serifI, fontSize: 28, color: GOLD_LT, marginBottom: 10 }}>Баярлалаа!</div>
            <p style={{ ...serif, fontSize: 16, color: "rgba(255,249,239,0.85)", lineHeight: 1.75 }}>
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

            <p style={{ ...serif, fontSize: 15, color: CREAM, marginBottom: 10 }}>Та ирэх үү?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {[
                { val: true,  label: "Тийм, заавал ирнэ" },
                { val: false, label: "Харамсалтай нь очиж чадахгүй" },
              ].map(({ val, label }) => (
                <label
                  key={String(val)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                    ...serif, fontSize: 15, color: CREAM,
                    background: attending === val ? "rgba(240,209,131,0.14)" : "transparent",
                    border: `1px solid ${attending === val ? GOLD : "rgba(240,209,131,0.25)"}`,
                    borderRadius: 6, padding: "11px 14px", transition: "all 0.25s",
                  }}
                >
                  <input
                    type="radio"
                    name="attending"
                    checked={attending === val}
                    onChange={() => setAttending(val)}
                    style={{ accentColor: GOLD, width: 16, height: 16 }}
                  />
                  {label}
                </label>
              ))}
            </div>

            {/* Хүний тоо — "Ирэхгүй" сонгосон үед хэрэггүй тул нуана */}
            {attending !== false && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ ...serif, fontSize: 15, color: CREAM, marginBottom: 10 }}>
                  Хэдүүлээ ирэх вэ?
                  {maxGuests < 20 && <span style={{ opacity: 0.7 }}> (дээд тал нь {maxGuests})</span>}
                </p>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <button onClick={() => setGuests((g) => Math.max(1, g - 1))} style={counterBtn} aria-label="Хасах">−</button>
                  <div style={{
                    ...serif, fontSize: 18, color: CREAM,
                    width: 64, height: 44,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderTop: "1px solid rgba(240,209,131,0.35)",
                    borderBottom: "1px solid rgba(240,209,131,0.35)",
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
                background: `linear-gradient(140deg, ${GOLD_LT}, ${GOLD})`,
                color: DEEP, border: "none", borderRadius: 8,
                ...serif, fontSize: 17, fontWeight: 700,
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
function T21Footer({ event }: { event: EventData }) {
  const name = event.person1_name || "Белла";
  const age  = AGE[event.slug];
  const family = FOOTER_FAMILY[event.slug];
  const dressNote = DRESS_NOTE[event.slug];
  // Үндсэндээ gallery_photos-ийн эхний зураг гарна. Энд бүртгэсэн slug дээр
  // цомгийн дарааллыг хөндөлгүйгээр өөр зураг тавина.
  const footerImg = FOOTER_IMAGE[event.slug] || event.gallery_photos?.[0];

  return (
    <div style={{ background: DEEP, padding: "0 32px 76px", textAlign: "center" }}>
      <WavyTop fill={DEEP} />

      {footerImg && (
        <FadeUp>
          <img
            src={footerImg}
            alt={name}
            style={{
              width: "88%", maxWidth: 380, height: "auto",
              borderRadius: 12, display: "block", margin: "8px auto 30px",
              border: `3px solid ${GOLD}`,
              boxShadow: "0 14px 40px rgba(0,0,0,0.4)",
            }}
          />
        </FadeUp>
      )}

      <FadeUp delay={0.12}>
        <div style={{ ...serifI, fontSize: 30, color: CREAM, marginBottom: 14, lineHeight: 1.35 }}>
          Таньтай уулзахыг тэсэн ядан хүлээж байна!
        </div>
        {dressNote && (
          <p style={{
            ...serif, fontSize: 16, color: GOLD_LT, opacity: 0.95,
            maxWidth: 340, margin: "0 auto 18px", lineHeight: 1.8,
          }}>
            {dressNote}
          </p>
        )}
        <GoldDivider color={GOLD_LT} width={200} />
        <div style={{ ...serifI, fontSize: 24, color: GOLD_LT, marginTop: 16 }}>
          {name}{age ? " · " + age + " нас" : ""}
        </div>

        {family && (
          <div style={{ marginTop: 22 }}>
            {family.lines.map((line) => (
              <div key={line} style={{ ...serif, fontSize: 16, color: CREAM, opacity: 0.85, lineHeight: 1.9 }}>
                {line}
              </div>
            ))}
            {family.phones && family.phones.length > 0 && (
              <div style={{ ...serif, fontSize: 16, color: CREAM, opacity: 0.85, marginTop: 12 }}>
                Утас:{" "}
                {family.phones.map((tel, i) => (
                  <span key={tel}>
                    {i > 0 && ", "}
                    <a href={`tel:${tel}`} style={{ color: GOLD_LT, textDecoration: "none" }}>{tel}</a>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </FadeUp>

      <FadeUp delay={0.2}>
        <div style={{ marginTop: 34, display: "flex", justifyContent: "center", opacity: 0.55 }}>
          <EnchantedRose size={92} />
        </div>
      </FadeUp>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
export default function Template21({ event }: { event: EventData }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    <div style={{ maxWidth: 523, margin: "0 auto", fontFamily: "'PT Serif', serif", overflowX: "hidden", background: CREAM }}>
      {/* Дугтуй нээгдэх видео — position:fixed, ард нь урилга ачаалагдаж,
          видео бүдгэрэхэд илэрнэ */}
      <VideoIntro audioRef={audioRef} />
      <MagicOverlay />

      <T21Hero event={event} />
      <T21Letter event={event} />
      <T21Gallery event={event} />
      <T21Countdown event={event} />
      {!HIDE_SCHEDULE.has(event.slug) && <T21Schedule event={event} />}
      <T21Location event={event} />
      <T21Request />
      {!HIDE_WISHES.has(event.slug) && <T21Wishes eventId={event.id} />}
      {!HIDE_RSVP.has(event.slug) && <T21RSVP eventId={event.id} slug={event.slug} />}
      <T21Footer event={event} />

      {event.music_url && <MusicPlayer src={event.music_url} audioRef={audioRef} />}
      <Toaster />
    </div>
  );
}
