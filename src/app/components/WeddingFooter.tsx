import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function WeddingFooter() {
  return (
    <footer className="relative h-64 md:h-80 overflow-hidden">
      <ImageWithFallback
        src="https://images.unsplash.com/photo-1519741497674-611481863552?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
        alt="Болд & Сарнай"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-white"
        >
          <p className="text-xs tracking-widest mb-3 text-white/60 uppercase">The wedding of</p>
          <h2
            className="text-5xl mb-3"
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            Болд & Сарнай
          </h2>
          <p className="text-sm text-white/60 tracking-wide">Friday, July 15th, 2026</p>
        </motion.div>
      </div>
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-white/30 text-[10px] tracking-widest uppercase">One Wedding</p>
      </div>
    </footer>
  );
}
