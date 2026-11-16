// Pass 1 — Template11 demo-г утасны хэмжээгээр (390×844 @3x) бичиж, алхам бүрийн
// цагийг marks.json-д хадгална. Гаралт: out/app.webm, out/marks.json
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, renameSync, existsSync, rmSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "out");
mkdirSync(OUT, { recursive: true });

const URL = process.env.APP_URL || "http://127.0.0.1:5173/demo/11";
const W = 390, H = 844, DPR = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true });
const tCtx = Date.now(); // бичлэг context үүсэхэд эхэлнэ — hero хүртэлх offset-ийг хадгална
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: DPR,
  isMobile: true,
  hasTouch: true,
  locale: "mn-MN",
  recordVideo: { dir: OUT, size: { width: W * DPR, height: H * DPR } },
});
const page = await context.newPage();
// Demo огноо 2026-08-16 өнгөрсөн тул тоологч 00 болдог — браузерын цагийг урагш нь тавина
await page.clock.setSystemTime(new Date("2026-07-20T10:23:40"));

// recordVideo нь DPR-ийг тооцдоггүй (390×844-ийг л бичдэг) → CDP screencast-аар
// device pixel (1170×2532) кадруудыг JPEG-ээр авч, дараа нь ffmpeg-ээр нэгтгэнэ
const FR = join(OUT, "frames");
rmSync(FR, { recursive: true, force: true }); mkdirSync(FR, { recursive: true });
const frames = []; // { ts (сек, CDP), file }
const cdp = await context.newCDPSession(page);
let pending = Promise.resolve();
cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
  const file = join(FR, `f${String(frames.length).padStart(6, "0")}.jpg`);
  frames.push({ ts: metadata.timestamp, file, wall: Date.now() });
  pending = pending.then(() => writeFile(file, Buffer.from(data, "base64")));
  cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: W * DPR, maxHeight: H * DPR, everyNthFrame: 1 });
// Map товч шинэ таб нээдэг — нээгдмэгц хаана (бичлэгт зөвхөн үндсэн таб)
context.on("page", async (p) => { if (p === page) return; await new Promise((r) => setTimeout(r, 300)); await p.close().catch(() => {}); });
const marks = [];
let t0 = 0;
const mark = (label) => { marks.push({ t: +((Date.now() - t0) / 1000).toFixed(2), label }); console.log("mark", label, marks.at(-1).t); };

await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
await sleep(800);

// Intro видеог алгасна: төгсгөл рүү нь гүйлгэж "ended" үүсгэнэ
await page.evaluate(async () => {
  const v = document.querySelector("video");
  if (!v) return;
  v.muted = true;
  if (!v.duration || !isFinite(v.duration)) {
    await new Promise((r) => { v.addEventListener("loadedmetadata", r, { once: true }); setTimeout(r, 4000); });
  }
  if (v.duration && isFinite(v.duration)) v.currentTime = Math.max(0, v.duration - 0.05);
  else v.dispatchEvent(new Event("ended"));
});
// overlay бүдгэрч арилтал (1.6s) хүлээнэ
await page.waitForFunction(() => !document.querySelector("video"), null, { timeout: 15000 }).catch(() => {});
await sleep(400);
t0 = Date.now();
mark("hero");

// Hero: нүүр зураг 2.5с
await sleep(2500);

// Hero carousel: цэгүүд дээр дарж slide
const dots = page.locator("section button.h-2.rounded-full");
const nDots = await dots.count();
if (nDots > 1) {
  await dots.first().evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "end" }));
  await sleep(1200);
  mark("slide");
  for (const i of [1, 2, 3]) {
    if (i < nDots) { await dots.nth(i).click(); await sleep(1300); }
  }
} else {
  await page.evaluate(() => window.scrollBy({ top: 700, behavior: "smooth" }));
  await sleep(1500);
}

// Хос
await page.evaluate(() => window.scrollBy({ top: 760, behavior: "smooth" }));
await sleep(1400);
mark("couple");
await sleep(1600);

// Байршил → "Байршил харах" дарна (шинэ таб хаагдана)
const mapBtn = page.locator('a:has-text("Байршил харах")').first();
if (await mapBtn.count()) {
  await mapBtn.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
  await sleep(1500);
  mark("venue");
  await sleep(900);
  await mapBtn.hover();
  await sleep(300);
  mark("map-click");
  await mapBtn.click({ force: true, timeout: 5000 }).catch(() => {});
  await sleep(1800);
}

