#!/bin/sh
# Baut die ZIP-Datei aus diesem Ordner. Aufruf: sh scripts/make-zip.sh 0.2
set -e
VERSION="${1:-0.1}"
cd "$(dirname "$0")/../.."
python3 -m zipfile -c "jarvis-inoni-v${VERSION}.zip" jarvis-inoni
echo "jarvis-inoni-v${VERSION}.zip erstellt"
