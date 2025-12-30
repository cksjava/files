#!/usr/bin/env bash
set -euo pipefail

UI_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$UI_ROOT/../nostalgia-backend" && pwd)"
TARGET_DIR="$BACKEND_DIR/static/ui"

echo "==> UI: $UI_ROOT"
echo "==> Backend: $BACKEND_DIR"
echo "==> Target: $TARGET_DIR"

echo "==> Building UI..."
cd "$UI_ROOT"
npm install
npm run build

echo "==> Preparing target dir..."
rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"

echo "==> Copying dist -> backend static dir..."
cp -R "$UI_ROOT/dist/." "$TARGET_DIR/"

echo "==> Done."
echo "You can now serve it from backend at: http://<pi-ip>:3030/"
