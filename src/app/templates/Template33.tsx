import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useInView, useScroll, useTransform } from "motion/react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { EventData } from "../../types/event";
import { getPoemLines, getSchedule } from "../../lib/eventContent";
import { cfg, sectionOn } from "../../lib/eventConfig";
import { normalizeUrl } from "../../lib/url";

// ─── Template 33 — клубын ойн баярын (гала) урилга ───────────────────────────
// Theme "onyx": хар-оникс дэвсгэр + шампань алт. Зорилтот үзэгч — клубын гишүүд,
// түншүүд, хүндэт зочид (25–55 нас): тансаг, албан боловч дулаан.
// Мотив: алтан цагирагтай клубын лого (эргэдэг тойрог бичигтэй), ойн ТОО дээш
// тоологдож гарна (0 → 10), алтан гялалзаа (fixed overlay), алтан шугам + од зааг.
// Intro: T13-ын дугтуй нээх видео (анхдагч; intro.video: URL / false). intro.logo: true →
// оронд нь лого дарахад алтан цагираг тэлж, оч цацарна → hero.
//
// Section: intro → hero (лого, ойн тоо, клубын нэр, огноо) → урилгын үг (?to= нэр)
// → замнал (тоо баримт + он цагийн хэлхээ) → цомог (lightbox) → хөтөлбөр → хувцаслалт
// → тоологч → байршил → мэндчилгээ → ирц → footer. Түлхүүрүүд: docs/event-config.md § T33.
// Дата: events.title = клубын нэр, main_image = нүүрний (cover) зураг, gallery_photos = цомог.
// OG preview: events.type = 'anniversary' (api/invite.js — "{клуб} — Ойн баярын урилга").
// Хувь хүнд нэртэй урилга: /i/slug?to=Б.%20Батбаяр → урилгын үгийн дээр "Эрхэм хүндэт Б. Батбаяр".

// ─── Theme ───────────────────────────────────────────────────────────────────
type Theme = {
  key: "onyx";
  bg: string; bg2: string; card: string; cardLine: string;   // хуудас / хоёрдогч хэсэг / карт / картын хүрээ
  paper: string; paperMuted: string; paperDim: string;        // бичиг бараан дэвсгэр дээр
  gold: string; goldLight: string; goldDeep: string; goldGlow: string; onGold: string;
  tagline: string;
};
type Tone = "bg" | "bg2";

const ThemeCtx = createContext<Theme | null>(null);
const useT = () => useContext(ThemeCtx)!;

// Cormorant Garamond — гарчиг, ойн тоо (ө/ү үсэг цэвэр, T11/T12-т монгол текстээр батлагдсан);
// PT Sans — бичвэр ба том үсгийн шошго (cyrillic-ext бүрэн). Playfair Display / Oswald-ын
// ө/ү сонин харагдсан тул солив. Бүгд index.html-д ачаалагдсан.
const display = { fontFamily: "'Cormorant Garamond', 'PT Serif', serif" } as const;
const caps    = { fontFamily: "'PT Sans', 'Segoe UI', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em" } as const;
const body    = { fontFamily: "'PT Sans', 'Segoe UI', sans-serif" } as const;
const bodyB   = { fontFamily: "'PT Sans', 'Segoe UI', sans-serif", fontWeight: 700 } as const;

const SHADOW_CARD = "0 14px 36px rgba(0,0,0,.35)";

// Анхдагч intro — Template13-ын дугтуй нээх видео (T27-той ижил; config.intro.video-оор солигдоно)
const T33_INTRO_VIDEO = "https://premiumelegante.thedigitalyes.com/assets/intro-video-new-XmwQeafK.mp4";

const THEMES: Record<Theme["key"], Theme> = {
  onyx: {
    key: "onyx",
    bg: "#0B0C12", bg2: "#12131C", card: "#181926", cardLine: "rgba(212,175,106,.22)",
    paper: "#F5EFE2", paperMuted: "rgba(245,239,226,.70)", paperDim: "rgba(245,239,226,.45)",
    gold: "#D4AF6A", goldLight: "#F1DEAE", goldDeep: "#9C7A3A", goldGlow: "rgba(212,175,106,.35)", onGold: "#15120A",
    tagline: "Хамтдаа бүтээсэн он жилүүд",
  },
};

