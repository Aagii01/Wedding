import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61582580015733";

const templates = [
  {
    id: "elegant",
    name: "Elegant",
    description: "Цагаан, нарийн, дэгжин",
    available: true,
    preview: {
      bg: "#f5f0eb",
      badge: "#c9a87c",
      title: "#5a4a3a",
      sub: "#9a8878",
      border: "#e8e0d8",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Хар тэнгэр, алтан гоёл",
    available: false,
    preview: {
      bg: "#0f1b2d",
      badge: "#d4af37",
      title: "#f0e6c8",
      sub: "#8a9ab5",
      border: "#1e3050",
    },
  },
  {
    id: "botanical",
    name: "Botanical",
    description: "Ногоон, байгалийн",
    available: false,
    preview: {
      bg: "#2d4a3e",
      badge: "#a8c5a0",
      title: "#e8f0e5",
      sub: "#8aab8a",
      border: "#3d6050",
    },
  },
  {
    id: "blush",
    name: "Blush",
    description: "Ягаан, романтик",
    available: false,
    preview: {
      bg: "#fdf0f3",
      badge: "#e8a0b0",
      title: "#7a4a5a",
      sub: "#c08090",
      border: "#f5dde3",
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Цэвэр, орчин үеийн",
    available: false,
    preview: {
      bg: "#ffffff",
      badge: "#1a1a1a",
      title: "#1a1a1a",
      sub: "#888888",
      border: "#e8e8e8",
    },
  },
];

// 3D position config for each slot
const SLOTS = [
  { rotateY: 40,  x: -310, z: -160, scale: 0.72, opacity: 0.6 },  // far-left
  { rotateY: 20,  x: -170, z: -60,  scale: 0.86, opacity: 0.85 }, // left
  { rotateY: 0,   x: 0,    z: 0,    scale: 1,    opacity: 1 },    // center
  { rotateY: -20, x: 170,  z: -60,  scale: 0.86, opacity: 0.85 }, // right
  { rotateY: -40, x: 310,  z: -160, scale: 0.72, opacity: 0.6 },  // far-right
];

function TemplateCard({
  template,
  slotIndex,
  isCurrent,
  onClick,
}: {
  template: (typeof templates)[0];
  slotIndex: number;
  isCurrent: boolean;
  onClick: () => void;
}) {
  const p = template.preview;
  const slot = SLOTS[slotIndex];

  return (
    <motion.div
      onClick={onClick}
      animate={{
        x: slot.x,
        z: slot.z,
        rotateY: slot.rotateY,
        scale: slot.scale,
        opacity: slot.opacity,
      }}
      transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
      className="absolute cursor-pointer"
      style={{
        width: 176,
        height: 280,
        borderRadius: 24,
        transformStyle: "preserve-3d",
        zIndex: isCurrent ? 10 : 1,
      }}
    >
      {/* Card face */}
      <div
        className="w-full h-full rounded-3xl flex flex-col items-center justify-between py-7 px-5 shadow-2xl"
        style={{
          background: p.bg,
          border: `1px solid ${p.border}`,
        }}
      >
        {/* Top ornament */}
        <div
          className="w-7 h-7 rounded-full"
          style={{ background: p.badge, opacity: 0.85 }}
        />

        {/* Center */}
        <div className="text-center ">
          <p
            className="text-[8px] tracking-[0.2em] uppercase mb-3"
            style={{ color: p.sub }}
          >
            The wedding of
          </p>
          <h3
            className="text-[26px] leading-tight mb-2"
            style={{ fontFamily: "'Dancing Script', cursive", color: p.title }}
          >
            Болд
            <br />& Сарнай
          </h3>
          <div
            className="w-8 h-px mx-auto my-3"
            style={{ background: p.badge }}
          />
          <p className="text-[8px] tracking-widest" style={{ color: p.sub }}>
            2026 · 07 · 15
          </p>
        </div>

        {/* Bottom */}
        <div className="text-center">
          <p
            className="text-[8px] tracking-widest uppercase font-semibold"
            style={{ color: p.sub }}
          >
            {template.name}
          </p>
          {!template.available && (
            <p className="text-[7px] mt-1" style={{ color: p.sub, opacity: 0.5 }}>
              Удахгүй
            </p>
          )}
        </div>
      </div>

      {/* Shine overlay on center card */}
      {isCurrent && (
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)",
          }}
        />
      )}
    </motion.div>
  );
}

