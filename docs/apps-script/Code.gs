// ─── Supabase → Google Sheets sync ───────────────────────────────────────────
// Энэ файлын БҮХ агуулгыг Apps Script-ийн Code.gs руу хуулж тавина.
// (Wedding-Review sheet → Extensions → Apps Script → Code.gs)
//
// Хийх дараалал:
//   1. Кодыг бүтнээр солиод хадгал
//   2. Функцын жагсаалтаас `showIndex` → ▶ Run  (Drive эрх асуухад зөвшөөр)
//   3. Deploy → Manage deployments → ✏️ → Version: New version → Deploy
//
// Бүтэц:
//   • ШИНЭ урилга бүр өөрийн тусдаа файлтай — "Ирц", "Ерөөл" 2 таб, хураангуй
//     тоо, өнгө, filter-тэй. "Линктэй хүн үзэх" эрхтэйгээр автоматаар share
//     хийгдэнэ → захиалагч зөвхөн өөрийн хуримын мэдээллийг харна.
//   • Файл бүрийн линк "Special Day — Жагсаалт" файлд бүртгэгдэнэ (зөвхөн танд).
//     Захиалагч линкээ дахин асуувал тэндээс Ctrl+F-ээр хайна.
//   • ХУУЧИН урилгууд (Wedding-Review / RSVP #2 доторх таб-тай) хэвээрээ —
//     шинэ мөр нь хуучин таб руугаа, хуучин хэлбэрээр орсоор байна.

const SUPABASE_URL = 'https://bjixxbkzttcxgfkxcqvs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_eXQtr2RbvXseLPLOYMqCXg_Xb8pKDoc';

// Жагсаалтад урилгын линк бичихэд хэрэглэнэ. Домэйн солигдвол энд шинэчил.
const SITE_URL = 'https://wedding-silk-nine.vercel.app';

// Шинэ файлууд үүсэх Drive фолдерын ID. Хоосон бол My Drive-ийн үндэст үүснэ.
// Фолдерын URL-аас авна: drive.google.com/drive/folders/1AbCdEf...  ← энэ хэсэг
const FOLDER_ID = '';

const INDEX_NAME = 'Special Day — Жагсаалт';
const RSVP_TAB = 'Ирц';
const WISH_TAB = 'Ерөөл';
const RSVP_HEADERS = ['Огноо', 'Нэр', 'Утас', 'Ирц', 'Хүний тоо', 'Мэндчилгээ'];
const WISH_HEADERS = ['Огноо', 'Нэр', 'Ерөөл'];
const HEADER_ROW = 4;            // 1: гарчиг, 2: хураангуй, 3: хоосон, 4: толгой
const DATE_FORMAT = 'yyyy-MM-dd HH:mm';

// Өнгө — PoemSection-ий дулаан хүрэн өнгөтэй ижил гамма
const INK    = '#3a2e28';
const ACCENT = '#7d5a50';
const TINT   = '#f6efe9';
const STRIPE = '#faf6f2';

// Хуучин таб-уудын бүтэц (зөвхөн хуучин урилгад)
const LEGACY_HEADERS = ['Огноо', 'Төрөл', 'Нэр', 'Утас', 'Ирц', 'Зочид тоо', 'Ерөөл'];


