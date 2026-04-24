import { motion, AnimatePresence } from "motion/react";
import { Heart } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState } from "react";

const slides = [
  {
    src: "https://images.unsplash.com/photo-1761211488173-a7154314420a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    quote: '"Gravitation is not responsible for people falling in love." —Albert Einstein',
  },
  {
    src: "https://images.unsplash.com/photo-1519741497674-611481863552?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    quote: '"A hundred hearts would be too few to carry all my love for you." —Unknown',
  },
  {
    src: "https://images.unsplash.com/photo-1606800052052-a08af7148866?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    quote: '"If we look at the world with a love of life, the world will reveal its beauty to us." —Daisaku Ikeda',
  },
  {
    src: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    quote: '"You are only as strong as the love that holds you." —Unknown',
  },
];

function SlideCard({ src, quote, small }: { src: string; quote: string; small?: boolean }) {
  return (
    <div
      className={`${
        small ? "w-48 h-[340px]" : "w-64 h-[460px]"
      } rounded-3xl overflow-hidden shadow-2xl relative flex-shrink-0`}
    >
      <ImageWithFallback src={src} alt="Wedding photo" className="w-full h-full object-cover" />
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
        <p className={`text-white leading-relaxed italic ${small ? "text-[10px]" : "text-xs"}`}>
          {quote}
        </p>
      </div>
    </div>
  );
}

export function WeddingHero() {
  const [current, setCurrent] = useState(0);


  const prev = (current - 1 + slides.length) % slides.length;
  const next = (current + 1) % slides.length;

  return (
    <>
      {/* Hero Banner Card */}
      <section className="flex justify-center items-center py-10 px-4 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative w-full max-w-xs mx-auto rounded-3xl overflow-hidden shadow-2xl"
          style={{ height: 260  }}
        >
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
            alt="Болд & Сарнай"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-between py-8 px-6">
            <p className="text-white/80 text-xs tracking-widest italic">The wedding of</p>
            <h1
              className="text-white text-5xl text-center leading-tight"
              style={{ fontFamily: "'Dancing Script', cursive" }}
            >
              Болд & Сарнай
            </h1>
            <p className="text-white/85 text-sm tracking-wide">Friday, July 15th, 2026</p>
          </div>
        </motion.div>
      </section>

      {/* Our Love Story Carousel */}
      <section className="bg-[#d0cfc8] flex flex-col items-center py-16 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2.7 }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl md:text-5xl font-serif text-gray-800 mb-2">Our Love Story</h2>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <span className="text-base font-serif">Болд</span>
            <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
            <span className="text-base font-serif">Сарнай</span>
          </div>
        </motion.div>

        <motion.div
          className="relative flex items-center justify-center w-full h-[500px] cursor-grab active:cursor-grabbing touch-none select-none"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60 || info.velocity.x < -400) {
              setCurrent(next);
            } else if (info.offset.x > 60 || info.velocity.x > 400) {
              setCurrent(prev);
            }
          }}
        >
          <div
            className="absolute pointer-events-none"
            style={{ transform: "translateX(-230px) scale(0.8)", opacity: 0.6, zIndex: 1 }}
          >
            <SlideCard src={slides[prev].src} quote={slides[prev].quote} small />
          </div>

          <div className="absolute pointer-events-none" style={{ zIndex: 10 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <SlideCard src={slides[current].src} quote={slides[current].quote} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div
            className="absolute pointer-events-none"
            style={{ transform: "translateX(230px) scale(0.8)", opacity: 0.6, zIndex: 1 }}
          >
            <SlideCard src={slides[next].src} quote={slides[next].quote} small />
          </div>
        </motion.div>

        <div className="flex items-center gap-2 mt-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "bg-gray-600 w-6" : "bg-gray-400 w-2"
              }`}
            />
          ))}
        </div>
      </section>
    </>
  );
}
