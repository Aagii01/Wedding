import { BRAND, messengerUrl } from "../../lib/brand";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useAnimationFrame,
  useScroll,
  useInView,
  animate,
} from "motion/react";
import { Heart, X, Facebook, Instagram, Phone } from "lucide-react";
import { useRef, useMemo, useState, useEffect } from "react";
import { DEMO_EVENT } from "../demo/demoEvent";

// Холбоо барих — src/lib/brand.ts (урилгын доорх MadeWithCredit-тэй нэг эх үүсвэр)
const FACEBOOK_URL = BRAND.facebook;
// Захиалгын бүх товч Messenger чат руу шууд (page биш) — нэг товшилтоор бичнэ
const ORDER_URL = messengerUrl("Сайн байна уу! Цахим урилга захиалмаар байна.");
const INSTAGRAM_URL = BRAND.instagram;

// Showcase-ийн загвар (хувилбар). Нэг бүтэцтэй, хоёр өнгөний хувилбартай загварууд
// (Sonic/Spider, Мөсөн/Нарны гүнж, Бордо/Хөх-алт) CATEGORIES-д нэг карт болж, карт
// дотроо toggle-оор солигдоно.
type Template = {
  id: string;            // template дугаар (templateMap түлхүүр)
  name: string;          // карт дээрх хувилбарын нэр / fan carousel-ийн бичиг
  tagline: string;
  desc: string;
  bg: string; accent: string; text: string; soft: string;
  swatches: string[];
  font: string;
  cover?: string;        // fan carousel зураг
  fan?: boolean;         // false → нүүрний fan carousel-д гарахгүй (Загварууд хэсэгт хэвээр)
  dark?: boolean;        // карт бараан дэвсгэртэй эсэх (товчны бичгийн өнгө)
  demo?: string;         // demo iframe URL (анхдагч /demo/:id)
  preview?: {            // утасны thumbnail (PhoneScreenHero)
    image: string; eyebrow: string; title: string; date: string;
    titleStyle?: React.CSSProperties;
  };
};

const STORAGE = "https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public";
const KID_BOY  = (n: string) => `${STORAGE}/child_boy/${n}`;
const KID_GIRL = (n: string) => `${STORAGE}/child_girl/${n}`;
const MEDAL    = (n: string) => `${STORAGE}/medal/${n}`;

const TEMPLATES: Template[] = [
  {
    id: "11",
    name: "Pearl",
    tagline: "Сувд · Цэвэр · Дэгжин",
    desc: "Цэвэр цагаан фон, хөх лацан дарааст захиа. Хэнд ч таарах сонгодог загвар.",
    bg: "#ffffff",
    cover: "https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/photos/cover1.jpg",
    accent: "#0f1b35",
    text: "#1a1a2e",
    soft: "#6b7280",
    swatches: ["#0f1b35", "#162240", "#f8f5f0", "#e8e3dc"],
    font: "'Dancing Script', cursive",
  },
  {
    id: "12",
    name: "Azure",
    tagline: "Цэнхэр · Botanical · Editorial",
    desc: "Cormorant Garamond фонт, scroll-driven анимейшн. Утга уран загвар.",
    bg: "#0f1b33",
    cover: "https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/photos/cover3.jpg",
    accent: "#b89a6b",
    text: "#f4eede",
    soft: "rgba(244,238,222,0.6)",
    swatches: ["#0f1b33", "#28406b", "#b89a6b", "#f4eede"],
    font: "'Cormorant Garamond', serif",
  },
  {
    id: "13",
    name: "Ruby",
    tagline: "Бадмаараг · Романтик · Тансаг",
    desc: "Гүн улаан өнгө, алтан ботаникал лац. Хуримын уламжлалт гоёлт загвар.",
    bg: "#66021f",
    cover: "https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/photos/cover4.jpg",
    accent: "#e8c97a",
    text: "#fffaf8",
    soft: "rgba(255,250,248,0.65)",
    swatches: ["#66021f", "#8b0a2a", "#fffaf8", "#e8c97a"],
    font: "'Playfair Display', serif",
  },
  {
    id: "14",
    name: "Diamond",
    tagline: "Очир · Хар тэнгэр · Алт",
    desc: "Гүн хөх шөнийн тэнгэр, алтан дэлгэрэнгүй. Cormorant Garamond — хаан тайзны загвар.",
    bg: "hsl(218 42% 88%)",
    cover: "https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/photos/cover2.jpg",
    accent: "hsl(218 50% 50%)",
    text: "hsl(220 30% 16%)",
    soft: "hsl(220 20% 45%)",
    swatches: ["hsl(220 30% 16%)", "hsl(218 50% 50%)", "hsl(218 42% 88%)", "hsl(220 15% 88%)"],
    font: "'Cormorant Garamond', serif",
  },

  // ── Хүүхдийн төрсөн өдөр — хүү (Template23.tsx: нэг бүтэц, 2 theme) ──
  {
    id: "23", name: "Sonic", tagline: "Хөх · Алтан цагираг · Хурд",
    desc: "Comic хэв маяг: бамбай хэлбэрийн том зураг, хурдны зураас, дарж нээх intro.",
    bg: "#071A45", accent: "#FFC700", text: "#F5F7FF", soft: "rgba(245,247,255,0.6)",
    swatches: ["#071A45", "#1E63D6", "#FFC700", "#FF4B55"], font: "'Oswald', sans-serif",
    cover: "https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/intro_videos/super%20sonic.jpg", dark: true, demo: "/i/demo-sonic",
    preview: { image: KID_BOY("main.jpg"), eyebrow: "Төрсөн өдрийн урилга", title: "Тэмүүлэн", date: "5 НАС · 2027 · 08 · 16", titleStyle: { textTransform: "uppercase", fontWeight: 700 } },
  },
  {
    id: "24", name: "Spider-Man", tagline: "Улаан · Хөх · Аалзны тор",
    desc: "Comic хэв маяг: бамбай хэлбэрийн том зураг, аалзны тор, дарж нээх intro.",
    bg: "#0B1230", accent: "#DF1F2D", text: "#F5F1E8", soft: "rgba(245,241,232,0.6)",
    swatches: ["#0B1230", "#2B3784", "#DF1F2D", "#F5F1E8"], font: "'Oswald', sans-serif",
        cover: "https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/intro_videos/spiderman.jpg", dark: true, demo: "/i/demo-spider",
    preview: { image: KID_BOY("main.jpg"), eyebrow: "Төрсөн өдрийн урилга", title: "Тэмүүлэн", date: "5 НАС · 2027 · 08 · 16", titleStyle: { textTransform: "uppercase", fontWeight: 700 } },
  },

  // ── Хүүхдийн төрсөн өдөр — охин (Template25.tsx: нэг бүтэц, 2 theme) ──
  {
    id: "25", name: "Frozen", tagline: "Мөсөн цэнхэр · Цас · Мөнгө",
    desc: "Титэмтэй зууван зураг, эргэдэг цасан ширхэг, унах цас, зөөлөн гэрэлтэй гарчиг.",
    bg: "#0B2342", accent: "#BFEAFF", text: "#F2F9FF", soft: "rgba(242,249,255,0.6)",
    swatches: ["#0B2342", "#4CC3F0", "#BFEAFF", "#F2F9FF"], font: "'Playfair Display', serif",
        cover: "https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/intro_videos/frozen.jpg", dark: true, demo: "/i/demo-ice",
    preview: { image: KID_GIRL("main.jpg"), eyebrow: "Төрсөн өдрийн урилга", title: "Номин", date: "5 НАС · 2027 · 08 · 16", titleStyle: { fontStyle: "italic" } },
  },
  {
    id: "26", name: "Rapunzel", tagline: "Лаванда · Алтан дэнлүү · Нар",
    desc: "Титэмтэй зууван зураг, нарны тэмдэг, дээш хөвөх алтан дэнлүү.",
    bg: "#2A1748", accent: "#FFD166", text: "#FFF6F0", soft: "rgba(255,246,240,0.6)",
    swatches: ["#2A1748", "#E85D9C", "#FFD166", "#FFF6F0"], font: "'Playfair Display', serif",
        cover: "https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/intro_videos/rapunzel.jpg", dark: true, demo: "/i/demo-sun",
    preview: { image: KID_GIRL("main.jpg"), eyebrow: "Төрсөн өдрийн урилга", title: "Номин", date: "5 НАС · 2027 · 08 · 16", titleStyle: { fontStyle: "italic" } },
  },

  // ── Шагнал, хүндэтгэл (Template27.tsx: нэг бүтэц, 2 theme; demo нь кодын /demo — medal зурагтай) ──
  {
    id: "27", name: "Бордо-алт", tagline: "Бордо · Алтан · Уламжлалт",
    desc: "Цайвар дэвсгэр, том уншигдах бичиг, ажлын замнал, дугтуй нээх intro, «Том үсэг» товч.",
    bg: "#F7F1E6", accent: "#7A2240", text: "#2B2118", soft: "#6E5F52",
    swatches: ["#5C1A2E", "#C9A24A", "#F7F1E6", "#2B2118"], font: "'Playfair Display', serif",
    cover: MEDAL("main.jpg"), fan: false, dark: false, demo: "/demo/27",
    preview: { image: MEDAL("main.jpg"), eyebrow: "Хүндэтгэлийн урилга", title: "Хөдөлмөрийн\nхүндэт медаль", date: "2027 · 08 · 16" },
  },
  {
    id: "28", name: "Хөх-алт", tagline: "Гүн хөх · Алтан · Албан",
    desc: "Цайвар дэвсгэр, том уншигдах бичиг, ажлын замнал, дугтуй нээх intro, «Том үсэг» товч.",
    bg: "#F5F2EA", accent: "#1E3A64", text: "#1C2333", soft: "#5B6475",
    swatches: ["#0F2440", "#C9A24A", "#F5F2EA", "#1C2333"], font: "'Playfair Display', serif",
    cover: MEDAL("main1.jpg"), fan: false, dark: false, demo: "/demo/28",
    preview: { image: MEDAL("main.jpg"), eyebrow: "Хүндэтгэлийн урилга", title: "Хөдөлмөрийн\nхүндэт медаль", date: "2027 · 08 · 16" },
  },
];

