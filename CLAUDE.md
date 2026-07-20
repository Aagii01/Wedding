# One Wedding — Project Context for Claude

## Товч тайлбар
Монгол хурим, баярын **урилгын вэб платформ** (SaaS бизнес).
Захиалагч Facebook-р холбогдоно → admin `/create`-р event үүсгэнэ → `/i/slug` URL-г захиалагчид өгнө.
Сайтын нэр: **One Wedding**. Лайв URL: `https://wedding-bay.vercel.app`

---

## Tech Stack
| Зүйл | Хэрэглэж буй |
|------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Animation | `motion/react` (Framer Motion v12) |
| Icons | `lucide-react` |
| UI components | shadcn/ui (`src/app/components/ui/`) |
| Backend / DB | Supabase (PostgreSQL) |
| Routing | react-router v7 |
| Deployment | Vercel (auto-deploy from GitHub `main` branch) |
| Fonts | Dancing Script (script), Great Vibes (poem), Cormorant Garamond (Template 12) — Google Fonts |

---

## URL Бүтэц
```
/               → LandingPage   (загвар showcase, fan carousel, demo modal)
/i/:slug        → EventPage     (тухайн хуримын урилга — Supabase-аас дата)
/demo/:id       → DemoPage      (загварын demo — hardcoded дата, iframe-д ачаалдаг)
/create         → CreatePage    (шинэ event үүсгэх form — admin хэрэглэнэ)
/admin          → AdminPage
```

---

## Supabase — `events` Хүснэгт
```
id               uuid PK
slug             text UNIQUE        ← /i/:slug URL-д хэрэглэнэ
type             text               ← "wedding" | "birthday"
title            text
date             text               ← "2026-07-15" хэлбэрээр хадгалдаг
time             text               ← "18:00"
venue_name       text
venue_address    text
venue_map_url    text               ← Google Maps холбоос
maps_photo       text               ← газрын зураг URL
main_image       text               ← нүүр (hero) зурагны URL
person1_name     text
person1_role     text               ← "Groom" / "Bride" гэх мэт
person1_photo    text
person1_instagram text
person2_name     text nullable      ← wedding дээр 2 хүн байна
person2_role     text nullable
person2_photo    text nullable
person2_instagram text nullable
gallery_photos   text[]             ← GallerySection-д ашигладаг 4 зургийн array
gallery2_photos  text[]             ← WeddingHero carousel-д ашигладаг 8 зургийн array
template         text DEFAULT '11'  ← ямар template ашиглахыг тодорхойлно
poem             text nullable      ← шүлэг/урилгын үг. Мөр бүрийг \n-ээр тусгаарлана
schedule         jsonb nullable     ← [{ "time": "17:00", "label": "...", "desc": "..." }, ...]
```

**`poem` / `schedule` — хурим бүрийн өөрийн агуулга:**
Хоосон (`null`) бол template тус бүрийн үндсэн текст гарна — хуучин event-үүд эвдрэхгүй.
Уншихдаа `src/lib/eventContent.ts`-ийн `getPoemLines(event, fallback)` /
`getSchedule(event, fallback)`-г ашиглана (задлах, шалгах, fallback-ийг нэг дор хийдэг).
Дэмждэг: T11 (`PoemSection`, `HealthProtocol`), T12 (`T12Quote`, `T12Schedule`),
T13 (`T13Letter`, `T13Schedule`), T14 (`T14Verse`, `T14Schedule`).
T15/T16-д эдгээр section байхгүй.

**Баганын нэр өөрчлөлт (хуучин → шинэ):**
- `hero_image_url` → `main_image`
- `venue_image_url` → `maps_photo`
- `person1_photo_url` → `person1_photo`
- `person2_photo_url` → `person2_photo`

**Зургийн workflow:** Supabase Storage bucket → public URL → events table-д URL хэлбэрээр хадгална.
`main_image`, `person1_photo`, `person2_photo`, `maps_photo` — бүгд URL.
`gallery_photos`, `gallery2_photos` — URL-ийн array (PostgreSQL `text[]`).
Хоосон байвал Unsplash placeholder ашигладаг.

**Өөр хүснэгтүүд:**
- `rsvp` — `event_id`, `name`, `phone`, `guests` (тоо), `message`
- `wishes` — `event_id`, `name`, `message`, `created_at`

---

## Template Систем

### Бүтэц
```
src/app/templates/
  Template12.tsx   ← "Cormorant" загвар (цэвэр, editorial, botanical)
```

### Хэрхэн ажилладаг
- `templateMap` нь тусдаа файлд: `src/app/templates/templateMap.ts` (`EventPage` ба `DemoPage` хуваалцана)
- `EventPage.tsx` → `event.template` field-г уншина → `templateMap`-аас тохирох component-г ачаална
- `templateMap` дотор: `"11" → App`, `"12" → Template12`, `"13" → Template13`, `"14" → Template14`, `"15" → Template15`
- Шинэ template нэмэхдээ: шинэ файл үүсгэх + `templateMap.ts`-д key нэмэх (LandingPage-ийн demo-д автоматаар орно)

