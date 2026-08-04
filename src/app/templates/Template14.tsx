import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { EventData } from "../../types/event";
import { getPoemLines, getSchedule } from "../../lib/eventContent";

// ─── Palette ──────────────────────────────────────────────────────────────────
const WAX      = "#28406B";
const GOLD_LT  = "#E8D9B0";
const GOLD     = "#B89A6B";
const CREAM    = "#F4EEDE";
const CREAM_HI = "#F8F2E4";
const INK      = "#2A2418";
const INK_SOFT = "#4A3F2C";
const INK_MUTE = "#6A573B";
const NIGHT    = "#0F1B33";
const NIGHT_LO = "#0B1426";

// ─── Font helpers ─────────────────────────────────────────────────────────────
// Pinyon Script кирилл үсэг дэмждэггүй тул монгол нэр браузерын default cursive
// фонтоор гарч, хэт өргөн болдог. Dancing Script-ийг завсрын fallback болгосон:
// латин нэр Pinyon-оор, кирилл нэр Dancing Script-ээр гоё гарна.
const pinyon = { fontFamily: "'Pinyon Script', 'Dancing Script', cursive" } as const;
const cg     = { fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif" } as const;
const cgI    = { fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif", fontStyle: "italic" as const } as const;
// "&" тэмдэгт — script/italic хэлбэргүй, энгийн
const amp    = { ...cg, fontStyle: "normal" as const, fontWeight: 400 } as const;
// Хосын нэр ба гарчиг — Pinyon Script кирилл дэмждэггүй тул citat-ийн italic Cormorant
const nameFont = cgI;

// venue_map_url дээр http(s):// угтвар байхгүй бол браузер харьцангуй зам гэж
// ойлгож сайтын хаяг дээр наадаг. Угтваргүй бол https:// нэмж бүтэн болгоно.
function normalizeUrl(u?: string) {
  if (!u) return u;
  const s = u.trim();
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

// "Б.Доржзовд" → "Д" (овгийн товчлолыг алгасаад өөрийн нэрний эхний үсэг)
function initialOf(name: string) {
  const s = (name || "").trim();
  if (!s) return "";
  const own = (s.split(".").pop() || s).trim();
  return (own.split(/\s+/)[0] || own).charAt(0).toUpperCase();
}

// ─── Paper SVG texture (no # chars so safe in data URI) ──────────────────────
const PAPER_TEX = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260' viewBox='0 0 260 260'><g fill='none' stroke='rgba(120,100,70,0.06)' stroke-width='0.5' stroke-linecap='round'><path d='M130 80 C 138 94 138 106 130 120 C 122 106 122 94 130 80 Z'/><path d='M130 140 C 138 154 138 166 130 180 C 122 166 122 154 130 140 Z'/><path d='M80 130 C 94 138 106 138 130 130 C 106 122 94 122 80 130 Z'/><path d='M130 130 C 154 138 166 138 180 130 C 166 122 154 122 130 130 Z'/></g></svg>")`;

// ─── Fallback photos ──────────────────────────────────────────────────────────
const FALLBACK = [
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1400",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200",
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
  "https://images.unsplash.com/photo-1525772764200-be829a350797?w=800",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200",
  "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=1400",
];

// ─── Scroll reveal ─────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, style = {} }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.9, delay, ease: "easeOut" }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Урт нэрийг хүрээндээ багтаах ─────────────────────────────────────────────
// `data-fit` атрибуттай span-уудын бодит өргөнийг хэмжээд, хамгийн урт нь
// хүрээнд багтах үсгийн хэмжээг тооцоолно. Нэрүүд ижил хэмжээтэй үлдэнэ.
function useFitText(key: string, maxSize: number, minSize = 22) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(maxSize);

  useLayoutEffect(() => {
    const fit = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const avail = wrap.clientWidth * 0.96; // хоёр талд бага зэрэг зай үлдээнэ
      const spans = Array.from(wrap.querySelectorAll<HTMLElement>("[data-fit]"));
      if (avail <= 0 || spans.length === 0) return;

      spans.forEach((s) => { s.style.fontSize = `${maxSize}px`; });
      const widest = Math.max(...spans.map((s) => s.scrollWidth));
      const next = widest > avail
        ? Math.max(minSize, Math.floor((maxSize * avail) / widest))
        : maxSize;
      spans.forEach((s) => { s.style.fontSize = `${next}px`; });
      setSize(next);
    };

    fit();
    window.addEventListener("resize", fit);
    // Фонт ачаалагдаж дуусмагц дахин хэмжинэ (эхний хэмжилт fallback фонтоор
    // хийгдсэн байж болзошгүй)
    document.fonts?.ready.then(fit).catch(() => {});
    return () => window.removeEventListener("resize", fit);
  }, [key, maxSize, minSize]);

  return { wrapRef, size };
}

// ─── Flourish divider ─────────────────────────────────────────────────────────
function Flourish({ light = false }: { light?: boolean }) {
  const c = light ? "rgba(232,217,176,0.6)" : WAX;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "32px auto" }}>
      <div style={{ height: 1, width: 70, background: `linear-gradient(90deg, transparent, ${c})`, opacity: 0.7 }} />
      <svg width="24" height="20" viewBox="0 0 100 40" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round">
        <path d="M10 20 Q 30 6 50 20 T 90 20" />
        <circle cx="50" cy="20" r="2.8" fill={c} stroke="none" />
      </svg>
      <div style={{ height: 1, width: 70, background: `linear-gradient(90deg, ${c}, transparent)`, opacity: 0.7 }} />
    </div>
  );
}

