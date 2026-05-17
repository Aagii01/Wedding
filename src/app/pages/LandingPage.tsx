import {
  motion,
  useMotionValue,
  useTransform,
  useAnimationFrame,
  useScroll,
} from "motion/react";
import { Heart } from "lucide-react";
import { useRef, useMemo } from "react";

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61582580015733";

const DEMO_SLUGS: Record<string, string> = {
  "11": "",
  "12": "",
  "13": "",
  "14": "",
};

const TEMPLATES = [
  {
    id: "11",
    name: "Classic",
    tagline: "Цагаан · Нарийн · Дэгжин",
    desc: "Цэвэр цагаан фон, хөх лацан дарааст захиа. Хэнд ч таарах сонгодог загвар.",
    bg: "#ffffff",
    accent: "#0f1b35",
    text: "#1a1a2e",
    soft: "#6b7280",
    swatches: ["#0f1b35", "#162240", "#f8f5f0", "#e8e3dc"],
    font: "'Dancing Script', cursive",
  },
  {
    id: "12",
    name: "Cormorant",
    tagline: "Ногоон · Botanical · Editorial",
    desc: "Cormorant Garamond фонт, scroll-driven анимейшн. Утга уран загвар.",
    bg: "hsl(220 18% 96%)",
    accent: "hsl(218 50% 50%)",
    text: "hsl(220 30% 16%)",
    soft: "hsl(220 20% 45%)",
    swatches: ["hsl(220 30% 16%)", "hsl(218 50% 50%)", "hsl(220 18% 96%)", "hsl(220 15% 88%)"],
    font: "'Cormorant Garamond', serif",
  },
  {
    id: "13",
    name: "Burgundy",
    tagline: "Бургунди · Романтик · Тансаг",
    desc: "Гүн улаан өнгө, алтан ботаникал лац. Хурмын уламжлалт гоёлт загвар.",
    bg: "#66021f",
    accent: "#e8c97a",
    text: "#fffaf8",
    soft: "rgba(255,250,248,0.65)",
    swatches: ["#66021f", "#8b0a2a", "#fffaf8", "#e8c97a"],
    font: "'Playfair Display', serif",
  },
  {
    id: "14",
    name: "Navy & Gold",
    tagline: "Хар тэнгэр · Алт · Editorial",
    desc: "Гүн хөх шөнийн тэнгэр, алтан дэлгэрэнгүй. Cormorant Garamond — хаан тайзны загвар.",
    bg: "#0f1b33",
    accent: "#b89a6b",
    text: "#f4eede",
    soft: "rgba(244,238,222,0.6)",
    swatches: ["#0f1b33", "#28406b", "#b89a6b", "#f4eede"],
    font: "'Cormorant Garamond', serif",
  },
];

// Gold gradient text style for dark backgrounds
const goldGrad: React.CSSProperties = {
  background: "linear-gradient(180deg, #c9a882 0%, #f0d9a0 55%, #c9a255 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

// ─── FadeIn ────────────────────────────────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "50px", amount: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── AnimatedText — char-by-char scroll opacity ───────────────────────────────
function AnimChar({
  children,
  progress,
  range,
}: {
  children: string;
  progress: ReturnType<typeof useMotionValue<number>>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  return (
    <span style={{ position: "relative", display: "inline" }}>
      <span style={{ opacity: 0.12 }}>{children}</span>
      <motion.span style={{ opacity, position: "absolute", left: 0, top: 0 }}>
        {children}
      </motion.span>
    </span>
  );
}

function AnimatedText({
  text,
  className = "",
  style = {},
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.3"],
  });
  const chars = useMemo(() => text.split(""), [text]);
  return (
    <p ref={ref} className={className} style={style}>
      {chars.map((ch, i) => (
        <AnimChar
          key={i}
          progress={scrollYProgress as ReturnType<typeof useMotionValue<number>>}
          range={[i / chars.length, (i + 1) / chars.length]}
        >
          {ch}
        </AnimChar>
      ))}
    </p>
  );
}

// ─── CTA Button ───────────────────────────────────────────────────────────────
function CTAButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        "inline-block rounded-full font-semibold uppercase tracking-widest text-white " +
        "px-8 py-3 sm:px-10 sm:py-3.5 text-sm " +
        "transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] " +
        className
      }
      style={{
        background:
          "linear-gradient(123deg, #18010f 7%, #b61454 37%, #7c21b0 72%, #be4c00 100%)",
        boxShadow:
          "0 4px 4px rgba(182,20,89,0.25), 4px 4px 12px #7c21b0 inset",
        outline: "2px solid #fff",
        outlineOffset: "-3px",
        textDecoration: "none",
      }}
    >
      {children}
    </a>
  );
}