const byId    = (id: string) => TEMPLATES.find((t) => t.id === id)!;
const isDark  = (t: Template) => t.dark ?? (t.bg === "#66021f" || t.bg === "#0f1b33");
const demoUrl = (t: Template) => t.demo ?? `/demo/${t.id}`;

// Showcase-ийн ангилал → карт (нэг карт = нэг бүтэц; ids олон бол карт дотор theme toggle)
type TemplateGroup = { name: string; tagline: string; desc: string; ids: string[] };
const CATEGORIES: { key: string; label: string; groups: TemplateGroup[] }[] = [
  {
    key: "wedding", label: "Хурим",
    groups: ["11", "12", "13", "14"].map((id) => { const t = byId(id); return { name: t.name, tagline: t.tagline, desc: t.desc, ids: [id] }; }),
  },
  {
    key: "boy", label: "Төрсөн өдөр (эрэгтэй)",
    groups: [
      { name: "Супер баатар", tagline: "Хүү · Comic · Эрч хүч", desc: "Бамбай хэлбэрийн том зураг, хурдны зураас, дарж нээх intro. Хоёр өнгөний сонголттой.", ids: ["23", "24"] },
    ],
  },
  {
    key: "girl", label: "Төрсөн өдөр (эмэгтэй)",
    groups: [
      { name: "Гүнж", tagline: "Охин · Ид шид · Гэрэл", desc: "Титэмтэй зууван зураг, цасан ширхэг эсвэл алтан дэнлүү, зөөлөн гэрэлтэй гарчиг.", ids: ["25", "26"] },
    ],
  },
  {
    key: "award", label: "Шагнал, хүндэтгэл",
    groups: [
      { name: "Хүндэтгэлийн урилга", tagline: "Одон медаль · Ой · 40+", desc: "Цайвар дэвсгэр, том уншигдах бичиг, ажлын замнал, дугтуй нээх intro, «Том үсэг» товч.", ids: ["27", "28"] },
    ],
  },
];

// Gold gradient text style for dark backgrounds
const goldGrad: React.CSSProperties = {
  background: "linear-gradient(180deg, #c9a882 0%, #f0d9a0 55%, #c9a255 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

// Бүх загварт нийтлэг давуу талууд (showcase картад харуулна)
const FEATURES = [
  "Ар талын хөгжим",
  "Ирц бүртгэл (RSVP)",
  "Ерөөл, мэндчилгээ",
  "Цаг тоолуур",
  "Газрын зураг",
  "Зургийн цомог",
];

// ─── useIsMobile ─────────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

// ─── FadeIn ────────────────────────────────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "50px", amount: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── AnimatedText — char-by-char scroll opacity ───────────────────────────────
function AnimChar({
  children,
  progress,
  range,
}: {
  children: string;
  progress: ReturnType<typeof useMotionValue<number>>;
  range: [number, number];
}) {
  // Нэг давхар span — өнгийг бараанаас цагаан болгож scroll-оор илчилнэ.
  // (Өмнө нь 2 давхар text давхцаж бүрэлзэж байсныг зассан.)
  const color = useTransform(progress, range, ["#3a3f49", "#D7E2EA"]);
  return <motion.span style={{ color }}>{children}</motion.span>;
}

function AnimatedText({
  text,
  className = "",
  style = {},
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.3"],
  });
  const chars = useMemo(() => text.split(""), [text]);
  return (
    <p ref={ref} className={className} style={style}>
      {chars.map((ch, i) => (
        <AnimChar
          key={i}
          progress={scrollYProgress as ReturnType<typeof useMotionValue<number>>}
          range={[i / chars.length, (i + 1) / chars.length]}
        >
          {ch}
        </AnimChar>
      ))}
    </p>
  );
}

