import { motion } from "motion/react";
import { Check } from "lucide-react";

export function WeddingSchedule() {
  const schedule = [
    {
      time: "17:30",
      title: "Зочид ирэлт",
      description: "Зочдыг угтан авах, гэрэл зураг авалт"
    },
    {
      time: "18:00",
      title: "Ёслол эхлэх",
      description: "Албан ёсны гэрлэлтийн ёслол"
    },
    {
      time: "19:00",
      title: "Оройн хоол",
      description: "Үдэшлэг эхэлж, хоол үйлчлэх"
    },
    {
      time: "20:00",
      title: "Бүжгийн цаг",
      description: "Хөгжилтэй бүжиг, дуу хөгжим"
    },
    {
      time: "22:00",
      title: "Төгсгөл",
      description: "Баяртай гэж мэндлэх"
    }
  ];

  return (
    <section className="py-20 px-4 bg-pink-50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif mb-4">Хөтөлбөр</h2>
          <p className="text-lg text-gray-600">Өдрийн цагийн хуваарь</p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-pink-200"></div>

          <div className="space-y-8">
            {schedule.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex items-center ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Timeline dot */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 bg-pink-500 rounded-full border-4 border-white shadow-md z-10"></div>

                {/* Content */}
                <div className={`flex-1 ml-20 md:ml-0 ${
                  index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'
                }`}>
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center gap-2 mb-2 md:justify-end">
                      <span className="text-2xl font-semibold text-pink-600">{item.time}</span>
                      <Check className="w-5 h-5 text-pink-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block flex-1"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
