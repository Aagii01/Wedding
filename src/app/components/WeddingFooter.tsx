import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EventData } from "../../types/event";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";

// Footer-ийн зургийг main_image-ээс өөр зургаар солих slug-ууд.
const FOOTER_IMAGE: Record<string, string> = {
  "baasanbat-buyn-od":
    "https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/baasanbat/tugsgul.jpg",
};

type Props = { event: EventData };

export function WeddingFooter({ event }: Props) {
  const imgSrc = FOOTER_IMAGE[event.slug] || event.main_image || FALLBACK_IMAGE;

  const displayTitle = event.person2_name
    ? `${event.person1_name} & ${event.person2_name}`
    : event.person1_name;

  // Урт нэрэнд фонтыг жижигрүүлж багтаана — нэр бүр өөрөө задрахгүй (whitespace-nowrap).
  const maxNameLen = Math.max(
    (event.person1_name || "").length,
    (event.person2_name || "").length,
  );
  const nameSize =
    maxNameLen > 13 ? "text-2xl sm:text-3xl" :
    maxNameLen > 9  ? "text-3xl sm:text-4xl" :
                      "text-4xl sm:text-5xl";

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
      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-white w-full"
        >
          {event.type !== "wedding" && (
            <p className="text-xs tracking-widest mb-3 text-white/60 uppercase">
              You're invited to
            </p>
          )}
          <h2
            className={`${nameSize} mb-3 leading-tight break-words`}
            // PT Serif — монгол кирилл ө, ү-г бүрэн дэмждэг (Dancing Script үгүй)
            style={{ fontFamily: "'PT Serif', serif" }}
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
          <p className="text-sm text-white/60 tracking-wide">{event.date}</p>
        </motion.div>
      </div>
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-white/30 text-[10px] tracking-widest uppercase">Special Day</p>
      </div>
    </footer>
  );
}
