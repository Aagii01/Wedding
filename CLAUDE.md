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
| Fonts | Dancing Script (script), Great Vibes (poem) — Google Fonts |

---

## URL Бүтэц
```
/               → LandingPage   (загвар showcase, fan carousel)
/i/:slug        → EventPage     (тухайн хуримын урилга)
/create         → CreatePage    (шинэ event үүсгэх form — admin хэрэглэнэ)
```

---

## Supabase — `events` Хүснэгт
```
id               uuid PK
slug             text UNIQUE     ← /i/:slug URL-д хэрэглэнэ
type             text            ← "wedding" | "birthday"
title            text
date             text            ← "2026-07-15" хэлбэрээр хадгалдаг
time             text            ← "18:00"
venue_name       text
venue_address    text
venue_map_url    text            ← Google Maps холбоос
venue_image_url  text            ← газрын зураг URL
hero_image_url   text            ← нүүр зурагны URL
person1_name     text
person1_role     text            ← "Groom" / "Bride" гэх мэт
person1_photo_url text
person1_instagram text
person2_name     text nullable   ← wedding дээр 2 хүн байна
person2_role     text nullable
person2_photo_url text nullable
person2_instagram text nullable
```

**Зургийн workflow:** Supabase Storage bucket → public URL → events table-д URL хэлбэрээр хадгална.
`hero_image_url`, `person1_photo_url`, `person2_photo_url`, `venue_image_url` — бүгд URL.
Хоосон байвал Unsplash placeholder ашигладаг.

**Өөр хүснэгтүүд:**
- `rsvp` — `event_id`, `name`, `phone`, `guests` (тоо), `message`
- `wishes` — `event_id`, `name`, `message`, `created_at`

---

## Component Бүтэц (`src/app/components/`)

### Идэвхтэй (App.tsx-д хэрэглэгддэг)
| Component | Юу хийдэг |
|-----------|-----------|
| `FloatingPetals` | Fixed overlay, 14 SVG дэлбээ CSS keyframe-р доошоо унадаг, z-index:5 |
| `WeddingHero` | 2 хэсэг: (1) hero зурагтай нүүр карт, (2) 5-карт carousel (drag-able, dots) |
| `GroomBride` | Хоёр хүний зураг, нэр, Instagram |
| `VenueSection` | Газрын нэр, хаяг, Google Maps товч, зураг |
| `GallerySection` | Bento grid зураглал + lightbox (AnimatePresence) |
| `PoemSection` | "Great Vibes" фонтоор, мөр бүр `whileInView` scroll reveal, delay stagger |
| `CountdownTimer` | Тоологч + "Календарьт нэмэх" dropdown (Google Cal URL + .ics download) |
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
- 5 харагдах карт: tiny(±410px) → small(±230px) → center
- `AnimatePresence` зөвхөн center карт дээр

### PoemSection
- `Variants` type ашиглаагүй (TypeScript `ease: number[]` incompatible)
- Мөр бүрт шууд `initial/whileInView/transition` props + manual `delay = lineIndex * 0.18`

---

## Хийгдэх Ажлууд (TODO)

### Тэргүүлэх
- [ ] **Зургийн upload UI** — `CreatePage`-д Supabase Storage upload нэмэх (одоо URL оруулдаг)
- [ ] **WeddingGifts** — `bank_account`, `bank_name` column нэмж `events` table-д, component идэвхжүүлэх
- [ ] **Gallery зургууд** — `events` table-д `gallery_photo_urls` (array/json) column нэмэх

### Дараагийн загвар
- [ ] Midnight template (dark, gold)
- [ ] Botanical, Blush, Minimal template-үүд
- [ ] LandingPage-д "available: true" болгоход ажиллах routing

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
