import { EventData } from "../../types/event";
import { AwardCeremony } from "./Template27";

// Template 28 — Хөх-алт (navy) theme: гүн хөх + алтан, төрийн ёслолын албан өнгө.
// Бүтэц, section, config түлхүүрүүд нь Template27-тай яг ижил.
export default function Template28({ event }: { event: EventData }) {
  return <AwardCeremony event={event} theme="navy" />;
}
