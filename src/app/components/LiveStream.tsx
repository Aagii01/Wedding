import { motion } from "motion/react";
import { Instagram, Video, Youtube } from "lucide-react";

const streams = [
  {
    Icon: Instagram,
    label: "Instagram",
    href: "#",
    bg: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
  },
  {
    Icon: Video,
    label: "Zoom",
    href: "#",
    bg: "bg-blue-500",
  },
  {
    Icon: Youtube,
    label: "Youtube",
    href: "#",
    bg: "bg-red-500",
  },
];

export function LiveStream() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-serif text-gray-800">Live Stream</h2>
        </motion.div>

        <div className="grid grid-cols-3 gap-6">
          {streams.map(({ Icon, label, href, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center gap-3"
            >
              <div
                className={`w-16 h-16 rounded-2xl ${bg} flex items-center justify-center text-white shadow-lg`}
              >
                <Icon className="w-7 h-7" />
              </div>
              <span className="text-sm font-medium text-gray-700">{label}</span>
              <a
                href={href}
                className="text-xs text-gray-500 border border-gray-200 rounded-full px-4 py-1.5 hover:bg-gray-50 transition-colors"
              >
                Click Here
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
