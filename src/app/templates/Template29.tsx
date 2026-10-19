import { createContext, useContext, useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { EventData } from "../../types/event";
import { getPoemLines, getSchedule } from "../../lib/eventContent";
import { cfg, sectionOn } from "../../lib/eventConfig";
import { normalizeUrl } from "../../lib/url";

// ─── Template 29 / 30 — нярай хүүхдийн усны найрын урилга ────────────────────
// Нэг бүтэц, хоёр theme (зөөлөн пастель, цайвар дэвсгэр — залуу эцэг эхээс эмээ
// өвөө хүртэл холимог насанд уншихад амар):
//   "sky"   (template 29) — хүү: тэнгэрийн цэнхэр, гаа ногоон, зөөлөн шар од
//   "blush" (template 30) — охин: ягаан, тоор, зөөлөн алт
// Мотив: ор дээрх дүүжин тоглоом (од, сар, үүл, зүрх — найгана), дээш хөвөх хөөс
// (ус), долгион хэлбэрийн хэсгийн зааг, үүл хэлбэрийн хүрээтэй зураг.
// Усны найрт л байдаг: хүүхдийн нэр, төрсөн огноо/жин/өндөр, "Аав · Ээж",
// ерөөл, сонголтоор бэлгийн данс (хуулах товчтой).
//
// Section: intro (дарж нээх) → hero → урилгын үг → цомог → тоологч → хөтөлбөр →
// байршил → [бэлэг] → ерөөл → ирц → footer. Түлхүүрүүд: docs/event-config.md § T29.

// ─── Theme ───────────────────────────────────────────────────────────────────
type Theme = {
  key: "sky" | "blush";
  bg: string; soft: string; card: string;        // хуудас / зөөлөн хэсэг / карт
  ink: string; inkMuted: string; line: string;
  accent: string; accentLight: string; accentDeep: string; onAccent: string; accentGlow: string;
  second: string; secondDeep: string;            // 2-р пастель (гаа / тоор)
  star: string;                                  // од, сар
  badge: string; tagline: string; babyDemo: string;
  captions: string[];
};
type Tone = "bg" | "soft";

const ThemeCtx = createContext<Theme | null>(null);
const useT = () => useContext(ThemeCtx)!;

// Cormorant Garamond italic — нэр, гарчиг (зөөлөн); Caveat — гар бичмэл тайлбар;
// PT Sans — бичвэр. Бүгд cyrillic-ext (ө/ү), index.html-д ачаалагдсан.
const display = { fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" } as const;
const hand    = { fontFamily: "'Caveat', 'PT Sans', cursive" } as const;
const body    = { fontFamily: "'PT Sans', 'Segoe UI', sans-serif" } as const;
const bodyB   = { fontFamily: "'PT Sans', 'Segoe UI', sans-serif", fontWeight: 700 } as const;

const SHADOW_CARD = "0 10px 28px rgba(60,80,110,.10)";

const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800",
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800",
  "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800",
  "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800",
];

const THEMES: Record<Theme["key"], Theme> = {
  sky: {
    key: "sky",
    bg: "#F4F9FD", soft: "#E6F2FB", card: "#FFFFFF",
    ink: "#22344A", inkMuted: "#6B7D93", line: "#D5E4F0",
    accent: "#7FB7E6", accentLight: "#C9E3F7", accentDeep: "#3F86C2", onAccent: "#FFFFFF", accentGlow: "rgba(127,183,230,.35)",
    second: "#BFE8D8", secondDeep: "#5FBFA0",
    star: "#FFD66B",
    badge: "Хүү!", tagline: "Бяцхан хүү маань мэндэллээ", babyDemo: "Тэмүүлэн",
    captions: ["Анхны инээмсэглэл", "Нойрсож буй нь", "Анхны өдрүүд", "Бяцхан хуруу", "Аавтайгаа", "Ээжтэйгээ", "Дурсамж", "Хамтдаа"],
  },
  blush: {
    key: "blush",
    bg: "#FDF6F7", soft: "#FBE9EC", card: "#FFFFFF",
    ink: "#4A2E36", inkMuted: "#8E6F78", line: "#F0D7DC",
    accent: "#F3A6B8", accentLight: "#FAD3DB", accentDeep: "#D9667F", onAccent: "#FFFFFF", accentGlow: "rgba(243,166,184,.35)",
    second: "#FFD9C2", secondDeep: "#F0A070",
    star: "#F2D28C",
    badge: "Охин!", tagline: "Бяцхан охин маань мэндэллээ", babyDemo: "Номин",
    captions: ["Анхны инээмсэглэл", "Нойрсож буй нь", "Анхны өдрүүд", "Бяцхан хуруу", "Аавтайгаа", "Ээжтэйгээ", "Дурсамж", "Хамтдаа"],
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
const MoonIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M20 14.5A8 8 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />, true);
const CloudIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 9.1 4.5 4.5 0 0 0 7 18Z" />, true);
const HeartIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M12 21s-7-4.6-9.3-9A5.3 5.3 0 0 1 12 6.2 5.3 5.3 0 0 1 21.3 12C19 16.4 12 21 12 21Z" />, true);
const FootIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><ellipse cx="12.5" cy="15.5" rx="4.5" ry="6" /><circle cx="6.5" cy="8" r="1.7" /><circle cx="9.6" cy="5.8" r="1.6" /><circle cx="13.2" cy="5.2" r="1.5" /><circle cx="16.6" cy="6.2" r="1.4" /><circle cx="19.2" cy="8.4" r="1.2" /></>, true);
const PlayIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M7 4 L20 12 L7 20 Z" />, true);
const CalendarIcon: IconFn = ({ size = 24, color = "currentColor" }) => ico(size, color, <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>);
const ScaleIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <><circle cx="12" cy="6" r="3" /><path d="M4 21h16l-1.5-11h-13Z" /></>);
const RulerIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <><rect x="3" y="8" width="18" height="8" rx="1.5" /><path d="M7 8v3M11 8v4M15 8v3M19 8v4" /></>);
const GiftIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><rect x="3" y="9" width="18" height="12" rx="2" /><path d="M3 13h18M12 9v12" /><path d="M12 9c-2-4-7-4-7-1s5 1 7 1Zm0 0c2-4 7-4 7-1s-5 1-7 1Z" /></>);
const CopyIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>);
const PinIcon: IconFn      = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></>);
const SendIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M21 3 10 14" /><path d="M21 3 14 21l-4-7-7-4Z" /></>);
const PhoneIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />);
const CameraIcon: IconFn   = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M4 8h3l2-3h6l2 3h3v12H4Z" /><circle cx="12" cy="13" r="3.5" /></>);
const NoteIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>);
const NoteOffIcon: IconFn  = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /><path d="M3 3l18 18" /></>);
const ChevronsIcon: IconFn = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M6 6l6 6 6-6" /><path d="M6 12l6 6 6-6" /></>);

