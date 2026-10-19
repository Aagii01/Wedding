import { EventData } from "../../types/event";
import { BabyCelebration } from "./Template29";

// Template 30 — Охин (blush) theme: ягаан, тоор, зөөлөн алт. Усны найрын урилга.
// Бүтэц, section, config түлхүүрүүд нь Template29-тэй яг ижил.
export default function Template30({ event }: { event: EventData }) {
  return <BabyCelebration event={event} theme="blush" />;
}
