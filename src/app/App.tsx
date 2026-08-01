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
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Видеог дуугүйгээр шууд автоматаар тоглуулна (browser зөвшөөрдөг)
    videoRef.current?.play().catch(() => {});
  }, []);

  const handleEnded = () => {
    if (exiting) return;
    audioRef.current?.play().catch(() => {});
    setExiting(true);
    setTimeout(() => setVisible(false), 1600);
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: "fixed", inset: 0,
        background: "#000",
        zIndex: 9999,
        overflow: "hidden",
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      <video
        ref={videoRef}
        src={INTRO_VIDEO_URL}
        autoPlay
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
// Хөтөлбөр (HealthProtocol) хэсгийг нуух slug-ууд.
const HIDE_SCHEDULE = new Set<string>(["jargasaikhan-irmuunzaya", "erdos-elmira"]);

type Props = { event: EventData };

export default function App({ event }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Browser нь дуутай audio-г user gesture-гүйгээр автоматаар тоглуулахыг
  // хориглодог. Тиймээс хэрэглэгчийн анхны хөдөлгөөн (tap / scroll / keydown)
  // дээр хөгжмийг асаана. Listener-ууд хөгжим амжилттай эхлэх хүртэл амьд үлдэнэ.
  useEffect(() => {
    if (!event.music_url) return;
    const startMusic = () => {
      const a = audioRef.current;
      if (!a) return;
      a.play().then(cleanup).catch(() => {});
    };
    const events = ["pointerdown", "touchstart", "keydown", "scroll"] as const;
    const cleanup = () => events.forEach((e) => window.removeEventListener(e, startMusic));
    // Desktop дээр шууд оролдоно (хориглогдвол доорх listener-ууд барина)
    startMusic();
    events.forEach((e) => window.addEventListener(e, startMusic, { passive: true }));
    return cleanup;
  }, [event.music_url]);

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
      <PoemSection event={event} />
      <CountdownTimer date={event.date} time={event.time} title={event.title} venue={event.venue_name} venueAddress={event.venue_address} slug={event.slug} />
      {/* Эдгээр slug дээр хөтөлбөрийн хэсгийг нуух */}
      {!HIDE_SCHEDULE.has(event.slug) && <HealthProtocol event={event} />}
      <RSVP eventId={event.id} slug={event.slug} />
      {/* <WeddingGifts /> */}
      <WeddingFooter event={event} />
      <Toaster />
    </div>
  );
}