// ─── Demo агуулга (DEMO_EVENT нь хуримын дата тул клубынхаар орлуулна) ────────
const U = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80`;
// Он жилүүд нь DEMO_EVENT.date-ийн оноос хамааран тооцогдоно (ой = 10 жил байхаар)
const DEMO = {
  club: "Алтан Гадас клуб",
  years: 10,
  cover: U("1519167758481-83f550bb49b3", 1400),
  gallery: [
    U("1516997121675-4c2d1684aa3e"), U("1492684223066-81342ee5ff30"), U("1511795409834-ef04bbd61622"),
    U("1478147427282-58a87a120781"), U("1543007630-9710e4a00a20"), U("1540575467063-178a50c2df87"),
  ],
  stats: [{ value: 10, label: "Жил" }, { value: 120, suffix: "+", label: "Гишүүн" }, { value: 48, label: "Төсөл" }],
  // ago = баярын оноос хэдэн жилийн өмнө
  history: [
    { ago: 10, text: "12 гишүүнтэй үүсгэн байгуулагдав" },
    { ago: 7,  text: "Анхны нийгмийн хариуцлагын төсөл амжилттай хэрэгжив" },
    { ago: 3,  text: "100 дахь гишүүнээ элсүүлж, бүсийн клубуудтай хамтрав" },
    { ago: 0,  text: "Арван жилийн ой" },
  ],
  dress: { code: "Black Tie", note: "Эрэгтэй: хар костюм, эрвээхэй зангиа · Эмэгтэй: урт үдшийн даашинз", colors: ["#0B0C12", "#D4AF6A", "#F5EFE2"] },
  wishes: [
    { name: "Б. Батбаяр", message: "Арван жилийн ойн мэнд хүргэе! Клубын гал голомт цаашид ч бадарч, улам олон сайхан үйлс бүтээх болтугай." },
    { name: "Түнш байгууллага", message: "Хамтын ажиллагаа маань үргэлжлэн бэхжиж, дараагийн арван жил бүр ч гэрэлтэй байх болтугай." },
  ],
};

type Stat = { value: number; suffix?: string; label: string };
type Milestone = { year: string; text: string };
type Wish = { name: string; message: string };

const T33_DEFAULT_POEM = [
  "Нэг зорилго, нэг итгэлээр нэгдэн",
  "хамтдаа туулсан он жилүүдийн",
  "ойг тэмдэглэх онцгой үдэшлэгт",
  "",
  "Та бүхнийг хүндэтгэн урьж байна.",
];

// ─── Icons (inline SVG, 24×24) ───────────────────────────────────────────────
type IconFn = ({ size, color }: { size?: number; color?: string }) => React.ReactElement;
const ico = (size: number, color: string, children: React.ReactNode, filled = false) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? color : "none"} stroke={filled ? "none" : color}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
    {children}
  </svg>
);
const StarIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M12 2 L14.6 8.6 L21.5 9.2 L16.2 13.8 L17.9 20.6 L12 17 L6.1 20.6 L7.8 13.8 L2.5 9.2 L9.4 8.6 Z" />, true);
const SparkIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M12 2c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10Z" />, true);
const PinIcon: IconFn      = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></>);
const SendIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M21 3 10 14" /><path d="M21 3 14 21l-4-7-7-4Z" /></>);
const PhoneIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />);
const CameraIcon: IconFn   = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M4 8h3l2-3h6l2 3h3v12H4Z" /><circle cx="12" cy="13" r="3.5" /></>);
const MusicIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>);
const MusicOffIcon: IconFn = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /><path d="M3 3l18 18" /></>);
const ChevronsIcon: IconFn = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M6 6l6 6 6-6" /><path d="M6 12l6 6 6-6" /></>);
const CloseIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M6 6l12 12M18 6 6 18" />);
const ArrowLeftIcon: IconFn  = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M15 5l-7 7 7 7" />);
const ArrowRightIcon: IconFn = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M9 5l7 7-7 7" />);
const GlassIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M8 2h8l-1 9a3 3 0 0 1-6 0Z" /><path d="M12 14v7M8 21h8" /></>);
const MicIcon: IconFn      = ({ size = 24, color = "currentColor" }) => ico(size, color, <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></>);
const TrophyIcon: IconFn   = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M7 4h10v5a5 5 0 0 1-10 0Z" /><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6" /></>);
const DinnerIcon: IconFn   = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M3 15h18" /><path d="M5 15a7 7 0 0 1 14 0" /><path d="M12 6V8M3 19h18" /></>);
const ShirtIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3a4 4 0 0 1-8 0Z" />);
const ClockIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);

// ─── global styles ───────────────────────────────────────────────────────────
function Styles() {
  const t = useT();
  return (
    <style>{`
      @keyframes t33Shimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
      @keyframes t33Twinkle {
        0%   { opacity: 0; transform: translateY(0) scale(.6); }
        20%  { opacity: .9; }
        60%  { opacity: .4; transform: translateY(40vh) scale(1); }
        100% { opacity: 0; transform: translateY(100vh) scale(.5); }
      }
      @keyframes t33Spin   { to { transform: rotate(360deg); } }
      @keyframes t33Ring   { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(1.55); opacity: 0; } }
      @keyframes t33Pulse  { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
      @keyframes t33Bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
      .t33 .t33-gold {
        background: linear-gradient(100deg, ${t.goldDeep} 0%, ${t.gold} 25%, #FBF0CF 50%, ${t.gold} 75%, ${t.goldDeep} 100%);
        background-size: 200% auto;
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent; color: transparent;
        animation: t33Shimmer 6s linear infinite;
      }
      .t33 .t33-spark  { animation: t33Twinkle var(--dur) var(--delay) linear infinite; }
      .t33 .t33-spin   { animation: t33Spin 40s linear infinite; transform-origin: center; }
      .t33 .t33-ring   { animation: t33Ring 2.2s ease-out infinite; }
      .t33 .t33-pulse  { animation: t33Pulse 1.6s ease-in-out infinite; }
      .t33 .t33-bounce { animation: t33Bounce 2.4s ease-in-out infinite; }
      .t33 :focus-visible { outline: 2px solid ${t.gold}; outline-offset: 3px; }
      .t33 input::placeholder, .t33 textarea::placeholder { color: ${t.paperDim}; }
      .t33 input:focus, .t33 textarea:focus { border-color: ${t.gold} !important; box-shadow: 0 0 0 3px ${t.goldGlow}; }
      .t33 .t33-btn:active:not(:disabled) { transform: translateY(2px); }
      @media (prefers-reduced-motion: reduce) {
        .t33 .t33-gold, .t33 .t33-spark, .t33 .t33-spin, .t33 .t33-ring, .t33 .t33-pulse, .t33 .t33-bounce { animation: none !important; }
        .t33 .t33-sparks { display: none; }
      }
    `}</style>
  );
}

// ─── Мотивууд ────────────────────────────────────────────────────────────────
// Алтан гялалзаа — дээрээс зөөлөн унах жижиг оч, fixed overlay
const SPARKS = Array.from({ length: 16 }, (_, i) => ({
  id: i, left: (i * 41 + 7) % 100, size: 2 + (i % 3), dur: 16 + (i % 5) * 3, delay: -((i * 2.7) % 19),
}));
function Sparks() {
  const t = useT();
  return (
    <div className="t33-sparks" aria-hidden="true" style={{
      position: "fixed", top: 0, bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "min(523px, 100%)", pointerEvents: "none", overflow: "hidden", zIndex: 6,
    }}>
      {SPARKS.map((s) => (
        <div key={s.id} className="t33-spark" style={{
          position: "absolute", left: s.left + "%", top: 0, width: s.size, height: s.size, borderRadius: "50%",
          background: t.goldLight, boxShadow: `0 0 ${s.size * 3}px ${t.gold}`, opacity: 0,
          ["--dur" as string]: s.dur + "s", ["--delay" as string]: s.delay + "s",
        }} />
      ))}
    </div>
  );
}

// Логоны эргэн тойрны эргэдэг тойрог бичиг ("АЛТАН ГАДАС КЛУБ · 2016 — 2026 ·")
function OrbitText({ text, size }: { text: string; size: number }) {
  const t = useT();
  const id = "t33o" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const c = size / 2, r = size / 2 - 8;
  const unit = text.toUpperCase() + "  ·  ";
  // Тойргийн уртад багтах тооны давталт (Oswald 10px + 0.3em зай ≈ 8.6px/тэмдэгт)
  const reps = Math.max(1, Math.floor((2 * Math.PI * r) / (unit.length * 8.6)));
  return (
    <svg className="t33-spin" aria-hidden="true" width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <path id={id} d={`M ${c} ${c} m -${r} 0 a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 -${2 * r} 0`} />
      </defs>
      <text style={{ ...caps, fontSize: 10, letterSpacing: "0.3em" }} fill={t.gold} opacity="0.9">
        <textPath href={`#${id}`}>{unit.repeat(reps)}</textPath>
      </text>
    </svg>
  );
}

// Лого байхгүй үед: од + клубын нэрийн эхний үсгүүд
function LogoMark({ initials, size }: { initials: string; size: number }) {
  const t = useT();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: size * 0.04 }}>
      <StarIcon size={size * 0.17} color={t.gold} />
      <div style={{ ...display, fontWeight: 700, fontSize: size * 0.38, lineHeight: 1, color: t.goldLight, letterSpacing: "0.04em" }}>
        {initials}
      </div>
    </div>
  );
}

// Алтан цагирагтай клубын лого; orbit өгвөл эргэн тойронд эргэдэг бичиг
function LogoRing({ src, name, size = 112, orbit }: { src?: string | null; name: string; size?: number; orbit?: string }) {
  const t = useT();
  const initials = name.split(/\s+/).filter((w) => /\p{L}/u.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  const box = orbit ? size + 60 : size;
  return (
    <div style={{ position: "relative", width: box, height: box, display: "grid", placeItems: "center", flexShrink: 0 }}>
      {orbit && <OrbitText text={orbit} size={box} />}
      <div style={{
        width: size, height: size, borderRadius: "50%", padding: 3, boxSizing: "border-box",
        background: `conic-gradient(from 20deg, ${t.goldDeep}, ${t.goldLight}, ${t.gold}, ${t.goldDeep}, ${t.goldLight}, ${t.goldDeep})`,
        boxShadow: `0 0 0 1px rgba(212,175,106,.18), 0 16px 44px ${t.goldGlow}`,
      }}>
        <div style={{
          width: "100%", height: "100%", borderRadius: "50%", background: t.card, border: `3px solid ${t.bg}`,
          boxSizing: "border-box", overflow: "hidden", display: "grid", placeItems: "center",
        }}>
          {src
            ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "13%", boxSizing: "border-box", display: "block" }} />
            : <LogoMark initials={initials || "★"} size={size} />}
        </div>
      </div>
    </div>
  );
}

