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

## ✅ Template13 — 9 түлхүүр

| Түлхүүр | Юу хийх | Fallback |
|---|---|---|
| `sections.schedule` | Хөтөлбөрийг нуух (`false`) | `HIDE_SCHEDULE` |
| `sections.rsvp` | Ирцийн бүртгэлийг нуух (`false`) | `HIDE_RSVP` |
| `footer.children` | Хосын нэрийн доор хүүхдийн нэр | `FOOTER_CHILDREN` |
| `footer.phone` | Холбоо барих утас | `CONTACT_PHONE` |
| `footer.phoneLabel` | Утасны гарчиг (анхдагч "Холбогдох утас:") | — |
| `request.reception` | "Хуримын хүсэлт" дэх "Хүлээн авалт" картын бичвэрийг БҮХЭЛД нь солих (гарчиггүй, зөвхөн өгсөн текст) | `RECEPTION_CARD_TEXT` |
| `request.time` | "Цаг" картын бичвэрийг бүхэлд нь солих | `TIME_CARD_TEXT` |
| `request.receptionExtra` | "Хүлээн авалт" картын төгсгөлд нэмэлт өгүүлбэр | `RECEPTION_CARD_EXTRA` |
| `request.timeExtra` | "Цаг" картын төгсгөлд нэмэлт өгүүлбэр | `TIME_CARD_EXTRA` |

## ✅ Template14 — 23 түлхүүр

| Хэсэг | Түлхүүр | Юу хийх | Fallback |
|---|---|---|---|
| **Intro** | `intro.video` | Эхэнд гарах видеоны URL солих (T13-ынх: `https://premiumelegante.thedigitalyes.com/assets/intro-video-new-XmwQeafK.mp4`) | `INTRO_VIDEO[slug]` |
| | `sections.intro` | Intro видеог огт гаргахгүй (`false`) | — |
| **Нүүр** | `hero.names` | `["Нэр1","Нэр2"]` → хос; `"Цол, нэр"` → ганц хүн, `\n`-ээр олон мөр | Supabase нэр |
| | `hero.font` | Hero дээрх нэрийн фонт `{"family":"'Great Vibes', cursive","size":96}` — family нь index.html-д ачаалсан байх; hero ба verse-ийн нэрэнд, footer хэвээр. Great Vibes-д Ү/ү байхгүй тул үндсэн фонт Great Vibes үед Ү/ү → латин Y/y (хэлбэр ижил) автоматаар солигдоно. Локал фонт (жнь `Mak Champion KZ`): `src/styles/fonts.css`-д `@font-face`, файл `public/fonts/`, stack-д Great Vibes-ийг fallback болгож үлдээнэ | `HERO_NAME_FONT` |
| | `hero.nameImage` | Нэрийг бэлэн PNG зургаар (ил тод дэвсгэр, 1170px өргөн = 390×3, `public/names/` эсвэл URL) — лицензтэй фонтыг сайтад тавихгүйгээр тэр фонтоор харуулна; өгвөл нэрийн текст блок гарахгүй → `docs/name-image-font.md` | `HERO_NAME_IMAGE` |
| | `hero.tagline` | "Бид гэрлэж байна" бичгийг солих (`""` → алга) | `HIDE_HERO_TAGLINE` |
| **Урилгын үг** | `verse.names` | Шүлгийн дээрх нэр — `hero.names`-тэй ижил хэлбэр | `VERSE_NAMES` |
| | `verse.font` | Verse-ийн нэрийн фонтыг hero-оос тусад нь өгөх `{"family":"...","size":92}`; байхгүй бол `hero.font`; `false` бол анхдагч Cormorant italic (hero script фонттой ч verse энгийн) | `VERSE_NAME_FONT` |
| | `verse.children` | Нэрсийн доор "&" + хүүхдийн нэр нэрийн фонтоор, арай жижиг (`"Охин: Х.Сор-Үйлс"` эсвэл массив); өгвөл нэрсийн хоорондох "&" гарахгүй | `VERSE_CHILDREN` |
| | `verse.nameImage` | Урилгын үг дээрх нэр, "&", хүүхдийн мөрийг бэлэн PNG зургаар (`hero.nameImage`-тэй ижил: ил тод, 1170px өргөн, хөх өнгөөр, `public/names/`); өгвөл текст блок гарахгүй → `docs/name-image-font.md` | `VERSE_NAME_IMAGE` |
| **Тоологч** | `countdown.title` | "Хуримын өдөр" гарчгийг солих | `COUNTDOWN_TITLE` |
| **Хөтөлбөр** | `sections.schedule` | Хөтөлбөрийг нуух (`false`) | `HIDE_SCHEDULE` |
| | `schedule.qr` | Хөтөлбөрийн оронд QR зураг (URL) — `sections.schedule: false`-тэй хамт | `SCHEDULE_QR` |
| **Байршил** | `venue.subtitle` | Газрын нэрийн доорх нэмэлт мөр (жнь гадаад нэрийн монгол орчуулга); текст эсвэл мөрүүдийн массив | `VENUE_SUBTITLE` |
| **Цомог** | `sections.gallery` | Цомгийг нуух (`false`) | `HIDE_GALLERY` |
| | `gallery.bento` | `true` → bento байрлал | `BENTO_GALLERY` |
| | `gallery.title` | Цомгийн гарчиг (анхдагч "Зургийн цомог") | — |
| | `gallery.subtitle` | Гарчгийн доорх нэг мөр тайлбар (өгвөл л гарна) | — |
| **Ирц** | `sections.rsvp` | Ирцийн бүртгэлийг нуух (`false`) | — |
| | `rsvp.maxGuests` | "Хэдүүлээ ирэх вэ?" тоолуурын дээд хязгаар (анхдагч 20) | — |
| | `rsvp.eyebrow` | "Та хүрэлцэн ирэх үү?" гарчгийн дээрх жижиг мөр; `""` → нуугдана. Анхдагч: `type = wedding` (эсвэл хоосон) бол "Бидний хуриманд", бусад төрөлд (nair, celebrate…) автоматаар нуугдана | — |
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

