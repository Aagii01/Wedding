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
## Гацалтгүй (кадр-кадраар) хувилбар — Template33

Дээрх хоёр шат бодит цагаар бичдэг тул headless Chrome кадр алгасаж, scroll/slide **гацаж** харагддаг.
`det.mjs` нь хуудасны цагийг (Date, performance.now, timer, requestAnimationFrame, CSS animation,
`<video>`) өөрөө удирдаж, кадр бүрийг яг 1/30 секундийн зайтай зурж авна — компьютерийн хурднаас
үл хамааран жигд гарна. Playwright хэрэггүй, суусан Chrome-ийг ашиглана (`CHROME_PATH`-аар солино).

```bash
cd tools/promo-video
npm init -y && npm i ffmpeg-static@5
# төслийн root-д: npm run dev -- --port 5200 --strictPort --host 127.0.0.1
node maps-shot.mjs "The Continental Hotel Ulaanbaatar" maps-33.jpg   # байршлын товчинд гарах газрын зураг
node record-app-33.mjs       # out/app-33.mp4 + out/marks-33.json   (~5 мин)
node record-stage-det.mjs stage-33.html marks-33.json promo-33.mp4   # out/promo-33.mp4 (~8 мин)
```

- `record-app-33.mjs` — `/demo/33?intro=tear&to=Нэр`: цаас урах intro → нэртэй карт → урилгын үг → цомог →
  хөтөлбөр → тоологч → байршил (Maps товч) → ирц бөглөж илгээх → footer. `TO_NAME`, `APP_BASE` env.
  `QUICK=1` → зөвхөн intro хэсгийг турших.
- `stage-33.html` — `stage.html`-ийн оникс/алтан хувилбар. Maps товч дарахад `out/maps-33.jpg`
  утасны дэлгэцэд доороос гулсаж орно. `LIMIT=5` → эхний 5 секундийг турших.
- Шинэ загварт: `record-app-33.mjs`-ийг хуулж сценарийг (scrollToEl / click / type / mark) өөрчилнө,
  `stage-33.html`-ийн өнгө ба `T` timeline-ийг тааруулна.

### Шинэ reel хийх дараалал (өөр загвар / өөр сэдэв)

Claude-д өгөх хүсэлтийн жишээ: *"tools/promo-video/README.md-ийн гацалтгүй (det.mjs) аргаар /demo/27-ийн
reel хий. Сэдэв: шинэ жилийн байгууллагын урилга."*

1. **Сценарь** — `record-app-33.mjs`-ийг `record-app-NN.mjs` болгож хуулна. Section бүрт:
   `scrollToEl(олох илэрхийлэл, дэлгэцийн байрлал 0..1, секунд)` → `run(секунд)` → `mark("нэр")` → `run(үзүүлэх секунд)`.
   Дарах товчинд `click()`-ийн буцаасан `fx, fy`-г mark-т `at` болгож хадгална (stage дээр цагираг зурна).
   Section бүр 2–3 секунд, нийт 30–40 секунд.
2. **Тайз** — `stage-33.html`-ийг хуулж өнгө (дэвсгэр, онцлох өнгө), `T` timeline-ийн гарчгуудыг солино.
   Гарчиг: 2 мөр, гол үг `<em>`-ээр өнгөтэй. Бүтэц: эхний 3 секундэд анхаарал татах гарчиг → section бүрт
   нэг ашиг тус → ирц бөглөхөд zoom → 3 тоон карт → лого + CTA + eurilga.com.
3. **Шалгах** — эхлээд `QUICK=1` / `LIMIT=5`-аар богино турших; дууссаны дараа кадруудаас contact sheet
   (2 секунд тутам нэг кадр) гаргаж бүх хэсгийг нүдээр шалгана.
4. **Дуу** — pipeline дуугүй гаргана. Instagram / CapCut дээр нэмнэ.

### Гацалтгүй болгосон гол шийдлүүд (дахин бүү туршаарай)

- CDP-ийн `Emulation.setVirtualTimePolicy` нь timer-ийг удирддаг ч **requestAnimationFrame, CSS animation-ийг
  удирддаггүй** → цагийг хуудас дотор JS-ээр хуурамчилсан (`det.mjs`-ийн `CLOCK`).
  `HeadlessExperimental.beginFrame` нь `--headless=new` дээр ажиллахгүй.
- CSS animation/transition-ийг `document.getAnimations()`-ээр зогсоож, кадр бүрт `currentTime` тавина.
  Дууссаныг нь нэг л удаа `finish()` хийнэ (эс бөгөөс `transitionend` давтагдана).
- `<video>`-г тоглуулахгүй, кадр бүрт seek хийгээд `seeked`-ийг хүлээнэ. Дуусахад `ended` event-ийг өөрсдөө явуулна.
- Кадрыг `Page.captureScreenshot`-оор авна (emulated DPR 3-ыг дагана). Screencast нь 1x-ээр л өгдөг.
- App-ийн mp4-ийг `-g 1` (кадр бүр keyframe) болгоно — stage дээр seek яг таарна.
- Stage: `window.start` бэлэн болтол хүлээж байж эхлүүлнэ.
- Google Maps: утасны вэб хувилбар газрын зургаа халхалдаг → `output=embed` URL-ийг **iframe дотор** зурна.
- Maps товч шинэ таб нээхээс сэргийлж `window.open` ба `a[target=_blank]`-ийг хаана.
- `.mjs` / `.html` файлыг bash heredoc-оор бүү бич — `\` тэмдэгт хагасладаг (`\n`, regex эвдэрнэ).
- Dev server: `127.0.0.1:5200` (5173 өөр програмд эзлэгдсэн).

Өөр загварт: `record-app.mjs`-ийн selector-ууд (цэг, зураг, RSVP input) ба `stage.html`-ийн
гарчиг/POSE-ийг тохируулна. `out/` хавтсыг git-д оруулахгүй.
