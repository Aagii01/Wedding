import { motion } from "motion/react";
import { Gift } from "lucide-react";

export function WeddingGifts() {
  return (
    <section className="py-16 px-4 bg-white text-center">
      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-serif text-gray-800 mb-4">Wedding Gifts</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-8">
            We understand that some of you might want to send us a greeting or gift,
            so please tap the following button to send them.
          </p>
          <button className="inline-flex items-center gap-2 bg-gray-800 text-white text-sm font-medium px-8 py-3 rounded-full hover:bg-gray-700 transition-colors">
            <Gift className="w-4 h-4" />
            Wedding Gift
          </button>
        </motion.div>
      </div>
    </section>
  );
}