function Divider() {
  const t = useT();
  return (
    <div aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "0 auto", maxWidth: 240 }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${t.gold})` }} />
      <SparkIcon size={14} color={t.gold} />
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${t.gold})` }} />
    </div>
  );
}

// ─── Жижиг UI хэсгүүд ────────────────────────────────────────────────────────
function Heading({ kicker, children }: { kicker?: string; children: React.ReactNode }) {
  const t = useT();
  return (
    <div style={{ textAlign: "center", marginBottom: 28 }}>
      {kicker && <div style={{ ...caps, fontSize: 12, color: t.gold, marginBottom: 10 }}>{kicker}</div>}
      <h2 style={{ ...display, fontWeight: 600, fontSize: 36, lineHeight: 1.15, color: t.paper, margin: 0 }}>{children}</h2>
      <div style={{ marginTop: 14 }}><Divider /></div>
    </div>
  );
}

function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
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
  variant: "gold" | "ghost" | "soft";
  icon?: React.ReactNode; children: React.ReactNode;
  onClick?: () => void; href?: string; disabled?: boolean; style?: React.CSSProperties;
};
function Btn({ variant, icon, children, onClick, href, disabled, style = {} }: BtnProps) {
  const t = useT();
  const base: React.CSSProperties = {
    ...bodyB, fontSize: 16, letterSpacing: "0.02em",
    minHeight: 52, borderRadius: 999, border: "none", padding: "0 26px",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
    cursor: disabled ? "not-allowed" : "pointer", textDecoration: "none",
    opacity: disabled ? 0.5 : 1, transition: "transform .08s, opacity .2s", boxSizing: "border-box",
    ...(variant === "gold"  ? { background: `linear-gradient(180deg, ${t.goldLight} 0%, ${t.gold} 55%, #B8924A 100%)`, color: t.onGold, boxShadow: `0 10px 26px ${t.goldGlow}` } :
        variant === "ghost" ? { background: "transparent", color: t.gold, boxShadow: `inset 0 0 0 1.5px ${t.gold}` } :
                              { background: t.card, color: t.paper, boxShadow: `inset 0 0 0 1px ${t.cardLine}` }),
    ...style,
  };
  const cls = `t33-btn t33-btn-${variant}`;
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
    background: "rgba(255,255,255,.04)", border: `1.5px solid ${t.cardLine}`, borderRadius: 14,
    ...body, fontSize: 16, color: t.paper, outline: "none", transition: "border-color .2s, box-shadow .2s",
  };
  return (
    <div>
      <label htmlFor={id} style={{ ...caps, fontSize: 11, lineHeight: "16px", color: t.gold, display: "block", marginBottom: 8 }}>
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
      width: "100%", height: "100%", background: t.bg2,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, ...style,
    }}>
      <CameraIcon size={28} color={t.paperDim} />
      <span style={{ ...caps, fontSize: 11, color: t.paperDim }}>Зураг</span>
    </div>
  );
}

// Section: дээд ирмэгт алтан хайрцаг зураас + дээрээс нь зөөлөн алтан гэрэл
function Section({ tone, children, id, style = {} }: { tone: Tone; children: React.ReactNode; id?: string; style?: React.CSSProperties }) {
  const t = useT();
  const c = tone === "bg2" ? t.bg2 : t.bg;
  return (
    <section id={id} style={{
      background: `radial-gradient(ellipse 80% 40% at 50% 0%, rgba(212,175,106,.09), transparent 70%), ${c}`,
      borderTop: `1px solid ${t.cardLine}`, padding: "52px 18px 64px", position: "relative", overflow: "hidden", ...style,
    }}>
      {children}
    </section>
  );
}
type SecProps = { event: EventData; tone: Tone };

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
const isDemo = (event: EventData) => event.id === "demo";
// Клубын нэр: config.club.name → events.title
const clubName = (event: EventData) =>
  cfg(event.config, "club.name", isDemo(event) ? DEMO.club : (event.title || "Клуб"));
const clubLogo = (event: EventData) => cfg<string | null>(event.config, "club.logo", null);

const eventYearOf = (event: EventData) => Number((event.date || "").slice(0, 4)) || null;

// Ойн тоо: config.anniversary.years → (баярын он − club.founded) → demo 10
function anniversary(event: EventData) {
  const demo = isDemo(event);
  const eventYear = eventYearOf(event);
  const founded = cfg<string | null>(event.config, "club.founded", demo && eventYear ? String(eventYear - DEMO.years) : null);
  const computed = founded && eventYear ? eventYear - Number(founded) : null;
  const years = cfg<number | null>(event.config, "anniversary.years", computed && computed > 0 ? computed : null);
  const range = cfg<string | false>(event.config, "anniversary.range", founded && eventYear ? `${founded} — ${eventYear}` : false);
  const label = cfg(event.config, "anniversary.label", "жилийн ой");
  return { years, range, label };
}

// /i/slug?to=Б.%20Батбаяр → хувь хүнд хандсан урилга
function addressee(): string | null {
  try { return new URLSearchParams(window.location.search).get("to")?.trim() || null; }
  catch { return null; }
}

// 0 → target тоологдох (motion animate); go=false бол 0 хэвээр
function useCountUp(target: number, go: boolean, duration = 1.8) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!go) return;
    const ctrl = animate(0, target, { duration, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => ctrl.stop();
  }, [go, target, duration]);
  return n;
}