// ─── CTA Button ───────────────────────────────────────────────────────────────
function CTAButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        "inline-block rounded-full font-semibold uppercase tracking-widest text-white " +
        "px-8 py-3 sm:px-10 sm:py-3.5 text-sm " +
        "transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] " +
        className
      }
      style={{
        background:
          "linear-gradient(123deg, #18010f 7%, #b61454 37%, #7c21b0 72%, #be4c00 100%)",
        boxShadow:
          "0 4px 4px rgba(182,20,89,0.25), 4px 4px 12px #7c21b0 inset",
        outline: "2px solid #fff",
        outlineOffset: "-3px",
        textDecoration: "none",
      }}
    >
      {children}
    </a>
  );
}

// ─── Fan Carousel (template preview 3D) ──────────────────────────────────────
// Fan carousel-д зөвхөн fan !== false загварууд (шагналын хүний зурагтай cover-ийг оруулахгүй)
const FAN_TEMPLATES = TEMPLATES.filter((t) => t.fan !== false);
const DOUBLED = [...FAN_TEMPLATES, ...FAN_TEMPLATES, ...FAN_TEMPLATES];
const CARD_SPACING = 300;
const TOTAL_SHIFT = CARD_SPACING * FAN_TEMPLATES.length;
const CENTER_BASE = -(DOUBLED.length * CARD_SPACING) / 2 + CARD_SPACING / 2;

function FanTemplateCard({ t }: { t: (typeof TEMPLATES)[0] }) {
  // Cover зурагтай карт — зөвхөн зургийг дүүрэн харуулж, доор нь нэр
  if (t.cover) {
    return (
      <div
        style={{
          width: 264,
          height: 425,
          borderRadius: 26,
          boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
          border: `1px solid ${t.accent}44`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          src={t.cover}
          alt={t.name}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "44px 20px 18px",
            background: "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.92)",
              fontWeight: 600,
              margin: 0,
            }}
          >
            {t.name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 264,
        height: 425,
        background: t.bg,
        borderRadius: 26,
        boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "28px 20px 24px",
        border: `1px solid ${t.accent}44`,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: t.accent,
          opacity: 0.9,
        }}
      />
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: t.soft,
            marginBottom: 10,
          }}
        >
          The wedding of
        </p>
        <h3
          style={{
            fontFamily: t.font,
            fontSize: 32,
            color: t.text,
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          Болд
          <br />& Сарнай
        </h3>
        <div
          style={{ width: 36, height: 1, background: t.accent, margin: "12px auto" }}
        />
        <p style={{ fontSize: 10, letterSpacing: "0.15em", color: t.soft }}>
          2026 · 07 · 15
        </p>
      </div>
      <p
        style={{
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: t.soft,
          fontWeight: 600,
        }}
      >
        {t.name}
      </p>
    </div>
  );
}

function FanCard({
  t,
  offset,
  baseX,
}: {
  t: (typeof TEMPLATES)[0];
  offset: ReturnType<typeof useMotionValue<number>>;
  baseX: number;
}) {
  const x = useTransform(offset, (o: number) => baseX + o);
  const rotateY = useTransform(x, [-780, -320, 0, 320, 780], [55, 28, 0, -28, -55]);
  const scale = useTransform(x, [-560, 0, 560], [0.7, 1.0, 0.7]);
  const opacity = useTransform(x, [-780, -560, 0, 560, 780], [0, 0.7, 1, 0.7, 0]);
  const zIndex = useTransform(x, (v: number) => Math.round(100 - Math.abs(v) / 5));
  return (
    <motion.div
      style={{
        x,
        rotateY,
        scale,
        opacity,
        zIndex,
        position: "absolute",
        transformStyle: "preserve-3d",
      }}
    >
      <FanTemplateCard t={t} />
    </motion.div>
  );
}

// offset-г seamless loop хязгаарт оруулна
function wrapOffset(v: number) {
  let next = v;
  while (next <= -TOTAL_SHIFT) next += TOTAL_SHIFT;
  while (next > 0) next -= TOTAL_SHIFT;
  return next;
}

