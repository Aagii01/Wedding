import { motion } from "motion/react";
import { Droplets, ShieldCheck, ArrowLeftRight, HandMetal, Users } from "lucide-react";

const protocols = [
  { Icon: Droplets, label: "Hand wash" },
  { Icon: ShieldCheck, label: "Use Face-mask" },
  { Icon: ArrowLeftRight, label: "Social Distancing" },
  { Icon: HandMetal, label: "No Contact" },
  { Icon: Users, label: "No Crowd" },
];

export function HealthProtocol() {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-serif text-gray-800">Health protocol</h2>
        </motion.div>

        <div className="flex justify-around flex-wrap gap-6">
          {protocols.map(({ Icon, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex flex-col items-center gap-3 w-16"
            >
              <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center">
                <Icon className="w-6 h-6 text-gray-600" />
              </div>
              <span className="text-[10px] text-gray-500 text-center leading-tight">{label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
