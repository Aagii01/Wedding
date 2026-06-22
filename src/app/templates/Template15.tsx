import { useRef, useState, useEffect, useMemo } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { EventData } from "../../types/event";

// ── palette ───────────────────────────────────────────────────────────────────
const KANIT: React.CSSProperties = { fontFamily: "'Kanit', sans-serif" };

const GRAD: React.CSSProperties = {
  background: "linear-gradient(180deg, #646973 0%, #BBCCD7 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

const BTN: React.CSSProperties = {
  background: "linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)",
  boxShadow: "0 4px 4px rgba(181,1,167,0.25), 4px 4px 12px #7721B1 inset",
  outline: "2px solid #fff",
  outlineOffset: "-3px",
};

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtDate(s: string) {
  if (!s) return "";
  try {
    return new Date(s + "T00:00:00").toLocaleDateString("mn-MN", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch { return s; }
}

function ensure<T>(arr: T[], n = 6): T[] {
  let out = [...arr];
  while (out.length < n) out = [...out, ...arr];
  return out;
}

// ── FadeIn ────────────────────────────────────────────────────────────────────
function FadeIn({
  as = "div",
  children,
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  className = "",
  style = {},
  ...rest
}: {
  as?: string;
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
  [k: string]: unknown;
}) {
  const Tag = (motion as Record<string, any>)[as] ?? motion.div;
  return (
    <Tag
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "50px", amount: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ── Magnet ────────────────────────────────────────────────────────────────────
function Magnet({ children, padding = 150, strength = 3 }: {
  children: React.ReactNode; padding?: number; strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const within =
        e.clientX >= r.left - padding && e.clientX <= r.right + padding &&
        e.clientY >= r.top - padding && e.clientY <= r.bottom + padding;
      if (within) {
        setActive(true);
        setPos({ x: (e.clientX - (r.left + r.width / 2)) / strength, y: (e.clientY - (r.top + r.height / 2)) / strength });
      } else {
        setActive(false);
        setPos({ x: 0, y: 0 });
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [padding, strength]);

  return (
    <div
      ref={ref}
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        transition: active ? "transform 0.3s ease-out" : "transform 0.6s ease-in-out",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}

// ── AnimatedText ──────────────────────────────────────────────────────────────
function Char({ ch, progress, range }: { ch: string; progress: any; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return (
    <span style={{ position: "relative", display: "inline" }}>
      <span style={{ opacity: 0.2 }}>{ch}</span>
      <motion.span style={{ opacity, position: "absolute", left: 0, top: 0 }}>{ch}</motion.span>
    </span>
  );
}

function AnimatedText({ text, className = "", style = {} }: { text: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.2"] });
  const chars = useMemo(() => text.split(""), [text]);
  return (
    <p ref={ref} className={className} style={style}>
      {chars.map((ch, i) => (
        <Char key={i} ch={ch} progress={scrollYProgress} range={[i / chars.length, (i + 1) / chars.length]} />
      ))}
    </p>
  );
}

// ── RsvpButton ────────────────────────────────────────────────────────────────
function RsvpButton({ label = "Бүртгүүлэх", className = "", type = "button", disabled = false, onClick }: {
  label?: string; className?: string; type?: "button" | "submit"; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={"rounded-full text-white font-medium uppercase tracking-widest px-8 py-3 sm:px-10 sm:py-3.5 md:px-12 md:py-4 text-xs sm:text-sm md:text-base transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 " + className}
      style={{ ...BTN, ...KANIT }}
    >
      {label}
    </button>
  );
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function HeroSection({ event }: { event: EventData }) {
  const names = event.person2_name
    ? `${event.person1_name} & ${event.person2_name}`
    : event.person1_name;

  return (
    <section className="h-screen w-full flex flex-col relative" style={{ overflowX: "clip" }}>
      <FadeIn delay={0} y={-20} duration={0.7} className="relative z-20">
        <nav
          className="flex items-center justify-between px-6 md:px-10 pt-6 md:pt-8 font-medium uppercase tracking-wider"
          style={{ color: "#D7E2EA" }}
        >
          {(["Бид хоёр", "Мэдээлэл", "Галерей", "Бүртгэл"] as const).map((label) => (
            <a
              key={label}
              href={`#${label === "Бид хоёр" ? "couple" : label === "Мэдээлэл" ? "details" : label === "Галерей" ? "gallery" : "rsvp"}`}
              className="text-sm md:text-lg lg:text-[1.4rem] hover:opacity-70 transition-opacity duration-200"
            >
              {label}
            </a>
          ))}
        </nav>
      </FadeIn>

      {/* Portrait – bottom-anchored on sm+, centered on mobile */}
      <FadeIn
        delay={0.6}
        y={30}
        duration={0.7}
        className="absolute left-1/2 -translate-x-1/2 z-10 w-[280px] sm:w-[360px] md:w-[440px] lg:w-[520px] top-1/2 -translate-y-1/2 sm:top-auto sm:translate-y-0 sm:bottom-0"
      >
        <Magnet padding={150} strength={3}>
          <img
            src={event.main_image || "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=1000&fit=crop"}
            alt={names}
            className="w-full h-auto select-none pointer-events-none"
            style={{ maxHeight: "80vh", objectFit: "cover", objectPosition: "top center" }}
            draggable={false}
          />
        </Magnet>
      </FadeIn>

      <div className="flex-1 flex flex-col justify-end px-6 md:px-10 relative z-20 pointer-events-none">
        <div className="overflow-hidden">
          <FadeIn
            as="h1"
            delay={0.15}
            y={40}
            duration={0.7}
            className="font-black uppercase tracking-tight leading-none whitespace-nowrap w-full mt-6 sm:mt-4 md:-mt-5"
            style={{ ...GRAD, fontSize: "clamp(7vw, 10vw, 14vw)" }}
          >
            {names}
          </FadeIn>
        </div>

        <div className="flex justify-between items-end pb-7 sm:pb-8 md:pb-10 pointer-events-auto">
          <FadeIn delay={0.35} y={20} duration={0.7}>
            <p
              className="font-light uppercase tracking-wide leading-snug max-w-[160px] sm:max-w-[220px] md:max-w-[260px]"
              style={{ color: "#D7E2EA", fontSize: "clamp(0.75rem, 1.4vw, 1.5rem)" }}
            >
              {fmtDate(event.date)}{event.venue_name ? ` · ${event.venue_name}` : ""}
            </p>
          </FadeIn>
          <FadeIn delay={0.5} y={20} duration={0.7}>
            <a href="#rsvp">
              <RsvpButton />
            </a>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ── MARQUEE ───────────────────────────────────────────────────────────────────
function MarqueeSection({ event }: { event: EventData }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  const photos = event.gallery2_photos?.length >= 2
    ? event.gallery2_photos
    : Array(8).fill(event.main_image || "https://images.unsplash.com/photo-1519741497674-611481863552?w=420&h=270&fit=crop");

  const mid = Math.ceil(photos.length / 2);
  const row1 = ensure(photos.slice(0, mid), 5);
  const row2 = ensure(photos.slice(mid).length ? photos.slice(mid) : photos, 5);
  const triple = <T,>(arr: T[]) => [...arr, ...arr, ...arr];

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      setOffset((window.scrollY - top + window.innerHeight) * 0.3);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} className="pt-24 sm:pt-32 md:pt-40 pb-10 w-full" style={{ background: "#0C0C0C", overflowX: "clip" }}>
      <div className="flex flex-col gap-3">
        <div className="flex gap-3" style={{ transform: `translateX(${offset - 200}px)`, willChange: "transform" }}>
          {triple(row1).map((src, i) => (
            <div key={`r1-${i}`} className="shrink-0 rounded-2xl overflow-hidden bg-neutral-900" style={{ width: 420, height: 270 }}>
              <img src={src} loading="lazy" alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className="flex gap-3" style={{ transform: `translateX(${-(offset - 200)}px)`, willChange: "transform" }}>
          {triple(row2).map((src, i) => (
            <div key={`r2-${i}`} className="shrink-0 rounded-2xl overflow-hidden bg-neutral-900" style={{ width: 420, height: 270 }}>
              <img src={src} loading="lazy" alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── COUPLE (About Me equiv) ───────────────────────────────────────────────────
function CoupleSection({ event }: { event: EventData }) {
  const p1 = event.person1_photo;
  const p2 = event.person2_photo;

  const quote = event.person2_name
    ? `${event.person1_name} ба ${event.person2_name} — энэ хурмаар бид нэгдэж, хайрт таныг мөч бүрийг хамт тэмдэглэхийг урьж байна.`
    : `${event.person1_name} — энэ тусгай өдрийг хамт тэмдэглэхийг танд урьж байна.`;

  return (
    <section
      id="couple"
      className="min-h-screen w-full flex flex-col items-center justify-center relative px-5 sm:px-8 md:px-10 py-20"
      style={{ background: "#0C0C0C" }}
    >
      {p1 && (
        <FadeIn delay={0.1} x={-80} y={0} duration={0.9}
          className="absolute top-[4%] left-[1%] sm:left-[2%] md:left-[4%] w-[120px] sm:w-[160px] md:w-[210px] pointer-events-none"
        >
          <img src={p1} alt="" className="w-full h-auto rounded-full" style={{ aspectRatio: "1", objectFit: "cover" }} />
        </FadeIn>
      )}
      {p2 && (
        <FadeIn delay={0.25} x={-80} y={0} duration={0.9}
          className="absolute bottom-[8%] left-[3%] sm:left-[6%] md:left-[10%] w-[100px] sm:w-[140px] md:w-[180px] pointer-events-none"
        >
          <img src={p2} alt="" className="w-full h-auto rounded-full" style={{ aspectRatio: "1", objectFit: "cover" }} />
        </FadeIn>
      )}
      {p1 && (
        <FadeIn delay={0.15} x={80} y={0} duration={0.9}
          className="absolute top-[4%] right-[1%] sm:right-[2%] md:right-[4%] w-[120px] sm:w-[160px] md:w-[210px] pointer-events-none"
        >
          <img src={p1} alt="" className="w-full h-auto rounded-2xl" style={{ aspectRatio: "3/4", objectFit: "cover", objectPosition: "top" }} />
        </FadeIn>
      )}
      {p2 && (
        <FadeIn delay={0.3} x={80} y={0} duration={0.9}
          className="absolute bottom-[8%] right-[3%] sm:right-[6%] md:right-[10%] w-[130px] sm:w-[170px] md:w-[220px] pointer-events-none"
        >
          <img src={p2} alt="" className="w-full h-auto rounded-2xl" style={{ aspectRatio: "3/4", objectFit: "cover", objectPosition: "top" }} />
        </FadeIn>
      )}

      <div className="relative z-10 flex flex-col items-center gap-10 sm:gap-14 md:gap-16">
        <FadeIn as="h2" delay={0} y={40} duration={0.7}
          className="font-black uppercase leading-none tracking-tight text-center"
          style={{ ...GRAD, fontSize: "clamp(3rem, 12vw, 160px)" }}
        >
          Бид хоёр
        </FadeIn>
        <AnimatedText
          text={quote}
          className="font-medium text-center leading-relaxed max-w-[560px] mx-auto"
          style={{ color: "#D7E2EA", fontSize: "clamp(1rem, 2vw, 1.35rem)" }}
        />
      </div>

      <div className="relative z-10 mt-16 sm:mt-20 md:mt-24">
        <a href="#rsvp"><RsvpButton /></a>
      </div>
    </section>
  );
}

// ── DETAILS (Services equiv – white) ──────────────────────────────────────────
function DetailsSection({ event }: { event: EventData }) {
  const items = [
    { n: "01", name: "Огноо", desc: fmtDate(event.date) },
    { n: "02", name: "Цаг", desc: event.time },
    { n: "03", name: "Газар", desc: event.venue_name },
    { n: "04", name: "Хаяг", desc: event.venue_address },
  ].filter((d) => d.desc);

  return (
    <section
      id="details"
      className="w-full px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32 rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] relative z-[1]"
      style={{ background: "#FFFFFF", color: "#0C0C0C", ...KANIT }}
    >
      <FadeIn as="h2" delay={0} y={40} duration={0.7}
        className="font-black uppercase text-center mb-16 sm:mb-20 md:mb-28 leading-none tracking-tight"
        style={{ color: "#0C0C0C", fontSize: "clamp(3rem, 12vw, 160px)" }}
      >
        Мэдээлэл
      </FadeIn>

      <div className="max-w-5xl mx-auto">
        {items.map((d, i) => (
          <FadeIn
            key={d.n}
            delay={i * 0.1}
            y={30}
            duration={0.7}
            className="flex items-start sm:items-center gap-5 sm:gap-8 md:gap-12 py-8 sm:py-10 md:py-12"
            style={{
              borderTop: i === 0 ? "1px solid rgba(12,12,12,0.15)" : "none",
              borderBottom: "1px solid rgba(12,12,12,0.15)",
            }}
          >
            <div className="font-black leading-none shrink-0" style={{ color: "#0C0C0C", fontSize: "clamp(3rem, 10vw, 140px)" }}>
              {d.n}
            </div>
            <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
              <h3 className="font-medium uppercase leading-tight" style={{ fontSize: "clamp(1rem, 2.2vw, 2.1rem)" }}>
                {d.name}
              </h3>
              <p className="font-light leading-relaxed max-w-2xl" style={{ fontSize: "clamp(0.85rem, 1.6vw, 1.25rem)", opacity: 0.6 }}>
                {d.desc}
              </p>
            </div>
          </FadeIn>
        ))}
      </div>

      {event.venue_map_url && (
        <div className="flex justify-center mt-12 sm:mt-16">
          <a
            href={event.venue_map_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border-2 font-medium uppercase tracking-widest px-8 py-3 sm:px-10 sm:py-3.5 text-sm sm:text-base transition-colors duration-200"
            style={{ borderColor: "#0C0C0C", color: "#0C0C0C" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(12,12,12,0.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            Google Maps-р харах
          </a>
        </div>
      )}
    </section>
  );
}

// ── GALLERY (Projects equiv – sticky stack) ───────────────────────────────────
function GalleryCard({ src, n, index, totalCards, scrollProgress, range }: {
  src: string; n: string; index: number; totalCards: number; scrollProgress: any; range: [number, number];
}) {
  const targetScale = 1 - (totalCards - 1 - index) * 0.03;
  const scale = useTransform(scrollProgress, range, [1, targetScale]);

  return (
    <div className="sticky flex items-start justify-center" style={{ top: `calc(6rem + ${index * 28}px)` }}>
      <motion.div
        style={{ scale, transformOrigin: "top center", border: "2px solid #D7E2EA" }}
        className="w-full rounded-[40px] sm:rounded-[50px] md:rounded-[60px] p-4 sm:p-6 md:p-8"
      >
        <div
          className="w-full rounded-[36px] sm:rounded-[44px] md:rounded-[52px] p-4 sm:p-6 md:p-8"
          style={{ background: "#0C0C0C", border: "2px solid #D7E2EA" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-5 sm:gap-8 md:gap-10">
              <div className="font-black leading-none" style={{ ...GRAD, fontSize: "clamp(3rem, 10vw, 140px)" }}>
                {n}
              </div>
              <div className="flex flex-col gap-1 sm:gap-2">
                <span className="uppercase tracking-widest font-light opacity-60" style={{ color: "#D7E2EA", fontSize: "clamp(0.7rem, 0.9vw, 0.95rem)" }}>
                  Галерей
                </span>
                <h3 className="font-medium uppercase leading-tight" style={{ color: "#D7E2EA", fontSize: "clamp(1.1rem, 2.6vw, 2.4rem)" }}>
                  Зураг {n}
                </h3>
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 md:mt-10">
            <div className="w-full overflow-hidden rounded-[40px] sm:rounded-[50px] md:rounded-[60px]" style={{ height: "clamp(280px, 45vw, 580px)" }}>
              <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function GallerySection({ event }: { event: EventData }) {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  const photos = event.gallery_photos?.length
    ? event.gallery_photos
    : [event.main_image || "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop"];

  return (
    <section
      id="gallery"
      ref={containerRef}
      className="w-full px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32 -mt-10 sm:-mt-12 md:-mt-14 rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] relative z-[2]"
      style={{ background: "#0C0C0C", ...KANIT }}
    >
      <FadeIn as="h2" delay={0} y={40} duration={0.7}
        className="font-black uppercase text-center leading-none tracking-tight mb-12 sm:mb-16 md:mb-20"
        style={{ ...GRAD, fontSize: "clamp(3rem, 12vw, 160px)" }}
      >
        Галерей
      </FadeIn>

      <div className="max-w-6xl mx-auto">
        {photos.map((src, i) => (
          <div key={i} className="h-[85vh]">
            <GalleryCard
              src={src}
              n={String(i + 1).padStart(2, "0")}
              index={i}
              totalCards={photos.length}
              scrollProgress={scrollYProgress}
              range={[i / photos.length, 1]}
            />
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto pt-20 sm:pt-28 md:pt-32 pb-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
        <div className="font-black uppercase leading-none tracking-tight" style={{ ...GRAD, fontSize: "clamp(2rem, 8vw, 100px)" }}>
          Ирэлтээ бүртгүүлэх
        </div>
        <a href="#rsvp"><RsvpButton /></a>
      </div>
    </section>
  );
}

// ── RSVP ──────────────────────────────────────────────────────────────────────
function RSVPSection({ event }: { event: EventData }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState("1");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("rsvp").insert({
      event_id: event.id,
      name,
      phone,
      guests: parseInt(guests) || 1,
      message,
    });
    setLoading(false);
    if (error) {
      toast.error("Алдаа гарлаа. Дахин оролдоно уу.");
    } else {
      toast.success("Ирэлт амжилттай бүртгэгдлээ!");
      setName(""); setPhone(""); setGuests("1"); setMessage("");
    }
  }

  const INPUT: React.CSSProperties = {
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(215,226,234,0.3)",
    color: "#D7E2EA",
    fontFamily: "'Kanit', sans-serif",
    fontSize: "clamp(0.9rem, 1.5vw, 1.1rem)",
    padding: "12px 0",
    outline: "none",
    width: "100%",
  };

  return (
    <section
      id="rsvp"
      className="w-full px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32 rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] relative z-[3]"
      style={{ background: "#111111", ...KANIT }}
    >
      <FadeIn as="h2" delay={0} y={40} duration={0.7}
        className="font-black uppercase text-center leading-none tracking-tight mb-16 sm:mb-20"
        style={{ ...GRAD, fontSize: "clamp(3rem, 12vw, 160px)" }}
      >
        Бүртгэл
      </FadeIn>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex flex-col gap-8">
        <FadeIn delay={0.1} y={20}>
          <input type="text" placeholder="Таны нэр" value={name} onChange={(e) => setName(e.target.value)} required style={INPUT} />
        </FadeIn>
        <FadeIn delay={0.15} y={20}>
          <input type="tel" placeholder="Утасны дугаар" value={phone} onChange={(e) => setPhone(e.target.value)} style={INPUT} />
        </FadeIn>
        <FadeIn delay={0.2} y={20}>
          <input type="number" placeholder="Хүний тоо" value={guests} min="1" onChange={(e) => setGuests(e.target.value)} style={INPUT} />
        </FadeIn>
        <FadeIn delay={0.25} y={20}>
          <textarea placeholder="Захидал эсвэл мессеж (заавал биш)" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} style={{ ...INPUT, resize: "none" }} />
        </FadeIn>
        <FadeIn delay={0.3} y={20} className="flex justify-center mt-4">
          <RsvpButton type="submit" disabled={loading} label={loading ? "Илгээж байна..." : "Бүртгүүлэх"} />
        </FadeIn>
      </form>

      <div
        className="max-w-6xl mx-auto mt-20 sm:mt-28 pt-10 flex flex-col sm:flex-row justify-between items-center gap-4"
        style={{ borderTop: "1px solid rgba(215,226,234,0.15)" }}
      >
        <p className="font-medium uppercase tracking-widest text-sm" style={{ color: "rgba(215,226,234,0.5)" }}>
          {event.title}
        </p>
        <p className="font-light text-sm" style={{ color: "rgba(215,226,234,0.3)" }}>
          Special Day
        </p>
      </div>
    </section>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function Template15({ event }: { event: EventData }) {
  return (
    <main style={{ background: "#0C0C0C", overflowX: "clip", ...KANIT }}>
      <HeroSection event={event} />
      <MarqueeSection event={event} />
      <CoupleSection event={event} />
      <DetailsSection event={event} />
      <GallerySection event={event} />
      <RSVPSection event={event} />
      <Toaster />
    </main>
  );
}
