#!/bin/sh
# Renderiza vem-ai-hero.html em PNG 1152 × 672 (2x) e copia para public/email/ (hospedagem no Vercel).
# Uso: sh docs/email/assets/render-hero.sh
set -e
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --window-size=576,336 --allow-file-access-from-files \
  --screenshot="$PWD/vem-ai-hero.png" "file://$PWD/vem-ai-hero.html"
mkdir -p ../../../public/email
cp vem-ai-hero.png ../../../public/email/vem-ai-hero.png
echo "vem-ai-hero.png gerado"
