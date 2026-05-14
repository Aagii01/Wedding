// HorizontalCarousel — scroll-driven sticky carousel
//
// Behavior:
//   • Section height = slides.length × 100vh  → scroll captures the user for each slide
//   • Sticky inner viewport stays fixed while user scrolls through all slides
//   • After last slide, normal page scroll resumes automatically
//   • GSAP slide transition: x-slide in/out + scale + SplitText caption reveal
//
// Requires: npm install gsap  (v3.12+ includes SplitText for free)

import { useEffect, useRef, useState } from "react";
import { useScroll } from "motion/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

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
  const sectionRef    = useRef<HTMLElement>(null);
  const slideEls      = useRef<(HTMLDivElement | null)[]>([]);
  const titleEl       = useRef<HTMLHeadingElement>(null);
  const descEl        = useRef<HTMLParagraphElement>(null);
  const subEl         = useRef<HTMLSpanElement>(null);
  const idxEl         = useRef<HTMLSpanElement>(null);
  const progressBarEl = useRef<HTMLDivElement>(null);
  const hintEl        = useRef<HTMLDivElement>(null);
  const counterEl     = useRef<HTMLSpanElement>(null);

  const [dotActive, setDotActive] = useState(0);

  // Track scroll progress over the full section height
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    if (!slides.length) return;

    let curIdx = 0;
    const splitT = { v: null as InstanceType<typeof SplitText> | null };
    const splitD = { v: null as InstanceType<typeof SplitText> | null };

    // ── Initialize slide positions ──────────────────────────────────────────
    slideEls.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, {
        xPercent: i === 0 ? 0 : 108,
        scale:    i === 0 ? 1 : 0.86,
        opacity:  i === 0 ? 1 : 0,
        zIndex:   i === 0 ? 2 : 1,
      });
    });

    // ── SplitText word reveal helper ────────────────────────────────────────
    function revealText(
      el: HTMLElement,
      text: string,
      ref: { v: InstanceType<typeof SplitText> | null },
    ) {
      const doReveal = () => {
        el.textContent = text;
        const st = new SplitText(el, { type: "words" });
        ref.v = st;
        gsap.fromTo(
          st.words,
          { y: "115%", opacity: 0 },
          { y: "0%", opacity: 1, duration: 0.7, stagger: 0.03, ease: "power3.out", delay: 0.05 },
        );
      };
      if (ref.v) {
        const old = ref.v;
        ref.v = null;
        gsap.to(old.words, {
          y: "-115%", opacity: 0, duration: 0.35, stagger: 0.01, ease: "power2.in",
          onComplete: () => { old.revert(); doReveal(); },
        });
      } else {
        doReveal();
      }
    }

    function updateCaption(idx: number) {
      const s = slides[idx];
      if (subEl.current)     subEl.current.textContent = s.sub;
      if (idxEl.current)     idxEl.current.textContent = `(${s.index})`;
      if (counterEl.current) counterEl.current.textContent =
        `${String(idx + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
      if (titleEl.current) revealText(titleEl.current, s.title, splitT);
      if (descEl.current)  revealText(descEl.current,  s.desc,  splitD);
      setDotActive(idx);
    }

    // ── Slide transition ────────────────────────────────────────────────────
    function animateTo(newIdx: number, dir: 1 | -1) {
      const oldEl = slideEls.current[curIdx];
      const newEl = slideEls.current[newIdx];
      if (!oldEl || !newEl) return;

      // Outgoing slide
      gsap.to(oldEl, {
        xPercent: dir > 0 ? -108 : 108,
        scale: 0.86,
        opacity: 0,
        duration: 0.85,
        ease: "power3.inOut",
        zIndex: 1,
      });

      // Incoming slide
      gsap.fromTo(
        newEl,
        { xPercent: dir > 0 ? 108 : -108, scale: 0.86, opacity: 0, zIndex: 2 },
        { xPercent: 0, scale: 1, opacity: 1, duration: 0.85, ease: "power3.inOut" },
      );

      curIdx = newIdx;
      updateCaption(newIdx);
    }

    // First caption
    updateCaption(0);

    // ── Subscribe to scroll ─────────────────────────────────────────────────
    const unsub = scrollYProgress.on("change", (v) => {
      const n = slides.length;

      // Drive progress bar with GSAP (no React re-render)
      if (progressBarEl.current) {
        gsap.set(progressBarEl.current, { width: `${v * 100}%` });
      }

      // Map [0,1] → [0, n-1] with floor — each slide occupies 1/n of the range
      const newIdx = Math.min(n - 1, Math.max(0, Math.floor(v * n)));
      if (newIdx !== curIdx) {
        // Fade out scroll hint after user scrolls past the first slide
        if (curIdx === 0 && hintEl.current) {
          gsap.to(hintEl.current, { opacity: 0, y: 6, duration: 0.6, ease: "power2.out" });
        }
        animateTo(newIdx, newIdx > curIdx ? 1 : -1);
      }
    });

    return () => {
      unsub();
      splitT.v?.revert();
      splitD.v?.revert();
      gsap.killTweensOf(slideEls.current.filter(Boolean) as HTMLDivElement[]);
    };
  }, [slides, scrollYProgress]);

  if (!slides.length) return null;

  return (
    <>
      {/* ── Non-sticky header (scrolls away before sticky kicks in) ─────────── */}
      <div style={{ background: "#fff6f8", padding: "52px 16px 44px", textAlign: "center" }}>
        <p style={{
          color: "#c08090", fontSize: 10, letterSpacing: "0.3em",
          textTransform: "uppercase", margin: "0 0 10px",
          fontFamily: "'Cormorant Garamond', serif",
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

      {/* ── Sticky scroll section ────────────────────────────────────────────── */}
      {/* Height = slides.length × 100vh: user must scroll through all slides   */}
      <section
        ref={sectionRef}
        style={{ height: `${slides.length * 100}vh`, position: "relative" }}
      >
        <div style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          background: "linear-gradient(155deg, #2a0f1a 0%, #1a0a10 55%, #0d0508 100%)",
        }}>

          {/* ── Progress bar — top edge ───────────────────────────────────────── */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "rgba(255,220,230,0.10)", zIndex: 10 }}>
            <div
              ref={progressBarEl}
              style={{
                height: "100%", width: "0%",
                background: "linear-gradient(90deg, rgba(255,180,210,0.6), rgba(255,220,230,0.85))",
              }}
            />
          </div>

          {/* Sub-label — top left */}
          <div style={{ position: "absolute", top: "clamp(18px,3.5vh,36px)", left: "clamp(20px,5vw,44px)" }}>
            <span
              ref={subEl}
              style={{
                color: "rgba(255,220,230,0.40)", fontSize: 10,
                letterSpacing: "0.38em", textTransform: "uppercase",
                fontFamily: "'Cormorant Garamond', serif",
              }}
            />
          </div>

          {/* Index — top right */}
          <div style={{ position: "absolute", top: "clamp(10px,2vh,22px)", right: "clamp(20px,5vw,44px)" }}>
            <span
              ref={idxEl}
              style={{
                color: "rgba(255,220,230,0.20)",
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(38px,9vw,68px)",
                fontWeight: 300, lineHeight: 1,
              }}
            />
          </div>

          {/* ── Slide images ─────────────────────────────────────────────────── */}
          {slides.map((slide, i) => (
            <div
              key={i}
              ref={el => { slideEls.current[i] = el; }}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // Leave room for caption below
                paddingTop:    "clamp(56px,10vh,90px)",
                paddingBottom: "clamp(150px,28vh,230px)",
              }}
            >
              <div style={{
                width:        "clamp(200px, 64vw, 360px)",
                height:       "100%",
                maxHeight:    "clamp(270px, 54vh, 430px)",
                borderRadius: 16,
                overflow:     "hidden",
                boxShadow:    "0 28px 80px rgba(74,37,53,0.65)",
              }}>
                <img
                  src={slide.src}
                  alt={slide.title}
                  draggable={false}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>
          ))}

          {/* ── Caption ──────────────────────────────────────────────────────── */}
          <div style={{
            position:       "absolute",
            bottom:         "clamp(52px,11vh,100px)",
            left:           0,
            right:          0,
            textAlign:      "center",
            pointerEvents:  "none",
            padding:        "0 32px",
          }}>
            {/* Title — overflow hidden clips SplitText y-translate */}
            <div style={{ overflow: "hidden" }}>
              <h3
                ref={titleEl}
                style={{
                  fontFamily:  "'Dancing Script', cursive",
                  fontSize:    "clamp(34px, 9vw, 74px)",
                  color:       "#fff",
                  textShadow:  "0 2px 28px rgba(74,37,53,0.65)",
                  lineHeight:  1,
                  margin:      0,
                }}
              />
            </div>

            {/* Description */}
            <div style={{ overflow: "hidden", marginTop: 8 }}>
              <p
                ref={descEl}
                style={{
                  color:       "rgba(255,220,230,0.68)",
                  fontFamily:  "'Dancing Script', cursive",
                  fontSize:    "clamp(13px, 3.5vw, 18px)",
                  fontStyle:   "italic",
                  lineHeight:  1.55,
                  margin:      0,
                }}
              />
            </div>
          </div>

          {/* ── Bottom bar: counter · dots · hint ───────────────────────────── */}
          <div style={{
            position: "absolute",
            bottom:   "clamp(18px, 3.5vh, 36px)",
            left:     0, right: 0,
            display:  "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            padding: "0 clamp(20px,5vw,44px)",
          }}>
            {/* Slide counter — left */}
            <span
              ref={counterEl}
              style={{
                color:         "rgba(255,220,230,0.35)",
                fontFamily:    "'Cormorant Garamond', serif",
                fontSize:      11,
                letterSpacing: "0.18em",
                minWidth:      44,
                textAlign:     "right",
              }}
            />

            {/* Dots — center */}
            <div style={{ display: "flex", gap: 8 }}>
              {slides.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width:        i === dotActive ? 20 : 7,
                    height:       7,
                    borderRadius: 4,
                    background:   i === dotActive ? "rgba(255,220,230,0.85)" : "rgba(255,220,230,0.22)",
                    transition:   "width 0.35s ease, background 0.35s ease",
                  }}
                />
              ))}
            </div>

            {/* Scroll hint — right (fades out after first advance) */}
            <div
              ref={hintEl}
              style={{
                color:         "rgba(255,220,230,0.30)",
                fontSize:      10,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                fontFamily:    "'Cormorant Garamond', serif",
                pointerEvents: "none",
                minWidth:      44,
              }}
            >
              scroll ↓
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
