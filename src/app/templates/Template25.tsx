import { createContext, useContext, useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { EventData } from "../../types/event";
import { getPoemLines, getSchedule } from "../../lib/eventContent";
import { cfg, sectionOn } from "../../lib/eventConfig";
import { normalizeUrl } from "../../lib/url";

// ─── Template 25 / 26 — эмэгтэй хүүхдийн төрсөн өдөр ─────────────────────────
// Нэг бүтэц, хоёр theme (Template23-ын HeroBirthday-тай ижил section, config):
//   "ice" (template 25) — Мөсөн гүнж: гүн хөх шөнө, мөсөн цэнхэр, мөнгө; эргэдэг
//                         цасан ширхэг, мөсөн талстын хээ, унах цас
//   "sun" (template 26) — Нарны гүнж: ягаан-лаванда үдэш, алтан; нарны тэмдэг,
//                         ургамлын хээ, дээш хөвөх алтан дэнлүү
// Лого, зохиогчийн эрхтэй дүр байхгүй — зөвхөн өнгө, мотив. Баатрын зураг/бичлэг
// захиалагч config-оор өөрөө оруулна (hero.mascot, intro.mascot, intro.video).
//
// Section дараалал: intro (дарж нээх) → hero → урилгын үг → цомог → тоологч →
// хөтөлбөр → байршил → хүсэлт → ерөөл → ирц → footer.
// Түлхүүрүүд: docs/event-config.md § T25 (T23-тай ижил, theme = "ice" | "sun").

// ─── Theme ───────────────────────────────────────────────────────────────────
type IconFn = ({ size, color }: { size?: number; color?: string }) => React.ReactElement;

type Theme = {
  key: "ice" | "sun";
  bg: string; bg2: string; bg3: string;          // хуудас / градиентийн доод / карт
  line: string; lineStrong: string;
  primary: string; primaryDeep: string;          // гол товч (градиент)
  accent: string; accentLight: string; accentDeep: string; onAccent: string; accentGlow: string; // хүрээ, 2-р товч, тэмдэг
  hot: string; hotGlow: string;                  // тоологчийн тоо, хөгжмийн icon
  heading: string; headingGlow: string;          // гарчиг — зөөлөн гэрэл (хатуу сүүдэр биш)
  paper: string; paperMuted: string;
  emblem: "snowflake" | "sun";
  particles: "snow" | "lanterns";
  corner: "frost" | "vine";
  texture: "lattice" | "rays";
  badge1: string; badge2: string;                // наалтны бичиг
  requestText: string;
  requestIcons: { Icon: IconFn; label: string }[];
  captions: string[];
  scheduleIcons: [IconFn, IconFn];
};

const ThemeCtx = createContext<Theme | null>(null);
const useT = () => useContext(ThemeCtx)!;

// Playfair Display — cyrillic-ext (Ө, Ү) бүрэн; гарчиг, нэр, тоо. PT Sans — бичвэр.
// Хоёулаа index.html-д ачаалагдсан.
const display = { fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" } as const;
const body    = { fontFamily: "'PT Sans', 'Segoe UI', sans-serif" } as const;
const bodyB   = { fontFamily: "'PT Sans', 'Segoe UI', sans-serif", fontWeight: 700 } as const;

const SHADOW_CARD = "0 10px 28px rgba(6,10,30,.5)";

// ─── Зурагны fallback ────────────────────────────────────────────────────────
const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800",
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800",
  "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800",
  "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800",
];

// ─── Icons (inline SVG, 24×24, currentColor) ────────────────────────────────
const ico = (size: number, color: string, children: React.ReactNode, filled = false) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? color : "none"} stroke={filled ? "none" : color}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
    {children}
  </svg>
);
const SnowflakeIcon: IconFn = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10" /><path d="M12 6l-2.5-1.5M12 6l2.5-1.5M12 18l-2.5 1.5M12 18l2.5 1.5M6.8 9l-2.8-.5M6.8 9l.3-2.8M17.2 15l2.8.5M17.2 15l-.3 2.8M6.8 15l-2.8.5M6.8 15l.3 2.8M17.2 9l2.8-.5M17.2 9l-.3-2.8" strokeWidth="1.6" /></>);
const CrownIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M3 18h18l-1.5-9-4.5 4-3-7-3 7-4.5-4Z" /><path d="M5 21h14" /></>);
const DressIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M9 3h6l-1 5 5 13H5l5-13Z" /><path d="M10 8h4" /></>);
const WandIcon: IconFn      = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M4 20 15 9" /><path d="M16 3v2M16 13v2M10 9h2M20 9h2M12.5 5.5l1.4 1.4M18.1 11.1l1.4 1.4M18.1 6.9l1.4-1.4M12.5 12.5l1.4-1.4" /></>);
const LanternIcon: IconFn   = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M9 4h6l2 3v9l-2 3H9l-2-3V7Z" /><path d="M12 4V2M12 19v3M9 12h6" /></>);
const SunIcon: IconFn       = ({ size = 24, color = "currentColor" }) => ico(size, color, <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
const FlowerIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <><circle cx="12" cy="12" r="2.5" /><path d="M12 2.5c2 2.5 2 5 0 7-2-2-2-4.5 0-7ZM12 14.5c2 2.5 2 5 0 7-2-2-2-4.5 0-7ZM2.5 12c2.5-2 5-2 7 0-2 2-4.5 2-7 0ZM14.5 12c2.5-2 5-2 7 0-2 2-4.5 2-7 0Z" /></>);
const SparkleIcon: IconFn   = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2Z" />, true);
const HeartIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M12 21s-7-4.6-9.3-9A5.3 5.3 0 0 1 12 6.2 5.3 5.3 0 0 1 21.3 12C19 16.4 12 21 12 21Z" />, true);
const PlayIcon: IconFn      = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M7 4 L20 12 L7 20 Z" />, true);
const CalendarIcon: IconFn  = ({ size = 24, color = "currentColor" }) => ico(size, color, <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>);
const PinIcon: IconFn       = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></>);
const SendIcon: IconFn      = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M21 3 10 14" /><path d="M21 3 14 21l-4-7-7-4Z" /></>);
const PhoneIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />);
const CameraIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M4 8h3l2-3h6l2 3h3v12H4Z" /><circle cx="12" cy="13" r="3.5" /></>);
const NoteIcon: IconFn      = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>);
const NoteOffIcon: IconFn   = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /><path d="M3 3l18 18" /></>);
const ChevronsIcon: IconFn  = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M6 6l6 6 6-6" /><path d="M6 12l6 6 6-6" /></>);

