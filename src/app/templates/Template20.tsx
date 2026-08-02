import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { EventData } from "../../types/event";
import { getPoemLines, getSchedule, type ScheduleItem } from "../../lib/eventContent";

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
//   poem            → урилгын үг (мөр бүрийг Enter-ээр)
//   schedule        → стандартын жагсаалт: time = код, label = нэр, desc = тайлбар
//   venue_* / maps_photo / date / time → байршил, огноо
// ─────────────────────────────────────────────────────────────────────────────

// ─── palette ────────────────────────────────────────────────────────────────
const PAPER  = "#FAF8F5";
const PAPER2 = "#F2EEE8";
const INK    = "#14161A";
const MUTED  = "#6B6F76";
const ORANGE = "#F5A020";
const LINE   = "rgba(20,22,26,0.12)";

const DISPLAY: React.CSSProperties = { fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" };
const SANS: React.CSSProperties = {
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};

// ─── helpers ────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()} оны ${d.getMonth() + 1} сарын ${d.getDate()}`;
}

// Countdown-д огноо ба цагийг нийлүүлнэ. Цаг байхгүй бол өдрийн эхлэл.
function targetISO(date: string, time?: string) {
  const t = (time || "").trim();
  return t ? `${date}T${t.length === 5 ? t : t.slice(0, 5)}:00` : `${date}T00:00:00`;
}

function useCountdown(iso: string) {
  const target = useMemo(() => new Date(iso).getTime(), [iso]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    passed:  target - now <= 0,
  };
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

// Улбар шар богино зураас — section-ууд хооронд давтагдах чимэглэл
function Mark({ width = 56, align = "center" }: { width?: number; align?: string }) {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width, height: 2, background: ORANGE, transformOrigin: align === "left" ? "left" : "center",
        margin: align === "left" ? "0" : "0 auto",
      }}
    />
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
          stroke={i % 3 === 0 ? ORANGE : INK}
          strokeWidth={i % 3 === 0 ? 1 : 0.6}
          strokeOpacity={i % 3 === 0 ? 0.28 : 0.12}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.6, delay: i * 0.12, ease: "easeOut" }}
        />
      ))}
    </svg>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────
function T20Hero({ event, org, role, logo }: {
  event: EventData; org: string; role: string; logo?: string;
}) {
  const { scrollY } = useScroll();
  const fade = useTransform(scrollY, [0, 420], [1, 0]);
  const lift = useTransform(scrollY, [0, 420], [0, -50]);

  return (
    <section
      id="top"
      style={{
        position: "relative", minHeight: "100svh", background: PAPER,
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
          <motion.img
            src={logo}
            alt={org}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            // Цагаан дэвсгэртэй PNG лого ирвэл multiply-аар цаасан өнгөнд ууна
            style={{ height: "clamp(34px,7vw,52px)", width: "auto", objectFit: "contain", margin: "0 auto", mixBlendMode: "multiply" }}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ ...DISPLAY, fontSize: "clamp(24px,5vw,34px)", fontWeight: 700, color: INK, letterSpacing: "-0.01em" }}
          >
            {org}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.35 }}
          style={{ marginTop: 14 }}
        >
          <Eyebrow>{role}</Eyebrow>
        </motion.div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: 64, height: 2, background: ORANGE, margin: "clamp(28px,5vw,40px) auto" }}
        />

        <motion.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            ...DISPLAY, margin: 0, color: INK, fontWeight: 400,
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
            background: "rgba(255,255,255,0.72)", backdropFilter: "blur(6px)",
            fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: INK, fontWeight: 600,
          }}
        >
          <span>{formatDate(event.date)}</span>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: ORANGE }} />
          <span>{event.time}</span>
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
          <path d="M7 1v18M1 13l6 6 6-6" stroke={ORANGE} strokeWidth="1.4" />
        </motion.svg>
      </motion.div>
    </section>
  );
}

// ─── Урилгын үг — үг тус бүр ээлжлэн гарна ─────────────────────────────────
const DEFAULT_INVITE = [
  "Манай хамт олон олон улсын стандартын шаардлагыг бүрэн хангаж,",
  "Нэгдсэн менежментийн тогтолцооны баталгаажуулалтын гэрчилгээгээ",
  "хүлээн авах ёслолын арга хэмжээгээ зохион байгуулж байна.",
  "",
  "Энэхүү хамтын хөдөлмөрийн үр дүнг Эрхэм Таньтай хамт",
  "хуваалцахыг хүндэтгэн урьж байна.",
];

