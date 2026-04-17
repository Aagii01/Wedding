import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function OurStory() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif mb-4">Бидний түүх</h2>
          <p className="text-lg text-gray-600">Хайр дурлалын замнал</p>
        </motion.div>

        <div className="space-y-16">
          {/* Story 1 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row gap-8 items-center"
          >
            <div className="flex-1">
              <div className="relative h-64 md:h-80 rounded-lg overflow-hidden shadow-lg">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1700142611715-8a023c5eb8c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwZmxvd2VycyUyMGJvdXF1ZXQlMjB3aGl0ZXxlbnwxfHx8fDE3NzYyMjY3MjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="First meeting"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-6xl text-pink-200 font-serif mb-4">2020</div>
              <h3 className="text-2xl font-semibold mb-4">Анхны уулзалт</h3>
              <p className="text-gray-600 leading-relaxed">
                Бид 2020 оны намар найзынхаа төрсөн өдрийн үдэшлэг дээр анх уулзсан. 
                Тэр үдэш бидний хоёрын хооронд ямар нэгэн онцгой холбоо үүссэн нь тодорхой байлаа. 
                Ярилцаж эхлэхэд бид хоёр олон зүйлд ижил төстэй байгааг олж мэдсэн.
              </p>
            </div>
          </motion.div>

          {/* Story 2 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row-reverse gap-8 items-center"
          >
            <div className="flex-1">
              <div className="relative h-64 md:h-80 rounded-lg overflow-hidden shadow-lg">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1772404245994-200ca40c47fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb21hbnRpYyUyMGdhcmRlbiUyMHdlZGRpbmclMjB2ZW51ZXxlbnwxfHx8fDE3NzYzMjQ1NDN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Proposal"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-6xl text-pink-200 font-serif mb-4">2025</div>
              <h3 className="text-2xl font-semibold mb-4">Гэрлэлтийн санал</h3>
              <p className="text-gray-600 leading-relaxed">
                5 жилийн дараа би түүнд гэрлэх саналаа тавьлаа. Тэрээр баяртайгаар зөвшөөрсөн. 
                Энэ нь манай хоёрын амьдралын хамгийн их санагдах мөч байсан. 
                Одоо бид энэ онцгой өдрийг танай хамт тэмдэглэхийг хүсч байна.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
