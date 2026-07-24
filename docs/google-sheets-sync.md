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

**Бүх template-д нэгэн адил хамаарна.** Энэ скрипт нь `rsvp` / `wishes` хүснэгтэд
орж ирсэн мөрийг л боловсруулдаг тул аль загвараас ирснээс үл хамаарч ижил
багана, ижил нэршилтэй гарна. `guests` баганын утга загвар бүрт өөр
(T11 нь зөвхөн `1`/`0`, T12/13/14/15 нь жинхэнэ хүний тоо) — гэхдээ **`0` бол
ирэхгүй, `≥1` бол ирнэ** гэсэн дүрэм бүх загварт адил тул `очино` / `очихгүй`-г
найдвартай тооцно.

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

const HEADERS = ['Огноо', 'Төрөл', 'Нэр', 'Утас', 'Ирц', 'Зочид тоо', 'Ерөөл'];
const DATE_FORMAT = 'yyyy-MM-dd HH:mm';

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
// Хуучин таб 6 баганатай (… E Зочид | F Зурвас / Хүсэл). Шинэ мөр 7 утгатай
// ирэх тул шилжүүлэхгүй бол багана зөрнө. Apps Script editor дээр дээд талын
// функцын жагсаалтаас `migrateExistingTabs`-г сонгоод ▶ Run дарна. Дахин
// ажиллуулсан ч аюулгүй (шилжсэн таб-ыг алгасна).
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

## 2.5. Хуучин таб байвал — нэг удаагийн шилжүүлэг

Хэрэв Sheet дээр өмнөх хувилбараар үүссэн таб байгаа бол тэдгээр нь **6 баганатай**
(`… E Зочид | F Зурвас / Хүсэл`), харин шинэ мөр **7 утгатай** ирнэ. Шилжүүлэхгүй
бол багана зөрж бичигдэнэ.

Apps Script editor дээр дээд талын функцын жагсаалтаас **`migrateExistingTabs`**-г
сонгоод **▶ Run** дарна. Энэ нь таб бүрт:
- шинэ `Ирц` багана нэмж, толгойг `Огноо | Төрөл | Нэр | Утас | Ирц | Зочид тоо | Ерөөл` болгоно
- `Ирэлт` → `Ирц`, `Хүсэл` → `Ерөөл` болгож солино
- хуучин зочдын тооноос `очино` / `очихгүй`-г бөглөнө
- огнооны баганад огнооны формат тавина

Дахин ажиллуулсан ч аюулгүй — шилжсэн таб-ыг алгасна.

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
