import { motion } from "motion/react";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { EventData } from "../../types/event";

type Props = { event: EventData };

export function WeddingDetails({ event }: Props) {
  const details = [
    {
      icon: Calendar,
      title: "Огноо",
      description: event.date,
      subtitle: "",
    },
    {
      icon: Clock,
      title: "Цаг",
      description: event.time,
      subtitle: "Тогтсон цагтаа ирнэ үү",
    },
    {
      icon: MapPin,
      title: "Газар",
      description: event.venue_name,
      subtitle: event.venue_address,
    },
    {
      icon: Users,
      title: "Хүрэлцэн ирнэ үү",
      description: "Танаас хүлээж байна",
      subtitle: "Таны оролцоо чухал",
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-pink-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif mb-4">Хуримын дэлгэрэнгүй</h2>
          <p className="text-lg text-gray-600">Бидний хамтын аялалын эхлэл</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {details.map((detail, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="p-4 bg-pink-100 rounded-full">
                      <detail.icon className="w-8 h-8 text-pink-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{detail.title}</h3>
                  <p className="text-lg mb-1">{detail.description}</p>
                  {detail.subtitle && (
                    <p className="text-sm text-gray-500">{detail.subtitle}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