// ─── global styles ───────────────────────────────────────────────────────────
function Styles() {
  const t = useT();
  return (
    <style>{`
      @keyframes t29Sway  { 0%,100% { transform: rotate(-2.5deg); } 50% { transform: rotate(2.5deg); } }
      @keyframes t29Rise {
        0%   { opacity: 0; transform: translate(0, 104vh); }
        10%  { opacity: .6; }
        90%  { opacity: .5; }
        100% { opacity: 0; transform: translate(18px, -8vh); }
      }
      @keyframes t29Pulse  { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
      @keyframes t29Bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
      @keyframes t29Twinkle { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
      .t29 .t29-sway    { transform-origin: 50% 0; animation: t29Sway 5s ease-in-out infinite; }
      .t29 .t29-bubble  { animation: t29Rise var(--dur) var(--delay) linear infinite; }
      .t29 .t29-pulse   { animation: t29Pulse 1.6s ease-in-out infinite; }
      .t29 .t29-bounce  { animation: t29Bounce 2.4s ease-in-out infinite; }
      .t29 .t29-twinkle { animation: t29Twinkle 2.8s ease-in-out infinite; }
      .t29 :focus-visible { outline: 2px solid ${t.accentDeep}; outline-offset: 3px; }
      .t29 input::placeholder, .t29 textarea::placeholder { color: ${t.inkMuted}; opacity: .7; }
      .t29 input:focus, .t29 textarea:focus { border-color: ${t.accentDeep} !important; box-shadow: 0 0 0 3px ${t.accentGlow}; }
      .t29 .t29-carousel { scrollbar-width: none; }
      .t29 .t29-carousel::-webkit-scrollbar { display: none; }
      .t29 .t29-btn:active:not(:disabled) { transform: translateY(2px); }
      @media (prefers-reduced-motion: reduce) {
        .t29 .t29-sway, .t29 .t29-bubble, .t29 .t29-pulse, .t29 .t29-bounce, .t29 .t29-twinkle { animation: none !important; }
        .t29 .t29-bubbles { display: none; }
      }
    `}</style>
  );
}

// ─── Мотивууд ────────────────────────────────────────────────────────────────
// Ор дээрх дүүжин тоглоом: нуман саваанаас од, үүл, сар, зүрх дүүжлэгдэж зөөлөн найгана
function Mobile({ width = 220 }: { width?: number }) {
  const t = useT();
  const yOnBar = (x: number) => { const u = (x - 28) / 144; return (1 - u) * (1 - u) * 14 + 2 * (1 - u) * u * -4 + u * u * 14; };
  const items: { x: number; len: number; Icon: IconFn; color: string }[] = [
    { x: 40,  len: 46, Icon: StarIcon,  color: t.star },
    { x: 70,  len: 76, Icon: CloudIcon, color: t.accent },
    { x: 100, len: 96, Icon: MoonIcon,  color: t.star },
    { x: 130, len: 76, Icon: HeartIcon, color: t.accentDeep },
    { x: 160, len: 46, Icon: StarIcon,  color: t.secondDeep },
  ];
  return (
    <svg className="t29-sway" aria-hidden="true" width={width} height={width * 0.6} viewBox="0 0 200 120" style={{ display: "block", overflow: "visible" }}>
      <path d="M100 -6 V4" stroke={t.accentDeep} strokeWidth="2" strokeLinecap="round" />
      <path d="M28 14 Q100 -4 172 14" stroke={t.accentDeep} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {items.map(({ x, len, Icon, color }, i) => (
        <g key={i}>
          <line x1={x} y1={yOnBar(x).toFixed(1)} x2={x} y2={len} stroke={t.accentDeep} strokeWidth="1.2" opacity="0.65" />
          <g className={i % 2 === 0 ? "t29-twinkle" : undefined} transform={`translate(${x - 9} ${len + 1})`}>
            <Icon size={18} color={color} />
          </g>
        </g>
      ))}
    </svg>
  );
}

// Үүл хэлбэрийн (долгиолсон ирмэгтэй) дугуй хүрээтэй зураг
function CloudPortrait({ photo, size = 250 }: { photo?: string | null; size?: number }) {
  const t = useT();
  const bumps = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    return [60 + 52 * Math.cos(a), 60 + 52 * Math.sin(a)] as [number, number];
  });
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden={!photo}
      style={{ display: "block", overflow: "visible", filter: `drop-shadow(0 12px 28px ${t.accentGlow})` }}>
      <defs><clipPath id="t29round"><circle cx="60" cy="60" r="47" /></clipPath></defs>
      {bumps.map(([x, y], i) => <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="9" fill={i % 2 ? t.accentLight : t.second} />)}
      <circle cx="60" cy="60" r="52" fill={t.card} />
      <circle cx="60" cy="60" r="47" fill={t.soft} />
      {photo ? (
        <image href={photo} x="13" y="13" width="94" height="94" preserveAspectRatio="xMidYMid slice" clipPath="url(#t29round)" />
      ) : (
        <text x="60" y="63" textAnchor="middle" fontFamily="'PT Sans', sans-serif" fontWeight="700" fontSize="8" letterSpacing="1.5" fill={t.inkMuted}>ЗУРАГ</text>
      )}
      <circle cx="60" cy="60" r="47" fill="none" stroke={t.accent} strokeWidth="2" />
    </svg>
  );
}

// Долгиолсон ирмэгтэй дугуй наалт ("Хүү!" / "Охин!")
function Sticker({ text, size = 78, style = {} }: { text: string; size?: number; style?: React.CSSProperties }) {
  const t = useT();
  const pts: string[] = [];
  for (let i = 0; i < 24; i++) {
    const r = i % 2 === 0 ? 48 : 43, a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
  }
  return (
    <div aria-hidden="true" style={{ position: "absolute", width: size, height: size, pointerEvents: "none", filter: `drop-shadow(0 4px 10px ${t.accentGlow})`, ...style }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
        <polygon points={pts.join(" ")} fill={t.accentDeep} stroke={t.card} strokeWidth="2.5" strokeLinejoin="round" />
        <text x="50" y="52" textAnchor="middle" dominantBaseline="central" fontFamily="'Caveat', cursive" fontWeight="700" fontSize="30" fill={t.onAccent} transform="rotate(-8 50 50)">
          {text}
        </text>
      </svg>
    </div>
  );
}

// Хэсгүүдийн хоорондох долгион — дараагийн хэсгийн өнгөөр, өмнөхийн дээр
function Wave({ fill }: { fill: string }) {
  return (
    <svg aria-hidden="true" width="100%" height="22" viewBox="0 0 100 22" preserveAspectRatio="none" style={{ display: "block" }}>
      <path d="M0 12 C 20 0, 30 24, 50 12 S 80 0, 100 12 V22 H0 Z" fill={fill} />
    </svg>
  );
}

// Дээш хөвөх хөөс (ус) — fixed overlay
const BUBBLES = Array.from({ length: 16 }, (_, i) => ({
  id: i, left: (i * 43 + 7) % 100, size: 8 + (i % 5) * 3, dur: 16 + (i % 6) * 2, delay: -((i * 2.7) % 19),
}));
function Bubbles() {
  const t = useT();
  return (
    <div className="t29-bubbles" aria-hidden="true" style={{
      position: "fixed", top: 0, bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "min(523px, 100%)", pointerEvents: "none", overflow: "hidden", zIndex: 6,
    }}>
      {BUBBLES.map((b) => (
        <div key={b.id} className="t29-bubble" style={{
          position: "absolute", left: b.left + "%", top: 0, width: b.size, height: b.size, borderRadius: "50%",
          border: `1px solid ${t.accent}`,
          background: `radial-gradient(circle at 32% 30%, rgba(255,255,255,.95), ${t.accentLight} 55%, transparent 72%)`,
          ["--dur" as string]: b.dur + "s", ["--delay" as string]: b.delay + "s",
        }} />
      ))}
    </div>
  );
}

function Divider() {
  const t = useT();
  return (
    <div aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "0 auto", maxWidth: 240 }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${t.accent})` }} />
      <HeartIcon size={14} color={t.accentDeep} />
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${t.accent})` }} />
    </div>
  );
}

