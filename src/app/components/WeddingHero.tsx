import { motion, AnimatePresence } from "motion/react";
import { Heart } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState } from "react";
import { EventData } from "../../types/event";

const EASE = [0.22, 1, 0.36, 1] as const;

// Hero картан дээр Supabase-ийн person1_name / person2_name-ийн оронд гарах нэр.
// Зөвхөн энд бүртгэсэн slug дээр — footer болон бусад хэсэг хэвээрээ.
const HERO_NAMES: Record<string, [string, string]> = {
  "batzaya-delgersaihan": ["ЗАЯА", "ДЭЭГИЙ"],
};

// "Бидний хайрын түүх" гарчгийн доорх "нэр ♥ нэр" мөрийг нуух slug-ууд.
const HIDE_STORY_NAMES = new Set<string>(["ganbaatar-maralgua"]);

const QUOTES = [
  '"Чамайг хайрлах нь үүлсийн цаанаас ч дулаацуулах нарны гэрэл мэт Үзэгдэхгүй атлаа зүрхэнд үргэлж оршдог."',
  '"Хоёр зүрх нэгэн хэмнэлээр цохилох үед Орчлон ертөнц сая нэг бүрэн бүтэн болдог."',
  '"Орон зайн алс, цаг хугацааны уртад ч Хайрын торгон утас хэзээ ч тасардаггүй."',
  '"Амьдралын минь саарал өдрүүдийг гэрэлтүүлэх Хамгийн тод өнгө бол чиний инээмсэглэл."',
  '"Чамтай өнгөрүүлэх хором мөч бүр Цаг хугацааны хүрдийг дэндүү яаруулах юм."',
  '"Харцны минь гүн дэх цэнхэр тэнгэрт Зөвхөн чиний л дүр тодрон үлддэг."',
  '"Бидний хайр хаврын анхны цэцэг мэт Хяруунд жихүүцэх эмзэг ч, цасыг нэвтлэх тийм хүчтэй."',
  '"Чамтай өнгөрүүлсэн хором бүр Зүрхний гүнд хэзээ ч бүдгэршгүй дурсамж болон мөнхөрнө."',
];

// QUOTES-ийн англи орчуулга — ЯГ ижил дараалалтай байх ёстой. Доорх slug
// дээр монгол ишлэлийн оронд эдгээр гарна (орчуулга байгаа эхний 5 дээр;
// үлдсэн дээр монголоороо хэвээр).
const QUOTES_EN = [
  '"Loving you is like sunlight that warms me even from beyond the mountains — unseen, yet always present in my heart."',
  '"When two hearts beat in the same rhythm, the universe finally becomes whole."',
  '"Even across the distance of space and the passage of time, the delicate thread of love never breaks."',
  '"Your smile is the brightest color that lights up the boring days of my life."',
  '"Every moment we spend together seems to make time rush by far too quickly."',
];
const ENGLISH_QUOTES = new Set<string>(["ganbaatar-maralgua"]);

// "Бидний хайрын түүх" гарчгийг солих slug-ууд.
const STORY_TITLE: Record<string, string> = {
  "ganbaatar-maralgua": "Our love story",
};

// Carousel-ийн зураг тус бүрийн тайлбар. Түлхүүр нь зурагны бүтэн URL.
// Бүртгээгүй зураг дээр нийтлэг QUOTES эргэлдэнэ. "\n" нь шинэ мөр.
const BAASANBAT = "https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/baasanbat";
const PHOTO_CAPTIONS: Record<string, Record<string, string>> = {
  "baasanbat-buyn-od": {
    [`${BAASANBAT}/gallery1.jpg`]: "Бидний үерхсэн өдөр\n2023.10.10",
    [`${BAASANBAT}/gallery2.jpg`]: "Бэр болсон өдөр\n2026.03.27",
    [`${BAASANBAT}/gallery3.jpg`]: "Сүй тавьсан өдөр\n2026.07.17",
    [`${BAASANBAT}/gallery4.jpg`]: QUOTES[3],
    [`${BAASANBAT}/gallery5.jpg`]: QUOTES[1],
  },
};

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
        {/* whitespace-pre-line — тайлбар доторх шинэ мөр хадгалагдана */}
        <p className={`text-white leading-relaxed italic whitespace-pre-line ${small ? "text-[10px]" : "text-xs"}`}>
          {quote}
        </p>
      </div>
    </div>
  );
}

type Props = { event: EventData };

