#!/usr/bin/env bash
# Нэрийн PNG үүсгэх: Chrome headless (ил тод дэвсгэр, 1170px) → trim.py
#   bash tools/name-image/make.sh hero.html  ../../public/names/<slug>.png
#   bash tools/name-image/make.sh verse.html ../../public/names/<slug>-verse.png
# Шаардлага: Google Chrome, python + pillow (pip install pillow), champion.woff2 энэ хавтсанд.
# Дэлгэрэнгүй: docs/name-image-font.md
set -e
cd "$(dirname "$0")"
HTML="${1:?html файл өг}"; OUT="${2:?гаралтын png өг}"; H="${3:-1300}"
[ -f champion.woff2 ] || { echo "champion.woff2 байхгүй — docs/name-image-font.md-ийн 'Фонт файл' хэсгийг үз"; exit 1; }
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
HERE="$(cygpath -m "$PWD" 2>/dev/null || pwd)"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --default-background-color=00000000 --user-data-dir="$HERE/.chrome-profile" \
  --window-size=1170,"$H" --virtual-time-budget=10000 \
  --screenshot="$HERE/raw.png" "file:///$HERE/$HTML" 2>/dev/null
"${PYTHON:-python}" trim.py raw.png "$OUT"