## ✅ Template22 — "Hero" (сэвлэг үргээх, супер баатар) — бүгд config-оос

T21-ийн бүтэц, гэхдээ slug map ОГТ БАЙХГҮЙ: захиалагчийн бүх тохиргоо DB-ээс.

| Түлхүүр | Төрөл | Үндсэн утга | Тайлбар |
|---|---|---|---|
| `hero.name` | string | `person1_name` | Hero ба footer дээрх нэр |
| `hero.age` | string/number | — | Өгвөл "N НАС" товч гарна |
| `hero.eyebrow` | string | "Сэвлэг үргээх ёслолын урилга" | Нэрийн дээрх жижиг бичиг |
| `hero.emblem` | string | нэрийн эхний үсэг | Бамбай дээрх үсэг ("" бол од) |
| `intro.video` | string/false | дугтуйн видео | Өөр URL эсвэл `false` (intro-гүй) |
| `gallery.title` | string | "Бяцхан баатрын цомог" | |
| `gallery.quotes` | false | true | `false` бол зураг дээрх ишлэл нуугдана |
| `sections.schedule` | false | true | Хөтөлбөр нуух |
| `sections.request` | false | true | "Бяцхан хүсэлт" нуух |
| `sections.wishes` | false | true | Ерөөл нуух |
| `sections.rsvp` | false | true | Ирц нуух |
| `request.title` | string | "Бяцхан хүсэлт" | |
| `request.text` | string | сэвлэгийн бичвэр | |
| `rsvp.maxGuests` | number | 20 | |
| `rsvp.note` | string | "Баярын өдрөөс өмнө..." | |
| `footer.title` | string | "Таньтай уулзахыг..." | |
| `footer.note` | string | — | Хувцаслалтын хүсэлт |
| `footer.lines` | string[] | [] | "Хүндэтгэсэн: ..." мөрүүд |
| `footer.phones` | string[] | [] | tel: холбоос болно |
| `footer.image` | string | `gallery_photos[0]` | Footer зураг |

Шүлэг → `events.poem`, хөтөлбөр → `events.schedule` (бусад загвартай адил).

```sql
update events set template = '22', config = '{
  "hero":   { "age": "3", "eyebrow": "Сэвлэг үргээх ёслолын урилга" },
  "footer": { "lines": ["Хүндэтгэсэн: Эрдэнэ, Бямбаноров"], "phones": ["99001122"],
              "note": "Хүүхэд бүр супер баатрын дүрээр ирэхийг хүсэж байна." }
}'::jsonb where slug = 'geregezendmene';
```

---

## ✅ Template23 / 24 — эрэгтэй хүүхдийн төрсөн өдөр (Sonic / Spider-Man) — бүгд config-оос

Нэг бүтэц (`Template23.tsx` → `HeroBirthday`), хоёр theme:
- **23 = Sonic** — хөх дэвсгэр, алтан цагираг, улаан тоо; хурдны зураас, шатрын хээ
- **24 = Spider-Man** — улаан #DF1F2D + хөх #2B3784, аалзны тор, дугуй торон цагираг

Intro нь видео биш — цагираг дээр дарж нээнэ (дуу тэр үед эхэлнэ). Slug map ОГТ БАЙХГҮЙ.
Доорх түлхүүрүүд хоёуланд нь ижил.