function FanCarousel() {
  const offset = useMotionValue(0);
  const drag = useRef<{ active: boolean; startX: number; startOffset: number }>({
    active: false,
    startX: 0,
    startOffset: 0,
  });

  useAnimationFrame((_, delta) => {
    if (drag.current.active) return; // чирэх үед auto-эргэлт зогсоно
    offset.set(wrapOffset(offset.get() - delta * 0.07));
  });

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = {
      active: true,
      startX: e.clientX,
      startOffset: offset.get(),
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    offset.set(wrapOffset(drag.current.startOffset + dx));
  };
  const endDrag = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // pointer capture аль хэдийн суларсан байж болно
    }
  };

  return (
    <div
      className="relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{ height: 510, perspective: 1200, touchAction: "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {DOUBLED.map((t, i) => (
          <FanCard
            key={`${t.id}-${i}`}
            t={t}
            offset={offset}
            baseX={CENTER_BASE + i * CARD_SPACING}
          />
        ))}
      </div>
      <div
        className="absolute inset-y-0 left-0 w-28 md:w-48 pointer-events-none"
        style={{ background: "linear-gradient(to right, #0C0C0C, transparent)" }}
      />
      <div
        className="absolute inset-y-0 right-0 w-28 md:w-48 pointer-events-none"
        style={{ background: "linear-gradient(to left, #0C0C0C, transparent)" }}
      />
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section
      className="min-h-screen w-full flex flex-col"
      style={{ background: "#0C0C0C", overflowX: "clip" }}
    >
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex items-center justify-between px-6 md:px-10 pt-6 md:pt-8"
      >
        <span
          style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: "clamp(1.3rem, 3vw, 2rem)",
            ...goldGrad,
          }}
        >
          Special Day
        </span>
        <div className="flex items-center gap-4 sm:gap-5">
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="hover:opacity-70 transition-opacity"
            style={{ color: "#D7E2EA" }}
          >
            <Facebook size={20} strokeWidth={1.6} />
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:opacity-70 transition-opacity"
            style={{ color: "#D7E2EA" }}
          >
            <Instagram size={20} strokeWidth={1.6} />
          </a>
          <a
            href="tel:88328085"
            aria-label="Утас"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium tracking-wide hover:opacity-70 transition-opacity"
            style={{ color: "#D7E2EA" }}
          >
            <Phone size={18} strokeWidth={1.6} />
            <span className="hidden sm:inline">88328085</span>
          </a>
          <a
            href={ORDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm font-medium uppercase tracking-widest hover:opacity-70 transition-opacity"
            style={{ color: "#D7E2EA" }}
          >
            Захиалах →
          </a>
        </div>
      </motion.nav>

      {/* Heading block */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-10 pb-4 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-xs tracking-[0.3em] uppercase mb-6"
          style={{ color: "rgba(215,226,234,0.45)" }}
        >
          Монгол · цахим · урилга
        </motion.p>

        <div style={{ overflow: "hidden" }}>
          <motion.h1
            initial={{ opacity: 0, y: 70 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="font-black uppercase tracking-tight leading-none"
            style={{
              ...goldGrad,
              fontSize: "clamp(3.2rem, 16vw, 180px)",
              whiteSpace: "nowrap",
            }}
          >
            SPECIAL DAY
          </motion.h1>
        </div>

        {/* Дэд бичвэр: (1) урилгын төрлүүд — алтан, жижиг, том үсгээр, цэгээр
            тусгаарласан (SEO түлхүүр үгс харагдахуйц); (2) амлалт — Cormorant italic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-7 mb-10 mx-auto"
          style={{ maxWidth: 520 }}
        >
          <p
            className="uppercase"
            style={{
              ...goldGrad,
              fontSize: "clamp(0.62rem, 1.1vw, 0.78rem)",
              letterSpacing: "0.22em",
              lineHeight: 1.9,
              wordSpacing: "0.1em",
            }}
          >
            Хуримын урилга
            <span aria-hidden="true" style={{ margin: "0 0.55em", opacity: 0.55 }}>·</span>
            Төрсөн өдрийн урилга
            <span aria-hidden="true" style={{ margin: "0 0.55em", opacity: 0.55 }}>·</span>
            Сэвлэг үргээх
            <span aria-hidden="true" style={{ margin: "0 0.55em", opacity: 0.55 }}>·</span>
            Хүндэтгэлийн баяр
          </p>
          <p
            className="mt-3 leading-snug"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 500,
              color: "rgba(215,226,234,0.78)",
              fontSize: "clamp(1.15rem, 2.2vw, 1.55rem)",
            }}
          >
            Онцгой цахим урилгыг 24 цагийн дотор бэлдэж тань руу явуулна
          </p>
        </motion.div>
      </div>

      {/* Fan carousel */}
      <div className="pb-2">
        <FanCarousel />
      </div>
    </section>
  );
}

// ─── Marquee Text Strip ───────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  "Хурим", "·", "Цахим урилга", "·", "Мэндчилгээ", "·", "Location", "·",
  "Дуу", "·", "24 цаг", "·", "Загвар", "·", "Link, QR", "·",
];

function MarqueeStrip() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div
      className="overflow-hidden py-4 border-t border-b"
      style={{ background: "#0C0C0C", borderColor: "rgba(215,226,234,0.07)" }}
    >
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 22, ease: "linear", repeat: Infinity }}
        style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.95rem)", letterSpacing: "0.18em" }}
      >
        {doubled.map((w, i) => (
          <span
            key={i}
            style={{
              color: w === "·" ? "rgba(201,162,85,0.55)" : "rgba(215,226,234,0.38)",
              fontWeight: w === "·" ? 400 : 500,
              textTransform: "uppercase",
            }}
          >
            {w}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Stats Section — "Бидний үр дүн" ─────────────────────────────────────────
// Тоог эндээс л засна. value — тоо, suffix — тооны ард залгах ("+", " цаг").
const STATS = [
  { value: 100, suffix: "+", label: "Хуримын урилга" },
  { value: 20,  suffix: "+", label: "Хүүхдийн сэвлэг үргээх урилга" },
  { value: 15,  suffix: "+", label: "Одонгийн найрын урилга" },
  { value: 24,  suffix: " цаг", label: "Захиалга бэлэн болох хугацаа" },
];

// Дэлгэцэнд орж ирмэгц 0-оос зорилтот тоо хүртэл тоологдоно (нэг л удаа)
function CountUp({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(0, to, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => ctrl.stop();
  }, [inView, to]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {n}
      <span style={{ fontSize: "0.55em", marginLeft: 2 }}>{suffix}</span>
    </span>
  );
}

function StatsSection() {
  return (
    <section
      className="w-full px-5 md:px-10 py-16 md:py-24 relative"
      style={{
        background: "#0C0C0C",
        borderTop: "1px solid rgba(215,226,234,0.07)",
        borderBottom: "1px solid rgba(215,226,234,0.07)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <FadeIn y={30} duration={0.7} className="text-center mb-12 md:mb-16">
          <p
            className="text-xs tracking-[0.3em] uppercase mb-4"
            style={{ color: "rgba(201,162,85,0.8)" }}
          >
            Бидний үр дүн
          </p>
          <h2
            className="font-black uppercase leading-none tracking-tight"
            style={{ ...goldGrad, fontSize: "clamp(1.9rem, 7vw, 84px)" }}
          >
            Тоогоор
          </h2>
        </FadeIn>

        <div className="grid grid-cols-2 md:grid-cols-4">
          {STATS.map((st, i) => (
            <FadeIn
              key={st.label}
              delay={i * 0.1}
              y={24}
              duration={0.65}
              className="flex flex-col items-center text-center px-3 py-8 md:py-6"
              style={{
                // Desktop: баганын хооронд босоо зураас. Mobile: 2 багана,
                // эхний мөрийн доор хэвтээ зураас.
                borderLeft: i > 0 ? "1px solid rgba(215,226,234,0.07)" : "none",
                borderTop: i >= 2 ? "1px solid rgba(215,226,234,0.07)" : "none",
              }}
            >
              <div
                className="font-black leading-none"
                style={{ ...goldGrad, fontSize: "clamp(2.6rem, 7vw, 5.2rem)" }}
              >
                <CountUp to={st.value} suffix={st.suffix} />
              </div>
              <p
                className="mt-4 text-xs md:text-sm tracking-[0.14em] uppercase leading-relaxed"
                style={{ color: "rgba(215,226,234,0.62)", maxWidth: 190 }}
              >
                {st.label}
              </p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── About Section ────────────────────────────────────────────────────────────
function AboutSection() {
  return (
    <section
      id="about"
      className="md:min-h-screen w-full flex flex-col items-center justify-center relative px-5 md:px-10 py-16 md:py-24"
      style={{ background: "#0C0C0C" }}
    >
      {/* Decorative corners */}
      <FadeIn
        x={-60}
        y={0}
        delay={0.1}
        duration={0.9}
        className="absolute top-[5%] left-[2%] md:left-[5%] pointer-events-none"
        style={{ opacity: 0.3 }}
      >
        <Heart
          style={{
            width: "clamp(40px,6vw,90px)",
            height: "clamp(40px,6vw,90px)",
            fill: "#c9a255",
            color: "#c9a255",
          }}
        />
      </FadeIn>
      <FadeIn
        x={60}
        y={0}
        delay={0.15}
        duration={0.9}
        className="absolute top-[5%] right-[2%] md:right-[5%] pointer-events-none"
        style={{ opacity: 0.22 }}
      >
        <div
          style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: "clamp(2.5rem, 7vw, 6rem)",
            ...goldGrad,
            lineHeight: 1,
          }}
        >
          ∞
        </div>
      </FadeIn>
      <FadeIn
        x={-50}
        y={0}
        delay={0.1}
        duration={0.9}
        className="absolute bottom-[7%] left-[3%] md:left-[8%] pointer-events-none"
        style={{ opacity: 0.15 }}
      >
        <div
          style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: "clamp(3rem, 9vw, 8rem)",
            ...goldGrad,
            lineHeight: 1,
          }}
        >
          ♦
        </div>
      </FadeIn>
      <FadeIn
        x={50}
        y={0}
        delay={0.2}
        duration={0.9}
        className="absolute bottom-[7%] right-[3%] md:right-[8%] pointer-events-none"
        style={{ opacity: 0.15 }}
      >
        <Heart
          style={{
            width: "clamp(30px,4vw,60px)",
            height: "clamp(30px,4vw,60px)",
            fill: "#c9a255",
            color: "#c9a255",
          }}
        />
      </FadeIn>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-12 md:gap-16 max-w-3xl">
        <FadeIn y={40} duration={0.7}>
          <h2
            className="font-black uppercase leading-none tracking-tight text-center"
            style={{ ...goldGrad, fontSize: "clamp(1.9rem, 10vw, 140px)" }}
          >
            Танилцуулга
          </h2>
        </FadeIn>

        <AnimatedText
          text="Төгс сэтгэгдэл урилгаас эхэлнэ. Special Day бол Монголын хурим, төрсөн өдөр, баярын цахим урилгын платформ. Та зөвхөн загвараа сонгож, үлдсэнийг нь бидэнд даатгаарай. Ердөө 24 цагийн дотор бэлэн болох link болон QR код таныг хайртай хүмүүстэй тань орон зай, цаг хугацааны зааггүйгээр холбох болно."
          className="font-medium text-center leading-relaxed max-w-[560px] mx-auto"
          style={{ color: "#D7E2EA", fontSize: "clamp(1rem, 2vw, 1.35rem)" }}
        />
      </div>

      <div className="relative z-10 mt-16 md:mt-20">
        <CTAButton href={ORDER_URL}>Захиалга өгөх</CTAButton>
      </div>
    </section>
  );
}

// ─── Phone mockup (preview screen + frame) ────────────────────────────────────

// Утасны thumbnail: t.preview байвал тэр (хүүхэд, шагнал), үгүй бол хуримын анхдагч
function PhoneScreenHero({ t }: { t: Template }) {
  const p = t.preview ?? { image: DEMO_EVENT.main_image, eyebrow: "The wedding of", title: "Болд\n& Сарнай", date: "2026 · 07 · 15" };
  return (
    <div style={{ position: "absolute", inset: 0, background: t.bg }}>
      <img
        src={p.image}
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(10,12,20,0.4) 0%, rgba(10,12,20,0.12) 35%, rgba(10,12,20,0.58) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 13,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 8,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.65)",
        }}
      >
        {t.name}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 18px",
        }}
      >
        <p
          style={{
            fontSize: 9,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.8)",
            marginBottom: 10,
          }}
        >
          {p.eyebrow}
        </p>
        <h3
          style={{
            fontFamily: t.font,
            fontSize: "clamp(26px, 7vw, 34px)",
            color: "#fff",
            lineHeight: 1.15,
            margin: 0,
            textShadow: "0 2px 16px rgba(0,0,0,0.55)",
            ...p.titleStyle,
          }}
        >
          {p.title.split("\n").map((line, i) => (
            <span key={i}>{i > 0 && <br />}{line}</span>
          ))}
        </h3>
        <p style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(255,255,255,0.85)", marginTop: 13 }}>
          {p.date}
        </p>
      </div>
    </div>
  );
}