// ─── Жижиг UI хэсгүүд ────────────────────────────────────────────────────────
function Heading({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <div style={{ textAlign: "center", marginBottom: 26 }}>
      <h2 style={{ ...display, fontWeight: 600, fontStyle: "italic", fontSize: 36, lineHeight: 1.15, color: t.accentDeep, margin: 0 }}>
        {children}
      </h2>
      <div style={{ marginTop: 10 }}><Divider /></div>
    </div>
  );
}

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

type BtnProps = {
  variant: "primary" | "soft" | "outline";
  icon?: React.ReactNode; children: React.ReactNode;
  onClick?: () => void; href?: string; disabled?: boolean; style?: React.CSSProperties;
};
function Btn({ variant, icon, children, onClick, href, disabled, style = {} }: BtnProps) {
  const t = useT();
  const base: React.CSSProperties = {
    ...bodyB, fontSize: 17,
    minHeight: 52, borderRadius: 999, border: "none", padding: "0 24px",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
    cursor: disabled ? "not-allowed" : "pointer", textDecoration: "none",
    opacity: disabled ? 0.55 : 1, transition: "transform .08s, opacity .2s", boxSizing: "border-box",
    ...(variant === "primary" ? { background: t.accentDeep, color: t.onAccent, boxShadow: `0 8px 20px ${t.accentGlow}` } :
        variant === "soft"    ? { background: t.accentLight, color: t.accentDeep } :
                                { background: "transparent", color: t.accentDeep, boxShadow: `inset 0 0 0 1.5px ${t.accentDeep}` }),
    ...style,
  };
  const cls = `t29-btn t29-btn-${variant}`;
  if (href) return <a className={cls} href={href} target="_blank" rel="noreferrer" style={base}>{icon}{children}</a>;
  return <button type="button" className={cls} onClick={onClick} disabled={disabled} style={base}>{icon}{children}</button>;
}

function Field({ id, label, textarea, ...rest }: {
  id: string; label: string; textarea?: boolean;
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; inputMode?: "numeric" | "text";
}) {
  const t = useT();
  const input: React.CSSProperties = {
    width: "100%", minHeight: 52, padding: "14px 16px", boxSizing: "border-box",
    background: t.card, border: `1.5px solid ${t.line}`, borderRadius: 14,
    ...body, fontSize: 16, color: t.ink, outline: "none", transition: "border-color .2s, box-shadow .2s",
  };
  return (
    <div>
      <label htmlFor={id} style={{ ...bodyB, fontSize: 14, lineHeight: "20px", color: t.ink, display: "block", marginBottom: 8 }}>
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
      width: "100%", height: "100%", background: t.soft,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, ...style,
    }}>
      <CameraIcon size={28} color={t.inkMuted} />
      <span style={{ ...bodyB, fontSize: 13, letterSpacing: "0.18em", color: t.inkMuted }}>ЗУРАГ</span>
    </div>
  );
}

// Ерөнхий баавгайн силуэт — demo дээр "энд зураг орно" PLACEHOLDER. Ямар ч тодорхой
// дүр биш. Жинхэнэ урилгад захиалагч hero.mascot / intro.mascot-д өөрийн зургаа оруулна.
function TeddySilhouette({ fill, accent }: { fill: string; accent: string }) {
  return (
    <svg width="100%" viewBox="0 0 120 142" aria-hidden="true" style={{ display: "block", overflow: "visible" }}>
      <circle cx="38" cy="36" r="13" fill={fill} /><circle cx="82" cy="36" r="13" fill={fill} />
      <circle cx="38" cy="36" r="6" fill={accent} /><circle cx="82" cy="36" r="6" fill={accent} />
      <circle cx="60" cy="50" r="30" fill={fill} />
      <ellipse cx="60" cy="61" rx="11" ry="8" fill={accent} />
      <circle cx="60" cy="58" r="3.5" fill={fill} />
      <circle cx="49" cy="46" r="3" fill={accent} /><circle cx="71" cy="46" r="3" fill={accent} />
      <ellipse cx="60" cy="104" rx="32" ry="30" fill={fill} />
      <ellipse cx="60" cy="108" rx="18" ry="18" fill={accent} opacity="0.7" />
      <ellipse cx="26" cy="96" rx="11" ry="9" transform="rotate(-25 26 96)" fill={fill} />
      <ellipse cx="94" cy="96" rx="11" ry="9" transform="rotate(25 94 96)" fill={fill} />
      <ellipse cx="40" cy="131" rx="12" ry="9" fill={fill} /><ellipse cx="80" cy="131" rx="12" ry="9" fill={fill} />
    </svg>
  );
}

// hero.mascot / intro.mascot (URL) → захиалагчийн зураг; demo-д placeholder; бусдад юу ч үгүй
function Mascot({ src, demo, side = "left", width = "clamp(104px, 29vw, 146px)", bottom = 0, style = {} }: {
  src?: string | null; demo: boolean; side?: "left" | "right";
  width?: string; bottom?: number; style?: React.CSSProperties;
}) {
  const t = useT();
  if (!src && !demo) return null;
  const wrap: React.CSSProperties = {
    position: "absolute", bottom, width, pointerEvents: "none", zIndex: 1,
    ...(side === "left" ? { left: 0 } : { right: 0 }), ...style,
  };
  return (
    <div aria-hidden="true" style={wrap}>
      {src ? (
        <img src={src} alt="" style={{ width: "100%", height: "auto", display: "block", filter: "drop-shadow(0 8px 18px rgba(60,80,110,.25))" }} />
      ) : (
        <div style={{ transform: side === "right" ? "scaleX(-1)" : "none", filter: `drop-shadow(0 8px 18px ${t.accentGlow})`, opacity: 0.9 }}>
          <TeddySilhouette fill={t.accent} accent={t.accentLight} />
        </div>
      )}
    </div>
  );
}

