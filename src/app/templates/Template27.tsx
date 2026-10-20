import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { EventData } from "../../types/event";
import { getPoemLines, getSchedule } from "../../lib/eventContent";
import { cfg, sectionOn } from "../../lib/eventConfig";
import { normalizeUrl } from "../../lib/url";

// ─── Template 27 / 28 — шагналын баярын (хүндэтгэлийн) урилга ────────────────
// Зорилтот үзэгч 40+ нас: цайвар ivory дэвсгэр, том бичиг (PT Serif 17px+),
// хөдөлгөөн бага, "Залгах" гол үйлдэл, "Том үсэг" товч. Нэг бүтэц, хоёр theme:
//   "wine" (template 27) — гүн бордо + алтан: одон медалийн тууз, уламжлалт, дулаан
//   "navy" (template 28) — гүн хөх + алтан: төрийн ёслол, албан
// Мотив: алтан лавр, медаль-туузны хүрээ, үүлэн хээ. Соёмбо/төрийн сүлд ХЭРЭГЛЭХГҮЙ.
//
// Section: видео intro (T13-ын дугтуй нээх; intro.video: false → intro-гүй) → hero
// → урилгын үг → ажлын замнал → цомог (дарахад томорно) → хөтөлбөр → хэзээ (огноо,
// цаг + тоологч) → байршил → мэндчилгээ → ирц → footer. Түлхүүрүүд: docs/event-config.md § T27.

// ─── Theme ───────────────────────────────────────────────────────────────────
type Theme = {
  key: "wine" | "navy";
  dark: string; dark2: string;            // hero / footer band (градиент)
  ivory: string; ivory2: string;          // хуудас / карт, input
  ink: string; inkMuted: string;          // бичиг цайвар дэвсгэр дээр
  paper: string; paperMuted: string;      // бичиг бараан дэвсгэр дээр
  gold: string; goldLight: string; goldDeep: string; goldGlow: string;
  line: string;                           // цайвар дэвсгэр дээрх зураас, хүрээ
  primary: string; primaryDeep: string;   // гарчиг, гол товч
  ribbon: string;                         // медалийн тууз
};

const ThemeCtx = createContext<Theme | null>(null);
const useT = () => useContext(ThemeCtx)!;

// Playfair Display — гарчиг, нэр (налуу биш, албан). PT Serif — бичвэр: 40+ насанд
// уншихад тод, cyrillic-ext (ө/ү) бүрэн. Хоёулаа index.html-д ачаалагдсан.
const display = { fontFamily: "'Playfair Display', 'PT Serif', serif" } as const;
const body    = { fontFamily: "'PT Serif', 'PT Sans', serif" } as const;
const bodyB   = { fontFamily: "'PT Serif', 'PT Sans', serif", fontWeight: 700 } as const;

// Бичгийн хэмжээ — root дээрх --k (1 эсвэл 1.15, "Том үсэг" товч) -оор үржинэ
const fs = (n: number) => `calc(${n}px * var(--k))`;

const SHADOW_CARD = "0 8px 24px rgba(40,25,10,.10)";

// Анхдагч intro — Template13-ын дугтуй нээх видео (config.intro.video-оор солигдоно)
const T27_INTRO_VIDEO = "https://premiumelegante.thedigitalyes.com/assets/intro-video-new-XmwQeafK.mp4";

const THEMES: Record<Theme["key"], Theme> = {
  wine: {
    key: "wine",
    dark: "#5C1A2E", dark2: "#3A0E1D",
    ivory: "#F7F1E6", ivory2: "#FFFBF4",
    ink: "#2B2118", inkMuted: "#6E5F52",
    paper: "#FBF5EA", paperMuted: "#D9C3B0",
    gold: "#C9A24A", goldLight: "#E8CF8A", goldDeep: "#9A7A2E", goldGlow: "rgba(201,162,74,.35)",
    line: "#E3D6C2",
    primary: "#7A2240", primaryDeep: "#5C1A2E",
    ribbon: "#8E2A4A",
  },
  navy: {
    key: "navy",
    dark: "#0F2440", dark2: "#07162B",
    ivory: "#F5F2EA", ivory2: "#FFFDF7",
    ink: "#1C2333", inkMuted: "#5B6475",
    paper: "#F4F1E8", paperMuted: "#B9C2D1",
    gold: "#C9A24A", goldLight: "#E8CF8A", goldDeep: "#9A7A2E", goldGlow: "rgba(201,162,74,.35)",
    line: "#DED9CC",
    primary: "#1E3A64", primaryDeep: "#0F2440",
    ribbon: "#2B4C80",
  },
};

// ─── Icons (inline SVG, 24×24) ───────────────────────────────────────────────
type IconFn = ({ size, color }: { size?: number; color?: string }) => React.ReactElement;
const ico = (size: number, color: string, children: React.ReactNode, filled = false) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? color : "none"} stroke={filled ? "none" : color}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
    {children}
  </svg>
);
const StarIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M12 2 L14.6 8.6 L21.5 9.2 L16.2 13.8 L17.9 20.6 L12 17 L6.1 20.6 L7.8 13.8 L2.5 9.2 L9.4 8.6 Z" />, true);
const MedalIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <><circle cx="12" cy="15" r="5.5" /><path d="M8.5 10.5 6 2h4l2 5 2-5h4l-2.5 8.5" /></>);
const PinIcon: IconFn      = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></>);
const SendIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M21 3 10 14" /><path d="M21 3 14 21l-4-7-7-4Z" /></>);
const PhoneIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />);
const CameraIcon: IconFn   = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M4 8h3l2-3h6l2 3h3v12H4Z" /><circle cx="12" cy="13" r="3.5" /></>);
const NoteIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>);
const NoteOffIcon: IconFn  = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /><path d="M3 3l18 18" /></>);
const CheckIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M4 12.5 9.5 18 20 6.5" />);
const ChevronsIcon: IconFn = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M6 6l6 6 6-6" /><path d="M6 12l6 6 6-6" /></>);
const CloseIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M6 6l12 12M18 6 6 18" />);
const ArrowLeftIcon: IconFn  = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M15 5l-7 7 7 7" />);
const ArrowRightIcon: IconFn = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M9 5l7 7-7 7" />);

