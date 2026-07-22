#!/usr/bin/env bash
set -euo pipefail

# GitHub Actions SSH oturumunda PATH bos gelebiliyor.
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH:-}"

# Deploy yalnizca CI (main push) ile. Feature branch / manuel SSH deploy yasak.
# Acil durum disinda ALLOW_MANUAL_DEPLOY kullanma.
if [[ "${DEPLOY_SOURCE:-}" != "github-actions" && "${ALLOW_MANUAL_DEPLOY:-}" != "1" ]]; then
  echo "ERROR: Deploy sadece GitHub Actions uzerinden (main branch) calisir."
  echo "       PR merge → CI yesil → main push → otomatik deploy."
  echo "Acil durum (kayit tutarak): ALLOW_MANUAL_DEPLOY=1 bash scripts/deploy.sh"
  exit 1
fi

APP_DIR="${APP_DIR:-/home/beratav/fullstack-eticaret}"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
DOMAIN="${DOMAIN:-https://eticaretshop.com.tr}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"

echo "==> Deploy basliyor: $APP_DIR (branch: origin/$DEPLOY_BRANCH)"

cd "$APP_DIR"
git fetch origin "$DEPLOY_BRANCH"

if [[ "$DEPLOY_BRANCH" != "main" && "${ALLOW_NON_MAIN_DEPLOY:-}" != "1" ]]; then
  echo "ERROR: Sadece main deploy edilebilir (istenen: $DEPLOY_BRANCH)."
  exit 1
fi

git reset --hard "origin/$DEPLOY_BRANCH"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD || true)"
echo "==> HEAD: $(git rev-parse --short HEAD) (ref: $CURRENT_BRANCH)"

COMMIT_SHA="$(git rev-parse --short HEAD)"
DEPLOYED_AT="$(date -Iseconds)"
echo "{\"commit\":\"$COMMIT_SHA\",\"deployedAt\":\"$DEPLOYED_AT\",\"branch\":\"$DEPLOY_BRANCH\",\"source\":\"${DEPLOY_SOURCE:-manual}\"}" > "$BACKEND_DIR/.deploy-info.json"

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

echo "==> Nginx uploads proxy (SSL configleri bozulmadan)"
if command -v nginx >/dev/null 2>&1 && [ -f "$APP_DIR/scripts/patch-nginx-uploads.py" ]; then
  if sudo -n true 2>/dev/null; then
    sudo -n python3 "$APP_DIR/scripts/patch-nginx-uploads.py"
    sudo -n nginx -t
    sudo -n systemctl reload nginx
  else
    echo "WARN: passwordless sudo yok; nginx patch atlandi."
    echo "WARN: Gerekirse manuel: sudo python3 $APP_DIR/scripts/patch-nginx-uploads.py && sudo nginx -t && sudo systemctl reload nginx"
  fi
fi

echo "==> Health check"
sleep 5
curl -fsS http://localhost:5000/api/test-db
curl -fsS http://localhost:3000 > /dev/null

echo "==> Deploy tamamlandi (yalnizca origin/$DEPLOY_BRANCH)"
