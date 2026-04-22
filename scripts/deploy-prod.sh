#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

cd "$PROJECT_ROOT"

if [ ! -f ".env.production" ]; then
  echo "Missing .env.production in $PROJECT_ROOT"
  exit 1
fi

echo "[1/5] Validating docker compose..."
docker compose config >/dev/null

echo "[2/5] Building backend image..."
docker compose build backend

echo "[3/5] Building frontend image..."
docker compose build frontend

echo "[4/5] Starting mysql, redis, backend and frontend..."
docker compose up -d --remove-orphans mysql redis backend frontend

echo "[5/5] Current compose status:"
docker compose ps
