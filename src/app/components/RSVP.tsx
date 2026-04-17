import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Card, CardContent } from "./ui/card";
import { toast } from "sonner";

export function RSVP() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    attendance: "yes",
    guests: "1",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show success message
    toast.success("Баярлалаа!", {
      description: "Таны хариу амжилттай илгээгдлээ. Удахгүй холбогдох болно."
    });

    // Reset form
    setFormData({
      name: "",
      email: "",
      attendance: "yes",
      guests: "1",
      message: ""
    });
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-pink-50">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-serif mb-4">Оролцоо баталгаажуулах</h2>
          <p className="text-lg text-gray-600">Та ирэх эсэхээ бидэнд мэдэгдэнэ үү</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <Label htmlFor="name">Нэр *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Таны нэр"
                    required
                    className="mt-2"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">И-мэйл *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    required
                    className="mt-2"
                  />
                </div>

                {/* Attendance */}
                <div>
                  <Label className="mb-3 block">Та ирэх үү? *</Label>
                  <RadioGroup
                    value={formData.attendance}
                    onValueChange={(value) => setFormData({ ...formData, attendance: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="yes" />
                      <Label htmlFor="yes" className="cursor-pointer">Тийм, би ирнэ</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="no" />
                      <Label htmlFor="no" className="cursor-pointer">Үгүй, ирэх боломжгүй байна</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Number of guests */}
                {formData.attendance === "yes" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Label htmlFor="guests">Хэдэн хүн ирэх вэ? *</Label>
                    <Input
                      id="guests"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.guests}
                      onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                      className="mt-2"
                    />
                  </motion.div>
                )}

                {/* Message */}
                <div>
                  <Label htmlFor="message">Хүсэлт, санал (заавал биш)</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Хоолны онцгой хэрэгцээ эсвэл бусад хүсэлтээ бичнэ үү..."
                    className="mt-2 min-h-24"
                  />
                </div>

                {/* Submit button */}
                <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                  Хариу илгээх
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-gray-500 mt-6"
        >
          Хариугаа 2026 оны 06 сарын 30-ны өмнө илгээнэ үү
        </motion.p>
      </div>
    </section>
  );
}
