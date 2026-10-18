import { createContext, useContext, useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { EventData } from "../../types/event";
import { getPoemLines, getSchedule } from "../../lib/eventContent";
import { cfg, sectionOn } from "../../lib/eventConfig";
import { normalizeUrl } from "../../lib/url";

// ─── Template 23 / 24 — эрэгтэй хүүхдийн төрсөн өдөр ─────────────────────────
// Нэг бүтэц, хоёр theme:
//   "sonic"  (template 23) — Sonic-ийн хөх, алтан цагираг, улаан пүүз; хурдны
//                            зураас, шатрын хээ, цагирагны мотив
//   "spider" (template 24) — Spider-Man-ий улаан #DF1F2D + хөх #2B3784; аалзны
//                            тор, дугуй торон цагираг
// Лого, зохиогчийн эрхтэй дүр байхгүй — зөвхөн өнгө, мотив.
//
// Section дараалал: intro (дарж нээх) → hero → урилгын үг → цомог → тоологч →
// хөтөлбөр → байршил → хүсэлт → ерөөл → ирц → footer. Тохиргоо бүгд
// events.config-оос cfg()-ээр (config.theme-ээр theme-ийг ч сольж болно).
// Түлхүүрүүд: docs/event-config.md § T23.

// ─── Theme ───────────────────────────────────────────────────────────────────
type IconFn = ({ size, color }: { size?: number; color?: string }) => React.ReactElement;

type Theme = {
  key: "sonic" | "spider";
  bg: string; bg2: string; bg3: string;          // хуудас / input, HUD / карт
  line: string; lineStrong: string;
  primary: string; primaryDeep: string; primaryText: string;   // гол товч, шүд, оч
  accent: string; accentLight: string; accentDeep: string; onAccent: string; accentGlow: string; // гарчиг, хүрээ, 2-р товч
  hot: string; hotGlow: string;                  // тоологчийн тоо, хөгжмийн icon, цагирагны цөм
  paper: string; paperMuted: string;
  corner: "web" | "streaks";
  ring: "web" | "sonic";
  texture: "halftone" | "checker";
  burst1: string; burst2: string;
  requestText: string;
  requestIcons: { Icon: IconFn; label: string }[];
};

const ThemeCtx = createContext<Theme | null>(null);
const useT = () => useContext(ThemeCtx)!;

// Oswald — кирилл (Ө, Ү) бүрэн; гарчиг, нэр, тоо. PT Sans — энгийн бичвэр.
const display = { fontFamily: "'Oswald', 'PT Sans', sans-serif" } as const;
const body    = { fontFamily: "'PT Sans', 'Segoe UI', sans-serif" } as const;
const bodyB   = { fontFamily: "'PT Sans', 'Segoe UI', sans-serif", fontWeight: 700 } as const;

const SHADOW_CARD = "0 10px 24px rgba(4,7,15,.55)";

// ─── Зурагны fallback ────────────────────────────────────────────────────────
const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800",
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800",
  "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800",
  "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800",
];

const DEFAULT_CAPTIONS = [
  "Бяцхан баатар", "Анхны инээмсэглэл", "Адал явдал", "Хамгийн сайхан өдөр",
  "Баатрын сорил", "Тоглоомын цаг", "Дурсамж", "Хамтдаа",
];

// ─── Icons (inline SVG, 24×24, currentColor) ────────────────────────────────
const ico = (size: number, color: string, children: React.ReactNode, filled = false) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? color : "none"} stroke={filled ? "none" : color}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
    {children}
  </svg>
);
const BoltIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M13 2 L5 13 H11 L10 22 L19 10 H13 Z" />, true);
const StarIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M12 2 L14.6 8.6 L21.5 9.2 L16.2 13.8 L17.9 20.6 L12 17 L6.1 20.6 L7.8 13.8 L2.5 9.2 L9.4 8.6 Z" />, true);
const PlayIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M7 4 L20 12 L7 20 Z" />, true);
const GearIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></>);
const MaskIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M3 8c3-2 6-2 9-1 3-1 6-1 9 1-1 5-4 9-9 10C7 17 4 13 3 8Z" /><path d="M8 11.5c1-1 2.5-1 3.5 0M12.5 11.5c1-1 2.5-1 3.5 0" /></>);
const CapeIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M8 3h8l-1 3H9Z" /><path d="M9 6 4 21h16L15 6" /><path d="M9 6c2 5 4 5 6 0" /></>);
const ShieldIcon: IconFn   = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M12 2.5 20 5.5v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-6Z" /><path d="M12 7v10M8 12h8" /></>);
const RingIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><circle cx="12" cy="12" r="8" strokeWidth="3.5" /><path d="M7 8.5a6 6 0 0 1 5-2.5" strokeWidth="1.2" opacity=".7" /></>);
const SneakerIcon: IconFn  = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M3 14v4h18v-3c0-1.5-1.5-2.5-4-3l-3.5-2.5L10 11H5.5C4 11 3 12.3 3 14Z" /><path d="M10.5 11l1 2M12.5 10l1 2M3 15.5h18" /></>);
const CalendarIcon: IconFn = ({ size = 24, color = "currentColor" }) => ico(size, color, <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>);
const PinIcon: IconFn      = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></>);
const SendIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M21 3 10 14" /><path d="M21 3 14 21l-4-7-7-4Z" /></>);
const PhoneIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />);
const CameraIcon: IconFn   = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M4 8h3l2-3h6l2 3h3v12H4Z" /><circle cx="12" cy="13" r="3.5" /></>);
const NoteIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>);
const NoteOffIcon: IconFn  = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /><path d="M3 3l18 18" /></>);
const ChevronsIcon: IconFn = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M6 6l6 6 6-6" /><path d="M6 12l6 6 6-6" /></>);

// ─── Theme-үүд ───────────────────────────────────────────────────────────────
const THEMES: Record<Theme["key"], Theme> = {
  sonic: {
    key: "sonic",
    bg: "#071A45", bg2: "#0E2560", bg3: "#15306B",
    line: "#244A9A", lineStrong: "#5F86D9",
    primary: "#1E63D6", primaryDeep: "#0F3C8F", primaryText: "#6FA3FF",
    accent: "#FFC700", accentLight: "#FFE066", accentDeep: "#B88A00", onAccent: "#071A45", accentGlow: "rgba(255,199,0,.35)",
    hot: "#FF4B55", hotGlow: "rgba(255,75,85,.4)",
    paper: "#F5F7FF", paperMuted: "#AEBBE0",
    corner: "streaks", ring: "sonic", texture: "checker",
    burst1: "ГОУ!", burst2: "ХУРДАН!",
    requestText: "Бяцхан баатрууд аа, хамгийн хурдан пүүзээ өмсөөд ирээрэй! Алтан цагираг цуглуулах уралдаан болно.",
    requestIcons: [
      { Icon: RingIcon,    label: "Цагираг" },
      { Icon: SneakerIcon, label: "Пүүз" },
      { Icon: StarIcon,    label: "Од" },
      { Icon: BoltIcon,    label: "Хурд" },
    ],
  },
  spider: {
    key: "spider",
    bg: "#0B1230", bg2: "#141C45", bg3: "#1C2659",
    line: "#2B3784", lineStrong: "#6F7FD1",
    primary: "#DF1F2D", primaryDeep: "#9A1220", primaryText: "#FF5F6B",
    accent: "#6C86FF", accentLight: "#A9B8FF", accentDeep: "#2B3784", onAccent: "#0B1230", accentGlow: "rgba(108,134,255,.35)",
    hot: "#FF5F6B", hotGlow: "rgba(223,31,45,.4)",
    paper: "#F5F1E8", paperMuted: "#B4BCCD",
    corner: "web", ring: "web", texture: "halftone",
    burst1: "БУМ!", burst2: "ХӨӨХ!",
    requestText: "Бяцхан баатрууд аа, дуртай баатрынхаа хувцсыг өмсөөд ирээрэй! Баг, нөмрөг, бамбай — юу ч болно.",
    requestIcons: [
      { Icon: MaskIcon,   label: "Баг" },
      { Icon: CapeIcon,   label: "Нөмрөг" },
      { Icon: ShieldIcon, label: "Бамбай" },
      { Icon: BoltIcon,   label: "Аянга" },
    ],
  },
};

