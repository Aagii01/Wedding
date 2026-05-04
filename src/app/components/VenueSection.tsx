import { motion } from "motion/react";
import { MapPin } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EventData } from "../../types/event";

const EASE = [0.22, 1, 0.36, 1] as const;

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";

type Props = { event: EventData };

export function VenueSection({ event }: Props) {
  return (
    <section className="py-4 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-40px 0px" }}
          transition={{ duration: 0.85, ease: EASE }}
          className="rounded-3xl overflow-hidden shadow-xl relative"
        >
          <div className="h-64 md:h-80">
            <ImageWithFallback
              src={event.maps_photo || FALLBACK_IMAGE}
              alt={event.venue_name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-end">
            <div className="p-6 flex items-end justify-between w-full">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.7, ease: EASE }}
              >
                <div className="flex items-center gap-1 text-white/70 text-xs mb-1">
                  <MapPin className="w-3 h-3" />
                  <span>Байршил</span>
                </div>
                <h3 className="text-white text-lg font-semibold leading-tight">{event.venue_name}</h3>
                <p className="text-white/70 text-sm">{event.venue_address}</p>
              </motion.div>
              {event.venue_map_url && (
                <motion.a
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
                  href={event.venue_map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-gray-800 text-xs font-medium px-5 py-2.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 ml-4"
                >
                  Байршил харах
                </motion.a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
