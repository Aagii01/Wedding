import { EventData } from "../types/event";
import { WeddingHero } from "./components/WeddingHero";
import { GroomBride } from "./components/GroomBride";
import { VenueSection } from "./components/VenueSection";
import { GallerySection } from "./components/GallerySection";
import { PoemSection } from "./components/PoemSection";
import { CountdownTimer } from "./components/CountdownTimer";
import { HealthProtocol } from "./components/HealthProtocol";
import { RSVP } from "./components/RSVP";
import { WeddingFooter } from "./components/WeddingFooter";
import { Toaster } from "./components/ui/sonner";

type Props = { event: EventData };

export default function App({ event }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <WeddingHero event={event} />
      <GroomBride event={event} />
      {/* <WeddingDetails event={event} /> */}
      <VenueSection event={event} />
      <GallerySection event={event} />
      <PoemSection />
      <CountdownTimer date={event.date} time={event.time} title={event.title} venue={event.venue_name} venueAddress={event.venue_address} />
      <HealthProtocol />
      <RSVP eventId={event.id} />
      {/* <WeddingGifts /> */}
      <WeddingFooter event={event} />
      <Toaster />
    </div>
  );
}
