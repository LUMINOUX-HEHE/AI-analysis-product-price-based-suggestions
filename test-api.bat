@echo off
REM Product Price Intelligence Backend API Test Script (Windows)
REM This script demonstrates all API endpoints

set BASE_URL=http://localhost:3000
set API_URL=%BASE_URL%/api

echo ========================================
echo Product Price Intelligence API Tests
echo ========================================
echo.

REM Test 1: Health Check
echo Test 1: Health Check
echo GET %BASE_URL%/health
curl -s "%BASE_URL%/health"
echo.
echo.

REM Test 2: Add Product - iPhone
echo Test 2: Add Product - iPhone 15 Pro
echo POST %API_URL%/add-product
curl -s -X POST "%API_URL%/add-product" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\": \"iPhone 15 Pro\", \"url\": \"https://www.apple.com/iphone-15-pro\"}"
echo.
echo.

REM Test 3: Add Product - MacBook
echo Test 3: Add Product - MacBook Pro
echo POST %API_URL%/add-product
curl -s -X POST "%API_URL%/add-product" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\": \"MacBook Pro 16-inch\", \"url\": \"https://www.apple.com/macbook-pro\"}"
echo.
echo.

REM Test 4: Submit Scraped Data - Amazon
echo Test 4: Submit Scraped Data - Amazon
echo POST %API_URL%/scrape
curl -s -X POST "%API_URL%/scrape" ^
  -H "Content-Type: application/json" ^
  -d "{\"productName\": \"iPhone 15 Pro\", \"productUrl\": \"https://www.amazon.com/iphone-15-pro\", \"platform\": \"Amazon\", \"price\": 999.99, \"currency\": \"USD\"}"
echo.
echo.

REM Test 5: Submit Scraped Data - Best Buy
echo Test 5: Submit Scraped Data - Best Buy
echo POST %API_URL%/scrape
curl -s -X POST "%API_URL%/scrape" ^
  -H "Content-Type: application/json" ^
  -d "{\"productName\": \"iPhone 15 Pro\", \"platform\": \"BestBuy\", \"price\": 1049.99, \"currency\": \"USD\"}"
echo.
echo.

REM Test 6: Submit Scraped Data - Walmart
echo Test 6: Submit Scraped Data - Walmart
echo POST %API_URL%/scrape
curl -s -X POST "%API_URL%/scrape" ^
  -H "Content-Type: application/json" ^
  -d "{\"productName\": \"iPhone 15 Pro\", \"platform\": \"Walmart\", \"price\": 1029.99, \"currency\": \"USD\"}"
echo.
echo.

REM Test 7: Get All Products
echo Test 7: Get All Products
echo GET %API_URL%/products
curl -s "%API_URL%/products"
echo.
echo.

REM Test 8: Get Latest Prices (by Product ID)
echo Test 8: Get Latest Prices for iPhone (by ID)
echo GET %API_URL%/get-prices?productId=1
curl -s "%API_URL%/get-prices?productId=1"
echo.
echo.

REM Test 9: Get Latest Prices (by Product Name)
echo Test 9: Get Latest Prices for iPhone (by Name)
echo GET %API_URL%/get-prices?productName=iPhone 15 Pro
curl -s "%API_URL%/get-prices?productName=iPhone%%2015%%20Pro"
echo.
echo.

REM Test 10: Get Price History
echo Test 10: Get Price History for iPhone
echo GET %API_URL%/get-history?productId=1
curl -s "%API_URL%/get-history?productId=1&limit=10"
echo.
echo.

REM Test 11: Get AI Summary
echo Test 11: Get AI Summary (placeholder)
echo GET %API_URL%/ai-summary?productId=1
curl -s "%API_URL%/ai-summary?productId=1"
echo.
echo.

echo ========================================
echo All Tests Completed!
echo ========================================
pause
