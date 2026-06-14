import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  date: string;
  time: string;
  title: string;
  venue: string;
  venueAddress: string;
};

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

function formatDate(date: string) {
  const [y, m, d] = date.split("-");
  return `${y} · ${m} · ${d}`;
}

function FlipNumber({ value }: { value: number }) {
  const display = String(value).padStart(2, "0");
  return (
    <div
      className="relative h-14 md:h-[5rem]"
      style={{ perspective: "500px" }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={display}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 80, opacity: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center text-5xl md:text-7xl font-light text-gray-800 tabular-nums leading-none"
          style={{ transformOrigin: "center top", fontFamily: "'Cormorant Garamond', serif" }}
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function TimerNumbers({ date, time }: { date: string; time: string }) {
  const target = useRef(new Date(`${date}T${time}:00`));
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(target.current));

  useEffect(() => {
    target.current = new Date(`${date}T${time}:00`);
    const timer = setInterval(() => setTimeLeft(getTimeLeft(target.current)), 1000);
    return () => clearInterval(timer);
  }, [date, time]);

  const units = [
    { label: "Өдөр", value: timeLeft.days },
    { label: "Цаг", value: timeLeft.hours },
    { label: "Минут", value: timeLeft.minutes },
    { label: "Секунд", value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center mb-12">
      {units.map(({ label, value }, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center px-5 md:px-9">
            <FlipNumber value={value} />
            <span className="text-[9px] tracking-[0.25em] text-gray-400 uppercase mt-3">
              {label}
            </span>
          </div>
          {i < 3 && <div className="w-px h-10 bg-gray-200 flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}

function toCalDate(date: string, time: string) {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

function addHours(date: string, time: string, hours: number) {
  const d = new Date(`${date}T${time}:00`);
  d.setHours(d.getHours() + hours);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

export function CountdownTimer({ date, time, title, venue, venueAddress }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const start = toCalDate(date, time);
  const end = addHours(date, time, 4);
  const location = [venue, venueAddress].filter(Boolean).join(", ");
  const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&location=${encodeURIComponent(location)}`;

  function downloadIcs() {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${title}`,
      `LOCATION:${location}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wedding.ics";
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  return (
    <section className="py-20 px-4 bg-[#f8f5f0]">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-5">
            Хуримд үлдсэн хугацаа
          </p>

          <h2
            className="text-5xl md:text-6xl text-gray-800 mb-8"
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            {formatDate(date)}
          </h2>

          <div className="w-10 h-px bg-gray-300 mx-auto mb-12" />

          <TimerNumbers date={date} time={time} />

          {/* Calendar dropdown — түр нуусан (буцааж асаах: false → true) */}
          {false && (
          <div className="inline-block relative" ref={ref}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-600 text-sm px-8 py-3 rounded-full hover:border-gray-500 hover:text-gray-800 transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              Календарьт нэмэх
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: EASE }}
                  className="absolute left-1/2 -translate-x-1/2 mt-2 w-52 bg-white rounded-2xl shadow-xl overflow-hidden z-10"
                >
                  <a
                    href={googleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-base">📅</span>
                    Google Calendar
                  </a>
                  <div className="h-px bg-gray-100 mx-3" />
                  <button
                    onClick={downloadIcs}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-base">🍎</span>
                    Apple / Outlook
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
