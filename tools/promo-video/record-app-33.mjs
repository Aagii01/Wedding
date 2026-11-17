// Pass 1 (T33) — /demo/33-ийг "цаас урах" intro + ?to= нэртэйгээр КАДР КАДРААР бичнэ (det.mjs).
// Гаралт: out/app-33.mp4 (бүх кадр keyframe → stage дээр яг seek хийнэ), out/marks-33.json,
// Байршлын товч дарахад гарах Google Maps-ийн дэлгэцийг тусад нь: node maps-shot.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import { launch, byText } from "./det.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "out"); mkdirSync(OUT, { recursive: true });
const BASE = process.env.APP_BASE || "http://127.0.0.1:5200";
const TO = process.env.TO_NAME || "Б. Батбаяр";
const URL_ = `${BASE}/demo/33?intro=tear&to=${encodeURIComponent(TO)}`;
const W = 390, H = 844, DPR = 3;
const QUICK = process.env.QUICK === "1";           // зөвхөн эхний хэсгийг турших
const prof = (n) => join(OUT, `chrome-${n}`).split("\\").join("/");

const p = await launch({ width: W, height: H, dpr: DPR, mobile: true, port: 9342, profile: prof("app") });
await p.goto(URL_, { wait: 3500 });
// Шинэ таб нээхгүй (Maps товч) + зургуудыг урьдчилж ачаална (гүйлгэх үед хоосон гарахгүй)
await p.ev(`(async () => {
  window.open = () => null;
  document.addEventListener("click", (e) => { const a = e.target.closest && e.target.closest("a[target=_blank]"); if (a) e.preventDefault(); }, true);
  const urls = new Set([...document.images].map((i) => i.currentSrc || i.src).filter(Boolean));
  for (const el of document.querySelectorAll("*")) { const bg = getComputedStyle(el).backgroundImage || ""; const i = bg.indexOf("url("); if (i < 0) continue;
    const u = bg.slice(i + 4, bg.indexOf(")", i)).split('"').join("").split("'").join(""); if (u.startsWith("http")) urls.add(u); }
  await Promise.all([...urls].map((u) => new Promise((r) => { const im = new Image(); im.onload = im.onerror = r; im.src = u; })));
  await document.fonts.ready;
})()`);
await p.record(join(OUT, "frames-33"));

// ── Intro: цаас урагдана (5.2с), 3.35с-д нэртэй карт тодорно ──
p.mark("intro");
await p.run(3.4); p.mark("name");
await p.run(2.9);                                   // карт дээрх бичвэр бүрэн гарч, гялалзана
await p.click(`document.querySelector("video")`);   // дарвал урилга руу шилжинэ
p.mark("open");
await p.run(1.7);                                   // intro бүдгэрч арилна
p.mark("hero");
await p.run(1.7);                                   // ойн тоо 0→N

if (!QUICK) {
  // Урилгын үг (Эрхэм хүндэт …)
  await p.scrollToEl(`document.getElementById("t33-letter")`, 0.52, 1.0); await p.run(1.0);
  p.mark("letter"); await p.run(1.3);

  // Цомог
  await p.scrollToEl(`document.querySelector('button[aria-label="Зураг 1 томруулах"]')`, 0.36, 1.2); await p.run(1.2);
  p.mark("gallery"); await p.run(0.9);

  // Хөтөлбөр
  await p.scrollToEl(byText("Хөтөлбөр", "h2"), 0.16, 1.1); await p.run(1.1);
  p.mark("schedule"); await p.run(1.2);

  // Тоологч
  await p.scrollToEl(byText("Секунд"), 0.42, 1.2); await p.run(1.2);
  p.mark("countdown"); await p.run(1.3);

  // Байршил → "Google Maps-р харах" (stage дээр Maps-ийн дэлгэц дээгүүр нь гулсаж орно)
  const mapBtn = `[...document.querySelectorAll("a")].find((a) => a.textContent.includes("Google Maps"))`;
  await p.scrollToEl(mapBtn, 0.62, 1.0); await p.run(1.0);
  p.mark("venue"); await p.run(0.7);
  const mc = await p.click(mapBtn); p.mark("map-click"); if (mc) p.marks.at(-1).at = [mc.fx, mc.fy];
  await p.run(3.0); p.mark("map-back"); await p.run(0.4);

  // Ирц: нэр, утас, хүний тоо → илгээх (demo → DB-д бичихгүй)
  const nameIn = `document.getElementById("t33-rsvp-name")`;
  await p.scrollToEl(nameIn, 0.3, 1.0); await p.run(1.0);
  p.mark("rsvp");
  await p.click(nameIn); await p.run(0.2); await p.type("Б. Батбаяр", 0.06);
  await p.click(`document.getElementById("t33-rsvp-phone")`); await p.run(0.15); await p.type("99112233", 0.055);
  const plus = `document.querySelector('button[aria-label="Нэмэх"]')`;
  await p.click(plus); await p.run(0.3); await p.click(plus); await p.run(0.35);
  const send = `[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Бүртгүүлэх")`;
  await p.scrollToEl(send, 0.6, 0.6); await p.run(0.6);
  const sc = await p.click(send); p.mark("rsvp-send"); if (sc) p.marks.at(-1).at = [sc.fx, sc.fy];
  await p.run(1.9);

  // Footer
  await p.scrollTo(1e9, 1.1); await p.run(1.1);
  p.mark("footer"); await p.run(0.9);
}
p.mark("end");
const total = p.t;
writeFileSync(join(OUT, "marks-33.json"), JSON.stringify({ fps: p.fps, total, marks: p.marks }, null, 2));
await p.close();

// Кадрууд → mp4 (GOP=1: кадр бүр keyframe, stage дээр seek яг таарна)
const mp4 = join(OUT, "app-33.mp4");
execFileSync(ffmpegPath, ["-y", "-v", "error", "-framerate", String(p.fps), "-i", join(OUT, "frames-33", "f%06d.jpg"),
  "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-g", "1", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4], { stdio: "inherit" });
console.log("DONE", mp4, total.toFixed(2) + "s");