// Section: өмнөх хэсгийн өнгөн дээр долгион → өөрийн өнгөтэй агуулга
function Section({ tone, prev, children, id, style = {} }: {
  tone: Tone; prev: Tone; children: React.ReactNode; id?: string; style?: React.CSSProperties;
}) {
  const t = useT();
  const c = (x: Tone) => (x === "soft" ? t.soft : t.bg);
  return (
    <section id={id} style={{ background: c(prev), position: "relative" }}>
      <Wave fill={c(tone)} />
      <div style={{ background: c(tone), padding: "36px 16px 72px", position: "relative", overflow: "hidden", ...style }}>
        {children}
      </div>
    </section>
  );
}
type SecProps = { event: EventData; tone: Tone; prev: Tone };

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
function calendarUrl(event: EventData, title: string) {
  const [y, m, d] = (event.date || "").split("-").map(Number);
  const [hh, mm] = (event.time || "15:00").split(":").map(Number);
  if (!y || !m || !d) return "";
  const start = new Date(y, m - 1, d, hh, mm);
  const end   = new Date(start.getTime() + 3 * 3600000);
  const f = (x: Date) =>
    `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, "0")}${String(x.getDate()).padStart(2, "0")}T` +
    `${String(x.getHours()).padStart(2, "0")}${String(x.getMinutes()).padStart(2, "0")}00`;
  const q = new URLSearchParams({
    action: "TEMPLATE", text: title, dates: `${f(start)}/${f(end)}`,
    location: [event.venue_name, event.venue_address].filter(Boolean).join(", "),
    ctz: "Asia/Ulaanbaatar",
  });
  return "https://calendar.google.com/calendar/render?" + q.toString();
}
// Хүүхдийн нэр: config.baby.name → events.title (demo-д theme-ийн жишээ нэр)
const babyName = (event: EventData, t: Theme) =>
  cfg(event.config, "baby.name", event.id === "demo" ? t.babyDemo : (event.title || "Бяцхан үр"));
// Бэлгийн данс: өгсөн үед л "Бэлэг" хэсэг гарна (demo-д жишээ дугаар)
const giftAccount = (event: EventData) =>
  cfg<string | null>(event.config, "gift.account", event.id === "demo" ? "5012 3456 7890" : null);

// ─── Demo агуулга ────────────────────────────────────────────────────────────
type Wish = { name: string; message: string };
const DEMO_WISHES: Wish[] = [
  { name: "Эмээ, өвөө",   message: "Хайрт ач маань урт наслаж, эрүүл энх, аз жаргалтай өсөж торнох болтугай!" },
  { name: "Сараа эгч",    message: "Бяцхан үрийнхээ усны найрыг тэмдэглэж буйд баяр хүргэе. Өлзийтэй сайхан хүүхэд болоорой." },
  { name: "Найзууд",      message: "Ааваасаа ухаантай, ээжээсээ сайхан хүү болж өсөөрэй!" },
];
const T29_DEFAULT_POEM = [
  "Бяцхан үрийнхээ усны найрыг",
  "хамаатан садан, найз нөхдийнхөө хамт",
  "тэмдэглэхээр бэлтгэж байна.",
  "Та бүхнийг хүрэлцэн ирэхийг урьж байна!",
];

// ─── Intro: дарж нээх ────────────────────────────────────────────────────────
function TapIntro({ onOpen, mascot, mascotSide = "left", demo = false }: {
  onOpen: () => void; mascot?: string | null; mascotSide?: "left" | "right"; demo?: boolean;
}) {
  const t = useT();
  const [exiting, setExiting] = useState(false);
  const open = () => { if (exiting) return; setExiting(true); onOpen(); };
  return (
    <motion.div
      initial={{ opacity: 1 }} animate={{ opacity: exiting ? 0 : 1 }} transition={{ duration: 0.9, ease: "easeOut" }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999, background: `linear-gradient(180deg, ${t.soft}, ${t.bg})`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        pointerEvents: exiting ? "none" : "auto", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, left: "50%", transform: "translateX(-50%)", width: "min(523px, 100%)" }}>
        <Mascot src={mascot} demo={demo} side={mascotSide} />
      </div>
      <Mobile width={240} />
      <button type="button" onClick={open} aria-label="Урилгыг нээх"
        style={{
          marginTop: 28, width: 96, height: 96, borderRadius: "50%", cursor: "pointer",
          background: t.card, border: `2px solid ${t.accent}`,
          boxShadow: `0 10px 30px ${t.accentGlow}, 0 0 0 8px ${t.accentLight}`,
          display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
        }}>
        <PlayIcon size={34} color={t.accentDeep} />
      </button>
      <div style={{ ...hand, fontWeight: 600, fontSize: 26, color: t.inkMuted, marginTop: 24, textAlign: "center", padding: "0 16px" }}>
        Урилгыг нээхийн тулд дарна уу
      </div>
    </motion.div>
  );
}

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

