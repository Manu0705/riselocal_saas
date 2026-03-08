#!/usr/bin/env bash
set -euo pipefail

API_BASE="${1:-https://api.riselocal.in}"
TENANT_SLUG="${TENANT_SLUG:-abc-cafe}"
JWT="${JWT:-}"

if [[ -z "${JWT}" ]]; then
  echo "Set JWT env var before running: JWT=<token> bash scripts/test-api.sh"
  exit 1
fi

echo "[1/6] Health"
curl -sS "${API_BASE}/health" | cat

echo "\n[2/6] Tenant by slug"
curl -sS -H "Authorization: Bearer ${JWT}" "${API_BASE}/api/tenants/slug/${TENANT_SLUG}" | cat

echo "\n[3/6] List leads by slug"
curl -sS \
  -H "Authorization: Bearer ${JWT}" \
  -H "x-tenant-slug: ${TENANT_SLUG}" \
  "${API_BASE}/api/tenant/${TENANT_SLUG}/leads" | cat

echo "\n[4/6] Create lead by slug"
CREATE_LEAD_RESPONSE=$(curl -sS \
  -X POST \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -H "x-tenant-slug: ${TENANT_SLUG}" \
  -d '{"name":"CLI Lead","phone":"9999999999","email":"cli@example.com","source":"CLI","location":"Bangalore"}' \
  "${API_BASE}/api/tenant/${TENANT_SLUG}/leads")
echo "${CREATE_LEAD_RESPONSE}" | cat

LEAD_ID=$(echo "${CREATE_LEAD_RESPONSE}" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1)

if [[ -z "${LEAD_ID}" ]]; then
  echo "\nCould not parse lead id; skipping status update + feedback create."
  exit 0
fi

echo "\n[5/6] Update lead status"
curl -sS \
  -X PATCH \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -H "x-tenant-slug: ${TENANT_SLUG}" \
  -d '{"status":"CONVERTED"}' \
  "${API_BASE}/api/tenant/${TENANT_SLUG}/leads/${LEAD_ID}/status" | cat

echo "\n[6/6] Create feedback"
curl -sS \
  -X POST \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -H "x-tenant-slug: ${TENANT_SLUG}" \
  -d "{\"leadId\":\"${LEAD_ID}\",\"comment\":\"Great experience\",\"type\":\"POSITIVE\",\"rating\":5}" \
  "${API_BASE}/api/tenant/${TENANT_SLUG}/feedback" | cat

echo "\nDone."