// ─── Eyebrow label ────────────────────────────────────────────────────────────
function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div style={{
      ...cg,
      fontWeight: 600,
      fontSize: 11,
      letterSpacing: "0.42em",
      textTransform: "uppercase" as const,
      color: light ? GOLD : WAX,
      textAlign: "center" as const,
      marginBottom: 4,
    }}>
      {children}
    </div>
  );
}

// ─── Paper section wrapper ────────────────────────────────────────────────────
function Paper({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      position: "relative",
      background: `${PAPER_TEX}, linear-gradient(180deg, ${CREAM_HI} 0%, ${CREAM} 100%)`,
      backgroundSize: "320px 320px, 100% 100%",
      color: INK,
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Video intro ──────────────────────────────────────────────────────────────
// Template11-тэй адил эхэнд тоглодог видео. Дуусахад ар талын дуу эхэлнэ.
const T14_INTRO_VIDEO_URL =
  "https://tdy-excellence-template.thedigitalyes.com/assets/intro-video-new-CeLMqoNn.mp4";

function T14VideoIntro({ audioRef }: { audioRef: React.RefObject<HTMLAudioElement | null> }) {
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
        src={T14_INTRO_VIDEO_URL}
        autoPlay muted playsInline preload="auto"
        onEnded={handleEnded}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    </motion.div>
  );
}

// ─── Music player ─────────────────────────────────────────────────────────────
function MusicPlayer({ audioRef }: { audioRef: React.RefObject<HTMLAudioElement | null> }) {
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
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 200 }}>
      <button
        onClick={toggle}
        aria-label="Toggle sound"
        style={{
          width: 48, height: 48,
          borderRadius: "50%",
          background: "rgba(15,27,51,0.65)",
          backdropFilter: "blur(10px) saturate(140%)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 4px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18)",
          color: "rgba(255,255,255,0.92)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}
      >
        {playing ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H3v6h3l5 4z"/>
            <path d="M15.5 8.5a5 5 0 0 1 0 7"/>
            <path d="M18.5 5.5a9 9 0 0 1 0 13"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H3v6h3l5 4z"/>
            <path d="M22 9l-6 6"/><path d="M16 9l6 6"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function T14Hero({ event }: { event: EventData }) {
  const name1 = event.person1_name || "Diana";
  const name2 = event.person2_name || "Richard";
  const heroImg = event.main_image || FALLBACK[0];
  const { wrapRef, size } = useFitText(`${name1}|${name2}`, 112, 30);

  return (
    <section style={{ position: "relative", minHeight: "100svh", background: "#1a1612", overflow: "hidden", color: "#fff" }}>
      {/* Background */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${heroImg})`,
        backgroundSize: "cover", backgroundPosition: "center",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.40) 100%)",
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 2,
        minHeight: "100svh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "80px 24px 100px",
        textAlign: "center",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          style={{ ...cg, fontWeight: 700, fontSize: 13, letterSpacing: "0.42em", textTransform: "uppercase", color: "#fff", marginBottom: 36, textShadow: "0 2px 12px rgba(0,0,0,0.75)" }}
        >
          Бид гэрлэж байна
        </motion.div>

        <motion.div
          ref={wrapRef}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, delay: 0.5 }}
          style={{ ...nameFont, width: "100%", lineHeight: 1.08, textShadow: "0 2px 22px rgba(0,0,0,0.55)" }}
        >
          <span data-fit style={{ display: "inline-block", whiteSpace: "nowrap", fontSize: size }}>{name1}</span>
          <span style={{
            display: "block",
            ...amp, fontSize: Math.max(20, Math.round(size * 0.32)),
            color: "rgba(255,255,255,0.9)", margin: "2px 0",
            letterSpacing: "0.02em", textShadow: "0 1px 6px rgba(0,0,0,0.4)",
          }}>&amp;</span>
          <span data-fit style={{ display: "inline-block", whiteSpace: "nowrap", fontSize: size }}>{name2}</span>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          style={{ marginTop: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
        >
          <div style={{ ...cg, fontWeight: 700, fontSize: 11, letterSpacing: "0.42em", textTransform: "uppercase", color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.75)" }}>
            Доошоо гүйлгэх
          </div>
          <motion.div
            animate={{ y: [0, 8, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            style={{ color: "rgba(255,255,255,0.7)", fontSize: 18 }}
          >
            ↓
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Verse / Invitation text ──────────────────────────────────────────────────
function T14Verse({ event }: { event: EventData }) {
  const name1 = event.person1_name || "Diana";
  const name2 = event.person2_name || "Richard";
  const { wrapRef, size } = useFitText(`${name1}|${name2}`, 92, 26);

  return (
    <Paper>
      <div style={{ padding: "80px 32px" }}>
        <FadeUp delay={0.1}><Flourish /></FadeUp>

        <FadeUp delay={0.2}>
          <div ref={wrapRef} style={{
            ...nameFont, color: WAX, width: "100%",
            lineHeight: 1.08, textAlign: "center", margin: "12px 0 20px",
          }}>
            <span data-fit style={{ display: "inline-block", whiteSpace: "nowrap", fontSize: size }}>{name1}</span>
            <span style={{
              display: "block", ...amp,
              fontSize: Math.max(18, Math.round(size * 0.3)),
              color: INK_MUTE, margin: "2px 0",
            }}>&amp;</span>
            <span data-fit style={{ display: "inline-block", whiteSpace: "nowrap", fontSize: size }}>{name2}</span>
          </div>
        </FadeUp>

        <FadeUp delay={0.3}>
          <p style={{
            ...cg, fontSize: 18, lineHeight: 1.85, color: INK_SOFT,
            textAlign: "center", letterSpacing: "0.02em", maxWidth: 400, margin: "0 auto",
          }}>
            {getPoemLines(event, [
              "Бидний амьдралын хамгийн нандин бөгөөд тусгай өдөр тохиож байна. Хайр, баяр хөөр, аз жаргал бялхсан энэхүү мартагдашгүй үдшийг бидэнтэй хамт хуваалцаж, баярыг минь хуваалцахыг урьж байна.",
            ]).map((line, i) =>
              line === ""
                ? <span key={i} style={{ display: "block", height: 14 }} />
                : <span key={i}>{line}{" "}</span>
            )}
          </p>
        </FadeUp>

        <FadeUp delay={0.4}>
          <p style={{ ...cgI, fontSize: 17, color: WAX, textAlign: "center", marginTop: 24, lineHeight: 1.7 }}>
            "Хоёр зүрх нэгдэхэд дэлхий бүхэл бүтэн болно."
          </p>
        </FadeUp>
      </div>
    </Paper>
  );
}

// ─── Date + Countdown ─────────────────────────────────────────────────────────
function T14DateCountdown({ event }: { event: EventData }) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(`${event.date}T${event.time || "16:00"}:00`).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setTime({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [event.date, event.time]);

  const pad = (n: number) => String(n).padStart(2, "0");

  const fmtDate = (d: string) => {
    const [y, m, day] = d.split("-");
    const months = ["Нэгдүгээр","Хоёрдугаар","Гуравдугаар","Дөрөвдүгээр","Тавдугаар","Зургадугаар","Долдугаар","Наймдугаар","Есдүгээр","Аравдугаар","Арван нэгдүгээр","Арван хоёрдугаар"];
    return { day: day, month: months[(parseInt(m) - 1)] || m, year: y };
  };

  const dt = fmtDate(event.date);
  const units = [
    { val: time.days,    label: "Өдөр" },
    { val: time.hours,   label: "Цаг" },
    { val: time.minutes, label: "Минут" },
    { val: time.seconds, label: "Секунд" },
  ];

  return (
    <Paper>
      <div style={{ padding: "72px 28px" }}>
        <FadeUp delay={0.1}>
          <div style={{ ...nameFont, color: WAX, fontSize: "clamp(28px, 7vw, 44px)", lineHeight: 1.15, textAlign: "center", marginTop: 8, marginBottom: 28 }}>
            Хурим хүртэлх хугацаа
          </div>
        </FadeUp>

        {/* Date display */}
        <FadeUp delay={0.2}>
          <div style={{
            border: `1px solid rgba(40,64,107,0.2)`,
            borderRadius: 4, padding: "24px 20px",
            textAlign: "center", marginBottom: 28,
            background: "rgba(255,250,235,0.5)",
          }}>
            <div style={{ ...cgI, color: WAX, fontSize: 52, lineHeight: 1 }}>{dt.day}</div>
            <div style={{ ...cg, fontWeight: 600, fontSize: 13, letterSpacing: "0.34em", textTransform: "uppercase", color: WAX, marginTop: 6 }}>
              {dt.month} · <span style={{ fontSize: 20 }}>{dt.year}</span>
            </div>
            {event.time && (
              <div style={{ ...cgI, color: WAX, fontSize: 18, marginTop: 10, opacity: 0.85 }}>
                Эхлэх цаг: {event.time}
              </div>
            )}
          </div>
        </FadeUp>

        {/* Countdown */}
        <FadeUp delay={0.3}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {units.map((u) => (
              <div key={u.label} style={{
                border: `1px solid rgba(40,64,107,0.22)`,
                background: "rgba(255,250,235,0.4)",
                borderRadius: 2, padding: "18px 6px 14px",
                textAlign: "center",
              }}>
                <div style={{ ...cgI, color: WAX, fontSize: 38, lineHeight: 1 }}>{pad(u.val)}</div>
                <div style={{ ...cg, fontSize: 10, letterSpacing: "0.32em", textTransform: "uppercase", color: INK_MUTE, marginTop: 6, fontWeight: 600 }}>
                  {u.label}
                </div>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </Paper>
  );
}

// ─── Schedule ─────────────────────────────────────────────────────────────────
const SCHEDULE_ICONS = [
  // Ring / ceremony
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <path d="M14 22 V 12 a 6 6 0 0 1 12 0 V 22"/>
    <path d="M10 22 H 30 V 30 a 4 4 0 0 1 -4 4 H 14 a 4 4 0 0 1 -4 -4 Z"/>
    <circle cx="20" cy="28" r="1.4" fill="currentColor"/>
  </svg>,
  // Champagne
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 8 H 30 L 22 22 V 32"/><path d="M10 8 L 18 22 V 32"/>
    <path d="M14 34 H 26"/>
    <circle cx="26" cy="12" r="1.6" fill="currentColor"/>
  </svg>,
  // Dinner
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8 V 22 a 4 4 0 0 0 4 4 V 32"/>
    <path d="M28 8 V 16 a 4 4 0 0 1 -4 4 V 32"/>
    <path d="M16 8 V 16"/><path d="M20 8 V 16"/>
  </svg>,
  // Music / dance
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 28 V 12 L 28 10 V 24"/>
    <ellipse cx="14" cy="28" rx="3" ry="2.4"/>
    <ellipse cx="26" cy="24" rx="3" ry="2.4"/>
  </svg>,
];

function T14Schedule({ event }: { event: EventData }) {
  // events.schedule хоосон үед харагдах үндсэн хөтөлбөр
  const items = getSchedule(event, [
    { time: "18:00", label: "Зочдоо хүлээн авах",              desc: "Урилгаар ирсэн хүндэт зочид хүрэлцэн ирнэ" },
    { time: "18:30", label: "Хуримын танхимд суудал эзлэх",    desc: "Зочид байраа эзлэн, ёслолд бэлтгэнэ" },
    { time: "19:00", label: "Нээлтийн үйл ажиллагаа",          desc: "Хуримын нээлтийн үйл ажиллагаа" },
    { time: "19:20", label: "Хуримын 1-р хэсэг",               desc: "Хосууд орж ирэх" },
    { time: "19:40", label: "Хүндэтгэлийн зоог",               desc: "Баярын зоог барина" },
    { time: "21:20", label: "Хуримын 2-р хэсэг",               desc: "Хуримын 2-р хэсэг эхлэнэ" },
    { time: "22:00", label: "Хосын анхны бүжиг",               desc: "Хосын анхны бүжиг" },
    { time: "22:10", label: "Баярын бялуу хуваах",             desc: "Баярын бялуу хуваах ёслол" },
    { time: "22:30", label: "Бусад үйл ажиллагаа",             desc: "Урлаг уран сайхан болон бусад үйл ажиллагаа явагдана" },
    { time: "23:45", label: "Албан ёсны арга хэмжээ өндөрлөнө", desc: "Албан ёсны арга хэмжээ дуусаж чөлөөт бүжигээр баяр үргэлжилнэ" },
  ]);

  return (
    <Paper>
      <div style={{ padding: "72px 24px" }}>
        <FadeUp delay={0.1}>
          <div style={{ ...pinyon, color: WAX, fontSize: "clamp(48px, 12vw, 72px)", lineHeight: 1.1, textAlign: "center", margin: "8px 0 36px" }}>
            Хөтөлбөр
          </div>
        </FadeUp>

        <div style={{ position: "relative" }}>
          {/* Vertical line */}
          <div style={{
            position: "absolute", left: 28, top: 24, bottom: 24,
            width: 1,
            background: `linear-gradient(180deg, transparent, rgba(40,64,107,0.3) 10%, rgba(40,64,107,0.3) 90%, transparent)`,
          }} />

          {items.map((item, i) => (
            <FadeUp key={i} delay={i * 0.12}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 32, paddingLeft: 0 }}>
                {/* Icon circle */}
                <div style={{
                  width: 56, height: 56, flexShrink: 0,
                  borderRadius: "50%",
                  background: "rgba(255,250,235,0.7)",
                  border: `1px solid rgba(40,64,107,0.28)`,
                  color: WAX,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", zIndex: 1,
                }}>
                  {/* DB-ээс ирсэн жагсаалт 4-өөс урт байвал icon-ууд давтагдана */}
                  <div style={{ width: 28, height: 28 }}>{SCHEDULE_ICONS[i % SCHEDULE_ICONS.length]}</div>
                </div>

                {/* Text */}
                <div style={{ paddingTop: 8 }}>
                  <div style={{ ...cgI, color: WAX, fontSize: 28, lineHeight: 1 }}>{item.time}</div>
                  <div style={{ ...cg, fontWeight: 700, fontSize: 11, letterSpacing: "0.36em", textTransform: "uppercase", color: WAX, marginTop: 4, marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ ...cg, fontSize: 15, fontWeight: 500, lineHeight: 1.55, color: INK }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </Paper>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
function T14Gallery({ event }: { event: EventData }) {
  // Оруулсан зургийг л харуулна. Огт байхгүй үед л fallback зургууд гарна.
  const provided = (event.gallery2_photos || []).filter(Boolean);
  const photos = provided.length ? provided : FALLBACK;
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <Paper>
      <div style={{ padding: "72px 24px" }}>
        <FadeUp delay={0.1}>
          <div style={{ ...nameFont, color: WAX, fontSize: "clamp(34px, 8.5vw, 52px)", lineHeight: 1.15, textAlign: "center", margin: "8px 0 28px" }}>
            Зургийн цомог
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          {/* Тэгш тор — нүд бүр ижил харьцаатай, зураг төвдөө багтана */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {photos.map((src, i) => (
              <div
                key={i}
                onClick={() => setLightbox(src)}
                style={{
                  aspectRatio: "3 / 4",
                  overflow: "hidden",
                  borderRadius: 2,
                  cursor: "pointer",
                  boxShadow: "0 2px 12px rgba(70,50,20,0.1)",
                }}
              >
                <img
                  src={src} alt=""
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
                />
              </div>
            ))}
          </div>
        </FadeUp>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.88)",
              zIndex: 9000,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 20,
            }}
          >
            <motion.img
              src={lightbox} alt=""
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ maxWidth: "100%", maxHeight: "88vh", objectFit: "contain", borderRadius: 4 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Paper>
  );
}

// ─── Venue ────────────────────────────────────────────────────────────────────
function T14Venue({ event }: { event: EventData }) {
  return (
    <Paper>
      <div style={{ padding: "72px 28px" }}>
        <FadeUp><Eyebrow>Байршил</Eyebrow></FadeUp>
        <FadeUp delay={0.1}>
          <div style={{ ...nameFont, color: WAX, fontSize: "clamp(34px, 9vw, 56px)", lineHeight: 1.15, textAlign: "center", margin: "8px 0 24px" }}>
            {event.venue_name || "Хуримын ордон"}
          </div>
        </FadeUp>

        {event.venue_address && (
          <FadeUp delay={0.2}>
            <p style={{ ...cg, fontSize: 17, lineHeight: 1.75, color: INK_SOFT, textAlign: "center", marginBottom: 24 }}>
              {event.venue_address}
            </p>
          </FadeUp>
        )}

        {event.maps_photo && (
          <FadeUp delay={0.3}>
            <div style={{
              aspectRatio: "4/3",
              overflow: "hidden", borderRadius: 4,
              border: `1px solid rgba(40,64,107,0.18)`,
              boxShadow: "0 2px 16px rgba(70,50,20,0.12)",
              marginBottom: 24,
            }}>
              <img src={event.maps_photo} alt={event.venue_name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </FadeUp>
        )}

        {event.venue_map_url && (
          <FadeUp delay={0.4}>
            <div style={{ textAlign: "center" }}>
              <a
                href={normalizeUrl(event.venue_map_url)}
                target="_blank" rel="noreferrer"
                style={{
                  display: "inline-block",
                  ...cg, fontSize: 12, letterSpacing: "0.4em", textTransform: "uppercase",
                  color: WAX, padding: "14px 28px",
                  border: `1px solid ${WAX}`,
                  textDecoration: "none",
                }}
              >
                Газрын зурагт нээх
              </a>
            </div>
          </FadeUp>
        )}
      </div>
    </Paper>
  );
}

// ─── RSVP ─────────────────────────────────────────────────────────────────────
function T14RSVP({ eventId }: { eventId: string }) {
  const [name, setName]             = useState("");
  const [phone, setPhone]           = useState("");
  const [attending, setAttending]   = useState<boolean | null>(null);
  const [guests, setGuests]         = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);

  const submit = async () => {
    if (!name.trim() || !phone.trim() || attending === null) return;
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
      phone: phone.trim(),
      guests: attending ? guests : 0,
    });
    setSubmitting(false);
    if (error) { toast.error("Алдаа гарлаа. Дахин оролдоно уу."); return; }
    setDone(true);
  };

  const label: React.CSSProperties = {
    ...cg, fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase",
    color: "rgba(244,238,222,0.55)", display: "block", marginBottom: 8,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 14px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(232,217,176,0.28)",
    borderRadius: 4,
    color: CREAM,
    ...cg, fontSize: 17,
    outline: "none",
    boxSizing: "border-box",
  };

  const counterBtn: React.CSSProperties = {
    width: 46, height: 46,
    border: "1px solid rgba(232,217,176,0.28)",
    background: "transparent",
    color: GOLD_LT,
    ...cg, fontSize: 22, lineHeight: 1,
    cursor: "pointer",
  };

  const canSubmit = !!name.trim() && !!phone.trim() && attending !== null;

  return (
    <section style={{
      background: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'><g fill='none' stroke='rgba(244,238,222,0.04)' stroke-width='0.5'><circle cx='110' cy='110' r='60'/><circle cx='110' cy='110' r='90'/></g></svg>"), linear-gradient(180deg, ${NIGHT} 0%, #1A2A48 100%)`,
      backgroundSize: "280px 280px, 100% 100%",
      color: CREAM,
      overflow: "hidden",
    }}>
      <div style={{ padding: "80px 28px" }}>
        <FadeUp>
          <div style={{
            ...cg, fontWeight: 600, fontSize: 11, letterSpacing: "0.42em",
            textTransform: "uppercase", color: GOLD, textAlign: "center", marginBottom: 4,
          }}>
            Ирцээ бүртгүүлэх
          </div>
        </FadeUp>
        <FadeUp delay={0.1}>
          <div style={{ ...nameFont, color: GOLD_LT, fontSize: "clamp(34px, 9vw, 56px)", lineHeight: 1.15, textAlign: "center", margin: "8px 0 16px" }}>
            Та ирэх үү?
          </div>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p style={{ ...cg, fontSize: 17, color: "rgba(244,238,222,0.75)", textAlign: "center", marginBottom: 40, lineHeight: 1.7 }}>
            Таны суудлыг хадгалахын тулд ирцийн мэдээллээ илгээнэ үү.
          </p>
        </FadeUp>

        <FadeUp delay={0.3}>
          {done ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: "center", padding: "20px 0" }}
            >
              <div style={{ ...nameFont, color: GOLD_LT, fontSize: 38, marginBottom: 12 }}>Баярлалаа</div>
              <p style={{ ...cg, fontSize: 17, color: "rgba(244,238,222,0.8)", lineHeight: 1.7 }}>
                {attending
                  ? `${name.split(" ")[0]}, та нартай уулзахыг тэсэн ядан хүлээж байна.`
                  : `${name.split(" ")[0]}, та дутагдах болно.`}
              </p>
            </motion.div>
          ) : (
            <div style={{ maxWidth: 420, margin: "0 auto" }}>
              <div style={{ marginBottom: 22 }}>
                <label style={label}>Таны нэр</label>
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Нэр"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 26 }}>
                <label style={label}>Утасны дугаар</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  inputMode="tel"
                  placeholder="99******"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 26 }}>
                <label style={label}>Та ирэх үү?</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { val: true,  text: "Тийм, заавал ирнэ" },
                    { val: false, text: "Харамсалтай нь очиж чадахгүй" },
                  ].map(({ val, text }) => (
                    <label
                      key={String(val)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                        ...cg, fontSize: 17, color: CREAM,
                        background: attending === val ? "rgba(232,217,176,0.14)" : "transparent",
                        border: `1px solid ${attending === val ? "rgba(232,217,176,0.5)" : "rgba(232,217,176,0.24)"}`,
                        borderRadius: 4, padding: "12px 14px",
                        transition: "all 0.25s",
                      }}
                    >
                      <input
                        type="radio"
                        name="t14-attending"
                        checked={attending === val}
                        onChange={() => setAttending(val)}
                        style={{ accentColor: GOLD_LT, width: 16, height: 16 }}
                      />
                      {text}
                    </label>
                  ))}
                </div>
              </div>

              {/* "Ирэхгүй" сонгосон үед хүний тоо хэрэггүй тул нуана */}
              {attending !== false && (
                <div style={{ marginBottom: 30 }}>
                  <label style={label}>Хэдүүлээ ирэх вэ?</label>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => setGuests((g) => Math.max(1, g - 1))}
                      style={counterBtn}
                      aria-label="Хасах"
                    >−</button>
                    <div style={{
                      ...cg, fontSize: 19, color: CREAM,
                      width: 66, height: 46,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      borderTop: "1px solid rgba(232,217,176,0.28)",
                      borderBottom: "1px solid rgba(232,217,176,0.28)",
                    }}>
                      {guests}
                    </div>
                    <button
                      type="button"
                      onClick={() => setGuests((g) => Math.min(20, g + 1))}
                      style={counterBtn}
                      aria-label="Нэмэх"
                    >+</button>
                  </div>
                </div>
              )}

              <button
                onClick={submit}
                disabled={submitting || !canSubmit}
                style={{
                  width: "100%", padding: "16px",
                  ...cg, fontSize: 12, letterSpacing: "0.5em", textTransform: "uppercase",
                  color: NIGHT, background: GOLD_LT,
                  border: "none", borderRadius: 4,
                  cursor: submitting ? "wait" : "pointer",
                  opacity: canSubmit ? 1 : 0.5,
                  transition: "opacity 250ms",
                }}
              >
                {submitting ? "Илгээж байна..." : "Илгээх"}
              </button>
            </div>
          )}
        </FadeUp>
      </div>
    </section>
  );
}

