import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionTemplate } from "motion/react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { EventData } from "../../types/event";
import { getPoemLines, getSchedule, type ScheduleItem } from "../../lib/eventContent";
import { HorizontalCarousel, type CarouselSlide } from "../components/HorizontalCarousel";

// ─── Template 19 — "Little Prince" ────────────────────────────────────────────
// Template12 ("Cormorant")-ийн бүтцэн дээр суурилсан ЭРЭГТЭЙ ХҮҮХДИЙН ТӨРСӨН
// ӨДРИЙН урилга. Ганц хүүхдийн нэр, хөх баяр ёслолын палитр, цэцгийн оронд
// бөмбөлөг/од чимэглэл, бүх текст төрсөн өдрийн агуулгатай.

// ─── palette ────────────────────────────────────────────────────────────────
const CREAM  = "hsl(205 60% 97%)";   // цайвар тэнгэрлэг
const INK    = "hsl(215 45% 20%)";   // гүн navy
const ACCENT = "hsl(205 85% 52%)";   // тод хөх

const POLAROID: React.CSSProperties = {
  boxShadow: "0 4px 18px rgba(30,50,80,0.14), 0 1px 4px rgba(30,50,80,0.08)",
};

// ─── helpers ────────────────────────────────────────────────────────────────
// Тусгай slug дээр footer-ийн нэрийн бичиглэлийг гараар тогтооно.
const FOOTER_NAMES_OVERRIDE: Record<string, string> = {};