// ─── Intro: лого дарахад алтан цагираг тэлж, оч цацарна ──────────────────────
const BURST = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2;
  return { id: i, x: Math.cos(a) * (120 + (i % 3) * 30), y: Math.sin(a) * (120 + (i % 3) * 30), size: 4 + (i % 3) * 2 };
});
function SealIntro({ event, onOpen }: { event: EventData; onOpen: () => void }) {
  const t = useT();
  const [opening, setOpening] = useState(false);
  const [exiting, setExiting] = useState(false);
  const name = clubName(event);
  const { years, label } = anniversary(event);
  const eyebrow = cfg(event.config, "hero.eyebrow", "Ойн баярын урилга");
  const open = () => {
    if (opening) return;
    setOpening(true); onOpen();
    setTimeout(() => setExiting(true), 650);
  };
  return (
    <motion.div
      initial={{ opacity: 1 }} animate={{ opacity: exiting ? 0 : 1 }} transition={{ duration: 0.9, ease: "easeOut" }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: `radial-gradient(ellipse 70% 50% at 50% 35%, rgba(212,175,106,.14), transparent 70%), ${t.bg}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        pointerEvents: exiting ? "none" : "auto", overflow: "hidden", padding: 16, boxSizing: "border-box", textAlign: "center",
      }}
    >
      <div style={{ ...caps, fontSize: 12, color: t.gold }}>{eyebrow}</div>

      <button type="button" onClick={open} aria-label="Урилгыг нээх"
        style={{ background: "transparent", border: "none", padding: 0, marginTop: 28, cursor: "pointer", position: "relative", display: "grid", placeItems: "center" }}>
        {/* тэлэх цагираг (sonar) */}
        {!opening && [0, 1].map((i) => (
          <span key={i} className="t33-ring" aria-hidden="true" style={{
            position: "absolute", width: 150, height: 150, borderRadius: "50%", border: `1.5px solid ${t.gold}`, animationDelay: `${i * 1.1}s`,
          }} />
        ))}
        {/* дарахад тэлэх цагираг */}
        <motion.span aria-hidden="true"
          initial={{ scale: 1, opacity: 0 }} animate={opening ? { scale: 4, opacity: [0.9, 0] } : { scale: 1, opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={{ position: "absolute", width: 150, height: 150, borderRadius: "50%", border: `2px solid ${t.goldLight}` }} />
        {/* оч */}
        {BURST.map((b) => (
          <motion.span key={b.id} aria-hidden="true"
            initial={{ x: 0, y: 0, opacity: 0, scale: 1 }}
            animate={opening ? { x: b.x, y: b.y, opacity: [1, 0], scale: 0.3 } : { x: 0, y: 0, opacity: 0 }}
            transition={{ duration: 0.95, ease: "easeOut" }}
            style={{ position: "absolute", width: b.size, height: b.size, borderRadius: "50%", background: t.goldLight, boxShadow: `0 0 ${b.size * 2}px ${t.gold}` }} />
        ))}
        <motion.div animate={opening ? { scale: 1.08 } : { scale: 1 }} transition={{ duration: 0.5 }}>
          <LogoRing src={clubLogo(event)} name={name} size={150} />
        </motion.div>
      </button>

      <div style={{ ...display, fontWeight: 600, fontSize: 31, color: t.paper, marginTop: 30, lineHeight: 1.15, maxWidth: 320 }}>{name}</div>
      {years && (
        <div style={{ ...caps, fontSize: 13, color: t.gold, marginTop: 10 }}>
          {years} {label}
        </div>
      )}

      <motion.div animate={opening ? { opacity: 0 } : { opacity: 1 }} style={{ marginTop: 34 }}>
        <Btn variant="gold" onClick={open} icon={<SparkIcon size={18} color={t.onGold} />}>Урилгыг нээх</Btn>
      </motion.div>
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
function T33Hero({ event, started }: { event: EventData; started: boolean }) {
  const t = useT();
  const name    = clubName(event);
  const { years, range, label } = anniversary(event);
  const eyebrow = cfg(event.config, "hero.eyebrow", "Ойн баярын урилга");
  const tagline = cfg<string | false>(event.config, "hero.tagline", t.tagline);
  const cover   = cfg<string | null>(event.config, "hero.photo", null) || (isDemo(event) ? DEMO.cover : event.main_image) || null;
  const place   = cfg<string | false>(event.config, "hero.place", event.venue_name || false);
  const orbit   = cfg<string | false>(event.config, "hero.orbit", range ? `${name} · ${range}` : name);
  const n = useCountUp(years ?? 0, started);

  const nameSize =
    name.length <= 14 ? "clamp(32px, 9vw, 40px)" :
    name.length <= 24 ? "clamp(27px, 7.4vw, 34px)" :
                        "clamp(23px, 6.2vw, 29px)";

  const show = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: started ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.9, delay, ease: "easeOut" as const },
  });
  const scrollNext = () => document.getElementById("t33-letter")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <header style={{
      minHeight: "100svh", background: t.bg, position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "40px 18px 80px", boxSizing: "border-box", textAlign: "center",
    }}>
      {/* нүүрний зураг — бүдэг, доошоо хар болж уусна */}
      {cover && (
        <motion.img src={cover} alt="" aria-hidden="true"
          initial={{ scale: 1.12, opacity: 0 }} animate={started ? { scale: 1, opacity: 1 } : { scale: 1.12, opacity: 0 }}
          transition={{ duration: 2.2, ease: "easeOut" }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(180deg, rgba(11,12,18,.62) 0%, rgba(11,12,18,.50) 35%, rgba(11,12,18,.88) 70%, ${t.bg} 100%)`,
      }} />

      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={started ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1, ease: "easeOut" }}>
          <LogoRing src={clubLogo(event)} name={name} size={104} orbit={orbit || undefined} />
        </motion.div>

        <motion.div {...show(0.3)} style={{ ...caps, fontSize: 12, color: t.gold, marginTop: 18 }}>{eyebrow}</motion.div>

        {years ? (
          <motion.div {...show(0.45)} style={{ marginTop: 4 }}>
            <div className="t33-gold" aria-label={`${years} ${label}`} style={{
              ...display, fontWeight: 700, fontSize: "clamp(116px, 36vw, 160px)", lineHeight: 0.95, fontVariantNumeric: "lining-nums tabular-nums",
            }}>
              {n}
            </div>
            <div style={{ ...caps, fontSize: 15, letterSpacing: "0.34em", color: t.paper, marginTop: 6, paddingLeft: "0.34em" }}>{label}</div>
          </motion.div>
        ) : null}

        <motion.h1 {...show(0.6)} style={{
          ...display, fontWeight: 600, fontSize: nameSize, lineHeight: 1.15, color: t.paper,
          margin: years ? "22px 0 0" : "26px 0 0", maxWidth: 340, overflowWrap: "anywhere",
        }}>
          {name}
        </motion.h1>

        {tagline && (
          <motion.div {...show(0.7)} style={{ ...display, fontStyle: "italic", fontSize: 21, color: t.paperMuted, marginTop: 10 }}>
            {tagline}
          </motion.div>
        )}

        <motion.div {...show(0.85)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 26, width: "100%", maxWidth: 358 }}>
          <div style={{ width: 34, height: 1, background: `linear-gradient(to right, transparent, ${t.gold})`, flexShrink: 0 }} />
          <div style={{ ...display, fontWeight: 600, fontSize: 23, color: t.goldLight, lineHeight: 1.2, fontVariantNumeric: "lining-nums" }}>
            {fmtDate(event.date)}{event.time ? ` · ${event.time}` : ""}
          </div>
          <div style={{ width: 34, height: 1, background: `linear-gradient(to left, transparent, ${t.gold})`, flexShrink: 0 }} />
        </motion.div>

        {place && (
          <motion.div {...show(0.95)} style={{ marginTop: 16 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(24,25,38,.72)", backdropFilter: "blur(8px)", border: `1px solid ${t.cardLine}`, borderRadius: 999, padding: "9px 16px", maxWidth: 340 }}>
              <PinIcon size={17} color={t.gold} />
              <span style={{ ...bodyB, fontSize: 15, color: t.paper, textAlign: "left" }}>{place}</span>
            </div>
          </motion.div>
        )}
      </div>

      <motion.button type="button" onClick={scrollNext} aria-label="Доош гүйлгэх"
        initial={{ opacity: 0 }} animate={started ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 1, delay: 1.5 }}
        style={{ position: "absolute", bottom: 16, left: "50%", marginLeft: -26, width: 52, height: 52, background: "transparent", border: "none", cursor: "pointer", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="t33-bounce"><ChevronsIcon size={28} color={t.gold} /></div>
      </motion.button>
    </header>
  );
}

// ─── Урилгын үг ──────────────────────────────────────────────────────────────
function T33Letter({ event, tone, to }: SecProps & { to: string | null }) {
  const t = useT();
  const lines     = getPoemLines(event, T33_DEFAULT_POEM);
  const greeting  = cfg<string | false>(event.config, "letter.greeting", "Эрхэм хүндэт та бүхэнд");
  const signature = cfg<string | false>(event.config, "letter.signature", `Хүндэтгэсэн: ${clubName(event)}`);
  const note      = cfg<string | null>(event.config, "letter.note", null);
  const head = to ? `Эрхэм хүндэт ${to}` : greeting;
  return (
    <Section id="t33-letter" tone={tone}>
      <FadeUp>
        <div style={{ background: t.card, border: `1px solid ${t.cardLine}`, borderRadius: 24, boxShadow: SHADOW_CARD, padding: "34px 24px 28px", position: "relative", overflow: "hidden", textAlign: "center" }}>
          {/* булангийн алтан нум */}
          <div aria-hidden="true" style={{ position: "absolute", top: 10, left: 10, width: 36, height: 36, borderTop: `1px solid ${t.gold}`, borderLeft: `1px solid ${t.gold}`, borderRadius: "10px 0 0 0", opacity: 0.8 }} />
          <div aria-hidden="true" style={{ position: "absolute", bottom: 10, right: 10, width: 36, height: 36, borderBottom: `1px solid ${t.gold}`, borderRight: `1px solid ${t.gold}`, borderRadius: "0 0 10px 0", opacity: 0.8 }} />
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><StarIcon size={20} color={t.gold} /></div>
          {head && (
            <div style={{ ...display, fontWeight: 600, fontSize: to ? 27 : 21, color: t.goldLight, lineHeight: 1.3, marginBottom: 16 }}>
              {head}
            </div>
          )}
          <div style={{ ...display, fontStyle: "italic", fontWeight: 500, fontSize: 23, lineHeight: 1.5, color: t.paper }}>
            {lines.map((l, i) => l === "" ? <div key={i} style={{ height: 14 }} /> : <div key={i}>{l}</div>)}
          </div>
          {note && <div style={{ ...body, fontSize: 14, color: t.paperMuted, marginTop: 16, lineHeight: 1.5 }}>{note}</div>}
          <div style={{ marginTop: 22 }}><Divider /></div>
          {signature && <div style={{ ...caps, fontSize: 11, color: t.gold, marginTop: 18 }}>{signature}</div>}
        </div>
      </FadeUp>
    </Section>
  );
}

// ─── Замнал: тоо баримт + он цагийн хэлхээ ───────────────────────────────────
const stats = (event: EventData) => cfg<Stat[]>(event.config, "stats.items", isDemo(event) ? DEMO.stats : []).filter((s) => s && typeof s.value === "number");
const demoHistory = (event: EventData): Milestone[] => {
  const y = eventYearOf(event) ?? new Date().getFullYear();
  return DEMO.history.map((m) => ({ year: String(y - m.ago), text: m.text }));
};
const history = (event: EventData) => cfg<Milestone[]>(event.config, "history.items", isDemo(event) ? demoHistory(event) : []).filter((m) => m && m.year);

function StatNumber({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const n = useCountUp(value, inView, 1.6);
  return (
    <div ref={ref} className="t33-gold" style={{ ...display, fontWeight: 700, fontSize: 48, lineHeight: 1, fontVariantNumeric: "lining-nums tabular-nums" }}>
      {n}{suffix || ""}
    </div>
  );
}

function T33Journey({ event, tone }: SecProps) {
  const t = useT();
  const title = cfg(event.config, "history.title", "Бидний замнал");
  const st = stats(event);
  const hs = history(event);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  const spine = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  return (
    <Section tone={tone}>
      <FadeUp><Heading kicker="Түүх">{title}</Heading></FadeUp>

      {st.length > 0 && (
        <FadeUp>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(st.length, 3)}, 1fr)`, gap: 10, marginBottom: hs.length ? 34 : 0 }}>
            {st.map((s, i) => (
              <div key={i} style={{ background: t.card, border: `1px solid ${t.cardLine}`, borderRadius: 18, padding: "20px 8px 16px", textAlign: "center" }}>
                <StatNumber value={s.value} suffix={s.suffix} />
                <div style={{ ...caps, fontSize: 11, color: t.paperMuted, marginTop: 10 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </FadeUp>
      )}

      {hs.length > 0 && (
        <div ref={ref} style={{ position: "relative", paddingLeft: 30 }}>
          <div aria-hidden="true" style={{ position: "absolute", left: 7, top: 14, bottom: 14, width: 1, background: t.cardLine }} />
          <motion.div aria-hidden="true" style={{ position: "absolute", left: 7, top: 14, width: 1, height: spine, maxHeight: "calc(100% - 28px)", background: t.gold, boxShadow: `0 0 8px ${t.gold}` }} />
          {hs.map((m, i) => (
            <FadeUp key={i} delay={Math.min(i, 5) * 0.1} style={{ position: "relative", marginBottom: 22 }}>
              <div aria-hidden="true" style={{ position: "absolute", left: -30 + 2, top: 12, width: 11, height: 11, borderRadius: "50%", background: t.bg, border: `2px solid ${t.gold}`, boxSizing: "border-box" }} />
              <div style={{ ...caps, fontSize: 20, letterSpacing: "0.12em", color: t.gold, lineHeight: 1.1, fontWeight: 600 }}>{m.year}</div>
              <div style={{ ...body, fontSize: 16, lineHeight: 1.55, color: t.paper, marginTop: 6 }}>{m.text}</div>
            </FadeUp>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Цомог (lightbox) ────────────────────────────────────────────────────────
const galleryPhotos = (event: EventData) =>
  (isDemo(event) ? DEMO.gallery : (event.gallery_photos || [])).filter(Boolean).slice(0, 6);

function T33Gallery({ event, tone }: SecProps) {
  const t = useT();
  const title  = cfg(event.config, "gallery.title", "Дурсамжийн мөчүүд");
  const photos = galleryPhotos(event);
  const [lb, setLb] = useState<number | null>(null);
  const step = (d: number) => setLb((i) => (i === null ? null : (i + d + photos.length) % photos.length));
  useEffect(() => {
    if (lb === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLb(null);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lb]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Section tone={tone}>
      <FadeUp><Heading kicker="Цомог">{title}</Heading></FadeUp>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {photos.map((src, i) => {
          // Эхнийх нь бүтэн өргөн; тоо тэгш бол сүүлийнх нь ч бүтэн (ганцаарчлагдахгүй, тэгш хэмтэй)
          const wide = i === 0 || (photos.length % 2 === 0 && i === photos.length - 1);
          return (
          <FadeUp key={i} delay={Math.min(i, 5) * 0.06} style={{ gridColumn: wide ? "1 / -1" : "auto" }}>
            <button type="button" onClick={() => setLb(i)} aria-label={`Зураг ${i + 1} томруулах`} style={{
              display: "block", width: "100%", padding: 0, border: `1px solid ${t.cardLine}`, borderRadius: 16, overflow: "hidden",
              background: t.card, cursor: "zoom-in", aspectRatio: wide ? "16 / 9" : "1 / 1", boxShadow: SHADOW_CARD,
            }}>
              <Photo src={src} alt={`Зураг ${i + 1}`} />
            </button>
          </FadeUp>
          );
        })}
      </div>

      <AnimatePresence>
        {lb !== null && (
          <motion.div role="dialog" aria-label="Зураг" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            onClick={() => setLb(null)}
            style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(5,5,9,.94)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <motion.img key={lb} src={photos[lb]} alt={`Зураг ${lb + 1}`}
              initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "100%", maxHeight: "82vh", objectFit: "contain", borderRadius: 12, border: `1px solid ${t.cardLine}` }} />
            <button type="button" onClick={() => setLb(null)} aria-label="Хаах"
              style={{ position: "absolute", top: 14, right: 14, width: 48, height: 48, borderRadius: "50%", border: `1px solid ${t.cardLine}`, background: t.card, cursor: "pointer", display: "grid", placeItems: "center" }}>
              <CloseIcon size={22} color={t.paper} />
            </button>
            {photos.length > 1 && (
              <>
                <button type="button" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Өмнөх"
                  style={{ position: "absolute", left: 10, top: "50%", marginTop: -24, width: 48, height: 48, borderRadius: "50%", border: `1px solid ${t.cardLine}`, background: t.card, cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <ArrowLeftIcon size={22} color={t.paper} />
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Дараах"
                  style={{ position: "absolute", right: 10, top: "50%", marginTop: -24, width: 48, height: 48, borderRadius: "50%", border: `1px solid ${t.cardLine}`, background: t.card, cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <ArrowRightIcon size={22} color={t.paper} />
                </button>
              </>
            )}
            <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, textAlign: "center", ...caps, fontSize: 11, color: t.paperMuted }}>
              {lb + 1} / {photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

// ─── Хөтөлбөр ────────────────────────────────────────────────────────────────
const SCHEDULE_ICONS: IconFn[] = [GlassIcon, MicIcon, TrophyIcon, DinnerIcon, MusicIcon];
function T33Schedule({ event, tone }: SecProps) {
  const t = useT();
  const title = cfg(event.config, "schedule.title", "Хөтөлбөр");
  const [hh, mm] = (event.time || "18:00").split(":").map(Number);
  const fmt = (h: number, m: number) =>
    String(Math.floor(h + m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  const items = getSchedule(event, [
    { time: fmt(hh, mm),          label: "Хүлээн авалт", desc: "Угтах зоог, дурсамж зураг" },
    { time: fmt(hh, mm + 45),     label: "Нээлт",        desc: "Ойн баярын нээлт, мэндчилгээ" },
    { time: fmt(hh + 1, mm + 30), label: "Хүндэтгэл",    desc: "Талархал, шагнал гардуулах" },
    { time: fmt(hh + 2, mm + 15), label: "Гала зоог" },
    { time: fmt(hh + 3, mm + 30), label: "Хөгжим, бүжиг" },
  ]);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  const spine = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  return (
    <Section tone={tone}>
      <FadeUp><Heading kicker="Үдэшлэг">{title}</Heading></FadeUp>
      <div ref={ref} style={{ position: "relative", paddingLeft: 56 }}>
        <div aria-hidden="true" style={{ position: "absolute", left: 20, top: 20, bottom: 20, width: 1, background: t.cardLine }} />
        <motion.div aria-hidden="true" style={{ position: "absolute", left: 20, top: 20, width: 1, height: spine, maxHeight: "calc(100% - 40px)", background: t.gold, boxShadow: `0 0 8px ${t.gold}` }} />
        {items.map((it, i) => {
          const Icon = SCHEDULE_ICONS[i % SCHEDULE_ICONS.length];
          return (
            <FadeUp key={i} delay={Math.min(i, 5) * 0.1} style={{ position: "relative", marginBottom: 12 }}>
              <div aria-hidden="true" style={{
                position: "absolute", left: -56, top: 10, width: 40, height: 40, borderRadius: "50%",
                background: t.card, border: `1px solid ${t.gold}`, boxShadow: `0 0 0 5px ${tone === "bg2" ? t.bg2 : t.bg}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={18} color={t.gold} />
              </div>
              <div style={{ background: t.card, border: `1px solid ${t.cardLine}`, borderRadius: 18, padding: "14px 16px" }}>
                <div style={{ ...caps, fontSize: 18, letterSpacing: "0.1em", color: t.gold, lineHeight: 1.1, fontWeight: 600 }}>{it.time}</div>
                <div style={{ ...display, fontWeight: 600, fontSize: 22, color: t.paper, marginTop: 5 }}>{it.label}</div>
                {it.desc && <div style={{ ...body, fontSize: 14, color: t.paperMuted, marginTop: 4, lineHeight: 1.5 }}>{it.desc}</div>}
              </div>
            </FadeUp>
          );
        })}
      </div>
    </Section>
  );
}