| Түлхүүр | Төрөл | Үндсэн утга | Тайлбар |
|---|---|---|---|
| `theme` | "sonic" / "spider" | template-ээр | Theme-ийг template солихгүйгээр өөрчлөх |
| `ceremony` | "haircut" | — | **Сэвлэг үргээх ёслол.** Анхдагч бичвэрүүд ёслолынх болно: eyebrow "Сэвлэг үргээх ёслолын урилга", урилгын үг (сэвлэг, хайч, ерөөл), хөтөлбөр "Угтах → Сэвлэг үргээх ёслол → Хүндэтгэлийн зоог, бялуу", хүсэлт "Ерөөлийн хүсэлт". Өөрийн `poem`/`schedule`/`request.*` өгвөл тэр нь түрүүлнэ. T25/26-д мөн адил |
| `hero.name` | string | `person1_name` | Овгийн үсэг ("Э.") автоматаар хасагдана |
| `hero.age` | string/number | — | Өгвөл бамбайн баруун доор цагирагтай "5 НАС" тэмдэг |
| `hero.eyebrow` | string | "Төрсөн өдрийн урилга" | |
| `hero.photo` | string | `person1_photo` → `main_image` | Бамбай хэлбэрт таслагдах зураг |
| `hero.mascot` | string | — | Hero доод буланд гарах баатрын чимэглэл зураг (PNG, ил тод дэвсгэртэй). Захиалагчийн өөрийн/лиценэтэй зураг |
| `hero.mascotSide` | "left"/"right" | "left" | Mascot зургийн тал |
| `intro.mascot` | string | — | "Дарж нээх" intro дэлгэц дээрх баатрын чимэглэл зураг |
| `intro.mascotSide` | "left"/"right" | "left" | Intro mascot-ийн тал |
| `intro.video` | string/false | — (дарж нээх intro) | URL өгвөл видео intro; `false` бол intro-гүй |
| `gallery.title` | string | "Бяцхан баатрын цомог" | |
| `gallery.captions` | string[]/false | ерөнхий 8 бичиг | Идэвхтэй картын доорх бичиг; `false` бол нуугдана |
| `sections.schedule` | false | true | Хөтөлбөр нуух |
| `sections.request` | false | true | "Бяцхан хүсэлт" нуух |
| `sections.wishes` | false | true | Ерөөл нуух |
| `sections.rsvp` | false | true | Ирц нуух |
| `request.title` | string | "Бяцхан хүсэлт" | |
| `request.text` | string | theme бүрийн бичвэр | Sonic: пүүз/цагираг; Spider: баг/нөмрөг |
| `rsvp.maxGuests` | number | 10 | |
| `rsvp.note` | string | "Баярын өдрөөс өмнө бүртгүүлнэ үү" | |
| `footer.title` | string | "Таньтай уулзахыг..." | |
| `footer.lines` | string[] | [] | "Хүндэтгэсэн: ..." мөрүүд |
| `footer.phones` | string[] | [] | Pill товч, tel: холбоос, "9900 1122" хэлбэрээр |
| `footer.image` | string | `gallery2_photos[0]` → `gallery_photos[0]` → `main_image` | Footer зураг (цомгийн эхний зураг) |

Шүлэг → `events.poem`, хөтөлбөр → `events.schedule`. Ерөөл хэсэг нь `wishes` хүснэгтээс
сүүлийн 12-ыг уншиж харуулна; ирц `rsvp`-д `name, phone, guests, message` бичнэ.
Нэг мөрөнд багтах нэр: Oswald-аар ≤8 үсэг 76px, ≤11 үсэг 58px, ≤15 үсэг 46px.

⚠️ **Mascot зураг:** `hero.mascot` / `intro.mascot`-д URL өгөөгүй бол demo дээр
ерөнхий баатрын силуэт (placeholder) харагдана — энэ нь ямар ч тодорхой дүр биш,
"энд баатрын зураг орно" гэдгийг үзүүлэх зорилготой. Жинхэнэ урилгад захиалагч
өөрийн/лицензтэй зургаа (ил тод дэвсгэртэй PNG тохиромжтой) оруулна. Код нь тодорхой
зохиогчийн эрхтэй дүрийг (Sonic, Spider-Man гэх мэт) агуулаагүй.

```sql
update events set template = '23', config = '{
  "hero":   { "age": "5" },
  "footer": { "lines": ["Хүндэтгэсэн: Эрдэнэ, Бямбаноров"], "phones": ["99001122"] }
}'::jsonb where slug = 'temuulen-5';
```

---

## ✅ Template25 / 26 — эмэгтэй хүүхдийн төрсөн өдөр (Мөсөн гүнж / Нарны гүнж) — бүгд config-оос

Нэг бүтэц (`Template25.tsx` → `PrincessBirthday`), хоёр theme:
- **25 = Мөсөн гүнж (ice)** — гүн хөх шөнө, мөсөн цэнхэр #BFEAFF, мөнгө; эргэдэг цасан ширхэг тэмдэг, мөсөн талстын хээ, унах цас
- **26 = Нарны гүнж (sun)** — ягаан-лаванда үдэш #2A1748, алтан #FFD166, ягаан товч; нарны тэмдэг, ургамал/цэцгийн хээ, дээш хөвөх алтан дэнлүү

Section дараалал, config түлхүүрүүд нь **Template23/24-тэй яг ижил** (дээрх хүснэгтийг үз):
`theme` ("ice" / "sun"), `ceremony` ("haircut" → сэвлэг үргээх), `hero.name/age/eyebrow/photo/mascot/mascotSide`, `intro.video/mascot/mascotSide`,
`gallery.title/captions`, `sections.*`, `request.title/text`, `rsvp.*`, `footer.*`.
Ялгаа: фонт Playfair Display italic (cyrillic-ext → ө/ү зүгээр), гарчиг зөөлөн glow (хатуу сүүдэргүй),
үндсэн бичвэрүүд "гүнж" (`gallery.title` = "Бяцхан гүнжийн цомог", хүсэлт: ice → цэнхэр/цагаан гоёл,
sun → гүнжийн даашинз + дэнлүү нисгэх). Demo (`/demo/25`, `/demo/26`) дээр mascot-ийн оронд ерөнхий
гүнжийн силуэт (placeholder) гарна — ямар ч тодорхой дүр биш.

```sql
update events set template = '25', config = '{
  "hero":   { "age": "5" },
  "intro":  { "video": "https://.../intro_videos/elsa.mp4" },
  "footer": { "lines": ["Хүндэтгэсэн: Эрдэнэ, Бямбаноров"], "phones": ["99001122"] }
}'::jsonb where slug = 'namuun-5';
```

