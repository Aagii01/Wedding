import { EventData } from "../../types/event";

// ─── palette ─────────────────────────────────────────────────────────────────
const KRAFT = "#E3D9C6"; // цаасан (kraft) дэвсгэр
const KRAFT_DARK = "#D8CCB4";
const GOLD = "#C9A227";
const INK = "#1F1B16";

// ─── fonts ────────────────────────────────────────────────────────────────────
// Dancing Script нь кирилл үсэг дэмждэг цөөн script фонтын нэг тул нэрэнд
// ашиглав (Great Vibes / Pinyon Script кирилл дэмждэггүй).
const script = { fontFamily: "'Dancing Script', cursive", fontWeight: 700 } as const;
const serif  = { fontFamily: "'Cormorant Garamond', serif" } as const;

const cap: React.CSSProperties = {
  ...serif,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
};

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200";

// events хүснэгтэд утасны багана байхгүй тул шууд бичсэн
const DEFAULT_PHONES = ["88118273", "80909026"];

const WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];

// ─── Алтан навчны чимэглэл ────────────────────────────────────────────────────
function GoldLeaves({ size = 240, rotate = 0, style = {} }: {
  size?: number; rotate?: number; style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 240 240" fill="none"
      style={{ position: "absolute", transform: `rotate(${rotate}deg)`, ...style }}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Гол мөчир */}
      <path d="M18 222 C70 186, 112 140, 150 74" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" />
      {/* Салаа мөчир */}
      <path d="M74 186 C96 168, 118 158, 148 154" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" />

      {/* Навчнууд — гадна контур + доторх судал */}
      {[
        { x: 44,  y: 200, r: -32, s: 1.05 },
        { x: 74,  y: 168, r: -26, s: 1.2  },
        { x: 104, y: 132, r: -20, s: 1.1  },
        { x: 130, y: 96,  r: -14, s: 0.95 },
        { x: 148, y: 62,  r: -6,  s: 0.8  },
        { x: 112, y: 160, r: 46,  s: 0.9  },
        { x: 140, y: 152, r: 62,  s: 0.75 },
      ].map(({ x, y, r, s }, i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
          <path
            d="M0 0 C16 -10, 34 -8, 44 6 C34 20, 16 22, 0 12 Z"
            stroke={GOLD} strokeWidth="1.3" fill="none" strokeLinejoin="round"
          />
          <path d="M2 6 L42 6" stroke={GOLD} strokeWidth="0.9" />
          {[10, 18, 26, 34].map((vx) => (
            <g key={vx}>
              <path d={`M${vx} 6 L${vx - 5} -2`} stroke={GOLD} strokeWidth="0.7" />
              <path d={`M${vx} 6 L${vx - 5} 14`} stroke={GOLD} strokeWidth="0.7" />
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

// ─── Босоо тусгаарлагч зурвас ─────────────────────────────────────────────────
function VRule() {
  return <div style={{ width: 1, alignSelf: "stretch", background: INK, opacity: 0.55 }} />;
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Template17({ event }: { event: EventData }) {
  const name1 = event.person1_name || "Б.Ууганбаяр";
  const name2 = event.person2_name || "Ш.Баасанбаяр";
  const photo = event.main_image || FALLBACK_PHOTO;

  const [y, m, d] = (event.date || "2026-08-17").split("-");
  const dateObj = new Date(`${y}-${m}-${d}T00:00:00`);
  const weekday = WEEKDAYS[Number.isNaN(dateObj.getTime()) ? 0 : dateObj.getDay()];

  // Нэр бүр тусдаа эгнээнд. Үсгийн хэмжээг хамгийн урт нэрнээс хамааруулна.
  const longest = Math.max(name1.length, name2.length);
  const nameSize =
    longest <= 10 ? "clamp(34px, 9.5vw, 52px)" :
    longest <= 13 ? "clamp(29px, 8vw, 44px)" :
                    "clamp(24px, 6.6vw, 37px)";

  const phones =
    [event.person1_phone, event.person2_phone].filter(Boolean).length > 0
      ? [event.person1_phone, event.person2_phone].filter(Boolean) as string[]
      : DEFAULT_PHONES;

  return (
    <div style={{
      minHeight: "100svh",
      background: `radial-gradient(120% 80% at 50% 0%, ${KRAFT} 0%, ${KRAFT_DARK} 100%)`,
      display: "flex", justifyContent: "center",
      overflow: "hidden",
    }}>
      <div style={{
        position: "relative",
        width: "100%", maxWidth: 520,
        minHeight: "100svh",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* ── Зураг: зууван нуман хэлбэр ── */}
        <div style={{
          position: "relative",
          width: "112%", marginLeft: "-6%",
          height: "clamp(300px, 52svh, 520px)",
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
        }}>
          <img
            src={photo}
            alt={`${name1} & ${name2}`}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>

        {/* ── Алтан навчнууд ── */}
        <GoldLeaves size={230} rotate={0}   style={{ top: -26, left: -54, opacity: 0.85 }} />
        <GoldLeaves size={230} rotate={-90} style={{ top: -26, right: -54, opacity: 0.85 }} />
        <GoldLeaves size={200} rotate={90}  style={{ bottom: -34, left: -48, opacity: 0.7 }} />
        <GoldLeaves size={200} rotate={180} style={{ bottom: -34, right: -48, opacity: 0.7 }} />

        {/* ── Бичвэр ── */}
        <div style={{
          position: "relative", zIndex: 2,
          flex: 1,
          display: "flex", flexDirection: "column", justifyContent: "center",
          textAlign: "center",
          padding: "clamp(18px, 4vw, 32px) clamp(24px, 7vw, 44px) clamp(26px, 5vw, 40px)",
          gap: "clamp(12px, 2.4vw, 20px)",
        }}>
          <div style={{ ...cap, fontSize: "clamp(16px, 4.2vw, 21px)", color: INK }}>
            Хуримын ёслол
          </div>

          {/* Урт нэрс нэг мөрөнд багтахгүй тул тусад нь эгнүүлнэ */}
          <div style={{
            ...script,
            fontSize: nameSize,
            color: INK,
            lineHeight: 1.2,
            maxWidth: "100%",
            overflowWrap: "break-word",
          }}>
            <div>{name1}</div>
            {name2 && <div>{name2}</div>}
          </div>

          <div style={{
            ...cap,
            fontWeight: 700,
            fontSize: "clamp(14px, 3.6vw, 18px)",
            letterSpacing: "0.14em",
            color: INK,
            lineHeight: 1.75,
          }}>
            Та бүхнийг хуримын<br />ёслолдоо урьж байна
          </div>

          {/* Огноо */}
          <div style={{
            display: "flex", alignItems: "stretch", justifyContent: "center",
            gap: "clamp(12px, 4vw, 24px)",
            padding: "clamp(6px, 1.6vw, 12px) 0",
          }}>
            <div style={{ ...cap, fontSize: "clamp(14px, 3.6vw, 18px)", color: INK, alignSelf: "center" }}>
              {Number(m)}-р сар
            </div>
            <VRule />
            <div>
              <div style={{ ...cap, fontSize: "clamp(19px, 5.2vw, 26px)", color: INK, lineHeight: 1.2 }}>
                {weekday}
              </div>
              <div style={{ ...serif, fontWeight: 700, fontSize: "clamp(38px, 10vw, 54px)", color: INK, lineHeight: 1 }}>
                {Number(d)}
              </div>
            </div>
            <VRule />
            <div style={{ ...cap, fontSize: "clamp(14px, 3.6vw, 18px)", color: INK, alignSelf: "center" }}>
              {y}
            </div>
          </div>

          {event.time && (
            <div style={{ ...cap, fontSize: "clamp(15px, 4vw, 19px)", color: INK }}>
              {event.time} цагт
            </div>
          )}

          <div style={{ ...cap, fontSize: "clamp(15px, 4vw, 19px)", color: INK }}>
            {event.venue_name || "Evento Ballroom"}
          </div>

          {event.venue_address && (
            <div style={{
              ...serif, fontWeight: 600,
              fontSize: "clamp(15px, 3.8vw, 18px)",
              color: INK, lineHeight: 1.6,
            }}>
              {event.venue_address}
            </div>
          )}

          {phones.length > 0 && (
            <div style={{
              ...cap,
              fontWeight: 700,
              fontSize: "clamp(15px, 4vw, 19px)",
              letterSpacing: "0.1em",
              color: INK,
            }}>
              Утас:{" "}
              {phones.map((tel, i) => (
                <span key={tel}>
                  {i > 0 && ", "}
                  <a href={`tel:${tel}`} style={{ color: INK, textDecoration: "none" }}>{tel}</a>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