// ─── global styles ───────────────────────────────────────────────────────────
function Styles() {
  const t = useT();
  return (
    <style>{`
      @keyframes t27Shimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
      @keyframes t27Pulse   { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
      @keyframes t27Bounce  { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
      .t27 .t27-shimmer { animation: t27Shimmer 7s linear infinite; }
      .t27 .t27-pulse   { animation: t27Pulse 1.6s ease-in-out infinite; }
      .t27 .t27-bounce  { animation: t27Bounce 2.4s ease-in-out infinite; }
      .t27 :focus-visible { outline: 2px solid ${t.gold}; outline-offset: 3px; }
      .t27 input::placeholder, .t27 textarea::placeholder { color: ${t.inkMuted}; opacity: .75; }
      .t27 input:focus, .t27 textarea:focus { border-color: ${t.gold} !important; box-shadow: 0 0 0 3px ${t.goldGlow}; }
      .t27 .t27-btn:active:not(:disabled) { transform: translateY(1px); }
      @media (prefers-reduced-motion: reduce) {
        .t27 .t27-shimmer, .t27 .t27-pulse, .t27 .t27-bounce { animation: none !important; }
      }
    `}</style>
  );
}

// ─── Мотивууд ────────────────────────────────────────────────────────────────
// Үүлэн хээ-гийн давтамжтай алтан зураас — бараан band-ийн дээд/доод ирмэгт
function CloudBand({ flip = false }: { flip?: boolean }) {
  const t = useT();
  return (
    <svg aria-hidden="true" width="100%" height="18" style={{ display: "block", transform: flip ? "scaleY(-1)" : "none" }}>
      <defs>
        <pattern id="t27cloud" width="28" height="18" patternUnits="userSpaceOnUse">
          <path d="M0 15 a14 14 0 0 1 28 0" fill="none" stroke={t.gold} strokeWidth="1.2" opacity="0.85" />
          <path d="M7 15 a7 7 0 0 1 14 0" fill="none" stroke={t.gold} strokeWidth="1" opacity="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="18" fill="url(#t27cloud)" />
      <line x1="0" y1="17" x2="100%" y2="17" stroke={t.gold} strokeWidth="0.8" opacity="0.9" />
    </svg>
  );
}

// Алтан зураас + төв дэх жижиг очир
function GoldDivider({ maxWidth = 160, style = {} }: { maxWidth?: number; style?: React.CSSProperties }) {
  const t = useT();
  return (
    <div aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "0 auto", maxWidth, ...style }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${t.gold})` }} />
      <div style={{ width: 7, height: 7, background: t.gold, transform: "rotate(45deg)" }} />
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${t.gold})` }} />
    </div>
  );
}

// Картын дөрвөн буланд алтан L-хүрээ
const CORNER_POS: React.CSSProperties[] = [
  { top: 8, left: 8 }, { top: 8, right: 8, transform: "scaleX(-1)" },
  { bottom: 8, left: 8, transform: "scaleY(-1)" }, { bottom: 8, right: 8, transform: "scale(-1,-1)" },
];
function Corners() {
  const t = useT();
  return (
    <>
      {CORNER_POS.map((pos, i) => (
        <svg key={i} aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" style={{ position: "absolute", pointerEvents: "none", ...pos }}>
          <path d="M1 21 V1 H21" fill="none" stroke={t.gold} strokeWidth="1.2" />
          <path d="M1 5 L5 1 L9 5 L5 9 Z" fill={t.gold} />
        </svg>
      ))}
    </>
  );
}