// ─── Fan Carousel (template preview 3D) ──────────────────────────────────────
const DOUBLED = [...TEMPLATES, ...TEMPLATES];
const CARD_SPACING = 270;
const TOTAL_SHIFT = CARD_SPACING * TEMPLATES.length;
const CENTER_BASE = -(DOUBLED.length * CARD_SPACING) / 2 + CARD_SPACING / 2;

function FanTemplateCard({ t }: { t: (typeof TEMPLATES)[0] }) {
  return (
    <div
      style={{
        width: 230,
        height: 370,
        background: t.bg,
        borderRadius: 24,
        boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "28px 20px 24px",
        border: `1px solid ${t.accent}44`,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: t.accent,
          opacity: 0.9,
        }}
      />
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: t.soft,
            marginBottom: 10,
          }}
        >
          The wedding of
        </p>
        <h3
          style={{
            fontFamily: t.font,
            fontSize: 32,
            color: t.text,
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          Болд
          <br />& Сарнай
        </h3>
        <div
          style={{ width: 36, height: 1, background: t.accent, margin: "12px auto" }}
        />
        <p style={{ fontSize: 10, letterSpacing: "0.15em", color: t.soft }}>
          2026 · 07 · 15
        </p>
      </div>
      <p
        style={{
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: t.soft,
          fontWeight: 600,
        }}
      >
        {t.name}
      </p>
    </div>
  );
}

