import { motion } from "motion/react";
import { useState } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

type Props = { eventId: string };

export function RSVP({ eventId }: Props) {
  const [rsvp, setRsvp] = useState({ name: "", email: "", event: "reception", guests: "1" });
  const [wish, setWish] = useState({ nickname: "", name: "", message: "" });
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);

  const handleRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpLoading(true);
    const { error } = await supabase.from("rsvp").insert({
      event_id: eventId,
      name: rsvp.name,
      email: rsvp.email,
      event: rsvp.event,
      guests: Number(rsvp.guests),
    });
    setRsvpLoading(false);
    if (error) {
      toast.error("Алдаа гарлаа. Дахин оролдоно уу.");
    } else {
      toast.success("Баярлалаа! Таны оролцоо баталгаажлаа.");
      setRsvp({ name: "", email: "", event: "reception", guests: "1" });
    }
  };

  const handleWish = async (e: React.FormEvent) => {
    e.preventDefault();
    setWishLoading(true);
    const { error } = await supabase.from("wishes").insert({
      event_id: eventId,
      nickname: wish.nickname,
      name: wish.name,
      message: wish.message,
    });
    setWishLoading(false);
    if (error) {
      toast.error("Алдаа гарлаа. Дахин оролдоно уу.");
    } else {
      toast.success("Баярлалаа! Таны мэндчилгээ хүлээн авлаа.");
      setWish({ nickname: "", name: "", message: "" });
    }
  };

  const selectClass =
    "mt-1 w-full border border-input rounded-md px-3 py-2 text-sm text-gray-700 bg-background focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
        {/* RSVP */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-serif text-gray-800 mb-1">Оролцоо баталгаажуулах</h2>
          <p className="text-sm text-gray-400 mb-7">Ирэх эсэхээ баталгаажуулна уу</p>
          <form onSubmit={handleRsvp} className="space-y-4">
            <div>
              <Label htmlFor="r-name" className="text-xs text-gray-500">Таны нэр</Label>
              <Input
                id="r-name"
                placeholder="Нэрээ бичнэ үү"
                value={rsvp.name}
                onChange={(e) => setRsvp({ ...rsvp, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="r-email" className="text-xs text-gray-500">Имэйл хаяг</Label>
              <Input
                id="r-email"
                type="email"
                placeholder="email@example.com"
                value={rsvp.email}
                onChange={(e) => setRsvp({ ...rsvp, email: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="r-event" className="text-xs text-gray-500">Арга хэмжээ</Label>
              <select
                id="r-event"
                value={rsvp.event}
                onChange={(e) => setRsvp({ ...rsvp, event: e.target.value })}
                className={selectClass}
              >
                <option value="ceremony">Гэрлэлтийн ёслол</option>
                <option value="reception">Хурим</option>
                <option value="both">Хоёул</option>
              </select>
            </div>
            <div>
              <Label htmlFor="r-guests" className="text-xs text-gray-500">Зочдын тоо</Label>
              <select
                id="r-guests"
                value={rsvp.guests}
                onChange={(e) => setRsvp({ ...rsvp, guests: e.target.value })}
                className={selectClass}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={String(n)}>{n} хүн</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={rsvpLoading}
              className="w-full bg-gray-800 text-white text-sm font-medium py-3 rounded-full hover:bg-gray-700 transition-colors mt-2 disabled:opacity-60"
            >
              {rsvpLoading ? "Илгээж байна..." : "Оролцоно"}
            </button>
          </form>
        </motion.div>

        {/* Wishes */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-serif text-gray-800 mb-1">Мэндчилгээ</h2>
          <p className="text-sm text-gray-400 mb-7">Баяр хүргэх үгээ үлдээнэ үү</p>
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
    </section>
  );
}
