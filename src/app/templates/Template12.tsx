import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionTemplate } from "motion/react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { EventData } from "../../types/event";
import { getPoemLines, getSchedule, type ScheduleItem } from "../../lib/eventContent";
import { HorizontalCarousel, type CarouselSlide } from "../components/HorizontalCarousel";

// ─── palette ────────────────────────────────────────────────────────────────
const CREAM  = "hsl(220 18% 96%)";
const INK    = "hsl(220 30% 16%)";
const ACCENT = "hsl(218 50% 50%)";

const POLAROID: React.CSSProperties = {
  boxShadow: "0 4px 18px rgba(44,48,68,0.13), 0 1px 4px rgba(44,48,68,0.07)",
};

// ─── helpers ────────────────────────────────────────────────────────────────
// Монограмыг ерөнхийд нь нэр бүрийн эхний үсгээр гаргана. Гэхдээ овог нэрний
// байрлал хэл болгонд өөр (монгол: эцгийн нэр эхэнд, англи: овог сүүлд) тул
// автоматаар таамаглах найдваргүй. Тусгай тохиолдлыг энд slug-аар тогтооно.
const MONO_OVERRIDE: Record<string, string> = {
  "abigail-williams": "М&A", // Мондэхүү & Abigail — хоёуланг өөрийн нэрээр
};

// Footer-ийн доод нэрийн мөр. Үндсэндээ Supabase-ийн нэрсийг шууд гаргана.
// Энд бүртгэсэн slug дээр оронд нь энэ бичиглэл гарна.
const FOOTER_NAMES_OVERRIDE: Record<string, string> = {
  "abigail-williams": "Mondekhuu Turmunkh & Abigail Williams",
};

// Хөтөлбөр (T12Schedule) хэсгийг нуух slug-ууд.
const HIDE_SCHEDULE = new Set<string>([
  "adyasuren2-khulan2",
]);