function FanCard({
  t,
  offset,
  baseX,
}: {
  t: (typeof TEMPLATES)[0];
  offset: ReturnType<typeof useMotionValue<number>>;
  baseX: number;
}) {
  const x = useTransform(offset, (o: number) => baseX + o);
  const rotateY = useTransform(x, [-500, -200, 0, 200, 500], [55, 25, 0, -25, -55]);
  const scale = useTransform(x, [-350, 0, 350], [0.72, 1.0, 0.72]);
  const opacity = useTransform(x, [-480, -280, 0, 280, 480], [0, 0.65, 1, 0.65, 0]);
  const zIndex = useTransform(x, (v: number) => Math.round(100 - Math.abs(v) / 5));
  return (
    <motion.div
      style={{
        x,
        rotateY,
        scale,
        opacity,
        zIndex,
        position: "absolute",
        transformStyle: "preserve-3d",
      }}
    >
      <FanTemplateCard t={t} />
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
      onMouseEnter={() => {
        paused.current = true;
      }}
      onMouseLeave={() => {
        paused.current = false;
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {DOUBLED.map((t, i) => (
          <FanCard
            key={`${t.id}-${i}`}
            t={t}
            offset={offset}
            baseX={CENTER_BASE + i * CARD_SPACING}
          />
        ))}
      </div>
      <div
        className="absolute inset-y-0 left-0 w-28 md:w-48 pointer-events-none"
        style={{ background: "linear-gradient(to right, #0C0C0C, transparent)" }}
      />
      <div
        className="absolute inset-y-0 right-0 w-28 md:w-48 pointer-events-none"
        style={{ background: "linear-gradient(to left, #0C0C0C, transparent)" }}
      />
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section
      className="min-h-screen w-full flex flex-col"
      style={{ background: "#0C0C0C", overflowX: "clip" }}
    >
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex items-center justify-between px-6 md:px-10 pt-6 md:pt-8"
      >
        <span
          style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: "clamp(1.3rem, 3vw, 2rem)",
            ...goldGrad,
          }}
        >
          One Wedding
        </span>
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs sm:text-sm font-medium uppercase tracking-widest hover:opacity-70 transition-opacity"
          style={{ color: "#D7E2EA" }}
        >
          Захиалах →
        </a>
      </motion.nav>

      {/* Heading block */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-10 pb-4 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-xs tracking-[0.3em] uppercase mb-6"
          style={{ color: "rgba(215,226,234,0.45)" }}
        >
          Монгол хурим · баяр · цахим урилга
        </motion.p>

        <div style={{ overflow: "hidden" }}>
          <motion.h1
            initial={{ opacity: 0, y: 70 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="font-black uppercase tracking-tight leading-none"
            style={{
              ...goldGrad,
              fontSize: "clamp(3.2rem, 16vw, 180px)",
              whiteSpace: "nowrap",
            }}
          >
            ONE WEDDING
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-6 mb-10 max-w-sm mx-auto leading-relaxed"
          style={{
            color: "rgba(215,226,234,0.6)",
            fontSize: "clamp(0.85rem, 1.5vw, 1.1rem)",
          }}
        >
          Хурим, баярын онцгой урилгыг 24 цагийн дотор бэлдэж тань руу явуулна
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
        >
          <CTAButton href={FACEBOOK_URL}>Захиалга өгөх</CTAButton>
        </motion.div>
      </div>

      {/* Fan carousel */}
      <div className="pb-2">
        <FanCarousel />
        <p
          className="text-center text-xs tracking-[0.22em] uppercase mt-3 pb-4"
          style={{ color: "rgba(215,226,234,0.25)" }}
        >
          Hover хийж загвар харна уу
        </p>
      </div>
    </section>
  );
}

// ─── Marquee Text Strip ───────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  "Хурим", "·", "Баяр", "·", "Цахим урилга", "·", "RSVP", "·",
  "Онцгой өдөр", "·", "One Wedding", "·", "24 цаг", "·",
  "Загвар", "·", "Линк хуваалцах", "·",
];

function MarqueeStrip() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div
      className="overflow-hidden py-4 border-t border-b"
      style={{ background: "#0C0C0C", borderColor: "rgba(215,226,234,0.07)" }}
    >
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 22, ease: "linear", repeat: Infinity }}
        style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.95rem)", letterSpacing: "0.18em" }}
      >
        {doubled.map((w, i) => (
          <span
            key={i}
            style={{
              color: w === "·" ? "rgba(201,162,85,0.55)" : "rgba(215,226,234,0.38)",
              fontWeight: w === "·" ? 400 : 500,
              textTransform: "uppercase",
            }}
          >
            {w}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── About Section ────────────────────────────────────────────────────────────
function AboutSection() {
  return (
    <section
      id="about"
      className="min-h-screen w-full flex flex-col items-center justify-center relative px-5 md:px-10 py-24"
      style={{ background: "#0C0C0C" }}
    >
      {/* Decorative corners */}
      <FadeIn
        x={-60}
        y={0}
        delay={0.1}
        duration={0.9}
        className="absolute top-[5%] left-[2%] md:left-[5%] pointer-events-none"
        style={{ opacity: 0.3 }}
      >
        <Heart
          style={{
            width: "clamp(40px,6vw,90px)",
            height: "clamp(40px,6vw,90px)",
            fill: "#c9a255",
            color: "#c9a255",
          }}
        />
      </FadeIn>
      <FadeIn
        x={60}
        y={0}
        delay={0.15}
        duration={0.9}
        className="absolute top-[5%] right-[2%] md:right-[5%] pointer-events-none"
        style={{ opacity: 0.22 }}
      >
        <div
          style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: "clamp(2.5rem, 7vw, 6rem)",
            ...goldGrad,
            lineHeight: 1,
          }}
        >
          ∞
        </div>
      </FadeIn>
      <FadeIn
        x={-50}
        y={0}
        delay={0.1}
        duration={0.9}
        className="absolute bottom-[7%] left-[3%] md:left-[8%] pointer-events-none"
        style={{ opacity: 0.15 }}
      >
        <div
          style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: "clamp(3rem, 9vw, 8rem)",
            ...goldGrad,
            lineHeight: 1,
          }}
        >
          ♦
        </div>
      </FadeIn>
      <FadeIn
        x={50}
        y={0}
        delay={0.2}
        duration={0.9}
        className="absolute bottom-[7%] right-[3%] md:right-[8%] pointer-events-none"
        style={{ opacity: 0.15 }}
      >
        <Heart
          style={{
            width: "clamp(30px,4vw,60px)",
            height: "clamp(30px,4vw,60px)",
            fill: "#c9a255",
            color: "#c9a255",
          }}
        />
      </FadeIn>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-12 md:gap-16 max-w-3xl">
        <FadeIn y={40} duration={0.7}>
          <h2
            className="font-black uppercase leading-none tracking-tight text-center"
            style={{ ...goldGrad, fontSize: "clamp(3rem, 13vw, 140px)" }}
          >
            Бидний тухай
          </h2>
        </FadeIn>

        <AnimatedText
          text="Монгол хурим, баяр тойрны онцгой мөчүүдийг гоёлттой цахим урилгаар тэмдэглэнэ. Захиалагч Facebook-р холбогдоно, 24 цагийн дотор бэлэн болсон URL-г хэзээ ч, хаанаас ч нааш нь найзуудадаа хуваалцана."
          className="font-medium text-center leading-relaxed max-w-[560px] mx-auto"
          style={{ color: "#D7E2EA", fontSize: "clamp(1rem, 2vw, 1.35rem)" }}
        />
      </div>

      <div className="relative z-10 mt-16 md:mt-20">
        <CTAButton href={FACEBOOK_URL}>Захиалга өгөх</CTAButton>
      </div>
    </section>
  );
}

