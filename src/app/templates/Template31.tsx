import { createContext, useContext, useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { EventData } from "../../types/event";
import { getPoemLines, getSchedule } from "../../lib/eventContent";
import { cfg, sectionOn } from "../../lib/eventConfig";
import { normalizeUrl } from "../../lib/url";

// ─── Template 31 / 32 — шинэ байрны (гэр орны) найрын урилга ─────────────────
// Нэг бүтэц, хоёр theme (цайвар дэвсгэр, залуу найзаас эмээ өвөө хүртэл уншихад амар):
//   "terra" (template 31) — терракота: шавар улаан, элсэн шар, царс модны хаалга
//   "sage"  (template 32) — сэйж: зөөлөн ногоон, чулуун саарал, бор модны хаалга
// Мотив: онгойх хаалга (intro — дарахад хоёр хавтас нээгдэж гэрэл асна), яндангаас
// гарах утаатай байшин, гал голомтын оч (дээш хөвөх дулаан цэгүүд), хаалганы нум
// хэлбэрийн зураг, дээврийн ваар хэлбэрийн хэсгийн зааг.
// Шинэ байрны найрт л байдаг: "Шинэ хаяг" хэсэг — орц, давхар, тоот, хаалганы код,
// зогсоол + "Хаягийг хуулах" товч; сонголтоор бэлгийн данс.
//
// Section: intro (хаалга) → hero → урилгын үг → цомог → тоологч → хөтөлбөр →
// шинэ хаяг → [бэлэг] → ерөөл → ирц → footer. Түлхүүрүүд: docs/event-config.md § T31.
// OG preview: events.type = 'apartment' (api/invite.js — эздийн нэр гарахгүй, өөрийн зураг).

// ─── Theme ───────────────────────────────────────────────────────────────────
type Theme = {
  key: "terra" | "sage";
  bg: string; soft: string; card: string;        // хуудас / зөөлөн хэсэг / карт
  ink: string; inkMuted: string; line: string;
  accent: string; accentLight: string; accentDeep: string; onAccent: string; accentGlow: string;
  second: string; secondDeep: string;            // 2-р өнгө (элс / чулуу)
  wood: string; woodDeep: string;                // хаалга, модон эдлэл
  ember: string;                                 // гал голомтын оч, цонхны гэрэл
  badge: string; tagline: string;
  captions: string[];
};
type Tone = "bg" | "soft";

const ThemeCtx = createContext<Theme | null>(null);
const useT = () => useContext(ThemeCtx)!;

// Playfair Display italic — нэр, гарчиг; Caveat — гар бичмэл тайлбар; PT Sans — бичвэр.
// Бүгд cyrillic-ext (ө/ү), index.html-д ачаалагдсан.
const display = { fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" } as const;
const hand    = { fontFamily: "'Caveat', 'PT Sans', cursive" } as const;
const body    = { fontFamily: "'PT Sans', 'Segoe UI', sans-serif" } as const;
const bodyB   = { fontFamily: "'PT Sans', 'Segoe UI', sans-serif", fontWeight: 700 } as const;

const SHADOW_CARD = "0 10px 28px rgba(80,60,40,.10)";

const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
];

const THEMES: Record<Theme["key"], Theme> = {
  terra: {
    key: "terra",
    bg: "#FBF6F0", soft: "#F4E9DE", card: "#FFFFFF",
    ink: "#3B2A20", inkMuted: "#8A7363", line: "#E8D9CA",
    accent: "#D4785A", accentLight: "#F3D5C5", accentDeep: "#B5553A", onAccent: "#FFFFFF", accentGlow: "rgba(212,120,90,.32)",
    second: "#E9C98A", secondDeep: "#C9A24E",
    wood: "#9A6542", woodDeep: "#6F452B",
    ember: "#F2A65A",
    badge: "Тавтай морил", tagline: "Шинэ гэртээ та бүхнийг урьж байна",
    captions: ["Зочны өрөө", "Гал тогоо", "Цонхны гэрэл", "Шинэ хаалга", "Унтлагын өрөө", "Тагт", "Хамтдаа", "Шинэ эхлэл"],
  },
  sage: {
    key: "sage",
    bg: "#F6F8F4", soft: "#E9EFE4", card: "#FFFFFF",
    ink: "#28352C", inkMuted: "#6E7F70", line: "#D6E0D2",
    accent: "#8FAE8B", accentLight: "#D4E3CF", accentDeep: "#5C8257", onAccent: "#FFFFFF", accentGlow: "rgba(143,174,139,.32)",
    second: "#D9C9A8", secondDeep: "#A9926A",
    wood: "#7A6652", woodDeep: "#54453A",
    ember: "#E0B86A",
    badge: "Тавтай морил", tagline: "Шинэ гэртээ та бүхнийг урьж байна",
    captions: ["Зочны өрөө", "Гал тогоо", "Цонхны гэрэл", "Шинэ хаалга", "Унтлагын өрөө", "Тагт", "Хамтдаа", "Шинэ эхлэл"],
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
const HomeIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M3 11 12 3l9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></>);
const KeyIcon: IconFn      = ({ size = 24, color = "currentColor" }) => ico(size, color, <><circle cx="8" cy="14" r="4.5" /><path d="M11.5 11 20 2.5M16 6l2.5 2.5M13.5 8.5 16 11" /></>);
const FlameIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M12 22c-4 0-7-2.8-7-6.5 0-3 2-5 3.5-7 .5 1.5 1.5 2.5 2.5 3C11 8 11.5 4.5 14 2c0 3 1.5 4.5 3 6.5 1.5 2 2 3.5 2 6 0 4-3 7.5-7 7.5Z" />);
const CupIcon: IconFn      = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M5 4h11v8a5.5 5.5 0 0 1-11 0Z" /><path d="M16 6h2.5a2.5 2.5 0 0 1 0 5H16M7 21h7" /></>);
const MusicIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>);
const MusicOffIcon: IconFn = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /><path d="M3 3l18 18" /></>);
const HeartIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M12 21s-7-4.6-9.3-9A5.3 5.3 0 0 1 12 6.2 5.3 5.3 0 0 1 21.3 12C19 16.4 12 21 12 21Z" />, true);
const CalendarIcon: IconFn = ({ size = 24, color = "currentColor" }) => ico(size, color, <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>);
const PinIcon: IconFn      = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></>);
const DoorIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M3 21h18" /><circle cx="14.5" cy="12" r="1" fill={color} /></>);
const StairsIcon: IconFn   = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M3 20h5v-5h4v-5h4V5h5" />);
const LockIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><circle cx="12" cy="15.5" r="1.2" fill={color} /></>);
const CarIcon: IconFn      = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M4 16 5.5 9.5A2 2 0 0 1 7.4 8h9.2a2 2 0 0 1 1.9 1.5L20 16" /><rect x="3" y="16" width="18" height="4" rx="1.5" /><circle cx="7.5" cy="18" r="1" fill={color} /><circle cx="16.5" cy="18" r="1" fill={color} /></>);
const GiftIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><rect x="3" y="9" width="18" height="12" rx="2" /><path d="M3 13h18M12 9v12" /><path d="M12 9c-2-4-7-4-7-1s5 1 7 1Zm0 0c2-4 7-4 7-1s-5 1-7 1Z" /></>);
const CopyIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>);
const SendIcon: IconFn     = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M21 3 10 14" /><path d="M21 3 14 21l-4-7-7-4Z" /></>);
const PhoneIcon: IconFn    = ({ size = 24, color = "currentColor" }) => ico(size, color, <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />);
const CameraIcon: IconFn   = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M4 8h3l2-3h6l2 3h3v12H4Z" /><circle cx="12" cy="13" r="3.5" /></>);
const ChevronsIcon: IconFn = ({ size = 24, color = "currentColor" }) => ico(size, color, <><path d="M6 6l6 6 6-6" /><path d="M6 12l6 6 6-6" /></>);