## ✅ Template27 / 28 — шагналын баярын (хүндэтгэлийн) урилга, 40+ үзэгч — бүгд config-оос

Нэг бүтэц (`Template27.tsx` → `AwardCeremony`), хоёр theme:
- **27 = Бордо-алт (wine)** — гүн бордо #5C1A2E hero/footer band + алтан; одон медалийн тууз, уламжлалт
- **28 = Хөх-алт (navy)** — гүн хөх #0F2440 + алтан; төрийн ёслолын албан өнгө

40+ насанд зориулсан: цайвар ivory дэвсгэр, PT Serif 17px+ бичиг (мөр хоорондын зай 1.6),
Playfair Display налуу биш гарчиг, хөдөлгөөн зөвхөн зөөлөн fade, intro нь **T13-ын дугтуй нээх
видео** дээр **"Дарж нээх"** заавар — дармагц дуу эхэлнэ (browser хүрэлтгүйгээр дуу асаахыг
хориглодог тул энэ л найдвартай арга; `intro.tap: false` → заавар байхгүй, `intro.video: false` → шууд hero), hero-д бүх өргөнийг эзлэх том арк портрет (ирц, утас нь
доод хэсэгт), зүүн доод буланд **"Том үсэг"** (A+) товч — бүх бичвэр 15% томорно. Мотив: алтан
нуман хүрээ, медаль-туузны тэмдэг, үүлэн хээ.
Соёмбо, төрийн сүлд хэрэглэхгүй. Байршлын дээр **"Хэзээ"** хэсэг: огноо, цаг + тоологч
(`sections.timer: false` → нуугдана). Цомгийн зураг дарахад бүтэн дэлгэцээр томорно (lightbox).

| Түлхүүр | Төрөл | Үндсэн утга | Тайлбар |
|---|---|---|---|
| `theme` | "wine" / "navy" | template-ээр | Theme-ийг template солихгүйгээр өөрчлөх |
| `award.name` | string / false | "Шагналын баяр" (demo: "Хөдөлмөрийн хүндэт медаль") | Hero-гийн алтан гарчиг — шагнал/цолын нэр; `false` → огт гарахгүй (нэр нь зураг дээрээ бичигдсэн үед) |
| `hero.photoFit` | "cover" / "contain" | "cover" | `contain` → зургийг тайрахгүй, өөрийнх нь харьцаагаар бүтнээр (лого, постер маягийн зурагт) |
| `hero.photoFrame` | "arch" / "rect" | "arch" | `rect` → дөрвөлжин (16px) хүрээ — нуман хүрээ зургийн дээд буланг тайрдаг тул `contain`-тэй хослуулна |
| `ui.bigTextButton` | false | true | Зүүн доод "Том үсэг" (A+) товчийг нуух |
| `hero.medal` | false | true | Зургийн доод ирмэгийн медаль тэмдгийг нуух |
| `payment.account` | string | — | **Өгвөл хөтөлбөрийн дараа "Төлбөр" хэсэг гарна** — IBAN/данс 4-өөр бүлэглэж харуулна, "Дансны дугаар хуулах" товч (зайгүй хуулна) |
| `payment.bank` / `payment.holder` | string | — | Банк / эзэмшигчийн нэр |
| `payment.amount` / `payment.amountLabel` | string | — / "Такс үнэ" | Үнийн дүн ("250,000₮") том бичгээр, дээр нь шошго |
| `payment.title` / `payment.note` | string | "Төлбөр" / — | Гарчиг; дансны дээрх тайлбар мөр |
| `sections.payment` | false | true | Хэсэг нуух (`payment.account` байхгүй бол угаасаа нуугдана) |
| `award.by` | string | — | Жишээ "Монгол Улсын Ерөнхийлөгчийн зарлигаар" (налуу, жижиг) |
| `hero.name` | string | `person1_name` | Нэр (овгийн үсэг хасагдахгүй — "Д. Батбаяр" хэвээр) |
| `hero.subtitle` | string | — | Жишээ "Жаран насны ой ба шагналын баяр" |
| `hero.eyebrow` | string | "Хүндэтгэлийн урилга" | |
| `hero.photo` | string | `person1_photo` → `main_image` | Нуман (арк) алтан хүрээтэй **том** 4:5 портрет — босоо, нүүр дээд хэсэгт байх зураг тохиромжтой |
| `intro.video` | string / false | T13-ын дугтуй нээх видео | Өөр URL, эсвэл `false` → intro-гүй, шууд hero |
| `intro.tap` | false | **true** | Видео дээрх "Дарж нээх" заавар (дармагц дуу эхэлнэ; видео дарахаас өмнө дуусвал сүүлийн хүрээ дээр хүлээнэ). `false` → заавар байхгүй, дуу зөвхөн хэрэглэгчийн анхны хүрэлт дээр |
| `letter.note` | string | — | Урилгын үгийн доорх налуу мөр, жишээ "Хувцаслалт: ёслолын" |
| `career.title` | string | "Ажлын замнал" | |
| `career.items` | `[{year, text}]` | demo-д 4 жишээ, бусдад хоосон → хэсэг нуугдана | Он → үйл явдлын timeline |
| `gallery.title` | string | "Дурсамжийн зургууд" | Зураг `gallery_photos` (≤6, 2 багана), хоосон бол нуугдана |
| `sections.career/gallery/schedule/wishes/rsvp` | false | true | Хэсэг нуух |
| `wishes.showList` | true | **false** | Ирсэн мэндчилгээний жагсаалтыг харуулах (form үргэлж байна; жагсаалт анхдагчаар нуугдсан) |
| `sections.timer` | false | true | "Хэзээ" хэсэг (огноо, цаг + тоологч, байршлын дээр) нуух |
| `rsvp.maxGuests` | number | 10 | |
| `rsvp.note` | string | "Ирцээ урьдчилан мэдэгдэнэ үү" | |
| `ui.bigText` | true | false | Эхнээсээ том үсгээр нээгдэнэ |
| `footer.title` | string | "Та бүхнийг хүлээн авахдаа таатай байх болно" | |
| `footer.lines` | string[] | [] | "Хүндэтгэсэн: гэр бүл, хамт олон" мөрүүд |
| `footer.phones` | string[] | [] | Pill товч, tel: холбоос |
| `footer.image` | string | — | Өгвөл footer дээр зураг |