// ─── Theme-үүд ───────────────────────────────────────────────────────────────
const THEMES: Record<Theme["key"], Theme> = {
  ice: {
    key: "ice",
    bg: "#0B2342", bg2: "#123A66", bg3: "#1A4A80",
    line: "#2B5E95", lineStrong: "#6FA8D8",
    primary: "#4CC3F0", primaryDeep: "#1C7FB0",
    accent: "#BFEAFF", accentLight: "#EAF8FF", accentDeep: "#5FB6E0", onAccent: "#0B2342", accentGlow: "rgba(160,225,255,.45)",
    hot: "#FFFFFF", hotGlow: "rgba(160,225,255,.65)",
    heading: "#EAF8FF", headingGlow: "rgba(120,200,255,.55)",
    paper: "#F2F9FF", paperMuted: "#A9C4DE",
    emblem: "snowflake", particles: "snow", corner: "frost", texture: "lattice",
    badge1: "Гүнж", badge2: "Ид шид!",
    requestText: "Бяцхан гүнжүүд ээ, цэнхэр, цагаан гоёлоо өмсөөд мөсөн ордонд морилоорой! Цасан ширхэг цуглуулах ид шидийн тоглоом болно.",
    requestIcons: [
      { Icon: SnowflakeIcon, label: "Цас" },
      { Icon: CrownIcon,     label: "Титэм" },
      { Icon: DressIcon,     label: "Даашинз" },
      { Icon: WandIcon,      label: "Саваа" },
    ],
    captions: ["Бяцхан гүнж", "Анхны инээмсэглэл", "Ид шидийн өдөр", "Мөсөн ордон", "Хамгийн сайхан өдөр", "Дурсамж", "Хамтдаа", "Гялалзсан мөч"],
    scheduleIcons: [SnowflakeIcon, SparkleIcon],
  },
  sun: {
    key: "sun",
    bg: "#2A1748", bg2: "#3C2468", bg3: "#4B3080",
    line: "#5E4596", lineStrong: "#A98CE0",
    primary: "#E85D9C", primaryDeep: "#B33A75",
    accent: "#FFD166", accentLight: "#FFE9A8", accentDeep: "#D9A530", onAccent: "#2A1748", accentGlow: "rgba(255,209,102,.45)",
    hot: "#FFE08A", hotGlow: "rgba(255,209,102,.6)",
    heading: "#FFF3CC", headingGlow: "rgba(255,209,102,.55)",
    paper: "#FFF6F0", paperMuted: "#C9B8E0",
    emblem: "sun", particles: "lanterns", corner: "vine", texture: "rays",
    badge1: "Гүнж", badge2: "Гэрэлт!",
    requestText: "Бяцхан гүнжүүд ээ, дуртай гүнжийнхээ даашинзыг өмсөөд ирээрэй! Оройн нарыг хүлээж дэнлүү нисгэх ёслол болно.",
    requestIcons: [
      { Icon: LanternIcon, label: "Дэнлүү" },
      { Icon: SunIcon,     label: "Нар" },
      { Icon: FlowerIcon,  label: "Цэцэг" },
      { Icon: CrownIcon,   label: "Титэм" },
    ],
    captions: ["Бяцхан гүнж", "Анхны инээмсэглэл", "Гэрэлт өдөр", "Алтан дэнлүү", "Хамгийн сайхан өдөр", "Дурсамж", "Хамтдаа", "Нарны мөч"],
    scheduleIcons: [SunIcon, LanternIcon],
  },
};

// ─── global styles (keyframes, focus, reduced motion) ────────────────────────
function Styles() {
  const t = useT();
  return (
    <style>{`
      @keyframes t25Spin    { to { transform: rotate(360deg); } }
      @keyframes t25SpinRev { to { transform: rotate(-360deg); } }
      @keyframes t25Snow {
        0%   { opacity: 0; transform: translate(0, -4vh); }
        10%  { opacity: 1; }
        90%  { opacity: .8; }
        100% { opacity: 0; transform: translate(-30px, 104vh); }
      }
      @keyframes t25Rise {
        0%   { opacity: 0; transform: translate(0, 104vh) scale(.85); }
        8%   { opacity: 1; }
        92%  { opacity: .9; }
        100% { opacity: 0; transform: translate(26px, -12vh) scale(1.05); }
      }
      @keyframes t25Flicker { 0%,100% { opacity: 1; } 50% { opacity: .72; } }
      @keyframes t25Pulse  { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
      @keyframes t25Bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(7px); } }
      .t25 .t25-emblem-slow { transform-box: fill-box; transform-origin: center; animation: t25Spin 42s linear infinite; }
      .t25 .t25-emblem-rev  { transform-box: fill-box; transform-origin: center; animation: t25SpinRev 64s linear infinite; }
      .t25 .t25-snow        { animation: t25Snow var(--dur) var(--delay) linear infinite; }
      .t25 .t25-lantern     { animation: t25Rise var(--dur) var(--delay) linear infinite; }
      .t25 .t25-flicker     { animation: t25Flicker 2.4s ease-in-out infinite; }
      .t25 .t25-pulse       { animation: t25Pulse 1.6s ease-in-out infinite; }
      .t25 .t25-bounce      { animation: t25Bounce 2.2s ease-in-out infinite; }
      .t25 :focus-visible   { outline: 2px solid ${t.accent}; outline-offset: 3px; }
      .t25 input::placeholder, .t25 textarea::placeholder { color: ${t.paperMuted}; opacity: 1; }
      .t25 input:focus, .t25 textarea:focus { border-color: ${t.accent} !important; }
      .t25 .t25-carousel { scrollbar-width: none; }
      .t25 .t25-carousel::-webkit-scrollbar { display: none; }
      .t25 .t25-btn:active:not(:disabled) { transform: translateY(2px); }
      @media (prefers-reduced-motion: reduce) {
        .t25 .t25-emblem-slow, .t25 .t25-emblem-rev, .t25 .t25-snow, .t25 .t25-lantern, .t25 .t25-flicker, .t25 .t25-pulse, .t25 .t25-bounce { animation: none !important; }
        .t25 .t25-particles { display: none; }
      }
    `}</style>
  );
}

// ─── Мотивууд ────────────────────────────────────────────────────────────────
const CORNER_POS: Record<string, React.CSSProperties> = {
  tl: { top: 0, left: 0 }, tr: { top: 0, right: 0 }, bl: { bottom: 0, left: 0 }, br: { bottom: 0, right: 0 },
};
const CORNER_FLIP: Record<string, string> = { tl: "none", tr: "scaleX(-1)", bl: "scaleY(-1)", br: "scale(-1,-1)" };

