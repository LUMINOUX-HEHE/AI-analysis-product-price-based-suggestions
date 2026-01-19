#!/bin/bash

# Product Price Intelligence Backend API Test Script
# This script demonstrates all API endpoints

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api"

echo "========================================"
echo "Product Price Intelligence API Tests"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${BLUE}Test 1: Health Check${NC}"
echo "GET $BASE_URL/health"
curl -s "$BASE_URL/health" | jq '.'
echo ""
echo ""

# Test 2: Add Product - iPhone
echo -e "${BLUE}Test 2: Add Product - iPhone 15 Pro${NC}"
echo "POST $API_URL/add-product"
RESPONSE=$(curl -s -X POST "$API_URL/add-product" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 15 Pro",
    "url": "https://www.apple.com/iphone-15-pro"
  }')
echo "$RESPONSE" | jq '.'
PRODUCT_ID_1=$(echo "$RESPONSE" | jq -r '.data.id')
echo ""
echo ""

# Test 3: Add Product - MacBook
echo -e "${BLUE}Test 3: Add Product - MacBook Pro${NC}"
echo "POST $API_URL/add-product"
RESPONSE=$(curl -s -X POST "$API_URL/add-product" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MacBook Pro 16-inch",
    "url": "https://www.apple.com/macbook-pro"
  }')
echo "$RESPONSE" | jq '.'
echo ""
echo ""

# Test 4: Submit Scraped Data - Amazon
echo -e "${BLUE}Test 4: Submit Scraped Data - Amazon${NC}"
echo "POST $API_URL/scrape"
curl -s -X POST "$API_URL/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "iPhone 15 Pro",
    "productUrl": "https://www.amazon.com/iphone-15-pro",
    "platform": "Amazon",
    "price": 999.99,
    "currency": "USD"
  }' | jq '.'
echo ""
echo ""

# Test 5: Submit Scraped Data - Best Buy
echo -e "${BLUE}Test 5: Submit Scraped Data - Best Buy${NC}"
echo "POST $API_URL/scrape"
curl -s -X POST "$API_URL/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "iPhone 15 Pro",
    "platform": "BestBuy",
    "price": 1049.99,
    "currency": "USD"
  }' | jq '.'
echo ""
echo ""

# Test 6: Submit Scraped Data - Walmart
echo -e "${BLUE}Test 6: Submit Scraped Data - Walmart${NC}"
echo "POST $API_URL/scrape"
curl -s -X POST "$API_URL/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "iPhone 15 Pro",
    "platform": "Walmart",
    "price": 1029.99,
    "currency": "USD"
  }' | jq '.'
echo ""
echo ""

# Test 7: Submit More Data for MacBook
echo -e "${BLUE}Test 7: Submit Scraped Data for MacBook${NC}"
echo "POST $API_URL/scrape"
curl -s -X POST "$API_URL/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "MacBook Pro 16-inch",
    "platform": "Amazon",
    "price": 2499.00,
    "currency": "USD"
  }' | jq '.'
echo ""
echo ""

# Test 8: Get All Products
echo -e "${BLUE}Test 8: Get All Products${NC}"
echo "GET $API_URL/products"
curl -s "$API_URL/products" | jq '.'
echo ""
echo ""

# Test 9: Get Latest Prices (by Product ID)
echo -e "${BLUE}Test 9: Get Latest Prices for iPhone (by ID)${NC}"
echo "GET $API_URL/get-prices?productId=1"
curl -s "$API_URL/get-prices?productId=1" | jq '.'
echo ""
echo ""

# Test 10: Get Latest Prices (by Product Name)
echo -e "${BLUE}Test 10: Get Latest Prices for iPhone (by Name)${NC}"
echo "GET $API_URL/get-prices?productName=iPhone%2015%20Pro"
curl -s "$API_URL/get-prices?productName=iPhone%2015%20Pro" | jq '.'
echo ""
echo ""

# Test 11: Get Price History
echo -e "${BLUE}Test 11: Get Price History for iPhone${NC}"
echo "GET $API_URL/get-history?productId=1&limit=10"
curl -s "$API_URL/get-history?productId=1&limit=10" | jq '.'
echo ""
echo ""

# Test 12: Get Price History by Platform
echo -e "${BLUE}Test 12: Get Price History for iPhone on Amazon${NC}"
echo "GET $API_URL/get-history?productName=iPhone%2015%20Pro&platform=Amazon"
curl -s "$API_URL/get-history?productName=iPhone%2015%20Pro&platform=Amazon" | jq '.'
echo ""
echo ""

# Test 13: Get AI Summary
echo -e "${BLUE}Test 13: Get AI Summary (placeholder)${NC}"
echo "GET $API_URL/ai-summary?productId=1"
curl -s "$API_URL/ai-summary?productId=1" | jq '.'
echo ""
echo ""

# Test 14: Error Test - Invalid Product
echo -e "${BLUE}Test 14: Error Test - Product Not Found${NC}"
echo "GET $API_URL/get-prices?productId=999"
curl -s "$API_URL/get-prices?productId=999" | jq '.'
echo ""
echo ""

# Test 15: Error Test - Missing Required Field
echo -e "${BLUE}Test 15: Error Test - Missing Required Field${NC}"
echo "POST $API_URL/add-product"
curl -s -X POST "$API_URL/add-product" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
echo ""
echo ""

echo -e "${GREEN}========================================"
echo "All Tests Completed!"
echo "========================================${NC}"