function doPost(e) {
  // Хоёр webhook зэрэг ирэхэд давхар файл үүсэхээс сэргийлнэ
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const body  = JSON.parse(e.postData.contents);
    const table = body.table;                 // 'rsvp' | 'wishes' | 'events'
    const rec   = body.record || {};

    // Шинэ урилга үүсмэгц файлыг нь бэлдэнэ → линкийг анхны зочноос өмнө өгч болно
    if (table === 'events') {
      eventFile({ slug: safeName(rec.slug || rec.id), title: titleOf(rec) });
      return json({ ok: true });
    }

    const info = eventInfo(rec.event_id || rec.event || 'unknown');
    const created = rec.created_at ? new Date(rec.created_at) : new Date();
    // Бүх загварт guests = 0 бол ирэхгүй, >= 1 бол тэр тооны хүнтэй ирнэ
    const n = Number(rec.guests) || 0;
    const going = n >= 1 ? 'очино' : 'очихгүй';

    const legacy = legacySheet(info.slug);
    if (legacy) {
      legacy.appendRow(table === 'rsvp'
        ? [created, 'Ирц', rec.name || '', rec.phone || '', going, n, rec.message || '']
        : [created, 'Ерөөл', rec.name || '', '', '', '', rec.message || '']);
      legacy.getRange(legacy.getLastRow(), 1).setNumberFormat(DATE_FORMAT);
      return json({ ok: true });
    }

    const ss = eventFile(info);
    if (table === 'rsvp') {
      ss.getSheetByName(RSVP_TAB).appendRow(
        [created, rec.name || '', String(rec.phone || ''), going, n, rec.message || '']);
    } else {
      ss.getSheetByName(WISH_TAB).appendRow([created, rec.name || '', rec.message || '']);
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}


// ─── Урилга бүрийн файл ──────────────────────────────────────────────────────
// Файл байвал нээнэ, байхгүй (эсвэл гараар устгасан) бол шинээр үүсгэнэ.
function eventFile(info) {
  const props = PropertiesService.getScriptProperties();
  const key = 'file_' + info.slug;
  const existing = props.getProperty(key);
  if (existing) {
    try { return SpreadsheetApp.openById(existing); } catch (_) {}
  }

  const name = 'RSVP — ' + info.slug + (info.title ? ' (' + info.title + ')' : '');
  const ss = SpreadsheetApp.create(name);
  const rsvp = ss.getSheets()[0].setName(RSVP_TAB);
  const wish = ss.insertSheet(WISH_TAB);   // хураангуйн томьёо энэ табыг заадаг тул эхэлж үүсгэнэ
  buildRsvpTab(rsvp, info.title);
  buildWishTab(wish, info.title);
  ss.setActiveSheet(rsvp);

  const file = DriveApp.getFileById(ss.getId());
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (_) {}   // зарим акаунтад хориглосон байж болно — гараар share хийнэ
  moveToFolder(file);

  props.setProperty(key, ss.getId());
  indexSheet().appendRow([new Date(), info.slug, info.title, ss.getUrl(),
                          SITE_URL + '/i/' + info.slug]);
  return ss;
}

function buildRsvpTab(sheet, title) {
  layout(sheet, title || 'Ирцийн бүртгэл', RSVP_HEADERS, [140, 200, 110, 90, 90, 320]);
  const first = HEADER_ROW + 1;
  const rows = sheet.getMaxRows() - HEADER_ROW;

  // Хураангуй: ✅ Очих: 24 айл · 41 хүн   ❌ Очихгүй: 3   💌 Ерөөл: 12
  sheet.getRange(2, 1, 1, 6).setValues([[
    '✅ Очих',
    '=COUNTIF(D' + first + ':D,"очино")&" айл · "&SUMIF(D' + first + ':D,"очино",E' + first + ':E)&" хүн"',
    '❌ Очихгүй',
    '=COUNTIF(D' + first + ':D,"очихгүй")',
    '💌 Ерөөл',
    "=COUNTA('" + WISH_TAB + "'!B" + first + ':B)',
  ]]);

  sheet.getRange(first, 3, rows, 1).setNumberFormat('@');        // утасны эхний 0 алдагдахгүй
  sheet.getRange(first, 4, rows, 2).setHorizontalAlignment('center');
  sheet.getRange(first, 6, rows, 1).setWrap(true);

  const status = sheet.getRange(first, 4, rows, 1);
  sheet.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('очино')
      .setBackground('#d9ead3').setFontColor('#274e13').setRanges([status]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('очихгүй')
      .setBackground('#f4cccc').setFontColor('#990000').setRanges([status]).build(),
  ]);
}

function buildWishTab(sheet, title) {
  layout(sheet, title || 'Ерөөлүүд', WISH_HEADERS, [140, 200, 520]);
  const first = HEADER_ROW + 1;
  sheet.getRange(2, 1, 1, 2).setValues([['💌 Нийт ерөөл', '=COUNTA(B' + first + ':B)']]);
  sheet.getRange(first, 3, sheet.getMaxRows() - HEADER_ROW, 1).setWrap(true);
}