// ─── global styles (keyframes, focus, reduced motion) ────────────────────────
function Styles() {
  const t = useT();
  return (
    <style>{`
      @keyframes t23Spin    { to { transform: rotate(360deg); } }
      @keyframes t23SpinRev { to { transform: rotate(-360deg); } }
      @keyframes t23Spark {
        0%   { opacity: 0; transform: translate(0, -4vh); }
        12%  { opacity: 1; }
        90%  { opacity: .7; }
        100% { opacity: 0; transform: translate(-28px, 104vh); }
      }
      @keyframes t23Pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
      @keyframes t23Bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(7px); } }
      .t23 .t23-ring-outer { transform-box: fill-box; transform-origin: center; animation: t23Spin 18s linear infinite; }
      .t23 .t23-ring-tick  { transform-box: fill-box; transform-origin: center; animation: t23SpinRev 30s linear infinite; }
      .t23 .t23-ring-fast  { transform-box: fill-box; transform-origin: center; animation: t23Spin 4s linear infinite; }
      .t23 .t23-spark      { animation: t23Spark var(--dur) var(--delay) linear infinite; }
      .t23 .t23-pulse      { animation: t23Pulse 1.6s ease-in-out infinite; }
      .t23 .t23-bounce     { animation: t23Bounce 2.2s ease-in-out infinite; }
      .t23 :focus-visible  { outline: 2px solid ${t.hot}; outline-offset: 3px; }
      .t23 input::placeholder, .t23 textarea::placeholder { color: ${t.paperMuted}; opacity: 1; }
      .t23 input:focus, .t23 textarea:focus { border-color: ${t.hot} !important; }
      .t23 .t23-carousel { scrollbar-width: none; }
      .t23 .t23-carousel::-webkit-scrollbar { display: none; }
      .t23 .t23-btn:active:not(:disabled) { transform: translateY(3px); }
      .t23 .t23-btn-primary:active:not(:disabled) { box-shadow: 0 2px 0 ${t.primaryDeep}; }
      .t23 .t23-btn-accent:active:not(:disabled)  { box-shadow: 0 2px 0 ${t.accentDeep}; }
      @media (prefers-reduced-motion: reduce) {
        .t23 .t23-ring-outer, .t23 .t23-ring-tick, .t23 .t23-ring-fast, .t23 .t23-spark, .t23 .t23-pulse, .t23 .t23-bounce { animation: none !important; }
        .t23 .t23-sparks { display: none; }
      }
    `}</style>
  );
}

// ─── Мотивууд ────────────────────────────────────────────────────────────────
const CORNER_POS: Record<string, React.CSSProperties> = {
  tl: { top: 0, left: 0 }, tr: { top: 0, right: 0 }, bl: { bottom: 0, left: 0 }, br: { bottom: 0, right: 0 },
};
const CORNER_FLIP: Record<string, string> = { tl: "none", tr: "scaleX(-1)", bl: "scaleY(-1)", br: "scale(-1,-1)" };

// Булангийн чимэглэл: spider → дөрөвний нэг аалзны тор; sonic → хурдны зураас + цагираг
function Corner({ corner = "tl", size = 150, opacity = 0.12 }: {
  corner?: "tl" | "tr" | "bl" | "br"; size?: number; opacity?: number;
}) {
  const t = useT();
  const common: React.CSSProperties = { position: "absolute", ...CORNER_POS[corner], transform: CORNER_FLIP[corner], opacity, pointerEvents: "none" };

  if (t.corner === "streaks") {
    return (
      <svg aria-hidden="true" width={size} height={size * 0.6} viewBox="0 0 100 60" style={common} fill="none" strokeLinecap="round">
        {[6, 16, 26, 36, 46].map((y, i) => (
          <path key={y} d={`M0 ${y} H${[92, 64, 80, 48, 70][i]}`} stroke={t.paper} strokeWidth="3" />
        ))}
        <circle cx="78" cy="22" r="7" stroke={t.accent} strokeWidth="3.5" />
        <circle cx="60" cy="48" r="5" stroke={t.accent} strokeWidth="3" />
        <circle cx="90" cy="46" r="4" stroke={t.accent} strokeWidth="2.5" />
      </svg>
    );
  }

  const spokes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 7) * (Math.PI / 2);
    spokes.push(`M0 0 L${(100 * Math.cos(a)).toFixed(1)} ${(100 * Math.sin(a)).toFixed(1)}`);
  }
  const arcs: string[] = [];
  for (let r = 18; r <= 98; r += 16) {
    let d = "";
    for (let i = 0; i < 7; i++) {
      const a1 = (i / 7) * (Math.PI / 2), a2 = ((i + 1) / 7) * (Math.PI / 2);
      const x1 = r * Math.cos(a1), y1 = r * Math.sin(a1), x2 = r * Math.cos(a2), y2 = r * Math.sin(a2);
      const am = (a1 + a2) / 2, rm = r * 0.9;
      d += (i === 0 ? `M${x1.toFixed(1)} ${y1.toFixed(1)} ` : "") +
        `Q${(rm * Math.cos(am)).toFixed(1)} ${(rm * Math.sin(am)).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} `;
    }
    arcs.push(d);
  }
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 100 100" style={common}
      fill="none" stroke={t.paper} strokeWidth="0.9" strokeLinecap="round">
      {spokes.map((d, i) => <path key={"s" + i} d={d} />)}
      {arcs.map((d, i) => <path key={"a" + i} d={d} />)}
    </svg>
  );
}

