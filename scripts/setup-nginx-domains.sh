#!/usr/bin/env bash
# Nginx domain configlerini kurar. Root veya sudo yetkisi gerekir.
# Ilk kurulumda bir kez calistir: sudo bash scripts/setup-nginx-domains.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/home/beratav/fullstack-eticaret}"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

echo "==> Nginx domain configleri kuruluyor"

for conf in "$APP_DIR/deploy/nginx/"*.conf; do
  name="$(basename "$conf")"
  sudo cp "$conf" "$NGINX_AVAILABLE/$name"
  sudo ln -sf "$NGINX_AVAILABLE/$name" "$NGINX_ENABLED/$name"
  echo "   + $name"
done

sudo nginx -t
sudo systemctl reload nginx

echo "==> SSL sertifikasi (henuz yoksa):"
echo "    sudo certbot --nginx -d eticaretshop.com.tr -d www.eticaretshop.com.tr -d admin.eticaretshop.com.tr"
echo "==> Nginx hazir"