// ─── global styles ───────────────────────────────────────────────────────────
function Styles() {
  const t = useT();
  return (
    <style>{`
      @keyframes t31Smoke {
        0%   { opacity: 0;   transform: translate(0, 4px) scale(.7); }
        30%  { opacity: .55; }
        100% { opacity: 0;   transform: translate(5px, -16px) scale(1.5); }
      }
      @keyframes t31Ember {
        0%   { opacity: 0; transform: translate(0, 104vh) scale(.8); }
        12%  { opacity: .9; }
        50%  { transform: translate(14px, 50vh) scale(1); }
        88%  { opacity: .5; }
        100% { opacity: 0; transform: translate(-6px, -6vh) scale(.6); }
      }
      @keyframes t31Flicker { 0%,100% { opacity: 1; } 50% { opacity: .65; } }
      @keyframes t31Pulse  { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
      @keyframes t31Bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
      @keyframes t31Knock  { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      .t31 .t31-smoke   { animation: t31Smoke 3.2s var(--delay, 0s) ease-out infinite; transform-origin: center; }
      .t31 .t31-ember   { animation: t31Ember var(--dur) var(--delay) linear infinite; }
      .t31 .t31-flicker { animation: t31Flicker 2.6s ease-in-out infinite; }
      .t31 .t31-pulse   { animation: t31Pulse 1.6s ease-in-out infinite; }
      .t31 .t31-bounce  { animation: t31Bounce 2.4s ease-in-out infinite; }
      .t31 .t31-knock   { animation: t31Knock 2.2s ease-in-out infinite; }
      .t31 :focus-visible { outline: 2px solid ${t.accentDeep}; outline-offset: 3px; }
      .t31 input::placeholder, .t31 textarea::placeholder { color: ${t.inkMuted}; opacity: .7; }
      .t31 input:focus, .t31 textarea:focus { border-color: ${t.accentDeep} !important; box-shadow: 0 0 0 3px ${t.accentGlow}; }
      .t31 .t31-carousel { scrollbar-width: none; }
      .t31 .t31-carousel::-webkit-scrollbar { display: none; }
      .t31 .t31-btn:active:not(:disabled) { transform: translateY(2px); }
      @media (prefers-reduced-motion: reduce) {
        .t31 .t31-smoke, .t31 .t31-ember, .t31 .t31-flicker, .t31 .t31-pulse, .t31 .t31-bounce, .t31 .t31-knock { animation: none !important; }
        .t31 .t31-embers { display: none; }
      }
    `}</style>
  );
}

// ─── Мотивууд ────────────────────────────────────────────────────────────────
// Яндангаас утаа гарч буй байшин — цонх нь гэрэлтэй (гал голомт асаалттай)
function HouseMark({ width = 110 }: { width?: number }) {
  const t = useT();
  return (
    <svg aria-hidden="true" width={width} height={width * 0.85} viewBox="0 0 120 102" style={{ display: "block", overflow: "visible" }}>
      {/* утаа */}
      {[0, 1, 2].map((i) => (
        <circle key={i} className="t31-smoke" cx={86 + i * 2} cy={18 - i * 6} r={4 + i} fill={t.inkMuted}
          style={{ ["--delay" as string]: `${i * 1.05}s` }} />
      ))}
      {/* яндан */}
      <rect x="80" y="24" width="11" height="20" rx="1.5" fill={t.accentDeep} />
      {/* бие */}
      <rect x="24" y="52" width="72" height="42" rx="3" fill={t.card} stroke={t.accentDeep} strokeWidth="3" />
      {/* дээвэр */}
      <path d="M12 56 L60 16 L108 56" fill="none" stroke={t.accentDeep} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* цонх (гэрэлтэй) */}
      <rect className="t31-flicker" x="33" y="62" width="14" height="14" rx="2" fill={t.ember} />
      <rect className="t31-flicker" x="73" y="62" width="14" height="14" rx="2" fill={t.ember} style={{ animationDelay: "1.3s" }} />
      <path d="M40 62v14M33 69h14M80 62v14M73 69h14" stroke={t.card} strokeWidth="1.5" />
      {/* хаалга (нуман) */}
      <path d="M52 94 V72 a8 8 0 0 1 16 0 V94 Z" fill={t.accent} />
      <circle cx="64" cy="84" r="1.4" fill={t.card} />
    </svg>
  );
}

