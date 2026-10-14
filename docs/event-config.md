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

## ✅ Бүх загварт нийтлэг

| Түлхүүр | Юу хийх | Файл |
|---|---|---|
| `sections.credit` | Доод талын "Special Day" брэндийн мөрийг нуух (`false`) | MadeWithCredit.tsx (EventPage) |

---

## ✅ Template11 — 36 түлхүүр бүрэн ажиллана

| Хэсэг | Түлхүүр | Юу хийх | Fallback (код) | Файл |
|---|---|---|---|---|
| **Intro** | `intro.video` | Эхэнд гарах видеоны URL солих | — | App.tsx |
| | `sections.intro` | Intro видеог огт гаргахгүй (`false`) | — | App.tsx |
| **Нүүр** | `hero.names` | Hero дээрх нэрийг солих (`["ЗАЯА","ДЭЭГИЙ"]`) | `HERO_NAMES` | WeddingHero.tsx |
| | `hero.font` | Нэрийн фонт, хэмжээ `{family,size}` | `HERO_NAME_FONT` | WeddingHero.tsx |
| | `hero.quotes` | `"en"` бичвэл ишлэл англиар | `ENGLISH_QUOTES` | WeddingHero.tsx |
| | `hero.captions` | Carousel зургийн тайлбар (түлхүүр = зургийн URL) | `PHOTO_CAPTIONS` | WeddingHero.tsx |
| | `hero.eyebrow` | Нүүр картны дээд талын жижиг бичиг (`""` → алга) | — | WeddingHero.tsx |
| | `hero.imageFit` | `"contain"` бол НҮҮР картны зураг (`main_image`) бүтнээр | — | WeddingHero.tsx |
| | `hero.photoFit` | `"contain"` бол CAROUSEL-ийн зургууд бүтнээр | — | WeddingHero.tsx |
| | `sections.photoQuotes` | Зураг дээрх ишлэлийг нуух (`false`) | — | WeddingHero.tsx |
| **Түүх** | `story.title` | "Бидний хайрын түүх" гарчиг солих | `STORY_TITLE` | WeddingHero.tsx |
| | `story.children` | "нэр ♥ нэр" мөрийн доор үр хүүхдийн нэр | `STORY_CHILDREN` | WeddingHero.tsx |
| | `story.namesSize` | Тэр мөрийн хэмжээ `{name,heart}` | `STORY_NAMES_SIZE` | WeddingHero.tsx |
| | `sections.storyNames` | "нэр ♥ нэр" мөрийг нуух (`false`) | `HIDE_STORY_NAMES` | WeddingHero.tsx |
| **Хос** | `couple.children` | Хосын танилцуулгын доор хүүхдийн нэр | `CHILDREN` | GroomBride.tsx |
| | `sections.couple` | Хосын танилцуулгыг бүхэлд нь нуух (`false`) | — | App.tsx |
| **Цомог** | `gallery.title` | Цомгийн гарчиг | `TITLE_OVERRIDE` | GallerySection.tsx |
| **Хөтөлбөр** | `schedule.title` | Хөтөлбөрийн гарчиг | `TITLE_OVERRIDE` | HealthProtocol.tsx |
| | `sections.schedule` | Хөтөлбөрийг бүхэлд нь нуух (`false`) | `HIDE_SCHEDULE` | App.tsx |
| **Тоологч** | `countdown.title` | "Хуримд үлдсэн хугацаа" гарчгийг солих | — | CountdownTimer.tsx |
| | `countdown.startLabel` | "Эхлэх цаг" гэсэн бичвэрийг солих | — | CountdownTimer.tsx |
| | `sections.timer` | Тоологч ба эхлэх цагийг нуух (`false`) | `HIDE_TIMER` | CountdownTimer.tsx |
| **Ирц** | `rsvp.title` | "Ирцээ бүртгүүлэх" гарчиг | — | RSVP.tsx |
| | `rsvp.subtitle` | "Хуримын өдрөөс өмнө..." мөр (`""` бол алга болно) | — | RSVP.tsx |
| | `rsvp.guestCountLabel` | "Хэдэн хүн ирэх вэ?" бичвэр | — | RSVP.tsx |
| | `rsvp.closing` | Хаалтын мөр | `CLOSING_LINE` | RSVP.tsx |
| | `rsvp.note` | Хаалтын доорх нэмэлт бичвэр (хувцаслалт г.м.) | `CLOSING_NOTE` | RSVP.tsx |
| | `rsvp.honored` | "Хүндэтгэсэн:" мөрүүд | `CLOSING_HONORED` | RSVP.tsx |
| | `rsvp.phones` | Холбоо барих утас | `CLOSING_PHONES` | RSVP.tsx |
| | `rsvp.phonesLabel` | Утасны мөрийн гарчиг | `CLOSING_PHONES_LABEL` | RSVP.tsx |
| | `rsvp.declineLabel` | "Ирэхгүй" сонголтын бичвэр | `DECLINE_LABEL` | RSVP.tsx |
| | `sections.guestCount` | Зочны тоолуур нуух (`false`) | `HIDE_GUEST_COUNT` | RSVP.tsx |
| **Footer** | `footer.children` | Хосын нэрийн доор хүүхдийн нэр | `FOOTER_CHILDREN` | WeddingFooter.tsx |
| | `footer.phones` | Footer дэх холбоо барих утас (массив) | — | WeddingFooter.tsx |
| | `footer.phoneLabel` | Утасны мөрийн гарчиг (анхдагч "Холбогдох утас:") | — | WeddingFooter.tsx |
| | `footer.eyebrow` | Нэрийн дээрх жижиг бичиг (`""` → алга) | — | WeddingFooter.tsx |
| | `footer.image` | Footer зураг (`main_image`-ийн оронд) | `FOOTER_IMAGE` | WeddingFooter.tsx |
| | `footer.font` | Footer нэрийн фонт `{family,size}` | `FOOTER_NAME_FONT` | WeddingFooter.tsx |