Урилгын үг → `events.poem` (үндсэн: "Эрхэм хүндэт та бүхнийг … хүндэтгэн урьж байна."),
хөтөлбөр → `events.schedule` (үндсэн: угтах → хүндэтгэлийн үг → шагнал гардуулах → зоог).
Мэндчилгээ `wishes`, ирц `rsvp` (name, phone, guests; message хоосон) хүснэгтэд.

```sql
update events set template = '27', config = '{
  "award":  { "name": "Хөдөлмөрийн хүндэт медаль", "by": "Монгол Улсын Ерөнхийлөгчийн зарлигаар" },
  "hero":   { "subtitle": "Жаран насны ой ба шагналын баяр" },
  "career": { "items": [
    { "year": "1985", "text": "МУИС төгсөж, багшлах ажлын гараагаа эхэлсэн" },
    { "year": "2026", "text": "Хөдөлмөрийн хүндэт медалиар шагнагдсан" } ] },
  "rsvp":   { "phones": ["99001122"] },
  "footer": { "lines": ["Хүндэтгэсэн: гэр бүл, хамт олон"], "phones": ["99001122", "88112233"] }
}'::jsonb where slug = 'batbayar-medal';
```

## ✅ Template29 / 30 — нярай хүүхдийн усны найрын урилга (Хүү / Охин) — бүгд config-оос

Нэг бүтэц (`Template29.tsx` → `BabyCelebration`), хоёр theme:
- **29 = Хүү (sky)** — тэнгэрийн цэнхэр #7FB7E6, гаа ногоон, зөөлөн шар од; наалт "Хүү!"
- **30 = Охин (blush)** — ягаан #F3A6B8, тоор, зөөлөн алт; наалт "Охин!"

Зөөлөн пастель, цайвар дэвсгэр (залуу эцэг эхээс эмээ өвөө хүртэл уншихад амар). Мотив: ор дээрх
дүүжин тоглоом (од, үүл, сар, зүрх — найгана), дээш хөвөх хөөс, долгион хэлбэрийн хэсгийн зааг
(хэсгүүд цайвар/зөөлөн өнгөөр ээлжилнэ), үүл хэлбэрийн хүрээтэй зураг. Фонт: Cormorant Garamond
italic (нэр, гарчиг), Caveat гар бичмэл (тайлбар, ерөөлийн нэр), PT Sans бичвэр.
Intro: дарж нээх (T23/25 шиг), `intro.video` → видео, `false` → intro-гүй.

| Түлхүүр | Төрөл | Үндсэн утга | Тайлбар |
|---|---|---|---|
| `theme` | "sky" / "blush" | template-ээр | |
| `baby.name` | string | `events.title` (demo: Тэмүүлэн / Номин) | **Хүүхдийн нэр** — title-д бичих эсвэл энд |
| `baby.born` | "YYYY-MM-DD" | — | Төрсөн огноо chip ("2026 оны 7 сарын 12") |
| `baby.weight` | string | — | "3.4 кг" chip |
| `baby.height` | string | — | "52 см" chip |
| `parents.father` / `parents.mother` | string | `person1_name` / `person2_name` | "Аав: … · Ээж: …" мөр |
| `parents.show` | false | true | Эцэг эхийн мөр нуух |
| `hero.eyebrow` | string | "Усны найрын урилга" | Гар бичмэл дээд мөр |
| `hero.tagline` | string / false | "Бяцхан хүү/охин маань мэндэллээ" | Зургийн доорх гар бичмэл; `false` → алга |
| `hero.badge` | string / false | "Хүү!" / "Охин!" | Зургийн буланд наалт; `false` → алга |
| `hero.photo` | string | `main_image` → `person1_photo` | Үүл хэлбэрийн дугуй хүрээнд (нярайн зураг) |
| `hero.mascot`, `hero.mascotSide`, `intro.mascot`, `intro.mascotSide` | | | T23-тай ижил; demo-д баавгайн силуэт placeholder |
| `intro.video` | string / false | — (дарж нээх) | |
| `gallery.title` | string | "Бяцхан үрийн цомог" | Зураг `gallery2_photos` (carousel) |
| `gallery.captions` | string[] / false | 8 бичиг | Идэвхтэй картын доорх гар бичмэл |
| `sections.timer/schedule/gift/wishes/rsvp` | false | true | Хэсэг нуух (`gift` нь `gift.account` байхгүй бол угаасаа нуугдана) |
| `gift.account` | string | — | **Өгвөл "Бэлэг" хэсэг гарна** — дансны дугаар том + "Хуулах" товч (clipboard) |
| `gift.bank` / `gift.holder` | string | — | Банкны нэр / данс эзэмшигч |
| `gift.title` / `gift.note` | string | "Бэлэг" / "Та бүхний ерөөл бидэнд хамгийн үнэтэй бэлэг…" | |
| `rsvp.maxGuests` / `rsvp.note` | | 10 / "Найрын өдрөөс өмнө бүртгүүлнэ үү" | |
| `footer.title` | string | "Та бүхнийг хүлээж байна" | |
| `footer.lines` / `footer.phones` | string[] | [] | "Аав, ээж: …" мөрүүд; pill товч |
| `footer.image` | string | `gallery_photos[0]` | Footer-ийн дугуй зураг |