// ─── Hero ────────────────────────────────────────────────────────────────────
function T29Hero({ event, started }: { event: EventData; started: boolean }) {
  const t = useT();
  const demo    = event.id === "demo";
  const name    = babyName(event, t);
  const eyebrow = cfg(event.config, "hero.eyebrow", "Усны найрын урилга");
  const tagline = cfg<string | false>(event.config, "hero.tagline", t.tagline);
  const badge   = cfg<string | false>(event.config, "hero.badge", t.badge);
  const photo   = cfg<string | null>(event.config, "hero.photo", null) || event.main_image || event.person1_photo;
  const born    = cfg<string | null>(event.config, "baby.born", demo ? "2026-07-12" : null);
  const weight  = cfg<string | null>(event.config, "baby.weight", demo ? "3.4 кг" : null);
  const height  = cfg<string | null>(event.config, "baby.height", demo ? "52 см" : null);
  const father  = cfg<string | null>(event.config, "parents.father", event.person1_name || null);
  const mother  = cfg<string | null>(event.config, "parents.mother", event.person2_name || null);
  const showParents = cfg(event.config, "parents.show", true) !== false && (father || mother);
  const mascot     = cfg<string | null>(event.config, "hero.mascot", null);
  const mascotSide = cfg<"left" | "right">(event.config, "hero.mascotSide", "left");

  const nameSize =
    name.length <= 8  ? "clamp(50px, 16vw, 68px)" :
    name.length <= 12 ? "clamp(40px, 12vw, 56px)" :
                        "clamp(30px, 9vw, 42px)";

  const show = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: started ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.9, delay, ease: "easeOut" as const },
  });
  const scrollNext = () => document.getElementById("t29-letter")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const chip = (Icon: IconFn, text: string) => (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: t.card, border: `1px solid ${t.line}`, borderRadius: 999, padding: "8px 14px", boxShadow: SHADOW_CARD }}>
      <Icon size={18} color={t.accentDeep} />
      <span style={{ ...bodyB, fontSize: 15, color: t.ink }}>{text}</span>
    </div>
  );

  return (
    <header style={{
      minHeight: "100svh", background: `linear-gradient(180deg, ${t.soft} 0%, ${t.bg} 100%)`, position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "20px 16px 72px", boxSizing: "border-box", textAlign: "center",
    }}>
      <motion.div {...show(0)}><Mobile width={220} /></motion.div>

      <motion.div {...show(0.15)} style={{ ...hand, fontWeight: 600, fontSize: 24, color: t.accentDeep, marginTop: 4 }}>
        {eyebrow}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={started ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        style={{ position: "relative", marginTop: 14 }}
      >
        <CloudPortrait photo={photo} size={250} />
        {badge && <Sticker text={badge} size={78} style={{ right: -10, top: 8, transform: "rotate(10deg)" }} />}
      </motion.div>

      {tagline && (
        <motion.div {...show(0.5)} style={{ ...hand, fontWeight: 500, fontSize: 26, color: t.inkMuted, marginTop: 18 }}>
          {tagline}
        </motion.div>
      )}

      <motion.h1 {...show(0.6)} style={{
        ...display, fontWeight: 600, fontStyle: "italic", fontSize: nameSize, lineHeight: 1,
        color: t.accentDeep, margin: "4px 0 14px", maxWidth: "100%", overflowWrap: "anywhere",
      }}>
        {name}
      </motion.h1>

      {(born || weight || height) && (
        <motion.div {...show(0.75)} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, maxWidth: 360 }}>
          {born   && chip(CalendarIcon, fmtDate(born))}
          {weight && chip(ScaleIcon, weight)}
          {height && chip(RulerIcon, height)}
        </motion.div>
      )}

      {showParents && (
        <motion.div {...show(0.85)} style={{ ...body, fontSize: 17, color: t.ink, marginTop: 18 }}>
          {father && <span>Аав: <b style={{ fontWeight: 700 }}>{father}</b></span>}
          {father && mother && <span style={{ color: t.accent, margin: "0 10px" }}>·</span>}
          {mother && <span>Ээж: <b style={{ fontWeight: 700 }}>{mother}</b></span>}
        </motion.div>
      )}

      <motion.div {...show(0.95)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 20, width: "100%", maxWidth: 358 }}>
        <div style={{ width: 28, height: 1, background: t.accent, flexShrink: 0 }} />
        <div style={{ ...display, fontWeight: 600, fontSize: 22, color: t.ink, lineHeight: 1.2 }}>
          {fmtDate(event.date)}{event.time ? ` · ${event.time}` : ""}
        </div>
        <div style={{ width: 28, height: 1, background: t.accent, flexShrink: 0 }} />
      </motion.div>

      <motion.button type="button" onClick={scrollNext} aria-label="Доош гүйлгэх"
        initial={{ opacity: 0 }} animate={started ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 1, delay: 1.4 }}
        style={{ position: "absolute", bottom: 16, left: "50%", marginLeft: -26, width: 52, height: 52, background: "transparent", border: "none", cursor: "pointer", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="t29-bounce"><ChevronsIcon size={28} color={t.accentDeep} /></div>
      </motion.button>

      <Mascot src={mascot} demo={demo} side={mascotSide} />
    </header>
  );
}

// ─── Урилгын үг ──────────────────────────────────────────────────────────────
function T29Letter({ event, tone, prev }: SecProps) {
  const t = useT();
  const lines = getPoemLines(event, T29_DEFAULT_POEM);
  return (
    <Section id="t29-letter" tone={tone} prev={prev}>
      <FadeUp>
        <div style={{ background: t.card, borderRadius: 24, boxShadow: SHADOW_CARD, padding: "32px 24px 26px", position: "relative", overflow: "hidden" }}>
          <div aria-hidden="true" style={{ position: "absolute", top: -22, right: -22, opacity: 0.5 }}><CloudIcon size={110} color={t.accentLight} /></div>
          <div aria-hidden="true" style={{ position: "absolute", bottom: -16, left: -10, opacity: 0.5 }}><CloudIcon size={80} color={t.second} /></div>
          <div style={{ ...display, fontStyle: "italic", fontSize: 22, lineHeight: 1.5, color: t.ink, textAlign: "center", position: "relative" }}>
            {lines.map((l, i) => l === "" ? <div key={i} style={{ height: 14 }} /> : <div key={i}>{l}</div>)}
          </div>
          <div style={{ marginTop: 22, position: "relative" }}><Divider /></div>
        </div>
      </FadeUp>
    </Section>
  );
}