export function WeddingHero({ event }: Props) {
  const [current, setCurrent] = useState(0);

  // Нүүр зургийн жинхэнэ харьцаанд тааруулна — босоо зураг тайрагдалгүй бүтнээр гарна.
  // 3/4 (0.75) хүртэл өргөн, 1/2 (0.5) хүртэл нарийн зөвшөөрнө; бусад тохиолдолд clamp.
  const [heroRatio, setHeroRatio] = useState(3 / 4);

  // Оруулсан зурагтаа тааруулж slide үүсгэнэ — дутууг нь placeholder-аар нөхөхгүй.
  // Огт зураг байхгүй үед л FALLBACK ажиллана (demo, хоосон event эвдрэхгүй).
  const photos = (event.gallery2_photos || []).filter(Boolean);
  const sources = photos.length > 0 ? photos : FALLBACK_SRCS;
  // Зурагт тусгайлан бичсэн тайлбар байвал түүнийг, үгүй бол нийтлэг ишлэлийг
  const captions = PHOTO_CAPTIONS[event.slug];
  const useEnglish = ENGLISH_QUOTES.has(event.slug);
  const slides = sources.map((src, i) => {
    const n = i % QUOTES.length;
    return {
      src,
      quote: captions?.[src] ?? (useEnglish ? QUOTES_EN[n] ?? QUOTES[n] : QUOTES[n]),
    };
  });

  const prev  = (current - 1 + slides.length) % slides.length;
  const prev2 = (current - 2 + slides.length) % slides.length;
  const next  = (current + 1) % slides.length;
  const next2 = (current + 2) % slides.length;

  // 5 байрлалтай carousel: зураг цөөн бол хажуугийн картууд давхардана.
  const showSide = slides.length >= 3;   // зүүн/баруун дунд карт
  const showFar  = slides.length >= 5;   // хамгийн захын жижиг карт

  const heroSrc = event.main_image ||
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800";

  // Hero дээр Supabase-ийн нэрийн оронд өөр нэр (хочит нэр гэх мэт) харуулах
  // slug-ууд. Footer болон бусад хэсэг хэвээрээ.
  const [name1, name2] = HERO_NAMES[event.slug] ?? [event.person1_name, event.person2_name];

  const altText = name2 ? `${name1} & ${name2}` : name1;

  // Урт нэрэнд фонтыг жижигрүүлж багтаана — нэр бүр өөрөө задрахгүй (whitespace-nowrap).
  const maxNameLen = Math.max((name1 || "").length, (name2 || "").length);
  const nameSize =
    maxNameLen > 13 ? "text-lg sm:text-2xl md:text-3xl" :
    maxNameLen > 9  ? "text-xl sm:text-2xl md:text-4xl" :
                      "text-2xl sm:text-3xl md:text-4xl";

  return (
    <>
      <section className="flex flex-col justify-center items-center py-10 px-4 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, ease: EASE }}
          style={{ aspectRatio: heroRatio }}
          className="relative w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl"
        >
          <ImageWithFallback
            src={heroSrc}
            alt={altText}
            className="w-full h-full object-cover"
            onLoad={(e) => {
              const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
              if (w && h) setHeroRatio(Math.min(Math.max(w / h, 0.5), 0.75));
            }}
          />
          {/* Нэр, огноо хоёр картны ДООД хэсэгт зэрэгцэнэ. Дээд талын жижиг
              бичиг (wedding дээр хоосон) mb-auto-гоор дээрээ тогтоно. */}
          <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-end py-8 px-6">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: EASE }}
              className="text-white/80 text-xs tracking-widest italic mb-auto"
            >
              {event.type === "wedding" ? "" : "You're invited to"}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.9, ease: EASE }}
              className={`text-white ${nameSize} text-center leading-tight w-full break-words mb-3`}
              // PT Serif — монгол кирилл ө, ү-г бүрэн дэмждэг. Dancing Script
              // эдгээр үсгийг агуулдаггүй тул нэр fallback фонтоор гардаг байв.
              style={{ fontFamily: "'PT Serif', serif" }}
            >
              {name2 ? (
                <>
                  <span className="whitespace-nowrap">{name1}</span>
                  <span style={{ fontStyle: "italic", margin: "0 6px" }}>&</span>
                  <span className="whitespace-nowrap">{name2}</span>
                </>
              ) : (
                <span className="whitespace-nowrap">{name1}</span>
              )}
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

        {/* Доош гүйлгэхийг сануулах — карт гарч дууссаны дараа зөөлөн илэрнэ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1.2, ease: EASE }}
          className="mt-7 text-center text-gray-400"
        >
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <p className="text-xs tracking-wide">Урилгыг доош гүйлгэж үзнэ үү</p>
            <svg width="18" height="10" viewBox="0 0 18 10" fill="none" className="mx-auto mt-1.5">
              <path d="M1 1L9 8L17 1" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
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
          <h2 className="text-4xl md:text-5xl font-serif text-gray-800 mb-2">
            {STORY_TITLE[event.slug] ?? "Бидний хайрын түүх"}
          </h2>
          {event.person2_name && !HIDE_STORY_NAMES.has(event.slug) && (
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
          className={`relative flex items-center justify-center w-full h-[500px] md:h-[620px] select-none ${
            slides.length > 1 ? "cursor-grab active:cursor-grabbing touch-none" : ""
          }`}
          drag={slides.length > 1 ? "x" : false}
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
          {showFar && (
            <div
              className="absolute pointer-events-none"
              style={{ transform: "translateX(-410px) scale(0.62)", opacity: 0.3, zIndex: 0 }}
            >
              <SlideCard src={slides[prev2].src} quote={slides[prev2].quote} tiny />
            </div>
          )}

          {/* Left */}
          {showSide && (
            <div
              className="absolute pointer-events-none"
              style={{ transform: "translateX(-230px) scale(0.8)", opacity: 0.6, zIndex: 1 }}
            >
              <SlideCard src={slides[prev].src} quote={slides[prev].quote} small />
            </div>
          )}

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
          {showSide && (
            <div
              className="absolute pointer-events-none"
              style={{ transform: "translateX(230px) scale(0.8)", opacity: 0.6, zIndex: 1 }}
            >
              <SlideCard src={slides[next].src} quote={slides[next].quote} small />
            </div>
          )}

          {/* Far right */}
          {showFar && (
            <div
              className="absolute pointer-events-none"
              style={{ transform: "translateX(410px) scale(0.62)", opacity: 0.3, zIndex: 0 }}
            >
              <SlideCard src={slides[next2].src} quote={slides[next2].quote} tiny />
            </div>
          )}
        </motion.div>

        <div className={`items-center gap-2 mt-10 ${slides.length > 1 ? "flex" : "hidden"}`}>
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
