import { motion } from "motion/react";
import { Instagram } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function GroomBride() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-2xl mx-auto grid grid-cols-2 gap-8 md:gap-20">
        {/* Groom */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden mb-4 shadow-lg ring-4 ring-gray-100">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop&q=80"
              alt="Groom"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-1">Groom</p>
          <h3 className="text-xl font-serif mb-1">Болд</h3>
          <p className="text-sm text-gray-400 mb-3">Нэр овог мэдэгдэнэ үү</p>
          <a
            href="#"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Instagram className="w-3.5 h-3.5" />
            @bold.username
          </a>
        </motion.div>

        {/* Bride */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden mb-4 shadow-lg ring-4 ring-gray-100">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&fit=crop&q=80"
              alt="Bride"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-1">Bride</p>
          <h3 className="text-xl font-serif mb-1">Сарнай</h3>
          <p className="text-sm text-gray-400 mb-3">Нэр овог мэдэгдэнэ үү</p>
          <a
            href="#"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Instagram className="w-3.5 h-3.5" />
            @sarnai.username
          </a>
        </motion.div>
      </div>
    </section>
  );
}
