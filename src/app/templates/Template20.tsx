import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { EventData } from "../../types/event";

// ─────────────────────────────────────────────────────────────────────────────
// Template20 — "Corporate"
// Байгууллагын албан ёсны арга хэмжээний урилга (ISO гэрчилгээ гардуулах,
// нээлт, ойн баяр гэх мэт). Хурим/төрсөн өдрийн загваруудаас ялгаатай нь:
// шүлэг, ирц бүртгэл, сүйт хосын хэсэг байхгүй — цэвэр editorial мэдээлэл.
//
// Дата харгалзаа (schema өөрчлөхгүйгээр):
//   title           → арга хэмжээний нэр
//   person1_name    → байгууллагын нэр
//   person1_role    → байгууллагын дэд гарчиг (жишээ: "Уул уурхайн компани")
//   person1_photo   → лого (ил тод дэвсгэртэй PNG байвал тохиромжтой)
//   gallery_photos  → стандартын тэмдгүүд (1 нийлмэл зураг эсвэл 3 тусдаа)
//   venue_* / maps_photo / date / time → байршил, огноо
//
// Section: Hero → стандартын тэмдэг → байршил → footer.
// Захиалагчийн хүсэлтээр урилгын үг ба countdown-ыг хассан (2026-08-02).
// ─────────────────────────────────────────────────────────────────────────────

// ─── palette ────────────────────────────────────────────────────────────────
// Захиалагчийн сонгосон хослол: цайвар цэнхэр дэвсгэр дээр дарсан улаан
// өргөлт, хар чавга бичиг.
const BLUE   = "#B7D1EA"; // үндсэн дэвсгэр
const BLUE_L = "#DCE9F4"; // цайвар тонн — зургийн ар тал, хүрээ
const WINE   = "#5D1E33"; // өргөлт — товч, зураас
const PLUM   = "#351E28"; // бичиг, footer-ийн дэвсгэр
const MUTED  = "#5B4A55"; // 2-р зэргийн бичиг
const LIGHT  = "#EDF3F9"; // харанхуй дэвсгэр дээрх бичиг
const LINE   = "rgba(53,30,40,0.20)";

// Лого ба стандартын тэмдэг нь цагаан дэвсгэртэй PNG байдаг тул цэнхэр
// дэвсгэр дээр шууд тавихад өнгө нь эвдэрдэг — цагаан карт дотор оруулна.
const CARD = "#FFFFFF";
const CARD_SHADOW = "0 12px 32px rgba(53,30,40,0.14)";

// PT Serif — монгол кирилл ө/ү-г бүрэн агуулдаг. Playfair Display эдгээр
// үсгийг агуулдаггүй тул тэдгээр нь fallback фонтоор орж, үг дундуур өөр
// фонт мэт харагддаг байсан.
const DISPLAY: React.CSSProperties = { fontFamily: "'PT Serif', 'Noto Serif', Georgia, serif" };
const SANS: React.CSSProperties = {
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};

// ─── helpers ────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()} оны ${d.getMonth() + 1} сарын ${d.getDate()}`;
}

// "2026 оны 8 сарын 3-нд 16:00 цагт"
function formatDateTime(iso: string, time?: string) {
  const date = formatDate(iso);
  const t = (time || "").trim();
  return t ? `${date}-нд ${t} цагт` : date;
}

// ─── primitives ─────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, y = 28, style = {} }: {
  children: React.ReactNode; delay?: number; y?: number; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children, color = MUTED }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      ...SANS, fontSize: 11, fontWeight: 600, textTransform: "uppercase",
      letterSpacing: "0.34em", color,
    }}>
      {children}
    </div>
  );
}

// ─── Geological contour — уул уурхайн сэдэвт нарийн шугаман дэвсгэр ─────────
function Contours({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, pointerEvents: "none" }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.path
          key={i}
          d={`M-40 ${180 + i * 42} C 150 ${120 + i * 42}, 260 ${250 + i * 40}, 420 ${200 + i * 41} S 700 ${110 + i * 43}, 860 ${170 + i * 42}`}
          fill="none"
          stroke={i % 3 === 0 ? WINE : PLUM}
          strokeWidth={i % 3 === 0 ? 1 : 0.6}
          strokeOpacity={i % 3 === 0 ? 0.3 : 0.14}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.6, delay: i * 0.12, ease: "easeOut" }}
        />
      ))}
    </svg>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────