// Гол цагираг: spider → дугуй торон хүрээ, улаан цөм; sonic → алтан торус
function Ring({ size = 200, style = {} }: { size?: number; style?: React.CSSProperties }) {
  const t = useT();
  const base: React.CSSProperties = { display: "block", pointerEvents: "none", overflow: "visible", ...style };

  if (t.ring === "sonic") {
    return (
      <svg aria-hidden="true" width={size} height={size} viewBox="0 0 200 200" fill="none" style={base}>
        <defs>
          <filter id="t23halo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
        </defs>
        <circle cx="100" cy="100" r="74" stroke={t.accent} strokeWidth="20" opacity="0.3" filter="url(#t23halo)" />
        <circle cx="100" cy="100" r="74" stroke={t.accentDeep} strokeWidth="18" />
        <circle cx="100" cy="100" r="74" stroke={t.accent} strokeWidth="12" />
        <circle className="t23-ring-outer" cx="100" cy="100" r="74" stroke={t.accentLight} strokeWidth="4" strokeDasharray="70 395" strokeLinecap="round" />
        <circle cx="100" cy="100" r="58" stroke={t.paper} strokeWidth="1" opacity="0.25" />
        <circle className="t23-ring-tick" cx="100" cy="100" r="92" stroke={t.primaryText} strokeWidth="2" strokeDasharray="4 14" opacity="0.6" />
      </svg>
    );
  }

  const spokes = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `M${(100 + 44 * Math.cos(a)).toFixed(1)} ${(100 + 44 * Math.sin(a)).toFixed(1)} L${(100 + 76 * Math.cos(a)).toFixed(1)} ${(100 + 76 * Math.sin(a)).toFixed(1)}`;
  });
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 200 200" fill="none" style={base}>
      <defs>
        <filter id="t23halo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
        <filter id="t23core" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={t.hot} floodOpacity="0.8" />
        </filter>
      </defs>
      <circle cx="100" cy="100" r="80" stroke={t.hot} strokeWidth="18" opacity="0.3" filter="url(#t23halo)" />
      <circle className="t23-ring-outer" cx="100" cy="100" r="88" stroke={t.hot} strokeWidth="3" strokeDasharray="22 10" />
      <g className="t23-ring-tick" stroke={t.paper} strokeWidth="1" opacity="0.35">
        {spokes.map((d, i) => <path key={i} d={d} />)}
        <circle cx="100" cy="100" r="64" />
        <circle cx="100" cy="100" r="50" />
      </g>
      <circle cx="100" cy="100" r="76" stroke={t.accent} strokeWidth="1.5" />
      <circle cx="100" cy="100" r="58" stroke={t.hot} strokeWidth="7" filter="url(#t23core)" />
    </svg>
  );
}

// Дэвсгэр хээ: spider → halftone цэг; sonic → шатрын хээ (Green Hill)
function Texture({ style = {} }: { style?: React.CSSProperties }) {
  const t = useT();
  const checker = t.texture === "checker";
  return (
    <div aria-hidden="true" style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      opacity: checker ? 0.07 : 0.14,
      backgroundImage: checker
        ? `linear-gradient(45deg, ${t.paper} 25%, transparent 25%, transparent 75%, ${t.paper} 75%), linear-gradient(45deg, ${t.paper} 25%, transparent 25%, transparent 75%, ${t.paper} 75%)`
        : `radial-gradient(${t.paper} 1.1px, transparent 1.3px)`,
      backgroundSize: checker ? "20px 20px, 20px 20px" : "9px 9px",
      backgroundPosition: checker ? "0 0, 10px 10px" : "0 0",
      maskImage: "linear-gradient(135deg, rgba(0,0,0,.9) 30%, transparent 85%)",
      WebkitMaskImage: "linear-gradient(135deg, rgba(0,0,0,.9) 30%, transparent 85%)",
      ...style,
    }} />
  );
}

function SpeedLines() {
  const t = useT();
  return (
    <div aria-hidden="true" style={{
      position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.10,
      backgroundImage: `repeating-linear-gradient(-62deg, ${t.paper} 0 2px, transparent 2px 22px)`,
      maskImage: "radial-gradient(ellipse at center, transparent 28%, black 78%)",
      WebkitMaskImage: "radial-gradient(ellipse at center, transparent 28%, black 78%)",
    }} />
  );
}

// Section-уудын хоорондох шүдлэг зураас
function ZigZag() {
  const t = useT();
  return (
    <svg aria-hidden="true" width="100%" height="18" style={{ display: "block" }}>
      <defs>
        <pattern id="t23zig" width="24" height="18" patternUnits="userSpaceOnUse">
          <path d="M0 18 L12 2 L24 18 Z" fill={t.primaryDeep} />
          <path d="M0 18 L12 2 L24 18" stroke={t.accent} strokeWidth="2" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="18" fill="url(#t23zig)" />
    </svg>
  );
}

// 12 үзүүртэй од — стикер
function Burst({ text, variant = "primary", size = 84, style = {} }: {
  text: string; variant?: "primary" | "accent"; size?: number; style?: React.CSSProperties;
}) {
  const t = useT();
  const pts: string[] = [];
  for (let i = 0; i < 24; i++) {
    const r = i % 2 === 0 ? 48 : 36;
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
  }
  const fill   = variant === "primary" ? t.primary : t.accent;
  const stroke = variant === "primary" ? t.accent : t.primaryDeep;
  const color  = variant === "primary" ? t.paper : t.onAccent;
  const fontSize = text.length > 4 ? 18 : 24;
  return (
    <div aria-hidden="true" style={{ position: "absolute", width: size, height: size, pointerEvents: "none", ...style }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
        <polygon points={pts.join(" ")} fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
          fontFamily="'Oswald', 'PT Sans', sans-serif" fontWeight="700" fontSize={fontSize} fill={color}
          transform="rotate(-8 50 50)">
          {text}
        </text>
      </svg>
    </div>
  );
}

const SPARKS = Array.from({ length: 20 }, (_, i) => ({
  id: i, left: (i * 37 + 7) % 100, size: 3 + (i % 3), dur: 6 + (i % 6), delay: -((i * 1.7) % 11), alt: i % 3 === 0,
}));

function Sparks() {
  const t = useT();
  return (
    <div className="t23-sparks" aria-hidden="true" style={{
      position: "fixed", top: 0, bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "min(523px, 100%)", pointerEvents: "none", overflow: "hidden", zIndex: 6,
    }}>
      {SPARKS.map((s) => {
        const c = s.alt ? t.accentLight : t.primaryText;
        return (
          <div key={s.id} className="t23-spark" style={{
            position: "absolute", left: s.left + "%", top: 0,
            width: s.size, height: s.size, borderRadius: "50%",
            background: c, boxShadow: `0 0 ${s.size * 2}px ${c}`,
            ["--dur" as string]: s.dur + "s", ["--delay" as string]: s.delay + "s",
          }} />
        );
      })}
    </div>
  );
}

function Divider() {
  const t = useT();
  return (
    <div aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "0 auto", maxWidth: 260 }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${t.accent})` }} />
      <div style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ position: "absolute", inset: 4, border: `1.5px solid ${t.accent}`, transform: "rotate(45deg)" }} />
        <BoltIcon size={12} color={t.accent} />
      </div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${t.accent})` }} />
    </div>
  );
}

