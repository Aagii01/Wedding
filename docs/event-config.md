# `events.config` — урилга бүрийн тохиргоо

Захиалагчийн хүсэлт бүрд код засахаа болих зорилготой. Нэр, утас, нэмэлт
бичвэр, аль хэсгийг нуух зэрэг нь **код биш өгөгдөл** тул DB-д байрлана.
Supabase дээр утгыг засмагц урилга шинэчлэгдэнэ — **deploy шаардлагагүй**.

Helper: [`src/lib/eventConfig.ts`](../src/lib/eventConfig.ts)
Зарчим нь [`eventContent.ts`](../src/lib/eventContent.ts)-тэй ижил —
**config хоосон бол кодод үлдсэн хуучин map (fallback) хэрэглэгдэнэ**,
тиймээс нэг ч хуучин урилга эвдрэхгүй, нэг нэгээр нь шилжүүлж болно.

```ts
cfg(config, "rsvp.note", CLOSING_NOTE[slug])            // утга авах
sectionOn(config, "schedule", !HIDE_SCHEDULE.has(slug)) // хэсэг харуулах эсэх
```

Багана нэмэх (нэг удаа — **аль хэдийн хийгдсэн** 2026-09-25):

```sql
alter table events add column if not exists config jsonb not null default '{}'::jsonb;
```

---

## ✅ Template11 — 23 түлхүүр бүрэн ажиллана

| Хэсэг | Түлхүүр | Юу хийх | Fallback (код) | Файл |
|---|---|---|---|---|
| **Нүүр** | `hero.names` | Hero дээрх нэрийг солих (`["ЗАЯА","ДЭЭГИЙ"]`) | `HERO_NAMES` | WeddingHero.tsx |
| | `hero.font` | Нэрийн фонт, хэмжээ `{family,size}` | `HERO_NAME_FONT` | WeddingHero.tsx |
| | `hero.quotes` | `"en"` бичвэл ишлэл англиар | `ENGLISH_QUOTES` | WeddingHero.tsx |
| | `hero.captions` | Carousel зургийн тайлбар (түлхүүр = зургийн URL) | `PHOTO_CAPTIONS` | WeddingHero.tsx |
| **Түүх** | `story.title` | "Бидний хайрын түүх" гарчиг солих | `STORY_TITLE` | WeddingHero.tsx |
| | `story.children` | "нэр ♥ нэр" мөрийн доор үр хүүхдийн нэр | `STORY_CHILDREN` | WeddingHero.tsx |
| | `story.namesSize` | Тэр мөрийн хэмжээ `{name,heart}` | `STORY_NAMES_SIZE` | WeddingHero.tsx |
| | `sections.storyNames` | "нэр ♥ нэр" мөрийг нуух (`false`) | `HIDE_STORY_NAMES` | WeddingHero.tsx |
| **Хос** | `couple.children` | Хосын танилцуулгын доор хүүхдийн нэр | `CHILDREN` | GroomBride.tsx |
| **Цомог** | `gallery.title` | Цомгийн гарчиг | `TITLE_OVERRIDE` | GallerySection.tsx |
| **Хөтөлбөр** | `schedule.title` | Хөтөлбөрийн гарчиг | `TITLE_OVERRIDE` | HealthProtocol.tsx |
| | `sections.schedule` | Хөтөлбөрийг бүхэлд нь нуух (`false`) | `HIDE_SCHEDULE` | App.tsx |
| **Тоологч** | `sections.timer` | Тоологч ба "Эхлэх цаг" нуух (`false`) | `HIDE_TIMER` | CountdownTimer.tsx |
| **Ирц** | `rsvp.closing` | Хаалтын мөр | `CLOSING_LINE` | RSVP.tsx |
| | `rsvp.note` | Хаалтын доорх нэмэлт бичвэр (хувцаслалт г.м.) | `CLOSING_NOTE` | RSVP.tsx |
| | `rsvp.honored` | "Хүндэтгэсэн:" мөрүүд | `CLOSING_HONORED` | RSVP.tsx |
| | `rsvp.phones` | Холбоо барих утас | `CLOSING_PHONES` | RSVP.tsx |
| | `rsvp.phonesLabel` | Утасны мөрийн гарчиг | `CLOSING_PHONES_LABEL` | RSVP.tsx |
| | `rsvp.declineLabel` | "Ирэхгүй" сонголтын бичвэр | `DECLINE_LABEL` | RSVP.tsx |
| | `sections.guestCount` | Зочны тоолуур нуух (`false`) | `HIDE_GUEST_COUNT` | RSVP.tsx |
| **Footer** | `footer.children` | Хосын нэрийн доор хүүхдийн нэр | `FOOTER_CHILDREN` | WeddingFooter.tsx |
| | `footer.phones` | Footer дэх холбоо барих утас (массив) | — | WeddingFooter.tsx |
| | `footer.phoneLabel` | Утасны мөрийн гарчиг (анхдагч "Холбогдох утас:") | — | WeddingFooter.tsx |
| | `footer.image` | Footer зураг (`main_image`-ийн оронд) | `FOOTER_IMAGE` | WeddingFooter.tsx |
| | `footer.font` | Footer нэрийн фонт `{family,size}` | `FOOTER_NAME_FONT` | WeddingFooter.tsx |

