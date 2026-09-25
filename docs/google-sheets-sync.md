# RSVP / Wishes → Google Sheets (Supabase Webhook)

Захиалагч өөрийн event-ийн RSVP болон хүслийн мэдээллийг Google Sheet дээр
шууд хянах боломжтой болгох тохиргоо.

**Урсгал:**
```
Зочин форм бөглөнө
  → Supabase rsvp / wishes table-д мөр орно
  → Supabase Database Webhook автоматаар POST хийнэ
  → Google Apps Script web app
  → Google Sheet дээр тухайн event-ийн таб руу мөр нэмнэ
```

Frontend код огт өөрчлөгдөхгүй. Supabase хэвээрээ үлдэнэ (AdminPage ажиллана).
Sheet нь зөвхөн **толин тусгал (mirror)** — захиалагчид зориулсан.

## Файл эргэлт (rotation) — таб хэт олон болохоос сэргийлнэ

Нэг файл дотор таб хязгааргүй нэмэгдвэл захиалагчид хайхад төвөгтэй болно.
Тиймээс скрипт нь **идэвхтэй файлын таб `MAX_TABS_PER_FILE` (15) хүрмэгц
дараагийн файлыг автоматаар үүсгээд** шинэ event-үүдийг тэнд бичдэг.

```
Wedding-Review (одоогийн, 30 таб)   ← дүүрсэн. Одоо байгаа 30 захиалагч
                                       хуучин линкээрээ хэвийн орно
One Wedding — RSVP #2 (0 → 15 таб)  ← шинэ event-үүд энд орно
One Wedding — RSVP #3               ← #2 дүүрэхэд автоматаар үүснэ
```

**Чухал:** аль хэдийн таб-тай event-ийн шинэ мөр **үргэлж хуучин файл руугаа**
орно (скрипт бүх файлаас таб-ыг нь хайж олдог). Тиймээс өгсөн линкүүд эвдрэхгүй.

**Бүх template-д нэгэн адил хамаарна.** Энэ скрипт нь `rsvp` / `wishes` хүснэгтэд
орж ирсэн мөрийг л боловсруулдаг тул аль загвараас ирснээс үл хамаарч ижил
багана, ижил нэршилтэй гарна. `guests` баганын утга загвар бүрт өөр
(T11 нь зөвхөн `1`/`0`, T12/13/14/15 нь жинхэнэ хүний тоо) — гэхдээ **`0` бол
ирэхгүй, `≥1` бол ирнэ** гэсэн дүрэм бүх загварт адил тул `очино` / `очихгүй`-г
найдвартай тооцно.

---

## 1. Бэлтгэл

- Скрипт нь одоогийн **`Wedding-Review`** файл дотроо суусаар байна — өөрчлөхгүй.
- Drive дээр фолдер үүсгэ (жишээ нь "One Wedding — RSVP"). Шинэ файлууд тэнд
  үүсэж, эмх цэгцтэй байна. Фолдерын URL-аас ID-г хуулж ав:
  `https://drive.google.com/drive/folders/`**`1AbCdEf...`** ← энэ хэсэг.
  (Заавал биш — хоосон орхивол My Drive-ийн үндэст үүснэ.)

## 2. Apps Script байрлуулах

1. `Wedding-Review` Sheet дотроо: **Extensions → Apps Script**
2. Доорх кодыг бүгдийг хуулж тавь (`Code.gs`-ийн агуулгыг бүрэн солих)
3. Дээд талын тохиргоог бөглөх:
   - `SUPABASE_ANON_KEY` — Supabase Dashboard → Project Settings → API →
     `anon` `public` key. (Энэ түлхүүр frontend-д аль хэдийн нээлттэй тул аюулгүй.)
   - `FOLDER_ID` — 1-р алхмын фолдерын ID (хүсвэл хоосон орхиж болно)
   - `MAX_TABS_PER_FILE` — нэг файлд хэдэн хурим багтаах (анхдагч 15)
4. **Save** → дээд талын функцын жагсаалтаас `listFiles`-г сонгоод **▶ Run**
   → Google зөвшөөрөл асууна (шинэ файл үүсгэхэд **Drive** эрх хэрэгтэй тул
   заавал зөвшөөрөх). Execution log дээр одоогийн файл, түүний таб тоо гарна.
5. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**
   ← ЗААВАЛ. Эс тэгвээс webhook хуучин кодыг дуудсаар байна.
   (Анх удаа бол: **Deploy → New deployment → ⚙️ → Web app**,
   **Execute as:** Me, **Who has access:** **Anyone** → Deploy, гарах
   `https://script.google.com/macros/s/.../exec` URL-г хуулж ав.)

