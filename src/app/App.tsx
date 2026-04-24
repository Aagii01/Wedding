import { WeddingHero } from "./components/WeddingHero";
import { GroomBride } from "./components/GroomBride";
import { VenueSection } from "./components/VenueSection";
import { WeddingSchedule } from "./components/WeddingSchedule";
import { CountdownTimer } from "./components/CountdownTimer";
import { LiveStream } from "./components/LiveStream";
import { HealthProtocol } from "./components/HealthProtocol";
import { RSVP } from "./components/RSVP";
import { WeddingGifts } from "./components/WeddingGifts";
import { WeddingFooter } from "./components/WeddingFooter";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <WeddingHero />
      <GroomBride />
      <VenueSection />
      <WeddingSchedule />
      <CountdownTimer />
      <LiveStream />
      <HealthProtocol />
      <RSVP />
      <WeddingGifts />
      <WeddingFooter />
      <Toaster />
    </div>
  );
}
