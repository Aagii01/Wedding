// HorizontalCarousel — Wheel / Drag driven image carousel
// Requires:  npm install gsap   (v3.12+ for free SplitText)
import { useEffect, useRef } from "react";
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

const VISIBLE_RANGE  = 4;
const SCALE_ACTIVE   = 1.42;
const SCALE_INACTIVE = 0.80;
const ITEM_SPACING   = 600;
const DRAG_THRESHOLD = ITEM_SPACING * 0.10;
const WHEEL_DEBOUNCE = 680;

export function HorizontalCarousel({
  slides,
  heading  = "Зургийн Цомог",
  subLabel = "Дурсамж",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef      = useRef<HTMLUListElement>(null);
  const titleRef     = useRef<HTMLHeadingElement>(null);
  const descRef      = useRef<HTMLParagraphElement>(null);
  const indexRef     = useRef<HTMLSpanElement>(null);
  const subLblRef    = useRef<HTMLSpanElement>(null);
  const dotsRef      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slides.length) return;

    const container = containerRef.current!;
    const list      = listRef.current!;
    const titleEl   = titleRef.current!;
    const descEl    = descRef.current!;
    const indexEl   = indexRef.current!;
    const subLblEl  = subLblRef.current!;
    const dotsEl    = dotsRef.current!;

    let curIdx   = 0;
    let items: { el: HTMLLIElement; rel: number }[] = [];
    let dragging = false;
    let dragX0   = 0;
    let dragDX   = 0;
    let wheelTO: ReturnType<typeof setTimeout> | null = null;
    let inView   = false;

    const splitT = { v: null as InstanceType<typeof SplitText> | null };
    const splitD = { v: null as InstanceType<typeof SplitText> | null };

    // Dot indicators
    const dots: HTMLButtonElement[] = [];
    slides.forEach((_, i) => {
      const d = document.createElement("button");
      Object.assign(d.style, {
        width: "7px", height: "7px", borderRadius: "50%",
        border: "none", padding: "0", cursor: "pointer",
        transition: "all 0.35s ease",
        background:  i === 0 ? "rgba(255,220,230,0.90)" : "rgba(255,220,230,0.28)",
        transform:   i === 0 ? "scale(1.5)" : "scale(1)",
      });
      d.addEventListener("click", () => {
        const cur = ((curIdx % slides.length) + slides.length) % slides.length;
        const diff = i - cur;
        if (diff === 0) return;
        let step = 0;
        const dir = diff > 0 ? 1 : -1;
        const steps = Math.abs(diff);
        const go = () => {
          if (step >= steps) return;
          advance(dir);
          step++;
          setTimeout(go, 200);
        };
        go();
      });
      dotsEl.appendChild(d);
      dots.push(d);
    });

    function refreshDots() {
      const active = ((curIdx % slides.length) + slides.length) % slides.length;
      dots.forEach((d, j) => {
        Object.assign(d.style, {
          background: j === active ? "rgba(255,220,230,0.90)" : "rgba(255,220,230,0.28)",
          transform:  j === active ? "scale(1.5)" : "scale(1)",
        });
      });
    }

    function getSlide(rel: number) {
      const i = ((curIdx + rel) % slides.length + slides.length) % slides.length;
      return slides[i];
    }

    function addItem(rel: number) {
      const s  = getSlide(rel);
      const li = document.createElement("li");
      li.innerHTML = `<img src="${s.src}" alt="${s.title}" />`;
      Object.assign(li.style, {
        position: "absolute", top: "0", left: "0",
        width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        userSelect: "none", listStyle: "none",
      });
      const img = li.firstElementChild as HTMLImageElement;
      img.setAttribute("draggable", "false");
      Object.assign(img.style, {
        width: "100%", height: "100%", objectFit: "cover",
        pointerEvents: "none", userSelect: "none",
        borderRadius: "16px",
        boxShadow: "0 28px 80px rgba(74,37,53,0.65)",
      });
      gsap.set(li, {
        x:       rel * ITEM_SPACING,
        scale:   rel === 0 ? SCALE_ACTIVE : SCALE_INACTIVE,
        zIndex:  rel === 0 ? 100 : Math.max(1, VISIBLE_RANGE - Math.abs(rel) + 1),
        opacity: Math.max(0, 1 - Math.abs(rel) * 0.18),
      });
      list.appendChild(li);
      items.push({ el: li, rel });
    }

    function removeItem(rel: number) {
      const idx = items.findIndex(i => i.rel === rel);
      if (idx !== -1) { items[idx].el.remove(); items.splice(idx, 1); }
    }

    function setPositions(offsetX = 0, animate = true) {
      items.forEach(({ el, rel }) => {
        const tx = rel * ITEM_SPACING + offsetX;
        const sc = rel === 0 ? SCALE_ACTIVE : SCALE_INACTIVE;
        const zi = rel === 0 ? 100 : Math.max(1, VISIBLE_RANGE - Math.abs(rel) + 1);
        const op = Math.max(0, 1 - Math.abs(rel) * 0.18);
        if (animate && offsetX === 0) {
          gsap.to(el, { x: tx, scale: sc, zIndex: zi, opacity: op, duration: 1.75, ease: "power3.out" });
        } else {
          gsap.set(el, { x: tx, scale: sc, zIndex: zi, opacity: op });
        }
      });
    }

    function revealWords(
      el: HTMLElement,
      text: string,
      ref: { v: InstanceType<typeof SplitText> | null },
    ) {
      const doReveal = () => {
        el.textContent = text;
        const st = new SplitText(el, { type: "words" });
        ref.v = st;
        gsap.set(st.words, { y: "115%", opacity: 0 });
        gsap.to(st.words, { y: "0%", opacity: 1, duration: 0.75, stagger: 0.025, ease: "power3.out", delay: 0.05 });
      };

      if (ref.v) {
        const old = ref.v;
        ref.v = null;
        gsap.to(old.words, {
          y: "-115%", opacity: 0, duration: 0.42, stagger: 0.015, ease: "power2.in",
          onComplete: () => { old.revert(); doReveal(); },
        });
      } else {
        doReveal();
      }
    }

    function updateCaption() {
      const i = ((curIdx % slides.length) + slides.length) % slides.length;
      const s = slides[i];
      subLblEl.textContent = s.sub;
      indexEl.textContent  = `(${s.index})`;
      revealWords(titleEl, s.title, splitT);
      revealWords(descEl,  s.desc,  splitD);
      refreshDots();
    }

    function advance(dir: 1 | -1) {
      curIdx += dir;
      if (dir === 1) {
        removeItem(-VISIBLE_RANGE);
        items.forEach(i => { i.rel--; });
        addItem(VISIBLE_RANGE);
      } else {
        removeItem(VISIBLE_RANGE);
        items.forEach(i => { i.rel++; });
        addItem(-VISIBLE_RANGE);
      }
      setPositions();
      updateCaption();
    }

    for (let r = -VISIBLE_RANGE; r <= VISIBLE_RANGE; r++) addItem(r);
    setPositions(0, false);
    updateCaption();

    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: 0.55 });
    io.observe(container);

    function onWheel(e: WheelEvent) {
      if (!inView) return;
      e.preventDefault();
      if (wheelTO) return;
      wheelTO = setTimeout(() => { wheelTO = null; }, WHEEL_DEBOUNCE);
      advance(e.deltaY > 0 ? 1 : -1);
    }

    function clientX(e: MouseEvent | TouchEvent) {
      return e instanceof TouchEvent ? e.touches[0].clientX : e.clientX;
    }
    function onPointerDown(e: MouseEvent | TouchEvent) {
      dragging = true;
      dragX0   = clientX(e);
      dragDX   = 0;
      container.style.cursor = "grabbing";
    }
    function onPointerMove(e: MouseEvent | TouchEvent) {
      if (!dragging) return;
      dragDX = clientX(e) - dragX0;
      setPositions(dragDX, false);
    }
    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      container.style.cursor = "grab";
      if (Math.abs(dragDX) > DRAG_THRESHOLD) advance(dragDX > 0 ? -1 : 1);
      else setPositions(0);
      dragDX = 0;
    }

    container.addEventListener("wheel",      onWheel,                        { passive: false });
    container.addEventListener("mousedown",  onPointerDown as EventListener);
    window   .addEventListener("mousemove",  onPointerMove as EventListener);
    window   .addEventListener("mouseup",    onPointerUp);
    container.addEventListener("touchstart", onPointerDown as EventListener, { passive: true });
    container.addEventListener("touchmove",  onPointerMove as EventListener, { passive: true });
    container.addEventListener("touchend",   onPointerUp);
    container.style.cursor = "grab";

    return () => {
      io.disconnect();
      container.removeEventListener("wheel",      onWheel);
      container.removeEventListener("mousedown",  onPointerDown as EventListener);
      window   .removeEventListener("mousemove",  onPointerMove as EventListener);
      window   .removeEventListener("mouseup",    onPointerUp);
      container.removeEventListener("touchstart", onPointerDown as EventListener);
      container.removeEventListener("touchmove",  onPointerMove as EventListener);
      container.removeEventListener("touchend",   onPointerUp);
      gsap.killTweensOf(items.map(i => i.el));
      splitT.v?.revert();
      splitD.v?.revert();
      if (wheelTO) clearTimeout(wheelTO);
    };
  }, [slides]);

  return (
    <section>
      {/* Section header */}
      <div style={{ background: "#fff6f8", padding: "48px 16px", textAlign: "center" }}>
        <p style={{ color: "#c08090", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "12px" }}>
          {subLabel}
        </p>
        <h2 style={{ fontFamily: "'Dancing Script', cursive", color: "#7a4a5a", fontSize: "clamp(28px, 5vw, 48px)", margin: 0 }}>
          {heading}
        </h2>
      </div>

      {/* Carousel stage */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          background: "linear-gradient(155deg, #2a0f1a 0%, #1a0a10 55%, #0d0508 100%)",
          userSelect: "none",
        }}
      >
        {/* Sub-label top-left */}
        <div style={{ position: "absolute", top: "clamp(20px, 3.5vh, 44px)", left: "clamp(24px, 4vw, 60px)" }}>
          <span
            ref={subLblRef}
            style={{ color: "rgba(255,220,230,0.40)", fontSize: "11px", letterSpacing: "0.35em", textTransform: "uppercase", fontFamily: "'Cormorant Garamond', serif" }}
          />
        </div>

        {/* Index top-right */}
        <div style={{ position: "absolute", top: "clamp(16px, 3vh, 40px)", right: "clamp(24px, 4vw, 60px)" }}>
          <span
            ref={indexRef}
            style={{ color: "rgba(255,220,230,0.22)", fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 300, lineHeight: 1 }}
          />
        </div>

        {/* Image list — GSAP writes children imperatively */}
        <ul
          ref={listRef}
          style={{
            position: "absolute",
            width: "clamp(260px, 38vh, 500px)",
            aspectRatio: "1 / 1.1",
            top: "46%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        />

        {/* Caption area */}
        <div style={{ position: "absolute", bottom: "clamp(72px, 14vh, 140px)", left: 0, width: "100%", textAlign: "center", pointerEvents: "none" }}>
          <div style={{ overflow: "hidden" }}>
            <h3
              ref={titleRef}
              style={{ fontFamily: "'Dancing Script', cursive", fontSize: "clamp(44px, 7.5vw, 90px)", color: "#fff", textShadow: "0 2px 28px rgba(74,37,53,0.65)", lineHeight: 1, margin: 0 }}
            />
          </div>
          <div style={{ overflow: "hidden", marginTop: "10px" }}>
            <p
              ref={descRef}
              style={{ color: "rgba(255,220,230,0.70)", fontFamily: "'Dancing Script', cursive", fontSize: "clamp(13px, 2vw, 21px)", fontStyle: "italic", lineHeight: 1.55, margin: 0 }}
            />
          </div>
        </div>

        {/* Dot indicators */}
        <div
          ref={dotsRef}
          style={{ position: "absolute", bottom: "clamp(22px, 3.8vh, 42px)", left: 0, width: "100%", display: "flex", justifyContent: "center", gap: "10px" }}
        />

        {/* Scroll hint */}
        <div style={{ position: "absolute", bottom: "clamp(22px, 3.8vh, 42px)", right: "clamp(24px, 4vw, 56px)", color: "rgba(255,220,230,0.28)", fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", fontFamily: "'Cormorant Garamond', serif", pointerEvents: "none" }}>
          scroll · drag
        </div>
      </div>
    </section>
  );
}