function PhoneFrame({
  children,
  screenW,
  screenH,
  notch = true,
  screenRef,
}: {
  children: React.ReactNode;
  screenW: number | string;
  screenH: number | string;
  notch?: boolean;
  screenRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      style={{
        position: "relative",
        padding: 9,
        background: "linear-gradient(145deg, #2c2c30, #0d0d0f)",
        borderRadius: 40,
        boxShadow: "0 30px 70px rgba(0,0,0,0.5), inset 0 0 2px rgba(255,255,255,0.3)",
      }}
    >
      <div
        ref={screenRef}
        style={{
          position: "relative",
          width: screenW,
          height: screenH,
          borderRadius: 31,
          overflow: "hidden",
          background: "#000",
        }}
      >
        {children}
        {notch && (
          <div
            style={{
              position: "absolute",
              top: 7,
              left: "50%",
              transform: "translateX(-50%)",
              width: 64,
              height: 17,
              background: "#000",
              borderRadius: 11,
              zIndex: 20,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Templates Section (sticky stacking cards) ────────────────────────────────
function TemplateCard({
  group,
  index,
  total,
  scrollProgress,
  onOpen,
}: {
  group: TemplateGroup;
  index: number;
  total: number;
  scrollProgress: ReturnType<typeof useMotionValue<number>>;
  onOpen: (t: Template) => void;
}) {
  const targetScale = 1 - (total - 1 - index) * 0.04;
  const scale = useTransform(
    scrollProgress,
    [index / total, 1] as [number, number],
    [1, targetScale]
  );
  // Нэг картад олон theme (ids) байвал toggle-оор сонгоно; карт тухайн theme-ийн өнгөөр
  const [vi, setVi] = useState(0);
  const t = byId(group.ids[Math.min(vi, group.ids.length - 1)]);
  const dark = isDark(t);
  const numLabel = String(index + 1).padStart(2, "0");
  const isMobile = useIsMobile();
  // Mobile дээр phone preview-г илүү том, desktop дээр хэвээр (172×318 харьцаа хадгална)
  const phoneW = isMobile ? 230 : 172;
  const phoneH = isMobile ? 425 : 318;

  return (
    <div
      className={isMobile ? "flex items-start justify-center" : "sticky flex items-start justify-center"}
      style={isMobile ? undefined : { top: `calc(5rem + ${index * 22}px)` }}
    >
      <motion.div style={{ scale: isMobile ? 1 : scale, transformOrigin: "top center" }} className="w-full">
        <div
          className="w-full overflow-hidden"
          style={{
            background: t.bg,
            borderRadius: "clamp(20px, 3vw, 40px)",
            border: `1px solid ${t.accent}33`,
            transition: "background .45s ease, border-color .45s ease",
          }}
        >
          <div className="flex flex-col md:flex-row">
            {/* Left: info */}
            <div className="flex-1 flex flex-col justify-between gap-3 p-7 md:p-12 md:gap-0 md:[min-height:clamp(260px,38vw,480px)]">
              <div>
                <p
                  className="text-xs tracking-[0.25em] uppercase mb-3"
                  style={{ color: t.soft }}
                >
                  Загвар {numLabel}
                </p>
                <h3
                  className="font-black uppercase leading-none mb-3"
                  style={{
                    color: t.text,
                    fontSize: "clamp(2.2rem, 7vw, 72px)",
                  }}
                >
                  {group.name}
                </h3>
                {group.ids.length > 1 && (
                  <div className="flex gap-2 flex-wrap mt-5">
                    {group.ids.map((id, i) => {
                      const v = byId(id);
                      const active = i === vi;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setVi(i)}
                          aria-pressed={active}
                          className="inline-flex items-center gap-2 rounded-full text-xs font-semibold tracking-wide px-3.5 py-2 cursor-pointer transition-colors"
                          style={{
                            background: active ? t.accent : "transparent",
                            color: active ? (dark ? t.bg : "#fff") : t.text,
                            border: `1.5px solid ${active ? t.accent : t.soft}`,
                          }}
                        >
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: v.accent, border: "1px solid rgba(255,255,255,0.55)", flexShrink: 0 }} />
                          {v.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                <ul className="mt-5 hidden md:grid md:grid-cols-2 gap-x-6 gap-y-2.5 max-w-md">
                  {FEATURES.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2"
                      style={{
                        color: t.soft,
                        fontSize: "clamp(0.8rem, 1.3vw, 0.95rem)",
                      }}
                    >
                      <span style={{ color: t.accent, fontWeight: 700 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex gap-3 mb-5 md:mt-8">
                  {t.swatches.map((s) => (
                    <div
                      key={s}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: s,
                        border: "1.5px solid rgba(128,128,128,0.22)",
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => onOpen(t)}
                    className="inline-flex items-center gap-2 rounded-full font-semibold uppercase tracking-wider text-xs px-6 py-2.5 transition-opacity hover:opacity-80 cursor-pointer"
                    style={{
                      background: t.accent,
                      color: dark ? t.bg : "#fff",
                      border: "none",
                    }}
                  >
                    ▶ Demo үзэх
                  </button>
                  <a
                    href={ORDER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-full font-semibold uppercase tracking-wider text-xs px-6 py-2.5 transition-opacity hover:opacity-80"
                    style={{
                      border: `1.5px solid ${t.accent}`,
                      color: dark ? t.accent : t.text,
                      textDecoration: "none",
                      background: "transparent",
                    }}
                  >
                    Захиалах
                  </a>
                </div>
              </div>
            </div>

            {/* Right: phone mockup preview (clickable) */}
            <div
              className="flex items-center justify-center p-8 md:p-10"
              style={{
                background: `${t.accent}0d`,
                borderLeft: `1px solid ${t.accent}1a`,
                minWidth: "clamp(200px, 30vw, 340px)",
              }}
            >
              <button
                onClick={() => onOpen(t)}
                className="cursor-pointer transition-transform duration-300 hover:scale-[1.03]"
                style={{ background: "transparent", border: "none", padding: 0 }}
                aria-label={`${t.name} demo`}
              >
                <PhoneFrame screenW={phoneW} screenH={phoneH}>
                  <PhoneScreenHero t={t} />
                </PhoneFrame>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Demo Modal (interactive iframe inside phone) ─────────────────────────────
const DEVICE_W = 390;
const DEVICE_H = 844;

function DemoModal({ t, onClose }: { t: Template; onClose: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const screenRef = useRef<HTMLDivElement>(null);
  const dark = isDark(t);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // iframe-г 390×844 нягтрал дээр render хийгээд phone screen-д багтаатал scale хийнэ
  useEffect(() => {
    const measure = () => {
      const el = screenRef.current;
      if (el) setScale(el.clientHeight / DEVICE_H);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [loaded]);

  const screenH = "min(88vh, 880px)";
  const screenW = `calc(min(88vh, 880px) * ${DEVICE_W / DEVICE_H})`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto py-10 px-4"
      style={{ background: "rgba(8,8,10,0.82)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col md:flex-row items-center gap-8 md:gap-14 my-auto"
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Хаах"
          className="absolute -top-3 -right-2 md:-top-4 md:-right-12 z-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-70 cursor-pointer"
          style={{ width: 40, height: 40, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <X size={20} color="#fff" />
        </button>

        {/* Phone */}
        <div style={{ position: "relative" }}>
          <PhoneFrame screenW={screenW} screenH={screenH} notch={!loaded} screenRef={screenRef}>
            {loaded ? (
              <iframe
                src={demoUrl(t)}
                title={`${t.name} demo`}
                allow="autoplay; fullscreen"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: DEVICE_W,
                  height: DEVICE_H,
                  border: "none",
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              />
            ) : (
              <>
                <PhoneScreenHero t={t} />
                <button
                  onClick={() => setLoaded(true)}
                  className="absolute left-1/2 -translate-x-1/2 rounded-full font-semibold uppercase tracking-wider text-xs px-6 py-3 transition-transform hover:scale-105 cursor-pointer flex items-center gap-2"
                  style={{
                    bottom: 26,
                    background: "rgba(255,255,255,0.95)",
                    color: "#0C0C0C",
                    border: "none",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  }}
                >
                  ▶ Demo ачаалах
                </button>
              </>
            )}
          </PhoneFrame>
        </div>

        {/* Info */}
        <div className="text-center md:text-left max-w-xs">
          <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: "rgba(215,226,234,0.5)" }}>
            Загвар
          </p>
          <h3
            className="font-black uppercase leading-none mb-5"
            style={{ ...goldGrad, fontSize: "clamp(2.2rem, 6vw, 56px)" }}
          >
            {t.name}
          </h3>
          <div className="flex gap-3 mb-7 justify-center md:justify-start">
            {t.swatches.map((s) => (
              <div
                key={s}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: s,
                  border: "1.5px solid rgba(255,255,255,0.18)",
                }}
              />
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            {!loaded && (
              <button
                onClick={() => setLoaded(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-wider text-xs px-7 py-3 transition-transform hover:scale-105 cursor-pointer"
                style={{ background: t.accent, color: dark ? t.bg : "#fff", border: "none" }}
              >
                ▶ Demo ачаалах
              </button>
            )}
            <a
              href={ORDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full font-semibold uppercase tracking-wider text-xs px-7 py-3 transition-transform hover:scale-105"
              style={{ border: "1.5px solid rgba(215,226,234,0.4)", color: "#D7E2EA", textDecoration: "none" }}
            >
              Захиалга өгөх
            </a>
          </div>
          <a
            href={demoUrl(t)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-5 text-xs tracking-wider uppercase hover:opacity-70 transition-opacity"
            style={{ color: "rgba(215,226,234,0.4)" }}
          >
            Шинэ цонхонд нээх ↗
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TemplatesSection() {
  const containerRef = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState<Template | null>(null);
  // Ангилал (chip): анхдагч "Хурим"; сонгоход тэр ангиллын картууд л гарна
  const [cat, setCat] = useState(CATEGORIES[0].key);
  const groups = (CATEGORIES.find((c) => c.key === cat) ?? CATEGORIES[0]).groups;
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      ref={containerRef}
      className="w-full px-5 md:px-10 py-20 md:py-28 relative z-[1]"
      style={{
        background: "#f8f5f0",
        borderRadius: "clamp(28px, 4vw, 56px) clamp(28px, 4vw, 56px) 0 0",
        marginTop: -1,
      }}
    >
      <FadeIn y={40} duration={0.7} className="text-center mb-14 md:mb-20">
        <h2
          className="font-black uppercase leading-none tracking-tight"
          style={{ color: "#0C0C0C", fontSize: "clamp(2.8rem, 12vw, 130px)" }}
        >
          Загварууд
        </h2>
        <p
          className="mt-4 text-xs tracking-widest uppercase"
          style={{ color: "#9ca3af" }}
        >
          Demo үзэж сонгоод захиалгаа өгнө үү
        </p>
      </FadeIn>

      {/* Ангиллын chip — бүгд харагдана, утсан дээр мөр бууна */}
      <div
        className="flex flex-wrap justify-center gap-2 mb-10 md:mb-14"
        role="tablist"
        aria-label="Урилгын төрөл"
      >
        {CATEGORIES.map((c) => {
          const active = c.key === cat;
          return (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCat(c.key)}
              className="shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all duration-200"
              style={
                active
                  // Идэвхтэй: гэгээлэг алтан (хар биш), алтан хүрээ + зөөлөн гялбаа → даргдсан нь мэдэгдэнэ
                  ? {
                      background: "linear-gradient(180deg, #fff8e6 0%, #f3e2b6 100%)",
                      color: "#5a4420",
                      border: "1.5px solid #c9a255",
                      boxShadow: "0 0 0 3px rgba(201,162,85,.22), 0 4px 14px rgba(201,162,85,.28)",
                    }
                  : { background: "#fff", color: "#0C0C0C", border: "1.5px solid #e5e1da" }
              }
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Утсан дээр энгийн жагсаалт (давхарлахгүй), desktop дээр sticky stacking */}
      <div className="max-w-5xl mx-auto" key={cat}>
        {groups.map((g, i) => (
          <div key={g.name} style={isMobile ? { marginBottom: 24 } : { height: "78vh" }}>
            <TemplateCard
              group={g}
              index={i}
              total={groups.length}
              scrollProgress={scrollYProgress as ReturnType<typeof useMotionValue<number>>}
              onOpen={setSelected}
            />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selected && <DemoModal t={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </section>
  );
}

// ─── Why Us Section (системийн давуу талууд) ──────────────────────────────────
const WHY_US = [
  {
    icon: "🎵",
    title: "Хөгжимтэй урилга",
    desc: "Урилга нээгдэхэд таны сонгосон дуу автоматаар эгшиглэнэ.",
  },
  {
    icon: "💌",
    title: "Ирц бүртгэл (RSVP)",
    desc: "Зочид «ирнэ / ирэхгүй», хэдэн хүн ирэхээ шууд урилгаар дамжуулан мэдэгдэнэ. Та хэдэн зочинтой болохоо урьдчилан, нэг дороос харна — утсаар нэг бүрчлэн асуух шаардлагагүй.",
  },
  {
    icon: "💝",
    title: "Мэндчилгээ",
    desc: "Зочид танд зориулж халуун дулаан мэндчилгээ үлдээнэ. Бүгд хадгалагдах тул хуримын дараа ч эргэн уншиж, дурсамж болгон авах боломжтой.",
  },
  {
    icon: "📍",
    title: "Газрын зураг",
    desc: "Google Maps-ийн ухаалаг шийдэлтэй тул зочид баяр болох газрын чиглэлийг шууд харах боломжтой.",
  },
  {
    icon: "🎨",
    title: "Олон загвар сонголт",
    desc: "Pearl, Azure, Ruby, Diamond гэх мэт олон загвар бэлэн. Special загварыг та зөвхөн өөрийн санаа бодлоо тусган тохируулж хийлгэх боломжтой.",
  },
  {
    icon: "🔗",
    title: "Урилга илгээх маш амархан",
    desc: "Хэвлэх, тараах шаардлагагүй. Таньд ганцхан Link, QR байхад хангалттай.",
  },
];

function WhyUsCard({ f, i }: { f: (typeof WHY_US)[number]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  // Карт viewport-ийн доороос орж ирэхэд scroll-оос хамаарч хөдөлнө
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start center"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [120, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.55, 1], [0, 0.4, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const rotate = useTransform(scrollYProgress, [0, 1], [2, 0]);

  return (
    // Бүх карт нэг баганад шууд sticky → дараалан наалдаж дээр дээрээ давхарлана
    <div
      ref={ref}
      className="sticky"
      style={{
        top: `calc(6rem + ${i * 16}px)`,
        // Сүүлийн картад ч бас дээш гарч наалдах зай хэрэгтэй
        marginBottom: "16vh",
        zIndex: i + 1,
      }}
    >
      <motion.div
        className="flex items-start gap-5 px-6 py-6"
        style={{
          y,
          opacity,
          scale,
          rotate,
          transformOrigin: "center bottom",
          background: "#ffffff",
          borderRadius: 22,
          border: "1px solid #eee",
          boxShadow: "0 14px 34px rgba(0,0,0,0.11)",
          minHeight: 116,
        }}
      >
        <div style={{ fontSize: 40, lineHeight: 1, flexShrink: 0 }}>{f.icon}</div>
        <div>
          <p
            className="font-bold mb-2 leading-tight"
            style={{
              color: "#0C0C0C",
              fontSize: "clamp(1.15rem, 2vw, 1.5rem)",
            }}
          >
            {f.title}
          </p>
          <p
            className="leading-relaxed"
            style={{
              color: "#6b7280",
              fontSize: "clamp(0.92rem, 1.3vw, 1.05rem)",
              fontWeight: 400,
            }}
          >
            {f.desc}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function WhyUsSection() {
  return (
    <section
      className="w-full px-5 md:px-10 py-20 md:py-28 relative z-[1]"
      style={{ background: "#ffffff" }}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 md:gap-20">
        {/* Left — sticky гарчиг */}
        <div className="md:w-2/5 md:sticky md:top-24 self-start">
          <FadeIn y={40} duration={0.7}>
            <h2
              className="font-black leading-[1.05] tracking-tight"
              style={{ color: "#0C0C0C", fontSize: "clamp(2rem, 4.5vw, 3.2rem)" }}
            >
              Урилгын шинэ
              <br />
              эрин үе.
            </h2>
            <p
              className="mt-5 leading-relaxed"
              style={{ color: "#6b7280", maxWidth: 360, fontSize: "clamp(0.9rem, 1.4vw, 1.05rem)" }}
            >
              Анхны сэтгэгдэл урилгаас эхэлнэ.
            </p>
            <p
              className="mt-2 leading-relaxed whitespace-nowrap font-medium"
              style={{ color: "#0C0C0C", fontSize: "clamp(0.9rem, 1.4vw, 1.05rem)" }}
            >
              Таны урилга — Таны нэрийн хуудас.
            </p>
            <a
              href={ORDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-8 rounded-full font-semibold text-sm px-8 py-3.5 text-white transition-transform hover:scale-[1.02]"
              style={{ background: "#0C0C0C", textDecoration: "none" }}
            >
              Загвар сонгох
            </a>
          </FadeIn>
        </div>

        {/* Right — scroll-аар доороос гарч ирээд давхарлаж стэк болдог давуу талууд */}
        <div className="md:w-3/5">
          {WHY_US.map((f, i) => (
            <WhyUsCard key={f.title} f={f} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works Section ─────────────────────────────────────────────────────
const STEPS = [
  { n: "01", title: "Загвар сонгох", desc: "Та өөрт тохирох загварыг сонгоно (Demo харж сонгох)" },
  { n: "02", title: "Захиалга өгөх", desc: "Facebook, Instagram болон утасаар холбогдон захиалгаа өгнө" },
  {
    n: "03",
    title: "Мэдэгдэл хүлээн авах",
    desc: "24 цагийн дотор урилгыг тань бэлдэж, LINK, QR-г явуулна",
  },
  {
    n: "04",
    title: "Хуваалцах",
    desc: "LINK болон QR-г зочиддоо Facebook, Instagram, SMS болон бусад бүх сувгаар илгээх боломжтой",
  },
];

function HowItWorksSection() {
  return (
    <section
      className="w-full px-5 md:px-10 py-20 md:py-28 relative z-[2]"
      style={{
        background: "#ffffff",
        marginTop: -1,
      }}
    >
      <FadeIn y={40} duration={0.7} className="text-center mb-14 md:mb-20">
        <h2
          className="font-black uppercase leading-none tracking-tight"
          style={{ color: "#0C0C0C", fontSize: "clamp(2.2rem, 10vw, 110px)" }}
        >
          Яаж ажилладаг
        </h2>
        <p
          className="mt-4 text-xs tracking-widest uppercase"
          style={{ color: "#9ca3af" }}
        >
          Энгийн 4 алхам
        </p>
      </FadeIn>

      <div className="max-w-4xl mx-auto">
        {STEPS.map((s, i) => (
          <FadeIn
            key={s.n}
            delay={i * 0.1}
            y={28}
            duration={0.65}
            className="flex items-start md:items-center gap-6 md:gap-10 py-8 md:py-10"
            style={{
              borderTop: i === 0 ? "1px solid rgba(12,12,12,0.1)" : "none",
              borderBottom: "1px solid rgba(12,12,12,0.1)",
            }}
          >
            <div
              className="font-black leading-none shrink-0"
              style={{
                color: "#0C0C0C",
                fontSize: "clamp(2.8rem, 9vw, 110px)",
                opacity: 0.1,
              }}
            >
              {s.n}
            </div>
            <div>
              <h3
                className="font-semibold uppercase tracking-wide mb-2"
                style={{ fontSize: "clamp(0.95rem, 2vw, 1.7rem)" }}
              >
                {s.title}
              </h3>
              <p
                className="leading-relaxed"
                style={{ fontSize: "clamp(0.82rem, 1.4vw, 1.05rem)", color: "#6b7280" }}
              >
                {s.desc}
              </p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ─── Footer CTA Section ───────────────────────────────────────────────────────
function FooterSection() {
  return (
    <section
      className="w-full px-5 md:px-10 py-20 md:py-24 relative z-[3]"
      style={{
        background: "#0C0C0C",
        borderRadius: "clamp(28px, 4vw, 56px) clamp(28px, 4vw, 56px) 0 0",
        marginTop: -1,
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pb-16 md:pb-24">
        <FadeIn y={40} duration={0.7}>
          <h2
            className="font-black uppercase leading-none tracking-tight"
            style={{ ...goldGrad, fontSize: "clamp(2.5rem, 10vw, 100px)" }}
          >
            Захиалга
            <br />
            өгөх
          </h2>
        </FadeIn>
        <FadeIn y={20} delay={0.15} duration={0.7}>
          <CTAButton href={ORDER_URL}>Messenger-ээр захиалах →</CTAButton>
        </FadeIn>
      </div>

      <div
        className="border-t pt-8"
        style={{ borderColor: "rgba(215,226,234,0.07)" }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
          <span
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "1.3rem",
              ...goldGrad,
            }}
          >
            Special Day
          </span>
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: "rgba(215,226,234,0.22)" }}
          >
            © 2026 — eurilga.com · Монгол хурим, төрсөн өдөр, баярын цахим урилга
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0C0C0C", overflowX: "clip" }}>
      <HeroSection />
      <MarqueeStrip />
      <AboutSection />
      <StatsSection />
      <TemplatesSection />
      <WhyUsSection />
      <HowItWorksSection />
      <FooterSection />
    </div>
  );
}
