#!/bin/sh
# Baut die ZIP-Datei aus diesem Ordner, ohne Oberordner. Aufruf: sh scripts/make-zip.sh 0.4
set -e
VERSION="${1:-0.1}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/../jarvis-inoni-v${VERSION}.zip"
python3 -I - "$ROOT" "$OUT" <<'EOF'
import os, sys, zipfile
root, out = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for d, dirs, files in os.walk(root):
        dirs[:] = sorted(x for x in dirs if x not in (".git", "node_modules", ".wrangler"))
        for f in sorted(files):
            if f.endswith(".zip"):
                continue
            p = os.path.join(d, f)
            z.write(p, os.path.relpath(p, root))
EOF
echo "jarvis-inoni-v${VERSION}.zip erstellt"