// Том портрет: нуман (арк) дээд ирмэгтэй, алтан давхар хүрээтэй 4:5 зураг.
// Хүндэтгэлийн урилгад өөрийн зураг том харагдах нь гол тул hero-гийн бүх өргөнийг эзэлнэ.
const ARCH = "50% 50% 12px 12px / 28% 28% 12px 12px";
function ArchPortrait({ photo }: { photo?: string | null }) {
  const t = useT();
  return (
    <div style={{
      padding: 6, borderRadius: ARCH,
      background: `linear-gradient(160deg, ${t.goldLight}, ${t.gold} 45%, ${t.goldDeep})`,
      boxShadow: `0 18px 44px rgba(0,0,0,.45), 0 0 0 1px ${t.goldDeep}`,
    }}>
      <div style={{ padding: 4, borderRadius: ARCH, background: t.dark2 }}>
        <div style={{ aspectRatio: "4 / 5", overflow: "hidden", borderRadius: ARCH, background: t.dark2, position: "relative" }}>
          {photo ? (
            <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div aria-label="Зураг" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <CameraIcon size={32} color={t.paperMuted} />
              <span style={{ ...bodyB, fontSize: fs(13), letterSpacing: "0.18em", color: t.paperMuted }}>ЗУРАГ</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Жижиг медаль-туузны тэмдэг — портретийн доод ирмэг дээр давхарлана
function MedalBadge({ style = {} }: { style?: React.CSSProperties }) {
  const t = useT();
  return (
    <svg aria-hidden="true" width="66" height="88" viewBox="0 0 60 80" style={{ display: "block", overflow: "visible", filter: "drop-shadow(0 6px 14px rgba(0,0,0,.45))", ...style }}>
      <path d="M20 0 H40 L36 36 H24 Z" fill={t.ribbon} />
      <path d="M25 0 L27.5 36 M35 0 L32.5 36" stroke={t.gold} strokeWidth="1.4" opacity="0.9" />
      <circle cx="30" cy="56" r="22" fill={t.dark2} stroke={t.gold} strokeWidth="2.5" />
      <circle cx="30" cy="56" r="18" fill="none" stroke={t.goldLight} strokeWidth="0.8" opacity="0.8" />
      <g transform="translate(19 45)">
        <path d="M11 1 L13.4 7.3 L20 7.8 L15 12.2 L16.6 18.7 L11 15.2 L5.4 18.7 L7 12.2 L2 7.8 L8.6 7.3 Z" fill={t.gold} />
      </g>
    </svg>
  );
}

// ─── Жижиг UI хэсгүүд ────────────────────────────────────────────────────────
function Eyebrow({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) {
  const t = useT();
  return (
    <div style={{ ...bodyB, fontSize: fs(13), letterSpacing: "0.22em", textTransform: "uppercase", color: onDark ? t.goldLight : t.goldDeep }}>
      {children}
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <div style={{ textAlign: "center", marginBottom: 26 }}>
      <h2 style={{ ...display, fontWeight: 600, fontSize: fs(28), lineHeight: 1.2, color: t.primary, margin: 0 }}>
        {children}
      </h2>
      <GoldDivider style={{ marginTop: 12 }} />
    </div>
  );
}

// Хөдөлгөөн бага: зөвхөн зөөлөн fade-up
function FadeUp({ children, delay = 0, style = {} }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

type BtnProps = {
  variant: "solid" | "gold" | "outline" | "outlineDark";
  icon?: React.ReactNode; children: React.ReactNode;
  onClick?: () => void; href?: string; disabled?: boolean; style?: React.CSSProperties;
};
// Том (54px), тод товч. solid/outline — цайвар дэвсгэрт; gold/outlineDark — бараан band-д
function Btn({ variant, icon, children, onClick, href, disabled, style = {} }: BtnProps) {
  const t = useT();
  const base: React.CSSProperties = {
    ...display, fontWeight: 600, fontSize: fs(17), letterSpacing: "0.01em",
    minHeight: 48, borderRadius: 10, border: "none", padding: "0 18px",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
    cursor: disabled ? "not-allowed" : "pointer", textDecoration: "none",
    opacity: disabled ? 0.55 : 1, transition: "transform .08s, opacity .2s", boxSizing: "border-box",
    ...(variant === "solid"       ? { background: t.primary, color: t.paper, boxShadow: `0 6px 18px ${t.primaryDeep}55` } :
        variant === "gold"        ? { background: `linear-gradient(135deg, ${t.goldLight}, ${t.gold} 50%, ${t.goldDeep})`, color: t.dark2, boxShadow: `0 6px 18px ${t.goldGlow}` } :
        variant === "outline"     ? { background: "transparent", color: t.primary, boxShadow: `inset 0 0 0 1.5px ${t.primary}` } :
                                    { background: "rgba(255,255,255,.06)", color: t.paper, boxShadow: `inset 0 0 0 1.5px ${t.gold}` }),
    ...style,
  };
  const cls = `t27-btn t27-btn-${variant}`;
  if (href) {
    const ext = !href.startsWith("tel:");
    return <a className={cls} href={href} target={ext ? "_blank" : undefined} rel={ext ? "noreferrer" : undefined} style={base}>{icon}{children}</a>;
  }
  return <button type="button" className={cls} onClick={onClick} disabled={disabled} style={base}>{icon}{children}</button>;
}

function Field({ id, label, textarea, ...rest }: {
  id: string; label: string; textarea?: boolean;
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; inputMode?: "numeric" | "text";
}) {
  const t = useT();
  const input: React.CSSProperties = {
    width: "100%", minHeight: 48, padding: "11px 14px", boxSizing: "border-box",
    background: t.ivory2, border: `1.5px solid ${t.line}`, borderRadius: 10,
    ...body, fontSize: fs(17), color: t.ink, outline: "none", transition: "border-color .2s, box-shadow .2s",
  };
  return (
    <div>
      <label htmlFor={id} style={{ ...bodyB, fontSize: fs(15), lineHeight: 1.4, color: t.ink, display: "block", marginBottom: 8 }}>
        {label}
      </label>
      {textarea ? (
        <textarea id={id} rows={4} value={rest.value} onChange={(e) => rest.onChange(e.target.value)}
          placeholder={rest.placeholder} style={{ ...input, resize: "vertical", lineHeight: 1.5 }} />
      ) : (
        <input id={id} type={rest.type || "text"} inputMode={rest.inputMode} value={rest.value}
          onChange={(e) => rest.onChange(e.target.value)} placeholder={rest.placeholder} style={input} />
      )}
    </div>
  );
}

function Photo({ src, alt = "", style = {} }: { src?: string; alt?: string; style?: React.CSSProperties }) {
  const t = useT();
  if (src) return <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }} />;
  return (
    <div aria-label={alt || "Зураг"} style={{
      width: "100%", height: "100%", background: t.ivory2,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, ...style,
    }}>
      <CameraIcon size={28} color={t.inkMuted} />
      <span style={{ ...bodyB, fontSize: fs(13), letterSpacing: "0.18em", color: t.inkMuted }}>ЗУРАГ</span>
    </div>
  );
}

// Цайвар section: дээд талдаа нимгэн зураас, 40px дээд / 56px доод зай
function Section({ children, id, style = {} }: { children: React.ReactNode; id?: string; style?: React.CSSProperties }) {
  const t = useT();
  return (
    <section id={id} style={{ background: t.ivory, position: "relative" }}>
      <div aria-hidden="true" style={{ height: 1, background: t.line, margin: "0 16px" }} />
      <div style={{ padding: "40px 16px 56px", position: "relative", ...style }}>
        {children}
      </div>
    </section>
  );
}

// Утасны дугаар — алтан хүрээтэй pill, tel: холбоос
function PhonePill({ phone, onDark = false }: { phone: string; onDark?: boolean }) {
  const t = useT();
  return (
    <a href={`tel:${phone.replace(/\D/g, "")}`} style={{
      display: "inline-flex", alignItems: "center", gap: 10, minHeight: 46, padding: "4px 16px 4px 4px",
      background: onDark ? "rgba(255,255,255,.06)" : t.ivory2, border: `1.5px solid ${t.gold}`, borderRadius: 999, textDecoration: "none",
    }}>
      <span style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${t.goldLight}, ${t.gold} 50%, ${t.goldDeep})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <PhoneIcon size={18} color={t.dark2} />
      </span>
      <span style={{ ...display, fontWeight: 600, fontSize: fs(18), color: onDark ? t.paper : t.ink }}>{fmtPhone(phone)}</span>
    </a>
  );
}

// ─── Туслахууд ───────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  const [y, m, day] = (d || "").split("-");
  if (!y || !m || !day) return d;
  return `${y} оны ${Number(m)} сарын ${Number(day)}`;
}
function fmtPhone(p: string) {
  const digits = p.replace(/\D/g, "");
  return digits.length === 8 ? digits.slice(0, 4) + " " + digits.slice(4) : p;
}

// ─── Demo агуулга ────────────────────────────────────────────────────────────
// Demo зураг — Supabase `medal` bucket (жинхэнэ урилгад hero.photo / person1_photo /
// gallery_photos-оос). /demo/27, /demo/28 дээр л хэрэглэгдэнэ.
const MEDAL = (name: string) => `https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/medal/${name}`;
const DEMO_PHOTOS = {
  hero: MEDAL("main.jpg"),
  gallery: [MEDAL("main1.jpg"), MEDAL("main2.jpeg"), MEDAL("main3.jpg"), MEDAL("main4.jpeg")],
};
type CareerItem = { year: string; text: string };
const DEMO_CAREER: CareerItem[] = [
  { year: "1985", text: "Монгол Улсын Их Сургуулийг төгсөж, багшлах ажлын гараагаа эхэлсэн" },
  { year: "1998", text: "Сургуулийн сургалтын менежерээр томилогдсон" },
  { year: "2010", text: "Боловсролын тэргүүний ажилтан цол хүртсэн" },
  { year: "2026", text: "Хөдөлмөрийн хүндэт медалиар шагнагдсан" },
];
type Wish = { name: string; message: string };
const DEMO_WISHES: Wish[] = [
  { name: "Хамт олон",   message: "Олон жилийн үр бүтээлтэй хөдөлмөрийн үнэлгээ болсон энэ шагналд чин сэтгэлээсээ баяр хүргэе." },
  { name: "Д. Батбаяр", message: "Багш аа, та бидний хувьд үргэлж үлгэр дуурайл байсаар ирсэн. Баяр хүргэе!" },
];
const T27_DEFAULT_POEM = [
  "Эрхэм хүндэт та бүхнийг",
  "шагналын баярын хүндэтгэлийн",
  "арга хэмжээнд хүрэлцэн ирэхийг",
  "хүндэтгэн урьж байна.",
];

// ─── Intro: видео (config.intro.video өгсөн үед л) ───────────────────────────
function VideoIntro({ src, onDone }: { src: string; onDone: () => void }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => { videoRef.current?.play().catch(() => {}); }, []);
  const handleEnded = () => {
    if (exiting) return;
    onDone(); setExiting(true);
    setTimeout(() => setVisible(false), 1600);
  };
  if (!visible) return null;
  return (
    <motion.div initial={{ opacity: 1 }} animate={{ opacity: exiting ? 0 : 1 }} transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
      style={{ position: "fixed", inset: 0, background: "#000", zIndex: 9999, overflow: "hidden", pointerEvents: exiting ? "none" : "auto" }}>
      <video ref={videoRef} src={src} autoPlay muted playsInline preload="auto" onEnded={handleEnded} onError={handleEnded}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
    </motion.div>
  );
}

// ─── Hero (бараан band) ──────────────────────────────────────────────────────
function T27Hero({ event, started }: { event: EventData; started: boolean }) {
  const t = useT();
  const demo     = event.id === "demo";
  const name     = cfg(event.config, "hero.name", event.person1_name || "");
  const eyebrow  = cfg(event.config, "hero.eyebrow", "Хүндэтгэлийн урилга");
  const award    = cfg(event.config, "award.name", demo ? "Хөдөлмөрийн хүндэт медаль" : "Шагналын баяр");
  const awardBy  = cfg<string | null>(event.config, "award.by", demo ? "Монгол Улсын Ерөнхийлөгчийн зарлигаар" : null);
  const subtitle = cfg<string | null>(event.config, "hero.subtitle", demo ? "Жаран насны ой ба шагналын баяр" : null);
  const photo    = cfg<string | null>(event.config, "hero.photo", null) || (demo ? DEMO_PHOTOS.hero : null) || event.person1_photo || event.main_image;

  const show = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: started ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    transition: { duration: 0.8, delay, ease: "easeOut" as const },
  });
  const scrollNext = () => document.getElementById("t27-letter")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <header style={{
      background: `linear-gradient(180deg, ${t.dark} 0%, ${t.dark2} 100%)`, color: t.paper,
      position: "relative", overflow: "hidden", textAlign: "center",
    }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(70% 45% at 50% 30%, ${t.goldGlow}, transparent 70%)` }} />
      <CloudBand />
      <div style={{ padding: "26px 16px 36px", position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <motion.div {...show(0.1)}><Eyebrow onDark>{eyebrow}</Eyebrow></motion.div>

        <motion.div {...show(0.25)} className="t27-shimmer" style={{
          ...display, fontWeight: 600, fontSize: fs(30), lineHeight: 1.2, margin: "14px 0 6px", maxWidth: 380,
          backgroundImage: `linear-gradient(90deg, ${t.goldDeep}, ${t.goldLight} 35%, ${t.gold} 50%, ${t.goldLight} 65%, ${t.goldDeep})`,
          backgroundSize: "200% 100%", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent",
        }}>
          {award}
        </motion.div>
        {awardBy && (
          <motion.div {...show(0.35)} style={{ ...body, fontStyle: "italic", fontSize: fs(16), lineHeight: 1.5, color: t.goldLight, opacity: 0.9, maxWidth: 340 }}>
            {awardBy}
          </motion.div>
        )}

        {/* Том портрет — hero-гийн бүх өргөн (max 360), доод ирмэг дээр медаль тэмдэг */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={started ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
          transition={{ duration: 1, delay: 0.45, ease: "easeOut" }}
          style={{ marginTop: 24, marginBottom: 48, width: "100%", maxWidth: 360, position: "relative" }}
        >
          <ArchPortrait photo={photo} />
          <MedalBadge style={{ position: "absolute", left: "50%", bottom: -44, transform: "translateX(-50%)" }} />
        </motion.div>

        <motion.h1 {...show(0.7)} style={{
          ...display, fontWeight: 600, fontSize: name.length > 18 ? fs(28) : fs(38), lineHeight: 1.15,
          color: t.paper, margin: "6px 0 6px", maxWidth: "100%", overflowWrap: "anywhere",
        }}>
          {name}
        </motion.h1>
        {subtitle && (
          <motion.div {...show(0.8)} style={{ ...body, fontStyle: "italic", fontSize: fs(18), lineHeight: 1.5, color: t.goldLight }}>
            {subtitle}
          </motion.div>
        )}

        {/* Огноо hero-д биш — "Хэзээ" хэсэгт (байршлын дээр) том гарна */}
        <motion.div {...show(0.9)} style={{ ...body, fontStyle: "italic", fontSize: fs(16), color: t.paperMuted, marginTop: 22 }}>
          Урилгыг доош гүйлгэж үзнэ үү
        </motion.div>

        <motion.button type="button" onClick={scrollNext} aria-label="Доош гүйлгэх"
          initial={{ opacity: 0 }} animate={started ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 1, delay: 1.3 }}
          style={{ marginTop: 4, width: 52, height: 52, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="t27-bounce"><ChevronsIcon size={28} color={t.goldLight} /></div>
        </motion.button>
      </div>
      <CloudBand flip />
    </header>
  );
}

// ─── Урилгын үг ──────────────────────────────────────────────────────────────
function T27Letter({ event }: { event: EventData }) {
  const t = useT();
  const lines = getPoemLines(event, T27_DEFAULT_POEM);
  const note  = cfg<string | null>(event.config, "letter.note", null);
  return (
    <section id="t27-letter" style={{ background: t.ivory, padding: "40px 16px 24px" }}>
      <FadeUp>
        <div style={{ background: t.ivory2, border: `1px solid ${t.line}`, borderRadius: 6, boxShadow: SHADOW_CARD, padding: "40px 28px 32px", position: "relative" }}>
          <Corners />
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><MedalIcon size={30} color={t.gold} /></div>
          <div style={{ ...body, fontSize: fs(19), lineHeight: 1.65, color: t.ink, textAlign: "center" }}>
            {lines.map((l, i) => l === "" ? <div key={i} style={{ height: 14 }} /> : <div key={i}>{l}</div>)}
          </div>
          {note && <div style={{ ...body, fontStyle: "italic", fontSize: fs(16), lineHeight: 1.5, color: t.inkMuted, textAlign: "center", marginTop: 18 }}>{note}</div>}
          <GoldDivider style={{ marginTop: 24 }} />
        </div>
      </FadeUp>
    </section>
  );
}

// ─── Ажлын замнал (он → үйл явдал) ───────────────────────────────────────────
function T27Career({ event }: { event: EventData }) {
  const t = useT();
  const title = cfg(event.config, "career.title", "Ажлын замнал");
  const items = cfg<CareerItem[]>(event.config, "career.items", event.id === "demo" ? DEMO_CAREER : []);
  // Scroll-ын хөдөлгөөнөөр алтан шугам дүүрч, мөрүүд нь дагаж гарна (T23/T25-тай адил)
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  const spine = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <Section>
      <FadeUp><Heading>{title}</Heading></FadeUp>
      <div ref={ref} style={{ position: "relative", paddingLeft: 30 }}>
        <div aria-hidden="true" style={{ position: "absolute", left: 7, top: 10, bottom: 10, width: 1, background: t.line }} />
        <motion.div aria-hidden="true" style={{ position: "absolute", left: 7, top: 10, width: 1, height: spine, maxHeight: "calc(100% - 20px)", background: t.gold }} />
        {items.map((it, i) => (
          <FadeUp key={i} delay={Math.min(i, 5) * 0.12} style={{ position: "relative", marginBottom: 22 }}>
            <div aria-hidden="true" style={{ position: "absolute", left: -30 + 2, top: 8, width: 11, height: 11, borderRadius: "50%", background: t.ivory, border: `2px solid ${t.gold}` }} />
            <div style={{ ...display, fontWeight: 700, fontSize: fs(19), color: t.goldDeep, lineHeight: 1.3 }}>{it.year}</div>
            <div style={{ ...body, fontSize: fs(17), lineHeight: 1.6, color: t.ink, marginTop: 4 }}>{it.text}</div>
          </FadeUp>
        ))}
      </div>
    </Section>
  );
}

// ─── Цомог — bento grid (T11 шиг): өргөн зураг бүх өргөнөөр; дарахад томорно (lightbox)
function T27Gallery({ event }: { event: EventData }) {
  const t = useT();
  const title  = cfg(event.config, "gallery.title", "Дурсамжийн зургууд");
  const photos = (event.id === "demo" ? DEMO_PHOTOS.gallery : event.gallery_photos || []).filter(Boolean).slice(0, 6);
  const n = photos.length;
  const [open, setOpen] = useState<number | null>(null);
  // Bento (T11 шиг): сондгой тоотой бол эхний зураг бүх өргөнөөр (16:10), бусад нь
  // 2 баганад дөрвөлжин
  const step = (d: number) => setOpen((i) => (i === null ? null : (i + d + n) % n));
  // Гар: Esc → хаах, сум → өмнөх/дараагийн
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, n]);
  if (n === 0) return null;

  const overlayBtn: React.CSSProperties = {
    position: "absolute", width: 44, height: 44, borderRadius: "50%", border: "none",
    background: "rgba(255,255,255,.14)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  };
  const navBtn = (side: "left" | "right") => (
    <button type="button" aria-label={side === "left" ? "Өмнөх зураг" : "Дараагийн зураг"}
      onClick={(e) => { e.stopPropagation(); step(side === "left" ? -1 : 1); }}
      style={{ ...overlayBtn, top: "50%", transform: "translateY(-50%)", ...(side === "left" ? { left: 8 } : { right: 8 }) }}>
      {side === "left" ? <ArrowLeftIcon size={24} color="#fff" /> : <ArrowRightIcon size={24} color="#fff" />}
    </button>
  );

  return (
    <Section>
      <FadeUp><Heading>{title}</Heading></FadeUp>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        {photos.map((src, i) => {
          const isWide = n % 2 === 1 && i === 0;
          return (
            <FadeUp key={i} delay={(i % 2) * 0.08} style={{ gridColumn: isWide ? "span 2" : "auto" }}>
              <button type="button" onClick={() => setOpen(i)} aria-label={`Зураг ${i + 1} томруулах`}
                style={{ display: "block", width: "100%", padding: 5, border: `1px solid ${t.gold}`, background: t.ivory2, boxShadow: SHADOW_CARD, cursor: "zoom-in" }}>
                <div style={{ aspectRatio: isWide ? "16 / 10" : "1 / 1", overflow: "hidden", background: t.line }}>
                  <Photo src={src} alt={`Зураг ${i + 1}`} />
                </div>
              </button>
            </FadeUp>
          );
        })}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-label={`Зураг ${open + 1}`}
            style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(10,8,6,.94)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          >
            <motion.img key={open} src={photos[open]} alt={`Зураг ${open + 1}`}
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 4, boxShadow: "0 20px 60px rgba(0,0,0,.6)" }} />
            <button type="button" onClick={() => setOpen(null)} aria-label="Хаах"
              style={{ ...overlayBtn, top: "calc(12px + env(safe-area-inset-top, 0px))", right: 12 }}>
              <CloseIcon size={22} color="#fff" />
            </button>
            {n > 1 && navBtn("left")}
            {n > 1 && navBtn("right")}
            <div style={{ position: "absolute", bottom: "calc(14px + env(safe-area-inset-bottom, 0px))", left: 0, right: 0, textAlign: "center", ...body, fontSize: 14, color: "rgba(255,255,255,.7)" }}>
              {open + 1} / {n}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

// ─── Хөтөлбөр ────────────────────────────────────────────────────────────────
function T27Schedule({ event }: { event: EventData }) {
  const t = useT();
  const [hh, mm] = (event.time || "17:00").split(":").map(Number);
  const fmt = (h: number, m: number) =>
    String(Math.floor(h + m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  const items = getSchedule(event, [
    { time: fmt(hh, mm),          label: "Зочдыг угтах" },
    { time: fmt(hh, mm + 30),     label: "Хүндэтгэлийн үг" },
    { time: fmt(hh + 1, mm),      label: "Шагнал гардуулах ёслол" },
    { time: fmt(hh + 1, mm + 30), label: "Хүндэтгэлийн зоог" },
  ]);
  // Scroll-ын хөдөлгөөнөөр алтан шугам дүүрч, алхмууд нь дагаж гарна (T23/T25-тай адил)
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  const spine = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  return (
    <Section>
      <FadeUp><Heading>Хөтөлбөр</Heading></FadeUp>
      <div ref={ref} style={{ position: "relative", paddingLeft: 52 }}>
        <div aria-hidden="true" style={{ position: "absolute", left: 17, top: 20, bottom: 20, width: 2, backgroundImage: `repeating-linear-gradient(to bottom, ${t.line} 0 6px, transparent 6px 12px)` }} />
        <motion.div aria-hidden="true" style={{ position: "absolute", left: 17, top: 20, width: 2, height: spine, maxHeight: "calc(100% - 40px)", backgroundImage: `repeating-linear-gradient(to bottom, ${t.gold} 0 6px, transparent 6px 12px)` }} />
        {items.map((it, i) => (
          <FadeUp key={i} delay={Math.min(i, 5) * 0.12} style={{ position: "relative", marginBottom: 14 }}>
            <div aria-hidden="true" style={{
              position: "absolute", left: -52, top: 10, width: 36, height: 36, borderRadius: "50%",
              background: t.ivory2, border: `2px solid ${t.gold}`, boxShadow: `0 0 0 4px ${t.ivory}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {i % 2 === 0 ? <StarIcon size={15} color={t.gold} /> : <MedalIcon size={16} color={t.gold} />}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "58px 1fr", gap: 12, alignItems: "start", background: t.ivory2, border: `1px solid ${t.line}`, borderRadius: 6, padding: "12px 14px", boxShadow: SHADOW_CARD }}>
              <div style={{ ...display, fontWeight: 600, fontSize: fs(16), color: t.primary, lineHeight: 1.5, fontVariantNumeric: "tabular-nums" }}>{it.time}</div>
              <div>
                <div style={{ ...body, fontSize: fs(16), lineHeight: 1.5, color: t.ink }}>{it.label}</div>
                {it.desc && <div style={{ ...body, fontSize: fs(14), lineHeight: 1.5, color: t.inkMuted, marginTop: 3 }}>{it.desc}</div>}
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </Section>
  );
}