// Хаалганы нум хэлбэрийн зураг — гадуур тасархай нуман хүрээтэй
function ArchPhoto({ photo, width = 250 }: { photo?: string | null; width?: number }) {
  const t = useT();
  const h = Math.round(width * 1.24);
  const r = width / 2;
  return (
    <div style={{ padding: 9, border: `1.5px dashed ${t.accent}`, borderRadius: `${r + 9}px ${r + 9}px 30px 30px`, display: "inline-block" }}>
      <div style={{
        width, height: h, borderRadius: `${r}px ${r}px 20px 20px`, overflow: "hidden", background: t.soft,
        border: `6px solid ${t.card}`, boxSizing: "border-box", boxShadow: `0 16px 36px ${t.accentGlow}`,
      }}>
        <Photo src={photo || undefined} alt="" />
      </div>
    </div>
  );
}

// Дүүжин модон самбар ("Тавтай морил") — зургийн доод ирмэгт
function Plaque({ text, style = {} }: { text: string; style?: React.CSSProperties }) {
  const t = useT();
  return (
    <div aria-hidden="true" style={{
      position: "absolute", left: "50%", transform: "translateX(-50%) rotate(-3deg)",
      background: t.woodDeep, color: "#FFF3E4", ...hand, fontWeight: 700, fontSize: 24, lineHeight: 1,
      padding: "9px 20px 11px", borderRadius: 10, boxShadow: "0 8px 18px rgba(60,40,20,.28)", whiteSpace: "nowrap",
      pointerEvents: "none", ...style,
    }}>
      <span style={{ position: "absolute", left: 7, top: 7, width: 5, height: 5, borderRadius: "50%", background: t.second }} />
      <span style={{ position: "absolute", right: 7, top: 7, width: 5, height: 5, borderRadius: "50%", background: t.second }} />
      {text}
    </div>
  );
}

// Хэсгүүдийн зааг — дээврийн ваар (scallop): дараагийн хэсгийн өнгө өмнөх рүү нуман хэлбэрээр
function Scallop({ prev, next }: { prev: string; next: string }) {
  return (
    <div aria-hidden="true" style={{
      height: 14,
      background: `radial-gradient(circle at 50% 100%, ${next} 0 12.5px, transparent 13.5px) 0 0 / 26px 14px repeat-x, ${prev}`,
    }} />
  );
}

