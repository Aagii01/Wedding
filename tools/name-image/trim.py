"""Chrome headless-ийн ил тод screenshot-оос нэрийн PNG гаргана.
Дээд/доод талын хоосон зайг тайрна, ӨРГӨНИЙГ ХЭВЭЭР (1170px) үлдээнэ —
template дээр 3:1 харьцаагаар (390px viewport) яг таарч гарах учиртай.
Хэрэглээ: python trim.py raw.png ../../public/names/<slug>.png   (pip install pillow)
"""
import sys
from PIL import Image

# Windows console cp1252 дээр кирилл хэвлэхэд унахгүй
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

im = Image.open(sys.argv[1]).convert("RGBA")
# alpha > 40: сүүдрийн бүдэг ирмэгийг биш, жинхэнэ үсгийн бэхийг хэмжинэ
ink = im.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
if not ink:
    sys.exit("Ил тод биш эсвэл хоосон зураг — --default-background-color=00000000 өгсөн эсэхийг шалга")
print("canvas", im.size, "| үсгийн bbox", ink, "| зүүн/баруун зай:", ink[0], im.width - ink[2])
if ink[0] < 20 or im.width - ink[2] < 20:
    print("⚠️  Татлага захад хэт ойрхон — HTML дахь fit коэффициентийг (0.90) багасга")
out = im.crop((0, max(0, ink[1] - 12), im.width, min(im.height, ink[3] + 12)))
out.save(sys.argv[2], optimize=True)
print("хадгалав", sys.argv[2], out.size)
