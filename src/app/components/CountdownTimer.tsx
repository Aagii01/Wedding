import { motion } from "motion/react";
import { useEffect, useState } from "react";

const WEDDING_DATE = new Date("2026-05-23T09:48:00");

function getTimeLeft() {
  const diff = WEDDING_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const units = [
    { label: "Өдөр", value: timeLeft.days },
    { label: "Цаг", value: timeLeft.hours },
    { label: "Минут", value: timeLeft.minutes },
    { label: "Секунд", value: timeLeft.seconds },
  ];

  return (
    <section className="py-16 px-4 bg-[#2d2d2d]">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold  text-white">2026 - 5 - 15</h2>
          <h2 className="text-xl font-bold  text-white mb-2"> 17 : 00</h2>
          <p className="text-gray-400 text-sm mb-10">
            Бидний амьдралын хамгийн нандин, дурсамжит мөч болох
            гал голомтоо бадраах ариун ёслолд хүрэлцэн ирж,
            аз жаргалыг маань хуваалцахыг урьж байна.
          </p>

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

          <button className="bg-white text-gray-800 text-sm font-medium px-8 py-3 rounded-full hover:bg-gray-100 transition-colors">
            Add to Calendarssss
          </button>
        </motion.div>
      </div>
    </section>
  );
}