// ─── Templates Section (sticky stacking cards) ────────────────────────────────
function TemplateCard({
  t,
  index,
  total,
  scrollProgress,
}: {
  t: (typeof TEMPLATES)[0];
  index: number;
  total: number;
  scrollProgress: ReturnType<typeof useMotionValue<number>>;
}) {
  const targetScale = 1 - (total - 1 - index) * 0.04;
  const scale = useTransform(
    scrollProgress,
    [index / total, 1] as [number, number],
    [1, targetScale]
  );
  const dark = t.bg === "#66021f" || t.bg === "#0f1b33";
  const demoSlug = DEMO_SLUGS[t.id];
  const numLabel = ["01", "02", "03", "04"][index];

  return (
    <div
      className="sticky flex items-start justify-center"
      style={{ top: `calc(5rem + ${index * 22}px)` }}
    >
      <motion.div style={{ scale, transformOrigin: "top center" }} className="w-full">
        <div
          className="w-full overflow-hidden"
          style={{
            background: t.bg,
            borderRadius: "clamp(20px, 3vw, 40px)",
            border: `1px solid ${t.accent}33`,
          }}
        >
          <div className="flex flex-col md:flex-row">
            {/* Left: info */}
            <div
              className="flex-1 flex flex-col justify-between p-7 md:p-12"
              style={{ minHeight: "clamp(260px, 38vw, 480px)" }}
            >
              <div>
                <p
                  className="text-xs tracking-[0.25em] uppercase mb-3"
                  style={{ color: t.soft }}
                >
                  Загвар {numLabel}
                </p>
                <h3
                  className="font-black uppercase leading-none mb-3"
                  style={{
                    color: t.text,
                    fontSize: "clamp(2.2rem, 7vw, 72px)",
                  }}
                >
                  {t.name}
                </h3>
                <p
                  className="text-sm mb-2"
                  style={{ color: t.soft, letterSpacing: "0.07em" }}
                >
                  {t.tagline}
                </p>
                <p
                  className="leading-relaxed mt-4 max-w-xs"
                  style={{
                    color: t.soft,
                    fontSize: "clamp(0.8rem, 1.3vw, 1rem)",
                  }}
                >
                  {t.desc}
                </p>
              </div>
              <div>
                <div className="flex gap-3 mb-5 mt-8">
                  {t.swatches.map((s) => (
                    <div
                      key={s}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: s,
                        border: "1.5px solid rgba(128,128,128,0.22)",
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-3 flex-wrap">
                  {demoSlug && (
                    <a
                      href={`/i/${demoSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-full font-semibold uppercase tracking-wider text-xs px-6 py-2.5 transition-opacity hover:opacity-80"
                      style={{
                        background: t.accent,
                        color: dark ? t.bg : "#fff",
                        textDecoration: "none",
                      }}
                    >
                      Demo харах →
                    </a>
                  )}
                  <a
                    href={FACEBOOK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-full font-semibold uppercase tracking-wider text-xs px-6 py-2.5 transition-opacity hover:opacity-80"
                    style={{
                      border: `1.5px solid ${t.accent}`,
                      color: dark ? t.accent : t.text,
                      textDecoration: "none",
                      background: "transparent",
                    }}
                  >
                    Захиалах
                  </a>
                </div>
              </div>
            </div>

            {/* Right: mini preview card */}
            <div
              className="flex items-center justify-center p-8 md:p-10"
              style={{
                background: `${t.accent}0d`,
                borderLeft: `1px solid ${t.accent}1a`,
                minWidth: "clamp(200px, 30vw, 340px)",
              }}
            >
              <div
                style={{
                  width: 190,
                  height: 310,
                  background: t.bg,
                  borderRadius: 20,
                  boxShadow: `0 20px 60px ${t.accent}44`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "22px 18px",
                  border: `1px solid ${t.accent}44`,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: t.accent,
                    opacity: 0.9,
                  }}
                />
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: t.soft,
                      marginBottom: 8,
                    }}
                  >
                    The wedding of
                  </p>
                  <p
                    style={{
                      fontFamily: t.font,
                      fontSize: 26,
                      color: t.text,
                      lineHeight: 1.2,
                      margin: "0 0 8px",
                    }}
                  >
                    Болд
                    <br />& Сарнай
                  </p>
                  <div
                    style={{
                      width: 28,
                      height: 1,
                      background: t.accent,
                      margin: "10px auto",
                    }}
                  />
                  <p style={{ fontSize: 9, letterSpacing: "0.15em", color: t.soft }}>
                    2026 · 07 · 15
                  </p>
                </div>
                <p
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: t.soft,
                    fontWeight: 600,
                  }}
                >
                  {t.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TemplatesSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      ref={containerRef}
      className="w-full px-5 md:px-10 py-20 md:py-28 relative z-[1]"
      style={{
        background: "#f8f5f0",
        borderRadius: "clamp(28px, 4vw, 56px) clamp(28px, 4vw, 56px) 0 0",
        marginTop: -1,
      }}
    >
      <FadeIn y={40} duration={0.7} className="text-center mb-14 md:mb-20">
        <h2
          className="font-black uppercase leading-none tracking-tight"
          style={{ color: "#0C0C0C", fontSize: "clamp(2.8rem, 12vw, 130px)" }}
        >
          Загварууд
        </h2>
        <p
          className="mt-4 text-xs tracking-widest uppercase"
          style={{ color: "#9ca3af" }}
        >
          Demo харж сонгоод захиалгаа өгнө үү
        </p>
      </FadeIn>

      <div className="max-w-5xl mx-auto">
        {TEMPLATES.map((t, i) => (
          <div key={t.id} style={{ height: "78vh" }}>
            <TemplateCard
              t={t}
              index={i}
              total={TEMPLATES.length}
              scrollProgress={scrollYProgress as ReturnType<typeof useMotionValue<number>>}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── How It Works Section ─────────────────────────────────────────────────────
const STEPS = [
  { n: "01", title: "Загвар сонгох", desc: "Demo харж таны хэв маягт тохирсон загварыг сонгоно" },
  { n: "02", title: "Захиалга өгөх", desc: "Facebook хуудасны маань рүү мессеж илгээнэ" },
  {
    n: "03",
    title: "Мэдэгдэл хүлээн авах",
    desc: "24 цагийн дотор урилгыг тань бэлдэж, URL-г явуулна",
  },
  {
    n: "04",
    title: "Хуваалцах",
    desc: "Линк хуулаад найз нөхөддөө WhatsApp, Facebook-р явуулна",
  },
];

function HowItWorksSection() {
  return (
    <section
      className="w-full px-5 md:px-10 py-20 md:py-28 relative z-[2]"
      style={{
        background: "#ffffff",
        borderRadius: "clamp(28px, 4vw, 56px) clamp(28px, 4vw, 56px) 0 0",
        marginTop: -1,
      }}
    >
      <FadeIn y={40} duration={0.7} className="text-center mb-14 md:mb-20">
        <h2
          className="font-black uppercase leading-none tracking-tight"
          style={{ color: "#0C0C0C", fontSize: "clamp(2.2rem, 10vw, 110px)" }}
        >
          Яаж ажилладаг
        </h2>
        <p
          className="mt-4 text-xs tracking-widest uppercase"
          style={{ color: "#9ca3af" }}
        >
          Энгийн 4 алхам
        </p>
      </FadeIn>

      <div className="max-w-4xl mx-auto">
        {STEPS.map((s, i) => (
          <FadeIn
            key={s.n}
            delay={i * 0.1}
            y={28}
            duration={0.65}
            className="flex items-start md:items-center gap-6 md:gap-10 py-8 md:py-10"
            style={{
              borderTop: i === 0 ? "1px solid rgba(12,12,12,0.1)" : "none",
              borderBottom: "1px solid rgba(12,12,12,0.1)",
            }}
          >
            <div
              className="font-black leading-none shrink-0"
              style={{
                color: "#0C0C0C",
                fontSize: "clamp(2.8rem, 9vw, 110px)",
                opacity: 0.1,
              }}
            >
              {s.n}
            </div>
            <div>
              <h3
                className="font-semibold uppercase tracking-wide mb-2"
                style={{ fontSize: "clamp(0.95rem, 2vw, 1.7rem)" }}
              >
                {s.title}
              </h3>
              <p
                className="leading-relaxed"
                style={{ fontSize: "clamp(0.82rem, 1.4vw, 1.05rem)", color: "#6b7280" }}
              >
                {s.desc}
              </p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ─── Footer CTA Section ───────────────────────────────────────────────────────
function FooterSection() {
  return (
    <section
      className="w-full px-5 md:px-10 py-20 md:py-24 relative z-[3]"
      style={{
        background: "#0C0C0C",
        borderRadius: "clamp(28px, 4vw, 56px) clamp(28px, 4vw, 56px) 0 0",
        marginTop: -1,
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pb-16 md:pb-24">
        <FadeIn y={40} duration={0.7}>
          <h2
            className="font-black uppercase leading-none tracking-tight"
            style={{ ...goldGrad, fontSize: "clamp(2.5rem, 10vw, 100px)" }}
          >
            Захиалга
            <br />
            өгөх
          </h2>
        </FadeIn>
        <FadeIn y={20} delay={0.15} duration={0.7}>
          <CTAButton href={FACEBOOK_URL}>Facebook-р холбогдох →</CTAButton>
        </FadeIn>
      </div>

      <div
        className="border-t pt-8"
        style={{ borderColor: "rgba(215,226,234,0.07)" }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
          <span
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "1.3rem",
              ...goldGrad,
            }}
          >
            One Wedding
          </span>
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: "rgba(215,226,234,0.22)" }}
          >
            © 2026 — Монгол хурим, баярын цахим урилга
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#0C0C0C" }}>
      <HeroSection />
      <MarqueeStrip />
      <AboutSection />
      <TemplatesSection />
      <HowItWorksSection />
      <FooterSection />
    </div>
  );
}