```javascript
// ─── Supabase → Google Sheets sync ───────────────────────────────────────────
const SUPABASE_URL = 'https://bjixxbkzttcxgfkxcqvs.supabase.co';
const SUPABASE_ANON_KEY = 'PASTE_YOUR_ANON_KEY_HERE';

// Шинэ файл үүсэх Drive фолдерын ID. Хоосон бол My Drive-ийн үндэст үүснэ.
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
    // rsvp table-д багана нэр зөрүүтэй (event эсвэл event_id) тул хоёуланг шалгана
    const eventId = rec.event_id || rec.event || 'unknown';

    const sheet = getEventSheet(slugFor(eventId));
    const created = rec.created_at ? new Date(rec.created_at) : new Date();

    let row;
    if (table === 'rsvp') {
      // Бүх template дээр guests = 0 бол ирэхгүй, >= 1 бол тэр тооны хүнтэй ирнэ.
      // (T11 нь зөвхөн 1/0 бичдэг, T12/13/14/15 нь жинхэнэ хүний тоог бичнэ.)
      const n = Number(rec.guests) || 0;
      row = [created, 'Ирц', rec.name || '', rec.phone || '',
             n >= 1 ? 'очино' : 'очихгүй', n, rec.message || ''];
    } else { // wishes
      row = [created, 'Ерөөл', rec.name || '', '', '', '', rec.message || ''];
    }
    sheet.appendRow(row);
    // Огноог огнооны форматтай харуулна (эс тэгвээс түүхий тоо болж харагдана)
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
// (скрипт суусан) файл — өөрөөр хэлбэл одоогийн 30 табтай Wedding-Review.
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
// хэдийн зөв бүтэцтэй үүсдэг тул шаардлагагүй, гэхдээ шилжээгүй эртний таб
// байвал ажиллуулж болно. Дахин ажиллуулсан ч аюулгүй.
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
```

## 3. Supabase Database Webhook тохируулах

(Аль хэдийн тохируулсан бол алгасна — URL өөрчлөгдөөгүй.)

Supabase Dashboard → **Database → Webhooks** → **Create a new hook**.

**`rsvp` table-д:**
- **Name:** `rsvp_to_sheets`
- **Table:** `rsvp`
- **Events:** ✅ Insert
- **Type:** HTTP Request
- **Method:** `POST`
- **URL:** дээрх Apps Script web app URL
- **HTTP Headers:** `Content-Type: application/json`
- **Create**

**`wishes` table-д дахин нэг hook** (ижил алхам, зөвхөн Table = `wishes`, Name = `wishes_to_sheets`).

## 4. Туршилт

1. Урилгын хуудас руу ор → RSVP / хүсэл бөглөж илгээ
2. Хэдэн секундын дотор:
   - **хуучин event** бол `Wedding-Review` доторх өөрийнх нь таб руу мөр орно
   - **шинэ event** бол `One Wedding — RSVP #2` файл автоматаар үүсэж,
     тэнд slug нэртэй таб гарна (`listFiles` ажиллуулж линкийг нь хараарай)
3. Хэрэв мөр орохгүй бол:
   - Deploy хийхдээ **New version** сонгосон эсэхийг шалга
   - Apps Script deployment-ийн **"Who has access" = Anyone** эсэхийг шалга
   - Supabase → Webhooks → тухайн hook → **Logs** хэсгээс хариу/алдааг хар
   - Apps Script → **Executions** хэсгээс алдааны мессеж хар

## 5. Захиалагчид өгөх

- Аль файлд байгааг нь `listFiles`-ээр хараад, тэр файлыг **View only**-оор
  share хийж линк өгнө (одоогийнхтой ижил ажлын урсгал).
- Илүү нягт байлгах бол: тухайн таб дээр баруун товч → **Protect sheet**,
  эсвэл шинэ Sheet рүү `IMPORTRANGE`-ээр зөвхөн тэр табыг татаж, тэр файлыг
  л share хийнэ.

---

### Тэмдэглэл
- Одоогийн 30 захиалагч **хуучин линкээрээ хэвээр** орно — юу ч өөрчлөгдөхгүй.
- Slug өөрчлөгдвөл шинэ таб үүснэ (хуучин таб хэвээр үлдэнэ).
- Файл дүүрэхээс өмнө гараар шилжих бол `startNewFile`-г Run дарна.
- `MAX_TABS_PER_FILE`-г хэдийд ч өөрчилж болно — зөвхөн ДАРААГИЙН файл үүсэх
  цэгт нөлөөлнө, байгаа файлууд хэвээрээ.
- `events` table нь public read зөвшөөрөлтэй тул slug lookup анон key-ээр ажиллана.
- Энэ нь нэг чиглэлийн mirror — Sheet дээр гараар засвал Supabase-руу буцахгүй.
