import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

type FormData = {
  type: string;
  slug: string;
  date: string;
  time: string;
  venue_name: string;
  venue_address: string;
  venue_map_url: string;
  maps_photo: string;
  main_image: string;
  person1_name: string;
  person1_role: string;
  person1_instagram: string;
  person1_photo: string;
  person2_name: string;
  person2_role: string;
  person2_instagram: string;
  person2_photo: string;
  gallery_photo_1: string;
  gallery_photo_2: string;
  gallery_photo_3: string;
  gallery_photo_4: string;
  gallery2_photo_1: string;
  gallery2_photo_2: string;
  gallery2_photo_3: string;
  gallery2_photo_4: string;
  gallery2_photo_5: string;
  gallery2_photo_6: string;
  gallery2_photo_7: string;
  gallery2_photo_8: string;
};

const INITIAL: FormData = {
  type: "wedding",
  slug: "",
  date: "",
  time: "18:00",
  venue_name: "",
  venue_address: "",
  venue_map_url: "",
  maps_photo: "",
  main_image: "",
  person1_name: "",
  person1_role: "Groom",
  person1_instagram: "",
  person1_photo: "",
  person2_name: "",
  person2_role: "Bride",
  person2_instagram: "",
  person2_photo: "",
  gallery_photo_1: "",
  gallery_photo_2: "",
  gallery_photo_3: "",
  gallery_photo_4: "",
  gallery2_photo_1: "",
  gallery2_photo_2: "",
  gallery2_photo_3: "",
  gallery2_photo_4: "",
  gallery2_photo_5: "",
  gallery2_photo_6: "",
  gallery2_photo_7: "",
  gallery2_photo_8: "",
};

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs text-gray-500">{label}</Label>
      {hint && <p className="text-[11px] text-gray-400 mb-1">{hint}</p>}
      {children}
    </div>
  );
}

