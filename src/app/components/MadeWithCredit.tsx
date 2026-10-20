import { Facebook, Instagram, Phone } from "lucide-react";
import { BRAND } from "../../lib/brand";

// Урилга бүрийн хамгийн доод талд гарах жижиг брэндийн мөр.
// EventPage-д template-ийн дараа нэг удаа render хийгддэг тул бүх загварт
// (шинээр нэмэгдэх загварт ч) автоматаар гарна. Demo iframe-д гарахгүй.
// Захиалагч хүсвэл `config.sections.credit: false`-оор нууна.
//
// Бүтэц: "Урилгыг eurilga.com ♡-аар хийв." → "Захиалга өгөх →" | FB · IG · утас.
// Template бүр өөр өнгөтэй тул бараан, саармаг туузаар "footer-ийн доорх" тусдаа
// давхарга мэт харагдуулна. bg / ink: config.style.creditBg / creditInk-ээр солигдоно.
export function MadeWithCredit({ bg, ink }: { bg?: string; ink?: string }) {
  const brand = ink ?? "#d4b483";
  const sub = ink ? `color-mix(in srgb, ${ink} 75%, transparent)` : "rgba(245,240,232,0.75)";
  const line = ink ? `color-mix(in srgb, ${ink} 30%, transparent)` : "rgba(245,240,232,0.25)";

  const iconLink = (href: string, label: string, Icon: typeof Facebook, external = true) => (
    <a
      href={href}
      aria-label={label}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      style={{ color: brand, display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40 }}
    >
      <Icon size={19} strokeWidth={1.7} />
    </a>
  );

  return (
    <div
      style={{
        background: bg ?? "#1c1917",
        padding: "22px 16px 24px",
        textAlign: "center",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
      }}
    >
      <div style={{ fontSize: 17, fontStyle: "italic", color: sub, lineHeight: 1.4 }}>
        Урилгыг{" "}
        <a href="/" target="_blank" rel="noopener" style={{ color: brand, fontStyle: "normal", fontWeight: 700, textDecoration: "none" }}>
          {BRAND.domain}
        </a>{" "}
        <span aria-hidden="true" style={{ color: brand }}>♡</span>-аар хийв.
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 }}>
        <a
          href="/"
          target="_blank"
          rel="noopener"
          style={{
            color: brand, textDecoration: "none", fontWeight: 600, fontSize: 14,
            letterSpacing: "0.06em", padding: "8px 10px", whiteSpace: "nowrap",
          }}
        >
          Захиалга өгөх →
        </a>
        <span aria-hidden="true" style={{ width: 1, height: 18, background: line, margin: "0 4px" }} />
        {iconLink(BRAND.facebook, "Facebook", Facebook)}
        {iconLink(BRAND.instagram, "Instagram", Instagram)}
        {iconLink(`tel:${BRAND.phone}`, `Утас ${BRAND.phone}`, Phone, false)}
      </div>
    </div>
  );
}