ℹ️ **Intro видеоны URL-ууд** (`intro.video`-д шууд бичиж болно):
- T11 (анхдагч): `https://tdy-excellence-template.thedigitalyes.com/assets/intro-video-new-CeLMqoNn.mp4`
- T13: `https://premiumelegante.thedigitalyes.com/assets/intro-video-new-XmwQeafK.mp4`

ℹ️ **`hero.imageFit` ба `hero.photoFit` хоёрын зөрүү:**
`imageFit` нь хамгийн эхний (нүүр) карт, `photoFit` нь доорх carousel.
Нүүр карт үндсэндээ зургийн харьцааг 3/4–1/2 хооронд хүчээр барьдаг тул
хэвтээ зураг хоёр талаасаа их тайрагддаг (жишээ: 978×720 зураг 45% тайрна).
`"contain"` үед карт нь зургийн өөрийн харьцааг авна — тайралт ч, хоосон зай
ч гарахгүй. Хэт өргөн/нарийн зургийг 1.5 / 0.3 харьцаан дээр тогтооно.

ℹ️ **"You're invited to"** гэсэн бичиг нь `type` нь `wedding` БИШ урилгад
нүүр картан дээр ба footer-т автоматаар гардаг. Авах бол хоёуланг нь хоосон
болгоно: `"hero": {"eyebrow": ""}` ба `"footer": {"eyebrow": ""}`.

⚠️ `hero.font` / `footer.font`-д зөвхөн монгол кирилл **ө (U+04E9), ү (U+04AF)**-г
агуулсан фонт тохирно. `Caveat`, `Bad Script` дэмждэг; `Dancing Script`,
`Great Vibes` дэмждэггүй. Фонт нь `index.html`-д ачаалагдсан байх ёстой.

## ✅ Template13 — 5 түлхүүр

| Түлхүүр | Юу хийх | Fallback |
|---|---|---|
| `sections.schedule` | Хөтөлбөрийг нуух (`false`) | `HIDE_SCHEDULE` |
| `sections.rsvp` | Ирцийн бүртгэлийг нуух (`false`) | `HIDE_RSVP` |
| `footer.children` | Хосын нэрийн доор хүүхдийн нэр | `FOOTER_CHILDREN` |
| `footer.phone` | Холбоо барих утас | `CONTACT_PHONE` |
| `footer.phoneLabel` | Утасны гарчиг (анхдагч "Холбогдох утас:") | — |

## ✅ Template14 — 16 түлхүүр

