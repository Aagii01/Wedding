import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
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

// ─── Video intro overlay ─────────────────────────────────────────────────────
const INTRO_VIDEO_URL =
  "https://tdy-excellence-template.thedigitalyes.com/assets/intro-video-new-CeLMqoNn.mp4";

function VideoIntro({ audioRef }: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const [started, setStarted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const start = () => {
    if (started) return;
    setStarted(true);
    const v = videoRef.current;
    if (v) {
      v.muted = false;
      v.play().catch(() => {
        v.muted = true;
        v.play().catch(() => {});
      });
    }
    audioRef.current?.play().catch(() => {});
  };

  const handleEnded = () => {
    if (exiting) return;
    // Видео дуусахад ар талын хөгжмийг баталгаатай эхлүүлнэ
    // (intro товшилт нь user gesture болсон тул энд play() зөвшөөрөгдөнө)
    audioRef.current?.play().catch(() => {});
    setExiting(true);
    setTimeout(() => setVisible(false), 1600);
  };

  if (!visible) return null;

  return (
    <motion.div
      onClick={!started ? start : undefined}
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: "fixed", inset: 0,
        background: "#000",
        zIndex: 9999,
        overflow: "hidden",
        cursor: !started ? "pointer" : "default",
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      <video
        ref={videoRef}
        src={INTRO_VIDEO_URL}
        muted
        playsInline
        preload="auto"
        onEnded={handleEnded}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Click-to-start hint */}
      {!started && (
        <motion.div
          animate={{ y: [0, -6, 0], opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          style={{
            position: "absolute", bottom: "8%", left: 0, right: 0,
            color: "rgba(255,255,255,0.85)",
            fontFamily: "serif", fontStyle: "italic",
            fontSize: 15, letterSpacing: "0.18em",
            pointerEvents: "none",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            textShadow: "0 2px 12px rgba(0,0,0,0.6)",
          }}
        >
          <span>↓</span> Дарж эхлүүлэх <span>↓</span>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Music player ────────────────────────────────────────────────────────────
function MusicPlayer({ audioRef }: { audioRef: React.RefObject<HTMLAudioElement | null> }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay  = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("play",  onPlay);
    a.addEventListener("pause", onPause);
    return () => { a.removeEventListener("play", onPlay); a.removeEventListener("pause", onPause); };
  }, [audioRef]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000 }}>
      <button onClick={toggle} style={{
        width: 48, height: 48, borderRadius: "50%",
        background: "#0f1b35", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
      }}>
        {playing ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <polygon points="6,3 20,12 6,21" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
type Props = { event: EventData };

export default function App({ event }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <VideoIntro audioRef={audioRef} />
      {event.music_url && <audio ref={audioRef} src={event.music_url} loop preload="auto" />}
      {event.music_url && <MusicPlayer audioRef={audioRef} />}
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
