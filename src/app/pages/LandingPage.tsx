import { motion, useMotionValue, useTransform, useAnimationFrame } from "motion/react";
import { Heart } from "lucide-react";
import { useRef } from "react";

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61582580015733";

const templates = [
  {
    id: "elegant",
    name: "Elegant",
    description: "Цагаан, нарийн, дэгжин",
    available: true,
    preview: { bg: "#f5f0eb", badge: "#c9a87c", title: "#5a4a3a", sub: "#9a8878", border: "#e8e0d8" },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Хар тэнгэр, алтан гоёл",
    available: false,
    preview: { bg: "#0f1b2d", badge: "#d4af37", title: "#f0e6c8", sub: "#8a9ab5", border: "#1e3050" },
  },
  {
    id: "botanical",
    name: "Botanical",
    description: "Ногоон, байгалийн",
    available: false,
    preview: { bg: "#2d4a3e", badge: "#a8c5a0", title: "#e8f0e5", sub: "#8aab8a", border: "#3d6050" },
  },
  {
    id: "blush",
    name: "Blush",
    description: "Ягаан, романтик",
    available: false,
    preview: { bg: "#fdf0f3", badge: "#e8a0b0", title: "#7a4a5a", sub: "#c08090", border: "#f5dde3" },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Цэвэр, орчин үеийн",
    available: false,
    preview: { bg: "#ffffff", badge: "#1a1a1a", title: "#1a1a1a", sub: "#888888", border: "#e8e8e8" },
  },
];

const DOUBLED = [...templates, ...templates];
const CARD_SPACING = 270;
const TOTAL_SHIFT = CARD_SPACING * templates.length;
const CENTER_BASE = -(DOUBLED.length * CARD_SPACING) / 2 + CARD_SPACING / 2;

function TemplateCard({ template }: { template: (typeof templates)[0] }) {
  const p = template.preview;
  return (
    <div
      className="flex flex-col items-center justify-between py-8 px-7 shadow-2xl rounded-3xl"
      style={{ width: 230, height: 370, background: p.bg, border: `1px solid ${p.border}` }}
    >
      <div className="w-7 h-7 rounded-full" style={{ background: p.badge, opacity: 0.85 }} />
      <div className="text-center">
        <p className="text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: p.sub }}>
          The wedding of
        </p>
        <h3
          className="text-[34px] leading-tight mb-2"
          style={{ fontFamily: "'Dancing Script', cursive", color: p.title }}
        >
          Болд
          <br />& Сарнай
        </h3>
        <div className="w-10 h-px mx-auto my-3" style={{ background: p.badge }} />
        <p className="text-[10px] tracking-widest" style={{ color: p.sub }}>
          2026 · 07 · 15
        </p>
      </div>
      <div className="text-center">
        <p className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: p.sub }}>
          {template.name}
        </p>
        {!template.available && (
          <p className="text-[9px] mt-1" style={{ color: p.sub, opacity: 0.5 }}>Удахгүй</p>
        )}
      </div>
    </div>
  );
}

function FanCard({
  template,
  offset,
  baseX,
}: {
  template: (typeof templates)[0];
  offset: ReturnType<typeof useMotionValue<number>>;
  baseX: number;
}) {
  const x = useTransform(offset, (off) => baseX + off);
  const rotateY = useTransform(x, [-500, -200, 0, 200, 500], [55, 25, 0, -25, -55]);
  const scale   = useTransform(x, [-350, 0, 350], [0.72, 1.0, 0.72]);
  const opacity = useTransform(x, [-480, -280, 0, 280, 480], [0, 0.65, 1, 0.65, 0]);
  const zIndex  = useTransform(x, (v) => Math.round(100 - Math.abs(v) / 5));

  return (
    <motion.div
      style={{ x, rotateY, scale, opacity, zIndex, position: "absolute", transformStyle: "preserve-3d" }}
    >
      <TemplateCard template={template} />
    </motion.div>
  );
}

function FanCarousel() {
  const offset = useMotionValue(0);
  const paused = useRef(false);

  useAnimationFrame((_, delta) => {
    if (!paused.current) {
      let next = offset.get() - delta * 0.07;
      if (next <= -TOTAL_SHIFT) next += TOTAL_SHIFT;
      offset.set(next);
    }
  });

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: 460, perspective: 1200 }}
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {DOUBLED.map((t, i) => (
          <FanCard
            key={`${t.id}-${i}`}
            template={t}
            offset={offset}
            baseX={CENTER_BASE + i * CARD_SPACING}
          />
        ))}
      </div>

      {/* Edge gradient fades */}
      <div className="absolute inset-y-0 left-0 w-28 md:w-48 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-28 md:w-48 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </div>
  );
}

export function LandingPage() {
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

      {/* Fan Carousel */}
      <section className="py-4">
        <FanCarousel />
        <div className="text-center mt-4 px-4">
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gray-900 text-white text-sm font-medium px-10 py-3.5 rounded-full hover:bg-gray-700 transition-colors"
          >
            Захиалга өгөх →
          </a>
        </div>
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
