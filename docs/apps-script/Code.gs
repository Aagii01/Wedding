// ─── Supabase → Google Sheets sync ───────────────────────────────────────────
// Энэ файлын БҮХ агуулгыг Apps Script-ийн Code.gs руу хуулж тавина.
// (Wedding-Review sheet → Extensions → Apps Script → Code.gs)
//
// Хийх дараалал:
//   1. Кодыг бүтнээр солиод хадгал
//   2. Функцын жагсаалтаас `listFiles` → ▶ Run  (Drive эрх асуухад зөвшөөр)
//   3. Deploy → Manage deployments → ✏️ → Version: New version → Deploy
//
// Юу өөрчлөгдсөн бэ:
//   Нэг файл дотор таб хязгааргүй нэмэгдэхээ больж, идэвхтэй файлын таб
//   MAX_TABS_PER_FILE (15) хүрмэгц ДАРААГИЙН файл автоматаар үүснэ.
//   Одоо байгаа 30 таб Wedding-Review дотроо хэвээр — линк нь ажилласаар байна.
//   Аль хэдийн табтай event-ийн шинэ мөр үргэлж хуучин файл руугаа орно.

const SUPABASE_URL = 'https://bjixxbkzttcxgfkxcqvs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_eXQtr2RbvXseLPLOYMqCXg_Xb8pKDoc';

// Шинэ файл үүсэх Drive фолдерын ID. Хоосон бол My Drive-ийн үндэст үүснэ.
// Фолдерын URL-аас авна: drive.google.com/drive/folders/1AbCdEf...  ← энэ хэсэг
const FOLDER_ID = '';

// Нэг файлд хэдэн хурим (таб) багтаах. Хүрмэгц дараагийн файл автоматаар үүснэ.
const MAX_TABS_PER_FILE = 15;
const FILE_PREFIX = 'One Wedding — RSVP';

const HEADERS = ['Огноо', 'Төрөл', 'Нэр', 'Утас', 'Ирц', 'Зочид тоо', 'Ерөөл'];
const DATE_FORMAT = 'yyyy-MM-dd HH:mm';


function doPost(e) {
  // Хоёр webhook зэрэг ирэхэд давхар таб/файл үүсэхээс сэргийлнэ
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const body  = JSON.parse(e.postData.contents);
    const table = body.table;                 // 'rsvp' | 'wishes'
    const rec   = body.record || {};
    const eventId = rec.event_id || rec.event || 'unknown';

    const sheet = getEventSheet(slugFor(eventId));
    const created = rec.created_at ? new Date(rec.created_at) : new Date();

    let row;
    if (table === 'rsvp') {
      // Бүх загварт guests = 0 бол ирэхгүй, >= 1 бол тэр тооны хүнтэй ирнэ
      const n = Number(rec.guests) || 0;
      row = [created, 'Ирц', rec.name || '', rec.phone || '',
             n >= 1 ? 'очино' : 'очихгүй', n, rec.message || ''];
    } else {
      row = [created, 'Ерөөл', rec.name || '', '', '', '', rec.message || ''];
    }
    sheet.appendRow(row);
    sheet.getRange(sheet.getLastRow(), 1).setNumberFormat(DATE_FORMAT);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}


// ─── Event-ийн табыг олох / үүсгэх ───────────────────────────────────────────
function getEventSheet(slug) {
  const props = PropertiesService.getScriptProperties();

  // 1) Өмнө нь олдсон файлаас нь шууд (хамгийн хурдан зам)
  const cached = props.getProperty('ss_' + slug);
  if (cached) {
    const hit = tabIn(cached, slug);
    if (hit) return hit;
  }

  // 2) Бүх файлаас хайна — шинэ файлаас нь эхэлж
  const ids = fileIds();
  for (let i = ids.length - 1; i >= 0; i--) {
    const hit = tabIn(ids[i], slug);
    if (hit) {
      props.setProperty('ss_' + slug, ids[i]);
      return hit;
    }
  }

  // 3) Хаана ч байхгүй бол шинэ event → идэвхтэй файлд таб үүсгэнэ
  return createTab(slug);
}

function tabIn(fileId, slug) {
  try {
    return SpreadsheetApp.openById(fileId).getSheetByName(slug) || null;
  } catch (_) {
    return null;   // файл устсан / эрх байхгүй
  }
}

function createTab(slug) {
  const ids = fileIds();
  let activeId = ids[ids.length - 1];
  if (tabCount(activeId) >= MAX_TABS_PER_FILE) activeId = createNewFile();

  const ss = SpreadsheetApp.openById(activeId);
  const sheet = ss.insertSheet(slug);
  sheet.appendRow(HEADERS);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(7, 320);
  sheet.getRange('A:A').setNumberFormat(DATE_FORMAT);

  // Шинэ файлын хоосон "Sheet1"-г эхний жинхэнэ таб үүсмэгц устгана
  const blank = ss.getSheetByName('Sheet1');
  if (blank && ss.getSheets().length > 1) ss.deleteSheet(blank);

  PropertiesService.getScriptProperties().setProperty('ss_' + slug, activeId);
  return sheet;
}


