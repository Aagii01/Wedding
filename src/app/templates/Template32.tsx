import { EventData } from "../../types/event";
import { HouseWarming } from "./Template31";

// Template 32 — Сэйж (sage) theme: зөөлөн ногоон, чулуун саарал, бор модны хаалга.
// Шинэ байрны найрын урилга. Бүтэц, section, config түлхүүрүүд нь Template31-тэй яг ижил.
export default function Template32({ event }: { event: EventData }) {
  return <HouseWarming event={event} theme="sage" />;
}
