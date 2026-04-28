import { motion } from "motion/react";

export function PoemSection() {
  return (
    <section className="py-16 px-4 bg-white text-center">
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="leading-loose mx-auto max-w-sm"
        style={{ fontFamily: "'Great Vibes', cursive", fontSize: "1.6rem", color: "#b8952a" }}
      >
        Хоёр сэтгэл нэгэн зүгт тэмүүлж,
        <br />
        Хайрын гэгээн замд учирсан бид хоёр
        <br />
        Хувь заяагаа холбон,
        <br />
        Хуримын ариун ёслолоо тэмдэглэх гэж байна.
        <br />
        <br />
        Энэхүү аз жаргалт мөчийг
        <br />
        Эрхэм таны хамт хуваалцахыг урьж байна.
      </motion.p>
    </section>
  );
}
