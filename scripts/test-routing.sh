#!/bin/bash

# Multi-Tenant Routing Test Script
# Tests various URL patterns to ensure proper routing behavior

API_URL="${API_URL:-http://localhost:4000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"

echo "=================================="
echo "Multi-Tenant Routing Test"
echo "=================================="
echo "API URL: $API_URL"
echo "WEB URL: $WEB_URL"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_url() {
  local url=$1
  local expected_status=$2
  local description=$3
  
  echo -n "Testing: $description... "
  
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" -H "Host: ${4:-localhost:3000}")
  
  if [ "$status" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $status)"
  else
    echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status)"
  fi
}

echo "=================================="
echo "1. Main Domain Tests"
echo "=================================="

test_url "$WEB_URL/" 200 "Root domain"
test_url "$WEB_URL/" 200 "WWW domain" "www.localhost:3000"

echo ""
echo "=================================="
echo "2. Path-Based Tenant Tests"
echo "=================================="

test_url "$WEB_URL/bavani" 200 "Valid tenant (path-based)"
test_url "$WEB_URL/invalidtenant" 404 "Invalid tenant (path-based)"

echo ""
echo "=================================="
echo "3. Reserved Route Tests"
echo "=================================="

test_url "$WEB_URL/dashboard" 200 "Dashboard route"
test_url "$WEB_URL/login" 200 "Login route"
test_url "$WEB_URL/api" 404 "API route prefix"

echo ""
echo "=================================="
echo "4. API Tenant Validation Tests"
echo "=================================="

echo -n "Testing: Create test tenant via API... "
response=$(curl -s -X POST "$API_URL/api/tenants" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Tenant","slug":"testslug"}')

if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ PASS${NC}"
else
  echo -e "${YELLOW}⚠ Note: Create tenant manually via admin${NC}"
fi

echo -n "Testing: Fetch tenant by slug... "
response=$(curl -s "$API_URL/api/tenants/slug/bavani")
status=$(echo "$response" | grep -o '"success":[^,]*' | cut -d: -f2)

if [ "$status" = "true" ]; then
  echo -e "${GREEN}✓ PASS${NC}"
else
  echo -e "${RED}✗ FAIL${NC} (Tenant not found - create 'bavani' tenant first)"
fi

echo -n "Testing: Invalid tenant slug... "
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/tenants/slug/nonexistent")

if [ "$response" -eq 404 ]; then
  echo -e "${GREEN}✓ PASS${NC} (Status: 404)"
else
  echo -e "${RED}✗ FAIL${NC} (Expected: 404, Got: $response)"
fi

echo ""
echo "=================================="
echo "Test Summary"
echo "=================================="
echo "Note: For subdomain tests, configure DNS or use /etc/hosts:"
echo "  127.0.0.1 bavani.localhost"
echo "  127.0.0.1 www.localhost"
echo ""
echo "Then manually test:"
echo "  http://bavani.localhost:3000"
echo "  http://www.bavani.localhost:3000 (should be blocked)"
echo ""
