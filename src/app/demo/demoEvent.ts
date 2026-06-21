import { EventData } from "../../types/event";

const P = (name: string) =>
  `https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/photos/${name}`;

const G1 = P("gallery1.jpg");
const G2 = P("gallery2.jpg");
const G3 = P("gallery3.jpg");
const G4 = P("gallery4.jpg");

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
  maps_photo: P("shangrila.jpg"),
  main_image: P("main.jpg"),
  person1_name: "Болд",
  person1_role: "Сүйт залуу",
  person1_photo: P("KOREAN%20WEDDING%20D-001%20OBRAMAESTRA%20STUDIO%20_%20korea%20wedding%20pledge.jpg"),
  person1_instagram: "bold_mn",
  person2_name: "Сарнай",
  person2_role: "Сүйт бүсгүй",
  person2_photo: P("profile_girl.jpg"),
  person2_instagram: "sarnai_mn",
  gallery_photos: [G1, G2, G3, G4, P("main.jpg")],
  gallery2_photos: [G1, G2, G3, G4, G1, G2, G3, G4],
  music_url:
    "https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/wedding%20song/Alex%20Warren%20-%20Ordinary.mp3",
};