function T20Hero({ event, org, logo }: {
  event: EventData; org: string; logo?: string;
}) {
  const { scrollY } = useScroll();
  const fade = useTransform(scrollY, [0, 420], [1, 0]);
  const lift = useTransform(scrollY, [0, 420], [0, -50]);

  return (
    <section
      id="top"
      style={{
        position: "relative", minHeight: "100svh", background: BLUE,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "clamp(72px,12vw,120px) clamp(20px,6vw,48px)", overflow: "hidden", textAlign: "center",
      }}
    >
      <Contours opacity={0.55} />
      {/* Дээд ба доод захын нарийн хүрээ — албан ёсны бланк мэдрэмж */}
      <div style={{ position: "absolute", top: 22, left: 22, right: 22, height: 1, background: LINE }} />
      <div style={{ position: "absolute", bottom: 22, left: 22, right: 22, height: 1, background: LINE }} />

      <motion.div style={{ opacity: fade, y: lift, position: "relative", width: "100%", maxWidth: 860 }}>
        {logo ? (
          // Лого цагаан дэвсгэртэй PNG тул цэнхэр дээр шууд тавьж болохгүй —
          // цагаан карт дотор оруулж брэндийн өнгийг хэвээр хадгална.
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: CARD, borderRadius: 10, boxShadow: CARD_SHADOW,
              padding: "clamp(16px,3.4vw,24px) clamp(24px,5vw,38px)",
            }}
          >
            <img
              src={logo}
              alt={org}
              style={{
                display: "block", width: "min(58vw, 300px)", height: "auto",
                maxHeight: 120, objectFit: "contain",
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ ...DISPLAY, fontSize: "clamp(24px,5vw,34px)", fontWeight: 700, color: PLUM, letterSpacing: "-0.01em" }}
          >
            {org}
          </motion.div>
        )}

        {/* Байгууллагын нэр логон дээр аль хэдийн байгаа тул давхардуулахгүй */}

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: 64, height: 2, background: WINE, margin: "clamp(28px,5vw,40px) auto" }}
        />

        <motion.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            ...DISPLAY, margin: 0, color: PLUM, fontWeight: 400,
            fontSize: "clamp(3.4rem,15vw,7rem)", lineHeight: 0.95, letterSpacing: "-0.02em",
          }}
        >
          Урилга
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
          style={{
            ...SANS, margin: "clamp(26px,5vw,36px) auto 0", maxWidth: 620,
            fontSize: "clamp(14px,3.6vw,17px)", lineHeight: 1.7, color: MUTED,
          }}
        >
          {event.title}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.95, ease: "easeOut" }}
          style={{
            ...SANS, display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            justifyContent: "center", marginTop: "clamp(30px,6vw,44px)",
            border: `1px solid ${LINE}`, borderRadius: 9999, padding: "12px 22px",
            background: "rgba(255,255,255,0.7)", backdropFilter: "blur(6px)",
            fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: PLUM, fontWeight: 600,
          }}
        >
          <span>{formatDateTime(event.date, event.time)}</span>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        style={{
          position: "absolute", bottom: 46, left: "50%", transform: "translateX(-50%)",
          ...SANS, display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: MUTED,
        }}
      >
        <span>Доош</span>
        <motion.svg
          width="12" height="20" viewBox="0 0 14 22" fill="none"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M7 1v18M1 13l6 6 6-6" stroke={WINE} strokeWidth="1.4" />
        </motion.svg>
      </motion.div>
    </section>
  );
}

