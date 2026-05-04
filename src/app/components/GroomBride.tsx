import { motion } from "motion/react";
import { Instagram } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EventData } from "../../types/event";

const EASE = [0.22, 1, 0.36, 1] as const;

const FALLBACK_GROOM = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop&q=80";
const FALLBACK_BRIDE = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&fit=crop&q=80";

type Props = { event: EventData };

export function GroomBride({ event }: Props) {
  const persons = [
    {
      role: event.person1_role,
      name: event.person1_name,
      photo: event.person1_photo || FALLBACK_GROOM,
      instagram: event.person1_instagram,
    },
    ...(event.person2_name
      ? [
          {
            role: event.person2_role || "Bride",
            name: event.person2_name,
            photo: event.person2_photo || FALLBACK_BRIDE,
            instagram: event.person2_instagram || "",
          },
        ]
      : []),
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className={`max-w-2xl mx-auto grid gap-8 md:gap-20 ${persons.length > 1 ? "grid-cols-2" : "grid-cols-1 place-items-center"}`}>
        {persons.map((person, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i === 0 ? -28 : 28, scale: 0.97 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px 0px" }}
            transition={{ duration: 0.75, delay: i * 0.12, ease: EASE }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden mb-4 shadow-lg ring-4 ring-gray-100">
              <ImageWithFallback
                src={person.photo}
                alt={person.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-1">{person.role}</p>
            <h3 className="text-xl font-serif mb-1">{person.name}</h3>
            {person.instagram && (
              <a
                href={`https://instagram.com/${person.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mt-2"
              >
                <Instagram className="w-3.5 h-3.5" />
                {person.instagram.startsWith("@") ? person.instagram : `@${person.instagram}`}
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