// Гал голомтын оч — дээш хөвөх дулаан цэгүүд, fixed overlay
const EMBERS = Array.from({ length: 12 }, (_, i) => ({
  id: i, left: (i * 47 + 11) % 100, size: 4 + (i % 4) * 1.5, dur: 18 + (i % 5) * 3, delay: -((i * 3.1) % 21),
}));
function Embers() {
  const t = useT();
  return (
    <div className="t31-embers" aria-hidden="true" style={{
      position: "fixed", top: 0, bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "min(523px, 100%)", pointerEvents: "none", overflow: "hidden", zIndex: 6,
    }}>
      {EMBERS.map((e) => (
        <div key={e.id} className="t31-ember" style={{
          position: "absolute", left: e.left + "%", top: 0, width: e.size, height: e.size, borderRadius: "50%",
          background: t.ember, boxShadow: `0 0 ${e.size * 2}px ${t.ember}`, opacity: 0,
          ["--dur" as string]: e.dur + "s", ["--delay" as string]: e.delay + "s",
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
      <KeyIcon size={16} color={t.accentDeep} />
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${t.accent})` }} />
    </div>
  );
}

// ─── Жижиг UI хэсгүүд ────────────────────────────────────────────────────────
function Heading({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <div style={{ textAlign: "center", marginBottom: 26 }}>
      <h2 style={{ ...display, fontWeight: 600, fontStyle: "italic", fontSize: 34, lineHeight: 1.15, color: t.accentDeep, margin: 0 }}>
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
  const cls = `t31-btn t31-btn-${variant}`;
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

// Section: өмнөх хэсгийн өнгөн дээр ваарны зааг → өөрийн өнгөтэй агуулга
function Section({ tone, prev, children, id, style = {} }: {
  tone: Tone; prev: Tone; children: React.ReactNode; id?: string; style?: React.CSSProperties;
}) {
  const t = useT();
  const c = (x: Tone) => (x === "soft" ? t.soft : t.bg);
  return (
    <section id={id} style={{ background: c(prev), position: "relative" }}>
      <Scallop prev={c(prev)} next={c(tone)} />
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
function calendarUrl(event: EventData, title: string, location: string) {
  const [y, m, d] = (event.date || "").split("-").map(Number);
  const [hh, mm] = (event.time || "17:00").split(":").map(Number);
  if (!y || !m || !d) return "";
  const start = new Date(y, m - 1, d, hh, mm);
  const end   = new Date(start.getTime() + 3 * 3600000);
  const f = (x: Date) =>
    `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, "0")}${String(x.getDate()).padStart(2, "0")}T` +
    `${String(x.getHours()).padStart(2, "0")}${String(x.getMinutes()).padStart(2, "0")}00`;
  const q = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${f(start)}/${f(end)}`, location, ctz: "Asia/Ulaanbaatar" });
  return "https://calendar.google.com/calendar/render?" + q.toString();
}
const isDemo = (event: EventData) => event.id === "demo";
// Гэр бүлийн нэр: config.family.name → events.title
const familyName = (event: EventData) =>
  cfg(event.config, "family.name", event.title || "Манай гэр бүл");
// Бэлгийн данс: өгсөн үед л "Бэлэг" хэсэг гарна (demo-д жишээ дугаар)
const giftAccount = (event: EventData) =>
  cfg<string | null>(event.config, "gift.account", isDemo(event) ? "5012 3456 7890" : null);
// Demo-д хуримын DEMO_EVENT-ийн зочид буудлын оронд шинэ байрны хаяг харуулна
const DEMO_VENUE = { name: "Riverside хотхон, 12-р байр", address: "Хан-Уул дүүрэг, 15-р хороо, Их Монгол улсын гудамж" };
const venueName    = (event: EventData) => (isDemo(event) ? DEMO_VENUE.name : event.venue_name);
const venueAddress = (event: EventData) => (isDemo(event) ? DEMO_VENUE.address : event.venue_address);

// Шинэ хаягийн нэмэлт мэдээлэл — config.address.*
type AddrItem = { key: string; label: string; Icon: IconFn; value: string };
function addressItems(event: EventData): AddrItem[] {
  const demo = isDemo(event);
  const defs: { key: string; label: string; Icon: IconFn; demo: string }[] = [
    { key: "entrance", label: "Орц",          Icon: DoorIcon,   demo: "3-р орц" },
    { key: "floor",    label: "Давхар",       Icon: StairsIcon, demo: "7 давхар" },
    { key: "door",     label: "Тоот",         Icon: HomeIcon,   demo: "702 тоот" },
    { key: "code",     label: "Хаалганы код", Icon: LockIcon,   demo: "7021#" },
    { key: "parking",  label: "Зогсоол",      Icon: CarIcon,    demo: "Байрны урд талын зогсоол" },
  ];
  return defs
    .map((d) => ({ key: d.key, label: d.label, Icon: d.Icon, value: cfg<string | null>(event.config, `address.${d.key}`, demo ? d.demo : null) }))
    .filter((d): d is AddrItem => !!d.value);
}

// ─── Demo агуулга ────────────────────────────────────────────────────────────
type Wish = { name: string; message: string };
const DEMO_WISHES: Wish[] = [
  { name: "Эмээ, өвөө",  message: "Шинэ гэрийн чинь гал голомт мөнх бадарч, өлзий хутаг дүүрэн байх болтугай!" },
  { name: "Сараа эгч",   message: "Шинэ байрандаа ороход баяр хүргэе! Дулаан, гэрэлтэй, инээд хөөрөөр дүүрэн гэр байгаасай." },
  { name: "Найзууд",     message: "Хаалга чинь үргэлж найз нөхдөд нээлттэй, ширээ чинь үргэлж дүүрэн байх болтугай." },
];
const T31_DEFAULT_POEM = [
  "Шинэ гэрийнхээ гал голомтыг асааж,",
  "дулаан ширээгээ засч,",
  "хамаатан садан, найз нөхдийнхөө хамт",
  "тэмдэглэхээр бэлтгэж байна.",
  "",
  "Та бүхнийг хүрэлцэн ирэхийг урьж байна!",
];

// ─── Intro: хаалга нээх ──────────────────────────────────────────────────────
// Дарахад хоёр хавтас гадагш онгойж, доторх дулаан гэрэл гарна → overlay бүдгэрнэ
function DoorIntro({ onOpen, family }: { onOpen: () => void; family: string }) {
  const t = useT();
  const [opening, setOpening] = useState(false);
  const [exiting, setExiting] = useState(false);
  const open = () => {
    if (opening) return;
    setOpening(true); onOpen();
    setTimeout(() => setExiting(true), 750);
  };
  const W = 176, H = 262, R = W / 2;
  const panel = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute", top: 0, bottom: 0, width: "50%", [side]: 0,
    background: `linear-gradient(${side === "left" ? "90deg" : "270deg"}, ${t.woodDeep}, ${t.wood})`,
    borderRadius: side === "left" ? `${R}px 0 0 10px` : `0 ${R}px 10px 0`,
    transformOrigin: side === "left" ? "left center" : "right center",
    backfaceVisibility: "hidden", boxSizing: "border-box",
    boxShadow: side === "left" ? "inset -1px 0 0 rgba(0,0,0,.25)" : "inset 1px 0 0 rgba(0,0,0,.25)",
  });
  const inset = (top: number, height: number): React.CSSProperties => ({
    position: "absolute", left: 14, right: 14, top, height, borderRadius: 6,
    border: "2px solid rgba(0,0,0,.18)", boxShadow: "inset 0 0 0 2px rgba(255,255,255,.07)",
  });
  return (
    <motion.div
      initial={{ opacity: 1 }} animate={{ opacity: exiting ? 0 : 1 }} transition={{ duration: 0.9, ease: "easeOut" }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999, background: `linear-gradient(180deg, ${t.soft}, ${t.bg})`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        pointerEvents: exiting ? "none" : "auto", overflow: "hidden", padding: 16, boxSizing: "border-box",
      }}
    >
      <HouseMark width={96} />
      <div style={{ ...hand, fontWeight: 600, fontSize: 24, color: t.accentDeep, marginTop: 6 }}>Шинэ гэрийн найр</div>
      <div style={{ ...display, fontStyle: "italic", fontWeight: 600, fontSize: 28, color: t.ink, marginTop: 2, textAlign: "center", lineHeight: 1.15 }}>{family}</div>

      <button type="button" onClick={open} aria-label="Урилгыг нээх" className={opening ? undefined : "t31-knock"}
        style={{ background: "transparent", border: "none", padding: 0, marginTop: 26, cursor: "pointer", display: "block" }}>
        {/* хаалганы хүрээ */}
        <div style={{
          width: W + 16, height: H + 8, padding: "8px 8px 0", boxSizing: "border-box",
          background: t.accentLight, borderRadius: `${R + 8}px ${R + 8}px 14px 14px`,
          boxShadow: `0 20px 44px ${t.accentGlow}`,
        }}>
          <div style={{ position: "relative", width: W, height: H, borderRadius: `${R}px ${R}px 10px 10px`, perspective: 900 }}>
            {/* доторх гэрэл */}
            <motion.div aria-hidden="true"
              initial={{ opacity: 0.35 }} animate={{ opacity: opening ? 1 : 0.35 }} transition={{ duration: 0.8 }}
              style={{
                position: "absolute", inset: 0, borderRadius: "inherit",
                background: `radial-gradient(ellipse at 50% 70%, #FFF6DF 0%, ${t.ember} 55%, ${t.accentDeep} 100%)`,
              }} />
            {/* хавтаснууд */}
            <motion.div aria-hidden="true" style={panel("left")}
              animate={{ rotateY: opening ? -108 : 0 }} transition={{ duration: 1.1, ease: [0.5, 0, 0.2, 1] }}>
              <div style={inset(38, 86)} /><div style={inset(140, 100)} />
              <div style={{ position: "absolute", right: 10, top: "52%", width: 10, height: 10, borderRadius: "50%", background: t.second, boxShadow: "0 1px 3px rgba(0,0,0,.4)" }} />
            </motion.div>
            <motion.div aria-hidden="true" style={panel("right")}
              animate={{ rotateY: opening ? 108 : 0 }} transition={{ duration: 1.1, ease: [0.5, 0, 0.2, 1] }}>
              <div style={inset(38, 86)} /><div style={inset(140, 100)} />
              <div style={{ position: "absolute", left: 10, top: "52%", width: 10, height: 10, borderRadius: "50%", background: t.second, boxShadow: "0 1px 3px rgba(0,0,0,.4)" }} />
            </motion.div>
          </div>
        </div>
        {/* босго */}
        <div aria-hidden="true" style={{ width: W + 40, height: 10, margin: "0 auto", background: t.woodDeep, borderRadius: "0 0 6px 6px", opacity: 0.9 }} />
      </button>

      <div style={{ ...hand, fontWeight: 600, fontSize: 26, color: t.inkMuted, marginTop: 26, textAlign: "center" }}>
        Хаалгыг нээхийн тулд дарна уу
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
function T31Hero({ event, started }: { event: EventData; started: boolean }) {
  const t = useT();
  const family  = familyName(event);
  const eyebrow = cfg(event.config, "hero.eyebrow", "Шинэ гэрийн найрын урилга");
  const tagline = cfg<string | false>(event.config, "hero.tagline", t.tagline);
  const badge   = cfg<string | false>(event.config, "hero.badge", t.badge);
  const photo   = cfg<string | null>(event.config, "hero.photo", null) || event.main_image || event.person1_photo;
  const place   = cfg<string | false>(event.config, "hero.place", venueName(event) || false);
  const hostsLabel = cfg(event.config, "hosts.label", "Гэрийн эзэд");
  const hosts   = cfg<string[]>(event.config, "hosts.names", [event.person1_name, event.person2_name || ""].filter(Boolean));
  const showHosts = cfg(event.config, "hosts.show", true) !== false && hosts.length > 0;

  const nameSize =
    family.length <= 12 ? "clamp(44px, 13vw, 60px)" :
    family.length <= 20 ? "clamp(34px, 10vw, 48px)" :
                          "clamp(27px, 8vw, 38px)";

  const show = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: started ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.9, delay, ease: "easeOut" as const },
  });
  const scrollNext = () => document.getElementById("t31-letter")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <header style={{
      minHeight: "100svh", background: `linear-gradient(180deg, ${t.soft} 0%, ${t.bg} 100%)`, position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "28px 16px 76px", boxSizing: "border-box", textAlign: "center",
    }}>
      <motion.div {...show(0)}><HouseMark width={104} /></motion.div>

      <motion.div {...show(0.15)} style={{ ...hand, fontWeight: 600, fontSize: 25, color: t.accentDeep, marginTop: 4 }}>
        {eyebrow}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={started ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        style={{ position: "relative", marginTop: 16, paddingBottom: badge ? 18 : 0 }}
      >
        <ArchPhoto photo={photo} width={236} />
        {badge && <Plaque text={badge} style={{ bottom: 0 }} />}
      </motion.div>

      <motion.h1 {...show(0.55)} style={{
        ...display, fontWeight: 600, fontStyle: "italic", fontSize: nameSize, lineHeight: 1.05,
        color: t.accentDeep, margin: "22px 0 0", maxWidth: "100%", overflowWrap: "anywhere",
      }}>
        {family}
      </motion.h1>

      {tagline && (
        <motion.div {...show(0.65)} style={{ ...hand, fontWeight: 500, fontSize: 26, color: t.inkMuted, marginTop: 8 }}>
          {tagline}
        </motion.div>
      )}

      {showHosts && (
        <motion.div {...show(0.78)} style={{ ...body, fontSize: 17, color: t.ink, marginTop: 14 }}>
          <span style={{ color: t.inkMuted }}>{hostsLabel}: </span>
          {hosts.map((h, i) => (
            <span key={i}>
              <b style={{ fontWeight: 700 }}>{h}</b>
              {i < hosts.length - 1 && <span style={{ color: t.accent, margin: "0 8px" }}>·</span>}
            </span>
          ))}
        </motion.div>
      )}

      <motion.div {...show(0.9)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 20, width: "100%", maxWidth: 358 }}>
        <div style={{ width: 28, height: 1, background: t.accent, flexShrink: 0 }} />
        <div style={{ ...display, fontWeight: 600, fontSize: 22, color: t.ink, lineHeight: 1.2 }}>
          {fmtDate(event.date)}{event.time ? ` · ${event.time}` : ""}
        </div>
        <div style={{ width: 28, height: 1, background: t.accent, flexShrink: 0 }} />
      </motion.div>

      {place && (
        <motion.div {...show(1)} style={{ marginTop: 16 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: t.card, border: `1px solid ${t.line}`, borderRadius: 999, padding: "9px 16px", boxShadow: SHADOW_CARD, maxWidth: 340 }}>
            <PinIcon size={18} color={t.accentDeep} />
            <span style={{ ...bodyB, fontSize: 15, color: t.ink, textAlign: "left" }}>{place}</span>
          </div>
        </motion.div>
      )}

      <motion.button type="button" onClick={scrollNext} aria-label="Доош гүйлгэх"
        initial={{ opacity: 0 }} animate={started ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 1, delay: 1.4 }}
        style={{ position: "absolute", bottom: 16, left: "50%", marginLeft: -26, width: 52, height: 52, background: "transparent", border: "none", cursor: "pointer", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="t31-bounce"><ChevronsIcon size={28} color={t.accentDeep} /></div>
      </motion.button>
    </header>
  );
}

