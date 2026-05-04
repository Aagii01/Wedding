import { motion, AnimatePresence } from "motion/react";
import { Heart } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState } from "react";
import { EventData } from "../../types/event";

const EASE = [0.22, 1, 0.36, 1] as const;

const QUOTES = [
  '"Таталцлын хүч хүмүүсийг хайрт болгодоггүй." —Альберт Эйнштейн',
  '"Зуун зүрх ч гэсэн миний хайрыг тэвэрч чадахгүй." —Тодорхойгүй',
  '"Амьдралыг хайрын нүдээр харвал дэлхий өөрийн гоо сайхнаа нээнэ." —Дайсаку Икеда',
  '"Чамайг тэврэн буй хайр чинь чиний хамгийн том хүч." —Тодорхойгүй',
  '"Хайр бол хоёр хүний нэг мөрөөдлийг хуваалцах явдал." —Тодорхойгүй',
  '"Чиний нүд дотор би гэрийн дулааныг олдог." —Тодорхойгүй',
  '"Хамтдаа байх агшин бүр хамгийн үнэ цэнэтэй эрдэнэ." —Тодорхойгүй',
  '"Хайр цаг хугацааны хязгаарыг мэддэггүй." —Тодорхойгүй',
];

const FALLBACK_SRCS = [
  "https://images.unsplash.com/photo-1761211488173-a7154314420a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1519741497674-611481863552?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1529636798458-92182e662485?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1591604466107-ec97de577aff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
];

function SlideCard({ src, quote, small, tiny }: { src: string; quote: string; small?: boolean; tiny?: boolean }) {
  return (
    <div
      className={`${
        tiny  ? "w-32 h-[240px] md:w-44 md:h-[320px]" :
        small ? "w-48 h-[340px] md:w-64 md:h-[440px]" :
                "w-64 h-[460px] md:w-96 md:h-[560px]"
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

type Props = { event: EventData };

export function WeddingHero({ event }: Props) {
  const [current, setCurrent] = useState(0);

  const slides = QUOTES.map((quote, i) => ({
    src: event.gallery2_photos?.[i] || FALLBACK_SRCS[i],
    quote,
  }));

  const prev  = (current - 1 + slides.length) % slides.length;
  const prev2 = (current - 2 + slides.length) % slides.length;
  const next  = (current + 1) % slides.length;
  const next2 = (current + 2) % slides.length;

  const heroSrc = event.main_image ||
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800";

  const displayTitle = event.person2_name
    ? `${event.person1_name} & ${event.person2_name}`
    : event.person1_name;

  return (
    <>
      <section className="flex justify-center items-center py-10 px-4 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, ease: EASE }}
          className="relative w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl aspect-[3/4]"
        >
          <ImageWithFallback
            src={heroSrc}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-between py-8 px-6">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: EASE }}
              className="text-white/80 text-xs tracking-widest italic"
            >
              {event.type === "wedding" ? "" : "You're invited to"}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.9, ease: EASE }}
              className="text-white text-4xl text-center leading-tight"
              style={{ fontFamily: "'Dancing Script', cursive" }}
            >
              {displayTitle}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.8, ease: EASE }}
              className="text-white/85 text-sm tracking-wide"
            >
              {event.date}
            </motion.p>
          </div>
        </motion.div>
      </section>

      <section className="bg-[#d0cfc8] flex flex-col items-center py-16 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl md:text-5xl font-serif text-gray-800 mb-2">Бидний хайрын түүх</h2>
          {event.person2_name && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.7, ease: EASE }}
              className="flex items-center justify-center gap-2 text-gray-600"
            >
              <span className="text-base font-serif">{event.person1_name}</span>
              <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
              <span className="text-base font-serif">{event.person2_name}</span>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          className="relative flex items-center justify-center w-full h-[500px] md:h-[620px] cursor-grab active:cursor-grabbing touch-none select-none"
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
          {/* Far left */}
          <div
            className="absolute pointer-events-none"
            style={{ transform: "translateX(-410px) scale(0.62)", opacity: 0.3, zIndex: 0 }}
          >
            <SlideCard src={slides[prev2].src} quote={slides[prev2].quote} tiny />
          </div>

          {/* Left */}
          <div
            className="absolute pointer-events-none"
            style={{ transform: "translateX(-230px) scale(0.8)", opacity: 0.6, zIndex: 1 }}
          >
            <SlideCard src={slides[prev].src} quote={slides[prev].quote} small />
          </div>

          {/* Center */}
          <div className="absolute pointer-events-none" style={{ zIndex: 10 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -10 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <SlideCard src={slides[current].src} quote={slides[current].quote} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right */}
          <div
            className="absolute pointer-events-none"
            style={{ transform: "translateX(230px) scale(0.8)", opacity: 0.6, zIndex: 1 }}
          >
            <SlideCard src={slides[next].src} quote={slides[next].quote} small />
          </div>

          {/* Far right */}
          <div
            className="absolute pointer-events-none"
            style={{ transform: "translateX(410px) scale(0.62)", opacity: 0.3, zIndex: 0 }}
          >
            <SlideCard src={slides[next2].src} quote={slides[next2].quote} tiny />
          </div>
        </motion.div>

        <div className="flex items-center gap-2 mt-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === current ? "bg-gray-600 w-6" : "bg-gray-400 w-2"
              }`}
            />
          ))}
        </div>
      </section>
    </>
  );
}
