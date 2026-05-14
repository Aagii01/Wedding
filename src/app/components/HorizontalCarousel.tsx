// HorizontalCarousel — horizontal snap scroll, no vertical scroll hijacking
// All slides visible in a draggable horizontal strip.
// Touch/mouse drag navigates between slides; vertical page scroll is unblocked.

import { useEffect, useRef, useState } from "react";

export type CarouselSlide = {
  src:   string;
  title: string;
  sub:   string;
  index: string;
  desc:  string;
};

type Props = {
  slides:    CarouselSlide[];
  heading?:  string;
  subLabel?: string;
};

export function HorizontalCarousel({
  slides,
  heading  = "Зургийн Цомог",
  subLabel = "Дурсамж",
}: Props) {
  const trackRef   = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  // ── Sync dot indicator with native scroll position ──────────────────────────
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const idx = Math.round(track.scrollLeft / track.clientWidth);
      setCurrent(Math.max(0, Math.min(idx, slides.length - 1)));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [slides.length]);

  // ── Dot click → smooth scroll to slide ──────────────────────────────────────
  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  };

  return (
    <section>
      {/* ── Section header ──────────────────────────────────────────────────── */}
      <div style={{ background: "#fff6f8", padding: "44px 16px 36px", textAlign: "center" }}>
        <p style={{
          color: "#c08090", fontSize: 10, letterSpacing: "0.3em",
          textTransform: "uppercase", margin: "0 0 10px",
        }}>
          {subLabel}
        </p>
        <h2 style={{
          fontFamily: "'Dancing Script', cursive",
          color: "#7a4a5a",
          fontSize: "clamp(26px, 6vw, 44px)",
          margin: 0, lineHeight: 1.2,
        }}>
          {heading}
        </h2>
      </div>

      {/* ── Carousel body ───────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(155deg, #2a0f1a 0%, #1a0a10 55%, #0d0508 100%)",
        paddingBottom: 40,
      }}>
        {/* Horizontal scroll track — CSS scroll-snap handles touch natively */}
        <div
          ref={trackRef}
          className="hc-track"
          style={{
            display: "flex",
            overflowX: "scroll",
            overflowY: "visible",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            cursor: "grab",
          }}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              style={{
                minWidth: "85%",
                scrollSnapAlign: "center",
                padding: "36px 16px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                userSelect: "none",
              }}
            >
              {/* Image */}
              <div style={{
                width: "100%",
                aspectRatio: "3 / 4",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
                flexShrink: 0,
              }}>
                <img
                  src={slide.src}
                  alt={slide.title}
                  draggable={false}
                  style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
                />
              </div>

              {/* Sub-label + index row */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                marginTop: 20, marginBottom: 6,
              }}>
                <span style={{
                  color: "rgba(255,220,230,0.45)", fontSize: 10,
                  letterSpacing: "0.32em", textTransform: "uppercase",
                  fontFamily: "'Cormorant Garamond', serif",
                }}>
                  {slide.sub}
                </span>
                <span style={{
                  color: "rgba(255,220,230,0.22)", fontSize: 11,
                  fontFamily: "'Cormorant Garamond', serif",
                }}>
                  {slide.index}
                </span>
              </div>

              {/* Title */}
              <div style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: "clamp(28px, 7vw, 42px)",
                color: "#fff",
                textShadow: "0 2px 20px rgba(74,37,53,0.7)",
                lineHeight: 1.15,
                textAlign: "center",
                marginBottom: 8,
              }}>
                {slide.title}
              </div>

              {/* Description */}
              <p style={{
                color: "rgba(255,220,230,0.65)",
                fontFamily: "'Dancing Script', cursive",
                fontSize: "clamp(13px, 3.5vw, 17px)",
                fontStyle: "italic",
                lineHeight: 1.55,
                textAlign: "center",
                margin: 0,
                maxWidth: 260,
              }}>
                {slide.desc}
              </p>
            </div>
          ))}

          {/* Right padding slot so last slide centres properly */}
          <div style={{ minWidth: "7.5%" }} aria-hidden />
        </div>

        {/* ── Dot indicators ──────────────────────────────────────────────── */}
        <div style={{
          display: "flex", justifyContent: "center",
          gap: 10, paddingTop: 28,
        }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: 7, height: 7,
                borderRadius: "50%",
                border: "none", padding: 0, cursor: "pointer",
                background: i === current ? "rgba(255,220,230,0.90)" : "rgba(255,220,230,0.25)",
                transform: i === current ? "scale(1.55)" : "scale(1)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Swipe hint — fades out after first interaction */}
        <p style={{
          textAlign: "center", marginTop: 14,
          color: "rgba(255,220,230,0.28)",
          fontSize: 10, letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontFamily: "'Cormorant Garamond', serif",
          pointerEvents: "none",
        }}>
          swipe · drag
        </p>
      </div>
    </section>
  );
}
