// Урилга бүрийн өөрийн тохиргоо — `events.config` (jsonb) баганад байрлана.
//
// Зорилго: захиалагчийн хүсэлт бүрд код засахаа болих. Нэр, утас, нэмэлт
// бичвэр, аль хэсгийг нуух зэрэг нь КОД биш ӨГӨГДӨЛ учраас DB-д байх ёстой.
// Supabase дээр утгыг засмагц урилга шинэчлэгдэнэ — deploy шаардлагагүй.
//
// Шилжилт аюулгүй байх зарчим (getPoemLines / getSchedule-тэй ижил):
// config хоосон бол кодод үлдсэн хуучин утга (fallback) хэрэглэгдэнэ.
// Тиймээс нэг ч хуучин урилга эвдрэхгүй — нэг нэгээр нь шилжүүлж болно.
//
// Бүтэц:
//   {
//     "sections": { "schedule": false, "timer": false },
//     "rsvp":     { "note": "Хувцаслалтын хүсэлт...", "phones": ["99..."] },
//     "hero":     { "nameSize": "text-2xl" }
//   }

export type EventConfig = Record<string, unknown>;

/** jsonb ихэвчлэн объект болж ирнэ; текстээр хадгалагдсан бол задална. */
function asObject(config: unknown): EventConfig | null {
  let raw = config;
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch { return null; }
  }
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as EventConfig) : null;
}

/**
 * `cfg(event.config, "rsvp.note", CLOSING_NOTE[slug])`
 * Цэгээр тусгаарлагдсан замаар утга авна. Олдохгүй (эсвэл null) бол fallback.
 */
export function cfg<T>(config: unknown, path: string, fallback: T): T {
  const root = asObject(config);
  if (!root) return fallback;

  let cur: unknown = root;
  for (const key of path.split(".")) {
    if (!cur || typeof cur !== "object") return fallback;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur === undefined || cur === null ? fallback : (cur as T);
}

/**
 * Хэсгийг харуулах эсэх: `config.sections.<name>`.
 * `false` бичсэн үед л нуугдана — бусад тохиолдолд fallback шийднэ.
 */
export function sectionOn(config: unknown, name: string, fallback = true): boolean {
  return cfg<unknown>(config, `sections.${name}`, fallback) !== false;
}
