import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

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
    <div className="grid grid-cols-4 gap-4 mb-10">
      {units.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center">
          <span className="text-4xl md:text-6xl font-bold text-white tabular-nums">
            {String(value).padStart(2, "0")}
          </span>
          <span className="text-gray-400 text-[10px] mt-2 tracking-widest uppercase">
            {label}
          </span>
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
    <section className="py-6 px-4 bg-[#2d2d2d]">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
      

        </motion.div>
          <h2 className="text-4xl font-bold text-white mb-8 mt-0">{date}</h2>
          {/* <h2 className="text-xl font-bold text-white mb-2">{time}</h2> */}
        {/* Timer — тусдаа render, animation дахрахгүй */}
        <TimerNumbers date={date} time={time} />

        {/* Calendar dropdown */}
        <div className="inline-block relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-2 bg-white text-gray-800 text-sm font-medium px-8 py-3 rounded-full hover:bg-gray-100 transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
            Календарьт нэмэх
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.18 }}
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
      </div>
    </section>
  );
}
