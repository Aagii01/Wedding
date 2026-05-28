import { EventData } from "../../types/event";
import App from "../App";
import Template12 from "./Template12";
import Template13 from "./Template13";
import Template14 from "./Template14";
import Template15 from "./Template15";

export const templateMap: Record<string, React.ComponentType<{ event: EventData }>> = {
  "11": App,
  "12": Template12,
  "13": Template13,
  "14": Template14,
  "15": Template15,
};
