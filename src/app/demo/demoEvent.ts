import { EventData } from "../../types/event";

const U = (id: string, q: string) => `https://images.unsplash.com/photo-${id}?${q}`;

// Showcase-д ашиглах demo урилгын дата. DB-ээс хамаардаггүй — landing page-ийн
// "Load demo" iframe template бүрийг энэ дататай шууд render хийнэ.
export const DEMO_EVENT: EventData = {
  id: "demo",
  slug: "demo",
  type: "wedding",
  title: "Болд & Сарнай",
  date: "2026-07-15",
  time: "18:00",
  venue_name: "The Continental Hotel",
  venue_address: "Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо",
  venue_map_url: "https://maps.google.com/?q=Ulaanbaatar",
  maps_photo: U("1494774157365-9e04c6720e47", "w=1200&q=80"),
  main_image: U("1519741497674-611481863552", "w=1600&q=80"),
  person1_name: "Болд",
  person1_role: "Сүйт залуу",
  person1_photo: U("1507003211169-0a1dd7228f2d", "w=600&fit=crop&q=80"),
  person1_instagram: "bold_mn",
  person2_name: "Сарнай",
  person2_role: "Сүйт бүсгүй",
  person2_photo: U("1494790108377-be9c29b29330", "w=600&fit=crop&q=80"),
  person2_instagram: "sarnai_mn",
  gallery_photos: [
    U("1511285560929-80b456fea0bc", "w=800&q=80"),
    U("1583939003579-730e3918a45a", "w=800&q=80"),
    U("1606800052052-a08af7148866", "w=800&q=80"),
    U("1465495976277-4387d4b0b4c6", "w=800&q=80"),
  ],
  gallery2_photos: [
    U("1519741497674-611481863552", "w=900&q=80"),
    U("1511285560929-80b456fea0bc", "w=900&q=80"),
    U("1583939003579-730e3918a45a", "w=900&q=80"),
    U("1606800052052-a08af7148866", "w=900&q=80"),
    U("1465495976277-4387d4b0b4c6", "w=900&q=80"),
    U("1529636798458-92182e662485", "w=900&q=80"),
    U("1591604466107-ec97de577aff", "w=900&q=80"),
    U("1519225421980-715cb0215aed", "w=900&q=80"),
  ],
  music_url:
    "https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/wedding%20song/Alex%20Warren%20-%20Ordinary.mp3",
};
