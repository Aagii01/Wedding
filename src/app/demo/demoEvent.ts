import { EventData } from "../../types/event";

const P = (name: string) =>
  `https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/photos/${name}`;

// Showcase-д ашиглах demo урилгын дата. DB-ээс хамаардаггүй — landing page-ийн
// "Load demo" iframe template бүрийг энэ дататай шууд render хийнэ.
// Зураг/огноог жинхэнэ ажиллаж байгаа event (miigaa-urnaa)-аас авсан.
export const DEMO_EVENT: EventData = {
  id: "demo",
  slug: "demo",
  type: "wedding",
  title: "Болд & Сарнай",
  date: "2026-08-16",
  time: "17:00",
  venue_name: "The Continental Hotel",
  venue_address: "Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо",
  venue_map_url: "https://maps.google.com/?q=Ulaanbaatar",
  maps_photo:
    "https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/miigaa%20wedding/location%20photo.png",
  main_image: P("main.jpg"),
  person1_name: "Болд",
  person1_role: "Сүйт залуу",
  person1_photo: P("man%20profile.jpg"),
  person1_instagram: "bold_mn",
  person2_name: "Сарнай",
  person2_role: "Сүйт бүсгүй",
  person2_photo: P("girl%20profile.jpg"),
  person2_instagram: "sarnai_mn",
  gallery_photos: [
    P("gallery1.jpg"),
    P("gallery2.jpg"),
    P("gallery3.jpg"),
    P("gallery4.jpg"),
    P("gallery5.jpg"),
    P("gallery6.jpg"),
  ],
  gallery2_photos: [
    P("slide1.jpg"),
    P("slide2.jpg"),
    P("slide3.jpg"),
    P("slide4.jpg"),
    P("slide5.jpg"),
    P("slide6.jpg"),
    P("slide7.jpg"),
    P("slide8.jpg"),
  ],
  music_url:
    "https://bjixxbkzttcxgfkxcqvs.supabase.co/storage/v1/object/public/wedding%20song/Alex%20Warren%20-%20Ordinary.mp3",
};
