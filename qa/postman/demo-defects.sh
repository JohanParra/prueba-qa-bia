#!/usr/bin/env bash
# Demo rápida DEF-02 / DEF-03 (alternativa a Postman).
# Prerrequisito: API en :8080
set -euo pipefail

BASE="${BASE_URL:-http://127.0.0.1:8080}"
EMAIL="${AUTH_EMAIL:-admin@energia.local}"
PASS="${AUTH_PASSWORD:-admin123}"

echo "== Login =="
TOKEN=$(curl -s -X POST "$BASE/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "token OK (${#TOKEN} chars)"

auth=(-H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json')

echo
echo "== DEF-02a · buscar 109 (esperado count=1) =="
curl -s -X POST "$BASE/api/v1/meter/getAll" "${auth[@]}" \
  -d '{"filter":{"meter_id":"109"}}' \
  | python3 -c "import sys,json; b=json.load(sys.stdin); print('count=', b.get('count')); print([(r['meter_id'], r['status']) for r in b.get('rows',[])])"

echo
echo "== DEF-02b · buscar m-109 (BUG: hoy count=0) =="
curl -s -X POST "$BASE/api/v1/meter/getAll" "${auth[@]}" \
  -d '{"filter":{"meter_id":"m-109"}}' \
  | python3 -c "import sys,json; b=json.load(sys.stdin); print('count=', b.get('count'))"

echo
echo "== DEF-03 · M-106 detalle (BUG: status ALERT, debería NORMAL) =="
curl -s "$BASE/api/v1/meter/getById/M-106" -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; b=json.load(sys.stdin); a=b.get('anomaly') or {}; print('status=', b.get('status'), 'type=', a.get('type'))"

echo
echo "== DEF-03 · filtro ALERT (incluye M-106 hoy) =="
curl -s -X POST "$BASE/api/v1/meter/getAll" "${auth[@]}" \
  -d '{"filter":{"status":"ALERT"},"pagination":{"page":1,"size":20}}' \
  | python3 -c "import sys,json; b=json.load(sys.stdin); print([r['meter_id'] for r in b.get('rows',[])])"