// ─── Хувцаслалт (config.dress.code өгсөн үед л) ───────────────────────────────
const dressCode = (event: EventData) => cfg<string | null>(event.config, "dress.code", isDemo(event) ? DEMO.dress.code : null);
function T33Dress({ event, tone }: SecProps) {
  const t = useT();
  const demo   = isDemo(event);
  const title  = cfg(event.config, "dress.title", "Хувцаслалт");
  const code   = dressCode(event);
  const note   = cfg<string | null>(event.config, "dress.note", demo ? DEMO.dress.note : null);
  const colors = cfg<string[]>(event.config, "dress.colors", demo ? DEMO.dress.colors : []).filter(Boolean);
  if (!code) return null;
  return (
    <Section tone={tone}>
      <FadeUp><Heading kicker="Dress code">{title}</Heading></FadeUp>
      <FadeUp>
        <div style={{ background: t.card, border: `1px solid ${t.cardLine}`, borderRadius: 24, boxShadow: SHADOW_CARD, padding: "26px 22px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><ShirtIcon size={30} color={t.gold} /></div>
          <div className="t33-gold" style={{ ...display, fontWeight: 700, fontSize: 38, lineHeight: 1.1 }}>{code}</div>
          {note && <p style={{ ...body, fontSize: 15, lineHeight: 1.6, color: t.paperMuted, margin: "14px auto 0", maxWidth: 320 }}>{note}</p>}
          {colors.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 20 }}>
              {colors.map((c, i) => (
                <span key={i} aria-hidden="true" style={{ width: 34, height: 34, borderRadius: "50%", background: c, boxShadow: `0 0 0 2px ${t.card}, 0 0 0 3.5px ${t.gold}` }} />
              ))}
            </div>
          )}
        </div>
      </FadeUp>
    </Section>
  );
}