// ─── Wishes (Мэндчилгээ) — бүх Template14-д ────────────────────────────────────
// Ирц бүртгэлийн доор. wishes хүснэгт рүү бичнэ (event_id, name, message).
function T14Wishes({ eventId }: { eventId: string }) {
  const [name, setName]       = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  const submit = async () => {
    if (!name.trim() || !message.trim()) return;
    setSending(true);
    // Demo горимд бодит DB руу бичихгүй (event id нь uuid биш)
    if (eventId === "demo") { setSending(false); setSent(true); return; }
    const { error } = await supabase.from("wishes").insert({
      event_id: eventId,
      name: name.trim(),
      message: message.trim(),
    });
    setSending(false);
    if (error) { toast.error("Алдаа гарлаа. Дахин оролдоно уу."); return; }
    setSent(true);
  };

  const label: React.CSSProperties = {
    ...cg, fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase",
    color: "rgba(244,238,222,0.55)", display: "block", marginBottom: 8,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 14px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(232,217,176,0.28)",
    borderRadius: 4, color: CREAM,
    ...cg, fontSize: 17, outline: "none", boxSizing: "border-box",
  };

  return (
    <section style={{
      background: `linear-gradient(180deg, #1A2A48 0%, ${NIGHT} 100%)`,
      color: CREAM, overflow: "hidden",
    }}>
      <div style={{ padding: "48px 28px 88px" }}>
        <FadeUp delay={0.1}>
          <div style={{ ...nameFont, color: GOLD_LT, fontSize: "clamp(34px, 9vw, 56px)", lineHeight: 1.15, textAlign: "center", margin: "0 0 12px" }}>
            Мэндчилгээ
          </div>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p style={{ ...cg, fontSize: 17, color: "rgba(244,238,222,0.75)", textAlign: "center", marginBottom: 36, lineHeight: 1.7 }}>
            Баяр хүргэх үгээ үлдээнэ үү.
          </p>
        </FadeUp>

        <FadeUp delay={0.3}>
          {sent ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: "center", padding: "20px 0" }}
            >
              <div style={{ ...nameFont, color: GOLD_LT, fontSize: 38, marginBottom: 12 }}>Баярлалаа</div>
              <p style={{ ...cg, fontSize: 17, color: "rgba(244,238,222,0.8)", lineHeight: 1.7 }}>
                Таны мэндчилгээг хүлээн авлаа.
              </p>
            </motion.div>
          ) : (
            <div style={{ maxWidth: 420, margin: "0 auto" }}>
              <div style={{ marginBottom: 22 }}>
                <label style={label}>Таны нэр</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Нэр" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 26 }}>
                <label style={label}>Мэндчилгээний үг</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Мэндчилгээ бичнэ үү..."
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                />
              </div>
              <button
                onClick={submit}
                disabled={sending || !name.trim() || !message.trim()}
                style={{
                  width: "100%", padding: "16px",
                  ...cg, fontSize: 12, letterSpacing: "0.5em", textTransform: "uppercase",
                  color: NIGHT, background: GOLD_LT, border: "none", borderRadius: 4,
                  cursor: sending ? "wait" : "pointer",
                  opacity: (!name.trim() || !message.trim()) ? 0.5 : 1,
                  transition: "opacity 250ms",
                }}
              >
                {sending ? "Илгээж байна..." : "Илгээх"}
              </button>
            </div>
          )}
        </FadeUp>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