| Хэсэг | Түлхүүр | Юу хийх | Fallback |
|---|---|---|---|
| **Нүүр** | `hero.names` | `["Нэр1","Нэр2"]` → хос; `"Цол, нэр"` → ганц хүн, `\n`-ээр олон мөр | Supabase нэр |
| | `hero.tagline` | "Бид гэрлэж байна" бичгийг солих (`""` → алга) | `HIDE_HERO_TAGLINE` |
| **Урилгын үг** | `verse.names` | Шүлгийн дээрх нэр — `hero.names`-тэй ижил хэлбэр | `VERSE_NAMES` |
| | `sections.verseQuote` | "Хоёр зүрх нэгдэхэд..." ишлэлийг нуух (`false`) | `HIDE_VERSE_QUOTE` |
| **Тоологч** | `countdown.title` | "Хурим хүртэлх хугацаа" гарчгийг солих | `COUNTDOWN_TITLE` |
| **Хөтөлбөр** | `sections.schedule` | Хөтөлбөрийг нуух (`false`) | `HIDE_SCHEDULE` |
| | `schedule.qr` | Хөтөлбөрийн оронд QR зураг (URL) — `sections.schedule: false`-тэй хамт | `SCHEDULE_QR` |
| **Цомог** | `sections.gallery` | Цомгийг нуух (`false`) | `HIDE_GALLERY` |
| | `gallery.bento` | `true` → bento байрлал | `BENTO_GALLERY` |
| **Ирц** | `sections.rsvp` | Ирцийн бүртгэлийг нуух (`false`) | — |
| | `rsvp.maxGuests` | "Хэдүүлээ ирэх вэ?" тоолуурын дээд хязгаар (анхдагч 20) | — |
| **Мэндчилгээ** | `sections.wishes` | Мэндчилгээний хэсгийг нуух (`false`) | — |
| **Footer** | `footer.names` | Нэрийн мөрүүд `["...", "..."]` эсвэл ганц мөр | `FOOTER_NAMES` |
| | `footer.mono` | Монограмын үсэг `["Ц","Р"]`; ганц хүн бол `["Ц"]` | `MONO_OVERRIDE` |
| | `footer.children` | Хүүхдийн нэр | `CHILDREN` |
| | `footer.honored` | "Хүндэтгэсэн:" мөрүүд | `HONORED_BY` |
| | `footer.phones` | Утас (массив эсвэл "99..., 88...") | `CONTACT_PHONES` |
| | `footer.phoneLabel` | Утасны гарчиг (анхдагч "Утас:") | — |

ℹ️ **Ганц хүний урилга (T14):** `person2_name` хоосон бол hero, verse, footer,
монограм бүгд ганц нэрээр гарна — "&" ч, "Richard" fallback ч гарахгүй.
(Өмнө нь `person2_name` хоосон үед "Richard" гарч байсан — зассан.)
`hero.names`-д цол, овог нэрийг `\n`-ээр мөр болгон бичвэл мөр бүр өөрийн
мөрөндөө, хамгийн урт мөрөндөө таарч фонт автоматаар жижигрэнэ (доод тал нь 30px).

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

### Хурим биш арга хэмжээ (ангийн уулзалт, ой, байгууллага)

Template11-ийг хуримын биш арга хэмжээнд тохируулах бүрэн жор. `poem` ба
`schedule` нь тусдаа багана тул тэнд өөрийн бичвэрээ оруулна.

```sql
update events set config = '{
  "sections": { "couple": false, "guestCount": false, "photoQuotes": false },
  "hero":      { "photoFit": "contain" },
  "story":     { "title": "Оюутан насны нандин дурсамж" },
  "gallery":   { "title": "Дурсамжийн цомог" },
  "schedule":  { "title": "Уулзалтын хөтөлбөр" },
  "countdown": { "title": "Уулзалт хүртэл" },
  "rsvp":      { "subtitle": "", "closing": "Таньтай уулзахыг тэсэн ядан хүлээж байна!" }
}'::jsonb
where slug = 'SLUG-ЭНД';
```

⚠️ `title` багана (жишээ нь "... хурим") нь календарь болон Facebook preview-д
гардаг — тэнд бас засах хэрэгтэй. `type` баганыг ч мөн адил.

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

Template 12 / 19 / 21 холбогдоогүй (T13-ийн footer + section 5 түлхүүр л хийгдсэн).
Үлдсэн override map: T12: 19, T13: ~13, T19: 5, T21: 11. T12-оор үргэлжлүүлэх нь зүйтэй.

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