export function LandingPage() {
  const [current, setCurrent] = useState(0);

  const go = (dir: 1 | -1) => {
    setCurrent((prev) => (prev + dir + templates.length) % templates.length);
  };

  // Map template index → slot index (0=far-left .. 4=far-right)
  const getSlot = (index: number): number => {
    const diff = (index - current + templates.length) % templates.length;
    // diff: 0=center(2), 1=right(3), 2=far-right(4), 3=far-left(0), 4=left(1)
    const map: Record<number, number> = { 0: 2, 1: 3, 2: 4, 3: 0, 4: 1 };
    return map[diff];
  };

  const active = templates[current];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero */}
      <section className="pt-16 pb-6 px-4 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-xs tracking-[0.25em] uppercase text-gray-400 mb-4"
        >
          Танилцуулж байна
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4"
        >
          Хурим, баярын урилгын
          <br />
          вэб загварууд
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed"
        >
          Хялбар тохируулдаг, хурдан хуваалцдаг,
          <br />
          таны онцгой өдрийн зориулалттай
        </motion.p>
      </section>

      {/* 3D Carousel */}
      <section className="relative py-10">
        {/* Perspective wrapper */}
        <div
          className="relative flex items-center justify-center mx-auto"
          style={{
            height: 340,
            perspective: "900px",
            perspectiveOrigin: "50% 50%",
          }}
        >
          <div
            style={{ position: "relative", transformStyle: "preserve-3d" }}
          >
            {templates.map((t, i) => (
              <TemplateCard
                key={t.id}
                template={t}
                slotIndex={getSlot(i)}
                isCurrent={i === current}
                onClick={() => setCurrent(i)}
              />
            ))}
          </div>
        </div>

        {/* Nav buttons */}
        <button
          onClick={() => go(-1)}
          className="absolute left-4 md:left-16 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition z-20"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => go(1)}
          className="absolute right-4 md:right-16 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition z-20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {templates.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "bg-gray-800 w-6" : "bg-gray-300 w-1.5"
              }`}
            />
          ))}
        </div>
      </section>

      {/* CTA card */}
      <section className="px-4 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-sm mx-auto text-center"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-1">{active.name}</h2>
            <p className="text-sm text-gray-400 mb-5">{active.description}</p>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gray-900 text-white text-sm font-medium px-10 py-3.5 rounded-full hover:bg-gray-700 transition-colors"
            >
              {active.available ? "Энэ загварыг захиалах →" : "Захиалга өгөх →"}
            </a>
            {!active.available && (
              <p className="text-xs text-gray-400 mt-3">Энэ загвар удахгүй нэмэгдэнэ</p>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* How it works */}
      <section className="px-4 py-14 bg-gray-50 mt-4">
        <div className="max-w-sm mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-10">
            Яаж ажилладаг вэ?
          </h2>
          <div className="space-y-8">
            {[
              { n: "01", title: "Загвар сонгох", desc: "Таны хэв маягт тохирсон загварыг сонгоно" },
              { n: "02", title: "Захиалга өгөх", desc: "Facebook хуудасны маань рүү холбогдоно уу" },
              { n: "03", title: "Мэдэгдэл хүлээн авах", desc: "24 цагийн дотор урилгыг тань бэлдэж өгнө" },
              { n: "04", title: "Хуваалцах", desc: "Линк хуулаад найз нөхөддөө явуулна" },
            ].map((step) => (
              <div key={step.n} className="flex gap-5 items-start">
                <span className="text-2xl font-bold text-gray-200 w-10 flex-shrink-0">{step.n}</span>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-0.5">{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 py-14 text-center">
        <Heart className="w-6 h-6 text-rose-400 fill-rose-400 mx-auto mb-4" />
        <h2
          className="text-4xl text-gray-800 mb-4"
          style={{ fontFamily: "'Dancing Script', cursive" }}
        >
          Таны онцгой өдөр
        </h2>
        <p className="text-sm text-gray-400 mb-8">Загвар сонгоод захиалгаа өгнө үү</p>
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-gray-900 text-white text-sm font-medium px-10 py-3.5 rounded-full hover:bg-gray-700 transition-colors"
        >
          Захиалга өгөх →
        </a>
      </section>

      <div className="text-center py-6 border-t border-gray-100">
        <p className="text-xs text-gray-300 tracking-widest uppercase">One Wedding © 2026</p>
      </div>
    </div>
  );
}
