# "Цаас урах" intro — нэг видео, олон нэр

Бээлийтэй гар ногоон цаасыг урж, дотроос нь урилгын карт гарна. Видео нь **нэргүй, хоосон карттай
ганц файл**; зочны нэр, урилгын бичвэрийг вэб дээр HTML-ээр картын дээр тавьдаг. Тиймээс `?to=Нэр`
бүрт видео дахин үүсгэх шаардлагагүй.

Эх санаа: https://www.instagram.com/reels/DfOYJf0RgEw/ (2026-11-13-нд туршсан).

## Одоогийн байдал

- Туршилтаар **Template33**-д хийгдсэн: `Template33.tsx` → `TearIntro`.
- Асаах: config `"intro": { "tear": true }`, эсвэл config-гүйгээр URL-д `?intro=tear`.
- Турших: `/demo/33?intro=tear&to=Б.%20Батбаяр`
- Видео: `public/intro/tear-green.mp4` (720×1280, 5.2 сек, 0.65MB), poster `tear-green.jpg`.
- Эх файл (1080×1920, 3.9MB) захиалагчийн компьютерт: `Downloads/Luxury green flat lay photo/2.mp4`.

## Хэрхэн ажилладаг

1. Видео `object-fit: cover`-оор дэлгэцийг бүрхэнэ (desktop дээр 523px өргөнд хязгаарлагдана).
2. Картын байрлалыг видеоны 1080×1920 нэгжээр хэмжиж кодод бичсэн (`TEAR_TRACK`).
   AI видеонд карт төгсгөлд бага зэрэг шилждэг тул бичвэр `requestAnimationFrame`-ээр
   `video.currentTime`-ийг уншиж картыг кадр бүрт дагана.
3. Карт бүрэн ил гарах мөчид (`TEAR_TEXT_AT` = 3.35 сек) бичвэр мөр мөрөөр тодорно.
   `mix-blend-mode: multiply` → цаасны ширхэг бичвэрийн цаанаас харагдана.
4. Видео дууссанаас `TEAR_HOLD_MS` (2.6 сек) дараа урилга руу шилжинэ; дарвал шууд.

Хязгаарлалт: нэр зөвхөн карт бүрэн ил гарсны дараа гарна. Эх бичлэг шиг нүхээр цухуйлгах бол
цаасны доорх хэсгийг цул хөх/ягаан өнгөөр үүсгүүлж, `<canvas>`-аар chroma key хийх хэрэгтэй
(хийгдээгүй).

## Видео үүсгэх prompt

Текстээс шууд видео хийлгэхээс **эхний ба сүүлийн кадрыг зургаар гаргаад "first + last frame"
видео** (Kling, Veo, Runway) хийлгэх нь тогтвортой. Камер хөдлөхгүй байх нь хамгийн чухал.
Доорх нь санал болгосон prompt-ууд; яг ашигласан хувилбар өөр байж болно.

**1. Эхний кадр (зураг)**
```
Top-down flat lay photo, vertical 9:16. A smooth sheet of dark forest-green
matte paper fills the entire frame. Two hands in cream satin gloves rest on
the paper, fingertips pinching the center. An emerald ring on one finger.
Soft studio lighting, gentle shadows, luxury editorial style. No text.
```

**2. Сүүлийн кадр (зураг; эхний кадрыг reference болгож өгнө)**
```
Same scene, same camera, same lighting. The green paper is now torn open
from the center, ragged curled edges peeled back toward the frame borders.
In the opening lies a blank cream invitation card with a thin gold scalloped
border, perfectly centered, perfectly flat, completely empty — no text,
no logo, no ornament inside. Gloved hands rest at the top corners.
```
Chroma key хувилбарт картын оронд:
`a perfectly flat, uniform pure blue (#0000FF) surface, no shading, no texture`

**3. Видео (first + last frame)**
```
Locked-off overhead camera, no camera movement, no zoom. The gloved hands
pinch the center of the green paper and slowly tear it open outward in
several small pulls, ragged edges curling back, revealing what lies beneath.
Realistic paper physics, soft studio light, 5 seconds, smooth slow motion.
No text appears anywhere.
```

Зөвлөмж:
- "No text" гэж заавал бичнэ, эс бөгөөс картан дээр утгагүй үсэг гарна.
- 5–10 удаа үүсгээд сонгоно. Шалгуур: урагдалт аажим, нэг шат дамжлагатай (огцом cut биш),
  карт төгсгөлд хөдөлгөөнгүй, гар картын дунд хэсгийг халхлаагүй.
  (Туршилтын `1.mp4` нь огцом cut-тай байсан тул `2.mp4`-г сонгосон.)
- Өөр загварт өнгийг солино: T33-д хар цаас + алтан хүрээтэй карт илүү зохино.

## Шинэ видео нэмэх алхам

`tools/tear-intro/` (Python + OpenCV шаардана):

```bash
python tools/tear-intro/sheet.py video.mp4 sheet.jpg   # 12 кадрын тойм зураг
python tools/tear-intro/card.py  video.mp4             # кадр бүрийн картын хил (x, y)
```

1. `sheet.jpg`-аас карт бүрэн ил гарах секундийг олж `TEAR_TEXT_AT`-д бичнэ.
2. `card.py`-ийн гаралтаас картын дээд/доод ирмэгийг `TEAR_TRACK`-д `[секунд, дээд, доод]`
   хэлбэрээр, сүүлийн кадрын өргөн/өндрийг `TEAR_CARD_W/H`-д бичнэ. `card.py` нь 1080×1920
   видео, цайвар карт, бараан дэвсгэрт тааруулсан — өөр бол доторх босго, мужийг засна.
3. Видеог шахна (ffmpeg; энэ машинд суугаагүй тул `npm i ffmpeg-static`-аар түр авсан):
   ```bash
   ffmpeg -i video.mp4 -an -vf scale=720:1280 -c:v libx264 -profile:v main -pix_fmt yuv420p \
     -crf 25 -preset slow -movflags +faststart public/intro/<нэр>.mp4
   ffmpeg -i video.mp4 -frames:v 1 -vf scale=720:1280 -q:v 4 public/intro/<нэр>.jpg
   ```
4. Олон видеотой болбол `TEAR_*` тогтмолуудыг видео бүрийн объект болгож,
   `intro.tear: "<нэр>"`-ээр сонгодог болгоно.

## Өөр загварт ашиглах

`TearIntro` нь `event`, `to`, `onDone` авдаг бие даасан component. Өөр загварт хэрэглэхдээ
тусдаа файл руу гаргаж, картын доторх бичвэрийг (eyebrow, нэр, огноо) тухайн загварын
өгөгдлөөр солино. Хуримд: "Эрхэм хүндэт {to}" + хосын нэр + огноо.
