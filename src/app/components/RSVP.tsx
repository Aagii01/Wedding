import { motion } from "motion/react";
import { useState } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = { eventId: string };

export function RSVP({ eventId }: Props) {
  const [rsvp, setRsvp] = useState({ name: "", attending: "yes" });
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
      setRsvp({ name: "", attending: "yes" });
      return;
    }
    const { error } = await supabase.from("rsvp").insert({
      event: eventId,
      name: rsvp.name,
      guests: rsvp.attending === "yes" ? 1 : 0,
    });
    setRsvpLoading(false);
    if (error) {
      toast.error("Алдаа гарлаа. Дахин оролдоно уу.");
    } else {
      toast.success("Баярлалаа! Таны ирц баталгаажлаа.");
      setRsvp({ name: "", attending: "yes" });
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
          <p className="text-sm text-gray-400 mb-7">Хурмын өдрөөс өмнө бүртгэлээ хийнэ үү</p>
          <form onSubmit={handleRsvp} className="space-y-4">
            <div>
              <Input
                placeholder="Таны нэр"
                value={rsvp.name}
                onChange={(e) => setRsvp({ ...rsvp, name: e.target.value })}
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