// ─── Байршил ─────────────────────────────────────────────────────────────────
function T27Location({ event }: { event: EventData }) {
  const t = useT();
  const mapHref = event.venue_map_url
    ? normalizeUrl(event.venue_map_url)
    : event.venue_name ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(event.venue_name) : "";
  return (
    <Section>
      <FadeUp><Heading>Хаана болох вэ</Heading></FadeUp>
      <FadeUp delay={0.08}>
        <div style={{ background: t.ivory2, border: `1px solid ${t.gold}`, padding: 6, boxShadow: SHADOW_CARD }}>
          <div style={{ aspectRatio: "16 / 10", overflow: "hidden", background: t.line, position: "relative" }}>
            {event.maps_photo ? (
              <Photo src={event.maps_photo} alt={event.venue_name} />
            ) : (
              <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PinIcon size={44} color={t.primary} />
              </div>
            )}
          </div>
        </div>
      </FadeUp>
      <FadeUp delay={0.12} style={{ textAlign: "center", marginTop: 22 }}>
        {event.venue_name && <div style={{ ...display, fontWeight: 600, fontSize: fs(22), color: t.ink, lineHeight: 1.3 }}>{event.venue_name}</div>}
        {event.venue_address && <div style={{ ...body, fontSize: fs(17), lineHeight: 1.6, color: t.inkMuted, marginTop: 8 }}>{event.venue_address}</div>}
        {mapHref && (
          <div style={{ marginTop: 22 }}>
            <Btn variant="solid" href={mapHref} icon={<PinIcon size={20} color={t.paper} />} style={{ width: "100%" }}>Google Maps-р харах</Btn>
          </div>
        )}
      </FadeUp>
    </Section>
  );
}