// ─── Файлын жагсаалт ба эргэлт ───────────────────────────────────────────────
// Жагсаалт Script Properties-д JSON-оор хадгалагдана. Эхний утга нь энэ
// (скрипт суусан) файл — өөрөөр хэлбэл одоогийн Wedding-Review.
function fileIds() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('files');
  if (raw) return JSON.parse(raw);
  const ids = [SpreadsheetApp.getActiveSpreadsheet().getId()];
  props.setProperty('files', JSON.stringify(ids));
  return ids;
}

function tabCount(fileId) {
  try {
    return SpreadsheetApp.openById(fileId).getSheets().filter(function (s) {
      return s.getName() !== 'Sheet1';
    }).length;
  } catch (_) {
    return MAX_TABS_PER_FILE;   // нээж чадахгүй бол дүүрсэнд тооцно
  }
}

function createNewFile() {
  const ids = fileIds();
  const ss = SpreadsheetApp.create(FILE_PREFIX + ' #' + (ids.length + 1));
  ss.getSheets()[0].setName('Sheet1');   // анхдагч таб (эхний event дээр устна)
  if (FOLDER_ID) {
    try {
      DriveApp.getFileById(ss.getId()).moveTo(DriveApp.getFolderById(FOLDER_ID));
    } catch (_) {}
  }
  ids.push(ss.getId());
  PropertiesService.getScriptProperties().setProperty('files', JSON.stringify(ids));
  return ss.getId();
}


// ─── Гараар ажиллуулах туслах функцууд ───────────────────────────────────────
// Файлуудын жагсаалт, линк, таб тоог Execution log дээр харуулна
function listFiles() {
  fileIds().forEach(function (id, i) {
    try {
      const ss = SpreadsheetApp.openById(id);
      Logger.log('#' + (i + 1) + '  ' + ss.getName() +
                 '  (' + tabCount(id) + ' таб)  ' + ss.getUrl());
    } catch (_) {
      Logger.log('#' + (i + 1) + '  ' + id + '  ← нээгдэхгүй байна');
    }
  });
}

// Дүүрэхээс нь өмнө гараар дараагийн файл рүү шилжих
function startNewFile() {
  Logger.log('Шинэ файл: ' + SpreadsheetApp.openById(createNewFile()).getUrl());
}


// ─── Хуучин (legacy) туслах — аль хэдийн ажиллуулсан ─────────────────────────
// 6 баганатай эртний таб-уудыг 7 багана болгож шилжүүлдэг. Шинэ таб бүр аль
// хэдийн зөв бүтэцтэй үүсдэг тул шаардлагагүй. Дахин ажиллуулсан ч аюулгүй.
function migrateExistingTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheets().forEach(function (sheet) {
    if (sheet.getRange(1, 5).getValue() === 'Ирц') return;  // аль хэдийн шилжсэн
    const last = sheet.getLastRow();
    if (last < 1) return;                                   // хоосон таб

    sheet.insertColumnBefore(5);   // шинэ E = Ирц. Хуучин E→F, F→G болно
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(7, 320);
    sheet.getRange('A:A').setNumberFormat(DATE_FORMAT);
    if (last < 2) return;          // зөвхөн толгойтой таб

    const rows = sheet.getRange(2, 2, last - 1, 5).getValues();  // B..F
    rows.forEach(function (r) {
      if (r[0] === 'Ирэлт') r[0] = 'Ирц';
      else if (r[0] === 'Хүсэл') r[0] = 'Ерөөл';
      if (r[0] === 'Ирц') {
        const n = Number(r[4]) || 0;               // F = хуучин Зочид
        r[3] = n >= 1 ? 'очино' : 'очихгүй';       // E = шинэ Ирц
      }
    });
    sheet.getRange(2, 2, last - 1, 5).setValues(rows);
  });
}


// ─── Туслах ──────────────────────────────────────────────────────────────────
// event_id → slug (ойлгомжтой таб нэр). Олдохгүй бол event_id-г өөрийг нь ашиглана.
function slugFor(eventId) {
  let name = eventId;
  try {
    const url = SUPABASE_URL + '/rest/v1/events?id=eq.' +
                encodeURIComponent(eventId) + '&select=slug';
    const res = UrlFetchApp.fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
      muteHttpExceptions: true,
    });
    const data = JSON.parse(res.getContentText());
    if (Array.isArray(data) && data[0] && data[0].slug) name = data[0].slug;
  } catch (_) {}
  // Google Sheet таб нэрэнд хориотой тэмдэгт ( : \ / ? * [ ] ) болон уртыг засна
  return String(name).replace(/[:\\\/?*\[\]]/g, '-').substring(0, 90) || 'unknown';
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
