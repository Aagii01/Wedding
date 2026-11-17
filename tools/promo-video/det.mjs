// Детерминистик (кадр-кадраар) бичлэгийн хөдөлгүүр.
//
// Бодит цагаар бичихэд (CDP screencast / recordVideo) headless Chrome кадр алгасаж, scroll ба
// slide "гацаж" харагддаг. Энд хуудасны ЦАГИЙГ бүрэн өөрсдөө удирдана: Date, performance.now,
// setTimeout/Interval, requestAnimationFrame-ийг хуурамч цагаар сольж, CSS animation/transition-ийг
// Web Animations API-аар кадр бүрт яг тэр цагт нь тавина, <video>-г кадр бүрт seek хийнэ.
// Кадр бүрт: цагийг 1/FPS урагшлуулна → зураг авна. Компьютер хэр удаан байх нь хамаагүй —
// гаралт үргэлж жигд 30fps.
import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Хуудас ачаалахаас ӨМНӨ ордог скрипт: хуурамч цаг
const CLOCK = `(() => {
  if (window.__det) return;
  const R = { now: performance.now.bind(performance), Date, sT: setTimeout.bind(window), sI: setInterval.bind(window),
              raf: requestAnimationFrame.bind(window), play: HTMLMediaElement.prototype.play, pause: HTMLMediaElement.prototype.pause };
  let v = 0, live = true, lastReal = R.now();
  const epoch = R.Date.now();
  const timers = new Map(), rafs = new Map(), meta = new WeakMap(), tweens = [];
  let tid = 1, rid = 1, seeks = [];
  performance.now = () => v;
  class FDate extends R.Date {
    constructor(...a) { if (a.length === 0) super(epoch + v); else super(...a); }
    static now() { return epoch + v; }
  }
  window.Date = FDate;
  window.setTimeout = (fn, d = 0, ...a) => { const id = tid++; timers.set(id, { at: v + Math.max(0, +d || 0), fn, a, seq: id }); return id; };
  window.setInterval = (fn, d = 0, ...a) => { const id = tid++; const ev = Math.max(1, +d || 0); timers.set(id, { at: v + ev, fn, a, every: ev, seq: id }); return id; };
  window.clearTimeout = window.clearInterval = (id) => { timers.delete(id); };
  window.requestAnimationFrame = (fn) => { const id = rid++; rafs.set(id, fn); return id; };
  window.cancelAnimationFrame = (id) => { rafs.delete(id); };

  // <video>/<audio>: жинхэнэ тоглуулалтыг зогсоож, хуурамч цагаар seek хийнэ
  const startMedia = (el) => { if (!el.__playing) { el.__playing = true; el.__vt0 = v - (el.currentTime || 0) * 1000; el.__ended = false; } };
  HTMLMediaElement.prototype.play = function () { startMedia(this); return Promise.resolve(); };
  HTMLMediaElement.prototype.pause = function () { this.__playing = false; return R.pause.call(this); };
  document.addEventListener("play", (e) => { const el = e.target; R.pause.call(el); startMedia(el); }, true);

  function runTimers(until) {
    for (let guard = 0; guard < 20000; guard++) {
      let best = null;
      for (const [id, t] of timers) if (t.at <= until && (!best || t.at < best[1].at || (t.at === best[1].at && t.seq < best[1].seq))) best = [id, t];
      if (!best) break;
      const [id, t] = best; v = Math.max(v, t.at);
      if (t.every) t.at += t.every; else timers.delete(id);
      try { typeof t.fn === "function" ? t.fn(...t.a) : (0, eval)(t.fn); } catch (e) { console.error(e); }
    }
    v = until;
  }
  function runRaf() { const cur = [...rafs.values()]; rafs.clear(); for (const fn of cur) { try { fn(v); } catch (e) { console.error(e); } } }
  function runTweens() {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const w = tweens[i]; const k = Math.min(1, (v - w.t0) / w.dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;      // easeInOutCubic
      window.scrollTo(0, w.from + (w.to - w.from) * e);
      if (k >= 1) tweens.splice(i, 1);
    }
  }
  function syncAnims() {
    for (const a of document.getAnimations()) {
      let m = meta.get(a); if (!m) { m = { born: v }; meta.set(a, m); }
      if (m.done) continue;
      try {
        if (a.playState !== "paused") a.pause();
        const end = a.effect && a.effect.getComputedTiming().endTime; const t = v - m.born;
        if (end != null && isFinite(end) && t >= end) { m.done = true; a.finish(); } else a.currentTime = t;
      } catch (e) {}
    }
  }
  function syncMedia() {
    for (const el of document.querySelectorAll("video,audio")) {
      if (!el.__playing || !isFinite(el.duration)) continue;
      const tgt = (v - el.__vt0) / 1000;
      if (tgt >= el.duration) {
        el.__playing = false;
        if (!el.__ended) { el.__ended = true; if (el.tagName === "VIDEO") seek(el, el.duration); el.dispatchEvent(new Event("ended")); }
      } else if (el.tagName === "VIDEO") seek(el, tgt);
    }
  }
  function seek(el, t) {
    if (Math.abs(el.currentTime - t) < 0.0005) return;
    seeks.push(new Promise((res) => { el.addEventListener("seeked", () => res(), { once: true }); }));
    el.currentTime = t + 0.0005;
  }
  function step(dt) { runTimers(v + dt); runTweens(); runRaf(); syncAnims(); if (!live) syncMedia(); }
  R.sI(() => { if (!live) return; const n = R.now(); step(Math.min(100, n - lastReal)); lastReal = n; }, 16);

  window.__det = {
    now: () => v,
    // Гар удирдлагад шилжинэ: үүнээс хойш цаг зөвхөн step()-ээр урагшилна. Media энэ мөчөөс эхэлнэ.
    manual() { live = false; for (const el of document.querySelectorAll("video,audio")) if (el.__playing) el.__vt0 = v - (el.currentTime || 0) * 1000; },
    step,
    // seek дуусах + 2 жинхэнэ кадр (scroll event, IntersectionObserver, layout) хүлээнэ
    settled() {
      const s = seeks; seeks = [];
      return Promise.race([Promise.all(s), new Promise((r) => R.sT(r, 500))]).then(() => new Promise((res) => R.raf(() => R.raf(() => res()))));
    },
    scrollTo(y, ms) { const max = document.documentElement.scrollHeight - innerHeight; tweens.length = 0; tweens.push({ from: window.scrollY, to: Math.max(0, Math.min(max, y)), t0: v, dur: Math.max(1, ms) }); },
  };
})();`;