### Template 11 (src/app/App.tsx) — "Classic"
Одоогийн хуримын загвар. FloatingPetals, WeddingHero carousel, GroomBride гэх мэт.

### Template 12 (src/app/templates/Template12.tsx) — "Cormorant"
Cormorant Garamond фонт, editorial загвар. Бүх section нэг файлд байна:

| Section | Юу хийдэг |
|---------|-----------|
| `T12Navbar` | Fixed navbar, scroll shrink, mobile drawer |
| `T12Hero` | Parallax hero зураг, том italic нэр |
| `T12InvitationText` | Үг бүр wave-р гарч ирдэг |
| `T12PhotoCollage` | Desktop: scroll-driven sticky collage. Mobile: grid |
| `T12OurStory` | "our story" sticky watermark + 2 chapter, scroll-driven polaroid stack |
| `T12Countdown` | Тоологч + botanical SVG цэцгүүд (Sakura, Peony, Daisy, Tulip, WildRose) |
| `T12Venue` | Газрын зураг + нэр + Maps товч |
| `T12Quote` | Scroll-driven word opacity reveal |
| `T12RSVP` | Form → Supabase `rsvp` table |
| `T12Footer` | Monogram + нэр |

**Palette (CSS vars хэлбэрээр биш, constant-аар):**
```ts
CREAM  = "hsl(220 18% 96%)"
INK    = "hsl(220 30% 16%)"
ACCENT = "hsl(218 50% 50%)"
```

**OurStory scroll animation онцлог:**
- Section бүр `200vh` өндөртэй, content нь `sticky`
- `useScroll({ offset: ["start start", "end start"] })` → `scrollYProgress` 0→1
- Зураг тус бүр `useTransform`-аар `y`, `x`, `rotate` scroll-тай шууд холбосон
- Доош scroll → зураг дээш гарна, дээш scroll → буцаад доошоо орно

---

## Demo / Showcase Систем (LandingPage загвар preview)

LandingPage дээр захиалагч **жинхэнэ template-уудыг утсан дотор интерактив байдлаар** үзэж болдог. Энэ нь дахин код бичээгүй — яг ажиллаж байгаа template component-уудыг **дата сольж** дуудна.

### Гол санаа: нэг component, өөр дата
Template бүр `event: EventData` prop авдаг.
- **Жинхэнэ урилга** (`/i/:slug`) → Supabase-аас дата ирнэ
- **Demo** (`/demo/:id`) → `DEMO_EVENT` (hardcoded дата) ирнэ

→ Template-д засвар хийвэл demo **ба** жинхэнэ урилга хоёулаа автоматаар шинэчлэгдэнэ.

### Файлууд
| Файл | Үүрэг |
|------|------|
| `src/app/templates/templateMap.ts` | `"11"→App, "12"→Template12...` нэг л map. `EventPage` ба `DemoPage` хуваалцана |
| `src/app/pages/DemoPage.tsx` | `useParams` id → `templateMap[id]` → `<Template event={{...DEMO_EVENT, template: id}} />` |
| `src/app/demo/demoEvent.ts` | Зөвхөн **дата** (Болд & Сарнай, Unsplash зураг, `music_url`). UI код биш |

### Урсгал
```
LandingPage → TemplatesSection → карт дээр дарах
  → DemoModal нээгдэнэ (утасны frame + "Demo ачаалах" товч)
  → товч дарах → <iframe src="/demo/:id">
  → DemoPage → templateMap[id] → жинхэнэ template (App/Template12/13/14)
```

### Чухал техникийн шийдвэрүүд (LandingPage.tsx)
- **iframe ашигладаг шалтгаан:** template-ууд `100vh`, `window.scrollY`, `position:fixed` (video intro) ашигладаг. iframe доторх viewport тусгаарлагдсан тул бүгд зөв ажиллана.
- **Scaled iframe (device emulator арга):** iframe-г `390×844` (стандарт iPhone нягтрал) дээр render хийгээд `transform: scale()`-р утасны screen-д багтаатал жижигрүүлнэ. `scale = screen.clientHeight / 844`, `resize`-д дахин тооцоолно. → template `390px` өргөн гэж "боддог" тул **хэвтээ scroll гарахгүй**, агуулга үргэлж багтана.
- **Дуу:** `<iframe allow="autoplay">` + `DEMO_EVENT.music_url`. Хэрэглэгч iframe дотор intro дээр дарах нь user gesture болж, видео + ар талын дуу хоёулаа эхэлнэ.
- **PhoneFrame / PhoneScreenHero:** дахин ашиглагддаг — картны thumbnail ба modal-ийн эхний preview хоёрт.

---

## Component Бүтэц (`src/app/components/`)