// ─── Стандартын тэмдгүүд ────────────────────────────────────────────────────
function T20Standards({ event }: { event: EventData }) {
  const badges = (event.gallery_photos || []).filter(Boolean);
  if (badges.length === 0) return null;

  return (
    <section id="standards" style={{ background: BLUE, padding: "clamp(56px,10vw,110px) clamp(20px,6vw,48px)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Reveal>
          {/* Тэмдгүүд цагаан дэвсгэртэй тул цагаан карт дотор — ISO-гийн
              цэнхэр/ногоон/улаан өнгө хэвээрээ үлдэнэ */}
          <div style={{
            background: CARD, borderRadius: 10, boxShadow: CARD_SHADOW,
            padding: "clamp(18px,4vw,34px)",
          }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: badges.length >= 3 ? "repeat(3, 1fr)" : "1fr",
                gap: "clamp(16px,3vw,28px)",
                alignItems: "center",
              }}
            >
              {(badges.length >= 3 ? badges.slice(0, 3) : badges.slice(0, 1)).map((src, i) => (
                <motion.img
                  key={i}
                  src={src}
                  alt="Баталгаажуулалтын тэмдэг"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.85, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    width: "100%", height: "auto", objectFit: "contain", display: "block",
                  }}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Байршил ────────────────────────────────────────────────────────────────
const VENUE_FALLBACK =
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1800&q=80";

function T20Venue({ event }: { event: EventData }) {
  return (
    <section id="venue" style={{ background: BLUE, padding: "clamp(70px,12vw,140px) clamp(20px,6vw,48px)" }}>
      <div style={{ maxWidth: 940, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "clamp(38px,6vw,56px)" }}>
          <Reveal><Eyebrow>Үйл ажиллагаа болох газар</Eyebrow></Reveal>
          <Reveal delay={0.08}>
            <div style={{
              ...DISPLAY, marginTop: 18, color: PLUM, fontWeight: 400,
              fontSize: "clamp(2rem,7vw,3.2rem)", lineHeight: 1.15, letterSpacing: "-0.02em",
            }}>
              {event.venue_name}
            </div>
          </Reveal>
          <Reveal delay={0.16}>
            <div style={{ ...SANS, marginTop: 14, color: MUTED, fontSize: "clamp(13px,3.4vw,15px)", lineHeight: 1.6 }}>
              {event.venue_address}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div style={{
            borderRadius: 6, overflow: "hidden", aspectRatio: "16/9",
            border: `1px solid ${LINE}`, background: BLUE_L, boxShadow: CARD_SHADOW,
          }}>
            <img
              src={event.maps_photo || VENUE_FALLBACK}
              alt={event.venue_name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        </Reveal>

        {event.venue_map_url && (
          <Reveal delay={0.2} style={{ textAlign: "center" }}>
            <a
              href={event.venue_map_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...SANS, display: "inline-flex", alignItems: "center", gap: 10,
                marginTop: "clamp(32px,5vw,44px)", textDecoration: "none",
                background: WINE, color: LIGHT, borderRadius: 9999,
                padding: "17px 38px", fontSize: 11.5, fontWeight: 700,
                letterSpacing: "0.2em", textTransform: "uppercase",
                boxShadow: "0 12px 30px rgba(93,30,51,0.38)",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Газрын зураг
            </a>
          </Reveal>
        )}
      </div>
    </section>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────────
function T20Footer({ org, role, logo }: { org: string; role: string; logo?: string }) {
  return (
    <footer style={{ background: PLUM, padding: "clamp(64px,11vw,110px) clamp(20px,6vw,48px) clamp(40px,7vw,64px)", textAlign: "center" }}>
      <Reveal>
        <div style={{ ...SANS, fontSize: 10, letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(237,243,249,0.45)" }}>
          Хүндэтгэсэн
        </div>
      </Reveal>

      <Reveal delay={0.1} style={{ marginTop: 26 }}>
        {logo ? (
          // Лого нь ил тод эсвэл цагаан дэвсгэртэй байж болно — аль ч тохиолдолд
          // зөв харагдахын тулд цагаан карт дотор тавина
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: CARD, borderRadius: 6, padding: "14px 24px",
          }}>
            <img
              src={logo}
              alt={org}
              style={{ height: "clamp(28px,6vw,40px)", width: "auto", objectFit: "contain", display: "block" }}
            />
          </div>
        ) : (
          <div style={{ ...DISPLAY, color: LIGHT, fontSize: "clamp(26px,7vw,40px)", fontWeight: 400 }}>
            {org}
          </div>
        )}
      </Reveal>

      <Reveal delay={0.18}>
        <div style={{ ...SANS, marginTop: 18, fontSize: 11, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(237,243,249,0.62)" }}>
          {role}
        </div>
      </Reveal>

      <div style={{ maxWidth: 340, height: 1, background: "rgba(237,243,249,0.16)", margin: "clamp(38px,6vw,54px) auto 0" }} />

      <div style={{ ...SANS, marginTop: 22, fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(237,243,249,0.34)" }}>
        Цахим урилга
      </div>
    </footer>
  );
}

// ─── Дууны товч ─────────────────────────────────────────────────────────────
function MusicPlayer({ audioRef }: { audioRef: React.RefObject<HTMLAudioElement | null> }) {
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
    <button
      onClick={toggle}
      aria-label={playing ? "Дуу зогсоох" : "Дуу тоглуулах"}
      style={{
        position: "fixed", bottom: 22, right: 22, zIndex: 1000,
        width: 46, height: 46, borderRadius: "50%",
        background: WINE, border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 6px 20px rgba(93,30,51,0.45)",
      }}
    >
      {playing ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill={LIGHT}>
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill={LIGHT}>
          <polygon points="7,3 20,12 7,21" />
        </svg>
      )}
    </button>
  );
}

// ─── Root ───────────────────────────────────────────────────────────────────
export default function Template20({ event }: { event: EventData }) {
  const org  = event.person1_name || "Байгууллага";
  const role = event.person1_role || "Албан ёсны урилга";
  const logo = event.person1_photo || undefined;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Дуу шууд эхлэхийг оролдоно. Browser autoplay-г хоривол хэрэглэгчийн анхны
  // хөдөлгөөн (дарах / гүйлгэх) дээр асаана.
  useEffect(() => {
    if (!event.music_url) return;
    const start = () => {
      audioRef.current?.play().then(cleanup).catch(() => {});
    };
    const evts = ["pointerdown", "touchstart", "keydown", "scroll"] as const;
    const cleanup = () => evts.forEach((e) => window.removeEventListener(e, start));
    start();
    evts.forEach((e) => window.addEventListener(e, start, { passive: true }));
    return cleanup;
  }, [event.music_url]);

  return (
    <div style={{ background: BLUE, minHeight: "100vh", overflowX: "hidden" }}>
      {event.music_url && <audio ref={audioRef} src={event.music_url} loop preload="auto" />}
      {event.music_url && <MusicPlayer audioRef={audioRef} />}
      <T20Hero event={event} org={org} logo={logo} />
      <T20Standards event={event} />
      <T20Venue event={event} />
      <T20Footer org={org} role={role} logo={logo} />
    </div>
  );
}
