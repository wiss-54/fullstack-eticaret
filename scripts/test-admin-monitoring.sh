#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-http://127.0.0.1:5000}"
USER="${ADMIN_USERNAME:-admin}"
PASS="${ADMIN_PASSWORD:-HatiraAdmin2026!}"

RESP=$(curl -s -X POST "$BASE/api/admin/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$USER\",\"password\":\"$PASS\"}")

echo "login: $RESP"

TOKEN=$(echo "$RESP" | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).token||""')

if [ -z "$TOKEN" ]; then
  echo "LOGIN_FAILED"
  exit 1
fi

STATUS=$(curl -s -w '\nHTTP:%{http_code}' "$BASE/api/admin/status" \
  -H "Authorization: Bearer $TOKEN")

echo "status: $STATUS"