Урилгын үг → `events.poem` (үндсэн: "Бяцхан үрийнхээ усны найрыг … урьж байна!"),
хөтөлбөр → `events.schedule` (үндсэн: угтах → ерөөл, мэндчилгээ → зоог). Ерөөл `wishes`, ирц `rsvp`.

```sql
update events set template = '29', title = 'Тэмүүлэн', config = '{
  "baby":    { "born": "2026-07-12", "weight": "3.4 кг", "height": "52 см" },
  "gift":    { "bank": "Хаан банк", "account": "5012 3456 7890", "holder": "Б. Болд" },
  "footer":  { "lines": ["Аав, ээж: Болд, Сарнай"], "phones": ["99001122"] }
}'::jsonb where slug = 'temuulen-usnii-nair';
```

## ✅ Template31 / 32 — шинэ байрны (гэр орны) найрын урилга (Терракота / Сэйж) — бүгд config-оос

Нэг бүтэц (`Template31.tsx` → `HouseWarming`), хоёр theme:
- **31 = Терракота (terra)** — шавар улаан #D4785A, элсэн шар, царс модны хаалга, cream дэвсгэр
- **32 = Сэйж (sage)** — зөөлөн ногоон #8FAE8B, чулуун саарал, бор модны хаалга, цагаан дэвсгэр

Цайвар дэвсгэр, том уншигдах бичиг (залуу найзаас эмээ өвөө хүртэл). Мотив: **хаалга нээх intro**
(дарахад хоёр хавтас гадагш онгойж, доторх дулаан гэрэл гарна), яндангаас утаа гарах байшин (цонх
нь гэрэлтэй), гал голомтын оч (дээш хөвөх дулаан цэгүүд), хаалганы нум хэлбэрийн зураг + дүүжин
"Тавтай морил" самбар, дээврийн ваар (scallop) хэлбэрийн хэсгийн зааг. Фонт: Playfair Display italic
(нэр, гарчиг), Caveat гар бичмэл, PT Sans бичвэр. Section: intro → hero → урилгын үг → цомог →
тоологч → хөтөлбөр → **шинэ хаяг** → [бэлэг] → ерөөл → ирц → footer.
`events.type = 'apartment'` тавих — `api/invite.js` preview дээр эздийн нэр биш "төрөл"-ийг, зургийг
нь урилгын өөрийн зургаас авна (хуримын og-default.jpg гарахгүй).

