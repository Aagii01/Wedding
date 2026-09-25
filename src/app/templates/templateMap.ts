import { EventData } from "../../types/event";
import App from "../App";
import Template12 from "./Template12";
import Template13 from "./Template13";
import Template14 from "./Template14";
// Эрэгтэй хүүхдийн төрсөн өдрийн урилга — Template12-ийн бүтцэн дээр суурилсан
import Template19 from "./Template19";
// Хүүхдийн төрсөн өдөр — "Гоо бүсгүй ба мангас" сэдэвтэй, Template13-ийн
// бүтцэн дээр суурилсан тусдаа загвар
import Template21 from "./Template21";

// Жагсаалтад байхгүй template утгатай (жишээ нь өмнө устгасан 15-18, 20)
// хуучин event-үүд EventPage дээр App (Template11) руу fallback хийнэ.
export const templateMap: Record<string, React.ComponentType<{ event: EventData }>> = {
  "11": App,
  "12": Template12,
  "13": Template13,
  "14": Template14,
  "19": Template19,
  "21": Template21,
};
