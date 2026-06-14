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

---

## 1. Google Sheet үүсгэх

1. [sheets.new](https://sheets.new) дээр шинэ хүснэгт үүсгэ
2. Нэр өгөх: жишээ нь **"One Wedding — RSVP & Wishes"**
3. Анхдагч "Sheet1" таб-ийг үлдээж болно (скрипт event тус бүрд шинэ таб үүсгэнэ)

## 2. Apps Script байрлуулах

1. Тэр Sheet дотроо: **Extensions → Apps Script**
2. Доорх кодыг бүгдийг хуулж тавь (`Code.gs`-ийн агуулгыг бүрэн солих)
3. `SUPABASE_ANON_KEY`-г өөрийн түлхүүрээр солих
   (Supabase Dashboard → Project Settings → API → `anon` `public` key.
   Энэ түлхүүр frontend-д аль хэдийн нээлттэй тул аюулгүй.)
4. **Deploy → New deployment → ⚙️ → Web app**
   - **Execute as:** Me
   - **Who has access:** **Anyone**  ← заавал! Supabase энэ URL руу нэвтэрнэ
5. **Deploy** дарж, гарч ирэх **Web app URL**-г хуулж ав
   (`https://script.google.com/macros/s/.../exec` хэлбэртэй)

```javascript
// ─── Supabase → Google Sheets sync ───────────────────────────────────────────
const SUPABASE_URL = 'https://bjixxbkzttcxgfkxcqvs.supabase.co';
const SUPABASE_ANON_KEY = 'PASTE_YOUR_ANON_KEY_HERE';

const HEADERS = ['Огноо', 'Төрөл', 'Нэр', 'Утас', 'Зочид', 'Зурвас / Хүсэл'];

function doPost(e) {
  try {
    const body  = JSON.parse(e.postData.contents);
    const table = body.table;                 // 'rsvp' | 'wishes'
    const rec   = body.record || {};
    // rsvp table-д багана нэр зөрүүтэй (event эсвэл event_id) тул хоёуланг шалгана
    const eventId = rec.event_id || rec.event || 'unknown';

    const sheet = getOrCreateTab(tabNameFor(eventId));
    const created = rec.created_at ? new Date(rec.created_at) : new Date();

    let row;
    if (table === 'rsvp') {
      row = [created, 'Ирэлт', rec.name || '', rec.phone || '', rec.guests ?? '', rec.message || ''];
    } else { // wishes
      row = [created, 'Хүсэл', rec.name || '', '', '', rec.message || ''];
    }
    sheet.appendRow(row);

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
    sheet.setColumnWidth(6, 320);
  }
  return sheet;
}

// event_id → slug (ойлгомжтой таб нэр). Олдохгүй бол event_id-г өөрийг нь ашиглана.
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
  // Google Sheet таб нэрэнд хориотой тэмдэгт ( : \ / ? * [ ] ) болон уртыг засна
  return String(name).replace(/[:\\\/?*\[\]]/g, '-').substring(0, 90) || 'unknown';
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3. Supabase Database Webhook тохируулах

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
2. Хэдэн секундын дотор Google Sheet дээр тухайн event-ийн **slug нэртэй шинэ таб**
   үүсэж, мөр нэмэгдэнэ
3. Хэрэв мөр орохгүй бол:
   - Apps Script deployment-ийн **"Who has access" = Anyone** эсэхийг шалга
   - Supabase → Webhooks → тухайн hook → **Logs** хэсгээс хариу/алдааг хар
   - Apps Script → **Executions** хэсгээс алдааны мессеж хар

## 5. Захиалагчид өгөх

- Захиалагч бүрд **зөвхөн өөрийнх нь таб**-ыг харуулах бол: тухайн таб дээр
  баруун товч → **"Protect sheet"** эсвэл шинэ Sheet рүү `IMPORTRANGE`-ээр
  зөвхөн тэр табыг татаж, тэр файлыг л share хийнэ.
- Эсвэл бүх Sheet-ийг "View only" болгож линк өгөх (бүгд бие биенийхээ табыг харна).

---

### Тэмдэглэл
- Slug өөрчлөгдвөл шинэ таб үүснэ (хуучин таб хэвээр үлдэнэ).
- `events` table нь public read зөвшөөрөлтэй тул slug lookup анон key-ээр ажиллана.
- Энэ нь нэг чиглэлийн mirror — Sheet дээр гараар засвал Supabase-руу буцахгүй.