// ─── Жижиг UI хэсгүүд ────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <div style={{ ...display, fontWeight: 500, fontSize: 14, letterSpacing: "0.22em", textTransform: "uppercase", color: t.accentLight }}>
      {children}
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <h2 style={{
      ...display, fontWeight: 700, fontSize: 32, lineHeight: 1.1, textTransform: "uppercase",
      letterSpacing: "0.02em", color: t.accent, textAlign: "center",
      transform: "skewX(-6deg)", textShadow: `0 3px 0 ${t.primaryDeep}`, margin: 0,
    }}>
      {children}
    </h2>
  );
}

function FadeUp({ children, delay = 0, style = {} }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 1, delay, ease: "easeOut" }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

type BtnProps = {
  variant: "primary" | "accent" | "hot";
  icon?: React.ReactNode; children: React.ReactNode;
  onClick?: () => void; href?: string; disabled?: boolean; style?: React.CSSProperties;
};
function Btn({ variant, icon, children, onClick, href, disabled, style = {} }: BtnProps) {
  const t = useT();
  const base: React.CSSProperties = {
    ...display, fontWeight: 600, fontSize: 18, textTransform: "uppercase", letterSpacing: "0.04em",
    minHeight: 52, borderRadius: 8, border: "none", padding: "0 22px",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
    cursor: disabled ? "not-allowed" : "pointer", textDecoration: "none",
    opacity: disabled ? 0.55 : 1, transition: "transform .08s, box-shadow .08s, opacity .2s",
    boxSizing: "border-box",
    ...(variant === "primary" ? { background: t.primary, color: t.paper, boxShadow: `0 5px 0 ${t.primaryDeep}` } :
        variant === "accent"  ? { background: t.accent, color: t.onAccent, boxShadow: `0 5px 0 ${t.accentDeep}` } :
                                { background: t.bg2, color: t.hot, boxShadow: `0 0 0 2px ${t.hotGlow}, 0 0 22px ${t.hotGlow}` }),
    ...style,
  };
  const cls = `t23-btn t23-btn-${variant}`;
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
    background: t.bg2, border: `1.5px solid ${t.lineStrong}`, borderRadius: 8,
    ...body, fontSize: 16, color: t.paper, outline: "none", transition: "border-color .2s",
  };
  return (
    <div>
      <label htmlFor={id} style={{ ...bodyB, fontSize: 14, lineHeight: "20px", color: t.paper, display: "block", marginBottom: 8 }}>
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

// Зураг байхгүй үед хээтэй хайрцаг + "ЗУРАГ"
function Photo({ src, alt = "", style = {} }: { src?: string; alt?: string; style?: React.CSSProperties }) {
  const t = useT();
  if (src) return <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }} />;
  return (
    <div aria-label={alt || "Зураг"} style={{
      width: "100%", height: "100%", background: t.bg3, position: "relative",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, ...style,
    }}>
      <Texture style={{ maskImage: "none", WebkitMaskImage: "none", opacity: 0.1 }} />
      <CameraIcon size={28} color={t.paperMuted} />
      <span style={{ ...display, fontWeight: 600, fontSize: 13, letterSpacing: "0.18em", color: t.paperMuted }}>ЗУРАГ</span>
    </div>
  );
}

