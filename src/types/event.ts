import type { ScheduleItem } from "../lib/eventContent";

export type EventData = {
  id: string;
  slug: string;
  type: string;
  title: string;
  date: string;
  time: string;
  venue_name: string;
  venue_address: string;
  venue_map_url: string;
  maps_photo: string;
  main_image: string;
  person1_name: string;
  person1_role: string;
  person1_photo: string;
  person1_instagram: string;
  person2_name?: string;
  person2_role?: string;
  person2_photo?: string;
  person2_instagram?: string;
  gallery_photos: string[];
  gallery2_photos: string[];
  template?: string;
  music_url?: string;
  // Хурим бүрийн өөрийн агуулга. Хоосон бол template-ийн үндсэн текст гарна.
  poem?: string;                      // мөр бүрийг шинэ мөрөөр тусгаарлана
  schedule?: ScheduleItem[] | string; // jsonb: [{ time, label, desc? }, ...]
  // events хүснэгтэд одоогоор багана байхгүй — нэмбэл Template16-ийн footer-т
  // tel: холбоос болж харагдана
  person1_phone?: string;
  person2_phone?: string;
};
