import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { X } from "lucide-react";
import { EventData } from "../../types/event";

const EASE = [0.22, 1, 0.36, 1] as const;

const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
  "https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&q=80",
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80",
];

// Зургийг тайрахгүйн тулд masonry (CSS columns) — өндөр нь зурагны
// жинхэнэ харьцаагаар тодорхойлогдоно. Босоо, хэвтээ хоёулаа бүтэн харагдана.
const COLUMNS: Record<number, string> = {
  1: "columns-1",
  2: "columns-2",
  3: "columns-2 md:columns-3",
  4: "columns-2",
};

type Props = { event: EventData };

function Tile({
  src,
  delay,
  onClick,
}: {
  src: string;
  delay: number;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-40px 0px" }}
      transition={{ duration: 0.78, delay, ease: EASE }}
      className="relative overflow-hidden rounded-2xl cursor-pointer group mb-2 md:mb-3 break-inside-avoid"
      onClick={onClick}
    >
      <img
        src={src}
        alt="gallery"
        loading="lazy"
        decoding="async"
        className="block w-full h-auto transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300 rounded-2xl" />
    </motion.div>
  );
}

export function GallerySection({ event }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Оруулсан зурагтаа тааруулна — дутууг placeholder-аар нөхөхгүй.
  // Огт зураг байхгүй үед л PLACEHOLDERS ажиллана (demo эвдрэхгүй).
  const provided = (event.gallery_photos || []).filter(Boolean);
  const photos = provided.length > 0 ? provided : PLACEHOLDERS;
  const columns = COLUMNS[photos.length] || "columns-2 md:columns-3";

  return (
    <>
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px 0px" }}
            transition={{ duration: 0.75, ease: EASE }}
            className="text-center mb-10"
          >
      
            <h2 className="text-3xl font-serif text-gray-800">Зургийн цомог</h2>
          </motion.div>

          {/* Masonry — зураг бүр тайрагдалгүй бүтнээрээ орно */}
          <div className={`${columns} gap-2 md:gap-3`}>
            {photos.map((src, i) => (
              <Tile
                key={i}
                src={src}
                delay={Math.min(i, 4) * 0.1}
                onClick={() => setLightbox(src)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.35, ease: EASE }}
              src={lightbox}
              alt="full"
              className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.1, duration: 0.25, ease: EASE }}
              onClick={() => setLightbox(null)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