| Түлхүүр | Төрөл | Үндсэн утга | Тайлбар |
|---|---|---|---|
| `theme` | "terra" / "sage" | template-ээр | |
| `family.name` | string | `events.title` | **Гэр бүлийн нэр** — hero-ийн том гарчиг, intro-ийн хаалган дээр ("Болд, Сарнай нарын гэр бүл") |
| `hosts.label` | string | "Гэрийн эзэд" | |
| `hosts.names` | string[] | `[person1_name, person2_name]` | "Гэрийн эзэд: Болд · Сарнай" мөр |
| `hosts.show` | false | true | Эздийн мөр нуух |
| `hero.eyebrow` | string | "Шинэ гэрийн найрын урилга" | Гар бичмэл дээд мөр |
| `hero.tagline` | string / false | "Шинэ гэртээ та бүхнийг урьж байна" | Нэрний доорх гар бичмэл |
| `hero.badge` | string / false | "Тавтай морил" | Зургийн доод ирмэгийн дүүжин модон самбар; `false` → алга |
| `hero.photo` | string | `main_image` → `person1_photo` | Нуман хүрээтэй зураг (гэр бүл эсвэл шинэ байр) |
| `hero.place` | string / false | `venue_name` | Огнооны доорх байршлын chip |
| `intro.video` | string / false | — (хаалга нээх) | Видео intro / intro-гүй |
| `gallery.title` | string | "Шинэ гэрийн цомог" | Зураг `gallery2_photos` (carousel, нуман/дөрвөлжин цонх ээлжилнэ) |
| `gallery.captions` | string[] / false | "Зочны өрөө", "Гал тогоо"… 8 | Идэвхтэй картын доорх гар бичмэл |
| `timer.title` / `schedule.title` | string | "Найр эхлэхэд" / "Хөтөлбөр" | |
| `address.title` | string | "Шинэ хаяг" | Байршлын хэсгийн гарчиг |
| `address.entrance` / `floor` / `door` / `code` / `parking` | string | — (demo-д жишээ) | **Орц / Давхар / Тоот / Хаалганы код / Зогсоол** chip-үүд; өгсөн нь л гарна, "Хаягийг хуулах" товчинд орно |
| `address.note` | string | — | Chip-үүдийн доорх гар бичмэл тайлбар ("Орцны хаалга 17:00-оос нээлттэй") |
| `sections.gallery/timer/schedule/gift/wishes/rsvp` | false | true | Хэсэг нуух (`gift` нь `gift.account` байхгүй бол угаасаа нуугдана) |
| `gift.account` | string | — | **Өгвөл "Бэлэг" хэсэг гарна** — дансны дугаар + "Хуулах" |
| `gift.bank` / `gift.holder` / `gift.title` / `gift.note` | string | — / — / "Бэлэг" / "Та бүхний ирэлт, ерөөл бидэнд хамгийн үнэтэй бэлэг. Хүсвэл шинэ гэрийн тохижилтод:" | |
| `wishes.title` / `wishes.subtitle` | string | "Ерөөл" / "Шинэ гэрт зориулсан ерөөлөө үлдээгээрэй" | |
| `rsvp.title` / `rsvp.maxGuests` / `rsvp.note` | | "Ирцээ бүртгүүлэх" / 10 / "Найрын өдрөөс өмнө бүртгүүлнэ үү" | |
| `footer.title` | string | "Та бүхнийг хүлээж байна" | |
| `footer.lines` / `footer.phones` | string[] | [] | Мөрүүд; pill товч (дарахад залгана) |
| `footer.image` | string | `gallery_photos[0]` | Footer-ийн нуман зураг |

Урилгын үг → `events.poem` (үндсэн: "Шинэ гэрийнхээ гал голомтыг асааж, …"), хөтөлбөр →
`events.schedule` (үндсэн: угтах → гэрийн ерөөл → зоог → хөгжим). Ерөөл `wishes`, ирц `rsvp`.
`venue_name` = хотхон/байрны нэр, `venue_address` = дүүрэг/хороо/гудамж, `maps_photo` = газрын зураг.

```sql
update events set template = '31', type = 'apartment', title = 'Болд, Сарнай нарын гэр бүл', config = '{
  "address": { "entrance": "3-р орц", "floor": "7 давхар", "door": "702 тоот", "code": "7021#",
               "parking": "Байрны урд талын зогсоол" },
  "gift":    { "bank": "Хаан банк", "account": "5012 3456 7890", "holder": "Б. Болд" },
  "footer":  { "lines": ["Гэрийн эзэд: Болд, Сарнай"], "phones": ["99001122"] }
}'::jsonb where slug = 'bold-sarnai-shine-ger';
```

---

## ✅ Template33 — клубын ойн баярын (гала) урилга (Оникс) — бүгд config-оос

Нэг бүтэц (`Template33.tsx` → `ClubAnniversary`), theme **onyx**: хар-оникс #0B0C12 дэвсгэр, шампань
алт #D4AF6A, Cormorant Garamond гарчиг, PT Sans бичвэр ба том үсгийн шошго (ө/ү цэвэр — Playfair/Oswald-ын
ө/ү сонин харагдсан тул хэрэглэхгүй). Зорилтот үзэгч — клубын гишүүд, түншүүд (25–55). Мотив: **алтан
цагирагтай клубын лого** (эргэн тойронд эргэдэг тойрог бичиг "КЛУБ · 2016 — 2026"), **ойн тоо 0 → N дээш
тоологдож** алтан гялбаатай гарна, унах алтан оч, алтан шугам + од зааг. Intro: **T13-ын дугтуй нээх видео**
(анхдагч; `intro.video` URL / `false`); `intro.logo: true` → оронд нь лого дарахад алтан цагираг тэлж, оч
цацарна. Тоологч, байршилд нэмэлт товч байхгүй (зөвхөн "Google Maps-р харах").
Section: intro → hero (лого, ойн тоо, клубын нэр, огноо, байршил chip) → урилгын үг → **замнал**
(тоо баримт count-up + он цагийн хэлхээ) → цомог (lightbox) → хөтөлбөр → **хувцаслалт** → тоологч →
байршил → мэндчилгээ → ирц → footer.

**Дата:** `events.title` = клубын нэр, `main_image` = нүүрний (cover) зураг — бараан градиент доороос
харагдана, `gallery_photos` = цомог (≤6, эхнийх нь 16:9 том), `venue_*` / `maps_photo` байршил.
`person1_*` ашиглагдахгүй. **`events.type = 'anniversary'`** — OG preview "{клуб} — Ойн баярын урилга",
зураг нь `main_image`.
**Гишүүн бүрт нэртэй урилга:** `/i/slug?to=Б.%20Батбаяр` → урилгын үгийн дээр "Эрхэм хүндэт Б. Батбаяр"
(DB мөр нэг, линк олон — нэрийг URL-д л солино).