### Идэвхтэй (App.tsx-д хэрэглэгддэг)
| Component | Юу хийдэг |
|-----------|-----------|
| `FloatingPetals` | Fixed overlay, 14 SVG дэлбээ CSS keyframe-р доошоо унадаг, z-index:5 |
| `WeddingHero` | 2 хэсэг: (1) `main_image`-тай нүүр карт, (2) 8-карт carousel (`gallery2_photos`, Mongolian folk quotes, drag-able, dots) |
| `GroomBride` | Хоёр хүний зураг, нэр, Instagram |
| `VenueSection` | Газрын нэр, хаяг, Google Maps товч, зураг |
| `GallerySection` | Bento grid 4 зураг (`gallery_photos`) + lightbox (AnimatePresence) |
| `PoemSection` | Cormorant Garamond фонт, дулаан хүрэн өнгө (`#3a2e28`), мөр бүр `whileInView` scroll reveal |
| `CountdownTimer` | Cream (`#f8f5f0`) bg, `FlipNumber` 3D flip animation, Cormorant Garamond тоо, "Календарьт нэмэх" dropdown |
| `HealthProtocol` | Хурмын цагийн хуваарь (timeline) — нэр нь хуучин, агуулга шинэ |
| `RSVP` | Ирэлтийн бүртгэл form → Supabase `rsvp` table |
| `WeddingFooter` | Footer |

### Идэвхгүй (commented out эсвэл unused)
- `WeddingDetails` — commented out App.tsx-д
- `WeddingGifts` — commented out, bank account feature хийгдээгүй
- `LiveStream` — устгасан
- `WeddingSchedule` → `GallerySection`-р солигдсон
- `OurStory` — хэрэглэгдэхгүй байгаа

---

## App.tsx Render Дараалал
```
FloatingPetals (fixed overlay)
WeddingHero
GroomBride
VenueSection
GallerySection
PoemSection
CountdownTimer
HealthProtocol   ← нэр хуучин, одоо цагийн хуваарь харуулдаг
RSVP
WeddingFooter
Toaster (shadcn notification)
```

---

## Чухал Technical Шийдвэрүүд

### CountdownTimer flickering засвар
`setInterval`-тай state parent-д байвал `motion/react` animation дахин trigger болдог байсан.
**Засвар:** `TimerNumbers` тусдаа component болгон task — interval state зөвхөн тэнд байна.

### LandingPage Fan Carousel
- `useMotionValue` + `useAnimationFrame` → smooth continuous scroll (no re-render)
- `useTransform` → x position → rotateY/scale/opacity автоматаар
- Seamless loop: `DOUBLED = [...templates, ...templates]`, offset `-TOTAL_SHIFT` дээр reset
- Hover pause: `useRef<boolean>` (useState биш — re-render хийхгүй)

### WeddingHero Carousel
- Drag gesture: `motion.div` + `onDragEnd` velocity/offset check
- 8 slide: `gallery2_photos` array + Mongolian folk love quotes overlay
- 5 харагдах карт: tiny(±410px) → small(±230px) → center
- `AnimatePresence` зөвхөн center карт дээр

### CountdownTimer FlipNumber
- `FlipNumber` component: `AnimatePresence mode="wait"` + `rotateX: -90→0→80` 3D flip
- `perspective: 500px` parent div-д — overflow:hidden байхгүй (тоо таслагдахгүй)
- `TimerNumbers` тусдаа component: `setInterval` state зөвхөн тэнд → parent re-render байхгүй
- Mongolian labels: Өдөр / Цаг / Минут / Секунд

### PoemSection
- Cormorant Garamond фонт (`1.55rem`, `#3a2e28` дулаан хүрэн)
- Мөр бүрт шууд `initial/whileInView/transition` props + manual `delay = lineIndex * 0.15`

---

## Хийгдэх Ажлууд (TODO)

### Тэргүүлэх
- [ ] **Зургийн upload UI** — `CreatePage`-д Supabase Storage upload нэмэх (одоо URL оруулдаг)
- [ ] **WeddingGifts** — `bank_account`, `bank_name` column нэмж `events` table-д, component идэвхжүүлэх
- [x] **Gallery зургууд** — `gallery_photos` (4, bento grid) + `gallery2_photos` (8, hero carousel) column нэмэгдсэн

### Дараагийн загвар
- [x] Template 12 "Cormorant" — хийгдсэн (`src/app/templates/Template12.tsx`)
- [ ] Template 13 — Midnight (dark, gold)
- [ ] Template 14 — Botanical, Blush, Minimal
- [ ] LandingPage-д template preview carousel-д "available: true" болгоход ажиллах routing

### Бусад
- [ ] Admin authentication (одоо `/create` нээлттэй)
- [ ] `story` text column → "Манай түүх" хэсэг WeddingHero-д

---

## Vercel & Deployment
- `vercel.json`: `outputDirectory: "dist"`, framework: `"vite"`, SPA rewrite `/(.*)` → `/index.html`
- Environment variables Vercel dashboard-д: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Deploy: `git push origin main` → Vercel автоматаар build & deploy хийнэ

## Local Dev
```bash
npm run dev      # localhost:5173
npm run build    # dist/ folder
```
