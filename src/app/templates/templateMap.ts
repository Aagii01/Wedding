import { EventData } from "../../types/event";
import App from "../App";
import Template12 from "./Template12";
import Template13 from "./Template13";
import Template14 from "./Template14";
import Template15 from "./Template15";
import Template16 from "./Template16";
import Template17 from "./Template17";
// Одонгийн найрын урилга — Template13-ийн хуулбар дээр суурилсан (production
// дээрх T13-ыг хөндөхгүйгээр тусад нь хөгжүүлж байна)
import Template18 from "./Template18";
// Эрэгтэй хүүхдийн төрсөн өдрийн урилга — Template12-ийн бүтцэн дээр суурилсан
import Template19 from "./Template19";

export const templateMap: Record<string, React.ComponentType<{ event: EventData }>> = {
  "11": App,
  "12": Template12,
  "13": Template13,
  "14": Template14,
  "15": Template15,
  "16": Template16,
  "17": Template17,
  "18": Template18,
  "19": Template19,
};
