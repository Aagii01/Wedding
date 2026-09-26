# `events.config` — урилга бүрийн тохиргоо

Захиалагчийн хүсэлт бүрд код засахаа болих зорилготой. Нэр, утас, нэмэлт
бичвэр, аль хэсгийг нуух зэрэг нь **код биш өгөгдөл** тул DB-д байрлана.
Supabase дээр утгыг засмагц урилга шинэчлэгдэнэ — **deploy шаардлагагүй**.

Helper: [`src/lib/eventConfig.ts`](../src/lib/eventConfig.ts)
Зарчим нь [`eventContent.ts`](../src/lib/eventContent.ts)-тэй ижил —
**config хоосон бол кодод үлдсэн хуучин map (fallback) хэрэглэгдэнэ**,
тиймээс нэг ч хуучин урилга эвдрэхгүй, нэг нэгээр нь шилжүүлж болно.

```ts
cfg(config, "rsvp.note", CLOSING_NOTE[slug])          // утга авах
sectionOn(config, "schedule", !HIDE_SCHEDULE.has(slug)) // хэсэг харуулах эсэх
```

---

## Багана нэмэх (нэг удаа — АЛЬ ХЭДИЙН ХИЙГДСЭН 2026-09-25)

```sql
alter table events add column if not exists config jsonb not null default '{}'::jsonb;
```

---

## ✅ Одоо ажиллаж байгаа (Template11)

| Түлхүүр | Юу хийх | Fallback (код) |
|---|---|---|
| `sections.schedule` | Хөтөлбөр (HealthProtocol) нуух/гаргах | `HIDE_SCHEDULE` — App.tsx |
| `sections.timer` | Тоологч ба "Эхлэх цаг" нуух/гаргах | `HIDE_TIMER` — CountdownTimer.tsx |
| `rsvp.note` | Хаалтын доорх нэмэлт бичвэр (хувцаслалт г.м.) | `CLOSING_NOTE` — RSVP.tsx |

```sql
update events set config = '{
  "sections": { "schedule": false, "timer": false },
  "rsvp": { "note": "🤍 Хувцаслалтын хүсэлт..." }
}'::jsonb
where slug = 'SLUG-ЭНД';
```

---

## ⬜ TODO — Template11-ийн үлдсэн 20 түлхүүр

Бүгд ижил хэв маягаар холбогдоно, шинэ логик бичихгүй. Код дахь хуучин map
байрандаа үлдэнэ (fallback) тул 32 ширхэг T11 урилгын нэг нь ч хөндөгдөхгүй.

| Хэсэг | Түлхүүр | Юу хийх | Одоогийн код | Файл |
|---|---|---|---|---|
| **Нүүр** | `hero.names` | Нэрийг солих (`["ЗАЯА","ДЭЭГИЙ"]`) | `HERO_NAMES` | WeddingHero.tsx:11 |
| | `hero.font` | Нэрийн фонт, хэмжээ | `HERO_NAME_FONT` | WeddingHero.tsx:28 |
| | `hero.quotes` | Ишлэлийг англиар (`"en"`) | `ENGLISH_QUOTES` | WeddingHero.tsx:56 |
| | `hero.captions` | Зургийн тайлбар | `PHOTO_CAPTIONS` | WeddingHero.tsx:71 |
| **Түүх** | `story.title` | "Бидний хайрын түүх" гарчиг солих | `STORY_TITLE` | WeddingHero.tsx:59 |
| | `story.children` | Нэрийн доор үр хүүхдийн нэр | `STORY_CHILDREN` | WeddingHero.tsx:64 |
| | `story.namesSize` | Нэрийн хэмжээ | `STORY_NAMES_SIZE` | WeddingHero.tsx:19 |
| | `sections.storyNames` | "нэр ♥ нэр" мөрийг нуух | `HIDE_STORY_NAMES` | WeddingHero.tsx:16 |
| **Хос** | `couple.children` | Хосын доор хүүхдийн нэр | `CHILDREN` | GroomBride.tsx:39 |
| **Цомог** | `gallery.title` | Цомгийн гарчиг | `TITLE_OVERRIDE` | GallerySection.tsx:62 |
| **Хөтөлбөр** | `schedule.title` | Хөтөлбөрийн гарчиг | `TITLE_OVERRIDE` | HealthProtocol.tsx:21 |
| **Ирц** | `rsvp.closing` | Хаалтын мөр | `CLOSING_LINE` | RSVP.tsx:28 |
| | `rsvp.phones` | Холбоо барих утас | `CLOSING_PHONES` | RSVP.tsx:35 |
| | `rsvp.phonesLabel` | Утасны гарчиг ("Утас:") | `CLOSING_PHONES_LABEL` | RSVP.tsx:61 |
| | `rsvp.honored` | "Хүндэтгэсэн:" мөрүүд | `CLOSING_HONORED` | RSVP.tsx:53 |
| | `rsvp.declineLabel` | "Ирэхгүй" сонголтын бичвэр | `DECLINE_LABEL` | RSVP.tsx:22 |
| | `sections.guestCount` | Зочны тоолуур нуух | `HIDE_GUEST_COUNT` | RSVP.tsx:16 |
| **Footer** | `footer.children` | Хүүхдийн нэр | `FOOTER_CHILDREN` | WeddingFooter.tsx:14 |
| | `footer.image` | Footer зураг | `FOOTER_IMAGE` | WeddingFooter.tsx:8 |
| | `footer.font` | Нэрийн фонт | `FOOTER_NAME_FONT` | WeddingFooter.tsx:21 |

