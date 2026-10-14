# RSVP / Wishes → Google Sheets (Supabase Webhook)

Захиалагч өөрийн урилгын ирц, ерөөлийг Google Sheet дээр шууд хянах тохиргоо.

**Урсгал:**
```
Зочин форм бөглөнө
  → Supabase rsvp / wishes table-д мөр орно
  → Supabase Database Webhook автоматаар POST хийнэ
  → Google Apps Script web app (docs/apps-script/Code.gs)
  → тухайн урилгын Sheet рүү мөр нэмнэ
```

Frontend код хөндөгдөхгүй. Sheet нь зөвхөн **толин тусгал (mirror)** — Sheet дээр
гараар засвал Supabase руу буцахгүй. Зочдын урилгын хуудас удаашрахгүй (webhook
ар талд ажилладаг).

## Бүтэц: нэг урилга = нэг файл

```
My Drive (эсвэл FOLDER_ID фолдер)
├── Special Day — Жагсаалт          ← ЗӨВХӨН ТАНД. Бүх урилгын Excel линк
├── RSVP — bat-saraa (Бат & Сараа)   ← захиалагч бүрд тусдаа, линкээр share
│     ├── Ирц     (хураангуй, очино/очихгүй өнгө, filter)
│     └── Ерөөл
└── RSVP — ...
```

- **Шинэ урилга бүр** өөрийн файлтай тул захиалагч зөвхөн өөрийн зочдыг харна.
  Файл "Anyone with the link → Viewer" эрхтэйгээр **автоматаар** share хийгдэнэ.
- **Файл үүсэх цаг:** `events` webhook (3-р алхам) тохируулсан бол урилга үүсгэсэн
  даруйд. Үгүй бол анхны зочин бүртгүүлэх үед.
- **Хуучин урилгууд** (`Wedding-Review`, `One Wedding — RSVP #2` доторх таб-тай)
  хэвээрээ — шинэ мөр нь хуучин таб руугаа хуучин хэлбэрээр орно. Өгсөн линкүүд эвдрэхгүй.

### "Ирц" табын загвар
```
┌──────────────────── Бат & Сараа ─────────────────────┐
│ ✅ Очих │ 24 айл · 41 хүн │ ❌ Очихгүй │ 3 │ 💌 Ерөөл │ 12 │   ← томьёо, автоматаар
│                                                        │
│ Огноо │ Нэр │ Утас │ Ирц │ Хүний тоо │ Мэндчилгээ      │   ← filter-тэй толгой
│ ...                     очино (ногоон) / очихгүй (улаан) │
```

## Линкийг хаанаас олох вэ
Захиалагч "линкээ дахиад явуулаач" гэвэл → **Special Day — Жагсаалт** файлыг нээгээд
`Ctrl+F` → slug эсвэл нэрээр хайна. Мөр бүрт Excel линк ба урилгын линк хоёулаа бий.
Жагсаалт файлын линкийг мартвал Apps Script дээр `showIndex` → ▶ Run.

> Жагсаалт нь `Wedding-Review` дотор биш тусдаа файл — `Wedding-Review`-г хуучин
> захиалагчид share хийсэн тул тэнд байвал бүх линк харагдах байсан. **Жагсаалт
> файлыг хэнд ч share хийж болохгүй.**

---

## 1. Бэлтгэл (заавал биш)
Drive дээр фолдер үүсгэ (жишээ нь "Special Day — RSVP"). URL-аас ID-г нь хуулж
Code.gs-ийн `FOLDER_ID`-д тавь:
`https://drive.google.com/drive/folders/`**`1AbCdEf...`** ← энэ хэсэг.
Хоосон орхивол My Drive-ийн үндэст үүснэ.

## 2. Apps Script байрлуулах
1. `Wedding-Review` Sheet → **Extensions → Apps Script**
2. [`docs/apps-script/Code.gs`](apps-script/Code.gs)-ийн агуулгыг бүтнээр нь хуулж тавина
3. Дээд талын тохиргоо: `SUPABASE_ANON_KEY`, `SITE_URL` (домэйн солигдвол), `FOLDER_ID`
4. **Save** → функцын жагсаалтаас `showIndex` → **▶ Run** → Google зөвшөөрөл асууна
   (файл үүсгэх, share хийхэд **Drive** эрх хэрэгтэй — заавал зөвшөөр).
   Execution log дээр Жагсаалт файлын линк гарна.
5. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**
   ← ЗААВАЛ. Эс тэгвээс webhook хуучин кодыг дуудсаар байна.
   (Анх удаа бол: **Deploy → New deployment → ⚙️ → Web app**, **Execute as:** Me,
   **Who has access:** Anyone → Deploy, гарах `.../exec` URL-г хуулж ав.)

## 3. Supabase Database Webhook-ууд
Supabase Dashboard → **Database → Webhooks** → **Create a new hook**. Гурвууланд нь:
**Events:** ✅ Insert · **Type:** HTTP Request · **Method:** POST ·
**URL:** Apps Script-ийн `.../exec` URL · **Header:** `Content-Type: application/json`

| Name | Table | Тэмдэглэл |
|------|-------|-----------|
| `rsvp_to_sheets` | `rsvp` | аль хэдийн байгаа |
| `wishes_to_sheets` | `wishes` | аль хэдийн байгаа |
| `events_to_sheets` | `events` | **шинэ** — урилга үүсмэгц файл бэлдэнэ |

## 4. Туршилт
1. `/create`-ээр туршилтын урилга үүсгэ → хэдэн секундэд Drive-д `RSVP — <slug>`
   файл гарч, Жагсаалтад мөр нэмэгдэнэ
2. Тэр урилга дээр ирц, ерөөл илгээ → "Ирц" / "Ерөөл" таб руу орж, хураангуй шинэчлэгдэнэ
3. Туршилтын урилгыг дараа нь устгах бол: Drive-аас файлыг, Жагсаалтаас мөрийг устгана
4. Мөр орохгүй бол:
   - Deploy хийхдээ **New version** сонгосон эсэх
   - Deployment-ийн **Who has access = Anyone** эсэх
   - Supabase → Webhooks → hook → **Logs**
   - Apps Script → **Executions** хэсгийн алдааны мессеж

---

### Тэмдэглэл
- Урилгын файлыг гараар устгавал дараагийн бүртгэл ирэхэд шинэ файл үүсч,
  Жагсаалтад шинэ мөр нэмэгдэнэ (шинэ линк).
- Slug өөрчлөгдвөл шинэ файл үүснэ (хуучин файл хэвээр үлдэнэ).
- Хязгаар: үнэгүй Google акаунт өдөрт ~250 файл үүсгэж чадна — хангалттай.
- `events` table нь public read тул slug, нэрийг anon key-ээр уншина.
