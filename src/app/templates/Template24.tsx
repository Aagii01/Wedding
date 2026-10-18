import { EventData } from "../../types/event";
import { HeroBirthday } from "./Template23";

// Template 24 — Spider-Man theme (улаан #DF1F2D + хөх #2B3784, аалзны тор).
// Бүтэц, section, config түлхүүрүүд нь Template23-тай яг ижил.
export default function Template24({ event }: { event: EventData }) {
  return <HeroBirthday event={event} theme="spider" />;
}
