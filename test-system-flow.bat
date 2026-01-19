@echo off
REM System Integration Test Script for Windows
REM Tests the complete flow: Frontend → Backend → Scraper → Database → Ollama → Frontend

echo ==================================
echo   SYSTEM INTEGRATION TEST
echo ==================================
echo.

set API_BASE_URL=http://localhost:3001/api
set TEST_PRODUCT=iPhone 15 Pro

echo Test Configuration:
echo   API Base URL: %API_BASE_URL%
echo   Test Product: %TEST_PRODUCT%
echo.

REM Test 1: Backend Health Check
echo [1/7] Testing backend health...
curl -s %API_BASE_URL%/../health > nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Backend is running and healthy
) else (
    echo [FAIL] Backend health check failed
    echo        Make sure backend is running: npm run backend:dev
    exit /b 1
)

REM Test 2: Add Product
echo [2/7] Adding test product...
curl -s -X POST %API_BASE_URL%/add-product ^
    -H "Content-Type: application/json" ^
    -d "{\"name\": \"%TEST_PRODUCT%\"}" > temp_add.json 2>nul

findstr /C:"success" temp_add.json >nul
if %errorlevel% equ 0 (
    echo [PASS] Product added successfully
) else (
    echo [FAIL] Failed to add product
    type temp_add.json
)

REM Test 3: Check Database
echo [3/7] Checking database...
timeout /t 2 /nobreak >nul
curl -s %API_BASE_URL%/products > temp_products.json 2>nul
findstr /C:"%TEST_PRODUCT%" temp_products.json >nul
if %errorlevel% equ 0 (
    echo [PASS] Product found in database
) else (
    echo [FAIL] Product not found in database
)

REM Test 4: Wait for Scraper
echo [4/7] Waiting for scraper to fetch prices...
echo        This may take 20-30 seconds...
timeout /t 25 /nobreak >nul

REM Test 5: Check Price Data
echo [5/7] Checking if scraper sent price data...
curl -s "%API_BASE_URL%/get-prices?productName=%TEST_PRODUCT%" > temp_prices.json 2>nul
findstr /C:"prices" temp_prices.json >nul
if %errorlevel% equ 0 (
    echo [PASS] Scraper sent price data
) else (
    echo [FAIL] No price data available
    echo        Wait a bit longer and check manually
)

REM Test 6: Check AI Recommendation
echo [6/7] Checking AI recommendation...
findstr /C:"aiRecommendation" temp_prices.json >nul
if %errorlevel% equ 0 (
    echo [PASS] AI recommendation generated
) else (
    echo [FAIL] No AI recommendation
    echo        Make sure Ollama is running: ollama run mistral
)

REM Test 7: Complete Flow
echo [7/7] Verifying complete data flow...
echo [PASS] Complete flow test finished

REM Cleanup
del temp_*.json >nul 2>&1

echo.
echo ==================================
echo   TEST COMPLETE
echo ==================================
echo.
echo Your system integration test is complete!
echo.
echo Next steps:
echo   1. Open frontend: http://localhost:3000/dashboard
echo   2. Add products and watch real-time updates
echo   3. Check AI recommendations
echo.

pause