// events хүснэгтэд утасны багана байхгүй тул холбоо барих дугаарыг slug тус
// бүрээр энд бүртгэнэ. Footer-т нэрийн доор гарна.
const FOOTER_PHONES: Record<string, string[]> = {
  anar: ["99099146", "99039420"],
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()} оны ${d.getMonth() + 1}-р сарын ${d.getDate()}`;
}

// Countdown-ын том огноог 2 хэсэг болгож буцаана (утсан дээр 2 мөр).
function formatDateParts(iso: string): [string, string] | null {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return [`${d.getFullYear()} оны`, `${d.getMonth() + 1}-р сарын ${d.getDate()}`];
}

// ─── Reveal ─────────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.32em", color: `color-mix(in srgb, ${INK} 50%, ${CREAM})` }}
    >
      {children}
    </div>
  );
}

// ─── Video intro overlay ─────────────────────────────────────────────────────
const T19_INTRO_VIDEO_URL =
  "https://nautical-template.thedigitalyes.com/assets/intro-video-DHxaiZtX.mp4";

function T19VideoIntro({ audioRef }: {
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
        position: "fixed", inset: 0,
        background: "#000",
        zIndex: 9999,
        overflow: "hidden",
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      <video
        ref={videoRef}
        src={T19_INTRO_VIDEO_URL}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleEnded}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
        }}
      />
    </motion.div>
  );
}

// ─── Navbar ─────────────────────────────────────────────────────────────────
function T19Navbar({ mono, names }: { mono: string; names: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links: [string, string][] = [
    ["Болох газар", "#venue"],
    ["Тоолол", "#countdown"],
    ["Бүртгэл", "#rsvp"],
  ];

  return (
    <>
      <motion.nav
        animate={{
          paddingTop: scrolled ? 8 : 14,
          paddingBottom: scrolled ? 8 : 14,
          width: scrolled ? "min(880px, calc(100vw - 32px))" : "min(960px, calc(100vw - 32px))",
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 50, borderRadius: 9999,
          background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingLeft: 20, paddingRight: 12,
          boxShadow: "0 8px 30px rgba(30,50,80,0.08), 0 1px 2px rgba(30,50,80,0.04)",
        }}
      >
        <a
          href="#top"
          style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
            fontSize: 22, lineHeight: 1, color: INK, textDecoration: "none", userSelect: "none",
          }}
        >
          {mono}
        </a>

        <div className="hidden md:flex items-center gap-7" style={{ fontSize: 13, letterSpacing: "0.06em", color: `${INK}cc` }}>
          {links.map(([label, href]) => (
            <a key={label} href={href} style={{ color: "inherit", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = INK)}
              onMouseLeave={e => (e.currentTarget.style.color = `${INK}cc`)}
            >
              {label}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a
            href="#rsvp"
            className="hidden md:inline-block"
            style={{
              background: INK, color: "#fff", fontSize: 12, letterSpacing: "0.14em",
              textTransform: "uppercase", borderRadius: 9999, padding: "10px 20px",
              textDecoration: "none",
            }}
          >
            Бүртгэл
          </a>
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="md:hidden"
            style={{
              width: 40, height: 40, display: "grid", placeItems: "center",
              borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer",
            }}
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
              <path d="M0 1h18M0 7h18M0 13h18" stroke={INK} strokeWidth="1.4" />
            </svg>
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 60 }}
            className="md:hidden"
          >
            <div style={{ position: "absolute", inset: 0, background: `${INK}66` }} onClick={() => setOpen(false)} />
            <motion.div
              initial={{ y: "-100%" }} animate={{ y: 0 }} exit={{ y: "-100%" }}
              transition={{ type: "tween", duration: 0.35, ease: "easeOut" }}
              style={{
                position: "absolute", insetInline: 0, top: 0,
                background: CREAM, padding: "24px 24px 40px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 26, color: INK }}>
                  {mono}
                </span>
                <button onClick={() => setOpen(false)}
                  style={{ width: 40, height: 40, display: "grid", placeItems: "center", border: "none", background: "transparent", cursor: "pointer" }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke={INK} strokeWidth="1.4" />
                  </svg>
                </button>
              </div>
              <div style={{ marginTop: 32, display: "flex", flexDirection: "column", borderTop: `1px solid ${INK}1a` }}>
                {links.map(([label, href]) => (
                  <a key={label} href={href} onClick={() => setOpen(false)}
                    style={{
                      fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: INK,
                      padding: "20px 0", borderBottom: `1px solid ${INK}1a`, textDecoration: "none",
                    }}
                  >
                    {label}
                  </a>
                ))}
              </div>
              <p style={{ marginTop: 40, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: `${INK}99`, fontSize: 15 }}>
                {names}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────
const HERO_FALLBACK = "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=2400&q=80";

function T19Hero({ name, date, heroImage }: { name: string; date: string; heroImage?: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 800], [0, 160]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0.4]);

  return (
    <section ref={ref} id="top" style={{ position: "relative", height: "100svh", minHeight: 640, width: "100%", overflow: "hidden" }}>
      <motion.div style={{ y: yBg, position: "absolute", inset: 0, top: -40, bottom: -40 }}>
        <img
          src={heroImage || HERO_FALLBACK}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </motion.div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.08), transparent 40%, rgba(0,0,0,0.55))" }} />

      <motion.div
        style={{ opacity, position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: "clamp(80px,10vw,112px)", paddingInline: "clamp(24px,6vw,48px)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          style={{ textAlign: "center" }}
        >
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "clamp(12px,3vw,16px)", textTransform: "uppercase", letterSpacing: "0.4em", marginBottom: 18 }}>
            Сэвлэг үргээх ёслолын урилга
          </div>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
              color: "#fff", lineHeight: 0.9, letterSpacing: "-0.02em",
              fontSize: "clamp(3.2rem, 10.5vw, 9rem)", margin: 0,
            }}
          >
            {name}
          </h1>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "clamp(14px,3.4vw,19px)", textTransform: "uppercase", letterSpacing: "0.35em", marginTop: 24 }}>
            {formatDate(date)}
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        style={{
          position: "absolute", right: "clamp(24px,4vw,40px)", bottom: 32,
          display: "flex", alignItems: "center", gap: 12,
          color: "rgba(255,255,255,0.85)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.3em",
        }}
      >
        <span>Scroll</span>
        <motion.svg
          width="14" height="22" viewBox="0 0 14 22" fill="none"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M7 1v18M1 13l6 6 6-6" stroke="currentColor" strokeWidth="1.2" />
        </motion.svg>
      </motion.div>
    </section>
  );
}

// ─── Photo collage (used on mobile grid + desktop sticky) ─────────────────────
const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=80",
  "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=700&q=80",
  "https://images.unsplash.com/photo-1607453998774-d533f65dac99?w=900&q=80",
  "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=700&q=80",
];

function MobileParallaxPhoto({ src, amount = 30, grayscale, style }: {
  src: string; amount?: number; grayscale?: boolean; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y     = useTransform(scrollYProgress, [0, 1], [amount, -amount]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.96, 1, 0.96]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.8]);
  return (
    <motion.div ref={ref} style={{ ...style, y, scale, opacity }}>
      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover",
        ...(grayscale ? { filter: "grayscale(1) contrast(1.05)" } : {}) }} />
    </motion.div>
  );
}

// ─── Story ────────────────────────────────────────────────────────────────────
const STORY_FALLBACKS = [
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80",
  "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&q=80",
  "https://images.unsplash.com/photo-1607453998774-d533f65dac99?w=600&q=80",
  "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&q=80",
  "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&q=80",
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&q=80",
];

const STACK_SLOTS = [
  [{ x: -95, r: -8, z: 1 }, { x: 0,  r:  2, z: 2 }, { x: 90, r:  9, z: 3 }],
  [{ x: -88, r:  7, z: 1 }, { x: 5,  r: -3, z: 2 }, { x: 85, r: -8, z: 3 }],
];

function ScrollPhoto({
  src, caption, scrollYProgress, enterRange, slot, grayscale, width = 260,
}: {
  src: string; caption?: string;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  enterRange: [number, number];
  slot: { x: number; r: number; z: number };
  grayscale?: boolean;
  width?: number;
}) {
  const y      = useTransform(scrollYProgress, enterRange, [500, 0]);
  const x      = useTransform(scrollYProgress, enterRange, [0, slot.x]);
  const rotate = useTransform(scrollYProgress, enterRange, [0, slot.r]);
  const opacity = useTransform(scrollYProgress, [enterRange[0], enterRange[0] + 0.06], [0, 1]);

  return (
    <motion.div
      style={{
        y, x, rotate, opacity,
        position: "absolute",
        background: "#fff",
        padding: "12px 12px 56px",
        borderRadius: 4,
        width,
        zIndex: slot.z,
        boxShadow: "0 8px 28px rgba(30,50,80,0.16), 0 1px 4px rgba(30,50,80,0.08)",
      }}
    >
      <div style={{ aspectRatio: "4/3", overflow: "hidden", background: "#e9f1f8" }}>
        <img
          src={src} alt=""
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            ...(grayscale ? { filter: "grayscale(0.7) contrast(1.05)" } : {}),
          }}
        />
      </div>
      {caption && (
        <div style={{
          position: "absolute", bottom: 10, left: 0, right: 0,
          textAlign: "center", fontFamily: "'Dancing Script', cursive",
          color: `${INK}cc`, fontSize: 19, lineHeight: 1,
        }}>
          {caption}
        </div>
      )}
    </motion.div>
  );
}

const DEFAULT_CHAPTERS = [
  {
    num: "нэг",
    title: "Миний өссөн он жилүүд",
    body: "Балчир нялх байснаас өнөөдрийг хүртэл өнгөрсөн хором мөч бүр гэр бүлийн маань хамгийн үнэт эрдэнэ. Инээд хөөр дүүрэн энэ замыг та бүхэнтэй хамт тэмдэглэе.",
    bodies: [
      "Анхны инээмсэглэл, анхны алхам — бүх зүйл гайхамшигтай эхэлсэн.",
      "Өдрөөс өдөрт өсч томорсоор, дэлхийг сониуч нүдээр танин мэдэв.",
      "Өнөөдөр бид дахин нэг баярт өдрийг хамтдаа угтаж байна.",
    ],
    captions: ["Анхны өдрүүд", "Өсч торнисон нь", "Өнөөдөр"],
  },
];

const ENTER_RANGES: [number, number][] = [
  [0.05, 0.30],
  [0.28, 0.53],
  [0.51, 0.76],
];

function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn, { passive: true } as EventListenerOptions);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

function StoryChapter({
  srcs, captions, num, title, body, bodies, slots,
}: {
  srcs: string[]; captions: string[];
  num: string; title: string; body: string; bodies?: string[];
  slots: typeof STACK_SLOTS[0];
  reverse: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const isMobile = useIsMobile();

  const mobileSlides: CarouselSlide[] = srcs.map((src, i) => ({
    src,
    title: captions[i] || title,
    sub: num,
    index: String(i + 1).padStart(2, "0"),
    desc: bodies?.[i] || body,
  }));

  const watermark = (
    <div style={{ position: "sticky", top: 0, height: 0, overflow: "visible", zIndex: 0, pointerEvents: "none" }}>
      <div
        aria-hidden="true"
        style={{
          position: "absolute", top: "clamp(8px,2vw,20px)", left: "50%", transform: "translateX(-50%)",
          fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
          fontSize: "clamp(4.5rem, 14vw, 16rem)",
          color: `color-mix(in srgb, ${INK} 9%, ${CREAM})`,
          whiteSpace: "nowrap", letterSpacing: "-0.03em", lineHeight: 1,
          userSelect: "none",
        }}
      >
        миний түүх
      </div>
    </div>
  );

  /* ── MOBILE: HorizontalCarousel only ── */
  if (isMobile) {
    return (
      <HorizontalCarousel
        slides={mobileSlides}
        heading={title}
        subLabel={num}
      />
    );
  }

  /* ── DESKTOP: 200vh sticky scroll animation ── */
  return (
    <section ref={ref} style={{ height: "200vh", position: "relative" }}>
      {watermark}
      <div style={{
        position: "sticky", top: 0, height: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", maxWidth: 1000, width: "100%", padding: "0 clamp(20px,4vw,48px)" }}>
          <div style={{ position: "relative", height: 480, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {srcs.map((src, i) => (
              <ScrollPhoto
                key={i}
                src={src}
                caption={captions[i]}
                scrollYProgress={scrollYProgress}
                enterRange={ENTER_RANGES[i]}
                slot={slots[i]}
                grayscale={i === 1}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function T19Story({ photos }: { photos: string[] }) {
  const allImgs = [...photos, ...STORY_FALLBACKS];

  const chapters = DEFAULT_CHAPTERS.map((ch, ci) => ({
    ...ch,
    srcs: allImgs.slice(ci * 3, ci * 3 + 3),
    slots: STACK_SLOTS[ci % 2],
    reverse: ci % 2 === 1,
  }));

  return (
    <div style={{ background: CREAM }}>
      {chapters.map((ch, i) => (
        <StoryChapter key={i} {...ch} />
      ))}
    </div>
  );
}

// ─── Countdown ───────────────────────────────────────────────────────────────
function useCountdown(isoDate: string) {
  const target = useMemo(() => new Date(isoDate).getTime(), [isoDate]);
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
  };
}

// ── Festive decorations (бөмбөлөг, од) ──────────────────────────────────────
function Balloon({ size = 90, color = "#4A90D9" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 1.42} viewBox="0 0 80 114" fill="none">
      <ellipse cx="40" cy="40" rx="30" ry="36" fill={color} />
      <ellipse cx="30" cy="26" rx="7" ry="11" fill="rgba(255,255,255,0.4)" />
      <path d="M36 75 L40 82 L44 75 Z" fill={color} />
      <path d="M40 82 q7 12 -2 28" stroke={color} strokeWidth="1.4" fill="none" opacity="0.55" />
    </svg>
  );
}

function Star({ size = 66, color = "#F2B705" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path
        d="M50 5 L61.8 38.2 L97 39 L68.6 60 L79 94 L50 73.4 L21 94 L31.4 60 L3 39 L38.2 38.2 Z"
        fill={color} stroke="rgba(0,0,0,0.05)" strokeWidth="1"
      />
    </svg>
  );
}

type DecorItem = {
  kind: "balloon" | "star"; color: string; size: number; d: number; rotate: number;
} & Record<"top" | "bottom" | "left" | "right", string | undefined>;

const DECOR: Partial<DecorItem>[] = [
  { kind: "balloon", color: "#4A90D9", size: 100, top: "5%",    left: "3%",  d: 0,   rotate: -10 },
  { kind: "star",    color: "#F2B705", size: 60,  top: "9%",    right: "5%", d: 0.4, rotate: 8   },
  { kind: "balloon", color: "#E0555B", size: 82,  bottom: "16%",left: "6%",  d: 0.9, rotate: 12  },
  { kind: "star",    color: "#3CB5A0", size: 52,  bottom: "10%",right: "6%", d: 1.4, rotate: -8  },
  { kind: "balloon", color: "#5EC2E8", size: 90,  top: "48%",   left: "2%",  d: 1.9, rotate: 6   },
  { kind: "star",    color: "#F2B705", size: 46,  top: "44%",   right: "3%", d: 2.3, rotate: -16 },
];

// ─── Fireworks canvas ─────────────────────────────────────────────────────────
const FW_COLORS = [
  "#F0C040","#D4A820","#F080A0","#E86090",
  "#6090D8","#80B0F0","#FFFFFF","#F0F0F0",
  "#C080E0","#80C870","#F09050","#A0D8A0",
];

type FWParticle = { x:number; y:number; vx:number; vy:number; alpha:number; decay:number; color:string; r:number };
type FWRocket   = { x:number; y:number; vy:number; targetY:number; color:string; exploded:boolean };

function Fireworks({ trigger }: { trigger: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const W = canvas.width;
    const H = canvas.height;

    const rockets: FWRocket[]   = [];
    const parts:   FWParticle[] = [];
    let launched = 0;
    let frame    = 0;

    function launch() {
      const color = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)];
      rockets.push({
        x: W * (0.1 + Math.random() * 0.8),
        y: H,
        vy: -(H * 0.013 + Math.random() * H * 0.006),
        targetY: H * (0.08 + Math.random() * 0.38),
        color,
        exploded: false,
      });
      launched++;
    }

    function burst(r: FWRocket) {
      const n = 70 + Math.floor(Math.random() * 40);
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.25;
        const spd   = 1.5 + Math.random() * 4;
        const col   = Math.random() < 0.25 ? FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)] : r.color;
        parts.push({ x:r.x, y:r.targetY, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd,
          alpha: 0.9 + Math.random()*0.1, decay: 0.011 + Math.random()*0.012, color:col, r:1.2+Math.random()*2.8 });
      }
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd   = 5 + Math.random() * 6;
        parts.push({ x:r.x, y:r.targetY, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd - 1,
          alpha:1, decay:0.04+Math.random()*0.04, color:"#FFFFFF", r:0.7+Math.random()*1.3 });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      frame++;
      if (frame % 24 === 0 && launched < 8) launch();

      for (const rk of rockets) {
        if (rk.exploded) continue;
        rk.y += rk.vy;
        if (rk.y <= rk.targetY) { rk.exploded = true; burst(rk); continue; }
        ctx.beginPath();
        ctx.arc(rk.x, rk.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = rk.color;
        ctx.fill();
        for (let t = 1; t <= 6; t++) {
          ctx.beginPath();
          ctx.arc(rk.x + (Math.random()-0.5)*1.5, rk.y + t*5, Math.max(0.1, 2-t*0.28), 0, Math.PI*2);
          ctx.fillStyle = `${rk.color}${Math.floor((1-t/6)*180).toString(16).padStart(2,"0")}`;
          ctx.fill();
        }
      }

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.058; p.vx *= 0.985; p.alpha -= p.decay;
        if (p.alpha <= 0) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const done = launched >= 8 && rockets.every(r => r.exploded) && parts.length === 0;
      if (!done) rafRef.current = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, W, H);
    }

    launch();
    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); ctx.clearRect(0, 0, W, H); };
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:10 }}
    />
  );
}

// Огнооны доор "11 цагт" гэж цаг харуулах slug-ууд (CountdownTimer-тэй ижил
// хэв маяг). Бүтэн цаг бол ":00"-г хасаж "11 цагт" гэж уншина.
const SHOW_TIME_UNDER_DATE = new Set<string>(["anar"]);

function timeLabel(time: string) {
  return time.replace(/:00$/, "");
}

function T19Countdown({ date, title, time, slug }: {
  date: string; title: string; time?: string; slug?: string;
}) {
  const { days, hours, minutes, seconds } = useCountdown(date);
  const showTime = !!time && !!slug && SHOW_TIME_UNDER_DATE.has(slug);
  const tan = `color-mix(in srgb, ${ACCENT} 65%, ${CREAM})`;
  const sectionRef  = useRef<HTMLElement>(null);
  const [fwTrigger, setFwTrigger] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let inView = false;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !inView) {
        inView = true;
        setFwTrigger(n => n + 1);
      } else if (!entry.isIntersecting) {
        inView = false;
      }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cell = (label: string, val: number) => (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontFamily: "'Cormorant Garamond', serif", color: INK,
        fontSize: "clamp(2.2rem, 5.5vw, 4.2rem)", fontWeight: 500,
        fontVariantNumeric: "tabular-nums",
      }}>
        {String(val).padStart(2, "0")}
      </div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.32em", color: `color-mix(in srgb, ${INK} 50%, ${CREAM})`, marginTop: 8 }}>
        {label}
      </div>
    </div>
  );

  return (
    <section ref={sectionRef} id="countdown" style={{ position: "relative", background: CREAM, padding: "clamp(80px,12vw,176px) 24px", overflow: "hidden" }}>
      <Fireworks trigger={fwTrigger} />
      {DECOR.map((f, i) => {
        const { kind, color, size, d, rotate: initRot, ...pos } = f as DecorItem;
        const El = kind === "balloon" ? Balloon : Star;
        return (
          <motion.div
            key={i}
            aria-hidden="true"
            style={{ position: "absolute", pointerEvents: "none", userSelect: "none", rotate: initRot, ...pos }}
            animate={{ y: [0, -14, 0], rotate: [initRot, initRot + 5, initRot] }}
            transition={{ duration: 4.5 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: d }}
          >
            <El size={size} color={color} />
          </motion.div>
        );
      })}

      <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <Reveal>
          <Eyebrow>Сэвлэг үргээх ёслол хүртэл</Eyebrow>
        </Reveal>
        <Reveal delay={0.1}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
            color: tan, marginTop: 24, lineHeight: 0.95, letterSpacing: "-0.02em",
            fontSize: "clamp(3rem, 11vw, 9rem)",
          }}>
            {(() => {
              const parts = formatDateParts(date);
              if (!parts) return formatDate(date);
              return <>{parts[0]}<br className="md:hidden" /> {parts[1]}</>;
            })()}
          </div>
        </Reveal>
        {showTime && (
          <Reveal delay={0.15}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: tan, marginTop: 14, lineHeight: 1.1,
              fontSize: "clamp(1.6rem, 5vw, 2.6rem)",
            }}>
              {timeLabel(time!)} цагт
            </div>
          </Reveal>
        )}
        <Reveal delay={0.2}>
          <div style={{ marginTop: "clamp(48px,8vw,80px)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(16px,4vw,40px)", maxWidth: 700, margin: "clamp(48px,8vw,80px) auto 0" }}>
            {cell("Өдөр", days)}
            {cell("Цаг", hours)}
            {cell("Минут", minutes)}
            {cell("Секунд", seconds)}
          </div>
        </Reveal>
        {title && (
          <Reveal delay={0.3}>
            <div style={{ marginTop: 32, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.3em", color: `color-mix(in srgb, ${INK} 50%, ${CREAM})` }}>
              {title}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

// ─── Schedule ────────────────────────────────────────────────────────────────
// events.schedule хоосон үед харагдах үндсэн хөтөлбөр (төрсөн өдрийн)
const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { time: "12:00", label: "Зочид цугларах", desc: "Урилгаар ирсэн хүндэт зочид морилно" },
  { time: "12:30", label: "Мэндчилгээ", desc: "Эцэг эх, ойр дотныхны мэндчилгээ" },
  { time: "13:00", label: "Сэвлэг үргээх ёслол", desc: "Хүндэт зочид сэвлэг үргээх ёслол үйлдэнэ" },
  { time: "13:30", label: "Тоглоом наадгай", desc: "Хүүхдүүдийн тоглоом, хөгжөөнт уралдаан" },
  { time: "14:00", label: "Бэлэг гардуулах", desc: "Бэлэг дурсгал гардуулах" },
  { time: "14:30", label: "Хүндэтгэлийн зоог", desc: "Баярын зоог, амттан" },
  { time: "15:00", label: "Чөлөөт цаг", desc: "Хөгжим, бүжиг, дурсгалын зураг" },
];

function T19Schedule({ event }: { event: EventData }) {
  const schedule = getSchedule(event, DEFAULT_SCHEDULE);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start center", "end center"] });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section style={{ background: CREAM, paddingBlock: "clamp(80px,12vw,140px)", paddingInline: 24 }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center", marginBottom: "clamp(48px,8vw,80px)" }}
        >
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.32em", color: `color-mix(in srgb, ${INK} 50%, ${CREAM})`, marginBottom: 12 }}>
            Өдрийн цагийн хуваарь
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem,6vw,3.2rem)", color: INK, letterSpacing: "-0.01em" }}>
            Баярын хөтөлбөр
          </div>
        </motion.div>

        <div ref={containerRef} style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 86, top: 6, bottom: 6, width: 1, background: `${INK}14` }} />
          <motion.div style={{ position: "absolute", left: 86, top: 6, width: 1, height: lineHeight, background: `${INK}55`, originY: 0 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(28px,5vw,40px)" }}>
            {schedule.map(({ time, label, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.65, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: "flex", alignItems: "flex-start", gap: 24 }}
              >
                <div style={{ width: 70, flexShrink: 0, textAlign: "right", paddingTop: 2 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: `color-mix(in srgb, ${INK} 55%, ${CREAM})`, letterSpacing: "0.04em" }}>
                    {time}
                  </span>
                </div>

                <div style={{ flexShrink: 0, marginTop: 5, width: 9, height: 9, background: INK, transform: "rotate(45deg)", marginLeft: 7, marginRight: 7 }} />

                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 17, color: INK, letterSpacing: "-0.01em" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 12, color: `color-mix(in srgb, ${INK} 45%, ${CREAM})`, marginTop: 3, letterSpacing: "0.02em" }}>
                    {desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Venue ───────────────────────────────────────────────────────────────────
function T19Venue({ name, address, mapUrl, image }: { name: string; address: string; mapUrl?: string; image?: string }) {
  const VENUE_FALLBACK = "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=2000&q=80";
  // Зургийн жинхэнэ харьцаанд тааруулж бүтнээр харуулна (тайрахгүй).
  // Хэт өндөр/өргөнийг сэргийлж 3/4-21/9 хооронд clamp хийнэ.
  const [ratio, setRatio] = useState(21 / 9);
  return (
    <section id="venue" style={{ background: CREAM, paddingTop: 80, paddingBottom: 128, paddingInline: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Reveal>
          <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: ratio, position: "relative", ...POLAROID }}>
            <img
              src={image || VENUE_FALLBACK}
              alt={name}
              onLoad={(e) => {
                const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                if (w && h) setRatio(Math.min(Math.max(w / h, 0.75), 21 / 9));
              }}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.92) contrast(0.98)" }}
            />
          </div>
        </Reveal>

        <div style={{ textAlign: "center", marginTop: 56 }}>
          <Reveal delay={0.1}><Eyebrow>Болох газар</Eyebrow></Reveal>
          <Reveal delay={0.2}>
            <div style={{
              marginTop: 16, fontFamily: "'Cormorant Garamond', serif",
              color: INK, fontSize: "clamp(2.2rem, 5.5vw, 4rem)", fontWeight: 700, letterSpacing: "-0.01em",
            }}>
              {name}
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <div style={{ marginTop: 12, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: `color-mix(in srgb, ${INK} 50%, ${CREAM})` }}>
              {address}
            </div>
          </Reveal>
          {mapUrl && (
            <Reveal delay={0.4}>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block", marginTop: 40,
                  background: INK, color: "#fff", fontSize: 12,
                  textTransform: "uppercase", letterSpacing: "0.22em",
                  borderRadius: 9999, padding: "18px 40px", textDecoration: "none",
                  boxShadow: `0 10px 28px ${INK}44`,
                }}
              >
                Газрын зураг
              </a>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Quote (scroll-driven word reveal) ───────────────────────────────────────
// events.poem хоосон үед харагдах үндсэн ерөөл
const DEFAULT_POEM = [
  "Өнөөдөр чиний амьдралын нэгэн онцгой өдөр,",
  "Нэг насаар өсч, нэг алхмаар урагшилсан баярт өдөр.",
  "Инээд хөөр, аз жаргалаар дүүрэн энэ өдрийг",
  "Хамгийн ойр дотны хүмүүстэйгээ хамт тэмдэглэхийг урьж байна.",
];

function T19Quote({ event }: { event: EventData }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 30%"] });

  const lines = getPoemLines(event, DEFAULT_POEM).filter((l) => l !== "");
  const words = lines.flatMap(l => l.split(" "));

  // Хүүхдийн нэрийг шүлэг дотор тодруулна (bold + хөх). Нэрийг зай/зураас/цэгээр
  // салгаж токен болгоод, шүлгийн үг тэдгээртэй тохирвол онцолно. Зураасаар
  // холбогдсон "Зэс-Эрдэнэ" мэт бүтэн нэрийг ч зөв таниулна.
  const clean = (s: string) => s.replace(/[^\p{L}]/gu, "").toLowerCase();
  const nameTokens = new Set(
    (event.person1_name || "").split(/[\s.\-–]+/).map(clean).filter((t) => t.length >= 2),
  );
  const isName = (w: string) => {
    const parts = w.split(/[-–]/).map(clean).filter(Boolean);
    return parts.length > 0 && parts.every((p) => nameTokens.has(p));
  };

  const lineEndIndices = new Set<number>();
  let acc = 0;
  lines.forEach((line, li) => {
    acc += line.split(" ").length;
    if (li < lines.length - 1) lineEndIndices.add(acc - 1);
  });

  return (
    <section ref={ref} style={{ background: CREAM, padding: "clamp(80px,12vw,192px) 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          color: INK, lineHeight: 1.55, fontWeight: 700, letterSpacing: "-0.01em",
          fontSize: "clamp(1.6rem, 5vw, 4rem)", margin: 0,
        }}>
          {words.map((w, i) => {
            const start = i / words.length;
            const end = start + 1.5 / words.length;
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const op = useTransform(scrollYProgress, [start, end], [0.15, 1]);
            const highlight = isName(w);
            return (
              <span key={i}>
                <motion.span style={{
                  opacity: highlight ? 1 : op, display: "inline-block", marginRight: "0.22em",
                  ...(highlight ? { fontWeight: 700, color: "#1D6FE3" } : {}),
                }}>
                  {w}
                </motion.span>
                {lineEndIndices.has(i) && <br />}
              </span>
            );
          })}
        </p>
      </div>
    </section>
  );
}

// ─── RSVP ────────────────────────────────────────────────────────────────────
function T19RSVP({ eventId }: { eventId: string }) {
  const [form, setForm] = useState({ name: "", phone: "", adults: "1", children: "0", message: "" });
  const [loading, setLoading] = useState(false);

  const reset = () => setForm({ name: "", phone: "", adults: "1", children: "0", message: "" });

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const adults = Number(form.adults);
    const children = Number(form.children);
    // rsvp хүснэгтэд хүүхдийн тусдаа багана байхгүй тул нийт тоог guests-д,
    // задаргааг message-д хадгална.
    const breakdown = `Том хүн: ${adults}, Хүүхэд: ${children}`;
    const note = form.message.trim() ? `${form.message.trim()} — ${breakdown}` : breakdown;

    if (eventId === "demo") {
      setLoading(false);
      toast.success("Баярлалаа! Таны ирц баталгаажлаа.");
      reset();
      return;
    }
    const { error } = await supabase.from("rsvp").insert({
      event: eventId,
      name: form.name,
      phone: form.phone,
      guests: adults + children,
      message: note,
    });
    setLoading(false);
    if (error) toast.error("Алдаа гарлаа. Дахин оролдоно уу.");
    else {
      toast.success("Баярлалаа! Таны ирц баталгаажлаа.");
      reset();
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", border: `1px solid ${INK}22`, borderRadius: 12,
    padding: "14px 16px", fontSize: 15, color: INK,
    background: "rgba(255,255,255,0.7)", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, textTransform: "uppercase",
    letterSpacing: "0.22em", color: `color-mix(in srgb, ${INK} 55%, ${CREAM})`,
    marginBottom: 8,
  };

  return (
    <section id="rsvp" style={{ background: CREAM, paddingInline: 24, paddingBlock: "clamp(80px,12vw,160px)" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <Reveal className="text-center mb-14">
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
            fontSize: "clamp(2.2rem, 6vw, 3.8rem)", color: INK, letterSpacing: "-0.01em",
          }}>
            Ирц бүртгэл
          </div>
        </Reveal>

        <form onSubmit={handle} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={labelStyle}>Нэр</label>
            <input required style={inputStyle} value={form.name} placeholder="Таны нэр"
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Утасны дугаар</label>
            <input style={inputStyle} value={form.phone} placeholder="99xxxxxx"
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Том хүн</label>
              <select
                style={{ ...inputStyle, appearance: "none" }}
                value={form.adults}
                onChange={e => setForm(p => ({ ...p, adults: e.target.value }))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>{n} том хүн</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Хүүхэд</label>
              <select
                style={{ ...inputStyle, appearance: "none" }}
                value={form.children}
                onChange={e => setForm(p => ({ ...p, children: e.target.value }))}
              >
                {[0, 1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n} хүүхэд</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Мэндчилгээ (заавал биш)</label>
            <textarea
              style={{ ...inputStyle, height: 100, resize: "vertical" }}
              value={form.message}
              placeholder="Эзэн хүүд ерөөл үлдээнэ үү..."
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? `${INK}88` : INK, color: "#fff",
              border: "none", borderRadius: 9999,
              padding: "18px 40px", fontSize: 13, fontFamily: "inherit",
              textTransform: "uppercase", letterSpacing: "0.2em", cursor: "pointer",
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Илгээж байна..." : "Бүртгүүлэх"}
          </button>
        </form>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function T19Footer({ names, phones = [] }: { names: string; phones?: string[] }) {
  return (
    <footer style={{ background: CREAM, paddingTop: 96, paddingBottom: 64, textAlign: "center", position: "relative" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.28em", color: `color-mix(in srgb, ${INK} 50%, ${CREAM})` }}>
        {names}
      </div>
      {phones.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, letterSpacing: "0.06em", color: `color-mix(in srgb, ${INK} 60%, ${CREAM})` }}>
          Утас:{" "}
          {phones.map((phone, i) => (
            <span key={phone}>
              {i > 0 && ", "}
              <a href={`tel:${phone}`} style={{ color: "inherit", textDecoration: "none" }}>
                {phone}
              </a>
            </span>
          ))}
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.28em", color: `color-mix(in srgb, ${INK} 35%, ${CREAM})` }}>
        Сэвлэг үргээх ёслол
      </div>
    </footer>
  );
}

// ─── Music player ────────────────────────────────────────────────────────────
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
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000 }}>
      <button onClick={toggle} style={{
        width: 48, height: 48, borderRadius: "50%",
        background: INK, border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
      }}>
        {playing ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill={CREAM}>
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill={CREAM}>
            <polygon points="6,3 20,12 6,21" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
// Хөтөлбөр (T19Schedule) хэсгийг нуух slug-ууд.
const HIDE_SCHEDULE = new Set<string>(["anar"]);

export default function Template19({ event }: { event: EventData }) {
  // Төрсөн өдрийн урилга — ганц хүүхдийн нэр
  const name  = event.person1_name || "Билгүүн";
  const names = FOOTER_NAMES_OVERRIDE[event.slug] ?? name;
  const allPhotos = [...(event.gallery_photos || []), ...(event.gallery2_photos || [])];
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    document.documentElement.style.setProperty("--t19-cream", CREAM);
    document.documentElement.style.setProperty("--t19-ink",   INK);
    document.documentElement.style.setProperty("--t19-accent", ACCENT);
    return () => {
      document.documentElement.style.removeProperty("--t19-cream");
      document.documentElement.style.removeProperty("--t19-ink");
      document.documentElement.style.removeProperty("--t19-accent");
    };
  }, []);

  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <T19VideoIntro audioRef={audioRef} />
      {event.music_url && <audio ref={audioRef} src={event.music_url} loop preload="auto" />}
      {event.music_url && <MusicPlayer audioRef={audioRef} />}
      <T19Hero name={name} date={event.date} heroImage={event.main_image} />
      <T19Story photos={allPhotos} />
      <T19Countdown date={event.date} title={event.title} time={event.time} slug={event.slug} />
      {/* Эдгээр slug дээр хөтөлбөрийн хэсгийг нуух */}
      {!HIDE_SCHEDULE.has(event.slug) && <T19Schedule event={event} />}
      <T19Venue name={event.venue_name} address={event.venue_address} mapUrl={event.venue_map_url} image={event.maps_photo} />
      <T19Quote event={event} />
      <T19RSVP eventId={event.id} />
      <T19Footer names={names} phones={FOOTER_PHONES[event.slug]} />
      <Toaster />
    </div>
  );
}