// events хүснэгтэд утасны багана байхгүй тул холбоо барих дугаарыг эндээс
// slug-аар нь уншина. Бүртгээгүй урилга дээр утасны мөр огт гарахгүй.
const CONTACT_PHONES: Record<string, string[]> = {
  "dorjzowd-nomin": ["88777477", "86777477"],
};

// Хосын нэрийн доор гарах үр хүүхдийн нэр — зөвхөн бүртгэсэн slug дээр.
const CHILDREN: Record<string, string[]> = {
  "dawaa-dawaajargal": ["Хүү Д.Тэлмүүн", "Охин Д.Цэлмүүн"],
  "batsukh-sumya": ["Охин: Б.Сийлэн"],
  "lashidnym-togtokhsuren": ["Охин: Н.Гэгээнхүслэн", "Хүү: Н.Гэгээнжаргал"],
};

// Хөтөлбөр (T14Schedule) хэсгийг нуух slug-ууд.
const HIDE_SCHEDULE = new Set<string>([
  "batsukh-sumya",
  "ariunbold-pvrewdorj",
  "lashidnym-togtokhsuren",
  "dulguun-daariimaa",
  "adyasuren-khulan",
]);

function T14Footer({ event }: { event: EventData }) {
  const phones = CONTACT_PHONES[event.slug];
  const children = CHILDREN[event.slug];
  const name1 = event.person1_name || "Diana";
  const name2 = event.person2_name || "Richard";
  const i1 = initialOf(name1);
  const i2 = initialOf(name2);

  const fmtDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day} · ${m} · ${y}`;
  };

  return (
    <footer style={{ background: NIGHT_LO, color: "rgba(244,238,222,0.7)", textAlign: "center", padding: "80px 24px 60px" }}>
      {/* Monogram circle */}
      <FadeUp>
        <div style={{
          width: 104, height: 104, margin: "0 auto 28px",
          borderRadius: "50%",
          border: "1px solid rgba(232,217,176,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: GOLD_LT,
        }}>
          <span style={{ ...nameFont, fontSize: 40, lineHeight: 1 }}>{i1}</span>
          <span style={{ ...amp, fontSize: 22, lineHeight: 1, margin: "0 6px", opacity: 0.8 }}>&amp;</span>
          <span style={{ ...nameFont, fontSize: 40, lineHeight: 1 }}>{i2}</span>
        </div>
      </FadeUp>
      <FadeUp delay={0.1}>
        <div style={{ ...cg, fontSize: 17, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(244,238,222,0.72)", lineHeight: 1.5 }}>
          {name1} <span style={{ ...amp, opacity: 0.75 }}>&amp;</span> {name2}
        </div>
      </FadeUp>
      {children && (
        <FadeUp delay={0.15}>
          <div style={{ ...cg, fontSize: 18, letterSpacing: "0.06em", color: "rgba(244,238,222,0.68)", marginTop: 12, lineHeight: 1.7 }}>
            {children.map((c) => (
              <div key={c}>{c}</div>
            ))}
          </div>
        </FadeUp>
      )}
      <FadeUp delay={0.2}>
        <div style={{ ...cg, fontSize: 17, letterSpacing: "0.36em", textTransform: "uppercase", color: "rgba(244,238,222,0.58)", marginTop: 12 }}>
          {fmtDate(event.date)}
        </div>
      </FadeUp>
      {phones && (
        <FadeUp delay={0.3}>
          <div style={{ ...cg, fontSize: 15, letterSpacing: "0.12em", color: "rgba(244,238,222,0.6)", marginTop: 22 }}>
            Утас:{" "}
            {phones.map((tel, i) => (
              <span key={tel}>
                {i > 0 && ", "}
                <a href={`tel:${tel}`} style={{ color: GOLD_LT, textDecoration: "none" }}>{tel}</a>
              </span>
            ))}
          </div>
        </FadeUp>
      )}
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Template14({ event }: { event: EventData }) {
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
    <div style={{ maxWidth: 523, margin: "0 auto", overflowX: "hidden" }}>
      <T14VideoIntro audioRef={audioRef} />
      {event.music_url && <audio ref={audioRef} src={event.music_url} loop preload="auto" />}
      <T14Hero event={event} />
      <T14Verse event={event} />
      <T14DateCountdown event={event} />
      {!HIDE_SCHEDULE.has(event.slug) && <T14Schedule event={event} />}
      <T14Gallery event={event} />
      <T14Venue event={event} />
      <T14RSVP eventId={event.id} />
      <T14Wishes eventId={event.id} />
      <T14Footer event={event} />

      {event.music_url && <MusicPlayer audioRef={audioRef} />}
      <Toaster />
    </div>
  );
}
