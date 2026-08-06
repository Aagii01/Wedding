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
 *   og:image нь event-ийн main_image биш, төрөл тус бүрт НЭГ нийтлэг зураг:
 *     хурим (болон бусад) → public/og-default.jpg
 *     хүүхдийн урилга      → public/og-child.png
 *     байгууллагын урилга  → event-ийн өөрийн зураг (gallery_photos[0] →
 *       person1_photo). Хуримын og-default.jpg-г ХЭЗЭЭ Ч ашиглахгүй; зураг
 *       олдохгүй бол og:image огт бичихгүй (текстэн preview).
 *   Шалтгаан: main_image ихэвчлэн босоо, зарим event дээр дутуу бөглөгдсөн тул
 *   Facebook-ийн 1.91:1 тайралтад муу гардаг. Зураг солих бол зөвхөн public/
 *   доторх файлыг солино — код хөндөх шаардлагагүй.
 *   Урилга бүрт өөр зураг хэрэгтэй болбол `og_image` багана нэмж, FIELDS-д
 *   нэмээд `event.og_image || OG_IMAGE` болгоно.
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

const FIELDS =
  "title,type,template,date,venue_name,person1_name,person2_name,person1_photo,gallery_photos";

// Preview зургууд — event бүрийн өөрийн зураг биш, төрөл тус бүрт нэг нийтлэг
// зураг (public/ дотор, build-д dist/-руу хуулагдана).
const OG_IMAGE = "/og-default.jpg";       // хурим болон бусад
const OG_IMAGE_CHILD = "/og-child.png";   // хүүхдийн (сэвлэг үргээх) урилга

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
  child: "Сэвлэг үргээх ёслолын урилга",
  corporate: "Албан ёсны урилга",
  apartment: "Шинэ байрны цайллагын урилга",
};

// Хуримын урилга биш төрлүүд — preview дээр "One Wedding" нэр ба хуримын
// og-default.jpg гарах ёсгүй. (Байгууллагынхыг isCorporate тусад нь мэднэ.)
function isNonWedding(event) {
  return isCorporate(event) || event.type === "apartment";
}

// Байгууллагын урилга дээр хуримын нэр (One Wedding) ба хуримын preview зураг
// гарах ёсгүй. type='corporate' эсвэл Template20 бол компанийн мэдээлэл гарна.
function isCorporate(event) {
  return event.type === "corporate" || String(event.template) === "20";
}

// Байгууллагын preview зураг: өөрийн байгууллагын зургийг ашиглана. Нийтлэг
// хуримын og-default.jpg-г ХЭЗЭЭ Ч ашиглахгүй — байхгүй бол зураггүй preview
// (Facebook текстээр л харуулна) нь хуримын зураг гарснаас дээр.
function corporateImage(event) {
  const badge = Array.isArray(event.gallery_photos)
    ? event.gallery_photos.find(Boolean)
    : null;
  return badge || event.person1_photo || null;
}

function buildTags(event, url, origin) {
  // Хүүхдийн урилга дээр person2_name нь эцэг эхийн нэр эсвэл хоосон байдаг
  // тул хосын нэр шиг нийлүүлэхгүй — зөвхөн ганц нэр гаргана.
  const isChild = event.type === "child";
  const corporate = isCorporate(event);
  const nonWedding = isNonWedding(event);
  const org = (event.person1_name || "").trim();
  const names = isChild
    ? (event.title || event.person1_name || "").trim()
    : [event.person1_name, event.person2_name]
        .map((name) => name?.trim())
        .filter(Boolean)
        .join(" & ");
  const kind = KIND[corporate ? "corporate" : event.type] || "Урилга";

  // Шинэ байрны цайллага дээр эзэдийн нэр preview-д гарахгүй — зөвхөн төрөл.
  const hideNames = event.type === "apartment";

  const title = corporate
    ? (org ? `${org} — ${kind}` : event.title || kind)
    : hideNames ? kind
    : names ? `${names} — ${kind}` : event.title || kind;

  // Байгууллагын урилга дээр арга хэмжээний нэр нь гол мэдээлэл тул
  // тайлбарын эхэнд орно.
  const description = (corporate
    ? [event.title, formatDate(event.date), event.venue_name]
    : [formatDate(event.date), event.venue_name]
  ).filter(Boolean).join(" · ");

  // Хуримын биш урилга дээр нийтлэг og-default.jpg (хуримын зураг) хэрэглэхгүй —
  // event-ийн өөрийн зураг, байхгүй бол зураггүй текстэн preview.
  const image = nonWedding
    ? corporateImage(event)
    : origin + (isChild ? OG_IMAGE_CHILD : OG_IMAGE);

  const tags = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(nonWedding ? (corporate && org ? org : "Цахим урилга") : "One Wedding")}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:locale" content="mn_MN" />`,
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
  ];

  // Зураг байхгүй бол og:image-г огт бичихгүй — хоосон content нь Facebook
  // дээр эвдэрсэн preview үүсгэдэг.
  if (image) {
    tags.push(
      `<meta property="og:image" content="${esc(image)}" />`,
      `<meta name="twitter:image" content="${esc(image)}" />`,
    );
  }

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