// ─── Цомог ───────────────────────────────────────────────────────────────────
const CARD_W = 210, CARD_GAP = 16;
function T29Gallery({ event, tone, prev }: SecProps) {
  const t = useT();
  const title   = cfg(event.config, "gallery.title", "Бяцхан үрийн цомог");
  const photos  = (event.gallery2_photos || []).filter(Boolean);
  const sources = photos.length ? photos : FALLBACK_PHOTOS;
  const capCfg  = cfg<string[] | false>(event.config, "gallery.captions", t.captions);
  const captions = capCfg === false ? [] : capCfg;

  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / (CARD_W + CARD_GAP));
    setActive(Math.max(0, Math.min(sources.length - 1, i)));
  };
  const goTo = (i: number) => trackRef.current?.scrollTo({ left: i * (CARD_W + CARD_GAP), behavior: "smooth" });

  return (
    <Section tone={tone} prev={prev} style={{ paddingLeft: 0, paddingRight: 0 }}>
      <FadeUp><Heading>{title}</Heading></FadeUp>
      <div ref={trackRef} className="t29-carousel" onScroll={onScroll}
        style={{ display: "flex", gap: CARD_GAP, overflowX: "auto", scrollSnapType: "x mandatory", paddingInline: `calc(50% - ${CARD_W / 2}px)`, paddingBlock: "16px 20px", WebkitOverflowScrolling: "touch" }}>
        {sources.map((src, i) => {
          const isActive = i === active;
          return (
            <figure key={i} style={{
              flex: `0 0 ${CARD_W}px`, width: CARD_W, margin: 0, scrollSnapAlign: "center",
              background: t.card, padding: 8, borderRadius: 22,
              transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)`,
              boxShadow: isActive ? `0 14px 30px ${t.accentGlow}` : SHADOW_CARD,
              outline: isActive ? `3px solid ${t.accent}` : "none", transition: "box-shadow .3s, outline-color .3s",
            }}>
              <div style={{ aspectRatio: "4 / 5", overflow: "hidden", borderRadius: 16, background: t.soft }}>
                <Photo src={src} alt={`Зураг ${i + 1}`} />
              </div>
              {isActive && captions[i % captions.length] && (
                <figcaption style={{ ...hand, fontWeight: 600, fontSize: 22, color: t.accentDeep, textAlign: "center", padding: "8px 4px 0" }}>
                  {captions[i % captions.length]}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 4, flexWrap: "wrap", padding: "0 16px" }}>
        {sources.map((_, i) => (
          <button key={i} type="button" onClick={() => goTo(i)} aria-label={`Зураг ${i + 1}`} aria-current={i === active}
            style={{ width: i === active ? 38 : 24, height: 24, background: "transparent", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ display: "block", width: i === active ? 22 : 8, height: 8, borderRadius: 999, background: i === active ? t.accentDeep : t.line, transition: "width .3s, background .3s" }} />
          </button>
        ))}
      </div>
    </Section>
  );
}

// ─── Тоологч ─────────────────────────────────────────────────────────────────
function T29Countdown({ event, tone, prev }: SecProps) {
  const t = useT();
  const [c, setC] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const target = new Date(`${event.date}T${event.time || "15:00"}:00`);
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
  const calUrl = calendarUrl(event, `${babyName(event, t)} — усны найр`);
  return (
    <Section tone={tone} prev={prev}>
      <FadeUp><Heading>Найр эхлэхэд</Heading></FadeUp>
      <FadeUp>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {units.map((u) => (
            <div key={u.l} style={{ background: t.card, borderRadius: 18, boxShadow: SHADOW_CARD, padding: "16px 4px 12px", textAlign: "center", border: `1px solid ${t.line}` }}>
              <div style={{ ...display, fontWeight: 600, fontSize: 40, lineHeight: 1, color: t.accentDeep, fontVariantNumeric: "tabular-nums" }}>{pad(u.v)}</div>
              <div style={{ ...bodyB, fontSize: 12, textTransform: "uppercase", color: t.inkMuted, marginTop: 8, letterSpacing: "0.06em" }}>{u.l}</div>
            </div>
          ))}
        </div>
        {calUrl && (
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
            <Btn variant="soft" href={calUrl} icon={<CalendarIcon size={20} color={t.accentDeep} />}>Календарьт нэмэх</Btn>
          </div>
        )}
      </FadeUp>
    </Section>
  );
}

// ─── Хөтөлбөр ────────────────────────────────────────────────────────────────
function T29Schedule({ event, tone, prev }: SecProps) {
  const t = useT();
  const [hh, mm] = (event.time || "15:00").split(":").map(Number);
  const fmt = (h: number, m: number) =>
    String(Math.floor(h + m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  const items = getSchedule(event, [
    { time: fmt(hh, mm),          label: "Зочдыг угтах" },
    { time: fmt(hh, mm + 30),     label: "Ерөөл, мэндчилгээ" },
    { time: fmt(hh + 1, mm),      label: "Зоог" },
  ]);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  const spine = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  return (
    <Section tone={tone} prev={prev}>
      <FadeUp><Heading>Хөтөлбөр</Heading></FadeUp>
      <div ref={ref} style={{ position: "relative", paddingLeft: 54 }}>
        <div aria-hidden="true" style={{ position: "absolute", left: 18, top: 20, bottom: 20, width: 2, backgroundImage: `repeating-linear-gradient(to bottom, ${t.line} 0 6px, transparent 6px 12px)` }} />
        <motion.div aria-hidden="true" style={{ position: "absolute", left: 18, top: 20, width: 2, height: spine, maxHeight: "calc(100% - 40px)", backgroundImage: `repeating-linear-gradient(to bottom, ${t.accentDeep} 0 6px, transparent 6px 12px)` }} />
        {items.map((it, i) => (
          <FadeUp key={i} delay={Math.min(i, 5) * 0.12} style={{ position: "relative", marginBottom: 14 }}>
            <div aria-hidden="true" style={{
              position: "absolute", left: -54, top: 8, width: 38, height: 38, borderRadius: "50%",
              background: t.card, border: `2px solid ${t.accent}`, boxShadow: `0 0 0 4px ${tone === "soft" ? t.soft : t.bg}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {i % 2 === 0 ? <FootIcon size={18} color={t.accentDeep} /> : <StarIcon size={16} color={t.star} />}
            </div>
            <div style={{ background: t.card, borderRadius: 18, padding: "14px 16px", boxShadow: SHADOW_CARD }}>
              <div style={{ ...display, fontWeight: 700, fontSize: 24, color: t.accentDeep, lineHeight: 1.1 }}>{it.time}</div>
              <div style={{ ...bodyB, fontSize: 16, color: t.ink, marginTop: 4 }}>{it.label}</div>
              {it.desc && <div style={{ ...body, fontSize: 14, color: t.inkMuted, marginTop: 4, lineHeight: 1.5 }}>{it.desc}</div>}
            </div>
          </FadeUp>
        ))}
      </div>
    </Section>
  );
}

// ─── Байршил ─────────────────────────────────────────────────────────────────
function T29Location({ event, tone, prev }: SecProps) {
  const t = useT();
  const mapHref = event.venue_map_url
    ? normalizeUrl(event.venue_map_url)
    : event.venue_name ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(event.venue_name) : "";
  return (
    <Section tone={tone} prev={prev}>
      <FadeUp><Heading>Хаана</Heading></FadeUp>
      <FadeUp delay={0.08}>
        <div style={{ background: t.card, padding: 8, borderRadius: 24, boxShadow: SHADOW_CARD }}>
          <div style={{ aspectRatio: "16 / 10", borderRadius: 18, overflow: "hidden", background: t.soft, position: "relative" }}>
            {event.maps_photo ? (
              <Photo src={event.maps_photo} alt={event.venue_name} />
            ) : (
              <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PinIcon size={44} color={t.accentDeep} />
              </div>
            )}
          </div>
        </div>
      </FadeUp>
      <FadeUp delay={0.12} style={{ textAlign: "center", marginTop: 22 }}>
        {event.venue_name && <div style={{ ...display, fontWeight: 600, fontSize: 26, color: t.ink, lineHeight: 1.2 }}>{event.venue_name}</div>}
        {event.venue_address && <div style={{ ...body, fontSize: 16, lineHeight: "24px", color: t.inkMuted, marginTop: 8 }}>{event.venue_address}</div>}
        {mapHref && (
          <div style={{ marginTop: 22 }}>
            <Btn variant="primary" href={mapHref} icon={<PinIcon size={20} color={t.onAccent} />} style={{ width: "100%" }}>Google Maps-р харах</Btn>
          </div>
        )}
      </FadeUp>
    </Section>
  );
}

// ─── Бэлэг (сонголтоор: config.gift.account өгсөн үед) ───────────────────────
function T29Gift({ event, tone, prev }: SecProps) {
  const t = useT();
  const title   = cfg(event.config, "gift.title", "Бэлэг");
  const note    = cfg(event.config, "gift.note", "Та бүхний ерөөл бидэнд хамгийн үнэтэй бэлэг. Хүсвэл бяцхан үрийн хуримтлалд:");
  const demo    = event.id === "demo";
  const bank    = cfg<string | null>(event.config, "gift.bank", demo ? "Хаан банк" : null);
  const account = giftAccount(event);
  const holder  = cfg<string | null>(event.config, "gift.holder", demo ? "Б. Болд" : null);
  if (!account) return null;
  const copy = async () => {
    try { await navigator.clipboard.writeText(account.replace(/\s/g, "")); toast.success("Дансны дугаар хуулагдлаа"); }
    catch { toast.error("Хуулж чадсангүй — дугаарыг гараар бичнэ үү"); }
  };
  return (
    <Section tone={tone} prev={prev}>
      <FadeUp><Heading>{title}</Heading></FadeUp>
      <FadeUp>
        <div style={{ background: t.card, borderRadius: 24, boxShadow: SHADOW_CARD, padding: "26px 22px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><GiftIcon size={32} color={t.accentDeep} /></div>
          <p style={{ ...body, fontSize: 16, lineHeight: "24px", color: t.ink, margin: "0 auto", maxWidth: 320 }}>{note}</p>
          <div style={{ marginTop: 20, background: t.soft, borderRadius: 16, padding: "16px 14px" }}>
            {bank && <div style={{ ...bodyB, fontSize: 14, letterSpacing: "0.1em", textTransform: "uppercase", color: t.inkMuted }}>{bank}</div>}
            <div style={{ ...display, fontWeight: 700, fontSize: 28, letterSpacing: "0.06em", color: t.ink, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{account}</div>
            {holder && <div style={{ ...body, fontSize: 15, color: t.inkMuted, marginTop: 4 }}>{holder}</div>}
          </div>
          <div style={{ marginTop: 16 }}>
            <Btn variant="soft" onClick={copy} icon={<CopyIcon size={20} color={t.accentDeep} />}>Дансны дугаар хуулах</Btn>
          </div>
        </div>
      </FadeUp>
    </Section>
  );
}

// ─── Ерөөл ───────────────────────────────────────────────────────────────────
function T29Wishes({ event, tone, prev }: SecProps) {
  const t = useT();
  const eventId = event.id;
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
    toast.success("Ерөөлийг хүлээн авлаа. Баярлалаа!");
  };

  return (
    <Section tone={tone} prev={prev}>
      <FadeUp><Heading>Ерөөл</Heading></FadeUp>
      <FadeUp>
        <div style={{ ...hand, fontWeight: 500, fontSize: 22, color: t.inkMuted, textAlign: "center", marginBottom: 18 }}>
          Бяцхан үрд зориулсан ерөөлөө үлдээгээрэй
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field id="t29-wish-name" label="Нэр" value={name} onChange={setName} placeholder="Таны нэр" />
          <Field id="t29-wish-msg" label="Ерөөл" textarea value={message} onChange={setMessage} placeholder="Урт наслаж, эрүүл энх…" />
          <Btn variant="primary" onClick={submit} disabled={sending || !name.trim() || !message.trim()}
            icon={<SendIcon size={20} color={t.onAccent} />} style={{ width: "100%" }}>
            {sending ? "Илгээж байна…" : "Илгээх"}
          </Btn>
        </div>
      </FadeUp>
      {wishes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 32 }}>
          {wishes.map((w, i) => (
            <FadeUp key={i} delay={Math.min(i, 4) * 0.06}>
              <div style={{ background: t.card, borderRadius: 20, padding: "16px 18px", boxShadow: SHADOW_CARD, position: "relative", overflow: "hidden" }}>
                <div aria-hidden="true" style={{ position: "absolute", right: 14, top: 12, opacity: 0.9 }}><HeartIcon size={16} color={i % 2 ? t.second : t.accentLight} /></div>
                <p style={{ ...body, fontSize: 16, lineHeight: "24px", color: t.ink, margin: 0, paddingRight: 20 }}>{w.message}</p>
                <div style={{ ...hand, fontWeight: 600, fontSize: 21, color: t.accentDeep, marginTop: 8 }}>— {w.name}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Ирц ─────────────────────────────────────────────────────────────────────
function T29RSVP({ event, tone, prev }: SecProps) {
  const t = useT();
  const maxGuests = cfg(event.config, "rsvp.maxGuests", 10);
  const note      = cfg(event.config, "rsvp.note", "Найрын өдрөөс өмнө бүртгүүлнэ үү");
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [guests, setGuests]   = useState(2);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone]       = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setSending(true);
    if (event.id !== "demo") {
      const { error } = await supabase.from("rsvp").insert({
        event_id: event.id, name: name.trim(), phone: phone.trim(), guests, message: message.trim(),
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
          width: 46, height: 46, borderRadius: "50%", border: "none", cursor: disabled ? "not-allowed" : "pointer",
          background: disabled ? t.line : t.accentDeep, color: disabled ? t.inkMuted : t.onAccent,
          ...display, fontWeight: 600, fontSize: 26, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          boxShadow: disabled ? "none" : `0 6px 16px ${t.accentGlow}`,
        }}>
        {dir < 0 ? "−" : "+"}
      </button>
    );
  };

  return (
    <Section tone={tone} prev={prev}>
      <FadeUp><Heading>Ирцээ бүртгүүлэх</Heading></FadeUp>
      <FadeUp>
        <div style={{ background: t.card, borderRadius: 24, padding: 22, boxShadow: SHADOW_CARD, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field id="t29-rsvp-name" label="Нэр" value={name} onChange={setName} placeholder="Таны нэр" />
          <Field id="t29-rsvp-phone" label="Утас" type="tel" inputMode="numeric" value={phone} onChange={setPhone} placeholder="9900 1122" />
          <div>
            <div style={{ ...bodyB, fontSize: 14, lineHeight: "20px", color: t.ink, marginBottom: 8 }}>Хүний тоо</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, minHeight: 52 }}>
              {stepBtn(-1)}
              <div aria-live="polite" style={{ ...display, fontWeight: 700, fontSize: 28, color: t.ink, minWidth: 40, textAlign: "center" }}>{guests}</div>
              {stepBtn(1)}
            </div>
          </div>
          <Field id="t29-rsvp-msg" label="Мессеж" textarea value={message} onChange={setMessage} placeholder="Нэмэлт мэдээлэл" />
          {done ? (
            <div role="status" style={{
              ...display, fontStyle: "italic", fontWeight: 600, fontSize: 20, color: t.accentDeep, textAlign: "center",
              minHeight: 52, display: "flex", alignItems: "center", justifyContent: "center",
              border: `1.5px solid ${t.accent}`, borderRadius: 999,
            }}>
              Баярлалаа! Бүртгэгдлээ.
            </div>
          ) : (
            <Btn variant="primary" onClick={submit} disabled={sending || !name.trim()} style={{ width: "100%" }}>
              {sending ? "Илгээж байна…" : "Бүртгүүлэх"}
            </Btn>
          )}
          <div style={{ ...body, fontSize: 13, lineHeight: "18px", color: t.inkMuted, textAlign: "center" }}>{note}</div>
        </div>
      </FadeUp>
    </Section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function T29Footer({ event, prev }: { event: EventData; prev: Tone }) {
  const t = useT();
  const title  = cfg(event.config, "footer.title", "Та бүхнийг хүлээж байна");
  const lines  = cfg<string[]>(event.config, "footer.lines", []);
  const phones = cfg<string[]>(event.config, "footer.phones", []).filter(Boolean);
  const img    = cfg<string | null>(event.config, "footer.image", null) || event.gallery_photos?.[0] || null;
  return (
    <footer style={{ background: prev === "soft" ? t.soft : t.bg, position: "relative" }}>
      <Wave fill={t.accentLight} />
      <div style={{ background: t.accentLight, padding: "8px 16px 96px", position: "relative", textAlign: "center" }}>
        {img && (
          <FadeUp>
            <div style={{ width: 150, height: 150, borderRadius: "50%", overflow: "hidden", margin: "16px auto 0", border: `5px solid ${t.card}`, boxShadow: SHADOW_CARD }}>
              <Photo src={img} alt="" />
            </div>
          </FadeUp>
        )}
        <FadeUp delay={0.05}>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
            <FootIcon size={18} color={t.accentDeep} /><FootIcon size={18} color={t.accentDeep} />
          </div>
          <div style={{ ...display, fontStyle: "italic", fontWeight: 600, fontSize: 32, lineHeight: 1.15, color: t.accentDeep, marginTop: 10 }}>
            {title}
          </div>
          {lines.map((l) => (
            <div key={l} style={{ ...body, fontSize: 16, lineHeight: "24px", color: t.ink, marginTop: 14 }}>{l}</div>
          ))}
          {phones.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 20 }}>
              {phones.map((p) => (
                <a key={p} href={`tel:${p.replace(/\D/g, "")}`} style={{
                  display: "inline-flex", alignItems: "center", gap: 12, minHeight: 52, padding: "6px 20px 6px 6px",
                  background: t.card, borderRadius: 999, textDecoration: "none", boxShadow: SHADOW_CARD,
                }}>
                  <span style={{ width: 40, height: 40, borderRadius: "50%", background: t.accentDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <PhoneIcon size={20} color={t.onAccent} />
                  </span>
                  <span style={{ ...display, fontWeight: 700, fontSize: 22, color: t.ink }}>{fmtPhone(p)}</span>
                </a>
              ))}
            </div>
          )}
        </FadeUp>
      </div>
    </footer>
  );
}

// ─── Хөгжмийн товч ───────────────────────────────────────────────────────────
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
      style={{
        position: "fixed", right: 16, bottom: "calc(16px + env(safe-area-inset-bottom, 0px))", zIndex: 1000,
        width: 56, height: 56, borderRadius: "50%", cursor: "pointer",
        background: t.card, border: `2px solid ${t.accent}`, boxShadow: `0 8px 20px ${t.accentGlow}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
      <div className={playing ? "t29-pulse" : undefined}>
        {playing ? <NoteIcon size={24} color={t.accentDeep} /> : <NoteOffIcon size={24} color={t.accentDeep} />}
      </div>
    </button>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
export function BabyCelebration({ event, theme }: { event: EventData; theme: Theme["key"] }) {
  const themeKey = cfg<Theme["key"]>(event.config, "theme", theme);
  const t = THEMES[themeKey] ?? THEMES[theme];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // config.intro.video: видео URL → видео intro; false → intro-гүй; байхгүй → дарж нээх intro
  const introVideo = cfg<string | false | undefined>(event.config, "intro.video", undefined);
  const [started, setStarted] = useState(introVideo === false);
  const start = () => { setStarted(true); audioRef.current?.play().catch(() => {}); };

  // Дуу: hero гармагц, хараахан тоглоогүй бол анхны хөдөлгөөн дээр асна
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

  // Харагдах section-уудыг дарааллаар нь ээлжлэн soft / bg өнгөөр (долгион зөв зурагдана)
  const c = event.config;
  const blocks: ((p: { tone: Tone; prev: Tone }) => React.ReactNode)[] = [
    (p) => <T29Letter key="letter" event={event} {...p} />,
    (p) => <T29Gallery key="gallery" event={event} {...p} />,
    ...(sectionOn(c, "timer")    ? [(p: { tone: Tone; prev: Tone }) => <T29Countdown key="timer" event={event} {...p} />] : []),
    ...(sectionOn(c, "schedule") ? [(p: { tone: Tone; prev: Tone }) => <T29Schedule key="schedule" event={event} {...p} />] : []),
    (p) => <T29Location key="location" event={event} {...p} />,
    ...(sectionOn(c, "gift") && giftAccount(event) ? [(p: { tone: Tone; prev: Tone }) => <T29Gift key="gift" event={event} {...p} />] : []),
    ...(sectionOn(c, "wishes")   ? [(p: { tone: Tone; prev: Tone }) => <T29Wishes key="wishes" event={event} {...p} />] : []),
    ...(sectionOn(c, "rsvp")     ? [(p: { tone: Tone; prev: Tone }) => <T29RSVP key="rsvp" event={event} {...p} />] : []),
  ];
  const toneAt = (i: number): Tone => (i % 2 === 0 ? "soft" : "bg");

  return (
    <ThemeCtx.Provider value={t}>
      <div className="t29" lang="mn" style={{ maxWidth: 523, margin: "0 auto", ...body, overflowX: "clip", background: t.bg, color: t.ink }}>
        <Styles />
        {introVideo === undefined && !started && (
          <TapIntro onOpen={start}
            mascot={cfg<string | null>(c, "intro.mascot", null)}
            mascotSide={cfg<"left" | "right">(c, "intro.mascotSide", "left")}
            demo={event.id === "demo"} />
        )}
        {typeof introVideo === "string" && <VideoIntro src={introVideo} onDone={start} />}
        <Bubbles />

        <T29Hero event={event} started={started} />
        {blocks.map((b, i) => b({ tone: toneAt(i), prev: i === 0 ? "bg" : toneAt(i - 1) }))}
        <T29Footer event={event} prev={toneAt(blocks.length - 1)} />

        <audio ref={audioRef} loop src={event.music_url ?? ""} preload="auto" />
        {event.music_url && <MusicToggle audioRef={audioRef} />}
        <Toaster />
      </div>
    </ThemeCtx.Provider>
  );
}

// Template 29 — Хүү (sky) theme
export default function Template29({ event }: { event: EventData }) {
  return <BabyCelebration event={event} theme="sky" />;
}