// ─── Урилгын үг ──────────────────────────────────────────────────────────────
function T31Letter({ event, tone, prev }: SecProps) {
  const t = useT();
  const lines = getPoemLines(event, T31_DEFAULT_POEM);
  return (
    <Section id="t31-letter" tone={tone} prev={prev}>
      <FadeUp>
        <div style={{ background: t.card, borderRadius: 24, boxShadow: SHADOW_CARD, padding: "34px 24px 26px", position: "relative", overflow: "hidden" }}>
          {/* булангийн хээ — нуман хаалганы ирмэг */}
          <div aria-hidden="true" style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", border: `14px solid ${t.accentLight}`, opacity: 0.7 }} />
          <div aria-hidden="true" style={{ position: "absolute", bottom: -46, left: -46, width: 120, height: 120, borderRadius: "50%", border: `14px solid ${t.second}`, opacity: 0.45 }} />
          <div aria-hidden="true" style={{ display: "flex", justifyContent: "center", marginBottom: 14, position: "relative" }}>
            <FlameIcon size={28} color={t.accent} />
          </div>
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
function T31Gallery({ event, tone, prev }: SecProps) {
  const t = useT();
  const title   = cfg(event.config, "gallery.title", "Шинэ гэрийн цомог");
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
      <div ref={trackRef} className="t31-carousel" onScroll={onScroll}
        style={{ display: "flex", gap: CARD_GAP, overflowX: "auto", scrollSnapType: "x mandatory", paddingInline: `calc(50% - ${CARD_W / 2}px)`, paddingBlock: "16px 20px", WebkitOverflowScrolling: "touch" }}>
        {sources.map((src, i) => {
          const isActive = i === active;
          // Цонх хэлбэр: нэг нь нуман, нэг нь дөрвөлжин — ээлжилнэ
          const arch = i % 2 === 0;
          return (
            <figure key={i} style={{
              flex: `0 0 ${CARD_W}px`, width: CARD_W, margin: 0, scrollSnapAlign: "center",
              background: t.card, padding: 8, borderRadius: arch ? "105px 105px 18px 18px" : 18,
              boxShadow: isActive ? `0 14px 30px ${t.accentGlow}` : SHADOW_CARD,
              outline: isActive ? `3px solid ${t.accent}` : "none", transition: "box-shadow .3s, outline-color .3s",
            }}>
              <div style={{ aspectRatio: "4 / 5", overflow: "hidden", borderRadius: arch ? "97px 97px 12px 12px" : 12, background: t.soft }}>
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
function T31Countdown({ event, tone, prev }: SecProps) {
  const t = useT();
  const title = cfg(event.config, "timer.title", "Найр эхлэхэд");
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
  const calUrl = calendarUrl(event, `${familyName(event)} — шинэ гэрийн найр`, [venueName(event), venueAddress(event)].filter(Boolean).join(", "));
  return (
    <Section tone={tone} prev={prev}>
      <FadeUp><Heading>{title}</Heading></FadeUp>
      <FadeUp>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {units.map((u) => (
            <div key={u.l} style={{ background: t.card, borderRadius: "22px 22px 14px 14px", boxShadow: SHADOW_CARD, padding: "18px 4px 12px", textAlign: "center", border: `1px solid ${t.line}` }}>
              <div style={{ ...display, fontWeight: 600, fontSize: 38, lineHeight: 1, color: t.accentDeep, fontVariantNumeric: "tabular-nums" }}>{pad(u.v)}</div>
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
const SCHEDULE_ICONS: IconFn[] = [KeyIcon, FlameIcon, CupIcon, MusicIcon, HeartIcon];
function T31Schedule({ event, tone, prev }: SecProps) {
  const t = useT();
  const title = cfg(event.config, "schedule.title", "Хөтөлбөр");
  const [hh, mm] = (event.time || "17:00").split(":").map(Number);
  const fmt = (h: number, m: number) =>
    String(Math.floor(h + m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  const items = getSchedule(event, [
    { time: fmt(hh, mm),        label: "Зочдыг угтах",   desc: "Шинэ гэрийн босгыг алхах" },
    { time: fmt(hh, mm + 30),   label: "Гэрийн ерөөл",   desc: "Гал голомтын ёслол, ахмадын ерөөл" },
    { time: fmt(hh + 1, mm),    label: "Зоог" },
    { time: fmt(hh + 2, mm + 30), label: "Хөгжим, бүжиг" },
  ]);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  const spine = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  return (
    <Section tone={tone} prev={prev}>
      <FadeUp><Heading>{title}</Heading></FadeUp>
      <div ref={ref} style={{ position: "relative", paddingLeft: 54 }}>
        <div aria-hidden="true" style={{ position: "absolute", left: 18, top: 20, bottom: 20, width: 2, backgroundImage: `repeating-linear-gradient(to bottom, ${t.line} 0 6px, transparent 6px 12px)` }} />
        <motion.div aria-hidden="true" style={{ position: "absolute", left: 18, top: 20, width: 2, height: spine, maxHeight: "calc(100% - 40px)", backgroundImage: `repeating-linear-gradient(to bottom, ${t.accentDeep} 0 6px, transparent 6px 12px)` }} />
        {items.map((it, i) => {
          const Icon = SCHEDULE_ICONS[i % SCHEDULE_ICONS.length];
          return (
            <FadeUp key={i} delay={Math.min(i, 5) * 0.12} style={{ position: "relative", marginBottom: 14 }}>
              <div aria-hidden="true" style={{
                position: "absolute", left: -54, top: 8, width: 38, height: 38, borderRadius: "50%",
                background: t.card, border: `2px solid ${t.accent}`, boxShadow: `0 0 0 4px ${tone === "soft" ? t.soft : t.bg}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={18} color={t.accentDeep} />
              </div>
              <div style={{ background: t.card, borderRadius: 18, padding: "14px 16px", boxShadow: SHADOW_CARD }}>
                <div style={{ ...display, fontWeight: 700, fontSize: 24, color: t.accentDeep, lineHeight: 1.1 }}>{it.time}</div>
                <div style={{ ...bodyB, fontSize: 16, color: t.ink, marginTop: 4 }}>{it.label}</div>
                {it.desc && <div style={{ ...body, fontSize: 14, color: t.inkMuted, marginTop: 4, lineHeight: 1.5 }}>{it.desc}</div>}
              </div>
            </FadeUp>
          );
        })}
      </div>
    </Section>
  );
}

// ─── Шинэ хаяг ───────────────────────────────────────────────────────────────
function T31Address({ event, tone, prev }: SecProps) {
  const t = useT();
  const title = cfg(event.config, "address.title", "Шинэ хаяг");
  const note  = cfg<string | null>(event.config, "address.note", null);
  const name  = venueName(event);
  const addr  = venueAddress(event);
  const items = addressItems(event);
  const mapHref = event.venue_map_url
    ? normalizeUrl(event.venue_map_url)
    : name ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(name) : "";

  const copy = async () => {
    const text = [name, addr, items.map((i) => `${i.label}: ${i.value}`).join(", ")].filter(Boolean).join("\n");
    try { await navigator.clipboard.writeText(text); toast.success("Хаяг хуулагдлаа"); }
    catch { toast.error("Хуулж чадсангүй — хаягийг гараар бичнэ үү"); }
  };

  return (
    <Section tone={tone} prev={prev}>
      <FadeUp><Heading>{title}</Heading></FadeUp>
      <FadeUp delay={0.08}>
        <div style={{ background: t.card, padding: 8, borderRadius: 24, boxShadow: SHADOW_CARD }}>
          <div style={{ aspectRatio: "16 / 10", borderRadius: 18, overflow: "hidden", background: t.soft, position: "relative" }}>
            {event.maps_photo ? (
              <Photo src={event.maps_photo} alt={name} />
            ) : (
              <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PinIcon size={44} color={t.accentDeep} />
              </div>
            )}
          </div>
        </div>
      </FadeUp>
      <FadeUp delay={0.12} style={{ textAlign: "center", marginTop: 22 }}>
        {name && <div style={{ ...display, fontWeight: 600, fontSize: 26, color: t.ink, lineHeight: 1.2 }}>{name}</div>}
        {addr && <div style={{ ...body, fontSize: 16, lineHeight: "24px", color: t.inkMuted, marginTop: 8 }}>{addr}</div>}
      </FadeUp>

      {items.length > 0 && (
        <FadeUp delay={0.16} style={{ marginTop: 20 }}>
          <div style={{ background: t.card, borderRadius: 22, boxShadow: SHADOW_CARD, padding: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {items.map(({ key, label, Icon, value }) => (
              <div key={key} style={{
                gridColumn: value.length > 16 ? "1 / -1" : "auto",
                display: "flex", alignItems: "center", gap: 10, background: t.soft, borderRadius: 14, padding: "10px 12px", minHeight: 56, boxSizing: "border-box",
              }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: t.card, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={18} color={t.accentDeep} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ ...bodyB, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: t.inkMuted, display: "block" }}>{label}</span>
                  <span style={{ ...bodyB, fontSize: 16, color: t.ink, display: "block", lineHeight: 1.25, overflowWrap: "anywhere" }}>{value}</span>
                </span>
              </div>
            ))}
          </div>
          {note && <div style={{ ...hand, fontWeight: 500, fontSize: 21, color: t.inkMuted, textAlign: "center", marginTop: 14, lineHeight: 1.3 }}>{note}</div>}
        </FadeUp>
      )}

      <FadeUp delay={0.2} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
        {mapHref && <Btn variant="primary" href={mapHref} icon={<PinIcon size={20} color={t.onAccent} />} style={{ width: "100%" }}>Google Maps-р харах</Btn>}
        {(name || addr) && <Btn variant="soft" onClick={copy} icon={<CopyIcon size={20} color={t.accentDeep} />} style={{ width: "100%" }}>Хаягийг хуулах</Btn>}
      </FadeUp>
    </Section>
  );
}

// ─── Бэлэг (сонголтоор: config.gift.account өгсөн үед) ───────────────────────
function T31Gift({ event, tone, prev }: SecProps) {
  const t = useT();
  const title   = cfg(event.config, "gift.title", "Бэлэг");
  const note    = cfg(event.config, "gift.note", "Та бүхний ирэлт, ерөөл бидэнд хамгийн үнэтэй бэлэг. Хүсвэл шинэ гэрийн тохижилтод:");
  const demo    = isDemo(event);
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
function T31Wishes({ event, tone, prev }: SecProps) {
  const t = useT();
  const eventId  = event.id;
  const title    = cfg(event.config, "wishes.title", "Ерөөл");
  const subtitle = cfg(event.config, "wishes.subtitle", "Шинэ гэрт зориулсан ерөөлөө үлдээгээрэй");
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
      <FadeUp><Heading>{title}</Heading></FadeUp>
      <FadeUp>
        <div style={{ ...hand, fontWeight: 500, fontSize: 22, color: t.inkMuted, textAlign: "center", marginBottom: 18 }}>
          {subtitle}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field id="t31-wish-name" label="Нэр" value={name} onChange={setName} placeholder="Таны нэр" />
          <Field id="t31-wish-msg" label="Ерөөл" textarea value={message} onChange={setMessage} placeholder="Шинэ гэрийн гал голомт мөнх бадраг…" />
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
              <div style={{ background: t.card, borderRadius: 20, padding: "16px 18px", boxShadow: SHADOW_CARD, position: "relative", overflow: "hidden", borderLeft: `4px solid ${i % 2 ? t.second : t.accentLight}` }}>
                <div aria-hidden="true" style={{ position: "absolute", right: 14, top: 12, opacity: 0.9 }}><FlameIcon size={16} color={i % 2 ? t.secondDeep : t.accent} /></div>
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
function T31RSVP({ event, tone, prev }: SecProps) {
  const t = useT();
  const title     = cfg(event.config, "rsvp.title", "Ирцээ бүртгүүлэх");
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
      <FadeUp><Heading>{title}</Heading></FadeUp>
      <FadeUp>
        <div style={{ background: t.card, borderRadius: 24, padding: 22, boxShadow: SHADOW_CARD, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field id="t31-rsvp-name" label="Нэр" value={name} onChange={setName} placeholder="Таны нэр" />
          <Field id="t31-rsvp-phone" label="Утас" type="tel" inputMode="numeric" value={phone} onChange={setPhone} placeholder="9900 1122" />
          <div>
            <div style={{ ...bodyB, fontSize: 14, lineHeight: "20px", color: t.ink, marginBottom: 8 }}>Хүний тоо</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, minHeight: 52 }}>
              {stepBtn(-1)}
              <div aria-live="polite" style={{ ...display, fontWeight: 700, fontSize: 28, color: t.ink, minWidth: 40, textAlign: "center" }}>{guests}</div>
              {stepBtn(1)}
            </div>
          </div>
          <Field id="t31-rsvp-msg" label="Мессеж" textarea value={message} onChange={setMessage} placeholder="Нэмэлт мэдээлэл" />
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
function T31Footer({ event, prev }: { event: EventData; prev: Tone }) {
  const t = useT();
  const title  = cfg(event.config, "footer.title", "Та бүхнийг хүлээж байна");
  const lines  = cfg<string[]>(event.config, "footer.lines", []);
  const phones = cfg<string[]>(event.config, "footer.phones", []).filter(Boolean);
  const img    = cfg<string | null>(event.config, "footer.image", null) || event.gallery_photos?.[0] || null;
  const prevC  = prev === "soft" ? t.soft : t.bg;
  return (
    <footer style={{ background: prevC, position: "relative" }}>
      <Scallop prev={prevC} next={t.accentLight} />
      <div style={{ background: t.accentLight, padding: "8px 16px 96px", position: "relative", textAlign: "center" }}>
        {img && (
          <FadeUp>
            <div style={{ width: 150, height: 176, borderRadius: "75px 75px 16px 16px", overflow: "hidden", margin: "16px auto 0", border: `5px solid ${t.card}`, boxShadow: SHADOW_CARD }}>
              <Photo src={img} alt="" />
            </div>
          </FadeUp>
        )}
        <FadeUp delay={0.05}>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
            <HomeIcon size={22} color={t.accentDeep} />
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
      <div className={playing ? "t31-pulse" : undefined}>
        {playing ? <MusicIcon size={24} color={t.accentDeep} /> : <MusicOffIcon size={24} color={t.accentDeep} />}
      </div>
    </button>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
export function HouseWarming({ event, theme }: { event: EventData; theme: Theme["key"] }) {
  const themeKey = cfg<Theme["key"]>(event.config, "theme", theme);
  const t = THEMES[themeKey] ?? THEMES[theme];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // config.intro.video: видео URL → видео intro; false → intro-гүй; байхгүй → хаалга нээх intro
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

  // Харагдах section-уудыг дарааллаар нь ээлжлэн soft / bg өнгөөр (зааг зөв зурагдана)
  const c = event.config;
  type B = (p: { tone: Tone; prev: Tone }) => React.ReactNode;
  const blocks: B[] = [
    (p) => <T31Letter key="letter" event={event} {...p} />,
    ...(sectionOn(c, "gallery")  ? [((p) => <T31Gallery key="gallery" event={event} {...p} />) as B] : []),
    ...(sectionOn(c, "timer")    ? [((p) => <T31Countdown key="timer" event={event} {...p} />) as B] : []),
    ...(sectionOn(c, "schedule") ? [((p) => <T31Schedule key="schedule" event={event} {...p} />) as B] : []),
    (p) => <T31Address key="address" event={event} {...p} />,
    ...(sectionOn(c, "gift") && giftAccount(event) ? [((p) => <T31Gift key="gift" event={event} {...p} />) as B] : []),
    ...(sectionOn(c, "wishes")   ? [((p) => <T31Wishes key="wishes" event={event} {...p} />) as B] : []),
    ...(sectionOn(c, "rsvp")     ? [((p) => <T31RSVP key="rsvp" event={event} {...p} />) as B] : []),
  ];
  const toneAt = (i: number): Tone => (i % 2 === 0 ? "soft" : "bg");

  return (
    <ThemeCtx.Provider value={t}>
      <div className="t31" lang="mn" style={{ maxWidth: 523, margin: "0 auto", ...body, overflowX: "clip", background: t.bg, color: t.ink }}>
        <Styles />
        {introVideo === undefined && !started && <DoorIntro onOpen={start} family={familyName(event)} />}
        {typeof introVideo === "string" && <VideoIntro src={introVideo} onDone={start} />}
        <Embers />

        <T31Hero event={event} started={started} />
        {blocks.map((b, i) => b({ tone: toneAt(i), prev: i === 0 ? "bg" : toneAt(i - 1) }))}
        <T31Footer event={event} prev={toneAt(blocks.length - 1)} />

        <audio ref={audioRef} loop src={event.music_url ?? ""} preload="auto" />
        {event.music_url && <MusicToggle audioRef={audioRef} />}
        <Toaster />
      </div>
    </ThemeCtx.Provider>
  );
}

// Template 31 — Терракота (terra) theme
export default function Template31({ event }: { event: EventData }) {
  return <HouseWarming event={event} theme="terra" />;
}
