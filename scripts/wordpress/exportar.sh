#!/bin/bash
# Exporta os anúncios do Subleasy atual (WordPress) para imports/, no formato subleasy-import v1.
# Uso: scripts/wordpress/exportar.sh [perfil-novamira]   (padrão: subleasy.com.br)
# Só lê o WordPress. O --yes é exigido porque a execução de PHP é marcada como potencialmente destrutiva.
set -euo pipefail

SITE="${1:-subleasy.com.br}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="$ROOT/imports"
STAMP="$(date +%Y%m%d-%H%M)"
OUT="$OUT_DIR/subleasy-wp-anuncios-$STAMP.json"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$OUT_DIR"
python3 -c "import json,sys; print(json.dumps({'code': open(sys.argv[1]).read()}))" "$ROOT/scripts/wordpress/export-anuncios.php" > "$TMP/input.json"
novamira --site "$SITE" run novamira/execute-php --input "@$TMP/input.json" --json --yes > "$TMP/raw.json"

python3 - "$TMP/raw.json" "$OUT" <<'PY'
import json, sys
raw = json.load(open(sys.argv[1]))
if not raw.get("ok"):
    sys.exit(f"Falha no Novamira: {raw.get('error')}")
data = raw["data"]
if data.get("errors"):
    sys.exit(f"Erro no PHP: {data['errors']}")
doc = data["return_value"]
if doc.get("format") != "subleasy-import":
    sys.exit("Resposta fora do formato subleasy-import")
json.dump(doc, open(sys.argv[2], "w"), ensure_ascii=False, indent=2)
s = doc["summary"]
print(f"{sys.argv[2]}")
print(f"{s['listings']} anúncios, {s['advertisers']} anunciantes: " + ", ".join(f"{k} {v}" for k, v in sorted(s["by_status"].items())))
PY