// ─── Тоологч ─────────────────────────────────────────────────────────────────
function T33Countdown({ event, tone }: SecProps) {
  const t = useT();
  const title = cfg(event.config, "timer.title", "Баяр эхлэхэд");
  const [c, setC] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const target = new Date(`${event.date}T${event.time || "18:00"}:00`);
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
    <Section tone={tone}>
      <FadeUp><Heading>{title}</Heading></FadeUp>
      <FadeUp>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {units.map((u) => (
            <div key={u.l} style={{ background: t.card, border: `1px solid ${t.cardLine}`, borderRadius: 16, padding: "18px 4px 12px", textAlign: "center" }}>
              <div style={{ ...display, fontWeight: 700, fontSize: 40, lineHeight: 1, color: t.goldLight, fontVariantNumeric: "lining-nums tabular-nums" }}>{pad(u.v)}</div>
              <div style={{ ...caps, fontSize: 10, color: t.paperMuted, marginTop: 8 }}>{u.l}</div>
            </div>
          ))}
        </div>
      </FadeUp>
    </Section>
  );
}

// ─── Байршил ─────────────────────────────────────────────────────────────────
function T33Venue({ event, tone }: SecProps) {
  const t = useT();
  const title = cfg(event.config, "venue.title", "Байршил");
  const note  = cfg<string | null>(event.config, "venue.note", null);
  const name  = event.venue_name;
  const addr  = event.venue_address;
  const mapHref = event.venue_map_url
    ? normalizeUrl(event.venue_map_url)
    : name ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(name) : "";
  return (
    <Section tone={tone}>
      <FadeUp><Heading kicker="Хаана">{title}</Heading></FadeUp>
      <FadeUp delay={0.08}>
        <div style={{ background: t.card, border: `1px solid ${t.cardLine}`, padding: 8, borderRadius: 22, boxShadow: SHADOW_CARD }}>
          <div style={{ aspectRatio: "16 / 10", borderRadius: 16, overflow: "hidden", background: t.bg2, position: "relative" }}>
            {event.maps_photo ? (
              <Photo src={event.maps_photo} alt={name} />
            ) : (
              <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PinIcon size={44} color={t.gold} />
              </div>
            )}
          </div>
        </div>
      </FadeUp>
      <FadeUp delay={0.12} style={{ textAlign: "center", marginTop: 22 }}>
        {name && <div style={{ ...display, fontWeight: 600, fontSize: 28, color: t.paper, lineHeight: 1.2 }}>{name}</div>}
        {addr && <div style={{ ...body, fontSize: 16, lineHeight: "24px", color: t.paperMuted, marginTop: 8 }}>{addr}</div>}
        {event.time && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14, ...caps, fontSize: 12, color: t.gold }}>
            <ClockIcon size={16} color={t.gold} /> {fmtDate(event.date)} · {event.time}
          </div>
        )}
        {note && <div style={{ ...body, fontSize: 14, color: t.paperMuted, marginTop: 12, lineHeight: 1.5 }}>{note}</div>}
      </FadeUp>
      {mapHref && (
        <FadeUp delay={0.18} style={{ marginTop: 22 }}>
          <Btn variant="gold" href={mapHref} icon={<PinIcon size={20} color={t.onGold} />} style={{ width: "100%" }}>Google Maps-р харах</Btn>
        </FadeUp>
      )}
    </Section>
  );
}

