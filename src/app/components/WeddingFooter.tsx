import { motion } from "motion/react";
import { Heart, Phone, Mail, MapPin } from "lucide-react";

export function WeddingFooter() {
  return (
    <footer className="bg-gradient-to-b from-pink-50 to-pink-100 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Names */}
          <div className="mb-8">
            <h3 className="text-3xl md:text-4xl font-serif mb-4">Болд & Сарнай</h3>
            <div className="flex justify-center mb-4">
              <Heart className="w-6 h-6 fill-pink-500 text-pink-500" />
            </div>
            <p className="text-lg text-gray-600">2026.07.15</p>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="p-3 bg-white rounded-full mb-3">
                <Phone className="w-5 h-5 text-pink-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Утас</p>
              <a href="tel:+97699119911" className="text-gray-800 hover:text-pink-600 transition-colors">
                +976 9911-9911
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="p-3 bg-white rounded-full mb-3">
                <Mail className="w-5 h-5 text-pink-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">И-мэйл</p>
              <a href="mailto:wedding@example.com" className="text-gray-800 hover:text-pink-600 transition-colors">
                wedding@example.com
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center"
            >
              <div className="p-3 bg-white rounded-full mb-3">
                <MapPin className="w-5 h-5 text-pink-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Байршил</p>
              <p className="text-gray-800">Shangri-La Hotel</p>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="border-t border-pink-200 pt-8">
            <p className="text-gray-600 mb-2">
              Танай оролцоо бидэнд маш чухал
            </p>
            <p className="text-sm text-gray-500">
              Бидний амьдралын хамгийн онцгой өдрийг танай хамт тэмдэглэх гэж байна
            </p>
          </div>

          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="mt-8 pt-6 border-t border-pink-200"
          >
            <p className="text-sm text-gray-500">
              © 2026 Болд & Сарнай. Бүх эрх хуулиар хамгаалагдсан.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}
