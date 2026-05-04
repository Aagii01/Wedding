import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

const lines = [
  "Хоёр сэтгэл нэгэн зүгт тэмүүлж,",
  "Хайрын гэгээн замд учирсан бид хоёр",
  "Хувь заяагаа холбон,",
  "Хуримын ариун ёслолоо тэмдэглэх гэж байна.",
  "",
  "Энэхүү аз жаргалт мөчийг",
  "Эрхэм таны хамт хуваалцахыг урьж байна.",
];

export function PoemSection() {
  let lineIndex = 0;

  return (
    <section className="py-16 px-4 bg-white text-center">
      <div
        className="mx-auto max-w-sm leading-loose"
        style={{ fontFamily: "'Great Vibes', cursive", fontSize: "1.6rem", color: "#b8952a" }}
      >
        {lines.map((line, i) => {
          if (line === "") return <div key={i} className="h-4" />;
          const delay = lineIndex++ * 0.15;
          return (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px 0px" }}
              transition={{ duration: 0.75, delay, ease: EASE }}
            >
              {line}
            </motion.p>
          );
        })}
      </div>
    </section>
  );
}
