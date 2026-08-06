import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { EventData } from "../../types/event";
import { getPoemLines } from "../../lib/eventContent";
import { normalizeUrl } from "../../lib/url";

// ─── palette ─────────────────────────────────────────────────────────────────
const CREAM = "#F7F3EC";
const IVORY = "#FBF8F2";
const GOLD  = "#B68D5A";
const INK   = "#2B2A28";

// ─── font helpers ─────────────────────────────────────────────────────────────
const display = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 } as const;
const script  = { fontFamily: "'Pinyon Script', cursive", fontWeight: 400 } as const;

// Жижиг uppercase tracked label — энэ загварын гарын үсэг
const label: React.CSSProperties = {
  ...display,
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.35em",
  textTransform: "uppercase",
};

// Монгол нэрийг овогтой бичдэг тул монограмд ӨӨРИЙН нэрний эхний үсгийг авна.
// Хоёр бичлэгийг ч дэмжинэ:
//   "Бямбадоржийн Дашхүү" → "Д"   (сүүлийн үг)
//   "У.Тамир"             → "Т"   (цэгийн дараах хэсэг)
function initialOf(name: string, fallback: string) {
  const s = (name || "").trim();
  if (!s) return fallback;
  const afterDot = (s.split(".").pop() || s).trim();
  const own = afterDot.split(/\s+/).filter(Boolean).pop() || afterDot;
  return own ? own.charAt(0).toUpperCase() : fallback;
}

// Картан дээрх "Газар" нүдэнд гарах газрын нэр (шууд бичсэн)
const DEFAULT_VENUE = "Gunj Resort";
// Hero дээр venue_name хоосон үед харагдах байршил
const DEFAULT_LOCATION = "Дархан-Уул аймаг, Хонгор сум";

// Эдгээр slug дээр "Газар" нүд нь Gunj Resort default-ийн оронд
// тухайн event-ийн өөрийн venue_name-ийг харуулна.
const VENUE_FROM_EVENT = new Set<string>(["batsukh-sumya", "tamir-nymdawaa2"]);

// Slug бүрийн холбоо барих утас (events хүснэгтэд багана байхгүй тул шууд бичсэн).
const CONTACT_PHONES: Record<string, string[]> = {
  "batsukh-sumya": ["98191922", "94706067"],
  "tamir-nymdawaa2": ["99335300", "99963114"],
};
const DEFAULT_PHONES = ["89733377", "88020013"];

// Footer-ийн монограм ("Ч & Б") болон хосын нэрийг харуулахгүй slug-ууд.
const HIDE_FOOTER_NAMES = new Set<string>(["tamir-nymdawaa2"]);

// Footer дээр огнооны дээр гарах "Хүндэтгэсэн" нэрс — зөвхөн бүртгэсэн slug дээр.
const FOOTER_HOSTS: Record<string, string[]> = {
  "tamir-nymdawaa2": ["Хүндэтгэсэн:", "У.Тамир", "Э.Нямдаваа", "Хүү: Т.Артасэд", "Хүү: Т.Хас"],
};

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600";

const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800",
];

// ─── Global CSS (Ken Burns + responsive breakpoints) ──────────────────────────
// Inline style-аар media query бичих боломжгүй тул энэ хэсгийг class-аар шийднэ.
const T16_CSS = `
@keyframes t16-kenburns {
  from { transform: scale(1); }
  to   { transform: scale(1.15); }
}
.t16-kenburns {
  animation: t16-kenburns 24s ease-out forwards;
}
@keyframes t16-bob {
  0%, 100% { transform: translateY(0); opacity: 0.9; }
  50%      { transform: translateY(8px); opacity: 0.5; }
}
.t16-bob { animation: t16-bob 2.4s ease-in-out infinite; }

.t16-info {
  display: grid;
  grid-template-columns: 1fr;
}
.t16-info > * + * {
  border-top: 1px solid rgba(182,141,90,0.28);
}
@media (min-width: 768px) {
  .t16-info { grid-template-columns: repeat(3, 1fr); }
  .t16-info > * + * {
    border-top: none;
    border-left: 1px solid rgba(182,141,90,0.28);
  }
}
.t16-attend { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* Intro зургийн эгнээ — утсан дээр 2x2, дэлгэц дээр 4 багана */
.t16-photo-strip {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  max-width: 420px;
  margin: 0 auto;
}
@media (min-width: 768px) {
  .t16-photo-strip {
    grid-template-columns: repeat(4, 1fr);
    gap: 22px;
    max-width: 1180px;
  }
}
.t16-field:focus { border-bottom-color: ${GOLD} !important; }
.t16-textarea:focus { border-color: ${GOLD} !important; }
`;

