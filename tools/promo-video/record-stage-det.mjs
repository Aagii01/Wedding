// Pass 2 (детерминистик) — тайзыг (утасны mockup + гарчиг + эффект) КАДР КАДРААР зурж mp4 болгоно.
// record-stage.mjs-ээс ялгаа: бодит цагаар бичихгүй тул кадр алгасахгүй, гацалтгүй.
//   node record-stage-det.mjs stage-33.html marks-33.json promo-33.mp4
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import { launch } from "./det.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "out");
const [stage = "stage-33.html", marksFile = "marks-33.json", outName = "promo-33.mp4"] = process.argv.slice(2);
const marks = JSON.parse(readFileSync(join(OUT, marksFile), "utf8"));
const LIMIT = process.env.LIMIT ? +process.env.LIMIT : null;     // туршилтад: эхний N секунд

const p = await launch({ width: 1080, height: 1920, dpr: 1, port: 9343, profile: join(OUT, "chrome-stage").split("\\").join("/") });
await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.MARKS = ${JSON.stringify(marks)};` });
await p.goto(pathToFileURL(join(here, stage)).href, { wait: 2500 });
// Хуудасны скрипт бүрэн ачаалагдтал хүлээнэ (эс бөгөөс window.start тодорхойгүй байж болно)
for (let i = 0; i < 40 && !(await p.ev("typeof window.start === 'function' && !!window.ready")); i++) await new Promise((r) => setTimeout(r, 250));
await p.ev("window.ready");
const total = await p.ev("window.TOTAL");
console.log("total seconds", total);
await p.record(join(OUT, "frames-stage"));
await p.ev("window.start()");
await p.run(LIMIT ? Math.min(LIMIT, total) : total);
await p.close();

const mp4 = join(OUT, outName);
execFileSync(ffmpegPath, ["-y", "-v", "error", "-framerate", String(p.fps), "-i", join(OUT, "frames-stage", "f%06d.jpg"),
  "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4], { stdio: "inherit" });
console.log("DONE", mp4);