// Хоёр табын нийтлэг загвар: гарчиг, хураангуйн мөр, толгой, судал, filter
function layout(sheet, title, headers, widths) {
  const cols = headers.length;
  if (sheet.getMaxColumns() > cols) sheet.deleteColumns(cols + 1, sheet.getMaxColumns() - cols);

  sheet.getRange(1, 1, 1, cols).merge().setValue(title)
    .setFontSize(14).setFontWeight('bold').setFontColor(INK)
    .setBackground(TINT).setVerticalAlignment('middle').setHorizontalAlignment('center');
  sheet.setRowHeight(1, 40);
  sheet.getRange(2, 1, 1, cols).setFontWeight('bold').setFontColor(INK).setBackground(TINT);

  const body = sheet.getRange(HEADER_ROW, 1, sheet.getMaxRows() - HEADER_ROW + 1, cols);
  body.setVerticalAlignment('top');
  body.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false)
    .setHeaderRowColor(ACCENT).setFirstRowColor('#ffffff').setSecondRowColor(STRIPE);
  sheet.getRange(HEADER_ROW, 1, 1, cols).setValues([headers])
    .setFontWeight('bold').setFontColor('#ffffff');
  sheet.getRange(HEADER_ROW + 1, 1, sheet.getMaxRows() - HEADER_ROW, 1).setNumberFormat(DATE_FORMAT);

  widths.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });
  sheet.setFrozenRows(HEADER_ROW);
  body.createFilter();
}


// ─── Жагсаалт (бүх урилгын Excel линк) ───────────────────────────────────────
// Тусдаа файл — захиалагчдад share хийсэн Wedding-Review дотор БИШ, тэгэхгүй
// бол хуучин захиалагчид бүх шинэ линкийг харчихна.
function indexSheet() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('index');
  if (id) {
    try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (_) {}
  }
  const ss = SpreadsheetApp.create(INDEX_NAME);
  const sheet = ss.getSheets()[0].setName('Жагсаалт');
  sheet.appendRow(['Үүсгэсэн', 'Slug', 'Хос', 'Excel линк', 'Урилгын линк']);
  sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setFontColor('#ffffff').setBackground(ACCENT);
  sheet.setFrozenRows(1);
  [140, 220, 240, 380, 320].forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });
  sheet.getRange('A:A').setNumberFormat(DATE_FORMAT);
  moveToFolder(DriveApp.getFileById(ss.getId()));
  props.setProperty('index', ss.getId());
  return sheet;
}

// Гараар ажиллуулна: Жагсаалт файлын линкийг Execution log дээр харуулна
function showIndex() {
  Logger.log('Жагсаалт: ' + indexSheet().getParent().getUrl());
}


// ─── Хуучин урилгууд ─────────────────────────────────────────────────────────
// Wedding-Review / RSVP #2 дотор таб-тай урилга бол тэр табыг буцаана.
// Шинэ загварын файлтай болсон урилгыг дахин хайхгүй.
function legacySheet(slug) {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('file_' + slug)) return null;

  const cached = props.getProperty('ss_' + slug);
  if (cached) {
    const hit = tabIn(cached, slug);
    if (hit) return hit;
  }
  const ids = legacyFileIds();
  for (let i = ids.length - 1; i >= 0; i--) {
    const hit = tabIn(ids[i], slug);
    if (hit) {
      props.setProperty('ss_' + slug, ids[i]);
      return hit;
    }
  }
  return null;
}

function tabIn(fileId, slug) {
  try {
    return SpreadsheetApp.openById(fileId).getSheetByName(slug) || null;
  } catch (_) {
    return null;   // файл устсан / эрх байхгүй
  }
}

function legacyFileIds() {
  const raw = PropertiesService.getScriptProperties().getProperty('files');
  return raw ? JSON.parse(raw) : [SpreadsheetApp.getActiveSpreadsheet().getId()];
}


// ─── Туслах ──────────────────────────────────────────────────────────────────
// event_id → { slug, title }. Олдохгүй бол event_id-г slug болгож ашиглана.
function eventInfo(eventId) {
  let ev = {};
  try {
    const url = SUPABASE_URL + '/rest/v1/events?id=eq.' + encodeURIComponent(eventId) +
                '&select=slug,title,person1_name,person2_name';
    const res = UrlFetchApp.fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
      muteHttpExceptions: true,
    });
    const data = JSON.parse(res.getContentText());
    if (Array.isArray(data) && data[0]) ev = data[0];
  } catch (_) {}
  return { slug: safeName(ev.slug || eventId), title: titleOf(ev) };
}

function titleOf(ev) {
  if (ev.person1_name && ev.person2_name) return ev.person1_name + ' & ' + ev.person2_name;
  return ev.title || ev.person1_name || '';
}

// Таб/файлын нэрэнд хориотой тэмдэгт ( : \ / ? * [ ] ) болон уртыг засна
function safeName(name) {
  return String(name).replace(/[:\\\/?*\[\]]/g, '-').substring(0, 90) || 'unknown';
}

function moveToFolder(file) {
  if (!FOLDER_ID) return;
  try { file.moveTo(DriveApp.getFolderById(FOLDER_ID)); } catch (_) {}
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
