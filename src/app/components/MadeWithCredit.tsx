// Урилга бүрийн хамгийн доод талд гарах жижиг брэндийн мөр.
// EventPage-д template-ийн дараа нэг удаа render хийгддэг тул бүх загварт
// (шинээр нэмэгдэх загварт ч) автоматаар гарна. Demo iframe-д гарахгүй.
// Захиалагч хүсвэл `config.sections.credit: false`-оор нууна.
//
// Template бүр өөр өнгөтэй тул тус бүрт тааруулахын оронд бараан, саармаг
// туузаар "footer-ийн доорх" тусдаа давхарга мэт харагдуулна.

export function MadeWithCredit() {
  return (
    <div
      style={{
        background: "#1c1917",
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
            color: "#d4b483",
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
            color: "rgba(245,240,232,0.75)",
          }}
        >
          Та ч гэсэн ийм урилга хийлгэх үү? →
        </div>
      </a>
    </div>
  );
}
