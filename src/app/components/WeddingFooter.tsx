import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EventData } from "../../types/event";
import { cfg } from "../../lib/eventConfig";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";

// Footer-ийн зургийг main_image-ээс өөр зургаар солих slug-ууд.
// config: footer.image
const FOOTER_IMAGE: Record<string, string> = {
  "baasanbat-buyn-od":
    "https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/baasanbat/tugsgul.jpg",
};

// Хосын нэрийн доор гарах үр хүүхдийн нэр — зөвхөн бүртгэсэн slug дээр.
// config: footer.children
const FOOTER_CHILDREN: Record<string, string[]> = {
  "dawaajargal-otgondawaa": ["Хүү: Д.Саруул-Эрдэнэ"],
};

// Footer дэх хосын нэрийг гар бичмэл фонтоор харуулах slug-ууд. Hero дээрх
// HERO_NAME_FONT-той хосолж, урилга даяар нэг фонттой байлгана.
// ⚠ Фонт нь монгол кирилл ө (U+04E9), ү (U+04AF)-г агуулсан байх ёстой.
// config: footer.font
const FOOTER_NAME_FONT: Record<string, { family: string; size: string }> = {
  "odbayr-bujinlham": {
    family: "'Caveat', cursive",
    size: "text-4xl sm:text-5xl",
  },
};

type Props = { event: EventData };

export function WeddingFooter({ event }: Props) {
  const imgSrc = cfg<string | undefined>(event.config, "footer.image", FOOTER_IMAGE[event.slug]) || event.main_image || FALLBACK_IMAGE;
  const footerChildren = cfg<string[] | undefined>(event.config, "footer.children", FOOTER_CHILDREN[event.slug]);
  // config: footer.phones (массив) эсвэл footer.phone ("99..., 88..." мөр).
  // Template13 дээр ганц мөрөөр бичдэг тул хоёуланг нь хүлээж авна.
  const rawPhones = cfg<string[] | string | undefined>(
    event.config, "footer.phones", cfg<string | undefined>(event.config, "footer.phone", undefined),
  );
  const footerPhones = (Array.isArray(rawPhones) ? rawPhones : String(rawPhones ?? "").split(","))
    .map((t) => String(t).trim())
    .filter(Boolean);
  const footerPhoneLabel = cfg<string>(event.config, "footer.phoneLabel", "Холбогдох утас:");
  // config: footer.eyebrow — нэрийн дээрх жижиг бичиг ("" бол алга болно)
  const footerEyebrow = cfg<string>(event.config, "footer.eyebrow", event.type !== "wedding" ? "You're invited to" : "");

  const displayTitle = event.person2_name
    ? `${event.person1_name} & ${event.person2_name}`
    : event.person1_name;

  // Урт нэрэнд фонтыг жижигрүүлж багтаана — нэр бүр өөрөө задрахгүй (whitespace-nowrap).
  const maxNameLen = Math.max(
    (event.person1_name || "").length,
    (event.person2_name || "").length,
  );
  const nameFont = cfg<{ family: string; size: string } | undefined>(event.config, "footer.font", FOOTER_NAME_FONT[event.slug]);
  const nameSize = nameFont?.size ??
    (maxNameLen > 13 ? "text-2xl sm:text-3xl" :
     maxNameLen > 9  ? "text-3xl sm:text-4xl" :
                       "text-4xl sm:text-5xl");

  return (
    <footer className="relative h-64 md:h-80 overflow-hidden">
      {/* Дэвсгэр: зургийн бүдэгрүүлсэн хувилбар — босоо зураг contain болоход хажуугийн хоосон зурвасыг дүүргэнэ */}
      <ImageWithFallback
        src={imgSrc}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl"
      />
      {/* Урд талд: бүтэн зураг тайрагдалгүй багтана */}
      <ImageWithFallback
        src={imgSrc}
        alt={displayTitle}
        className="absolute inset-0 w-full h-full object-contain"
      />
      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center px-6 pt-14 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-white w-full"
        >
          {footerEyebrow && (
            <p className="text-xs tracking-widest mb-3 text-white/60 uppercase">
              {footerEyebrow}
            </p>
          )}
          <h2
            className={`${nameSize} mb-3 leading-tight break-words`}
            // PT Serif — монгол кирилл ө, ү-г бүрэн дэмждэг (Dancing Script үгүй)
            style={{ fontFamily: nameFont?.family ?? "'PT Serif', serif" }}
          >
            {event.person2_name ? (
              <>
                <span className="whitespace-nowrap">{event.person1_name}</span>
                <span style={{ fontStyle: "italic", margin: "0 6px" }}>&</span>
                <span className="whitespace-nowrap">{event.person2_name}</span>
              </>
            ) : (
              <span className="whitespace-nowrap">{event.person1_name}</span>
            )}
          </h2>
          {footerChildren && footerChildren.length > 0 && (
            <div className="mb-3 space-y-1" style={{ fontFamily: "'PT Serif', serif" }}>
              {footerChildren.map((line) => (
                <p key={line} className="text-base sm:text-lg text-white/85">
                  {line}
                </p>
              ))}
            </div>
          )}
          {footerPhones.length > 0 && (
            <p className="mb-3 text-base sm:text-lg text-white/85" style={{ fontFamily: "'PT Serif', serif" }}>
              {footerPhoneLabel}{" "}
              {footerPhones.map((tel, i) => (
                <span key={tel}>
                  {i > 0 && ", "}
                  <a href={`tel:${tel.replace(/[^0-9+]/g, "")}`} className="text-white/85 no-underline">
                    {tel}
                  </a>
                </span>
              ))}
            </p>
          )}
          <p className="text-sm text-white/60 tracking-wide">{event.date}</p>
        </motion.div>
      </div>
    </footer>
  );
}