// Section-ийн ерөнхий бүрхүүл: шүдлэг зураас → 48px дээд, 80px доод зай
function Section({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const t = useT();
  return (
    <section style={{ background: t.bg, position: "relative" }}>
      <ZigZag />
      <div style={{ padding: "48px 16px 80px", position: "relative", overflow: "hidden", ...style }}>
        {children}
      </div>
    </section>
  );
}

// ─── Нэр, огнооны туслахууд ──────────────────────────────────────────────────
function givenName(full: string) {
  return (full || "").replace(/^[А-ЯЁӨҮA-Z]\.\s*/u, "").trim();
}
function fmtDate(d: string) {
  const [y, m, day] = (d || "").split("-");
  if (!y || !m || !day) return d;
  return `${y} оны ${Number(m)} сарын ${Number(day)}`;
}
function fmtPhone(p: string) {
  const digits = p.replace(/\D/g, "");
  return digits.length === 8 ? digits.slice(0, 4) + " " + digits.slice(4) : p;
}
// Google Calendar template холбоос — баяр 3 цаг үргэлжилнэ гэж тооцно
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

// ─── Intro: дарж нээх ────────────────────────────────────────────────────────
function TapIntro({ onOpen }: { onOpen: () => void }) {
  const t = useT();
  const [exiting, setExiting] = useState(false);
  const open = () => { if (exiting) return; setExiting(true); onOpen(); };
  return (
    <motion.div
      initial={{ opacity: 1 }} animate={{ opacity: exiting ? 0 : 1 }} transition={{ duration: 0.9, ease: "easeOut" }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999, background: t.bg,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        pointerEvents: exiting ? "none" : "auto", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, left: "50%", transform: "translateX(-50%)", width: "min(523px, 100%)" }}>
        <SpeedLines />
        <Corner corner="tl" size={170} />
        <Corner corner="br" size={170} />
      </div>
      <div style={{ position: "relative", width: 260, height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Ring size={260} style={{ position: "absolute", inset: 0 }} />
        <button type="button" onClick={open} aria-label="Урилгыг нээх"
          style={{
            width: 96, height: 96, borderRadius: "50%", cursor: "pointer",
            background: t.bg2, border: `2px solid ${t.accent}`,
            boxShadow: `0 0 28px ${t.accentGlow}, 0 0 0 6px rgba(255,255,255,.06)`,
            display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
          }}>
          <PlayIcon size={34} color={t.accent} />
        </button>
      </div>
      <div style={{ ...display, fontWeight: 500, fontSize: 20, color: t.paper, marginTop: 28, textAlign: "center", padding: "0 16px" }}>
        Урилгыг нээхийн тулд дарна уу
      </div>
    </motion.div>
  );
}

// ─── Intro: видео (config.intro.video өгсөн үед) ─────────────────────────────
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
const SHIELD_PATH = "M50 2 L96 15 V58 C96 88 76 108 50 118 C24 108 4 88 4 58 V15 Z";

function T23Hero({ event, started }: { event: EventData; started: boolean }) {
  const t = useT();
  const name    = givenName(cfg(event.config, "hero.name", event.person1_name || "Бяцхан баатар"));
  const age     = cfg<string | number | null>(event.config, "hero.age", null);
  const eyebrow = cfg(event.config, "hero.eyebrow", "Төрсөн өдрийн урилга");
  const photo   = cfg<string | null>(event.config, "hero.photo", null) || event.person1_photo || event.main_image;

  const nameSize =
    name.length <= 8  ? "clamp(52px, 18.5vw, 76px)" :
    name.length <= 11 ? "clamp(40px, 13.5vw, 58px)" :
    name.length <= 15 ? "clamp(32px, 10vw, 46px)" :
                        "clamp(26px, 7.5vw, 36px)";

  const show = (delay: number) => ({
    initial: { opacity: 0, y: 22 },
    animate: started ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 },
    transition: { duration: 1, delay, ease: "easeOut" as const },
  });
  const scrollNext = () => document.getElementById("t23-letter")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <header style={{
      minHeight: "100svh", background: t.bg, position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "56px 16px 72px", boxSizing: "border-box", textAlign: "center",
    }}>
      <Texture />
      <SpeedLines />
      <Corner corner="tr" size={160} />
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(60% 40% at 50% 48%, ${t.primary}38, transparent 70%)`,
      }} />

      <motion.div {...show(0.1)} style={{ position: "relative", zIndex: 2 }}>
        <Eyebrow>{eyebrow}</Eyebrow>
      </motion.div>

      <motion.h1 {...show(0.3)} style={{
        ...display, fontWeight: 700, fontSize: nameSize, lineHeight: 0.95, textTransform: "uppercase",
        color: t.paper, margin: "14px 0 6px", position: "relative", zIndex: 2, transform: "skewX(-6deg)",
        textShadow: `0 4px 0 ${t.primaryDeep}, 0 0 28px ${t.primary}8C`,
        maxWidth: "100%", overflowWrap: "anywhere",
      }}>
        {name}
      </motion.h1>

      {/* 358×400 бүтэц: цагираг → бамбай хэлбэртэй зураг → насны тэмдэг */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={started ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
        transition={{ duration: 1.1, delay: 0.5, ease: "easeOut" }}
        style={{ position: "relative", width: "100%", maxWidth: 358, height: 400, zIndex: 2 }}
      >
        <Ring size={330} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }} />

        <svg width="220" height="264" viewBox="0 0 100 120" aria-hidden={!photo}
          style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", overflow: "visible",
                   filter: `drop-shadow(0 0 18px ${t.accentGlow})` }}>
          <defs><clipPath id="t23shield"><path d={SHIELD_PATH} /></clipPath></defs>
          <path d={SHIELD_PATH} fill={t.bg3} />
          {photo ? (
            <image href={photo} x="0" y="0" width="100" height="120" preserveAspectRatio="xMidYMid slice" clipPath="url(#t23shield)" />
          ) : (
            <text x="50" y="66" textAnchor="middle" fontFamily="'Oswald', sans-serif" fontWeight="600" fontSize="9" letterSpacing="1.5" fill={t.paperMuted}>ЗУРАГ</text>
          )}
          <path d={SHIELD_PATH} fill="none" stroke={t.accent} strokeWidth="3.2" />
          <path d="M50 6 L92 18 V58 C92 85 74 104 50 113.5 C26 104 8 85 8 58 V18 Z" fill="none" stroke={t.accentLight} strokeWidth="0.8" opacity="0.8" />
        </svg>

        {age !== null && age !== "" && (
          <div style={{
            position: "absolute", left: "50%", top: "50%", transform: "translate(52px, 72px)",
            width: 118, height: 118, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Ring size={118} style={{ position: "absolute", inset: 0 }} />
            <div style={{ position: "relative", textAlign: "center", background: t.bg, borderRadius: "50%", width: 64, height: 64, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ ...display, fontWeight: 700, fontSize: 40, lineHeight: 0.9, color: t.accent, textShadow: `0 3px 0 ${t.primaryDeep}` }}>
                {String(age)}
              </div>
              <div style={{ ...display, fontWeight: 600, fontSize: 13, letterSpacing: "0.2em", color: t.paper, marginTop: 4, marginRight: "-0.2em" }}>НАС</div>
            </div>
          </div>
        )}

        <Burst text={t.burst1} variant="primary" size={84} style={{ right: -4, top: 22, transform: "rotate(10deg)" }} />
      </motion.div>

      <motion.div {...show(0.9)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 10, position: "relative", zIndex: 2, width: "100%", maxWidth: 358 }}>
        <div style={{ width: 28, height: 1.5, background: t.accent, flexShrink: 0 }} />
        <div style={{ ...display, fontWeight: 600, fontSize: 22, color: t.accent, lineHeight: 1.2 }}>
          {fmtDate(event.date)}{event.time ? ` · ${event.time}` : ""}
        </div>
        <div style={{ width: 28, height: 1.5, background: t.accent, flexShrink: 0 }} />
      </motion.div>

      <motion.button type="button" onClick={scrollNext} aria-label="Доош гүйлгэх"
        initial={{ opacity: 0 }} animate={started ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 1, delay: 1.4 }}
        style={{ position: "absolute", bottom: 18, left: "50%", marginLeft: -26, width: 52, height: 52, background: "transparent", border: "none", cursor: "pointer", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="t23-bounce"><ChevronsIcon size={28} color={t.accentLight} /></div>
      </motion.button>
    </header>
  );
}

// ─── Урилгын үг ──────────────────────────────────────────────────────────────
const T23_DEFAULT_POEM = [
  "Бяцхан баатар маань нэг нас нэмж байна…",
  "Инээд хөөр, адал явдлаар дүүрэн",
  "баатарлаг баяраа хамтдаа тэмдэглэе.",
  "Та бүхнийг хүрэлцэн ирэхийг урьж байна!",
];

function T23Letter({ event }: { event: EventData }) {
  const t = useT();
  const lines = getPoemLines(event, T23_DEFAULT_POEM);
  return (
    <div id="t23-letter">
      <Section>
        <FadeUp>
          <div style={{
            background: t.bg3, border: `1px solid ${t.line}`, borderRadius: 14, boxShadow: SHADOW_CARD,
            padding: "32px 24px 24px", position: "relative", overflow: "hidden",
          }}>
            <Corner corner="tr" size={140} />
            <div style={{ ...body, fontStyle: "italic", fontSize: 19, lineHeight: "30px", color: t.paper, textAlign: "center", position: "relative" }}>
              {lines.map((l, i) => l === "" ? <div key={i} style={{ height: 14 }} /> : <div key={i}>{l}</div>)}
            </div>
            <div style={{ marginTop: 24 }}><Divider /></div>
          </div>
        </FadeUp>
      </Section>
    </div>
  );
}

// ─── Цомог ───────────────────────────────────────────────────────────────────
const CARD_W = 210, CARD_GAP = 16;

function T23Gallery({ event }: { event: EventData }) {
  const t = useT();
  const title = cfg(event.config, "gallery.title", "Бяцхан баатрын цомог");
  const photos  = (event.gallery2_photos || []).filter(Boolean);
  const sources = photos.length ? photos : FALLBACK_PHOTOS;
  const capCfg  = cfg<string[] | false>(event.config, "gallery.captions", DEFAULT_CAPTIONS);
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
    <Section style={{ paddingLeft: 0, paddingRight: 0 }}>
      <FadeUp><Heading>{title}</Heading></FadeUp>

      <div ref={trackRef} className="t23-carousel" onScroll={onScroll}
        style={{
          display: "flex", gap: CARD_GAP, overflowX: "auto", scrollSnapType: "x mandatory",
          paddingInline: `calc(50% - ${CARD_W / 2}px)`, paddingBlock: "36px 20px", WebkitOverflowScrolling: "touch",
        }}>
        {sources.map((src, i) => {
          const isActive = i === active;
          return (
            <figure key={i} style={{
              flex: `0 0 ${CARD_W}px`, width: CARD_W, margin: 0, scrollSnapAlign: "center",
              background: t.paper, padding: 6, borderRadius: 4,
              transform: `rotate(${i % 2 === 0 ? -2.5 : 2.5}deg)`,
              boxShadow: isActive ? `4px 4px 0 ${t.primary}` : `4px 4px 0 ${t.primaryDeep}`,
              outline: isActive ? `3px solid ${t.accent}` : "none", outlineOffset: 0,
              transition: "box-shadow .3s, outline-color .3s",
            }}>
              <div style={{ border: `3px solid ${t.bg}`, aspectRatio: "4 / 5", overflow: "hidden", background: t.bg3 }}>
                <Photo src={src} alt={`Зураг ${i + 1}`} />
              </div>
              {isActive && captions[i % captions.length] && (
                <figcaption style={{ ...display, fontWeight: 600, fontSize: 14, textTransform: "uppercase", color: t.bg, textAlign: "center", padding: "8px 4px 2px", letterSpacing: "0.04em" }}>
                  {captions[i % captions.length]}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 8, flexWrap: "wrap", padding: "0 16px" }}>
        {sources.map((_, i) => (
          <button key={i} type="button" onClick={() => goTo(i)} aria-label={`Зураг ${i + 1}`} aria-current={i === active}
            style={{ width: i === active ? 38 : 24, height: 24, background: "transparent", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ display: "block", width: i === active ? 22 : 8, height: 8, borderRadius: 999, background: i === active ? t.accent : t.lineStrong, transition: "width .3s, background .3s" }} />
          </button>
        ))}
      </div>
    </Section>
  );
}

// ─── Тоологч ─────────────────────────────────────────────────────────────────
function T23Countdown({ event }: { event: EventData }) {
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
  const name   = givenName(cfg(event.config, "hero.name", event.person1_name || "Бяцхан баатар"));
  const calUrl = calendarUrl(event, `${name} — төрсөн өдөр`);

  return (
    <Section>
      <SpeedLines />
      <FadeUp style={{ position: "relative" }}>
        <div style={{ position: "relative" }}>
          <Heading>Баяр эхлэхэд</Heading>
          <Burst text={t.burst2} variant="accent" size={72} style={{ right: 0, top: -40, transform: "rotate(12deg)" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 36 }}>
          {units.map((u) => (
            <div key={u.l} style={{
              background: t.bg2, border: `1.5px solid ${t.accent}`, borderRadius: 8,
              boxShadow: `0 6px 0 ${t.primaryDeep}, 0 14px 22px rgba(4,7,15,.6)`,
              padding: "16px 4px 12px", textAlign: "center", position: "relative", overflow: "hidden",
            }}>
              <span aria-hidden="true" style={{ position: "absolute", top: 4, left: 4, width: 12, height: 12, borderTop: `3px solid ${t.accentLight}`, borderLeft: `3px solid ${t.accentLight}` }} />
              <span aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "rgba(255,255,255,.07)" }} />
              <div style={{ ...display, fontWeight: 600, fontSize: 40, lineHeight: 1, color: t.hot, fontVariantNumeric: "tabular-nums", textShadow: `0 0 14px ${t.hotGlow}, 0 0 4px ${t.hot}` }}>
                {pad(u.v)}
              </div>
              <div style={{ ...bodyB, fontSize: 12, textTransform: "uppercase", color: t.paperMuted, marginTop: 8, letterSpacing: "0.06em" }}>{u.l}</div>
            </div>
          ))}
        </div>

        {calUrl && (
          <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
            <Btn variant="hot" href={calUrl} icon={<CalendarIcon size={20} color={t.hot} />}>Календарьт нэмэх</Btn>
          </div>
        )}
      </FadeUp>
    </Section>
  );
}

// ─── Хөтөлбөр ────────────────────────────────────────────────────────────────
function T23Schedule({ event }: { event: EventData }) {
  const t = useT();
  const [hh, mm] = (event.time || "15:00").split(":").map(Number);
  const fmt = (h: number, m: number) =>
    String(Math.floor(h + m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  const items = getSchedule(event, [
    { time: fmt(hh, mm),          label: "Угтах" },
    { time: fmt(hh, mm + 30),     label: "Тоглоом, баатрын сорил" },
    { time: fmt(hh + 1, mm + 30), label: "Бялуу зүсэх" },
  ]);

  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  const spine = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <Section>
      <FadeUp><Heading>Хөтөлбөр</Heading></FadeUp>
      <div ref={ref} style={{ position: "relative", marginTop: 36, paddingLeft: 56 }}>
        <div aria-hidden="true" style={{ position: "absolute", left: 19, top: 20, bottom: 20, width: 2, backgroundImage: `repeating-linear-gradient(to bottom, ${t.line} 0 6px, transparent 6px 12px)` }} />
        <motion.div aria-hidden="true" style={{ position: "absolute", left: 19, top: 20, width: 2, height: spine, maxHeight: "calc(100% - 40px)", backgroundImage: `repeating-linear-gradient(to bottom, ${t.accent} 0 6px, transparent 6px 12px)` }} />
        {items.map((it, i) => (
          <FadeUp key={i} delay={i * 0.1} style={{ position: "relative", marginBottom: 16 }}>
            <div style={{
              position: "absolute", left: -56, top: 10, width: 40, height: 40, borderRadius: "50%",
              background: t.bg, border: `2px solid ${t.accent}`, boxShadow: `0 0 14px ${t.accentGlow}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {i % 2 === 0 ? <StarIcon size={18} color={t.accent} /> : <GearIcon size={18} color={t.accent} />}
            </div>
            <div style={{ background: t.bg3, borderRadius: 14, padding: "14px 16px", boxShadow: SHADOW_CARD }}>
              <div style={{ ...display, fontWeight: 600, fontSize: 22, color: t.accent, lineHeight: 1.1 }}>{it.time}</div>
              <div style={{ ...bodyB, fontSize: 16, color: t.paper, marginTop: 4 }}>{it.label}</div>
              {it.desc && <div style={{ ...body, fontSize: 13, color: t.paperMuted, marginTop: 4, lineHeight: 1.5 }}>{it.desc}</div>}
            </div>
          </FadeUp>
        ))}
      </div>
    </Section>
  );
}