// ─── Хэзээ: огноо, цаг + тоологч — байршлын дээр (sections.timer: false → нуугдана)
function T27When({ event }: { event: EventData }) {
  const t = useT();
  const [c, setC] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const target = new Date(`${event.date}T${event.time || "17:00"}:00`);
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setC({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setC({
        d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [event.date, event.time]);
  const pad = (n: number) => String(n).padStart(2, "0");
  const units = [{ v: c.d, l: "Өдөр" }, { v: c.h, l: "Цаг" }, { v: c.m, l: "Минут" }, { v: c.s, l: "Секунд" }];
  return (
    <Section>
      <FadeUp><Heading>Хэзээ</Heading></FadeUp>
      <FadeUp>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ ...display, fontWeight: 600, fontSize: fs(26), lineHeight: 1.25, color: t.primary }}>{fmtDate(event.date)}</div>
          {event.time && <div style={{ ...body, fontSize: fs(18), color: t.ink, marginTop: 6 }}>{event.time} цагт</div>}
        </div>
        <div style={{ ...bodyB, fontSize: fs(13), color: t.inkMuted, textAlign: "center", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Баяр эхлэхэд</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {units.map((u) => (
            <div key={u.l} style={{ background: t.ivory2, border: `1px solid ${t.gold}`, borderRadius: 6, padding: "14px 4px 10px", textAlign: "center" }}>
              <div style={{ ...display, fontWeight: 700, fontSize: fs(30), lineHeight: 1, color: t.primary, fontVariantNumeric: "tabular-nums" }}>{pad(u.v)}</div>
              <div style={{ ...bodyB, fontSize: fs(12), textTransform: "uppercase", color: t.inkMuted, marginTop: 8, letterSpacing: "0.06em" }}>{u.l}</div>
            </div>
          ))}
        </div>
      </FadeUp>
    </Section>
  );
}

// ─── Мэндчилгээ ──────────────────────────────────────────────────────────────
function T27Wishes({ event }: { event: EventData }) {
  const t = useT();
  const eventId = event.id;
  // Ирсэн мэндчилгээний жагсаалт одоогоор нуугдсан — wishes.showList: true → гарна
  const showList = cfg(event.config, "wishes.showList", false) === true;
  const [name, setName]       = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [wishes, setWishes]   = useState<Wish[]>(eventId === "demo" ? DEMO_WISHES : []);

  useEffect(() => {
    if (eventId === "demo") return;
    supabase.from("wishes").select("name, message").eq("event_id", eventId)
      .order("created_at", { ascending: false }).limit(12)
      .then(({ data }) => { if (data) setWishes(data as Wish[]); });
  }, [eventId]);

  const submit = async () => {
    if (!name.trim() || !message.trim()) return;
    const wish = { name: name.trim(), message: message.trim() };
    setSending(true);
    if (eventId !== "demo") {
      const { error } = await supabase.from("wishes").insert({ event_id: eventId, ...wish });
      if (error) { setSending(false); toast.error("Алдаа гарлаа. Дахин оролдоно уу."); return; }
    }
    setWishes((w) => [wish, ...w]);
    setName(""); setMessage("");
    setSending(false);
    toast.success("Мэндчилгээг хүлээн авлаа. Баярлалаа!");
  };

  return (
    <Section>
      <FadeUp><Heading>Мэндчилгээ</Heading></FadeUp>
      <FadeUp>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field id="t27-wish-name" label="Таны нэр" value={name} onChange={setName} placeholder="Нэр" />
          <Field id="t27-wish-msg" label="Мэндчилгээний үг" textarea value={message} onChange={setMessage} placeholder="Баяр хүргэх үгээ бичнэ үү" />
          <Btn variant="solid" onClick={submit} disabled={sending || !name.trim() || !message.trim()}
            icon={<SendIcon size={20} color={t.paper} />} style={{ width: "100%" }}>
            {sending ? "Илгээж байна…" : "Илгээх"}
          </Btn>
        </div>
      </FadeUp>
      {showList && wishes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 32 }}>
          {wishes.map((w, i) => (
            <FadeUp key={i} delay={Math.min(i, 4) * 0.06}>
              <div style={{ background: t.ivory2, border: `1px solid ${t.line}`, borderRadius: 6, padding: "16px 18px", position: "relative" }}>
                <div aria-hidden="true" style={{ position: "absolute", left: 0, top: 12, bottom: 12, width: 3, background: t.gold }} />
                <p style={{ ...body, fontSize: fs(17), lineHeight: 1.6, color: t.ink, margin: 0 }}>{w.message}</p>
                <div style={{ ...display, fontWeight: 600, fontSize: fs(15), color: t.goldDeep, marginTop: 10 }}>— {w.name}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Ирц ─────────────────────────────────────────────────────────────────────
function T27RSVP({ event }: { event: EventData }) {
  const t = useT();
  const maxGuests = cfg(event.config, "rsvp.maxGuests", 10);
  const note      = cfg(event.config, "rsvp.note", "Ирцээ урьдчилан мэдэгдэнэ үү");
  const [name, setName]     = useState("");
  const [phone, setPhone]   = useState("");
  const [guests, setGuests] = useState(1);
  const [sending, setSending] = useState(false);
  const [done, setDone]     = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setSending(true);
    if (event.id !== "demo") {
      const { error } = await supabase.from("rsvp").insert({
        event_id: event.id, name: name.trim(), phone: phone.trim(), guests, message: "",
      });
      if (error) { setSending(false); toast.error("Алдаа гарлаа. Дахин оролдоно уу."); return; }
    }
    setSending(false);
    setDone(true);
  };

  const stepBtn = (dir: -1 | 1) => {
    const disabled = dir < 0 ? guests <= 1 : guests >= maxGuests;
    return (
      <button type="button" aria-label={dir < 0 ? "Хасах" : "Нэмэх"} disabled={disabled}
        onClick={() => setGuests((g) => Math.max(1, Math.min(maxGuests, g + dir)))}
        style={{
          width: 44, height: 44, borderRadius: "50%", border: "none", cursor: disabled ? "not-allowed" : "pointer",
          background: disabled ? t.line : t.primary, color: disabled ? t.inkMuted : t.paper,
          ...display, fontWeight: 600, fontSize: 26, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
        {dir < 0 ? "−" : "+"}
      </button>
    );
  };

  return (
    <Section id="t27-rsvp">
      <FadeUp><Heading>Ирцээ мэдэгдэх</Heading></FadeUp>
      <FadeUp>
        <div style={{ background: t.ivory2, border: `1px solid ${t.line}`, borderRadius: 6, padding: 22, boxShadow: SHADOW_CARD, display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>
          <Corners />
          <Field id="t27-rsvp-name" label="Таны нэр" value={name} onChange={setName} placeholder="Нэр" />
          <Field id="t27-rsvp-phone" label="Утасны дугаар" type="tel" inputMode="numeric" value={phone} onChange={setPhone} placeholder="9900 1122" />
          <div>
            <div style={{ ...bodyB, fontSize: fs(15), lineHeight: 1.4, color: t.ink, marginBottom: 8 }}>Ирэх хүний тоо</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, minHeight: 54 }}>
              {stepBtn(-1)}
              <div aria-live="polite" style={{ ...display, fontWeight: 700, fontSize: fs(26), color: t.ink, minWidth: 40, textAlign: "center" }}>{guests}</div>
              {stepBtn(1)}
            </div>
          </div>
          {done ? (
            <div role="status" style={{
              ...display, fontWeight: 600, fontSize: fs(18), color: t.primary, textAlign: "center",
              minHeight: 54, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              border: `1.5px solid ${t.gold}`, borderRadius: 10,
            }}>
              <CheckIcon size={20} color={t.gold} /> Баярлалаа! Бүртгэгдлээ.
            </div>
          ) : (
            <Btn variant="solid" onClick={submit} disabled={sending || !name.trim()} style={{ width: "100%" }}>
              {sending ? "Илгээж байна…" : "Бүртгүүлэх"}
            </Btn>
          )}
          <div style={{ ...body, fontSize: fs(15), lineHeight: 1.5, color: t.inkMuted, textAlign: "center" }}>{note}</div>
        </div>
      </FadeUp>
    </Section>
  );
}

// ─── Footer (бараан band) ────────────────────────────────────────────────────
function T27Footer({ event }: { event: EventData }) {
  const t = useT();
  const title  = cfg(event.config, "footer.title", "Та бүхнийг хүлээн авахдаа таатай байх болно");
  const lines  = cfg<string[]>(event.config, "footer.lines", []);
  const phones = cfg<string[]>(event.config, "footer.phones", []).filter(Boolean);
  const img    = cfg<string | null>(event.config, "footer.image", null);
  return (
    <footer style={{ background: `linear-gradient(180deg, ${t.dark} 0%, ${t.dark2} 100%)`, color: t.paper, position: "relative" }}>
      <CloudBand />
      {img && (
        <div style={{ position: "relative", height: 300 }}>
          <Photo src={img} alt="" />
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${t.dark}26, ${t.dark})` }} />
        </div>
      )}
      <div style={{ padding: img ? "0 16px 96px" : "36px 16px 96px", marginTop: img ? -60 : 0, position: "relative", textAlign: "center" }}>
        <FadeUp>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><StarIcon size={22} color={t.gold} /></div>
          <div style={{ ...display, fontWeight: 600, fontSize: fs(25), lineHeight: 1.3, color: t.goldLight, maxWidth: 360, margin: "0 auto" }}>
            {title}
          </div>
          {lines.map((l) => (
            <div key={l} style={{ ...body, fontSize: fs(17), lineHeight: 1.6, color: t.paper, marginTop: 16 }}>{l}</div>
          ))}
          {phones.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 22 }}>
              {phones.map((p) => <PhonePill key={p} phone={p} onDark />)}
            </div>
          )}
        </FadeUp>
      </div>
    </footer>
  );
}

// ─── Тогтмол товчнууд: "Том үсэг" (зүүн), хөгжим (баруун) ────────────────────
const fabStyle = (t: Theme): React.CSSProperties => ({
  position: "fixed", bottom: "calc(16px + env(safe-area-inset-bottom, 0px))", zIndex: 1000,
  width: 56, height: 56, borderRadius: "50%", cursor: "pointer",
  background: t.ivory2, border: `2px solid ${t.gold}`, boxShadow: "0 6px 18px rgba(40,25,10,.25)",
  display: "flex", alignItems: "center", justifyContent: "center",
});

function TextSizeToggle({ big, onToggle }: { big: boolean; onToggle: () => void }) {
  const t = useT();
  return (
    <button type="button" onClick={onToggle} aria-pressed={big} aria-label={big ? "Энгийн үсэг" : "Том үсэг"}
      style={{ ...fabStyle(t), left: 16 }}>
      <span style={{ ...display, fontWeight: 700, color: t.primary, display: "flex", alignItems: "baseline", gap: 1 }}>
        <span style={{ fontSize: 16 }}>A</span><span style={{ fontSize: big ? 20 : 24 }}>{big ? "−" : "+"}</span>
      </span>
    </button>
  );
}

function MusicToggle({ audioRef }: { audioRef: React.RefObject<HTMLAudioElement | null> }) {
  const t = useT();
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const on = () => setPlaying(true), off = () => setPlaying(false);
    a.addEventListener("play", on); a.addEventListener("pause", off);
    return () => { a.removeEventListener("play", on); a.removeEventListener("pause", off); };
  }, [audioRef]);
  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={playing} aria-label={playing ? "Хөгжим унтраах" : "Хөгжим асаах"}
      style={{ ...fabStyle(t), right: 16 }}>
      <div className={playing ? "t27-pulse" : undefined}>
        {playing ? <NoteIcon size={24} color={t.primary} /> : <NoteOffIcon size={24} color={t.primary} />}
      </div>
    </button>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
export function AwardCeremony({ event, theme }: { event: EventData; theme: Theme["key"] }) {
  const themeKey = cfg<Theme["key"]>(event.config, "theme", theme);
  const t = THEMES[themeKey] ?? THEMES[theme];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // config.intro.video: URL → тэр видео; false → intro-гүй (шууд hero); байхгүй → T13-ын дугтуй нээх видео
  const introCfg = cfg<string | false | undefined>(event.config, "intro.video", undefined);
  const introVideo = introCfg === undefined ? T27_INTRO_VIDEO : introCfg;
  const hasVideo = typeof introVideo === "string" && introVideo.length > 0;
  const [started, setStarted] = useState(!hasVideo);
  // config.ui.bigText: true бол эхнээсээ том үсгээр
  const [big, setBig] = useState<boolean>(cfg(event.config, "ui.bigText", false) === true);

  const start = () => { setStarted(true); audioRef.current?.play().catch(() => {}); };

  // Дуу: autoplay хориг тул hero гармагц хэрэглэгчийн анхны хөдөлгөөн дээр асна
  useEffect(() => {
    const a = audioRef.current;
    if (!started || !event.music_url || !a || !a.paused) return;
    const evs = ["pointerdown", "touchstart", "keydown", "scroll"] as const;
    const tryPlay = () => { a.play().then(stop).catch(() => {}); };
    const stop = () => evs.forEach((e) => window.removeEventListener(e, tryPlay));
    tryPlay();
    evs.forEach((e) => window.addEventListener(e, tryPlay, { passive: true }));
    return stop;
  }, [started, event.music_url]);

  return (
    <ThemeCtx.Provider value={t}>
      <div className="t27" lang="mn" style={{
        ["--k" as string]: big ? "1.15" : "1",
        maxWidth: 523, margin: "0 auto", ...body, overflowX: "clip", background: t.ivory, color: t.ink,
      }}>
        <Styles />
        {hasVideo && <VideoIntro src={introVideo as string} onDone={start} />}

        <T27Hero event={event} started={started} />
        <T27Letter event={event} />
        {sectionOn(event.config, "career") && <T27Career event={event} />}
        {sectionOn(event.config, "gallery") && <T27Gallery event={event} />}
        {sectionOn(event.config, "schedule") && <T27Schedule event={event} />}
        {sectionOn(event.config, "timer") && <T27When event={event} />}
        <T27Location event={event} />
        {sectionOn(event.config, "wishes") && <T27Wishes event={event} />}
        {sectionOn(event.config, "rsvp") && <T27RSVP event={event} />}
        <T27Footer event={event} />

        <TextSizeToggle big={big} onToggle={() => setBig((b) => !b)} />
        <audio ref={audioRef} loop src={event.music_url ?? ""} preload="auto" />
        {event.music_url && <MusicToggle audioRef={audioRef} />}
        <Toaster />
      </div>
    </ThemeCtx.Provider>
  );
}

// Template 27 — Бордо-алт (wine) theme
export default function Template27({ event }: { event: EventData }) {
  return <AwardCeremony event={event} theme="wine" />;
}
