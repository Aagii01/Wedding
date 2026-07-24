// ─── Supabase → Google Sheets sync ───────────────────────────────────────────
// Google Sheet → Extensions → Apps Script → Code.gs-ийн БҮХ агуулгыг үүгээр солино.
// Дараа нь: (1) хадгал  (2) migrateExistingTabs-г Run  (3) Deploy → New version
const SUPABASE_URL = 'https://bjixxbkzttcxgfkxcqvs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_eXQtr2RbvXseLPLOYMqCXg_Xb8pKDoc';

const HEADERS = ['Огноо', 'Төрөл', 'Нэр', 'Утас', 'Ирц', 'Зочид тоо', 'Ерөөл'];
const DATE_FORMAT = 'yyyy-MM-dd HH:mm';

function doPost(e) {
  try {
    const body  = JSON.parse(e.postData.contents);
    const table = body.table;                 // 'rsvp' | 'wishes'
    const rec   = body.record || {};
    const eventId = rec.event_id || rec.event || 'unknown';

    const sheet = getOrCreateTab(tabNameFor(eventId));
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
  }
}

function getOrCreateTab(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(7, 320);
    sheet.getRange('A:A').setNumberFormat(DATE_FORMAT);
  }
  return sheet;
}

// ─── НЭГ УДАА ажиллуулах: хуучин таб-уудыг шинэ бүтэц рүү шилжүүлэх ──────────
// Хуучин таб 6 баганатай (… E Зочид | F Зурвас / Хүсэл), шинэ мөр 7 утгатай ирнэ.
// Дахин ажиллуулсан ч аюулгүй — шилжсэн таб-ыг алгасна.
function migrateExistingTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheets().forEach(sheet => {
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
    rows.forEach(r => {
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

function tabNameFor(eventId) {
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
  return String(name).replace(/[:\\\/?*\[\]]/g, '-').substring(0, 90) || 'unknown';
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
