#!/usr/bin/env bash
set -euo pipefail

# Gunluk yedek: Postgres + uploads
# Cron ornegi (her gun 03:15):
#   15 3 * * * /home/beratav/fullstack-eticaret/scripts/backup.sh >> /home/beratav/backups/backup.log 2>&1

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH:-}"

APP_DIR="${APP_DIR:-/home/beratav/fullstack-eticaret}"
BACKEND_DIR="${BACKEND_DIR:-$APP_DIR/backend}"
ENV_FILE="${ENV_FILE:-$BACKEND_DIR/.env}"
UPLOAD_DIR="${UPLOAD_DIR:-$BACKEND_DIR/uploads}"
BACKUP_ROOT="${BACKUP_ROOT:-/home/beratav/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
STAMP="$(date +%Y%m%d_%H%M%S)"
DEST="$BACKUP_ROOT/$STAMP"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: .env bulunamadi: $ENV_FILE"
  exit 1
fi

# .env'den sadece DB_* oku (password icinde ozel karakter olabilir)
load_env_var() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | sed 's/\r$//')" || true
  if [[ -z "$line" ]]; then
    echo "ERROR: $key .env icinde yok"
    exit 1
  fi
  printf '%s' "${line#*=}" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

DB_USER="$(load_env_var DB_USER)"
DB_PASSWORD="$(load_env_var DB_PASSWORD)"
DB_HOST="$(load_env_var DB_HOST)"
DB_PORT="$(load_env_var DB_PORT)"
DB_NAME="$(load_env_var DB_NAME)"

mkdir -p "$DEST"

echo "==> Backup basladi: $DEST"

echo "==> Postgres dump"
export PGPASSWORD="$DB_PASSWORD"
pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --format=custom \
  --file="$DEST/${DB_NAME}.dump"
unset PGPASSWORD

if [[ -d "$UPLOAD_DIR" ]]; then
  echo "==> Uploads arsiv"
  tar -C "$(dirname "$UPLOAD_DIR")" -czf "$DEST/uploads.tar.gz" "$(basename "$UPLOAD_DIR")"
else
  echo "WARN: uploads klasoru yok, atlaniyor: $UPLOAD_DIR"
fi

{
  echo "createdAt=$(date -Iseconds)"
  echo "host=$(hostname)"
  echo "db=$DB_NAME"
  echo "appDir=$APP_DIR"
  echo "commit=$(git -C "$APP_DIR" rev-parse --short HEAD 2>/dev/null || echo unknown)"
} > "$DEST/meta.txt"

# Tek paket (kolay kopyalama)
tar -C "$BACKUP_ROOT" -czf "$BACKUP_ROOT/eticaret_${STAMP}.tar.gz" "$STAMP"
rm -rf "$DEST"

echo "==> Hazir: $BACKUP_ROOT/eticaret_${STAMP}.tar.gz"

echo "==> Eski yedekleri temizle (>${RETENTION_DAYS} gun)"
find "$BACKUP_ROOT" -maxdepth 1 -type f -name 'eticaret_*.tar.gz' -mtime "+${RETENTION_DAYS}" -print -delete || true

echo "==> Backup bitti"
