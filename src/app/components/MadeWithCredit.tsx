// Урилга бүрийн хамгийн доод талд гарах жижиг брэндийн мөр.
// EventPage-д template-ийн дараа нэг удаа render хийгддэг тул бүх загварт
// (шинээр нэмэгдэх загварт ч) автоматаар гарна. Demo iframe-д гарахгүй.
// Захиалагч хүсвэл `config.sections.credit: false`-оор нууна.
//
// Template бүр өөр өнгөтэй тул тус бүрт тааруулахын оронд бараан, саармаг
// туузаар "footer-ийн доорх" тусдаа давхарга мэт харагдуулна.

// bg / ink: config.style.creditBg / creditInk-ээр солигдоно (тохируулаагүй бол анхдагч).
export function MadeWithCredit({ bg, ink }: { bg?: string; ink?: string }) {
  const brand = ink ?? "#d4b483";
  const sub = ink ? `color-mix(in srgb, ${ink} 75%, transparent)` : "rgba(245,240,232,0.75)";
  return (
    <div
      style={{
        background: bg ?? "#1c1917",
        padding: "22px 16px 26px",
        textAlign: "center",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
      }}
    >
      <a
        href="/"
        target="_blank"
        rel="noopener"
        style={{ color: "inherit", textDecoration: "none", display: "inline-block" }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: brand,
            fontWeight: 600,
          }}
        >
          Special Day
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 15,
            fontStyle: "italic",
            color: sub,
          }}
        >
          Та ч гэсэн ийм урилга хийлгэх үү? →
        </div>
      </a>
    </div>
  );
}
