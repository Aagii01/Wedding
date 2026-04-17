import { WeddingHero } from "./components/WeddingHero";
import { WeddingDetails } from "./components/WeddingDetails";
import { OurStory } from "./components/OurStory";
import { WeddingSchedule } from "./components/WeddingSchedule";
import { RSVP } from "./components/RSVP";
import { WeddingFooter } from "./components/WeddingFooter";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <WeddingHero />
      <WeddingDetails />
      <OurStory />
      <WeddingSchedule />
      <RSVP />
      <WeddingFooter />
      <Toaster />
    </div>
  );
}