// ─── Байршил ─────────────────────────────────────────────────────────────────
function T23Location({ event }: { event: EventData }) {
  const t = useT();
  const mapHref = event.venue_map_url
    ? normalizeUrl(event.venue_map_url)
    : event.venue_name ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(event.venue_name) : "";

  return (
    <Section>
      <FadeUp><Heading>Хаана</Heading></FadeUp>
      <FadeUp delay={0.1}>
        <div style={{ marginTop: 32, background: t.bg2, padding: 6, borderRadius: 14, border: `3px solid ${t.accent}`, boxShadow: SHADOW_CARD }}>
          <div style={{ aspectRatio: "16 / 10", borderRadius: 6, overflow: "hidden", border: `1px solid ${t.accentLight}`, position: "relative", background: t.bg3 }}>
            {event.maps_photo ? (
              <Photo src={event.maps_photo} alt={event.venue_name} />
            ) : (
              <div aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
                <div style={{ position: "absolute", inset: 0, opacity: 0.25, backgroundImage: `linear-gradient(${t.lineStrong} 1px, transparent 1px), linear-gradient(90deg, ${t.lineStrong} 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
                <div style={{ position: "absolute", left: -20, right: -20, top: "55%", height: 10, background: t.line, transform: "rotate(-18deg)" }} />
                <div style={{ position: "absolute", left: -20, right: -20, top: "40%", height: 6, background: t.line, transform: "rotate(24deg)" }} />
                <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -80%)" }}>
                  <PinIcon size={44} color={t.primaryText} />
                </div>
              </div>
            )}
          </div>
        </div>
      </FadeUp>
      <FadeUp delay={0.15} style={{ textAlign: "center", marginTop: 24 }}>
        {event.venue_name && (
          <div style={{ ...display, fontWeight: 600, fontSize: 22, textTransform: "uppercase", color: t.paper, lineHeight: 1.2 }}>{event.venue_name}</div>
        )}
        {event.venue_address && (
          <div style={{ ...body, fontSize: 16, lineHeight: "24px", color: t.paperMuted, marginTop: 8 }}>{event.venue_address}</div>
        )}
        {mapHref && (
          <div style={{ marginTop: 24 }}>
            <Btn variant="primary" href={mapHref} icon={<PinIcon size={20} color={t.paper} />} style={{ width: "100%" }}>Google Maps-р харах</Btn>
          </div>
        )}
      </FadeUp>
    </Section>
  );
}

// ─── Бяцхан хүсэлт ───────────────────────────────────────────────────────────
function T23Request({ event }: { event: EventData }) {
  const t = useT();
  const title = cfg(event.config, "request.title", "Бяцхан хүсэлт");
  const text  = cfg(event.config, "request.text", t.requestText);
  return (
    <Section>
      <Texture />
      <FadeUp style={{ position: "relative" }}>
        <Heading>{title}</Heading>
        <p style={{ ...body, fontSize: 16, lineHeight: "24px", color: t.paper, textAlign: "center", margin: "24px auto 0", maxWidth: 340 }}>{text}</p>
      </FadeUp>
      <FadeUp delay={0.15} style={{ position: "relative" }}>
        {/* 4 icon ЗААВАЛ нэг мөрөнд — 4 баганат grid, wrap хийхгүй */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginTop: 36 }}>
          {t.requestIcons.map(({ Icon, label }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div aria-hidden="true" style={{ position: "absolute", inset: 8, background: t.bg3, border: `2px solid ${t.accent}`, borderRadius: 8, transform: "rotate(45deg)", boxShadow: `0 0 12px ${t.accentGlow}` }} />
                <div style={{ position: "relative" }}><Icon size={24} color={t.accent} /></div>
              </div>
              <span style={{ ...bodyB, fontSize: 13, color: t.paper, textAlign: "center" }}>{label}</span>
            </div>
          ))}
        </div>
      </FadeUp>
    </Section>
  );
}

// ─── Ерөөл ───────────────────────────────────────────────────────────────────
type Wish = { name: string; message: string };
const DEMO_WISHES: Wish[] = [
  { name: "Болд ах",    message: "Төрсөн өдрийн мэнд хүргэе, бяцхан баатар минь! Үргэлж зоригтой, эрүүл саруул байгаарай." },
  { name: "Сараа эгч",  message: "Таван насны баярын мэнд! Хүссэн бүхэн чинь биелэх болтугай." },
  { name: "Ану, 6 нас", message: "Найз минь, хамтдаа тоглохыг тэсэн ядан хүлээж байна!" },
];

function WishCard({ wish, side }: { wish: Wish; side: "left" | "right" }) {
  const t = useT();
  const tail: React.CSSProperties = {
    position: "absolute", bottom: -10, width: 0, height: 0, borderTop: `12px solid ${t.accent}`,
    ...(side === "left" ? { left: 22, borderRight: "14px solid transparent" } : { right: 22, borderLeft: "14px solid transparent" }),
  };
  const tailInner: React.CSSProperties = {
    position: "absolute", bottom: -7, width: 0, height: 0, borderTop: `10px solid ${t.bg3}`,
    ...(side === "left" ? { left: 23.5, borderRight: "11px solid transparent" } : { right: 23.5, borderLeft: "11px solid transparent" }),
  };
  return (
    <div style={{
      position: "relative", background: t.bg3, border: `1.5px solid ${t.accent}`, borderRadius: 14,
      padding: "14px 16px 12px", boxShadow: SHADOW_CARD, maxWidth: "88%",
      alignSelf: side === "left" ? "flex-start" : "flex-end",
    }}>
      <p style={{ ...body, fontSize: 16, lineHeight: "24px", color: t.paper, margin: 0 }}>{wish.message}</p>
      <div style={{ ...display, fontWeight: 600, fontSize: 15, color: t.accent, marginTop: 8, textAlign: side === "left" ? "left" : "right" }}>— {wish.name}</div>
      <span aria-hidden="true" style={tail} />
      <span aria-hidden="true" style={tailInner} />
    </div>
  );
}

function T23Wishes({ eventId }: { eventId: string }) {
  const t = useT();
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
    <Section>
      <Corner corner="bl" size={150} />
      <FadeUp style={{ position: "relative" }}>
        <Heading>Ерөөл</Heading>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 32 }}>
          <Field id="t23-wish-name" label="Нэр" value={name} onChange={setName} placeholder="Таны нэр" />
          <Field id="t23-wish-msg" label="Ерөөлөө бичнэ үү" textarea value={message} onChange={setMessage} placeholder="Бяцхан баатарт зориулсан үг" />
          <Btn variant="accent" onClick={submit} disabled={sending || !name.trim() || !message.trim()}
            icon={<SendIcon size={20} color={t.onAccent} />} style={{ width: "100%" }}>
            {sending ? "Илгээж байна…" : "Илгээх"}
          </Btn>
        </div>
      </FadeUp>
      {wishes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 36, position: "relative" }}>
          {wishes.map((w, i) => (
            <FadeUp key={i} delay={Math.min(i, 4) * 0.08} style={{ display: "flex", flexDirection: "column" }}>
              <WishCard wish={w} side={i % 2 === 0 ? "left" : "right"} />
            </FadeUp>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Ирц бүртгэл ─────────────────────────────────────────────────────────────
function T23RSVP({ event }: { event: EventData }) {
  const t = useT();
  const maxGuests = cfg(event.config, "rsvp.maxGuests", 10);
  const note      = cfg(event.config, "rsvp.note", "Баярын өдрөөс өмнө бүртгүүлнэ үү");
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
          width: 44, height: 44, borderRadius: "50%", border: "none", cursor: disabled ? "not-allowed" : "pointer",
          background: disabled ? t.bg3 : t.accent, color: disabled ? t.paperMuted : t.onAccent,
          ...display, fontWeight: 600, fontSize: 24, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: disabled ? "none" : `0 5px 0 ${t.accentDeep}`, flexShrink: 0,
        }}>
        {dir < 0 ? "−" : "+"}
      </button>
    );
  };

  return (
    <Section>
      <SpeedLines />
      <FadeUp style={{ position: "relative" }}>
        <Heading>Ирцээ бүртгүүлэх</Heading>
        <div style={{ background: t.bg3, borderRadius: 14, padding: 24, marginTop: 32, boxShadow: SHADOW_CARD, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field id="t23-rsvp-name" label="Нэр" value={name} onChange={setName} placeholder="Таны нэр" />
          <Field id="t23-rsvp-phone" label="Утас" type="tel" inputMode="numeric" value={phone} onChange={setPhone} placeholder="9900 1122" />
          <div>
            <div style={{ ...bodyB, fontSize: 14, lineHeight: "20px", color: t.paper, marginBottom: 8 }}>Хүний тоо</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, minHeight: 52 }}>
              {stepBtn(-1)}
              <div aria-live="polite" style={{ ...display, fontWeight: 600, fontSize: 24, color: t.paper, minWidth: 40, textAlign: "center" }}>{guests}</div>
              {stepBtn(1)}
            </div>
          </div>
          <Field id="t23-rsvp-msg" label="Мессеж" textarea value={message} onChange={setMessage} placeholder="Нэмэлт мэдээлэл" />
          {done ? (
            <div role="status" style={{
              ...display, fontWeight: 600, fontSize: 18, color: t.accent, textAlign: "center",
              minHeight: 52, display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${t.accent}`, borderRadius: 8,
            }}>
              Баярлалаа! Бүртгэгдлээ.
            </div>
          ) : (
            <Btn variant="primary" onClick={submit} disabled={sending || !name.trim()} style={{ width: "100%" }}>
              {sending ? "Илгээж байна…" : "Бүртгүүлэх"}
            </Btn>
          )}
          <div style={{ ...body, fontSize: 13, lineHeight: "18px", color: t.paperMuted, textAlign: "center" }}>{note}</div>
        </div>
      </FadeUp>
    </Section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function T23Footer({ event }: { event: EventData }) {
  const t = useT();
  const title  = cfg(event.config, "footer.title", "Таньтай уулзахыг тэсэн ядан хүлээж байна");
  const lines  = cfg<string[]>(event.config, "footer.lines", []);
  const phones = cfg<string[]>(event.config, "footer.phones", []);
  const img    = cfg<string | null>(event.config, "footer.image", null) || event.gallery_photos?.[0] || event.main_image;

  return (
    <footer style={{ background: t.bg, position: "relative" }}>
      <ZigZag />
      <div style={{ position: "relative", height: 380 }}>
        <Photo src={img} alt="" />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${t.bg}26, ${t.bg})` }} />
      </div>
      <div style={{ padding: "0 16px 96px", marginTop: -70, position: "relative", textAlign: "center" }}>
        <FadeUp>
          <div style={{ ...display, fontWeight: 700, fontSize: 30, lineHeight: 1.15, textTransform: "uppercase", color: t.accent, textShadow: `0 3px 0 ${t.primaryDeep}` }}>
            {title}
          </div>
          {lines.map((l) => (
            <div key={l} style={{ ...body, fontSize: 16, lineHeight: "24px", color: t.paper, marginTop: 16 }}>{l}</div>
          ))}
          {phones.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 20 }}>
              {phones.map((p) => (
                <a key={p} href={`tel:${p.replace(/\D/g, "")}`} style={{
                  display: "inline-flex", alignItems: "center", gap: 12, minHeight: 52, padding: "6px 20px 6px 6px",
                  background: t.bg3, border: `2px solid ${t.accent}`, borderRadius: 999, textDecoration: "none",
                }}>
                  <span style={{ width: 40, height: 40, borderRadius: "50%", background: t.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <PhoneIcon size={20} color={t.paper} />
                  </span>
                  <span style={{ ...display, fontWeight: 600, fontSize: 20, color: t.paper }}>{fmtPhone(p)}</span>
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
        background: t.bg, border: `3px solid ${t.accent}`,
        boxShadow: `0 0 0 1px ${t.accentLight}, 0 0 18px ${t.hotGlow}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
      <div className={playing ? "t23-pulse" : undefined}>
        {playing ? <NoteIcon size={24} color={t.hot} /> : <NoteOffIcon size={24} color={t.hot} />}
      </div>
    </button>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
export function HeroBirthday({ event, theme }: { event: EventData; theme: Theme["key"] }) {
  const themeKey = cfg<Theme["key"]>(event.config, "theme", theme);
  const t = THEMES[themeKey] ?? THEMES[theme];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // config.intro.video: видео URL → видео intro; false → intro-гүй; байхгүй → дарж нээх intro
  const introVideo = cfg<string | false | undefined>(event.config, "intro.video", undefined);
  const [started, setStarted] = useState(introVideo === false);

  const start = () => {
    setStarted(true);
    audioRef.current?.play().catch(() => {});
  };

  // intro-гүй үед дуу хэрэглэгчийн анхны хөдөлгөөн дээр асна (autoplay хориг)
  useEffect(() => {
    if (introVideo !== false || !event.music_url) return;
    const startMusic = () => { audioRef.current?.play().then(cleanup).catch(() => {}); };
    const evs = ["pointerdown", "touchstart", "keydown", "scroll"] as const;
    const cleanup = () => evs.forEach((e) => window.removeEventListener(e, startMusic));
    startMusic();
    evs.forEach((e) => window.addEventListener(e, startMusic, { passive: true }));
    return cleanup;
  }, [introVideo, event.music_url]);

  return (
    <ThemeCtx.Provider value={t}>
      <div className="t23" lang="mn" style={{ maxWidth: 523, margin: "0 auto", ...body, overflowX: "clip", background: t.bg, color: t.paper }}>
        <Styles />
        {introVideo === undefined && !started && <TapIntro onOpen={start} />}
        {typeof introVideo === "string" && <VideoIntro src={introVideo} onDone={start} />}
        <Sparks />

        <T23Hero event={event} started={started} />
        <T23Letter event={event} />
        <T23Gallery event={event} />
        <T23Countdown event={event} />
        {sectionOn(event.config, "schedule") && <T23Schedule event={event} />}
        <T23Location event={event} />
        {sectionOn(event.config, "request") && <T23Request event={event} />}
        {sectionOn(event.config, "wishes") && <T23Wishes eventId={event.id} />}
        {sectionOn(event.config, "rsvp") && <T23RSVP event={event} />}
        <T23Footer event={event} />

        <audio ref={audioRef} loop src={event.music_url ?? ""} preload="auto" />
        {event.music_url && <MusicToggle audioRef={audioRef} />}
        <Toaster />
      </div>
    </ThemeCtx.Provider>
  );
}

// Template 23 — Sonic theme
export default function Template23({ event }: { event: EventData }) {
  return <HeroBirthday event={event} theme="sonic" />;
}
