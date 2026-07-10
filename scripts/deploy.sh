#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/beratav/fullstack-eticaret}"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
DOMAIN="${DOMAIN:-https://test.hatiraniyarat.com}"

echo "==> Deploy basliyor: $APP_DIR"

cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main

COMMIT_SHA="$(git rev-parse --short HEAD)"
DEPLOYED_AT="$(date -Iseconds)"
echo "{\"commit\":\"$COMMIT_SHA\",\"deployedAt\":\"$DEPLOYED_AT\"}" > "$BACKEND_DIR/.deploy-info.json"

echo "==> Backend"
cd "$BACKEND_DIR"
npm ci --omit=dev

if pm2 describe eticaret-backend > /dev/null 2>&1; then
  pm2 restart eticaret-backend
else
  pm2 start ecosystem.config.cjs
fi

echo "==> Frontend"
cd "$FRONTEND_DIR"
npm ci
NEXT_PUBLIC_API_URL="$DOMAIN" npm run build

if pm2 describe eticaret-frontend > /dev/null 2>&1; then
  pm2 restart eticaret-frontend --update-env
else
  pm2 start ecosystem.config.cjs
fi

pm2 save

echo "==> Health check"
sleep 5
curl -fsS http://localhost:5000/api/test-db
curl -fsS http://localhost:3000 > /dev/null

echo "==> Deploy tamamlandi"