// ─── Scroll reveal ─────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, style = {} }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Нимгэн алтан зурвас ──────────────────────────────────────────────────────
function GoldRule({ width = 64, color = GOLD, margin = "18px auto" }: {
  width?: number; color?: string; margin?: string;
}) {
  return <div style={{ width, height: 1, background: color, margin, opacity: 0.7 }} />;
}

// ─── Section гарчгийн блок (label → зурвас → гарчиг) ──────────────────────────
function SectionHead({ eyebrow, title, scriptWord, color = INK }: {
  eyebrow: string; title: string; scriptWord?: string; color?: string;
}) {
  return (
    <Reveal>
      <div style={{ textAlign: "center" }}>
        <div style={{ ...label, color: GOLD }}>{eyebrow}</div>
        <GoldRule />
        <h2 style={{
          ...display,
          fontSize: "clamp(34px, 7vw, 52px)",
          color,
          margin: 0,
          lineHeight: 1.2,
        }}>
          {title}
          {scriptWord && (
            <>
              {" "}
              <span style={{ ...script, color: GOLD, fontSize: "1.15em" }}>{scriptWord}</span>
            </>
          )}
        </h2>
      </div>
    </Reveal>
  );
}

// ─── Гоёл чимэглэлийн цэцэг (булангуудад) ─────────────────────────────────────
function BotanicalSprig({ size = 200, color = GOLD, flip = false }: {
  size?: number; color?: string; flip?: boolean;
}) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 200 200" fill="none"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20 180 C60 140, 90 100, 120 40" stroke={color} strokeWidth="1.2" fill="none" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const t = 0.12 + i * 0.15;
        const x = 20 + (120 - 20) * t;
        const y = 180 - (180 - 40) * t * (1 - t * 0.35);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${-40 + i * 9})`}>
            <ellipse cx="0" cy="-13" rx="6.5" ry="15" stroke={color} strokeWidth="1" fill="none" />
            <ellipse cx="0" cy="13" rx="6.5" ry="15" stroke={color} strokeWidth="1" fill="none" />
          </g>
        );
      })}
      {/* оройн цэцэг */}
      <g transform="translate(124 34)">
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <ellipse key={deg} cx="0" cy="0" rx="5.5" ry="13" stroke={color} strokeWidth="1" fill="none"
            transform={`rotate(${deg}) translate(0 -11)`} />
        ))}
        <circle cx="0" cy="0" r="3.2" fill={color} opacity="0.5" />
      </g>
    </svg>
  );
}

// ─── Preloader / Intro ────────────────────────────────────────────────────────
function T16Intro({ event, onDone }: { event: EventData; onDone: () => void }) {
  const [gone, setGone] = useState(false);
  const img = event.main_image || FALLBACK_HERO;

  const i1 = initialOf(event.person1_name, "Д");
  const i2 = initialOf(event.person2_name || "", "С");

  useEffect(() => {
    const t = setTimeout(() => { setGone(true); onDone(); }, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: gone ? 0 : 1 }}
      transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: INK,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        pointerEvents: gone ? "none" : "auto",
      }}
      onAnimationComplete={() => { if (gone) setGone(true); }}
    >
      <motion.img
        src={img}
        alt=""
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 0.45, scale: 1 }}
        transition={{ duration: 2.4, ease: "easeOut" }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.6, delay: 0.4, ease: "easeOut" }}
        style={{ position: "relative", textAlign: "center", color: CREAM }}
      >
        <div style={{ ...display, fontSize: 40, letterSpacing: "0.08em" }}>
          {i1} <span style={{ ...script, color: GOLD, fontSize: 44 }}>&amp;</span> {i2}
        </div>
        <GoldRule width={90} margin="16px auto 0" />
      </motion.div>
    </motion.div>
  );
}

// ─── Зургийн дэлгэц (intro-гийн дараа 5 секунд харагдана) ─────────────────────
// Бүдгэрсэн ар дэвсгэр дээр 4 зураг эгнээнд гарч ирнэ. 5 секундын дараа
// автоматаар хаагдана; "Үргэлжлүүлэх" эсвэл × дарж эрт өнгөрч болно.
// Зургийн дэлгэцийг ("Үргэлжлүүлэх" товчтой) огт харуулахгүй slug-ууд.
const HIDE_PHOTO_INTRO = new Set<string>([
  "tamir-nymdawaa2",
]);

// Hero (эхний зураг) дээрх бүх бичвэрийг — нэр, огноо, байршил, countdown —
// нуух slug-ууд. Зөвхөн зураг харагдана.
const HIDE_HERO_TEXT = new Set<string>([
  "tamir-nymdawaa2",
]);

// Хуримын урилга биш тохиолдол (шинэ байрны цайллага гэх мэт). Section-ий
// гарчгийг сольж, footer-ийн "One Wedding" мөрийг нуухад ашиглана.
const HEAD_OVERRIDE: Record<string, { eyebrow: string; title: string; scriptWord: string }> = {
  "tamir-nymdawaa2": { eyebrow: "Хүндэтгэн урьж байна", title: "Шинэ байрны", scriptWord: "цайллага" },
};

function T16PhotoIntro({ event, onDone }: { event: EventData; onDone: () => void }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  const bg = event.main_image || FALLBACK_HERO;
  const photos = (event.gallery_photos?.length ? event.gallery_photos : FALLBACK_PHOTOS).slice(0, 4);

  const close = () => {
    if (exiting) return;
    setExiting(true);
    onDone();
    setTimeout(() => setVisible(false), 1000);
  };

  useEffect(() => {
    const t = setTimeout(close, 10000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: exiting ? 1 : 0.9, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: INK,
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      {/* Ар дэвсгэрийн том зураг — бага зэрэг зөөлрүүлсэн, тод харагдана */}
      <motion.img
        src={bg}
        alt=""
        initial={{ scale: 1.12 }}
        animate={{ scale: 1.04 }}
        transition={{ duration: 11, ease: "easeOut" }}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          filter: "blur(5px)",
        }}
      />
      {/* Зургууд болон товч уншигдахуйц байлгах хөнгөн давхарга */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(43,42,40,0.12)" }} />

      <div style={{
        position: "relative",
        width: "100%",
        padding: "24px",
        textAlign: "center",
      }}>
        <div className="t16-photo-strip">
          {photos.map((src, i) => (
            <motion.img
              key={i}
              src={src}
              alt=""
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.15 + i * 0.16, ease: [0.22, 1, 0.36, 1] }}
              style={{
                width: "100%",
                aspectRatio: "3 / 4",
                objectFit: "cover",
                display: "block",
                border: "5px solid rgba(255,255,255,0.92)",
                boxShadow: "0 10px 34px rgba(43,42,40,0.28)",
                boxSizing: "border-box",
              }}
            />
          ))}
        </div>

        <motion.button
          onClick={close}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
          style={{
            ...label,
            marginTop: 38,
            padding: "18px 46px",
            color: CREAM,
            background: "rgba(43,42,40,0.28)",
            border: `1px solid rgba(247,243,236,0.65)`,
            cursor: "pointer",
            backdropFilter: "blur(4px)",
          }}
        >
          Үргэлжлүүлэх
        </motion.button>
      </div>

      {/* Хаах товч */}
      <button
        onClick={close}
        aria-label="Хаах"
        style={{
          position: "absolute", top: 18, right: 22,
          width: 34, height: 34,
          background: "transparent",
          border: "none",
          color: CREAM,
          fontSize: 26,
          lineHeight: 1,
          cursor: "pointer",
          opacity: 0.85,
        }}
      >
        ×
      </button>
    </motion.div>
  );
}

// ─── Дууны товч (fixed, баруун доод булан) ────────────────────────────────────
function T16MusicToggle({ audioRef }: { audioRef: React.RefObject<HTMLAudioElement | null> }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setPlaying(true);
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
    <button
      onClick={toggle}
      aria-label={playing ? "Дуу унтраах" : "Дуу асаах"}
      style={{
        position: "fixed", bottom: 22, right: 22, zIndex: 1000,
        width: 48, height: 48, borderRadius: "50%",
        background: "rgba(43,42,40,0.72)",
        border: `1px solid ${GOLD}`,
        backdropFilter: "blur(6px)",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {playing ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6">
          <path d="M11 5 6 9H2v6h4l5 4V5z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6">
          <path d="M11 5 6 9H2v6h4l5 4V5z" />
          <path d="m17 9 5 6M22 9l-5 6" />
        </svg>
      )}
    </button>
  );
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function T16Countdown({ date, time }: { date: string; time: string }) {
  const target = new Date(`${date || "2030-01-01"}T${time || "00:00"}:00`).getTime();
  const calc = () => {
    const diff = Math.max(0, target - Date.now());
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff / 3600000) % 24),
      m: Math.floor((diff / 60000) % 60),
      s: Math.floor((diff / 1000) % 60),
    };
  };
  const [t, setT] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const cells = [
    { v: t.d, l: "Өдөр" },
    { v: t.h, l: "Цаг" },
    { v: t.m, l: "Минут" },
    { v: t.s, l: "Секунд" },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "clamp(4px, 2vw, 20px)",
      maxWidth: 420,
      margin: "0 auto",
    }}>
      {cells.map(({ v, l }) => (
        <div key={l} style={{ textAlign: "center" }}>
          <div style={{
            ...display,
            fontSize: "clamp(30px, 8vw, 46px)",
            color: "#FFFFFF",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}>
            {String(v).padStart(2, "0")}
          </div>
          <div style={{ ...label, fontSize: 10, color: "#FFFFFF", marginTop: 8 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function T16Hero({ event }: { event: EventData }) {
  const name1 = event.person1_name || "Болд";
  const name2 = event.person2_name || "Сарнай";
  const img = event.main_image || FALLBACK_HERO;
  const hideText = HIDE_HERO_TEXT.has(event.slug);

  const fmtDate = (d: string) => {
    const [y, m, day] = (d || "").split("-");
    if (!y || !m || !day) return d;
    return `${y} оны ${Number(m)} сарын ${Number(day)}`;
  };

  return (
    <header style={{
      position: "relative",
      // Бичвэргүй үед зургийг тайрахгүй, өөрийнх нь харьцаагаар бүтнээр
      // харуулна — тиймээс 100vh өндөр шаардахгүй.
      minHeight: hideText ? 0 : "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
      background: INK,
    }}>
      {/* Ken Burns ар дэвсгэр. hideText үед zoom хийвэл зураг тайрагдах тул
          энгийн, бүтэн харагдах зураг болгоно. */}
      <img
        className={hideText ? undefined : "t16-kenburns"}
        src={img}
        alt={`${name1} & ${name2}`}
        style={hideText ? {
          display: "block",
          width: "100%", height: "auto",
        } : {
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          transformOrigin: "center",
        }}
      />
      {/* Текстийг тод харуулах ink gradient. Бичвэргүй үед зургийг бүрхэхгүй. */}
      {!hideText && (
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(to bottom,
            rgba(43,42,40,0.40) 0%,
            rgba(43,42,40,0.30) 45%,
            rgba(43,42,40,0.60) 100%)`,
        }} />
      )}

      {/* Hero-гийн бүх бичвэр цагаан. Ар дэвсгэрийн зураг цайвар байж болох тул
          хөнгөн сүүдэр нэмж уншигдац хадгална. */}
      {!hideText && (
      <div style={{
        position: "relative",
        textAlign: "center",
        padding: "96px 24px",
        width: "100%",
        color: "#FFFFFF",
        textShadow: "0 2px 16px rgba(43,42,40,0.55)",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 2.6, ease: "easeOut" }}
        >
          {/* Овогтой бичигддэг тул нэр бүр тусдаа мөрөнд, & тэмдэггүй */}
          <div style={{
            ...display,
            fontSize: "clamp(30px, 7vw, 58px)",
            color: "#FFFFFF",
            lineHeight: 1.25,
            marginBottom: 20,
          }}>
            <div>{name1}</div>
            {name2 && <div>{name2}</div>}
          </div>

          <div style={{
            ...display,
            fontWeight: 500,
            fontSize: "clamp(23px, 5.6vw, 34px)",
            color: "#FFFFFF",
            letterSpacing: "0.08em",
          }}>
            {fmtDate(event.date)}
          </div>

          <div style={{
            ...label,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.22em",
            color: "#FFFFFF",
            marginTop: 16,
          }}>
            {/* Hero дээр байршил (аймаг/сум) — Supabase-аас */}
            {event.venue_name || DEFAULT_LOCATION}
          </div>

          <GoldRule width={110} margin="34px auto 34px" color="rgba(255,255,255,0.85)" />

          <T16Countdown date={event.date} time={event.time} />
        </motion.div>
      </div>
      )}

      {/* Scroll indicator */}
      <div className="t16-bob" style={{
        position: "absolute", bottom: 28, left: 0, right: 0,
        textAlign: "center",
        ...label, fontSize: 19, color: "#FFFFFF",
        textShadow: "0 2px 16px rgba(43,42,40,0.75)",
      }}>
        Доош ↓
      </div>
    </header>
  );
}

