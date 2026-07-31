/*
 * ============================================================================
 * Facebook / Messenger / Instagram линк preview (OG meta tags)
 * ============================================================================
 *
 * Юу хийдэг вэ:
 *   /i/:slug линкийг хуваалцахад зураг + хосын нэр + огноотой preview гаргах.
 *   Сошиал сүлжээний crawler JavaScript ажиллуулдаггүй тул meta tag-ийг
 *   серверээс HTML дотор шингээж өгөх ёстой.
 *
 * Хэрхэн холбогдсон (vercel.json):
 *   "functions": { "api/invite.js": { "includeFiles": "dist/index.html" } },
 *   "rewrites": [
 *     { "source": "/i/:slug", "destination": "/api/invite?slug=:slug" },
 *     { "source": "/(.*)",    "destination": "/index.html" }
 *   ]
 *   ⚠️ /i/:slug мөр нь /(.*)-аас ӨМНӨ байх ёстой.
 *
 * УНТРААХ (асуудал гарвал): файлыг `api/invite.js.disabled` болгож нэрлээд
 *   vercel.json-оос functions блок ба /i/:slug мөрийг хас. Эсвэл Vercel
 *   dashboard-аас Instant Rollback хийвэл шууд буцна.
 *
 * Зураг:
 *   og:image нь хосын main_image биш, бүх урилгад НИЙТЛЭГ public/og-default.jpg.
 *   Шалтгаан: main_image ихэвчлэн босоо тул Facebook-ийн 1.91:1 тайралтад
 *   толгой тасардаг. Урилга бүрт өөр зураг хэрэгтэй болбол `og_image` багана
 *   нэмж, FIELDS-д нэмээд `event.og_image || OG_IMAGE` болгоно.
 *   ⚠️ Баганыг Supabase дээр ҮҮСГЭХЭЭС ӨМНӨ FIELDS-д нэмбол 400 алдаа буцаж,
 *   бүх урилгын preview унана.
 *
 * Алдаа гарвал:
 *   Supabase дуудлага try/catch дотор — дата аваагүй ч урилга хэвийн ачаална,
 *   зөвхөн preview л дутна.
 *
 * Шалгах:
 *   https://developers.facebook.com/tools/debug/
 *   (Facebook OG датаг cache хийдэг тул "Scrape Again" дарах хэрэгтэй.)
 * ============================================================================
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const FIELDS = "title,type,date,venue_name,person1_name,person2_name";

// Бүх урилгад нийтлэг preview зураг (public/ дотор, build-д хуулагдана).
const OG_IMAGE = "/og-default.jpg";

let cachedShell = null;

// Build-ээс гарсан index.html-ийг уншина (disk → fetch fallback).
async function getShell(host) {
  if (cachedShell) return cachedShell;
  try {
    cachedShell = await readFile(join(process.cwd(), "dist/index.html"), "utf8");
  } catch {
    const res = await fetch(`https://${host}/index.html`);
    cachedShell = await res.text();
  }
  return cachedShell;
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// "2026-07-15" → "2026 оны 7 сарын 15"
function formatDate(date) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? "");
  if (!m) return "";
  return `${m[1]} оны ${Number(m[2])} сарын ${Number(m[3])}`;
}

const KIND = {
  wedding: "Хуримын урилга",
  birthday: "Төрсөн өдрийн урилга",
  reunion: "Уулзалтын урилга",
};

function buildTags(event, url, origin) {
  const names = [event.person1_name, event.person2_name]
    .map((name) => name?.trim())
    .filter(Boolean)
    .join(" & ");
  const kind = KIND[event.type] || "Урилга";

  const title = names ? `${names} — ${kind}` : event.title || kind;
  const description = [formatDate(event.date), event.venue_name]
    .filter(Boolean)
    .join(" · ");

  const image = origin + OG_IMAGE;
  const tags = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="One Wedding" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:locale" content="mn_MN" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
  ];

  if (description) {
    tags.push(
      `<meta name="description" content="${esc(description)}" />`,
      `<meta property="og:description" content="${esc(description)}" />`,
      `<meta name="twitter:description" content="${esc(description)}" />`,
    );
  }

  return { title, tags: tags.join("\n    ") };
}

export default async function handler(req, res) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const slug = String(req.query.slug || "").replace(/[^a-zA-Z0-9_-]/g, "");

  let html = await getShell(host);

  try {
    const query = `${SUPABASE_URL}/rest/v1/events?slug=eq.${slug}&select=${FIELDS}&limit=1`;
    const response = await fetch(query, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    const [event] = await response.json();

    if (event) {
      const origin = `https://${host}`;
      const { title, tags } = buildTags(event, `${origin}/i/${slug}`, origin);
      html = html
        .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
        .replace("</head>", `  ${tags}\n    </head>`);
    }
  } catch {
    // Дата авч чадаагүй ч урилга нь хэвийн ачаална — зөвхөн preview л дутна.
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
  res.status(200).send(html);
}
