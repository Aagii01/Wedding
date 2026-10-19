import { EventData } from "../../types/event";
import { PrincessBirthday } from "./Template25";

// Template 26 — Нарны гүнж (sun) theme: ягаан-лаванда үдэш, алтан дэнлүү, нарны тэмдэг.
// Бүтэц, section, config түлхүүрүүд нь Template25-тай яг ижил.
export default function Template26({ event }: { event: EventData }) {
  return <PrincessBirthday event={event} theme="sun" />;
}
