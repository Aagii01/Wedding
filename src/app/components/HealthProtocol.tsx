import { motion } from "motion/react";
import { EventData } from "../../types/event";
import { getSchedule, ScheduleItem } from "../../lib/eventContent";

const EASE = [0.22, 1, 0.36, 1] as const;

// events.schedule хоосон үед харагдах үндсэн хөтөлбөр
const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { time: "17:00", label: "Зочдоо хүлээн авах", desc: "Урилгаар ирсэн хүндэт зочид хүрэлцэн ирнэ" },
  { time: "17:30", label: "Хуримын танхимд суудал эзлэх", desc: "Зочид байраа эзлэн, ёслолд бэлтгэнэ" },
  { time: "18:00", label: "Нээлтийн үйл ажиллагаа", desc: "Хуримын нээлтийн үйл ажиллагаа" },
  { time: "18:20", label: "Хуримын 1-р хэсэг", desc: "Хосууд орж ирэх" },
  { time: "18:40", label: "Хүндэтгэлийн зоог", desc: "Баярын зоог барина" },
  { time: "20:20", label: "Хуримын 2-р хэсэг", desc: "Хуримын 2-р хэсэг эхлэнэ" },
  { time: "20:40", label: "Хосын анхны бүжиг", desc: "Хосын анхны бүжиг" },
  { time: "20:55", label: "Баярын бялуу хөндөх ёслол", desc: "Баярын бялуу хөндөх ёслол" },
  { time: "21:30", label: "Бусад үйл ажиллагаа", desc: "Урлаг уран сайхан болон бусад үйл ажиллагаа явагдана" },
  { time: "22:45", label: "Албан ёсны арга хэмжээ өндөрлөнө", desc: "Албан ёсны арга хэмжээ дуусаж чөлөөт бүжигээр баяр үргэлжилнэ" },
];
export function HealthProtocol({ event }: { event?: EventData }) {
  const schedule = event ? getSchedule(event, DEFAULT_SCHEDULE) : DEFAULT_SCHEDULE;

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px 0px" }}
          transition={{ duration: 0.75, ease: EASE }}
          className="text-center mb-12"
        >
          <p className="text-[10px] tracking-[0.25em] uppercase text-gray-400 mb-3">
            Өдрийн цагийн хуваарь
          </p>
          <h2 className="text-3xl font-serif text-gray-800">Хуримын хөтөлбөр</h2>
        </motion.div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[72px] top-3 bottom-3 w-px bg-gray-200" />

          <div className="space-y-8">
            {schedule.map(({ time, label, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-20px 0px" }}
                transition={{ duration: 0.65, delay: i * 0.09, ease: EASE }}
                className="flex items-start gap-6"
              >
                {/* Time */}
                <div className="w-[72px] flex-shrink-0 text-right">
                  <span className="text-sm font-medium text-gray-500">{time}</span>
                </div>

                {/* Dot */}
                <div className="relative flex-shrink-0 mt-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-800 ring-4 ring-gray-50" />
                </div>

                {/* Content */}
                <div className="pb-1">
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
