# Нэрийг тусгай фонтоор харуулах — PNG зургийн арга (Champion Script)

Анх `khosbayar-tserenchimed` (Template14) урилгад хийсэн. Захиалагч өөр студийн
(zollame-studio.com) урилга дээрх уран бичлэгийн фонтыг яг тэр чигээр нь хүссэн.
Энэ баримт нь **яагаад зургаар хийсэн, яаж дахин үүсгэх, өөр урилгад яаж хэрэглэх**
гэдгийг өөр session-д ойлгомжтой байхаар бичсэн.

---

## 1. Фонт нь юу вэ

| | |
|---|---|
| Фонтын нэр | **Mak Champion KZ** — Parachute-ийн **PF Champion Script Pro** фонтын кирилл/казах өргөтгөсөн хувилбар |
| Хэрхэн олсон | Zollame-ийн хуудасны HTML/CSS-ийг татаж, нэрийн heading-ийн `font-family: "Mak Champion KZ"` → файл `KZPFChampionScriptPro-Regular.woff2` гэдгийг тогтоосон. Render хийж захиалагчийн зурагтай тулгахад яг таарсан |
| Файл | `https://zollame-studio.com/wp-content/uploads/2026/10/KZPFChampionScriptPro-Regular.woff2` (538 904 байт, WOFF2, 4349 glyph) |
| Монгол үсэг | **Ү/ү, Ө/ө бүгд бий** (fontTools cmap-аар шалгасан) — Great Vibes-д байхгүй |
| Лиценз | Төлбөртэй фонт (нэг style ≈ 100+ евро, web лиценз тусдаа). "KZ" хувилбар нь албан бус өргөтгөл байх магадлалтай. **Тиймээс фонт файлыг repo-д, сайтад тавиагүй** — `tools/name-image/.gitignore`-д хаасан |

Өмнө нь ChatGPT "Bickham Script Pro" гэж таамагласан — буруу. Bickham-ийн кирилл жишээтэй
харьцуулахад "Б", "&", "д"-ийн том гогцоонууд Champion Script-ийнх.

## 2. Яагаад зураг (PNG) вэ

1. Лицензгүй фонт файлыг сайтад тавихгүй.
2. Google Fonts дээр кирилл дэмждэг copperplate script зөвхөн **Great Vibes** (Ү/Ө байхгүй, татлага нь бага).
3. PNG бол фонт файлгүй, яг дизайнерын зураг шиг, Ү/Ө зөв, ямар ч төхөөрөмжид ижил гарна.
4. Сул тал: нэр өөрчлөгдвөл зургийг дахин үүсгэнэ (доорх 4-р хэсэг, 1 минут).

## 3. Кодонд хаана байгаа

| Юу | Хаана |
|---|---|
| Hero-гийн нэрийн зураг | `public/names/khosbayar-tserenchimed.png` — цагаан, сүүдэртэй, 1170×803 |
| Verse (урилгын үг)-ийн нэрийн зураг | `public/names/khosbayar-tserenchimed-verse.png` — хөх, 1170×775, "&" + "Охин: …" мөртэй |
| Template14 | `HERO_NAME_IMAGE`, `VERSE_NAME_IMAGE` slug map + `hero.nameImage`, `verse.nameImage` config (URL). Зураг өгвөл тухайн хэсгийн нэрийн ТЕКСТ блок огт гарахгүй, зураг нь viewport-ийн бүтэн өргөнөөр (padding-ийг давж) гарна |
| Зураг байхгүй үеийн fallback | `HERO_NAME_FONT` → Great Vibes текст; `mnGlyphs()` Ү/ү → латин Y/y (Great Vibes-д Ү байхгүй тул, хэлбэр ижил) |
| Үүсгэх хэрэгсэл | `tools/name-image/` — `hero.html`, `verse.html` (загвар), `trim.py`, `make.sh` |

Config-оор (deploy-гүй) өгөх бол Supabase SQL Editor:
```sql
update events set config = config || '{"hero":{"nameImage":"/names/<slug>.png"},"verse":{"nameImage":"/names/<slug>-verse.png"}}'::jsonb
where slug = '<slug>';
```
(Зургийг `public/names/`-д тавьж deploy хийх, эсвэл Supabase Storage-д тавиад бүтэн URL өгнө.)

## 4. Зургийг (дахин) үүсгэх

Шаардлага: Google Chrome, Python 3 + `pip install pillow`, Git Bash.

1. **Фонт файл**: `tools/name-image/champion.woff2` нэрээр тавина (git-д орохгүй).
   Байхгүй бол дээрх Zollame URL-аас `curl -L -o tools/name-image/champion.woff2 <url>`.
