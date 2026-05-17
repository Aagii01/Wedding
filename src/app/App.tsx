import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { EventData } from "../types/event";
import { WeddingHero } from "./components/WeddingHero";
import { GroomBride } from "./components/GroomBride";
import { VenueSection } from "./components/VenueSection";
import { GallerySection } from "./components/GallerySection";
import { FloatingPetals } from "./components/FloatingPetals";
import { PoemSection } from "./components/PoemSection";
import { CountdownTimer } from "./components/CountdownTimer";
import { HealthProtocol } from "./components/HealthProtocol";
import { RSVP } from "./components/RSVP";
import { WeddingFooter } from "./components/WeddingFooter";
import { Toaster } from "./components/ui/sonner";

// ─── Envelope overlay ────────────────────────────────────────────────────────
const ENV_BG   = "#0f1b35";
const ENV_FLAP = "#162240";
const ENV_SIDE = "#0d1a32";

type EnvPhase = "idle" | "opening" | "flying" | "done";

function EnvelopeOverlay({ heroImage, audioRef }: {
  heroImage?: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const [phase, setPhase] = useState<EnvPhase>("idle");

  const handleClick = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("opening");
    audioRef.current?.play().catch(() => {});
    setTimeout(() => setPhase("flying"), 4200);
    setTimeout(() => setPhase("done"), 5400);
  }, [phase, audioRef]);

  if (phase === "done") return null;
  const isOpen   = phase !== "idle";
  const isFlying = phase === "flying";

  return (
    <motion.div
      onClick={phase === "idle" ? handleClick : undefined}
      animate={isFlying ? { y: "110vh" } : { y: 0 }}
      transition={{ duration: 1.0, ease: [0.4, 0, 0.6, 1], delay: isFlying ? 0.2 : 0 }}
      style={{
        position: "fixed", inset: 0,
        background: ENV_BG,
        zIndex: 9999,
        cursor: phase === "idle" ? "pointer" : "default",
        overflow: "hidden",
      }}
    >
      {/* Texture */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "5px 5px", pointerEvents: "none",
      }} />

      {/* Flaps */}
      <div style={{ position: "absolute", inset: 0, background: ENV_FLAP, clipPath: "polygon(0 100%, 50% 52%, 100% 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: ENV_SIDE,  clipPath: "polygon(0 0, 50% 52%, 0 100%)",   pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: ENV_SIDE,  clipPath: "polygon(100% 0, 50% 52%, 100% 100%)", pointerEvents: "none" }} />

      {/* Hero image peek */}
      {heroImage && (
        <motion.div
          style={{ position: "absolute", inset: 0, clipPath: "polygon(0 0, 100% 0, 50% 52%)", overflow: "hidden", pointerEvents: "none" }}
          initial={{ opacity: 0 }}
          animate={isOpen ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.4, delay: isOpen ? 0.4 : 0 }}
        >
          <img src={heroImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(8,18,40,0.45)" }} />
        </motion.div>
      )}

      {/* Top flap opens */}
      <motion.div
        style={{ position: "absolute", inset: 0, background: ENV_FLAP, clipPath: "polygon(0 0, 100% 0, 50% 52%)", transformOrigin: "top center", pointerEvents: "none" }}
        animate={isOpen ? { scaleY: 0 } : { scaleY: 1 }}
        transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      />

      {/* Seam lines */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} preserveAspectRatio="none" viewBox="0 0 100 100">
        <line x1="0"   y1="0"   x2="50" y2="52" stroke="rgba(190,210,240,0.18)" strokeWidth="0.25"/>
        <line x1="100" y1="0"   x2="50" y2="52" stroke="rgba(190,210,240,0.18)" strokeWidth="0.25"/>
        <line x1="0"   y1="100" x2="50" y2="52" stroke="rgba(190,210,240,0.13)" strokeWidth="0.25"/>
        <line x1="100" y1="100" x2="50" y2="52" stroke="rgba(190,210,240,0.13)" strokeWidth="0.25"/>
      </svg>

      {/* Wax seal */}
      <motion.div
        style={{ position: "absolute", top: "52%", left: "50%", marginLeft: -100, marginTop: -100, pointerEvents: "none" }}
        animate={isOpen ? { scale: 0, opacity: 0 } : { scale: [1, 1.04, 1], opacity: 1 }}
        transition={isOpen ? { duration: 0.35 } : { repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
      >
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"
          style={{ filter: "drop-shadow(0 8px 28px rgba(0,0,0,0.70))", display: "block" }}>
          <defs>
            <radialGradient id="t11waxBg" cx="36%" cy="30%" r="72%">
              <stop offset="0%"   stopColor="#1e3565"/>
              <stop offset="45%"  stopColor="#0e2248"/>
              <stop offset="100%" stopColor="#071530"/>
            </radialGradient>
            <filter id="t11waxEdge" x="-8%" y="-8%" width="116%" height="116%">
              <feTurbulence type="turbulence" baseFrequency="0.038" numOctaves="4" seed="5" result="noise"/>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/>
            </filter>
          </defs>
          <circle cx="100" cy="100" r="91" fill="#152d60" filter="url(#t11waxEdge)"/>
          <circle cx="100" cy="100" r="77" fill="url(#t11waxBg)"/>
          <circle cx="100" cy="100" r="77" fill="none" stroke="rgba(180,205,238,0.22)" strokeWidth="1.2"/>
          {/* Petal ornament */}
          {([0,60,120,180,240,300] as number[]).map(deg => {
            const a = deg * Math.PI / 180;
            const r = 28;
            return (
              <ellipse key={deg}
                cx={100 + r * Math.cos(a)} cy={100 + r * Math.sin(a)}
                rx={7} ry={16} fill="rgba(188,212,238,0.80)"
                transform={`rotate(${deg} ${100 + r * Math.cos(a)} ${100 + r * Math.sin(a)})`}
              />
            );
          })}
          <circle cx="100" cy="100" r="10" fill="rgba(210,230,248,0.95)"/>
          <circle cx="100" cy="100" r="4"  fill="rgba(145,175,215,0.85)"/>
        </svg>
      </motion.div>

      {/* Hint */}
      <motion.div
        animate={phase === "idle" ? { y: [0, -6, 0], opacity: 1 } : { opacity: 0 }}
        transition={phase === "idle" ? { repeat: Infinity, duration: 1.8, ease: "easeInOut" } : { duration: 0.2 }}
        style={{
          position: "absolute", bottom: "8%", left: 0, right: 0,
          color: "rgba(210,225,245,0.45)",
          fontFamily: "serif", fontStyle: "italic",
          fontSize: 14, letterSpacing: "0.14em",
          pointerEvents: "none",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}
      >
        <span>↓</span> Дарж нээх <span>↓</span>
      </motion.div>
    </motion.div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
type Props = { event: EventData };

export default function App({ event }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <EnvelopeOverlay heroImage={event.main_image} audioRef={audioRef} />
      {event.music_url && <audio ref={audioRef} src={event.music_url} loop preload="auto" />}
      <FloatingPetals />
      <WeddingHero event={event} />
      <GroomBride event={event} />
      {/* <WeddingDetails event={event} /> */}
      <VenueSection event={event} />
      <GallerySection event={event} />
      <PoemSection />
      <CountdownTimer date={event.date} time={event.time} title={event.title} venue={event.venue_name} venueAddress={event.venue_address} />
      <HealthProtocol />
      <RSVP eventId={event.id} />
      {/* <WeddingGifts /> */}
      <WeddingFooter event={event} />
      <Toaster />
    </div>
  );
}