⚠️ `hero.font` / `footer.font`-д зөвхөн монгол кирилл **ө (U+04E9), ү (U+04AF)**-г
агуулсан фонт тохирно. `Caveat`, `Bad Script` дэмждэг; `Dancing Script`,
`Great Vibes` дэмждэггүй. Фонт нь `index.html`-д ачаалагдсан байх ёстой.

## ✅ Template13 — 3 түлхүүр

| Түлхүүр | Юу хийх | Fallback |
|---|---|---|
| `footer.children` | Хосын нэрийн доор хүүхдийн нэр | `FOOTER_CHILDREN` |
| `footer.phone` | Холбоо барих утас | `CONTACT_PHONE` |
| `footer.phoneLabel` | Утасны гарчиг (анхдагч "Холбогдох утас:") | — |

ℹ️ T11 ба T13 хоёулаа `footer.phone` (`"99..., 88..."` мөр) ба `footer.phones`
(массив) хоёуланг хүлээж авна — T11 дээр таслалаар салгаж, тус бүрд нь `tel:` холбоос үүсгэнэ.

---

## Бүх түлхүүрийг агуулсан SQL (Template11)

Хэрэггүй мөрөө устгаад ашиглана — бичээгүй түлхүүр бүр кодын анхдагч утгаараа үлдэнэ.

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
    "font":     { "family": "Caveat, cursive", "size": "text-3xl sm:text-4xl md:text-5xl" },
    "quotes":   "en",
    "captions": { "https://.../gallery1.jpg": "Бидний үерхсэн өдөр\n2023.10.10" }
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
    "honored":      ["Хүндэтгэсэн: М.Баярбямба & Ц.Анужин", "Охин: Б.Анххүслэн"],
    "phones":       ["99112233", "88112233"],
    "phonesLabel":  "Утас:",
    "declineLabel": "Очиж амжихгүй нь"
  },
  "footer": {
    "children": ["Хүү: Д.Саруул-Эрдэнэ"],
    "image":    "https://.../footer.jpg",
    "font":     { "family": "Caveat, cursive", "size": "text-4xl sm:text-5xl" }
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

-- одоогийн утгыг харах
select slug, jsonb_pretty(config) from events where slug = 'SLUG-ЭНД';
```

---

## ⬜ TODO — үлдсэн загварууд

Template 12 / 14 / 19 / 21 огт холбогдоогүй (T13-ийн footer л хийгдсэн).
Тэдэнд нийт ~60 override map үлдсэн — хамгийн ихдээ T12: 19, T13: 16, T14: 13.
Идэвхтэй урилгын ихэнх T12/T14 дээр байдаг тул T12-оор үргэлжлүүлэх нь зүйтэй.

### Хэрэгжүүлэх хэв маяг

```ts
// 1. import
import { cfg, sectionOn } from "../../lib/eventConfig";

// 2. component-д config хүрэх эсэхийг шалга.
//    `event: EventData` авдаг бол → event.config
//    зөвхөн slug авдаг бол → Props-д `config?: unknown` нэмж App.tsx-аас дамжуул

// 3. хуучин мөрийг helper-ээр ороо — map-ыг УСТГАХГҮЙ, fallback болгоно
const title = cfg<string>(event.config, "gallery.title", TITLE_OVERRIDE[event.slug] ?? "Зургийн цомог");
const show  = sectionOn(event.config, "guestCount", !HIDE_GUEST_COUNT.has(event.slug));

// 4. map-ын дээр тэмдэглэгээ үлдээ
// config: gallery.title
const TITLE_OVERRIDE: Record<string, string> = { ... };
```

⚠️ `config` prop-ыг **destructure хийхээ мартаж болохгүй** — vite нь TypeScript
шалгадаггүй тул build дуугарахгүй, зөвхөн browser дээр цагаан дэлгэц болж унана.
Мөн массив түлхүүрийг `{x && (` биш `{x && x.length > 0 && (` гэж шалга —
DB-д `[]` бичихэд хоосон блок гарахгүй.

## ⬜ TODO — админ форм

`/admin/:slug` — дээрх JSON-г гараар биш **формоор** засах хуудас, хажууд нь
live preview (LandingPage-ийн DemoModal-ын iframe код дахин ашиглана).
Дээр нь: зураг upload (Supabase Storage), section on/off чеклист,
`/create` ба `/admin`-д authentication (одоо нээлттэй).