// Цомог → эхний зураг дээр дарж томруулна
const galleryImg = page.locator('img[src*="gallery1"]').first();
if (await galleryImg.count()) {
  await galleryImg.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
  await sleep(1500);
  mark("gallery");
  await sleep(700);
  await galleryImg.click({ force: true });
  mark("lightbox");
  await sleep(2200);
  // Lightbox-ийг хаана: overlay-ийн дээд булан
  await page.mouse.click(20, 60);
  await sleep(900);
}

// Шүлэг
await page.evaluate(() => window.scrollBy({ top: 720, behavior: "smooth" }));
await sleep(1500);
mark("poem");
await sleep(1500);

// Тоологч (flip тоо)
const countdown = page.locator('text=Секунд').first();
if (await countdown.count()) {
  await countdown.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
  await sleep(1200);
  mark("countdown");
  await sleep(4000);
}

// Хөтөлбөр
await page.evaluate(() => window.scrollBy({ top: 700, behavior: "smooth" }));
await sleep(1400);
mark("schedule");
await sleep(1400);

// Ирц: form бөглөж илгээнэ (demo → DB-д бичихгүй)
const nameInput = page.locator('input[placeholder="Таны овог нэр"]').first();
if (await nameInput.count()) {
  await nameInput.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "start" }));
  await sleep(1300);
  mark("rsvp");
  await nameInput.click();
  await nameInput.type("Б. Болормаа", { delay: 70 });
  await sleep(300);
  const phone = page.locator('input[placeholder="Утасны дугаар"]').first();
  await phone.click();
  await phone.type("99112233", { delay: 70 });
  await sleep(300);
  const attending = page.locator('input[name="attending"]').first();
  if (await attending.count()) { await attending.click({ force: true }); await sleep(500); }
  const plus = page.locator('button[aria-label="Нэмэх"]').first();
  if (await plus.count()) { await plus.click(); await sleep(400); await plus.click(); await sleep(500); }
  const submit = page.locator('form button[type="submit"]').first();
  await submit.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
  await sleep(600);
  mark("rsvp-send");
  await submit.click({ force: true, timeout: 5000 }).catch(() => {});
  await sleep(2600);
}

// Footer
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
await sleep(1500);
mark("footer");
await sleep(1500);
mark("end");

await cdp.send("Page.stopScreencast").catch(() => {});
await pending;
const video = page.video();
await context.close();
const tmp = await video.path();
const dest = join(OUT, "app.webm");
if (existsSync(dest)) rmSync(dest, { force: true });
renameSync(tmp, dest);
const offset = +((t0 - tCtx) / 1000).toFixed(2);
writeFileSync(join(OUT, "marks.json"), JSON.stringify({ offset, marks }, null, 2));
await browser.close();

// ── CDP кадруудаас t0-ээс эхлэх видео (app-trim.webm) ──
// Кадр бүрийн ирсэн wall clock (Date.now) цагийг хэрэглэнэ — marks-тай нэг цаг тул sync зөв
const kept = [];
for (let i = 0; i < frames.length; i++) {
  const f = frames[i], next = frames[i + 1];
  const start = Math.max(f.wall, t0);
  const end = next ? next.wall : f.wall + 500;
  if (end <= t0) continue;
  // Хурдан дараалсан кадруудыг (burst) 10ms-ээр хязгаарлавал бичлэг сунадаг — жинхэнэ хугацаагаар нь
  kept.push({ file: f.file, dur: Math.max(0.0005, (end - start) / 1000) });
}
const list = kept.map((k) => `file '${k.file.replace(/\\/g, "/").replace(/'/g, "'\\''")}'\nduration ${k.dur.toFixed(4)}`).join("\n") + `\nfile '${kept.at(-1).file.replace(/\\/g, "/")}'\n`;
writeFileSync(join(OUT, "frames.txt"), list);
console.log("frames", frames.length, "kept", kept.length, "offset", offset);
const trim = join(OUT, "app-trim.webm");
execFileSync(ffmpegPath, ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", join(OUT, "frames.txt"),
  "-vf", `scale=${W * DPR}:${H * DPR}:flags=lanczos,fps=30`, "-an",
  "-c:v", "libvpx-vp9", "-row-mt", "1", "-cpu-used", "4", "-deadline", "good", "-crf", "22", "-b:v", "0", trim], { stdio: "inherit" });
console.log("DONE", trim, JSON.stringify(marks));