export async function launch({ width, height, dpr = 1, mobile = false, port = 9340, profile, fps = 30 }) {
  const args = ["--headless=new", "--no-proxy-server", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    "--hide-scrollbars", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "--allow-file-access-from-files",
    `--window-size=${width},${height}`, "about:blank"];
  const chrome = spawn(CHROME, args, { stdio: "ignore" });
  let ws;
  for (let i = 0; i < 60; i++) {
    try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); ws = new WebSocket(l.find((x) => x.type === "page").webSocketDebuggerUrl); break; }
    catch { await sleep(250); }
  }
  if (!ws) throw new Error("Chrome CDP-д холбогдож чадсангүй");
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { const p = pend.get(d.id); pend.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
    if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") console.log("page error:", d.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 300));
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: dpr, mobile });
  await send("Page.enable"); await send("Runtime.enable");

  const ev = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error("eval: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text) + "\n" + expression.slice(0, 200));
    return r.result.value;
  };
  let dir = null, n = 0; const marks = [];
  const page = {
    send, ev, fps, marks,
    // det: true → хуурамч цагтай; false → энгийн хуудас (жишээ нь Google Maps-ийн зураг авах)
    async goto(url, { det = true, wait = 2500 } = {}) {
      if (det) await send("Page.addScriptToEvaluateOnNewDocument", { source: CLOCK });
      await send("Page.navigate", { url }); await sleep(wait);
    },
    get t() { return n / fps; },
    mark(label) { marks.push({ t: +(n / fps).toFixed(3), label }); console.log("mark", label, (n / fps).toFixed(2)); },
    record(framesDir) { dir = framesDir; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true }); n = 0; return ev("__det.manual()"); },
    // seconds хугацааг кадр кадраар урагшлуулж, кадр бүрийг хадгална
    async run(seconds) {
      const count = Math.round(seconds * fps);
      for (let i = 0; i < count; i++) {
        await ev(`(__det.step(${1000 / fps}), __det.settled())`);
        const s = await send("Page.captureScreenshot", { format: "jpeg", quality: 93 });
        writeFileSync(join(dir, `f${String(n++).padStart(6, "0")}.jpg`), Buffer.from(s.data, "base64"));
      }
    },
    shot: async (file, format = "jpeg") => writeFileSync(file, Buffer.from((await send("Page.captureScreenshot", { format, quality: 93 })).data, "base64")),
    // Элементийг дэлгэцийн where (0=дээд … 0.5=төв … 1=доод) байрлалд ирэхээр жигд гүйлгэнэ
    scrollToEl: (finder, where, seconds) => ev(`(() => { const el = ${finder}; if (!el) return false; const r = el.getBoundingClientRect();
      __det.scrollTo(window.scrollY + r.top + r.height / 2 - innerHeight * ${where}, ${seconds * 1000}); return true; })()`),
    scrollTo: (y, seconds) => ev(`__det.scrollTo(${y}, ${seconds * 1000})`),
    // Элементийн төв (viewport-ийн 0..1 харьцаагаар) — stage дээр "дарах" цагираг зурахад
    async center(finder) { return ev(`(() => { const el = ${finder}; if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, fx: (r.left + r.width / 2) / innerWidth, fy: (r.top + r.height / 2) / innerHeight }; })()`); },
    async click(finder) {
      const c = await page.center(finder); if (!c) { console.log("click: олдсонгүй", finder); return null; }
      for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: c.x, y: c.y, button: "left", clickCount: 1 });
      return c;
    },
    async type(text, perChar = 0.06) { for (const ch of text) { await send("Input.insertText", { text: ch }); await page.run(perChar); } },
    async close() { try { ws.close(); } catch {} chrome.kill(); },
  };
  return page;
}

// Текстээр элемент олох JS илэрхийлэл (хамгийн гүн таарсан элемент)
export const byText = (text, tag = "*") =>
  `[...document.querySelectorAll(${JSON.stringify(tag)})].filter((e) => e.children.length === 0 && e.textContent.trim() === ${JSON.stringify(text)})[0]`;
