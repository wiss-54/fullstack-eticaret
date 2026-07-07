#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/beratav/fullstack-eticaret}"
BACKEND_DIR="$APP_DIR/backend"

echo "==> Deploy basliyor: $APP_DIR"

cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main

cd "$BACKEND_DIR"
npm ci --omit=dev

if pm2 describe eticaret-backend > /dev/null 2>&1; then
  pm2 restart eticaret-backend
else
  pm2 start ecosystem.config.cjs
fi

pm2 save

echo "==> Health check"
sleep 3
curl -fsS http://localhost:5000/api/test-db

echo "==> Deploy tamamlandi"
