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
// Эрэгтэй хүүхдийн сэвлэг үргээх ёслол — супер баатрын өнгө (улаан, хөх, шар),
// Template21-ийн бүтцэн дээр суурилсан, бүх тохиргоо events.config-оос
import Template22 from "./Template22";
// Эрэгтэй хүүхдийн төрсөн өдөр — нэг бүтэц, хоёр theme (Template23.tsx):
// 23 = Sonic (хөх, алтан цагираг), 24 = Spider-Man (улаан, хөх, аалзны тор).
// Дарж нээх intro, бүх тохиргоо events.config-оос
import Template23 from "./Template23";
import Template24 from "./Template24";
// Эмэгтэй хүүхдийн төрсөн өдөр — нэг бүтэц, хоёр theme (Template25.tsx):
// 25 = Мөсөн гүнж (мөсөн цэнхэр, цасан ширхэг), 26 = Нарны гүнж (лаванда, алтан дэнлүү).
// Playfair Display фонт, дарж нээх intro, бүх тохиргоо events.config-оос
import Template25 from "./Template25";
import Template26 from "./Template26";
// Шагналын баярын (хүндэтгэлийн) урилга, 40+ үзэгч — нэг бүтэц, хоёр theme (Template27.tsx):
// 27 = Бордо-алт, 28 = Хөх-алт. Цайвар ivory, PT Serif том бичиг, "Том үсэг" товч,
// дарж нээх intro байхгүй, бүх тохиргоо events.config-оос
import Template27 from "./Template27";
import Template28 from "./Template28";

// Жагсаалтад байхгүй template утгатай (жишээ нь өмнө устгасан 15-18, 20)
// хуучин event-үүд EventPage дээр App (Template11) руу fallback хийнэ.
export const templateMap: Record<string, React.ComponentType<{ event: EventData }>> = {
  "11": App,
  "12": Template12,
  "13": Template13,
  "14": Template14,
  "19": Template19,
  "21": Template21,
  "22": Template22,
  "23": Template23,
  "24": Template24,
  "25": Template25,
  "26": Template26,
  "27": Template27,
  "28": Template28,
};
