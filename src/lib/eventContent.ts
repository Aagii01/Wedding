import { EventData } from "../types/event";

// Хурим бүрийн шүлэг / цагийн хуваарь Supabase-аас ирнэ. Дата байхгүй эсвэл
// гэмтэлтэй бол template тус бүрийн үндсэн (default) агуулга руу шилжинэ —
// ингэснээр хуучин event-үүд хоосон харагдахгүй.

export type ScheduleItem = {
  time: string;
  label: string;
  desc?: string;
};

/**
 * `poem` багана нь энгийн текст. Мөр бүрийг шинэ мөрөөр (Enter) тусгаарлана.
 * Хоосон мөр нь template дээр зай (spacer) болж харагдана.
 */
export function getPoemLines(event: EventData, fallback: string[]): string[] {
  const raw = event.poem;
  if (typeof raw !== "string") return fallback;

  const lines = raw.replace(/\r\n/g, "\n").split("\n").map((l) => l.trim());
  // Эхэн ба төгсгөлийн хоосон мөрийг хасна (дунд байгааг нь зай болгон үлдээнэ)
  while (lines.length && lines[0] === "") lines.shift();
  while (lines.length && lines[lines.length - 1] === "") lines.pop();

  return lines.some((l) => l !== "") ? lines : fallback;
}

/**
 * `schedule` багана нь jsonb array:
 *   [{ "time": "17:00", "label": "Зочид угтах", "desc": "..." }, ...]
 * Supabase jsonb-г задалж өгдөг ч, текст хэлбэрээр хадгалагдсан тохиолдолд
 * JSON.parse-аар дахин оролдоно. `desc` заавал биш.
 */
export function getSchedule(event: EventData, fallback: ScheduleItem[]): ScheduleItem[] {
  let raw: unknown = event.schedule;

  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch { return fallback; }
  }
  if (!Array.isArray(raw)) return fallback;

  const items = raw
    .filter((it): it is Record<string, unknown> => !!it && typeof it === "object")
    .map((it) => ({
      time: String(it.time ?? "").trim(),
      label: String(it.label ?? "").trim(),
      desc: it.desc != null ? String(it.desc).trim() : undefined,
    }))
    .filter((it) => it.time !== "" || it.label !== "");

  return items.length ? items : fallback;
}