2. **Нэрийг солих**: `tools/name-image/hero.html` (нүүр) эсвэл `verse.html` (урилгын үг) дотор
   `data-fit` span-ууд, `.amp`, `.ch` мөрүүдийг засна. Файлын толгойн тайлбарт юуг өөрчлөхийг бичсэн.
3. **Ажиллуулах** (repo-ийн root-оос):
   ```bash
   bash tools/name-image/make.sh hero.html  ../../public/names/<slug>.png
   bash tools/name-image/make.sh verse.html ../../public/names/<slug>-verse.png
   ```
   Chrome headless ил тод дэвсгэртэй 1170px screenshot авч, `trim.py` дээд/доод хоосон зайг тайрна
   (өргөн 1170 хэвээр). Гаралт дээр "зүүн/баруун зай" хэвлэнэ — 20px-ээс бага бол татлага захад
   хүрч байна гэсэн үг: HTML дахь `avail=w.clientWidth*0.90`-ийг 0.85 болго.
4. **Шалгах**: PNG-г нээж үзнэ; Template14 map эсвэл config-д замыг бичээд build.
5. Commit: зураг + (map өөрчилсөн бол) Template14.tsx.

Python-д Pillow байхгүй бол `PYTHON=<venv>/Scripts/python bash tools/name-image/make.sh …` гэж өгч болно.

## 5. Хэмжээний логик (яагаад 1170px)

- Урилга утсан дээр **390px** viewport гэж тооцдог (LandingPage iframe ч 390×844). Retina-д цэвэрхэн
  байхын тулд **×3 = 1170px** canvas.
- Template14 дээр зураг `width: calc(100% + 48px); margin: … -24px` (hero, padding 24) /
  `calc(100% + 64px); margin: … -32px` (verse, padding 32) → утсан дээр яг 390px өргөн = 3:1 харьцаа.
  Desktop (523px container) дээр пропорциональ томорно.
- **Hero**: дотоод хайрцаг 1026px (= 342×3), `max 288px` (= Template14 hero-гийн useFitText max 96 × 3),
  "&" нэрийн 0.5, `text-shadow: 0 6px 66px rgba(0,0,0,.55)` (template-ийн `0 2px 22px` × 3), цагаан.
- **Verse**: дотоод хайрцаг 978px (= 326×3), `max 276px` (= 92×3), нэр `#28406B` (WAX),
  "&" `#6A573B` (INK_MUTE) 0.5, хүүхдийн мөр 0.62 / line-height 1.25, сүүдэргүй.
- Fit коэффициент **0.90** (template-ийн 0.96 биш): Champion-ийн татлага (swash) үсгийн хайрцгаас
  гадагш гардаг тул нөөц зай.
- Эдгээр тоо Template14-ийн `useFitText`-тэй ижил алгоритмаар HTML дотор тооцогддог тул зураг нь
  текстээр гарч байсан хэмжээтэйгээ ижил.

## 6. Байрлалын шийдвэрүүд (khosbayar-tserenchimed)

- Hero-гийн нэр анх доод талд (scroll cue-ийн дээр) байсан. Захиалагч "нүүрийг халхалж байна" гэсэн тул
  **дээд талд, "Бид гэрлэж байна" tagline-ийн доор** (`margin: "-20px -24px auto"`). Доош буулгах,
  мөр хоорондын зайг нягтруулах хувилбаруудыг туршаад буцаасан.
- Verse дээр "&" нэрсийн дунд биш, **нэрсийн доор**, дараа нь "Охин: Х.Сор-Үйлс" (0.62). Энэ нь
  `verse.children` config-ийн текст хувилбартай ижил бүтэц.
- Verse-ийн текст фонт `VERSE_NAME_FONT[slug] = false` (Cormorant) — зураг байгаа тул хамаагүй.

## 7. Өөр фонтоор / өөр урилгад хийх бол

- HTML-ийн `@font-face` `src`-ийг солино (woff2/ttf). Кирилл Ү/Ө байгаа эсэхийг шалгах:
  `pip install fonttools brotli` → `TTFont(path).getBestCmap()`-д `0x04AE`, `0x04E8` байгаа эсэх.
- Өнгө, хэмжээг тухайн template-ийн нэрийн style-аас ×3 хийж авна.
- T14-ээс өөр template-д `nameImage`-ийн адил `cfg(event.config, "hero.nameImage", MAP[slug])` →
  `<img>` нэмэх хэрэгтэй (Template14.tsx-ийн `T14Hero`/`T14Verse`-ийн хэв маягийг хуул).