// ─── Celebration / Event дэлгэрэнгүй ──────────────────────────────────────────
function T16Celebration({ event }: { event: EventData }) {
  const fmtDate = (d: string) => {
    const [y, m, day] = (d || "").split("-");
    if (!y || !m || !day) return d;
    return `${y}.${m}.${day}`;
  };

  // Газрын нэр — ихэвчлэн шууд бичсэн default. Тодорхой slug дээр event-ийн
  // өөрийн venue_name-ийг харуулна.
  const venue = VENUE_FROM_EVENT.has(event.slug)
    ? (event.venue_name || DEFAULT_VENUE)
    : DEFAULT_VENUE;

  const poemLines = getPoemLines(event, [
    "Бидний амьдралын хамгийн онцгой өдрийг та бүхэнтэй хамт өнгөрүүлэхийг",
    "хүсэн, энэхүү урилгыг хүргэж байна.",
  ]);

  const cells = [
    { l: "Огноо", v: fmtDate(event.date) },
    { l: "Цаг",   v: event.time || "—" },
    { l: "Газар", v: venue },
  ];

  return (
    <section style={{
      background: CREAM,
      padding: "clamp(72px, 12vw, 120px) 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Гоёл чимэглэл — зүүн дээд / баруун доод булан */}
      <div style={{ position: "absolute", top: -30, left: -40, opacity: 0.18, pointerEvents: "none" }}>
        <BotanicalSprig size={230} flip />
      </div>
      <div style={{ position: "absolute", bottom: -40, right: -40, opacity: 0.18, pointerEvents: "none" }}>
        <BotanicalSprig size={230} />
      </div>

      <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
        {(() => {
          const h = HEAD_OVERRIDE[event.slug] ?? {
            eyebrow: "Хүндэтгэн урьж байна", title: "Хуримын", scriptWord: "ёслол",
          };
          return <SectionHead eyebrow={h.eyebrow} title={h.title} scriptWord={h.scriptWord} />;
        })()}

        <Reveal delay={0.1}>
          {/* events.poem байвал түүнийг мөр мөрөөр нь харуулна. Хоосон бол
              доорх үндсэн текст гарна (хуучин урилгууд хэвээрээ). */}
          <div style={{
            ...display,
            fontWeight: 400,
            fontSize: "clamp(19px, 4.2vw, 23px)",
            color: INK,
            opacity: 0.92,
            lineHeight: 1.85,
            textAlign: "center",
            maxWidth: 540,
            margin: "28px auto clamp(44px, 8vw, 64px)",
          }}>
            {poemLines.map((line, i) =>
              line === ""
                ? <div key={i} style={{ height: "0.9em" }} />
                : <div key={i}>{line}</div>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="t16-info" style={{
            border: `1px solid rgba(182,141,90,0.28)`,
            background: IVORY,
          }}>
            {cells.map(({ l, v }) => (
              <div key={l} style={{ padding: "30px 20px", textAlign: "center" }}>
                <div style={{ ...label, color: GOLD, marginBottom: 12 }}>{l}</div>
                <div style={{
                  ...display,
                  fontWeight: 500,
                  fontSize: "clamp(23px, 5vw, 30px)",
                  lineHeight: 1.35,
                  color: INK,
                }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {event.venue_address && (
          <Reveal delay={0.2}>
            {/* Хаяг — зочид хамгийн түрүүнд уншдаг мэдээлэл тул тодотгосон */}
            <p style={{
              ...display,
              fontWeight: 500,
              fontSize: "clamp(18px, 4vw, 22px)",
              color: INK,
              textAlign: "center",
              lineHeight: 1.7,
              letterSpacing: "0.01em",
              margin: "30px auto 0",
              maxWidth: 480,
            }}>
              {event.venue_address}
            </p>
          </Reveal>
        )}

        {event.venue_map_url && (
          <Reveal delay={0.25}>
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <a
                href={normalizeUrl(event.venue_map_url)}
                target="_blank"
                rel="noreferrer"
                style={{
                  ...label,
                  display: "inline-block",
                  color: GOLD,
                  border: `1px solid ${GOLD}`,
                  padding: "16px 34px",
                  textDecoration: "none",
                }}
              >
                Газрын зураг харах
              </a>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

// ─── Map ──────────────────────────────────────────────────────────────────────
// "Газрын зураг харах" товчны линк дээрх яг байршлыг embed-д харуулна.
// Google Maps URL-аас координатыг олох боломжтой бүх түгээмэл хэлбэрийг шалгана;
// олдохгүй бол (жишээ нь goo.gl богино линк) хаяг/нэрээр хайна.
function mapEmbedQuery(event: EventData): string | null {
  const url = event.venue_map_url || "";
  const coord = "(-?\\d+\\.\\d+)";

  // Чиглэлийн (/dir/) линк дээр эхний цэг нь эхлэл, сүүлийнх нь ЗОРИЛГО.
  // Энэ тохиолдолд `@...` нь зөвхөн зургийн төв тул түүнийг ашиглаж болохгүй.
  const dir = url.match(/\/dir\/(.+?)(?:\/@|\/data|\?|$)/);
  if (dir) {
    const segs = dir[1].split("/").filter(Boolean);
    const dest = segs[segs.length - 1];
    if (dest && new RegExp(`^${coord},${coord}$`).test(dest)) return dest;
    if (dest) return decodeURIComponent(dest.replace(/\+/g, " "));
  }

  const patterns = [
    new RegExp(`@${coord},${coord}`),              // .../@47.918,106.917,17z
    new RegExp(`!3d${coord}!4d${coord}`),          // .../data=...!3d47.918!4d106.917
    new RegExp(`[?&](?:q|query|ll|daddr)=${coord}%2C${coord}`, "i"),
    new RegExp(`[?&](?:q|query|ll|daddr)=${coord},${coord}`, "i"),
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return `${m[1]},${m[2]}`;
  }
  // Координат байхгүй ч /place/НЭР хэлбэртэй бол тэр нэрээр хайна
  const place = url.match(/\/place\/([^/@?]+)/);
  if (place) return decodeURIComponent(place[1].replace(/\+/g, " "));

  return event.venue_address || event.venue_name || null;
}

function T16Map({ event }: { event: EventData }) {
  const query = mapEmbedQuery(event);
  if (!query && !event.maps_photo) return null;

  return (
    <section style={{ background: CREAM, padding: "0 24px clamp(72px, 12vw, 110px)" }}>
      <Reveal>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          border: `1px solid rgba(182,141,90,0.28)`,
          padding: 8, background: IVORY,
        }}>
          {query ? (
            <iframe
              title="Байршил"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`}
              width="100%"
              height={380}
              style={{ border: 0, display: "block" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <img
              src={event.maps_photo}
              alt={event.venue_name}
              style={{ width: "100%", height: 380, objectFit: "cover", display: "block" }}
            />
          )}
        </div>
      </Reveal>
    </section>
  );
}

// ─── RSVP ─────────────────────────────────────────────────────────────────────
function T16RSVP({ eventId }: { eventId: string }) {
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [guests, setGuests]     = useState(1);
  const [message, setMessage]   = useState("");
  const [sending, setSending]   = useState(false);
  const [done, setDone]         = useState(false);

  const submit = async () => {
    if (!name.trim()) { toast.error("Нэрээ оруулна уу."); return; }
    if (attending === null) { toast.error("Ирэх эсэхээ сонгоно уу."); return; }
    setSending(true);

    // Demo горимд бодит DB руу бичихгүй (event id нь uuid биш)
    if (eventId === "demo") {
      setSending(false);
      setDone(true);
      return;
    }

    const note = attending ? message.trim() : `[Ирэхгүй] ${message.trim()}`.trim();
    const { error } = await supabase.from("rsvp").insert({
      event_id: eventId,
      name: name.trim(),
      phone: phone.trim() || null,
      guests: attending ? guests : 0,
      message: note || null,
    });

    setSending(false);
    if (error) { toast.error("Алдаа гарлаа. Дахин оролдоно уу."); return; }
    setDone(true);
  };

  const fieldStyle: React.CSSProperties = {
    ...display,
    width: "100%",
    fontSize: 17,
    color: INK,
    background: "transparent",
    border: "none",
    borderBottom: `1px solid rgba(43,42,40,0.22)`,
    padding: "12px 2px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.3s",
  };

  const counterBtn: React.CSSProperties = {
    width: 44, height: 44,
    border: `1px solid rgba(43,42,40,0.22)`,
    background: "transparent",
    color: INK,
    ...display,
    fontSize: 20,
    cursor: "pointer",
    lineHeight: 1,
  };

  return (
    <section style={{ background: "#FFFFFF", padding: "clamp(72px, 12vw, 120px) 24px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <SectionHead eyebrow="Ирц баталгаажуулах" title="Хүлээж" scriptWord="байна" />

        {done ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: "center", marginTop: 48 }}
          >
            <div style={{ ...script, fontSize: 44, color: GOLD, marginBottom: 12 }}>Баярлалаа</div>
            <p style={{ ...display, fontSize: 17, color: INK, opacity: 0.7, lineHeight: 1.8 }}>
              Таны хариуг хүлээн авлаа. Тантай уулзахыг тэсэн ядан хүлээж байна.
            </p>
          </motion.div>
        ) : (
          <Reveal delay={0.1}>
            <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 30 }}>
              <div>
                <div style={{ ...label, color: GOLD, marginBottom: 6 }}>Таны нэр</div>
                <input
                  className="t16-field"
                  style={fieldStyle}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Нэрээ бичнэ үү"
                />
              </div>

              <div>
                <div style={{ ...label, color: GOLD, marginBottom: 6 }}>Утасны дугаар</div>
                <input
                  className="t16-field"
                  style={fieldStyle}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                />
              </div>

              <div>
                <div style={{ ...label, color: GOLD, marginBottom: 12 }}>Ирэх боломжтой юу?</div>
                <div className="t16-attend">
                  {[
                    { val: true,  text: "Баяртайгаар ирнэ" },
                    { val: false, text: "Харамсалтай нь чадахгүй" },
                  ].map(({ val, text }) => {
                    const active = attending === val;
                    return (
                      <button
                        key={String(val)}
                        onClick={() => setAttending(val)}
                        style={{
                          ...display,
                          fontSize: 15,
                          padding: "20px 12px",
                          cursor: "pointer",
                          color: INK,
                          background: active ? CREAM : "transparent",
                          border: `1px solid ${active ? GOLD : "rgba(43,42,40,0.18)"}`,
                          transition: "all 0.3s",
                          lineHeight: 1.5,
                        }}
                      >
                        {text}
                      </button>
                    );
                  })}
                </div>
              </div>

              {attending !== false && (
                <div>
                  <div style={{ ...label, color: GOLD, marginBottom: 12 }}>Зочдын тоо</div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button style={counterBtn} onClick={() => setGuests((g) => Math.max(1, g - 1))}>−</button>
                    <div style={{
                      ...display,
                      width: 64, height: 44,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 19, color: INK,
                      borderTop: `1px solid rgba(43,42,40,0.22)`,
                      borderBottom: `1px solid rgba(43,42,40,0.22)`,
                    }}>
                      {guests}
                    </div>
                    <button style={counterBtn} onClick={() => setGuests((g) => Math.min(20, g + 1))}>+</button>
                  </div>
                </div>
              )}

              <div>
                <div style={{ ...label, color: GOLD, marginBottom: 6 }}>Захидал</div>
                <textarea
                  className="t16-textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Ерөөлийн үгээ үлдээнэ үү"
                  style={{
                    ...display,
                    width: "100%",
                    fontSize: 16,
                    color: INK,
                    background: "transparent",
                    border: `1px solid rgba(43,42,40,0.18)`,
                    padding: "14px",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    transition: "border-color 0.3s",
                  }}
                />
              </div>

              <button
                onClick={submit}
                disabled={sending}
                style={{
                  ...label,
                  width: "100%",
                  padding: "20px",
                  background: INK,
                  color: CREAM,
                  border: "none",
                  cursor: sending ? "wait" : "pointer",
                  opacity: sending ? 0.6 : 1,
                }}
              >
                {sending ? "Илгээж байна…" : "Илгээх"}
              </button>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function T16Footer({ event }: { event: EventData }) {
  const name1 = event.person1_name || "Болд";
  const name2 = event.person2_name || "Сарнай";
  const i1 = initialOf(name1, "Д");
  const i2 = initialOf(name2, "С");

  const fmtDate = (d: string) => {
    const [y, m, day] = (d || "").split("-");
    if (!y || !m || !day) return d;
    return `${y}.${m}.${day}`;
  };

  // Холбоо барих дугаарууд — events хүснэгтэд багана байхгүй тул slug бүрээр бичсэн
  const phones = CONTACT_PHONES[event.slug] || DEFAULT_PHONES;
  const hideNames = HIDE_FOOTER_NAMES.has(event.slug);
  const hosts = FOOTER_HOSTS[event.slug];

  const year = (event.date || "").split("-")[0] || "";

  return (
    <footer style={{
      background: INK,
      color: CREAM,
      padding: "clamp(64px, 11vw, 96px) 24px 40px",
      textAlign: "center",
    }}>
      <Reveal>
        {!hideNames && (
          <>
            <div style={{ ...display, fontSize: 34, letterSpacing: "0.06em" }}>
              {i1} <span style={{ ...script, color: GOLD, fontSize: 40 }}>&amp;</span> {i2}
            </div>

            <GoldRule width={80} margin="24px auto 28px" />

            {/* Овогтой бичигддэг тул нэр бүр тусдаа мөрөнд, & тэмдэггүй */}
            <div style={{ ...display, fontSize: "clamp(21px, 4.2vw, 28px)", lineHeight: 1.4, marginBottom: 14 }}>
              <div>{name1}</div>
              {name2 && <div>{name2}</div>}
            </div>
          </>
        )}

        {hosts && (
          <div style={{
            ...display,
            fontSize: "clamp(20px, 4.2vw, 26px)",
            lineHeight: 1.55,
            color: CREAM,
            marginBottom: 20,
          }}>
            {hosts.map((line) => <div key={line}>{line}</div>)}
          </div>
        )}

        <div style={{ ...label, fontSize: 14, letterSpacing: "0.24em", color: CREAM, opacity: 0.8, lineHeight: 1.9 }}>
          {fmtDate(event.date)}
          {event.venue_name && ` · ${event.venue_name}`}
        </div>

        <div style={{ marginTop: 34 }}>
          <div style={{ ...label, color: GOLD, marginBottom: 14 }}>
            Холбоо барих утасны дугаар
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 26, flexWrap: "wrap" }}>
            {phones.map((tel) => (
              <a
                key={tel}
                href={`tel:${tel}`}
                style={{
                  ...display,
                  fontSize: "clamp(19px, 4.4vw, 23px)",
                  letterSpacing: "0.06em",
                  color: CREAM,
                  textDecoration: "none",
                }}
              >
                {tel}
              </a>
            ))}
          </div>
        </div>
      </Reveal>

      <div style={{
        ...label, fontSize: 9, color: CREAM, opacity: 0.35,
        marginTop: 56,
      }}>
        © {year}{!HEAD_OVERRIDE[event.slug] && " · One Wedding"}
      </div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Template16({ event }: { event: EventData }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Монограм intro дууссаны дараа зургийн дэлгэц гарна
  const [introDone, setIntroDone] = useState(false);

  // Дуу шууд автоматаар эхэлнэ. Browser autoplay-г хоригловол хэрэглэгчийн
  // анхны хөдөлгөөн (tap / scroll / keydown) дээр асаана.
  useEffect(() => {
    if (!event.music_url) return;
    const startMusic = () => {
      const a = audioRef.current;
      if (!a) return;
      a.play().then(cleanup).catch(() => {});
    };
    const evts = ["pointerdown", "touchstart", "keydown", "scroll"] as const;
    const cleanup = () => evts.forEach((e) => window.removeEventListener(e, startMusic));
    startMusic();
    evts.forEach((e) => window.addEventListener(e, startMusic, { passive: true }));
    return cleanup;
  }, [event.music_url]);

  return (
    <div style={{ background: CREAM, overflowX: "hidden" }}>
      <style>{T16_CSS}</style>

      <T16Intro
        event={event}
        onDone={() => {
          audioRef.current?.play().catch(() => {});
          setIntroDone(true);
        }}
      />
      {introDone && !HIDE_PHOTO_INTRO.has(event.slug) && (
        <T16PhotoIntro event={event} onDone={() => audioRef.current?.play().catch(() => {})} />
      )}

      <T16Hero event={event} />
      <T16Celebration event={event} />
      <T16Map event={event} />
      <T16RSVP eventId={event.id} />
      <T16Footer event={event} />

      {event.music_url && (
        <>
          <audio ref={audioRef} loop src={event.music_url} preload="auto" />
          <T16MusicToggle audioRef={audioRef} />
        </>
      )}
      <Toaster />
    </div>
  );
}
