import { motion } from "motion/react";
import { useState } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = { eventId: string; slug?: string };

// "Хэдэн хүн ирэх вэ?" тоолуурыг нуух slug-ууд. Нуусан үед guests нь 1-ээр
// хадгалагдана (ирэхгүй гэсэн бол урьдын адил 0).
const HIDE_GUEST_COUNT = new Set<string>(["lkhagvatseren-gantogtokh"]);

// Хаалтын мөрийг өөрчлөх slug-ууд.
const CLOSING_LINE: Record<string, string> = {
  "ganbaatar-maralgua": "WE CAN’T WAIT TO CELEBRATE WITH YOU!",
};

export function RSVP({ eventId, slug }: Props) {
  const showGuestCount = !(slug && HIDE_GUEST_COUNT.has(slug));
  const [rsvp, setRsvp] = useState({ name: "", phone: "", attending: "yes", guests: "1" });
  const [wish, setWish] = useState({ name: "", message: "" });
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);

  const handleRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpLoading(true);
    // Demo горимд бодит DB руу бичихгүй (event id нь uuid биш)
    if (eventId === "demo") {
      setRsvpLoading(false);
      toast.success("Баярлалаа! Таны ирц баталгаажлаа.");
      setRsvp({ name: "", phone: "", attending: "yes", guests: "1" });
      return;
    }
    const { error } = await supabase.from("rsvp").insert({
      event: eventId,
      name: rsvp.name,
      phone: rsvp.phone.trim(),
      // Ирэхгүй бол 0 — бүх загварт нийтлэг дүрэм (Sheets-д "очихгүй" болж очно)
      guests: rsvp.attending === "yes" ? Number(rsvp.guests) : 0,
    });
    setRsvpLoading(false);
    if (error) {
      toast.error("Алдаа гарлаа. Дахин оролдоно уу.");
    } else {
      toast.success("Баярлалаа! Таны ирц баталгаажлаа.");
      setRsvp({ name: "", phone: "", attending: "yes", guests: "1" });
    }
  };

  const handleWish = async (e: React.FormEvent) => {
    e.preventDefault();
    setWishLoading(true);
    // Demo горимд бодит DB руу бичихгүй (event id нь uuid биш)
    if (eventId === "demo") {
      setWishLoading(false);
      toast.success("Баярлалаа! Таны мэндчилгээ хүлээн авлаа.");
      setWish({ name: "", message: "" });
      return;
    }
    const { error } = await supabase.from("wishes").insert({
      event_id: eventId,
      name: wish.name,
      message: wish.message,
    });
    setWishLoading(false);
    if (error) {
      toast.error("Алдаа гарлаа. Дахин оролдоно уу.");
    } else {
      toast.success("Баярлалаа! Таны мэндчилгээ хүлээн авлаа.");
      setWish({ name: "", message: "" });
    }
  };

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
        {/* RSVP */}
        <motion.div
          initial={{ opacity: 0, x: -28, scale: 0.98 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, margin: "-40px 0px" }}
          transition={{ duration: 0.75, ease: EASE }}
        >
          <h2 className="text-3xl font-serif text-gray-800 mb-1">Ирцээ бүртгүүлэх</h2>
          <p className="text-sm text-gray-400 mb-1">Хуримын өдрөөс өмнө бүртгэлээ хийнэ үү</p>
          <p className="text-sm text-gray-600 mb-7">Овог нэр утасны дугаараа заавал бичээрэй</p>
          <form onSubmit={handleRsvp} className="space-y-4">
            <div>
              <Input
                placeholder="Таны овог нэр"
                value={rsvp.name}
                onChange={(e) => setRsvp({ ...rsvp, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Input
                type="tel"
                inputMode="tel"
                placeholder="Утасны дугаар"
                value={rsvp.phone}
                onChange={(e) => setRsvp({ ...rsvp, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Та ирэх үү?</p>
              <div className="space-y-2">
                {[
                  { value: "yes", label: "Тийм, заавал ирнэ" },
                  { value: "no",  label: "Харамсалтай нь очиж чадахгүй" },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="radio"
                      name="attending"
                      value={value}
                      checked={rsvp.attending === value}
                      onChange={() => setRsvp({ ...rsvp, attending: value })}
                      className=""
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            {/* Хүний тоо — зөвхөн ирнэ гэсэн үед асууна */}
            {showGuestCount && rsvp.attending === "yes" && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Хэдэн хүн ирэх вэ?</p>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    aria-label="Хасах"
                    onClick={() => setRsvp((p) => ({ ...p, guests: String(Math.max(1, Number(p.guests) - 1)) }))}
                    disabled={Number(rsvp.guests) <= 1}
                    className="w-10 h-10 rounded-full border border-gray-300 text-gray-600 text-xl leading-none flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    −
                  </button>
                  <span className="text-lg text-gray-800 tabular-nums min-w-16 text-center">
                    {rsvp.guests} хүн
                  </span>
                  <button
                    type="button"
                    aria-label="Нэмэх"
                    onClick={() => setRsvp((p) => ({ ...p, guests: String(Math.min(20, Number(p.guests) + 1)) }))}
                    disabled={Number(rsvp.guests) >= 20}
                    className="w-10 h-10 rounded-full border border-gray-300 text-gray-600 text-xl leading-none flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={rsvpLoading}
              className="w-full bg-gray-800 text-white text-sm font-medium py-3 rounded-full hover:bg-gray-700 transition-colors mt-2 disabled:opacity-60"
            >
              {rsvpLoading ? "Илгээж байна..." : "Илгээх"}
            </button>
          </form>
        </motion.div>

        {/* Wishes */}
        <motion.div
          initial={{ opacity: 0, x: 28, scale: 0.98 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, margin: "-40px 0px" }}
          transition={{ duration: 0.75, delay: 0.12, ease: EASE }}
        >
          <h2 className="text-3xl font-serif text-gray-800 mb-1">Мэндчилгээ</h2>
          <p className="text-sm text-gray-400 mb-7">Сэтгэлийн үгээ үлдээнэ үү</p>
          <form onSubmit={handleWish} className="space-y-4">
            <div>
              <Label htmlFor="w-name" className="text-xs text-gray-500">Нэр</Label>
              <Input
                id="w-name"
                placeholder="Нэрээ бичнэ үү"
                value={wish.name}
                onChange={(e) => setWish({ ...wish, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="w-message" className="text-xs text-gray-500">Мэндчилгээний үг</Label>
              <Textarea
                id="w-message"
                placeholder="Мэндчилгээ бичнэ үү..."
                value={wish.message}
                onChange={(e) => setWish({ ...wish, message: e.target.value })}
                required
                className="mt-1 min-h-28"
              />
            </div>
            <button
              type="submit"
              disabled={wishLoading}
              className="bg-gray-800 text-white text-sm font-medium px-8 py-3 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              {wishLoading ? "Илгээж байна..." : "Илгээх"}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Хаалтын мөр — хоёр баганын доор голлон */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px 0px" }}
        transition={{ duration: 0.8, ease: EASE }}
        className="max-w-4xl mx-auto mt-14 text-center text-2xl md:text-3xl text-gray-700 italic"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        {(slug && CLOSING_LINE[slug]) || "Тантай уулзахыг тэсэн ядан хүлээж байна!"}
      </motion.p>
    </section>
  );
}