| Түлхүүр | Төрөл | Үндсэн утга | Тайлбар |
|---|---|---|---|
| `club.name` | string | `events.title` | Клубын нэр — hero, intro, footer, тойрог бичиг |
| `club.logo` | string | — | Лого URL (ил тод PNG тохиромжтой; алтан цагираг дотор `contain`). Байхгүй бол од + нэрийн эхний үсгүүд |
| `club.founded` | string | — | Үүсгэн байгуулагдсан он, жишээ "2016" → ойн тоо = баярын он − энэ; `anniversary.range` = "2016 — 2026" |
| `anniversary.years` | number | `founded`-оос тооцоолно | Ойн тоог шууд өгөх (founded-гүй үед) |
| `anniversary.label` | string | "жилийн ой" | Тооны доорх шошго |
| `anniversary.range` | string / false | "2016 — 2026" | Он хоорондын мөр; `false` → алга |
| `hero.eyebrow` | string | "Ойн баярын урилга" | |
| `hero.tagline` | string / false | "Хамтдаа бүтээсэн он жилүүд" | Клубын нэрний доорх налуу мөр |
| `hero.photo` | string | `main_image` | Нүүрний cover зураг (бараан давхаргатай) |
| `hero.place` | string / false | `venue_name` | Байршлын chip |
| `hero.orbit` | string / false | "{клуб} · {range}" | Логоны эргэн тойрны эргэдэг бичиг; `false` → алга |
| `intro.video` | string / false | T13-ын дугтуй нээх видео | Өөр видео URL / `false` → intro-гүй, шууд hero |
| `intro.logo` | true | false | Видеоны оронд лого дарж нээх intro (алтан цагираг тэлж, оч цацарна) |
| `letter.greeting` | string / false | "Эрхэм хүндэт та бүхэнд" | Урилгын үгийн дээрх хандалт (`?to=` байвал нэрээр солигдоно) |
| `letter.signature` | string / false | "Хүндэтгэсэн: {клуб}" | Доорх гарын үсэг мөр |
| `letter.note` | string | — | Урилгын үгийн доорх жижиг тайлбар |
| `history.title` | string | "Бидний замнал" | |
| `stats.items` | `[{value, suffix?, label}]` | demo-д 3 жишээ, бусдад [] | Тоо баримт: `{"value":120,"suffix":"+","label":"Гишүүн"}` — харагдахад 0-оос тоологдоно |
| `history.items` | `[{year, text}]` | demo-д 4 жишээ, бусдад [] | Он цагийн хэлхээ. stats, history хоёулаа хоосон → хэсэг нуугдана |
| `gallery.title` | string | "Дурсамжийн мөчүүд" | `gallery_photos` хоосон бол нуугдана |
| `schedule.title` | string | "Хөтөлбөр" | Үндсэн: хүлээн авалт → нээлт → хүндэтгэл → гала зоог → хөгжим |
| `dress.code` | string | — (demo: "Black Tie") | **Өгвөл "Хувцаслалт" хэсэг гарна** |
| `dress.note` / `dress.colors` / `dress.title` | string / string[] / string | — / [] / "Хувцаслалт" | Тайлбар; өнгөний дугуй swatch (hex) |
| `timer.title` | string | "Баяр эхлэхэд" | |
| `venue.title` / `venue.note` | string | "Байршил" / — | Тайлбар, жишээ "Зогсоол: доод давхар" |
| `wishes.title` / `wishes.subtitle` | string | "Мэндчилгээ" / "Клубт зориулсан ойн мэндчилгээ…" | |
| `wishes.showList` | false | true | Ирсэн мэндчилгээний жагсаалт нуух |
| `rsvp.title` / `rsvp.maxGuests` / `rsvp.note` | | "Ирцээ бүртгүүлэх" / 5 / "Суудлын зохион байгуулалтын үүднээс…" | |
| `sections.history/gallery/schedule/dress/timer/wishes/rsvp` | false | true | Хэсэг нуух |
| `footer.title` | string | "Та бүхнийг хүлээн авахдаа таатай байх болно" | |
| `footer.lines` / `footer.phones` | string[] | [] | Мөрүүд; pill товч (дарахад залгана) |
| `theme` | "onyx" | template-ээр | Одоогоор нэг theme |

Урилгын үг → `events.poem` (үндсэн: "Нэг зорилго, нэг итгэлээр нэгдэн, …"), хөтөлбөр → `events.schedule`.
Мэндчилгээ `wishes`, ирц `rsvp` хүснэгтэд.

```sql
update events set template = '33', type = 'anniversary', title = 'Алтан Гадас клуб', config = '{
  "club":    { "logo": "https://.../logo.png", "founded": "2016" },
  "stats":   { "items": [ { "value": 10, "label": "Жил" }, { "value": 120, "suffix": "+", "label": "Гишүүн" }, { "value": 48, "label": "Төсөл" } ] },
  "history": { "items": [
    { "year": "2016", "text": "12 гишүүнтэй үүсгэн байгуулагдав" },
    { "year": "2026", "text": "Арван жилийн ой" } ] },
  "dress":   { "code": "Black Tie", "note": "Эрэгтэй: хар костюм · Эмэгтэй: урт даашинз", "colors": ["#0B0C12", "#D4AF6A"] },
  "footer":  { "lines": ["Зохион байгуулагч: Удирдах зөвлөл"], "phones": ["99001122"] }
}'::jsonb where slug = 'altan-gadas-10';
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
