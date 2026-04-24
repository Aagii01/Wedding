import { motion } from "motion/react";

export function WeddingSchedule() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-2 gap-0 divide-x divide-gray-200">
          {/* Ceremony */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center px-6 py-8"
          >
            <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-3">Ceremony</p>
            <h3 className="text-lg md:text-xl font-serif text-gray-800 mb-4">Гэрлэлтийн ёслол</h3>
            <div className="w-10 h-px bg-gray-300 mb-4" />
            <p className="text-sm font-medium text-gray-700 mb-1">Friday, July 15th, 2026</p>
            <p className="text-sm text-gray-400">16:00 WIB</p>
          </motion.div>

          {/* Reception */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col items-center text-center px-6 py-8"
          >
            <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-3">Reception</p>
            <h3 className="text-lg md:text-xl font-serif text-gray-800 mb-4">Хурим</h3>
            <div className="w-10 h-px bg-gray-300 mb-4" />
            <p className="text-sm font-medium text-gray-700 mb-1">Friday, July 15th, 2026</p>
            <p className="text-sm text-gray-400">18:00 WIB</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
