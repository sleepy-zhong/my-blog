#!/bin/sh
set -eu

SEED_DIR="${HOME_CAT_SEED_DIR:-/opt/bootstrap/home-cats}"
UPLOAD_ROOT="${UPLOAD_PATH:-/app/uploads}"
TARGET_DIR="$UPLOAD_ROOT/home-cats"

mkdir -p "$TARGET_DIR"

copied=0
for src in "$SEED_DIR"/*; do
  [ -f "$src" ] || continue

  name=$(basename "$src")
  dest="$TARGET_DIR/$name"

  if [ ! -f "$dest" ]; then
    cp "$src" "$dest"
    copied=$((copied + 1))
  fi
done

if [ "$copied" -gt 0 ]; then
  echo "Seeded $copied home-cat asset(s) into $TARGET_DIR"
fi

exec "$@"