function T20Invite({ event }: { event: EventData }) {
  const lines = getPoemLines(event, DEFAULT_INVITE);

  return (
    <section style={{ background: PAPER, padding: "clamp(80px,14vw,150px) clamp(20px,6vw,48px)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <Reveal><Eyebrow>Хүндэт зочид</Eyebrow></Reveal>
        <Reveal delay={0.1} style={{ marginTop: 22, marginBottom: "clamp(34px,6vw,50px)" }}>
          <Mark />
        </Reveal>

        <div style={{ ...DISPLAY, color: INK, fontSize: "clamp(1.15rem,4.4vw,1.7rem)", lineHeight: 1.85 }}>
          {lines.map((line, li) =>
            line === "" ? (
              <div key={li} style={{ height: "clamp(14px,3vw,22px)" }} />
            ) : (
              <div key={li} style={{ marginBottom: 4 }}>
                {line.split(" ").map((word, wi) => (
                  <motion.span
                    key={wi}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.55, delay: wi * 0.035, ease: "easeOut" }}
                    style={{ display: "inline-block", marginRight: "0.28em" }}
                  >
                    {word}
                  </motion.span>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Стандартууд ────────────────────────────────────────────────────────────
// events.schedule хоосон үед харагдах үндсэн жагсаалт.
// time = стандартын код, label = нэр, desc = тайлбар
const DEFAULT_STANDARDS: ScheduleItem[] = [
  { time: "MNS ISO 9001:2015",  label: "Чанарын менежментийн тогтолцоо",
    desc: "Үйлчлүүлэгчийн шаардлагыг тогтвортой хангах, үйл ажиллагааны чанарын удирдлага" },
  { time: "MNS ISO 14001:2015", label: "Байгаль орчны менежментийн тогтолцоо",
    desc: "Байгаль орчинд үзүүлэх нөлөөллийг бууруулах, тогтвортой хөгжлийн бодлого" },
  { time: "MNS ISO 45001:2018", label: "Хөдөлмөрийн эрүүл мэнд, аюулгүй байдал",
    desc: "Ажилтны эрүүл мэнд, аюулгүй ажиллагааг хамгаалах менежментийн тогтолцоо" },
];

const STANDARD_COLORS = ["#1F5FBF", "#3E9B3E", "#D62828"];

function T20Standards({ event }: { event: EventData }) {
  const standards = getSchedule(event, DEFAULT_STANDARDS);
  const badges = (event.gallery_photos || []).filter(Boolean);

  return (
    <section id="standards" style={{ background: PAPER2, padding: "clamp(80px,14vw,150px) clamp(20px,6vw,48px)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Тэмдгүүд — 1 нийлмэл зураг эсвэл 3 тусдаа зураг хоёуланг дэмжинэ */}
        {badges.length > 0 && (
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
                  width: "100%", height: "auto", objectFit: "contain",
                  display: "block", mixBlendMode: "multiply",
                }}
              />
            ))}
          </div>
        )}

        {/* Стандарт тус бүрийн тайлбар */}
        <div style={{ marginTop: "clamp(44px,7vw,72px)", borderTop: `1px solid ${LINE}` }}>
          {standards.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: "flex", gap: "clamp(14px,3vw,28px)", alignItems: "flex-start",
                padding: "clamp(22px,4vw,32px) 0", borderBottom: `1px solid ${LINE}`,
              }}
            >
              <div style={{
                width: 10, height: 10, borderRadius: "50%", flexShrink: 0, marginTop: 7,
                background: STANDARD_COLORS[i % STANDARD_COLORS.length],
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  ...SANS, fontSize: "clamp(12px,3vw,13px)", fontWeight: 700,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  color: STANDARD_COLORS[i % STANDARD_COLORS.length],
                }}>
                  {s.time}
                </div>
                <div style={{
                  ...DISPLAY, marginTop: 8, color: INK,
                  fontSize: "clamp(1.15rem,4.4vw,1.6rem)", lineHeight: 1.3,
                }}>
                  {s.label}
                </div>
                {s.desc && (
                  <div style={{ ...SANS, marginTop: 10, color: MUTED, fontSize: "clamp(13px,3.4vw,14.5px)", lineHeight: 1.65 }}>
                    {s.desc}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Countdown ──────────────────────────────────────────────────────────────
function T20Countdown({ event }: { event: EventData }) {
  const { days, hours, minutes, seconds, passed } = useCountdown(targetISO(event.date, event.time));

  const cell = (label: string, val: number) => (
    <div style={{ textAlign: "center" }}>
      <div style={{
        ...DISPLAY, color: PAPER, fontWeight: 400,
        fontSize: "clamp(2.4rem,10vw,4.6rem)", lineHeight: 1, fontVariantNumeric: "tabular-nums",
      }}>
        {String(val).padStart(2, "0")}
      </div>
      <div style={{
        ...SANS, marginTop: 12, fontSize: 10, fontWeight: 600,
        letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(250,248,245,0.55)",
      }}>
        {label}
      </div>
    </div>
  );

  return (
    <section id="countdown" style={{ position: "relative", background: INK, padding: "clamp(76px,13vw,140px) clamp(20px,6vw,48px)", overflow: "hidden" }}>
      {/* Дэвсгэрийн улбар шар туяа */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 0%, ${ORANGE}22, transparent 62%)`,
      }} />

      <div style={{ position: "relative", maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
        <Reveal><Eyebrow color="rgba(250,248,245,0.55)">{passed ? "Арга хэмжээ эхэлсэн" : "Арга хэмжээ эхлэхэд"}</Eyebrow></Reveal>

        <Reveal delay={0.12}>
          <div style={{
            marginTop: "clamp(40px,7vw,64px)", display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(8px,3vw,32px)",
          }}>
            {cell("Өдөр", days)}
            {cell("Цаг", hours)}
            {cell("Минут", minutes)}
            {cell("Секунд", seconds)}
          </div>
        </Reveal>

        <Reveal delay={0.24} style={{ marginTop: "clamp(44px,7vw,64px)" }}>
          <div style={{ ...SANS, fontSize: 12, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(250,248,245,0.72)" }}>
            {formatDate(event.date)} · {event.time}
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
    <section id="venue" style={{ background: PAPER, padding: "clamp(80px,14vw,150px) clamp(20px,6vw,48px)" }}>
      <div style={{ maxWidth: 940, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "clamp(38px,6vw,56px)" }}>
          <Reveal><Eyebrow>Болох газар</Eyebrow></Reveal>
          <Reveal delay={0.08}>
            <div style={{
              ...DISPLAY, marginTop: 18, color: INK, fontWeight: 400,
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
            borderRadius: 4, overflow: "hidden", aspectRatio: "16/9",
            border: `1px solid ${LINE}`, background: PAPER2,
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
                background: ORANGE, color: INK, borderRadius: 9999,
                padding: "17px 38px", fontSize: 11.5, fontWeight: 700,
                letterSpacing: "0.2em", textTransform: "uppercase",
                boxShadow: `0 12px 30px ${ORANGE}55`,
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
    <footer style={{ background: INK, padding: "clamp(64px,11vw,110px) clamp(20px,6vw,48px) clamp(40px,7vw,64px)", textAlign: "center" }}>
      <Reveal>
        <div style={{ ...SANS, fontSize: 10, letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(250,248,245,0.45)" }}>
          Хүндэтгэсэн
        </div>
      </Reveal>

      <Reveal delay={0.1} style={{ marginTop: 26 }}>
        {logo ? (
          // Лого нь ил тод эсвэл цагаан дэвсгэртэй байж болно — аль ч тохиолдолд
          // зөв харагдахын тулд цайвар "чип" дотор тавина (өнгө нь эвдрэхгүй)
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: PAPER, borderRadius: 6, padding: "14px 24px",
          }}>
            <img
              src={logo}
              alt={org}
              style={{ height: "clamp(28px,6vw,40px)", width: "auto", objectFit: "contain", display: "block", mixBlendMode: "multiply" }}
            />
          </div>
        ) : (
          <div style={{ ...DISPLAY, color: PAPER, fontSize: "clamp(26px,7vw,40px)", fontWeight: 400 }}>
            {org}
          </div>
        )}
      </Reveal>

      <Reveal delay={0.18}>
        <div style={{ ...SANS, marginTop: 18, fontSize: 11, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(250,248,245,0.6)" }}>
          {role}
        </div>
      </Reveal>

      <div style={{ maxWidth: 340, height: 1, background: "rgba(250,248,245,0.14)", margin: "clamp(38px,6vw,54px) auto 0" }} />

      <div style={{ ...SANS, marginTop: 22, fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(250,248,245,0.32)" }}>
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
        background: ORANGE, border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 6px 20px ${ORANGE}66`,
      }}
    >
      {playing ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill={INK}>
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill={INK}>
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
    <div style={{ background: PAPER, minHeight: "100vh", overflowX: "hidden" }}>
      {event.music_url && <audio ref={audioRef} src={event.music_url} loop preload="auto" />}
      {event.music_url && <MusicPlayer audioRef={audioRef} />}
      <T20Hero event={event} org={org} role={role} logo={logo} />
      <T20Invite event={event} />
      <T20Standards event={event} />
      <T20Countdown event={event} />
      <T20Venue event={event} />
      <T20Footer org={org} role={role} logo={logo} />
    </div>
  );
}
