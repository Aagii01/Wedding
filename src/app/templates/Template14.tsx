import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { EventData } from "../../types/event";

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
const pinyon = { fontFamily: "'Pinyon Script', cursive" } as const;
const cg     = { fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif" } as const;
const cgI    = { fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif", fontStyle: "italic" as const } as const;

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

// ─── Music player ─────────────────────────────────────────────────────────────
function MusicPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay  = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("play",  onPlay);
    a.addEventListener("pause", onPause);
    return () => { a.removeEventListener("play", onPlay); a.removeEventListener("pause", onPause); };
  }, []);

  // Дуу шууд автоматаар эхэлнэ. Browser autoplay-г хоригловол хэрэглэгчийн
  // анхны хөдөлгөөн (tap / scroll / keydown) дээр асаана.
  useEffect(() => {
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
  }, [src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  };

  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 200 }}>
      <audio ref={audioRef} src={src} loop preload="auto" />
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
          style={{ ...cg, fontWeight: 600, fontSize: 12, letterSpacing: "0.42em", textTransform: "uppercase", color: "rgba(255,255,255,0.9)", marginBottom: 36, textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}
        >
          Бид гэрлэж байна
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, delay: 0.5 }}
          style={{ ...pinyon, lineHeight: 1, textShadow: "0 2px 22px rgba(0,0,0,0.55)" }}
        >
          <span style={{ display: "block", fontSize: "clamp(72px, 18vw, 120px)" }}>{name1}</span>
          <span style={{
            display: "block",
            ...cgI, fontSize: "clamp(28px, 7vw, 44px)",
            color: "rgba(255,255,255,0.9)", margin: "-6px 0",
            letterSpacing: "0.02em", textShadow: "0 1px 6px rgba(0,0,0,0.4)",
          }}>&amp;</span>
          <span style={{ display: "block", fontSize: "clamp(72px, 18vw, 120px)" }}>{name2}</span>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          style={{ marginTop: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
        >
          <div style={{ ...cg, fontWeight: 500, fontSize: 10, letterSpacing: "0.42em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>
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

  return (
    <Paper>
      <div style={{ padding: "80px 32px" }}>
        <FadeUp><Eyebrow>Гэр бүлийнхэнтэйгээ хамт</Eyebrow></FadeUp>
        <FadeUp delay={0.1}><Flourish /></FadeUp>

        <FadeUp delay={0.2}>
          <div style={{
            ...pinyon, color: WAX,
            fontSize: "clamp(60px, 15vw, 96px)",
            lineHeight: 1, textAlign: "center", margin: "12px 0 20px",
          }}>
            {name1}
            <span style={{ ...cgI, fontSize: "0.34em", margin: "0 0.25em", color: INK_MUTE, verticalAlign: "middle" }}>&amp;</span>
            {name2}
          </div>
        </FadeUp>

        <FadeUp delay={0.3}>
          <p style={{
            ...cg, fontSize: 18, lineHeight: 1.85, color: INK_SOFT,
            textAlign: "center", letterSpacing: "0.02em", maxWidth: 400, margin: "0 auto",
          }}>
            Бидний амьдралын хамгийн нандин бөгөөд тусгай өдөр тохиож байна. Хайр, баяр хөөр, аз жаргал бялхсан энэхүү мартагдашгүй үдшийг бидэнтэй хамт хуваалцаж, баярыг минь хуваалцахыг урьж байна.
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
          <div style={{ ...pinyon, color: WAX, fontSize: "clamp(48px, 12vw, 80px)", lineHeight: 1, textAlign: "center", marginTop: 8, marginBottom: 28 }}>
            Бидний өдөр
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
            <div style={{ ...cg, fontSize: 11, letterSpacing: "0.38em", textTransform: "uppercase", color: INK_MUTE, marginTop: 4 }}>
              {dt.month} · {dt.year}
            </div>
            {event.time && (
              <div style={{ ...cgI, color: WAX, fontSize: 18, marginTop: 10, opacity: 0.85 }}>
                {event.time}
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

function T14Schedule() {
  const items = [
    { time: "17:00", label: "Хуримын Ёслол",  desc: "Тангараг, бөгж, анхны үнсэлт. Бидний түүх эхлэх мөч." },
    { time: "18:00", label: "Хүлээн Авалт",   desc: "Шампань дарс, хөгжүүн яриа, тухтай уур амьсгал." },
    { time: "20:00", label: "Оройн Зоог",     desc: "Лааны гэрэлт ширээний ард хамтдаа тухлах цаг." },
    { time: "22:00", label: "Чөлөөт Бүжиг",   desc: "Дүрэм байхгүй, хязгаар байхгүй — Зүгээр л хамтдаа баярлацгаая!" },
  ];

  return (
    <Paper>
      <div style={{ padding: "72px 24px" }}>
        <FadeUp delay={0.1}>
          <div style={{ ...pinyon, color: WAX, fontSize: "clamp(48px, 12vw, 72px)", lineHeight: 1.1, textAlign: "center", margin: "8px 0 36px" }}>
            Үйл ажиллагаа
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
                  <div style={{ width: 28, height: 28 }}>{SCHEDULE_ICONS[i]}</div>
                </div>

                {/* Text */}
                <div style={{ paddingTop: 8 }}>
                  <div style={{ ...cgI, color: WAX, fontSize: 28, lineHeight: 1 }}>{item.time}</div>
                  <div style={{ ...cg, fontWeight: 500, fontSize: 11, letterSpacing: "0.36em", textTransform: "uppercase", color: INK, marginTop: 4, marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ ...cg, fontSize: 15, lineHeight: 1.55, color: INK_SOFT }}>
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
  const photos = Array.from({ length: 6 }, (_, i) =>
    event.gallery2_photos?.[i] || FALLBACK[i]
  );
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <Paper>
      <div style={{ padding: "72px 24px" }}>
        <FadeUp delay={0.1}>
          <div style={{ ...pinyon, color: WAX, fontSize: "clamp(48px, 12vw, 72px)", lineHeight: 1.1, textAlign: "center", margin: "8px 0 28px" }}>
            Зургийн цомог
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          {/* Bento grid adapted for mobile */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridAutoRows: "140px", gap: 10 }}>
            {/* Large top-left */}
            <div
              onClick={() => setLightbox(photos[0])}
              style={{ gridColumn: "1 / 2", gridRow: "1 / 3", overflow: "hidden", borderRadius: 2, cursor: "pointer", boxShadow: "0 2px 12px rgba(70,50,20,0.1)" }}
            >
              <img src={photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            {/* Top-right */}
            <div onClick={() => setLightbox(photos[1])} style={{ overflow: "hidden", borderRadius: 2, cursor: "pointer", boxShadow: "0 2px 12px rgba(70,50,20,0.1)" }}>
              <img src={photos[1]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            {/* Middle-right */}
            <div onClick={() => setLightbox(photos[2])} style={{ overflow: "hidden", borderRadius: 2, cursor: "pointer", boxShadow: "0 2px 12px rgba(70,50,20,0.1)" }}>
              <img src={photos[2]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            {/* Bottom-left */}
            <div onClick={() => setLightbox(photos[3])} style={{ overflow: "hidden", borderRadius: 2, cursor: "pointer", boxShadow: "0 2px 12px rgba(70,50,20,0.1)" }}>
              <img src={photos[3]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            {/* Bottom span */}
            <div
              onClick={() => setLightbox(photos[4])}
              style={{ gridColumn: "2 / 3", overflow: "hidden", borderRadius: 2, cursor: "pointer", boxShadow: "0 2px 12px rgba(70,50,20,0.1)" }}
            >
              <img src={photos[4]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
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
          <div style={{ ...pinyon, color: WAX, fontSize: "clamp(52px, 13vw, 80px)", lineHeight: 1, textAlign: "center", margin: "8px 0 24px" }}>
            {event.venue_name || "Хурмын ордон"}
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
                href={event.venue_map_url}
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
  const [name, setName]       = useState("");
  const [attending, setAttending] = useState("");
  const [guests, setGuests]   = useState("1");
  const [food, setFood]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]       = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !attending) return;
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
      guests: attending === "yes" ? parseInt(guests) : 0,
      message: food.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error("Алдаа гарлаа. Дахин оролдоно уу."); return; }
    setDone(true);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(232,217,176,0.30)",
    color: CREAM,
    ...cg, fontSize: 19,
    padding: "10px 0 12px",
    outline: "none",
    boxSizing: "border-box",
  };

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
          <div style={{ ...pinyon, color: GOLD_LT, fontSize: "clamp(52px, 13vw, 80px)", lineHeight: 1, textAlign: "center", margin: "8px 0 16px" }}>
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
              <div style={{ ...pinyon, color: GOLD_LT, fontSize: 52, marginBottom: 12 }}>Баярлалаа</div>
              <p style={{ ...cg, fontSize: 17, color: "rgba(244,238,222,0.8)", lineHeight: 1.7 }}>
                {attending === "yes"
                  ? `${name.split(" ")[0]}, та нартай уулзахыг тэсэн ядан хүлээж байна.`
                  : `${name.split(" ")[0]}, та дутагдах болно.`}
              </p>
            </motion.div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <label style={{ ...cg, fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(244,238,222,0.55)", display: "block", marginBottom: 6 }}>
                  Таны нэр
                </label>
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Нэрийн хуудас дээр гарах нэр"
                  required style={inputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <label style={{ ...cg, fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(244,238,222,0.55)", display: "block", marginBottom: 6 }}>
                    Ирэх эсэх
                  </label>
                  <select
                    value={attending} onChange={(e) => setAttending(e.target.value)}
                    required
                    style={{
                      ...inputStyle,
                      appearance: "none" as const,
                      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1 L 6 6 L 11 1' fill='none' stroke='%23E8D9B0' stroke-width='1.5'/></svg>")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 4px center",
                      paddingRight: 24,
                    }}
                  >
                    <option value="" style={{ background: NIGHT }}>Сонгох</option>
                    <option value="yes" style={{ background: NIGHT }}>Тийм, заавал ирнэ</option>
                    <option value="no" style={{ background: NIGHT }}>Харамсалтай нь очиж чадахгүй</option>
                  </select>
                </div>
                <div>
                  <label style={{ ...cg, fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(244,238,222,0.55)", display: "block", marginBottom: 6 }}>
                    Зочдын тоо
                  </label>
                  <select value={guests} onChange={(e) => setGuests(e.target.value)}
                    style={{ ...inputStyle, appearance: "none" as const }}>
                    {["1","2","3","4"].map((n) => (
                      <option key={n} value={n} style={{ background: NIGHT }}>{n} хүн</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ ...cg, fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(244,238,222,0.55)", display: "block", marginBottom: 6 }}>
                  Хоолны хязгаарлалт (заавал биш)
                </label>
                <input
                  value={food} onChange={(e) => setFood(e.target.value)}
                  placeholder="Дурын зүйл хэлж болно"
                  style={inputStyle}
                />
              </div>

              <div style={{ textAlign: "center", marginTop: 8 }}>
                <motion.button
                  type="submit"
                  whileHover={{ background: GOLD_LT, color: NIGHT }}
                  disabled={submitting}
                  style={{
                    ...cg, fontSize: 12, letterSpacing: "0.5em", textTransform: "uppercase",
                    color: GOLD_LT, padding: "16px 48px",
                    background: "transparent",
                    border: `1px solid ${GOLD_LT}`,
                    cursor: submitting ? "wait" : "pointer",
                    transition: "background 250ms, color 250ms",
                  }}
                >
                  {submitting ? "Илгээж байна..." : "Илгээх"}
                </motion.button>
              </div>
            </form>
          )}
        </FadeUp>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function T14Footer({ event }: { event: EventData }) {
  const name1 = event.person1_name || "Diana";
  const name2 = event.person2_name || "Richard";
  const i1 = name1.charAt(0).toUpperCase();
  const i2 = name2.charAt(0).toUpperCase();

  const fmtDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day} · ${m} · ${y}`;
  };

  return (
    <footer style={{ background: NIGHT_LO, color: "rgba(244,238,222,0.7)", textAlign: "center", padding: "80px 24px 60px" }}>
      {/* Monogram circle */}
      <FadeUp>
        <div style={{
          width: 96, height: 96, margin: "0 auto 28px",
          borderRadius: "50%",
          border: "1px solid rgba(232,217,176,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: GOLD_LT,
          ...pinyon, fontSize: 50, letterSpacing: -2,
        }}>
          {i1}&amp;{i2}
        </div>
      </FadeUp>
      <FadeUp delay={0.1}>
        <div style={{ ...pinyon, color: GOLD_LT, fontSize: 36, marginBottom: 20 }}>
          Хайртайгаа
        </div>
      </FadeUp>
      <FadeUp delay={0.2}>
        <div style={{ ...cg, fontSize: 11, letterSpacing: "0.42em", textTransform: "uppercase", color: "rgba(244,238,222,0.45)" }}>
          {name1} &amp; {name2} · {fmtDate(event.date)}
        </div>
      </FadeUp>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Template14({ event }: { event: EventData }) {
  return (
    <div style={{ maxWidth: 523, margin: "0 auto", overflowX: "hidden" }}>
      <T14Hero event={event} />
      <T14Verse event={event} />
      <T14DateCountdown event={event} />
      <T14Schedule />
      <T14Gallery event={event} />
      <T14Venue event={event} />
      <T14RSVP eventId={event.id} />
      <T14Footer event={event} />

      {event.music_url && <MusicPlayer src={event.music_url} />}
      <Toaster />
    </div>
  );
}
