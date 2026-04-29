const PETALS = [
  { id: 0,  left: 5,  delay: 0,   dur: 9,  size: 11, drift:  50, rot: 0   },
  { id: 1,  left: 15, delay: 2.5, dur: 11, size: 8,  drift: -40, rot: 45  },
  { id: 2,  left: 27, delay: 1,   dur: 8,  size: 13, drift:  35, rot: 90  },
  { id: 3,  left: 40, delay: 3.5, dur: 10, size: 9,  drift: -55, rot: 135 },
  { id: 4,  left: 54, delay: 0.5, dur: 12, size: 8,  drift:  45, rot: 20  },
  { id: 5,  left: 65, delay: 4,   dur: 9,  size: 12, drift: -35, rot: 70  },
  { id: 6,  left: 77, delay: 1.5, dur: 11, size: 7,  drift:  60, rot: 160 },
  { id: 7,  left: 88, delay: 3,   dur: 8,  size: 10, drift: -50, rot: 200 },
  { id: 8,  left: 33, delay: 5,   dur: 10, size: 9,  drift:  40, rot: 240 },
  { id: 9,  left: 60, delay: 6,   dur: 9,  size: 8,  drift: -30, rot: 300 },
  { id: 10, left: 91, delay: 2,   dur: 13, size: 11, drift:  35, rot: 330 },
  { id: 11, left: 48, delay: 7,   dur: 8,  size: 7,  drift: -45, rot: 15  },
  { id: 12, left: 22, delay: 4.5, dur: 11, size: 10, drift:  55, rot: 80  },
  { id: 13, left: 73, delay: 8,   dur: 10, size: 8,  drift: -60, rot: 120 },
];

const COLORS = ["#f4a7b8", "#e8869e", "#fbc8d4", "#f2a0b5", "#e97a98"];

export function FloatingPetals() {
  return (
    <>
      <style>{`
        @keyframes petalFall {
          0%   { opacity: 0;    transform: translateY(-40px)   rotate(0deg)   translateX(0px); }
          8%   { opacity: 0.7; }
          92%  { opacity: 0.45; }
          100% { opacity: 0;    transform: translateY(105vh)   rotate(540deg) translateX(var(--petal-drift)); }
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
        {PETALS.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.left}%`,
              top: 0,
              animation: `petalFall ${p.dur}s ${p.delay}s ease-in-out infinite`,
              ["--petal-drift" as string]: `${p.drift}px`,
            }}
          >
            <svg
              width={p.size}
              height={p.size * 1.6}
              viewBox="0 0 20 32"
              style={{ transform: `rotate(${p.rot}deg)` }}
              fill={COLORS[p.id % COLORS.length]}
            >
              <path d="M10 0 C17 7, 20 16, 10 32 C0 16, 3 7, 10 0Z" opacity="0.75" />
            </svg>
          </div>
        ))}
      </div>
    </>
  );
}