export function CreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slugManual, setSlugManual] = useState(false);

  const set = (key: keyof FormData, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (!slugManual && (key === "person1_name" || key === "person2_name")) {
        const p1 = key === "person1_name" ? value : prev.person1_name;
        const p2 = key === "person2_name" ? value : prev.person2_name;
        next.slug = toSlug(p2 ? `${p1}-${p2}` : p1);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.slug) {
      setError("URL slug хоосон байна.");
      return;
    }
    setLoading(true);

    const gallery_photos = [
      form.gallery_photo_1,
      form.gallery_photo_2,
      form.gallery_photo_3,
      form.gallery_photo_4,
    ].filter(Boolean);

    const gallery2_photos = [
      form.gallery2_photo_1,
      form.gallery2_photo_2,
      form.gallery2_photo_3,
      form.gallery2_photo_4,
      form.gallery2_photo_5,
      form.gallery2_photo_6,
      form.gallery2_photo_7,
      form.gallery2_photo_8,
    ].filter(Boolean);

    const payload = {
      type: form.type,
      slug: form.slug,
      date: form.date,
      time: form.time,
      venue_name: form.venue_name,
      venue_address: form.venue_address,
      venue_map_url: form.venue_map_url,
      maps_photo: form.maps_photo,
      main_image: form.main_image,
      person1_name: form.person1_name,
      person1_role: form.person1_role,
      person1_instagram: form.person1_instagram,
      person1_photo: form.person1_photo,
      person2_name: form.person2_name || null,
      person2_role: form.person2_role || null,
      person2_instagram: form.person2_instagram || null,
      person2_photo: form.person2_photo || null,
      gallery_photos,
      gallery2_photos,
    };

    const { error: err } = await supabase.from("events").insert(payload);
    setLoading(false);
    if (err) {
      setError(err.message.includes("unique") ? "Энэ slug аль хэдийн байна. Өөр нэр оруулна уу." : err.message);
    } else {
      navigate(`/i/${form.slug}`);
    }
  };

  const inputClass = "mt-1";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <h1
            className="text-4xl text-gray-800 mb-2"
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            Шинэ урилга үүсгэх
          </h1>
          <p className="text-sm text-gray-400">Мэдээллийг бөглөөд Submit дарна уу</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm p-8 space-y-6">
          {/* Type */}
          <Field label="Арга хэмжээний төрөл">
            <div className="flex gap-3 mt-1">
              {["wedding", "birthday"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("type", t)}
                  className={`flex-1 py-2 rounded-full text-sm border transition-colors ${
                    form.type === t
                      ? "bg-gray-800 text-white border-gray-800"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {t === "wedding" ? "Хурим" : "Төрсөн өдөр"}
                </button>
              ))}
            </div>
          </Field>

          <hr className="border-gray-100" />

          {/* Person 1 */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              {form.type === "wedding" ? "Хүргэн / Гэргий 1" : "Нэрэмжит хүн"}
            </p>
            <Field label="Нэр *">
              <Input className={inputClass} value={form.person1_name} onChange={(e) => set("person1_name", e.target.value)} required placeholder="Болд" />
            </Field>
            <Field label="Гарчиг">
              <Input className={inputClass} value={form.person1_role} onChange={(e) => set("person1_role", e.target.value)} placeholder="Groom" />
            </Field>
            <Field label="Instagram">
              <Input className={inputClass} value={form.person1_instagram} onChange={(e) => set("person1_instagram", e.target.value)} placeholder="@bold.mn" />
            </Field>
            <Field label="Зургийн URL (person1_photo)" hint="GroomBride хэсэгт харагдана">
              <Input className={inputClass} value={form.person1_photo} onChange={(e) => set("person1_photo", e.target.value)} placeholder="https://..." />
            </Field>
          </div>

          {/* Person 2 — wedding only */}
          {form.type === "wedding" && (
            <>
              <hr className="border-gray-100" />
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Гэргий 2</p>
                <Field label="Нэр">
                  <Input className={inputClass} value={form.person2_name} onChange={(e) => set("person2_name", e.target.value)} placeholder="Сарнай" />
                </Field>
                <Field label="Гарчиг">
                  <Input className={inputClass} value={form.person2_role} onChange={(e) => set("person2_role", e.target.value)} placeholder="Bride" />
                </Field>
                <Field label="Instagram">
                  <Input className={inputClass} value={form.person2_instagram} onChange={(e) => set("person2_instagram", e.target.value)} placeholder="@sarnai.mn" />
                </Field>
                <Field label="Зургийн URL (person2_photo)" hint="GroomBride хэсэгт харагдана">
                  <Input className={inputClass} value={form.person2_photo} onChange={(e) => set("person2_photo", e.target.value)} placeholder="https://..." />
                </Field>
              </div>
            </>
          )}

          <hr className="border-gray-100" />

          {/* Date & Time */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Огноо & Цаг</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Огноо *">
                <Input className={inputClass} type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
              </Field>
              <Field label="Цаг *">
                <Input className={inputClass} type="time" value={form.time} onChange={(e) => set("time", e.target.value)} required />
              </Field>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Venue */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Газар</p>
            <Field label="Газрын нэр *">
              <Input className={inputClass} value={form.venue_name} onChange={(e) => set("venue_name", e.target.value)} required placeholder="Shangri-La Hotel" />
            </Field>
            <Field label="Хаяг">
              <Input className={inputClass} value={form.venue_address} onChange={(e) => set("venue_address", e.target.value)} placeholder="Улаанбаатар хот, Монгол" />
            </Field>
            <Field label="Google Maps холбоос">
              <Input className={inputClass} value={form.venue_map_url} onChange={(e) => set("venue_map_url", e.target.value)} placeholder="https://maps.google.com/..." />
            </Field>
            <Field label="Газрын зургийн URL (maps_photo)" hint="VenueSection-д харагдана">
              <Input className={inputClass} value={form.maps_photo} onChange={(e) => set("maps_photo", e.target.value)} placeholder="https://..." />
            </Field>
          </div>

          <hr className="border-gray-100" />

          {/* Main image */}
          <Field label="Нүүр зургийн URL (main_image)" hint="Hero карт болон footer-т харагдана">
            <Input className={inputClass} value={form.main_image} onChange={(e) => set("main_image", e.target.value)} placeholder="https://..." />
          </Field>

          <hr className="border-gray-100" />

          {/* Gallery */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Галерей зургууд</p>
            <p className="text-[11px] text-gray-400 -mt-2">Галерей хэсэгт тусдаа харагдана (hero, person зургуудтай давхцахгүй)</p>
            {([1, 2, 3, 4] as const).map((n) => (
              <Field
                key={n}
                label={`Зураг ${n}${n === 1 ? " (том, featured)" : n === 4 ? " (доод, өргөн)" : ""}`}
              >
                <Input
                  className={inputClass}
                  value={form[`gallery_photo_${n}` as keyof FormData]}
                  onChange={(e) => set(`gallery_photo_${n}` as keyof FormData, e.target.value)}
                  placeholder="https://..."
                />
              </Field>
            ))}
          </div>

          <hr className="border-gray-100" />

          {/* Gallery2 — carousel photos */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Carousel зургууд (8)</p>
            <p className="text-[11px] text-gray-400 -mt-2">"Бидний хайрын түүх" carousel-д харагдана</p>
            {([1,2,3,4,5,6,7,8] as const).map((n) => (
              <Field key={n} label={`Зураг ${n}`}>
                <Input
                  className={inputClass}
                  value={form[`gallery2_photo_${n}` as keyof FormData]}
                  onChange={(e) => set(`gallery2_photo_${n}` as keyof FormData, e.target.value)}
                  placeholder="https://..."
                />
              </Field>
            ))}
          </div>

          <hr className="border-gray-100" />

          {/* Slug */}
          <Field label="URL slug *" hint={`Хуудасны хаяг: /i/${form.slug || "..."}`}>
            <Input
              className={inputClass}
              value={form.slug}
              onChange={(e) => {
                setSlugManual(true);
                set("slug", toSlug(e.target.value));
              }}
              required
              placeholder="bold-sarnai"
            />
          </Field>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-800 text-white text-sm font-medium py-3.5 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Үүсгэж байна..." : "Урилга үүсгэх →"}
          </button>
        </form>
      </div>
    </div>
  );
}
