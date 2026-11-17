# Promo video — урилгын загварын сурталчилгааны бичлэг (9:16, 1080×1920)

Жишээ: `jishee zagwar.mp4` (TikTok app promo) хэв маяг — 3D налуу утасны mockup дотор
жинхэнэ урилга ажиллаж, дээр нь том гарчиг (гол үг өнгөтэй), UI руу zoom, өнгөт
статистик карт, төгсгөлд лого + CTA.

## Хоёр шат
1. `record-app.mjs` — Playwright headless Chromium-аар `/demo/11`-ийг 390×844 @3x
   (CDP screencast → 1170×2532 JPEG кадрууд) бичнэ. Алхам бүрийн цаг `out/marks.json`-д.
   Intro видеог алгасна, браузерын цагийг demo огнооноос өмнө тавьж тоологчийг тоолуулна
   (`page.clock.setSystemTime`), RSVP-г demo горимд бөглөнө (DB-д бичихгүй).
   Гаралт: `out/app-trim.webm` (hero-оос эхэлсэн, VP9).
2. `stage.html` + `record-stage.mjs` — тайз: утасны mockup, гарчгийн үг үгээр анимаци,
   POSE (hero/tilt/zoom), tap цагираг, 3 карт, төгсгөл. `marks.json`-ийн цагаар timeline.
   Гаралт: `out/promo.mp4` (H.264, 30fps). Дуу байхгүй — CapCut/Premiere-д нэм.

## Ажиллуулах
```bash
cd tools/promo-video
npm init -y && npm i playwright@1 ffmpeg-static@5 ffprobe-static@3 && npx playwright install chromium
npm run dev   # төслийн root-д, 127.0.0.1:5173
node record-app.mjs      # APP_URL=http://127.0.0.1:5173/demo/12 гэх мэтээр өөр загвар
node record-stage.mjs
```
Өөр загварт: `record-app.mjs`-ийн selector-ууд (цэг, зураг, RSVP input) ба `stage.html`-ийн
гарчиг/POSE-ийг тохируулна. `out/` хавтсыг git-д оруулахгүй.