function initials(p1: string, p2?: string) {
  const a = p1.trim()[0] ?? "";
  const b = p2?.trim()[0] ?? "";
  return b ? `${a}&${b}` : a;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()} оны ${d.getMonth() + 1}-р сарын ${d.getDate()}`;
}

// Countdown-ын том огноог 2 хэсэг болгож буцаана. Утсан дээр нэг мөрөнд
// багтахгүй, сүүлийн өдрийн тоо ганцаараа доош унаж байсныг зассан.
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
const T12_INTRO_VIDEO_URL =
  "https://nautical-template.thedigitalyes.com/assets/intro-video-DHxaiZtX.mp4";

function T12VideoIntro({ audioRef }: {
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
        position: "fixed", inset: 0,
        background: "#000",
        zIndex: 9999,
        overflow: "hidden",
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      <video
        ref={videoRef}
        src={T12_INTRO_VIDEO_URL}
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
function T12Navbar({ mono, names }: { mono: string; names: string }) {
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
          boxShadow: "0 8px 30px rgba(44,48,68,0.08), 0 1px 2px rgba(44,48,68,0.04)",
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
const HERO_FALLBACK = "https://images.unsplash.com/photo-1519741497674-611481863552?w=2400&q=80";

function T12Hero({ names, date, heroImage }: { names: string; date: string; heroImage?: string }) {
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
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "clamp(14px,3.4vw,19px)", textTransform: "uppercase", letterSpacing: "0.4em", marginBottom: 24 }}>
            {formatDate(date)}
          </div>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
              color: "#fff", lineHeight: 0.9, letterSpacing: "-0.02em",
              fontSize: "clamp(3.2rem, 10.5vw, 9rem)", margin: 0,
            }}
          >
            {(() => {
              const [n1, ...rest] = names.split(" & ");
              const n2 = rest.join(" & ");
              // Зөвхөн & тэмдэгт налуу биш, энгийн байхаар салгаж рендэрлэнэ
              return n2 ? (
                <>{n1}<span style={{ fontStyle: "normal" }}> & </span>{n2}</>
              ) : names;
            })()}
          </h1>
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



// ─── Photo collage ───────────────────────────────────────────────────────────
const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=900&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=700&q=80",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=900&q=80",
  "https://images.unsplash.com/photo-1529636798458-92182e662485?w=700&q=80",
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

function T12PhotoCollage({ photos }: { photos: string[] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const heroWidthNum = useTransform(scrollYProgress, [0.0, 0.55], [100, 56]);
  const heroWidth    = useMotionTemplate`${heroWidthNum}vw`;
  const heroRadius   = useTransform(scrollYProgress, [0.0, 0.5], [0, 28]);
  const leftXNum     = useTransform(scrollYProgress, [0.3, 0.75], [-100, 0]);
  const leftX        = useMotionTemplate`${leftXNum}vw`;
  const rightXNum    = useTransform(scrollYProgress, [0.3, 0.75], [100, 0]);
  const rightX       = useMotionTemplate`${rightXNum}vw`;
  const sideOp       = useTransform(scrollYProgress, [0.3, 0.65], [0, 1]);

  const imgs = [...(photos || []), ...FALLBACK_PHOTOS].slice(0, 5);
  const [heroSrc, lt, lb, rt, rb] = imgs;
  const sideImgs = [lt, lb, rt, rb].filter(Boolean);

  return (
    <>
      {/* ── Desktop: sticky scroll-driven collage ── */}
      <section ref={ref} className="hidden md:block" style={{ position: "relative", background: CREAM, height: "300vh" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div style={{ width: heroWidth, borderRadius: heroRadius, overflow: "hidden", ...POLAROID }}>
            <div style={{ width: "100%", height: "min(85vh,860px)", overflow: "hidden", borderRadius: "inherit" }}>
              <img src={heroSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </motion.div>

          {lt && (
            <motion.div style={{ x: leftX, opacity: sideOp, rotate: -3, position: "absolute", top: "10vh", left: "17vw", width: "22vw", aspectRatio: "4/3", borderRadius: 16, overflow: "hidden", ...POLAROID }}>
              <img src={lt} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </motion.div>
          )}
          {lb && (
            <motion.div style={{ x: leftX, opacity: sideOp, rotate: 2, position: "absolute", top: "47%", left: "21vw", width: "15vw", aspectRatio: "3/4", borderRadius: 16, overflow: "hidden", ...POLAROID }}>
              <img src={lb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.05)" }} />
            </motion.div>
          )}
          {rt && (
            <motion.div style={{ x: rightX, opacity: sideOp, rotate: 3, position: "absolute", top: "12vh", right: "17vw", width: "17vw", aspectRatio: "4/3", borderRadius: 16, overflow: "hidden", ...POLAROID }}>
              <img src={rt} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </motion.div>
          )}
          {rb && (
            <motion.div style={{ x: rightX, opacity: sideOp, rotate: -2, position: "absolute", top: "44%", right: "15vw", width: "20vw", aspectRatio: "1/1", borderRadius: 16, overflow: "hidden", ...POLAROID }}>
              <img src={rb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Mobile: parallax grid ── */}
      <section className="md:hidden" style={{ background: CREAM, padding: "48px 20px 64px" }}>
        <MobileParallaxPhoto src={heroSrc} amount={45} style={{ borderRadius: 20, overflow: "hidden", aspectRatio: "4/5", marginBottom: 16, ...POLAROID }} />
        {sideImgs.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {sideImgs.map((src, i) => (
              <MobileParallaxPhoto
                key={i}
                src={src}
                amount={[30, 50, 20, 40][i]}
                grayscale={i === 1}
                style={{
                  borderRadius: 16, overflow: "hidden", aspectRatio: "4/5",
                  rotate: `${i % 2 === 0 ? -1.5 : 1.5}deg`,
                  ...POLAROID,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// ─── REMOVED: Our Story section ──────────────────────────────────────────────
// ─── Countdown ───────────────────────────────────────────────────────────────
const STORY_FALLBACKS = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80",
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80",
  "https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&q=80",
  "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&q=80",
];

// Photo final positions in the stack
const STACK_SLOTS = [
  [{ x: -95, r: -8, z: 1 }, { x: 0,  r:  2, z: 2 }, { x: 90, r:  9, z: 3 }],
  [{ x: -88, r:  7, z: 1 }, { x: 5,  r: -3, z: 2 }, { x: 85, r: -8, z: 3 }],
];


// Single scroll-driven polaroid card
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
        boxShadow: "0 8px 28px rgba(44,48,68,0.15), 0 1px 4px rgba(44,48,68,0.08)",
      }}
    >
      <div style={{ aspectRatio: "4/3", overflow: "hidden", background: "#f0ede8" }}>
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
    title: "Хэрхэн уулзсан бэ",
    body: "Нэгэн өдөр, нэгэн газар, нэгэн мөчид хоёр зам огтлолцов. Тэр агшнаас хойш ямар ч тусдаа зам байгаагүй.",
    bodies: [
      "Анхны харц, анхны инээмсэглэл — бүх зүйл тэндээс эхэлсэн.",
      "Тэр өдрийг хэзээ ч мартахгүй. Цаг хугацаа зогссон мэт санагдсан.",
      "Хоёр зам огтлолцов. Тэр агшнаас хойш ямар ч тусдаа зам байгаагүй.",
    ],
    captions: ["Анхны уулзалт", "Тэр өдөр", "Эхлэл"],
  },
];

// Photo stagger entry ranges (0-1 of scrollYProgress)
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
  srcs, captions, num, title, body, bodies, slots, reverse,
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
        манай түүх
      </div>
    </div>
  );

  const textBlock = (center: boolean) => (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      style={{ direction: "ltr", textAlign: center ? "center" : "left" }}
    >
      <p style={{
        color: `${INK}bb`, lineHeight: 1.75,
        fontSize: center ? 14 : 15,
        maxWidth: center ? 300 : 360,
        margin: center ? "0 auto" : 0,
      }}>
        {body}
      </p>
    </motion.div>
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

function T12OurStory({ photos }: { photos: string[] }) {
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

// ── SVG Botanical flowers ──────────────────────────────────────────────────
function Sakura({ size = 110 }: { size?: number }) {
  const petals = [0, 72, 144, 216, 288];
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {petals.map((a, i) => (
        <g key={i} transform={`rotate(${a} 60 60)`}>
          <path
            d="M60 60 C50 53 43 38 47 25 Q54 14 60 20 Q66 14 73 25 C77 38 70 53 60 60Z"
            fill="#F2C4CB" stroke="#E8A8B4" strokeWidth="0.6"
          />
          {/* vein */}
          <line x1="60" y1="58" x2="60" y2="24" stroke="#E8A8B4" strokeWidth="0.5" opacity="0.6" />
        </g>
      ))}
      {/* stamens */}
      {[0,45,90,135,180,225,270,315].map((a, i) => {
        const r = a * Math.PI / 180;
        return <line key={i} x1="60" y1="60" x2={60 + Math.cos(r)*10} y2={60 + Math.sin(r)*10} stroke="#D4889A" strokeWidth="0.8" />;
      })}
      {[0,45,90,135,180,225,270,315].map((a, i) => {
        const r = a * Math.PI / 180;
        return <circle key={i} cx={60 + Math.cos(r)*10} cy={60 + Math.sin(r)*10} r="1.5" fill="#D4889A" />;
      })}
      <circle cx="60" cy="60" r="5" fill="#F2C4CB" />
    </svg>
  );
}

function Peony({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {/* outer petals */}
      {[0,40,80,120,160,200,240,280,320].map((a, i) => (
        <g key={i} transform={`rotate(${a} 60 60)`}>
          <ellipse cx="60" cy="33" rx="12" ry="18" fill="#EDB8C0" stroke="#D9A0AC" strokeWidth="0.5" />
        </g>
      ))}
      {/* mid petals */}
      {[20,60,100,140,180,220,260,300,340].map((a, i) => (
        <g key={i} transform={`rotate(${a} 60 60)`}>
          <ellipse cx="60" cy="38" rx="10" ry="14" fill="#F0C8CE" stroke="#D9A0AC" strokeWidth="0.4" />
        </g>
      ))}
      {/* inner petals */}
      {[0,60,120,180,240,300].map((a, i) => (
        <g key={i} transform={`rotate(${a} 60 60)`}>
          <ellipse cx="60" cy="44" rx="8" ry="10" fill="#F5D5DA" />
        </g>
      ))}
      <circle cx="60" cy="60" r="10" fill="#F0C8CE" stroke="#D9A0AC" strokeWidth="0.5" />
      <circle cx="60" cy="60" r="5" fill="#EDB8C0" />
    </svg>
  );
}

function Daisy({ size = 100 }: { size?: number }) {
  const petals = Array.from({ length: 14 }, (_, i) => i * (360 / 14));
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {petals.map((a, i) => (
        <g key={i} transform={`rotate(${a} 60 60)`}>
          <ellipse cx="60" cy="30" rx="5.5" ry="16" fill="#F8EEE4" stroke="#E8D8C8" strokeWidth="0.5" />
        </g>
      ))}
      {/* golden center */}
      <circle cx="60" cy="60" r="14" fill="#D4A848" />
      <circle cx="60" cy="60" r="10" fill="#C49438" />
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i * 15) * Math.PI / 180;
        return <circle key={i} cx={60 + Math.cos(a)*8} cy={60 + Math.sin(a)*8} r="1.8" fill="#D4A848" opacity="0.7" />;
      })}
    </svg>
  );
}

function Tulip({ size = 105 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 140" fill="none">
      {/* stem */}
      <path d="M60 140 Q58 110 60 90" stroke="#8BAB80" strokeWidth="2.5" strokeLinecap="round" />
      {/* left leaf */}
      <path d="M60 115 Q44 105 40 90 Q52 100 60 115Z" fill="#8BAB80" opacity="0.9" />
      {/* outer left petal */}
      <path d="M60 88 C44 80 36 58 44 40 C50 26 60 28 60 88Z" fill="#D4B0C4" stroke="#C49AB4" strokeWidth="0.6" />
      {/* outer right petal */}
      <path d="M60 88 C76 80 84 58 76 40 C70 26 60 28 60 88Z" fill="#D4B0C4" stroke="#C49AB4" strokeWidth="0.6" />
      {/* center petal */}
      <path d="M60 88 C50 72 46 50 52 34 C56 22 64 22 68 34 C74 50 70 72 60 88Z" fill="#E0C4D4" stroke="#C49AB4" strokeWidth="0.5" />
    </svg>
  );
}

function WildRose({ size = 108 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {/* 5 large outer petals */}
      {[0,72,144,216,288].map((a, i) => (
        <g key={i} transform={`rotate(${a} 60 60)`}>
          <path d="M60 60 C46 54 40 36 46 22 C50 12 70 12 74 22 C80 36 74 54 60 60Z"
            fill="#F5D0D8" stroke="#E0B4C0" strokeWidth="0.6" />
          <line x1="60" y1="58" x2="60" y2="22" stroke="#E0B4C0" strokeWidth="0.4" opacity="0.5" />
        </g>
      ))}
      {/* inner ring */}
      {[36,108,180,252,324].map((a, i) => (
        <g key={i} transform={`rotate(${a} 60 60)`}>
          <path d="M60 60 C52 55 48 44 52 36 C55 28 65 28 68 36 C72 44 68 55 60 60Z"
            fill="#F8E0E6" opacity="0.85" />
        </g>
      ))}
      {/* stamens */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i * 22.5) * Math.PI / 180;
        return <g key={i}>
          <line x1="60" y1="60" x2={60 + Math.cos(a)*12} y2={60 + Math.sin(a)*12} stroke="#D4A848" strokeWidth="0.7" />
          <circle cx={60 + Math.cos(a)*12} cy={60 + Math.sin(a)*12} r="2" fill="#D4A848" />
        </g>;
      })}
      <circle cx="60" cy="60" r="6" fill="#F5D0D8" />
    </svg>
  );
}

const FLOWERS = [
  { type: 0, size: 110, top: "6%",    left: "4%",    d: 0,   rotate: -12 },
  { type: 1, size: 130, top: "10%",   right: "5%",   d: 0.4, rotate: 8   },
  { type: 2, size: 100, bottom: "18%",left: "7%",    d: 0.9, rotate: 15  },
  { type: 3, size: 105, bottom: "10%",right: "6%",   d: 1.4, rotate: -8  },
  { type: 4, size: 108, top: "50%",   left: "2%",    d: 1.9, rotate: 5   },
  { type: 0, size:  90, top: "45%",   right: "3%",   d: 2.3, rotate: -18 },
];

const FLOWER_COMPONENTS = [Sakura, Peony, Daisy, Tulip, WildRose];

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
      // Glitter ring
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

function T12Countdown({ date, title, venue }: { date: string; title: string; venue: string }) {
  const { days, hours, minutes, seconds } = useCountdown(date);
  const tan = `color-mix(in srgb, ${ACCENT} 55%, ${CREAM})`;
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
      {FLOWERS.map((f, i) => {
        const FlowerEl = FLOWER_COMPONENTS[f.type % FLOWER_COMPONENTS.length];
        const { type: _t, size, d, rotate: initRot, ...pos } = f;
        return (
          <motion.div
            key={i}
            aria-hidden="true"
            style={{ position: "absolute", pointerEvents: "none", userSelect: "none", rotate: initRot, ...pos }}
            animate={{ y: [0, -14, 0], rotate: [initRot, initRot + 5, initRot] }}
            transition={{ duration: 4.5 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: d }}
          >
            <FlowerEl size={size} />
          </motion.div>
        );
      })}

      <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <Reveal>
          <Eyebrow>Хуримын өдөр хүртэл</Eyebrow>
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
              // Утсан дээр 2 мөр, дэлгэц дээр нэг мөр хэвээр
              return <>{parts[0]}<br className="md:hidden" /> {parts[1]}</>;
            })()}
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <div style={{ marginTop: "clamp(48px,8vw,80px)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(16px,4vw,40px)", maxWidth: 700, margin: "clamp(48px,8vw,80px) auto 0" }}>
            {cell("Өдөр", days)}
            {cell("Цаг", hours)}
            {cell("Минут", minutes)}
            {cell("Секунд", seconds)}
          </div>
        </Reveal>
        <Reveal delay={0.3}>
          <div style={{ marginTop: 32, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.3em", color: `color-mix(in srgb, ${INK} 50%, ${CREAM})` }}>
            {title}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Schedule ────────────────────────────────────────────────────────────────
// events.schedule хоосон үед харагдах үндсэн хөтөлбөр
const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { time: "11:00", label: "Зочид цугларах", desc: "Урилгаар ирсэн хүндэт зочид морилно" },
  { time: "11:30", label: "Дурсамж зураг татуулах", desc: "Фото бүсэд зурагчидтай хамт" },
  { time: "12:00", label: "Хуримын танхимд суудал эзлэх", desc: "Зочид байраа эзлэн, ёслолд бэлтгэнэ" },
  { time: "12:30", label: "Гэрлэлтийн баярын ёслол", desc: "Хосууд орж ирэх, бөгж солилцох, гарын үсэг зурах" },
  { time: "13:10", label: "Хүндэтгэлийн зоог", desc: "Ширээний хундага өргөх, уран бүтээлчдийн тоглолт эхлэх" },
  { time: "13:50", label: "Ерөөл, бэлэг дэвшүүлэх", desc: "Аав ээж, төрөл төрөгсдийн ерөөлийн үг, бэлэг гардуулах" },
  { time: "15:00", label: "Хуримын чөлөөт цаг", desc: "Шинэ чөлөөт хөтөлбөр, диско цаг эхлэх" },
];



function T12Schedule({ event }: { event: EventData }) {
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
            Хуримын хөтөлбөр
          </div>
        </motion.div>

        <div ref={containerRef} style={{ position: "relative" }}>
          {/* Scroll-driven vertical line */}
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
                {/* Time */}
                <div style={{ width: 70, flexShrink: 0, textAlign: "right", paddingTop: 2 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: `color-mix(in srgb, ${INK} 55%, ${CREAM})`, letterSpacing: "0.04em" }}>
                    {time}
                  </span>
                </div>

                {/* Diamond dot */}
                <div style={{ flexShrink: 0, marginTop: 5, width: 9, height: 9, background: INK, transform: "rotate(45deg)", marginLeft: 7, marginRight: 7 }} />

                {/* Content */}
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
function T12Venue({ name, address, mapUrl, image }: { name: string; address: string; mapUrl?: string; image?: string }) {
  const VENUE_FALLBACK = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=2000&q=80";
  return (
    <section id="venue" style={{ background: CREAM, paddingTop: 80, paddingBottom: 128, paddingInline: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Reveal>
          <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "21/9", position: "relative", ...POLAROID }}>
            <img
              src={image || VENUE_FALLBACK}
              alt={name}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85) contrast(0.95)" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.25))", mixBlendMode: "multiply" }} />
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
// events.poem хоосон үед харагдах үндсэн шүлэг
const DEFAULT_POEM = [
  "Хоёр сэтгэл нэгэн зүгт тэмүүлж,",
  "Хайрын гэгээн замд учирсан бид хоёр",
  "Хувь заяагаа холбон, Хуримын ариун ёслолоо тэмдэглэх гэж байна.",
  "Энэхүү аз жаргалт мөчийг Эрхэм таньтай хамт хуваалцахыг урьж байна.",
];

function T12Quote({ event }: { event: EventData }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 30%"] });

  // Энэ хэсэг үг тус бүрээр reveal хийдэг тул хоосон мөр ажиллахгүй — шүүнэ
  const lines = getPoemLines(event, DEFAULT_POEM).filter((l) => l !== "");
  const words = lines.flatMap(l => l.split(" "));

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
            return (
              <span key={i}>
                <motion.span style={{ opacity: op, display: "inline-block", marginRight: "0.22em" }}>
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
function T12RSVP({ eventId }: { eventId: string }) {
  const [form, setForm] = useState({ name: "", phone: "", guests: "1", message: "" });
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Demo горимд бодит DB руу бичихгүй (event id нь uuid биш)
    if (eventId === "demo") {
      setLoading(false);
      toast.success("Баярлалаа! Таны ирц баталгаажлаа.");
      setForm({ name: "", phone: "", guests: "1", message: "" });
      return;
    }
    const { error } = await supabase.from("rsvp").insert({
      event: eventId,
      name: form.name,
      phone: form.phone,
      guests: Number(form.guests),
      message: form.message,
    });
    setLoading(false);
    if (error) toast.error("Алдаа гарлаа. Дахин оролдоно уу.");
    else {
      toast.success("Баярлалаа! Таны ирц баталгаажлаа.");
      setForm({ name: "", phone: "", guests: "1", message: "" });
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
          <div>
            <label style={labelStyle}>Хүний тоо</label>
            <select
              style={{ ...inputStyle, appearance: "none" }}
              value={form.guests}
              onChange={e => setForm(p => ({ ...p, guests: e.target.value }))}
            >
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n} хүн</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Мэндчилгээ (заавал биш)</label>
            <textarea
              style={{ ...inputStyle, height: 100, resize: "vertical" }}
              value={form.message}
              placeholder="Эрхэм хос нарт..."
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
function T12Footer({ mono, names }: { mono: string; names: string }) {
  const parts = mono.split("&");
  return (
    <footer style={{ background: CREAM, paddingTop: 96, paddingBottom: 64, textAlign: "center", position: "relative" }}>
      <div style={{
        fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
        fontSize: "clamp(56px,14vw,100px)", lineHeight: 1, color: INK,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 2,
      }}>
        {parts.length === 2 ? (
          <>
            <span>{parts[0]}</span>
            {/* & тэмдэгт ямар ч эффектгүй, энгийн (налуу биш, accent өнгөгүй) */}
            <span style={{ fontSize: "0.42em", color: INK, fontStyle: "normal", margin: "0 6px", lineHeight: 1 }}>&amp;</span>
            <span>{parts[1]}</span>
          </>
        ) : mono}
      </div>
      <div style={{ marginTop: 24, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.28em", color: `color-mix(in srgb, ${INK} 50%, ${CREAM})` }}>
        {names}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.28em", color: `color-mix(in srgb, ${INK} 35%, ${CREAM})` }}>
        Special Day · Хайраар бүтээсэн
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
export default function Template12({ event }: { event: EventData }) {
  const names = [event.person1_name, event.person2_name].filter(Boolean).join(" & ");
  const mono  = MONO_OVERRIDE[event.slug] ?? initials(event.person1_name, event.person2_name);
  const allPhotos = [...(event.gallery_photos || []), ...(event.gallery2_photos || [])];
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

  useEffect(() => {
    document.documentElement.style.setProperty("--t12-cream", CREAM);
    document.documentElement.style.setProperty("--t12-ink",   INK);
    document.documentElement.style.setProperty("--t12-accent", ACCENT);
    return () => {
      document.documentElement.style.removeProperty("--t12-cream");
      document.documentElement.style.removeProperty("--t12-ink");
      document.documentElement.style.removeProperty("--t12-accent");
    };
  }, []);

  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <T12VideoIntro audioRef={audioRef} />
      {event.music_url && <audio ref={audioRef} src={event.music_url} loop preload="auto" />}
      {event.music_url && <MusicPlayer audioRef={audioRef} />}
      <T12Hero names={names} date={event.date} heroImage={event.main_image} />
      {/* <T12PhotoCollage photos={allPhotos} /> */}
      <T12OurStory photos={allPhotos} />
      <T12Countdown date={event.date} title={event.title} venue={event.venue_name} />
      {!HIDE_SCHEDULE.has(event.slug) && <T12Schedule event={event} />}
      <T12Venue name={event.venue_name} address={event.venue_address} mapUrl={event.venue_map_url} image={event.maps_photo} />
      <T12Quote event={event} />
      <T12RSVP eventId={event.id} />
      <T12Footer mono={mono} names={FOOTER_NAMES_OVERRIDE[event.slug] ?? names} />
      <Toaster />
    </div>
  );
}