// ─── Мэндчилгээ ──────────────────────────────────────────────────────────────
function T33Wishes({ event, tone }: SecProps) {
  const t = useT();
  const eventId  = event.id;
  const title    = cfg(event.config, "wishes.title", "Мэндчилгээ");
  const subtitle = cfg(event.config, "wishes.subtitle", "Клубт зориулсан ойн мэндчилгээ, ерөөлөө үлдээгээрэй");
  const showList = cfg(event.config, "wishes.showList", true) !== false;
  const [name, setName]       = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [wishes, setWishes]   = useState<Wish[]>(eventId === "demo" ? DEMO.wishes : []);

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
    <Section tone={tone}>
      <FadeUp><Heading kicker="Ерөөл">{title}</Heading></FadeUp>
      <FadeUp>
        <div style={{ ...display, fontStyle: "italic", fontWeight: 500, fontSize: 21, color: t.paperMuted, textAlign: "center", marginBottom: 18 }}>{subtitle}</div>
        <div style={{ background: t.card, border: `1px solid ${t.cardLine}`, borderRadius: 24, padding: 22, boxShadow: SHADOW_CARD, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field id="t33-wish-name" label="Нэр" value={name} onChange={setName} placeholder="Таны нэр / байгууллага" />
          <Field id="t33-wish-msg" label="Мэндчилгээ" textarea value={message} onChange={setMessage} placeholder="Ойн баярын мэнд хүргэе…" />
          <Btn variant="gold" onClick={submit} disabled={sending || !name.trim() || !message.trim()}
            icon={<SendIcon size={20} color={t.onGold} />} style={{ width: "100%" }}>
            {sending ? "Илгээж байна…" : "Илгээх"}
          </Btn>
        </div>
      </FadeUp>
      {showList && wishes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 28 }}>
          {wishes.map((w, i) => (
            <FadeUp key={i} delay={Math.min(i, 4) * 0.06}>
              <div style={{ background: t.card, border: `1px solid ${t.cardLine}`, borderLeft: `3px solid ${t.gold}`, borderRadius: 18, padding: "16px 18px" }}>
                <p style={{ ...body, fontSize: 16, lineHeight: "24px", color: t.paper, margin: 0 }}>{w.message}</p>
                <div style={{ ...caps, fontSize: 11, color: t.gold, marginTop: 10 }}>— {w.name}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Ирц ─────────────────────────────────────────────────────────────────────
function T33RSVP({ event, tone }: SecProps) {
  const t = useT();
  const title     = cfg(event.config, "rsvp.title", "Ирцээ бүртгүүлэх");
  const maxGuests = cfg(event.config, "rsvp.maxGuests", 5);
  const note      = cfg(event.config, "rsvp.note", "Суудлын зохион байгуулалтын үүднээс ирцээ урьдчилан бүртгүүлнэ үү");
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [guests, setGuests]   = useState(1);
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
          background: disabled ? "rgba(255,255,255,.06)" : `linear-gradient(180deg, ${t.goldLight}, ${t.gold})`, color: disabled ? t.paperDim : t.onGold,
          ...display, fontWeight: 600, fontSize: 26, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          boxShadow: disabled ? "none" : `0 6px 16px ${t.goldGlow}`,
        }}>
        {dir < 0 ? "−" : "+"}
      </button>
    );
  };

  return (
    <Section tone={tone}>
      <FadeUp><Heading kicker="RSVP">{title}</Heading></FadeUp>
      <FadeUp>
        <div style={{ background: t.card, border: `1px solid ${t.cardLine}`, borderRadius: 24, padding: 22, boxShadow: SHADOW_CARD, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field id="t33-rsvp-name" label="Нэр" value={name} onChange={setName} placeholder="Таны нэр" />
          <Field id="t33-rsvp-phone" label="Утас" type="tel" inputMode="numeric" value={phone} onChange={setPhone} placeholder="9900 1122" />
          <div>
            <div style={{ ...caps, fontSize: 11, lineHeight: "16px", color: t.gold, marginBottom: 8 }}>Хүний тоо</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, minHeight: 52 }}>
              {stepBtn(-1)}
              <div aria-live="polite" style={{ ...display, fontWeight: 700, fontSize: 31, color: t.paper, minWidth: 40, textAlign: "center", fontVariantNumeric: "lining-nums" }}>{guests}</div>
              {stepBtn(1)}
            </div>
          </div>
          <Field id="t33-rsvp-msg" label="Мессеж" textarea value={message} onChange={setMessage} placeholder="Нэмэлт мэдээлэл" />
          {done ? (
            <div role="status" style={{
              ...display, fontStyle: "italic", fontWeight: 600, fontSize: 23, color: t.goldLight, textAlign: "center",
              minHeight: 52, display: "flex", alignItems: "center", justifyContent: "center",
              border: `1.5px solid ${t.gold}`, borderRadius: 999,
            }}>
              Баярлалаа! Бүртгэгдлээ.
            </div>
          ) : (
            <Btn variant="gold" onClick={submit} disabled={sending || !name.trim()} style={{ width: "100%" }}>
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
function T33Footer({ event }: { event: EventData }) {
  const t = useT();
  const name   = clubName(event);
  const { range } = anniversary(event);
  const title  = cfg(event.config, "footer.title", "Та бүхнийг хүлээн авахдаа таатай байх болно");
  const lines  = cfg<string[]>(event.config, "footer.lines", []);
  const phones = cfg<string[]>(event.config, "footer.phones", []).filter(Boolean);
  return (
    <footer style={{
      background: `radial-gradient(ellipse 80% 50% at 50% 100%, rgba(212,175,106,.16), transparent 70%), ${t.bg}`,
      borderTop: `1px solid ${t.cardLine}`, padding: "48px 18px 96px", textAlign: "center", position: "relative",
    }}>
      <FadeUp>
        <div style={{ display: "flex", justifyContent: "center" }}><LogoRing src={clubLogo(event)} name={name} size={76} /></div>
        <div style={{ ...caps, fontSize: 13, color: t.gold, marginTop: 18 }}>{name}</div>
        {range && <div style={{ ...caps, fontSize: 11, color: t.paperDim, marginTop: 6 }}>{range}</div>}
        <div style={{ ...display, fontStyle: "italic", fontWeight: 600, fontSize: 30, lineHeight: 1.2, color: t.paper, marginTop: 20, maxWidth: 340, marginInline: "auto" }}>
          {title}
        </div>
        {lines.map((l) => (
          <div key={l} style={{ ...body, fontSize: 16, lineHeight: "24px", color: t.paperMuted, marginTop: 14 }}>{l}</div>
        ))}
        {phones.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 22 }}>
            {phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/\D/g, "")}`} style={{
                display: "inline-flex", alignItems: "center", gap: 12, minHeight: 52, padding: "6px 20px 6px 6px",
                background: t.card, border: `1px solid ${t.cardLine}`, borderRadius: 999, textDecoration: "none",
              }}>
                <span style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(180deg, ${t.goldLight}, ${t.gold})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PhoneIcon size={20} color={t.onGold} />
                </span>
                <span style={{ ...display, fontWeight: 700, fontSize: 24, color: t.paper, fontVariantNumeric: "lining-nums" }}>{fmtPhone(p)}</span>
              </a>
            ))}
          </div>
        )}
        <div style={{ marginTop: 30 }}><Divider /></div>
      </FadeUp>
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
        background: t.card, border: `1.5px solid ${t.gold}`, boxShadow: `0 8px 20px ${t.goldGlow}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
      <div className={playing ? "t33-pulse" : undefined}>
        {playing ? <MusicIcon size={24} color={t.gold} /> : <MusicOffIcon size={24} color={t.gold} />}
      </div>
    </button>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
export function ClubAnniversary({ event: raw, theme }: { event: EventData; theme: Theme["key"] }) {
  // Demo-д DEMO_EVENT-ийн (хуримын) огноо өнгөрсөн байж болох тул ирэх жилийн 08-16 — тоологч ажиллана
  const event: EventData = isDemo(raw) ? { ...raw, date: `${new Date().getFullYear() + 1}-08-16` } : raw;
  const themeKey = cfg<Theme["key"]>(event.config, "theme", theme);
  const t = THEMES[themeKey] ?? THEMES[theme];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // config.intro.logo: true → лого дарж нээх intro (видеогүй).
  // config.intro.video: URL → тэр видео; false → intro-гүй (шууд hero); байхгүй → T13-ын дугтуй нээх видео
  const introLogo = cfg(event.config, "intro.logo", false) === true;
  const introCfg  = cfg<string | false | undefined>(event.config, "intro.video", undefined);
  const introVideo = introLogo ? false : introCfg === undefined ? T33_INTRO_VIDEO : introCfg;
  const hasVideo = typeof introVideo === "string" && introVideo.length > 0;
  const [started, setStarted] = useState(!introLogo && !hasVideo);
  const start = () => { setStarted(true); audioRef.current?.play().catch(() => {}); };
  const [to] = useState(addressee);

  // Бараан загвар: desktop дээр 523px-ийн гадна талын хуудас ч хар байг
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = t.bg;
    return () => { document.body.style.background = prev; };
  }, [t.bg]);

  // Дуу: ачаалмагц (видео intro-той ЗЭРЭГ) шууд эхлүүлэхийг оролдоно — T13-тай ижил.
  // Browser autoplay-г хоригловол хэрэглэгчийн анхны хөдөлгөөн (tap / scroll / keydown) дээр асна.
  useEffect(() => {
    if (!event.music_url) return;
    const evs = ["pointerdown", "touchstart", "keydown", "scroll"] as const;
    const tryPlay = () => { audioRef.current?.play().then(stop).catch(() => {}); };
    const stop = () => evs.forEach((e) => window.removeEventListener(e, tryPlay));
    tryPlay();
    evs.forEach((e) => window.addEventListener(e, tryPlay, { passive: true }));
    return stop;
  }, [event.music_url]);

  // Харагдах section-уудыг дарааллаар нь ээлжлэн bg / bg2 өнгөөр
  const c = event.config;
  type B = (p: { tone: Tone }) => React.ReactNode;
  const blocks: B[] = [
    (p) => <T33Letter key="letter" event={event} to={to} {...p} />,
    ...(sectionOn(c, "history") && (stats(event).length || history(event).length) ? [((p) => <T33Journey key="journey" event={event} {...p} />) as B] : []),
    ...(sectionOn(c, "gallery") && galleryPhotos(event).length ? [((p) => <T33Gallery key="gallery" event={event} {...p} />) as B] : []),
    ...(sectionOn(c, "schedule") ? [((p) => <T33Schedule key="schedule" event={event} {...p} />) as B] : []),
    ...(sectionOn(c, "dress") && dressCode(event) ? [((p) => <T33Dress key="dress" event={event} {...p} />) as B] : []),
    ...(sectionOn(c, "timer") ? [((p) => <T33Countdown key="timer" event={event} {...p} />) as B] : []),
    (p) => <T33Venue key="venue" event={event} {...p} />,
    ...(sectionOn(c, "wishes") ? [((p) => <T33Wishes key="wishes" event={event} {...p} />) as B] : []),
    ...(sectionOn(c, "rsvp") ? [((p) => <T33RSVP key="rsvp" event={event} {...p} />) as B] : []),
  ];

  return (
    <ThemeCtx.Provider value={t}>
      <div className="t33" lang="mn" style={{ maxWidth: 523, margin: "0 auto", ...body, overflowX: "clip", background: t.bg, color: t.paper }}>
        <Styles />
        {introLogo && !started && <SealIntro event={event} onOpen={start} />}
        {hasVideo && <VideoIntro src={introVideo as string} onDone={start} />}
        <Sparks />

        <T33Hero event={event} started={started} />
        {blocks.map((b, i) => b({ tone: i % 2 === 0 ? "bg2" : "bg" }))}
        <T33Footer event={event} />

        <audio ref={audioRef} loop src={event.music_url ?? ""} preload="auto" />
        {event.music_url && <MusicToggle audioRef={audioRef} />}
        <Toaster />
      </div>
    </ThemeCtx.Provider>
  );
}

// Template 33 — Оникс (onyx) theme: хар + шампань алт
export default function Template33({ event }: { event: EventData }) {
  return <ClubAnniversary event={event} theme="onyx" />;
}
