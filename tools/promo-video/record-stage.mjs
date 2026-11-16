// Pass 2 — stage.html-ийг (утасны mockup + гарчиг + эффект) 1080×1920-д бичиж,
// ffmpeg-ээр mp4 болгоно. Гаралт: out/promo.mp4
import { chromium } from "playwright";
import { readFileSync, renameSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "out");
const marks = JSON.parse(readFileSync(join(OUT, "marks.json"), "utf8"));

const browser = await chromium.launch({ headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
const tCtx = Date.now(); // бичлэг эндээс эхэлнэ — start() хүртэлх хэсгийг тайрна
const context = await browser.newContext({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT, size: { width: 1080, height: 1920 } },
});
const page = await context.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("page:", m.text()); });
await page.addInitScript((m) => { window.MARKS = m; }, marks);
await page.goto(pathToFileURL(join(here, "stage.html")).href, { waitUntil: "load" });
await page.evaluate(() => window.ready);
await page.waitForTimeout(500);
const total = await page.evaluate(() => window.TOTAL);
console.log("total seconds", total);
await page.evaluate(() => window.start());
const preamble = (Date.now() - tCtx) / 1000;
await page.waitForTimeout(Math.ceil(total * 1000) + 600);

const video = page.video();
await context.close();
const tmp = await video.path();
const webm = join(OUT, "stage.webm");
if (existsSync(webm)) renameSync(webm, webm + ".old");
renameSync(tmp, webm);
await browser.close();

// webm → mp4 (H.264, 30fps, утсанд тоглох yuv420p)
const mp4 = join(OUT, "promo.mp4");
execFileSync(ffmpegPath, ["-y", "-v", "error", "-ss", preamble.toFixed(2), "-i", webm, "-t", total.toFixed(2),
  "-r", "30", "-c:v", "libx264", "-preset", "slow", "-crf", "18",
  "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4], { stdio: "inherit" });
console.log("DONE", mp4, "preamble", preamble.toFixed(2));