### Хэрэгжүүлэх хэв маяг

```ts
// 1. import нэмэх
import { cfg, sectionOn } from "../../lib/eventConfig";

// 2. component-д config prop дамжуулах (App.tsx-аас)
type Props = { ...; config?: unknown };

// 3. хуучин мөрийг helper-ээр ороох — map-ыг УСТГАХГҮЙ, fallback болгоно
const title = cfg(config, "gallery.title", slug ? TITLE_OVERRIDE[slug] : undefined);
const show  = sectionOn(config, "guestCount", !(slug && HIDE_GUEST_COUNT.has(slug)));
```

⚠️ `config` prop-ыг **destructure хийхээ мартаж болохгүй** — vite нь TypeScript
шалгадаггүй тул build дуугарахгүй, зөвхөн browser дээр цагаан дэлгэц болж унана.

### Бүх түлхүүрийг агуулсан SQL (20-ыг холбосны дараа хүчинтэй)

```sql
update events set config = '{
  "sections": {
    "schedule":   true,
    "timer":      true,
    "storyNames": true,
    "guestCount": true
  },
  "hero": {
    "names":    ["ЗАЯА", "ДЭЭГИЙ"],
    "font":     { "family": "Caveat, cursive", "size": "text-6xl" },
    "quotes":   "en",
    "captions": { "0": "Анхны уулзалт", "1": "Сүй тавилт" }
  },
  "story": {
    "title":     "Бидний түүх",
    "children":  ["Охин: О.Ундармал", "Хүү: О.Нэгүүн"],
    "namesSize": { "name": "text-2xl sm:text-3xl", "heart": "w-5 h-5" }
  },
  "couple":   { "children": ["Охин: О.Ундармал"] },
  "gallery":  { "title": "Дурсамжийн цомог" },
  "schedule": { "title": "Хуримын хөтөлбөр" },
  "rsvp": {
    "closing":      "Тантай уулзахыг тэсэн ядан хүлээж байна!",
    "note":         "🤍 Хувцаслалтын хүсэлт...",
    "honored":      ["Хүндэтгэсэн: М.Баярбямба & Ц.Анужин"],
    "phones":       ["99112233", "88112233"],
    "phonesLabel":  "Утас:",
    "declineLabel": "Очиж амжихгүй нь"
  },
  "footer": {
    "children": ["Хүү: Д.Саруул-Эрдэнэ"],
    "image":    "https://.../footer.jpg",
    "font":     { "family": "Caveat, cursive", "size": "text-5xl" }
  }
}'::jsonb
where slug = 'SLUG-ЭНД';
```

### Хэсэгчлэн засах (бусад түлхүүрийг хөндөхгүй)

```sql
-- ⚠️ `||` нь зөвхөн ДЭЭД түвшинд нийлүүлдэг. Доорх нь rsvp доторх бусад
-- талбарыг (phones, honored г.м.) БҮГДИЙГ дарж устгана:
update events set config = config || '{"rsvp": {"note": "шинэ текст"}}'::jsonb
where slug = 'SLUG-ЭНД';

-- ⚠️ jsonb_set нь эцэг объект (rsvp) байхгүй бол ЮУ Ч ХИЙХГҮЙ, алдаа ч өгөхгүй.
-- Тиймээс эцгийг нь эхлээд баталгаажуулна. Ганц талбар аюулгүй засах жор:
update events set config = jsonb_set(
    case when config ? 'rsvp' then config else config || '{"rsvp":{}}'::jsonb end,
    '{rsvp,note}', '"шинэ текст"', true)
where slug = 'SLUG-ЭНД';

-- нэг талбар устгах (кодын fallback руу буцаана)
update events set config = config #- '{rsvp,note}' where slug = 'SLUG-ЭНД';
```

---

## ⬜ TODO — бусад загвар

Template 12 / 13 / 14 / 19 / 21 нь өөрсдийн дотоод section-той, огт
холбогдоогүй. Тэдэнд нийт ~67 override map үлдсэн (хамгийн ихдээ T12: 19,
T13: 19, T14: 13). Идэвхтэй урилгын ихэнх нь T12/T14 дээр байдаг тул
T11 дууссаны дараа T12 хийх нь зүйтэй.

## ⬜ TODO — админ форм

`/admin/:slug` — дээрх JSON-г гараар биш **формоор** засах хуудас, хажууд нь
live preview (LandingPage-ийн DemoModal-ын iframe код дахин ашиглана).
Дээр нь: зураг upload (Supabase Storage), section on/off чеклист,
`/create` ба `/admin`-д authentication (одоо нээлттэй).
