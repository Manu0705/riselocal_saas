@echo off
REM Multi-Tenant Routing Test Script for Windows
REM Tests various URL patterns to ensure proper routing behavior

setlocal

set API_URL=http://localhost:4000
set WEB_URL=http://localhost:3000

echo ==================================
echo Multi-Tenant Routing Test
echo ==================================
echo API URL: %API_URL%
echo WEB URL: %WEB_URL%
echo.

echo ==================================
echo 1. Main Domain Tests
echo ==================================

echo Testing root domain...
curl -s -o NUL -w "Status: %%{http_code}\n" %WEB_URL%/

echo Testing www domain...
curl -s -o NUL -w "Status: %%{http_code}\n" %WEB_URL%/ -H "Host: www.localhost:3000"

echo.
echo ==================================
echo 2. Path-Based Tenant Tests
echo ==================================

echo Testing valid tenant (bavani)...
curl -s -o NUL -w "Status: %%{http_code}\n" %WEB_URL%/bavani

echo Testing invalid tenant...
curl -s -o NUL -w "Status: %%{http_code} (should be 404)\n" %WEB_URL%/invalidtenant

echo.
echo ==================================
echo 3. Reserved Route Tests
echo ==================================

echo Testing dashboard route...
curl -s -o NUL -w "Status: %%{http_code}\n" %WEB_URL%/dashboard

echo Testing login route...
curl -s -o NUL -w "Status: %%{http_code}\n" %WEB_URL%/login

echo.
echo ==================================
echo 4. API Tenant Validation Tests
echo ==================================

echo Testing fetch tenant by slug (bavani)...
curl -s %API_URL%/api/tenants/slug/bavani

echo.
echo Testing invalid tenant slug...
curl -s -o NUL -w "Status: %%{http_code} (should be 404)\n" %API_URL%/api/tenants/slug/nonexistent

echo.
echo ==================================
echo Test Summary
echo ==================================
echo For subdomain tests, add to C:\Windows\System32\drivers\etc\hosts:
echo   127.0.0.1 bavani.localhost
echo   127.0.0.1 www.localhost
echo.
echo Then manually test:
echo   http://bavani.localhost:3000
echo   http://www.bavani.localhost:3000 (should be blocked)
echo.
echo ==================================

endlocal
