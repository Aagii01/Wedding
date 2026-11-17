// Байршлын товч дарахад гарах Google Maps-ийн дэлгэцийн зураг (out/maps-33.jpg).
// Утасны вэб Maps нь газрын мэдээллийн хуудсаар газрын зургаа халхалдаг тул зүү тэмдэгтэй
// цэвэр газрын зураг авахын тулд embed хувилбарыг (iframe дотор) утасны хэмжээгээр зурна.
//   node maps-shot.mjs "The Continental Hotel Ulaanbaatar" maps-33.jpg
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { launch } from "./det.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "out"); mkdirSync(OUT, { recursive: true });
const [query = "The Continental Hotel Ulaanbaatar", outName = "maps-33.jpg", zoom = "16"] = process.argv.slice(2);

const html = join(OUT, "maps-embed.html");
writeFileSync(html, `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;overflow:hidden}iframe{border:0;width:100%;height:100%;display:block}</style>
<iframe src="https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&hl=mn&output=embed"></iframe>`);

const m = await launch({ width: 390, height: 844, dpr: 3, mobile: true, port: 9344, profile: join(OUT, "chrome-maps").split("\\").join("/") });
await m.goto(pathToFileURL(html).href, { det: false, wait: 9000 });
await m.shot(join(OUT, outName));
await m.close();
console.log("DONE", join(OUT, outName));