// Жижиг 4 үзүүрт оч (булан, хээнд)
const sparklePath = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r} Z`;

// Булангийн чимэглэл: frost → буланд том цасан ширхэг + оч; vine → ургамал, навч, цэцэг
function Corner({ corner = "tl", size = 150, opacity = 0.14 }: {
  corner?: "tl" | "tr" | "bl" | "br"; size?: number; opacity?: number;
}) {
  const t = useT();
  const common: React.CSSProperties = { position: "absolute", ...CORNER_POS[corner], transform: CORNER_FLIP[corner], opacity, pointerEvents: "none" };

  if (t.corner === "frost") {
    const cx = 12, cy = 12;
    const arms: string[] = [], ticks: string[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3, ca = Math.cos(a), sa = Math.sin(a);
      arms.push(`M${(cx - 44 * ca).toFixed(1)} ${(cy - 44 * sa).toFixed(1)} L${(cx + 44 * ca).toFixed(1)} ${(cy + 44 * sa).toFixed(1)}`);
      for (const s of [-1, 1]) for (const r of [18, 32]) {
        const px = cx + r * ca, py = cy + r * sa, b = a + (s * Math.PI) / 3;
        ticks.push(`M${px.toFixed(1)} ${py.toFixed(1)} L${(px + 9 * Math.cos(b)).toFixed(1)} ${(py + 9 * Math.sin(b)).toFixed(1)}`);
      }
    }
    return (
      <svg aria-hidden="true" width={size} height={size} viewBox="0 0 100 100" style={common}
        fill="none" stroke={t.paper} strokeWidth="1.6" strokeLinecap="round">
        {arms.map((d, i) => <path key={"a" + i} d={d} />)}
        {ticks.map((d, i) => <path key={"t" + i} d={d} strokeWidth="1.2" />)}
        <path d={sparklePath(66, 26, 7)} fill={t.paper} stroke="none" />
        <path d={sparklePath(34, 66, 5)} fill={t.paper} stroke="none" />
        <path d={sparklePath(78, 60, 3.5)} fill={t.paper} stroke="none" />
      </svg>
    );
  }

  const petals = (cx: number, cy: number) =>
    Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2;
      return <circle key={i} cx={(cx + 3.4 * Math.cos(a)).toFixed(1)} cy={(cy + 3.4 * Math.sin(a)).toFixed(1)} r="2.1" />;
    });
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 100 100" style={common}
      fill="none" stroke={t.paper} strokeWidth="1.6" strokeLinecap="round">
      <path d="M0 4 C28 8 44 30 34 62 C30 76 18 86 2 90" />
      <path d="M16 8 C22 14 28 14 32 20" />
      <path d="M36 44 C44 42 50 46 54 54" />
      <ellipse cx="22" cy="12" rx="7" ry="3.4" transform="rotate(-30 22 12)" fill={t.paper} opacity=".55" stroke="none" />
      <ellipse cx="40" cy="32" rx="7" ry="3.4" transform="rotate(58 40 32)" fill={t.paper} opacity=".55" stroke="none" />
      <ellipse cx="28" cy="72" rx="7" ry="3.4" transform="rotate(-52 28 72)" fill={t.paper} opacity=".55" stroke="none" />
      <g fill={t.accent} stroke="none">
        {petals(46, 24)}<circle cx="46" cy="24" r="1.8" fill={t.paper} />
        {petals(56, 56)}<circle cx="56" cy="56" r="1.8" fill={t.paper} />
      </g>
      <path d={sparklePath(72, 18, 6)} fill={t.paper} stroke="none" />
      <path d={sparklePath(14, 50, 4)} fill={t.paper} stroke="none" />
    </svg>
  );
}

// Гол тэмдэг: snowflake → эргэдэг 6 салаат цасан ширхэг; sun → долгиолсон туяатай нар
function Emblem({ size = 200, style = {} }: { size?: number; style?: React.CSSProperties }) {
  const t = useT();
  const base: React.CSSProperties = { display: "block", pointerEvents: "none", overflow: "visible", ...style };

  if (t.emblem === "snowflake") {
    const arms: string[] = [], ticks: string[] = [], tips: [number, number][] = [], hex: string[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3, ca = Math.cos(a), sa = Math.sin(a);
      arms.push(`M100 100 L${(100 + 84 * ca).toFixed(1)} ${(100 + 84 * sa).toFixed(1)}`);
      tips.push([100 + 84 * ca, 100 + 84 * sa]);
      hex.push(`${(100 + 24 * ca).toFixed(1)},${(100 + 24 * sa).toFixed(1)}`);
      for (const r of [40, 62]) for (const s of [-1, 1]) {
        const px = 100 + r * ca, py = 100 + r * sa, b = a + (s * Math.PI) / 3;
        ticks.push(`M${px.toFixed(1)} ${py.toFixed(1)} L${(px + 15 * Math.cos(b)).toFixed(1)} ${(py + 15 * Math.sin(b)).toFixed(1)}`);
      }
    }
    return (
      <svg aria-hidden="true" width={size} height={size} viewBox="0 0 200 200" fill="none" style={base}>
        <defs>
          <filter id="t25halo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10" /></filter>
        </defs>
        <circle cx="100" cy="100" r="76" fill={t.accent} opacity="0.16" filter="url(#t25halo)" />
        <g className="t25-emblem-slow" stroke={t.accentLight} strokeWidth="3" strokeLinecap="round">
          {arms.map((d, i) => <path key={"a" + i} d={d} />)}
          {ticks.map((d, i) => <path key={"t" + i} d={d} strokeWidth="2.2" />)}
          <polygon points={hex.join(" ")} fill={t.accent} opacity="0.3" stroke="none" />
          {tips.map(([x, y], i) => <circle key={"c" + i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="4" fill={t.accentLight} stroke="none" />)}
        </g>
        <circle className="t25-emblem-rev" cx="100" cy="100" r="94" stroke={t.accent} strokeWidth="1.5" strokeDasharray="3 12" opacity="0.55" />
      </svg>
    );
  }

  const rays: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, tip = i % 2 === 0 ? 96 : 82, base = 66, w = 0.11;
    const p = (r: number, ang: number) => `${(100 + r * Math.cos(ang)).toFixed(1)},${(100 + r * Math.sin(ang)).toFixed(1)}`;
    rays.push(`${p(base, a - w)} ${p(tip, a)} ${p(base, a + w)}`);
  }
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 200 200" fill="none" style={base}>
      <defs>
        <filter id="t25halo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10" /></filter>
      </defs>
      <circle cx="100" cy="100" r="80" fill={t.accent} opacity="0.2" filter="url(#t25halo)" />
      <g className="t25-emblem-slow">
        {rays.map((pts, i) => <polygon key={i} points={pts} fill={t.accent} opacity={i % 2 === 0 ? 0.6 : 0.38} />)}
        <circle cx="100" cy="100" r="60" stroke={t.accentLight} strokeWidth="2" />
        <circle cx="100" cy="100" r="48" fill={t.accent} opacity="0.14" />
        <path d="M74 100 a26 26 0 0 1 52 0 a20 20 0 0 1 -40 0 a14 14 0 0 1 28 0 a8 8 0 0 1 -16 0"
          stroke={t.accentLight} strokeWidth="2" strokeLinecap="round" />
      </g>
      <circle className="t25-emblem-rev" cx="100" cy="100" r="98" stroke={t.accent} strokeWidth="1.5" strokeDasharray="3 12" opacity="0.5" />
    </svg>
  );
}

// Дэвсгэр хээ: lattice → мөсөн талстын тор; rays → дээрээс цацрах нарны туяа
function Texture({ style = {} }: { style?: React.CSSProperties }) {
  const t = useT();
  const lattice = t.texture === "lattice";
  return (
    <div aria-hidden="true" style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      opacity: lattice ? 0.06 : 0.05,
      backgroundImage: lattice
        ? `repeating-linear-gradient(45deg, ${t.paper} 0 1px, transparent 1px 22px), repeating-linear-gradient(-45deg, ${t.paper} 0 1px, transparent 1px 22px)`
        : `repeating-conic-gradient(from 0deg at 50% -10%, ${t.paper} 0deg 1.5deg, transparent 1.5deg 10deg)`,
      maskImage: "linear-gradient(135deg, rgba(0,0,0,.9) 30%, transparent 85%)",
      WebkitMaskImage: "linear-gradient(135deg, rgba(0,0,0,.9) 30%, transparent 85%)",
      ...style,
    }} />
  );
}

// Section-уудын хоорондох нэхмэл (lace) зураас
function Lace() {
  const t = useT();
  return (
    <svg aria-hidden="true" width="100%" height="16" style={{ display: "block" }}>
      <defs>
        <pattern id="t25lace" width="24" height="16" patternUnits="userSpaceOnUse">
          <path d="M0 12 a12 12 0 0 1 24 0" fill="none" stroke={t.accent} strokeWidth="1.2" opacity="0.55" />
          <circle cx="12" cy="3" r="1.4" fill={t.accentLight} opacity="0.85" />
        </pattern>
      </defs>
      <rect width="100%" height="16" fill="url(#t25lace)" />
    </svg>
  );
}

// Долгиолсон ирмэгтэй медальон наалт
function Badge({ text, variant = "primary", size = 84, style = {} }: {
  text: string; variant?: "primary" | "accent"; size?: number; style?: React.CSSProperties;
}) {
  const t = useT();
  const pts: string[] = [];
  for (let i = 0; i < 24; i++) {
    const r = i % 2 === 0 ? 48 : 43;
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
  }
  const fill   = variant === "primary" ? t.primary : t.accent;
  const stroke = variant === "primary" ? t.accentLight : t.accentDeep;
  const color  = variant === "primary" ? t.paper : t.onAccent;
  const fontSize = text.length > 5 ? 15 : 19;
  return (
    <div aria-hidden="true" style={{ position: "absolute", width: size, height: size, pointerEvents: "none", filter: `drop-shadow(0 4px 10px ${t.accentGlow})`, ...style }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
        <polygon points={pts.join(" ")} fill={fill} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
        <circle cx="50" cy="50" r="35" fill="none" stroke={stroke} strokeWidth="1" opacity="0.7" />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
          fontFamily="'Playfair Display', serif" fontStyle="italic" fontWeight="600" fontSize={fontSize} fill={color}
          transform="rotate(-8 50 50)">
          {text}
        </text>
      </svg>
    </div>
  );
}

const SNOW = Array.from({ length: 26 }, (_, i) => ({
  id: i, left: (i * 37 + 5) % 100, size: 3 + (i % 4), dur: 9 + (i % 7), delay: -((i * 1.9) % 13), soft: i % 3 === 0,
}));
const LANTERNS = Array.from({ length: 14 }, (_, i) => ({
  id: i, left: (i * 41 + 9) % 100, w: 9 + (i % 4) * 2, dur: 16 + (i % 6) * 2, delay: -((i * 2.3) % 17), dim: i % 3 === 0,
}));

// Хөдөлгөөнт бөөмс: snow → унах цас; lanterns → дээш хөвөх алтан дэнлүү
function Particles() {
  const t = useT();
  return (
    <div className="t25-particles" aria-hidden="true" style={{
      position: "fixed", top: 0, bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "min(523px, 100%)", pointerEvents: "none", overflow: "hidden", zIndex: 6,
    }}>
      {t.particles === "snow"
        ? SNOW.map((s) => (
          <div key={s.id} className="t25-snow" style={{
            position: "absolute", left: s.left + "%", top: 0,
            width: s.size, height: s.size, borderRadius: "50%",
            background: t.paper, opacity: s.soft ? 0.55 : 0.9,
            boxShadow: `0 0 ${s.size * 2}px ${t.accentGlow}`,
            ["--dur" as string]: s.dur + "s", ["--delay" as string]: s.delay + "s",
          }} />
        ))
        : LANTERNS.map((l) => (
          <div key={l.id} className="t25-lantern" style={{
            position: "absolute", left: l.left + "%", top: 0,
            ["--dur" as string]: l.dur + "s", ["--delay" as string]: l.delay + "s",
          }}>
            <div className="t25-flicker" style={{
              width: l.w, height: l.w * 1.5, borderRadius: "3px 3px 5px 5px",
              background: `linear-gradient(180deg, ${t.accentLight}, ${t.accent} 60%, ${t.accentDeep})`,
              borderTop: `2px solid ${t.accentDeep}`, opacity: l.dim ? 0.6 : 0.95,
              boxShadow: `0 0 ${l.w * 1.6}px ${t.accentGlow}, 0 0 ${l.w * 3.2}px ${t.accentGlow}`,
            }} />
          </div>
        ))}
    </div>
  );
}

function Divider() {
  const t = useT();
  const Icon = t.emblem === "snowflake" ? SnowflakeIcon : SunIcon;
  return (
    <div aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "0 auto", maxWidth: 260 }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${t.accent})` }} />
      <Icon size={16} color={t.accent} />
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${t.accent})` }} />
    </div>
  );
}

// ─── Жижиг UI хэсгүүд ────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <div style={{ ...body, fontWeight: 700, fontSize: 13, letterSpacing: "0.24em", textTransform: "uppercase", color: t.accentLight }}>
      {children}
    </div>
  );
}

// Гарчиг: Playfair italic + зөөлөн гэрэл, доор нь оч бүхий жижиг чимэг
function Heading({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <div style={{ textAlign: "center" }}>
      <h2 style={{
        ...display, fontWeight: 600, fontStyle: "italic", fontSize: 32, lineHeight: 1.15,
        color: t.heading, textShadow: `0 0 18px ${t.headingGlow}`, margin: 0,
      }}>
        {children}
      </h2>
      <div aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 }}>
        <span style={{ width: 36, height: 1, background: `linear-gradient(to right, transparent, ${t.accent})` }} />
        <SparkleIcon size={11} color={t.accent} />
        <span style={{ width: 36, height: 1, background: `linear-gradient(to left, transparent, ${t.accent})` }} />
      </div>
    </div>
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
// Бөөрөнхий (pill) товч — primary/accent градиент, hot = шилэн хүрээтэй
function Btn({ variant, icon, children, onClick, href, disabled, style = {} }: BtnProps) {
  const t = useT();
  const base: React.CSSProperties = {
    ...display, fontWeight: 600, fontSize: 18, letterSpacing: "0.02em",
    minHeight: 52, borderRadius: 999, border: "none", padding: "0 24px",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
    cursor: disabled ? "not-allowed" : "pointer", textDecoration: "none",
    opacity: disabled ? 0.55 : 1, transition: "transform .08s, box-shadow .08s, opacity .2s",
    boxSizing: "border-box",
    ...(variant === "primary" ? { background: `linear-gradient(135deg, ${t.primary}, ${t.primaryDeep})`, color: t.paper, boxShadow: `0 8px 22px ${t.primaryDeep}80` } :
        variant === "accent"  ? { background: `linear-gradient(135deg, ${t.accentLight}, ${t.accent} 55%, ${t.accentDeep})`, color: t.onAccent, boxShadow: `0 8px 22px ${t.accentGlow}` } :
                                { background: "rgba(255,255,255,.06)", color: t.accentLight, boxShadow: `inset 0 0 0 1.5px ${t.accent}, 0 0 22px ${t.accentGlow}` }),
    ...style,
  };
  const cls = `t25-btn t25-btn-${variant}`;
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
    background: "rgba(255,255,255,.06)", border: `1.5px solid ${t.lineStrong}`, borderRadius: 12,
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
      <span style={{ ...bodyB, fontSize: 13, letterSpacing: "0.18em", color: t.paperMuted }}>ЗУРАГ</span>
    </div>
  );
}

// Ерөнхий гүнжийн силуэт — demo дээр "энд баатрын зураг орно" гэдгийг харуулах
// PLACEHOLDER. Ямар ч тодорхой дүр биш, бие даасан хэлбэр. Жинхэнэ урилгад
// захиалагч hero.mascot / intro.mascot-д өөрийн зургаа оруулна (доорх Mascot-г үз).
function PrincessSilhouette({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg width="100%" viewBox="0 0 120 185" fill="none" style={{ display: "block", overflow: "visible" }} aria-hidden="true">
      {/* даашинз */}
      <path d="M60 72 C42 100 28 140 22 178 H98 C92 140 78 100 60 72 Z" fill={fill} />
      <path d="M30 152 Q60 164 90 152" stroke={stroke} strokeWidth="1.5" opacity="0.8" />
      <path d="M26 168 H94" stroke={stroke} strokeWidth="2.5" />
      {/* их бие, бүс */}
      <path d="M50 62 C50 56 54 50 60 50 C66 50 70 56 70 62 L72 92 H48 Z" fill={fill} />
      <path d="M48 90 H72" stroke={stroke} strokeWidth="3" />
      {/* гар */}
      <path d="M50 66 L36 98" stroke={fill} strokeWidth="9" strokeLinecap="round" />
      <path d="M70 66 L84 98" stroke={fill} strokeWidth="9" strokeLinecap="round" />
      <circle cx="35" cy="100" r="5" fill={fill} />
      <circle cx="85" cy="100" r="5" fill={fill} />
      {/* толгой, үс */}
      <circle cx="60" cy="34" r="13" fill={fill} />
      <path d="M45 32 A15 15 0 0 1 75 32 L72 28 A12 12 0 0 0 48 28 Z" fill={fill} />
      {/* титэм */}
      <path d="M50 20 L53 11 L58 17 L62 8 L66 17 L71 11 L74 20 Z" fill={stroke} />
      <circle cx="62" cy="8" r="1.8" fill={fill} />
      {/* оч */}
      <path d={sparklePath(94, 40, 6)} fill={stroke} />
      <path d={sparklePath(26, 56, 4)} fill={stroke} />
    </svg>
  );
}

// Hero / intro-д config-оор тавих чимэглэлийн баатрын зураг.
//   hero.mascot / intro.mascot (зургийн URL) → захиалагчийн өгсөн зургийг харуулна.
//   URL байхгүй бол: demo дээр original силуэт (placeholder харагдуулахын тулд),
//   жинхэнэ event дээр юу ч үзүүлэхгүй (хуучин урилга өөрчлөгдөхгүй).
// Тодорхой зохиогчийн эрхтэй дүрийг кодод суулгаагүй — зургийг захиалагч өөрөө оруулна.
function Mascot({ src, demo, side = "left", width = "clamp(112px, 31vw, 156px)", bottom = 0, style = {} }: {
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
        <img src={src} alt="" style={{ width: "100%", height: "auto", display: "block", filter: "drop-shadow(0 8px 18px rgba(0,0,0,.55))" }} />
      ) : (
        <div style={{ transform: side === "right" ? "scaleX(-1)" : "none", filter: `drop-shadow(0 8px 18px ${t.accentGlow})` }}>
          <PrincessSilhouette fill={t.primary} stroke={t.accent} />
        </div>
      )}
    </div>
  );
}

// Section-ийн ерөнхий бүрхүүл: нэхмэл зураас → 48px дээд, 80px доод зай
function Section({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const t = useT();
  return (
    <section style={{ background: t.bg, position: "relative" }}>
      <Lace />
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
        position: "fixed", inset: 0, zIndex: 9999, background: `linear-gradient(180deg, ${t.bg}, ${t.bg2})`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        pointerEvents: exiting ? "none" : "auto", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, left: "50%", transform: "translateX(-50%)", width: "min(523px, 100%)" }}>
        <Texture />
        <Corner corner="tl" size={170} />
        <Corner corner="br" size={170} />
        <Mascot src={mascot} demo={demo} side={mascotSide} />
      </div>
      <div style={{ position: "relative", width: 260, height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Emblem size={260} style={{ position: "absolute", inset: 0 }} />
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
      <div style={{ ...display, fontStyle: "italic", fontWeight: 600, fontSize: 21, color: t.paper, marginTop: 28, textAlign: "center", padding: "0 16px" }}>
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
function T25Hero({ event, started }: { event: EventData; started: boolean }) {
  const t = useT();
  const name    = givenName(cfg(event.config, "hero.name", event.person1_name || "Бяцхан гүнж"));
  const age     = cfg<string | number | null>(event.config, "hero.age", null);
  const eyebrow = cfg(event.config, "hero.eyebrow", "Төрсөн өдрийн урилга");
  const photo   = cfg<string | null>(event.config, "hero.photo", null) || event.person1_photo || event.main_image;
  const mascot     = cfg<string | null>(event.config, "hero.mascot", null);
  const mascotSide = cfg<"left" | "right">(event.config, "hero.mascotSide", "left");

  // Playfair нь Oswald-аас өргөн тул хэмжээ арай бага
  const nameSize =
    name.length <= 8  ? "clamp(44px, 14vw, 64px)" :
    name.length <= 11 ? "clamp(36px, 11vw, 52px)" :
    name.length <= 15 ? "clamp(28px, 8.5vw, 40px)" :
                        "clamp(24px, 7vw, 32px)";

  const show = (delay: number) => ({
    initial: { opacity: 0, y: 22 },
    animate: started ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 },
    transition: { duration: 1, delay, ease: "easeOut" as const },
  });
  const scrollNext = () => document.getElementById("t25-letter")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <header style={{
      minHeight: "100svh", background: `linear-gradient(180deg, ${t.bg} 0%, ${t.bg2} 100%)`, position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "56px 16px 72px", boxSizing: "border-box", textAlign: "center",
    }}>
      <Texture />
      <Corner corner="tr" size={160} />
      <Corner corner="bl" size={120} opacity={0.1} />
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(60% 40% at 50% 48%, ${t.accentGlow}, transparent 70%)`,
      }} />

      <motion.div {...show(0.1)} style={{ position: "relative", zIndex: 2 }}>
        <Eyebrow>{eyebrow}</Eyebrow>
      </motion.div>

      <motion.h1 {...show(0.3)} style={{
        ...display, fontWeight: 600, fontStyle: "italic", fontSize: nameSize, lineHeight: 1.05,
        color: t.paper, margin: "12px 0 4px", position: "relative", zIndex: 2,
        textShadow: `0 0 28px ${t.headingGlow}, 0 2px 0 ${t.bg}`,
        maxWidth: "100%", overflowWrap: "anywhere",
      }}>
        {name}
      </motion.h1>

      {/* 358×400 бүтэц: тэмдэг → титэмтэй зууван зураг → насны тэмдэг */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={started ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
        transition={{ duration: 1.1, delay: 0.5, ease: "easeOut" }}
        style={{ position: "relative", width: "100%", maxWidth: 358, height: 400, zIndex: 2 }}
      >
        <Emblem size={330} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }} />

        <svg width="220" height="270" viewBox="0 0 100 123" aria-hidden={!photo}
          style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", overflow: "visible",
                   filter: `drop-shadow(0 0 18px ${t.accentGlow})` }}>
          <defs><clipPath id="t25oval"><ellipse cx="50" cy="61.5" rx="46" ry="58" /></clipPath></defs>
          <ellipse cx="50" cy="61.5" rx="46" ry="58" fill={t.bg3} />
          {photo ? (
            <image href={photo} x="0" y="0" width="100" height="123" preserveAspectRatio="xMidYMid slice" clipPath="url(#t25oval)" />
          ) : (
            <text x="50" y="66" textAnchor="middle" fontFamily="'PT Sans', sans-serif" fontWeight="700" fontSize="9" letterSpacing="1.5" fill={t.paperMuted}>ЗУРАГ</text>
          )}
          <ellipse cx="50" cy="61.5" rx="46" ry="58" fill="none" stroke={t.accent} strokeWidth="3" />
          <ellipse cx="50" cy="61.5" rx="42" ry="54" fill="none" stroke={t.accentLight} strokeWidth="0.8" opacity="0.8" />
          {/* титэм — хүрээний дээр */}
          <g transform="translate(50 -1)" fill={t.accent} stroke={t.accentDeep} strokeWidth="0.6" strokeLinejoin="round">
            <path d="M-14 6 L-10 -4 L-5 2 L0 -8 L5 2 L10 -4 L14 6 Z" />
            <circle cx="-10" cy="-4" r="1.3" fill={t.accentLight} stroke="none" />
            <circle cx="0" cy="-8" r="1.6" fill={t.accentLight} stroke="none" />
            <circle cx="10" cy="-4" r="1.3" fill={t.accentLight} stroke="none" />
          </g>
        </svg>

        {age !== null && age !== "" && (
          <div style={{
            position: "absolute", left: "50%", top: "50%", transform: "translate(52px, 72px)",
            width: 118, height: 118, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Emblem size={118} style={{ position: "absolute", inset: 0 }} />
            <div style={{ position: "relative", textAlign: "center", background: t.bg, borderRadius: "50%", width: 64, height: 64, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 1.5px ${t.accent}` }}>
              <div style={{ ...display, fontWeight: 600, fontSize: 36, lineHeight: 0.9, color: t.heading, textShadow: `0 0 12px ${t.headingGlow}` }}>
                {String(age)}
              </div>
              <div style={{ ...bodyB, fontSize: 11, letterSpacing: "0.2em", color: t.paper, marginTop: 4, marginRight: "-0.2em" }}>НАС</div>
            </div>
          </div>
        )}

        <Badge text={t.badge1} variant="primary" size={84} style={{ right: -4, top: 22, transform: "rotate(10deg)" }} />
      </motion.div>

      <motion.div {...show(0.9)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 10, position: "relative", zIndex: 2, width: "100%", maxWidth: 358 }}>
        <div style={{ width: 28, height: 1, background: t.accent, flexShrink: 0 }} />
        <div style={{ ...display, fontWeight: 600, fontSize: 20, color: t.accent, lineHeight: 1.2 }}>
          {fmtDate(event.date)}{event.time ? ` · ${event.time}` : ""}
        </div>
        <div style={{ width: 28, height: 1, background: t.accent, flexShrink: 0 }} />
      </motion.div>

      <motion.button type="button" onClick={scrollNext} aria-label="Доош гүйлгэх"
        initial={{ opacity: 0 }} animate={started ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 1, delay: 1.4 }}
        style={{ position: "absolute", bottom: 18, left: "50%", marginLeft: -26, width: 52, height: 52, background: "transparent", border: "none", cursor: "pointer", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="t25-bounce"><ChevronsIcon size={28} color={t.accentLight} /></div>
      </motion.button>

      <Mascot src={mascot} demo={event.id === "demo"} side={mascotSide} />
    </header>
  );
}

// ─── Урилгын үг ──────────────────────────────────────────────────────────────
const T25_DEFAULT_POEM = [
  "Бяцхан гүнж маань нэг нас нэмж байна…",
  "Инээд хөөр, ид шидээр дүүрэн",
  "гэрэлт баяраа хамтдаа тэмдэглэе.",
  "Та бүхнийг хүрэлцэн ирэхийг урьж байна!",
];

function T25Letter({ event }: { event: EventData }) {
  const t = useT();
  const lines = getPoemLines(event, T25_DEFAULT_POEM);
  return (
    <div id="t25-letter">
      <Section>
        <FadeUp>
          <div style={{
            background: t.bg3, border: `1px solid ${t.line}`, borderRadius: 20, boxShadow: SHADOW_CARD,
            padding: "32px 24px 24px", position: "relative", overflow: "hidden",
          }}>
            <Corner corner="tr" size={140} />
            <div style={{ ...display, fontStyle: "italic", fontSize: 20, lineHeight: "32px", color: t.paper, textAlign: "center", position: "relative" }}>
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

function T25Gallery({ event }: { event: EventData }) {
  const t = useT();
  const title = cfg(event.config, "gallery.title", "Бяцхан гүнжийн цомог");
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
    <Section style={{ paddingLeft: 0, paddingRight: 0 }}>
      <FadeUp><Heading>{title}</Heading></FadeUp>

      <div ref={trackRef} className="t25-carousel" onScroll={onScroll}
        style={{
          display: "flex", gap: CARD_GAP, overflowX: "auto", scrollSnapType: "x mandatory",
          paddingInline: `calc(50% - ${CARD_W / 2}px)`, paddingBlock: "36px 20px", WebkitOverflowScrolling: "touch",
        }}>
        {sources.map((src, i) => {
          const isActive = i === active;
          return (
            <figure key={i} style={{
              flex: `0 0 ${CARD_W}px`, width: CARD_W, margin: 0, scrollSnapAlign: "center",
              background: t.paper, padding: 6, borderRadius: 16,
              transform: `rotate(${i % 2 === 0 ? -2.5 : 2.5}deg)`,
              boxShadow: isActive ? `0 10px 28px ${t.accentGlow}` : SHADOW_CARD,
              outline: isActive ? `3px solid ${t.accent}` : "none", outlineOffset: 0,
              transition: "box-shadow .3s, outline-color .3s",
            }}>
              <div style={{ border: `3px solid ${t.accentDeep}`, borderRadius: 11, aspectRatio: "4 / 5", overflow: "hidden", background: t.bg3 }}>
                <Photo src={src} alt={`Зураг ${i + 1}`} />
              </div>
              {isActive && captions[i % captions.length] && (
                <figcaption style={{ ...display, fontStyle: "italic", fontWeight: 600, fontSize: 15, color: t.bg, textAlign: "center", padding: "8px 4px 2px" }}>
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
function T25Countdown({ event }: { event: EventData }) {
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
  const name   = givenName(cfg(event.config, "hero.name", event.person1_name || "Бяцхан гүнж"));
  const calUrl = calendarUrl(event, `${name} — төрсөн өдөр`);

  return (
    <Section>
      <Texture />
      <FadeUp style={{ position: "relative" }}>
        <div style={{ position: "relative" }}>
          <Heading>Баяр эхлэхэд</Heading>
          <Badge text={t.badge2} variant="accent" size={72} style={{ right: 0, top: -40, transform: "rotate(12deg)" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 36 }}>
          {units.map((u) => (
            <div key={u.l} style={{
              background: "rgba(255,255,255,.06)", border: `1.5px solid ${t.accent}`, borderRadius: 14,
              boxShadow: `0 0 18px ${t.accentGlow}, 0 14px 22px rgba(6,10,30,.5)`,
              padding: "16px 4px 12px", textAlign: "center", position: "relative", overflow: "hidden",
            }}>
              <span aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "rgba(255,255,255,.07)" }} />
              <div style={{ ...display, fontWeight: 600, fontSize: 38, lineHeight: 1, color: t.hot, fontVariantNumeric: "tabular-nums", textShadow: `0 0 14px ${t.hotGlow}` }}>
                {pad(u.v)}
              </div>
              <div style={{ ...bodyB, fontSize: 12, textTransform: "uppercase", color: t.paperMuted, marginTop: 8, letterSpacing: "0.06em" }}>{u.l}</div>
            </div>
          ))}
        </div>

        {calUrl && (
          <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
            <Btn variant="hot" href={calUrl} icon={<CalendarIcon size={20} color={t.accentLight} />}>Календарьт нэмэх</Btn>
          </div>
        )}
      </FadeUp>
    </Section>
  );
}

// ─── Хөтөлбөр ────────────────────────────────────────────────────────────────
function T25Schedule({ event }: { event: EventData }) {
  const t = useT();
  const [hh, mm] = (event.time || "15:00").split(":").map(Number);
  const fmt = (h: number, m: number) =>
    String(Math.floor(h + m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  const items = getSchedule(event, [
    { time: fmt(hh, mm),          label: "Угтах" },
    { time: fmt(hh, mm + 30),     label: t.key === "ice" ? "Тоглоом, ид шидийн сорил" : "Тоглоом, дэнлүү чимэглэх" },
    { time: fmt(hh + 1, mm + 30), label: "Бялуу зүсэх" },
  ]);
  const [IconA, IconB] = t.scheduleIcons;

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
              {i % 2 === 0 ? <IconA size={18} color={t.accent} /> : <IconB size={18} color={t.accent} />}
            </div>
            <div style={{ background: t.bg3, borderRadius: 16, padding: "14px 16px", boxShadow: SHADOW_CARD }}>
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
function T25Location({ event }: { event: EventData }) {
  const t = useT();
  const mapHref = event.venue_map_url
    ? normalizeUrl(event.venue_map_url)
    : event.venue_name ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(event.venue_name) : "";

  return (
    <Section>
      <FadeUp><Heading>Хаана</Heading></FadeUp>
      <FadeUp delay={0.1}>
        <div style={{ marginTop: 32, background: t.bg2, padding: 6, borderRadius: 20, border: `3px solid ${t.accent}`, boxShadow: `${SHADOW_CARD}, 0 0 22px ${t.accentGlow}` }}>
          <div style={{ aspectRatio: "16 / 10", borderRadius: 12, overflow: "hidden", border: `1px solid ${t.accentLight}`, position: "relative", background: t.bg3 }}>
            {event.maps_photo ? (
              <Photo src={event.maps_photo} alt={event.venue_name} />
            ) : (
              <div aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
                <div style={{ position: "absolute", inset: 0, opacity: 0.25, backgroundImage: `linear-gradient(${t.lineStrong} 1px, transparent 1px), linear-gradient(90deg, ${t.lineStrong} 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
                <div style={{ position: "absolute", left: -20, right: -20, top: "55%", height: 10, background: t.line, transform: "rotate(-18deg)" }} />
                <div style={{ position: "absolute", left: -20, right: -20, top: "40%", height: 6, background: t.line, transform: "rotate(24deg)" }} />
                <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -80%)" }}>
                  <PinIcon size={44} color={t.accent} />
                </div>
              </div>
            )}
          </div>
        </div>
      </FadeUp>
      <FadeUp delay={0.15} style={{ textAlign: "center", marginTop: 24 }}>
        {event.venue_name && (
          <div style={{ ...display, fontWeight: 600, fontSize: 22, color: t.paper, lineHeight: 1.2 }}>{event.venue_name}</div>
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
function T25Request({ event }: { event: EventData }) {
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
                <div aria-hidden="true" style={{ position: "absolute", inset: 6, background: t.bg3, border: `2px solid ${t.accent}`, borderRadius: "50%", boxShadow: `0 0 14px ${t.accentGlow}` }} />
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
  { name: "Болд ах",    message: "Төрсөн өдрийн мэнд хүргэе, бяцхан гүнж минь! Үргэлж инээмсэглэж, эрүүл саруул байгаарай." },
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
      position: "relative", background: t.bg3, border: `1.5px solid ${t.accent}`, borderRadius: 18,
      padding: "14px 16px 12px", boxShadow: SHADOW_CARD, maxWidth: "88%",
      alignSelf: side === "left" ? "flex-start" : "flex-end",
    }}>
      <p style={{ ...body, fontSize: 16, lineHeight: "24px", color: t.paper, margin: 0 }}>{wish.message}</p>
      <div style={{ ...display, fontStyle: "italic", fontWeight: 600, fontSize: 15, color: t.accent, marginTop: 8, textAlign: side === "left" ? "left" : "right" }}>— {wish.name}</div>
      <span aria-hidden="true" style={tail} />
      <span aria-hidden="true" style={tailInner} />
    </div>
  );
}

function T25Wishes({ eventId }: { eventId: string }) {
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
          <Field id="t25-wish-name" label="Нэр" value={name} onChange={setName} placeholder="Таны нэр" />
          <Field id="t25-wish-msg" label="Ерөөлөө бичнэ үү" textarea value={message} onChange={setMessage} placeholder="Бяцхан гүнжид зориулсан үг" />
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
function T25RSVP({ event }: { event: EventData }) {
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
          background: disabled ? t.bg3 : `linear-gradient(135deg, ${t.accentLight}, ${t.accent} 55%, ${t.accentDeep})`,
          color: disabled ? t.paperMuted : t.onAccent,
          ...display, fontWeight: 600, fontSize: 24, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: disabled ? "none" : `0 6px 16px ${t.accentGlow}`, flexShrink: 0,
        }}>
        {dir < 0 ? "−" : "+"}
      </button>
    );
  };

  return (
    <Section>
      <Texture />
      <FadeUp style={{ position: "relative" }}>
        <Heading>Ирцээ бүртгүүлэх</Heading>
        <div style={{ background: t.bg3, borderRadius: 20, padding: 24, marginTop: 32, boxShadow: SHADOW_CARD, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field id="t25-rsvp-name" label="Нэр" value={name} onChange={setName} placeholder="Таны нэр" />
          <Field id="t25-rsvp-phone" label="Утас" type="tel" inputMode="numeric" value={phone} onChange={setPhone} placeholder="9900 1122" />
          <div>
            <div style={{ ...bodyB, fontSize: 14, lineHeight: "20px", color: t.paper, marginBottom: 8 }}>Хүний тоо</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, minHeight: 52 }}>
              {stepBtn(-1)}
              <div aria-live="polite" style={{ ...display, fontWeight: 600, fontSize: 24, color: t.paper, minWidth: 40, textAlign: "center" }}>{guests}</div>
              {stepBtn(1)}
            </div>
          </div>
          <Field id="t25-rsvp-msg" label="Мессеж" textarea value={message} onChange={setMessage} placeholder="Нэмэлт мэдээлэл" />
          {done ? (
            <div role="status" style={{
              ...display, fontStyle: "italic", fontWeight: 600, fontSize: 18, color: t.accent, textAlign: "center",
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
          <div style={{ ...body, fontSize: 13, lineHeight: "18px", color: t.paperMuted, textAlign: "center" }}>{note}</div>
        </div>
      </FadeUp>
    </Section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function T25Footer({ event }: { event: EventData }) {
  const t = useT();
  const title  = cfg(event.config, "footer.title", "Таньтай уулзахыг тэсэн ядан хүлээж байна");
  const lines  = cfg<string[]>(event.config, "footer.lines", []);
  const phones = cfg<string[]>(event.config, "footer.phones", []);
  const img    = cfg<string | null>(event.config, "footer.image", null) || event.gallery_photos?.[0] || event.main_image;

  return (
    <footer style={{ background: t.bg, position: "relative" }}>
      <Lace />
      <div style={{ position: "relative", height: 380 }}>
        <Photo src={img} alt="" />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${t.bg}26, ${t.bg})` }} />
      </div>
      <div style={{ padding: "0 16px 96px", marginTop: -70, position: "relative", textAlign: "center" }}>
        <FadeUp>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><HeartIcon size={22} color={t.accent} /></div>
          <div style={{ ...display, fontStyle: "italic", fontWeight: 600, fontSize: 30, lineHeight: 1.15, color: t.heading, textShadow: `0 0 18px ${t.headingGlow}` }}>
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
                  <span style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${t.primary}, ${t.primaryDeep})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
        background: t.bg, border: `2px solid ${t.accent}`,
        boxShadow: `0 0 0 1px ${t.accentLight}, 0 0 18px ${t.accentGlow}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
      <div className={playing ? "t25-pulse" : undefined}>
        {playing ? <NoteIcon size={24} color={t.hot} /> : <NoteOffIcon size={24} color={t.hot} />}
      </div>
    </button>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
export function PrincessBirthday({ event, theme }: { event: EventData; theme: Theme["key"] }) {
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

  // Дуу: autoplay хориг тул хэрэглэгчийн анхны хөдөлгөөн дээр асна. Hero гарсан
  // (started) бөгөөд дуу хараахан тоглоогүй бол — intro-гүй үед эхнээсээ, видео
  // intro-д видео дууссаны дараа. Дарж нээх intro-д start() gesture дотор play
  // хийдэг тул paused=false → энд юу ч хийхгүй; хориглогдсон бол fallback болно.
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
      <div className="t25" lang="mn" style={{ maxWidth: 523, margin: "0 auto", ...body, overflowX: "clip", background: t.bg, color: t.paper }}>
        <Styles />
        {introVideo === undefined && !started && (
          <TapIntro onOpen={start}
            mascot={cfg<string | null>(event.config, "intro.mascot", null)}
            mascotSide={cfg<"left" | "right">(event.config, "intro.mascotSide", "left")}
            demo={event.id === "demo"} />
        )}
        {typeof introVideo === "string" && <VideoIntro src={introVideo} onDone={start} />}
        <Particles />

        <T25Hero event={event} started={started} />
        <T25Letter event={event} />
        <T25Gallery event={event} />
        <T25Countdown event={event} />
        {sectionOn(event.config, "schedule") && <T25Schedule event={event} />}
        <T25Location event={event} />
        {sectionOn(event.config, "request") && <T25Request event={event} />}
        {sectionOn(event.config, "wishes") && <T25Wishes eventId={event.id} />}
        {sectionOn(event.config, "rsvp") && <T25RSVP event={event} />}
        <T25Footer event={event} />

        <audio ref={audioRef} loop src={event.music_url ?? ""} preload="auto" />
        {event.music_url && <MusicToggle audioRef={audioRef} />}
        <Toaster />
      </div>
    </ThemeCtx.Provider>
  );
}

// Template 25 — Мөсөн гүнж (ice) theme
export default function Template25({ event }: { event: EventData }) {
  return <PrincessBirthday event={event} theme="ice" />;
}
