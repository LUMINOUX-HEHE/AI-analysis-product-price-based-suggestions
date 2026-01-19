#!/bin/bash

# System Integration Test Script
# Tests the complete flow: Frontend → Backend → Scraper → Database → Ollama → Frontend

echo "=================================="
echo "  SYSTEM INTEGRATION TEST"
echo "=================================="
echo ""

API_BASE_URL=${1:-"http://localhost:3001/api"}
TEST_PRODUCT="iPhone 15 Pro"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test results
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

echo -e "${BLUE}Test Configuration:${NC}"
echo "  API Base URL: $API_BASE_URL"
echo "  Test Product: $TEST_PRODUCT"
echo ""

# Test 1: Backend Health Check
echo -e "${YELLOW}[1/7]${NC} Testing backend health..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" $API_BASE_URL/../health 2>/dev/null)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    test_result 0 "Backend is running and healthy"
else
    test_result 1 "Backend health check failed (HTTP $HTTP_CODE)"
    echo "     Make sure backend is running: npm run backend:dev"
    exit 1
fi

# Test 2: Add Product
echo -e "${YELLOW}[2/7]${NC} Adding test product..."
ADD_RESPONSE=$(curl -s -X POST $API_BASE_URL/add-product \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$TEST_PRODUCT\"}" \
    2>/dev/null)

if echo "$ADD_RESPONSE" | grep -q '"success":true'; then
    PRODUCT_ID=$(echo "$ADD_RESPONSE" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
    test_result 0 "Product added successfully (ID: $PRODUCT_ID)"
else
    test_result 1 "Failed to add product"
    echo "     Response: $ADD_RESPONSE"
fi

# Test 3: Check Database - Get All Products
echo -e "${YELLOW}[3/7]${NC} Checking database - fetching all products..."
sleep 1
PRODUCTS_RESPONSE=$(curl -s $API_BASE_URL/products 2>/dev/null)
if echo "$PRODUCTS_RESPONSE" | grep -q "$TEST_PRODUCT"; then
    test_result 0 "Product found in database"
else
    test_result 1 "Product not found in database"
    echo "     Response: $PRODUCTS_RESPONSE"
fi

# Test 4: Wait for Scraper (give it time to fetch prices)
echo -e "${YELLOW}[4/7]${NC} Waiting for scraper to fetch prices..."
echo "     This may take 20-30 seconds..."
sleep 25

# Test 5: Check for Price Data
echo -e "${YELLOW}[5/7]${NC} Checking if scraper sent price data..."
if [ -n "$PRODUCT_ID" ]; then
    PRICES_RESPONSE=$(curl -s "$API_BASE_URL/get-prices?productId=$PRODUCT_ID" 2>/dev/null)
    
    if echo "$PRICES_RESPONSE" | grep -q '"prices":\['; then
        PRICE_COUNT=$(echo "$PRICES_RESPONSE" | grep -o '"platform"' | wc -l)
        if [ "$PRICE_COUNT" -gt 0 ]; then
            test_result 0 "Scraper sent price data ($PRICE_COUNT platforms)"
        else
            test_result 1 "No prices found yet (scraper may still be running)"
            echo "     Wait a bit longer and check manually"
        fi
    else
        test_result 1 "No price data available"
        echo "     Response: $PRICES_RESPONSE"
    fi
else
    test_result 1 "Cannot check prices (no product ID)"
fi

# Test 6: Check AI Recommendation
echo -e "${YELLOW}[6/7]${NC} Checking AI recommendation..."
if echo "$PRICES_RESPONSE" | grep -q '"aiRecommendation"'; then
    AI_RECOMMENDATION=$(echo "$PRICES_RESPONSE" | grep -o '"recommendation":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$AI_RECOMMENDATION" ]; then
        test_result 0 "AI recommendation generated: $AI_RECOMMENDATION"
    else
        test_result 1 "AI recommendation is empty"
    fi
else
    test_result 1 "No AI recommendation in response"
    echo "     Make sure Ollama is running: ollama run mistral"
fi

# Test 7: Complete Flow Verification
echo -e "${YELLOW}[7/7]${NC} Verifying complete data flow..."
FLOW_COMPLETE=true

# Check if we have product, prices, and AI recommendation
if [ -z "$PRODUCT_ID" ]; then
    FLOW_COMPLETE=false
    echo "     ✗ Product creation failed"
fi

if [ "$PRICE_COUNT" -eq 0 ]; then
    FLOW_COMPLETE=false
    echo "     ✗ Scraper didn't fetch prices"
fi

if [ -z "$AI_RECOMMENDATION" ]; then
    FLOW_COMPLETE=false
    echo "     ✗ AI analysis missing"
fi

if [ "$FLOW_COMPLETE" = true ]; then
    test_result 0 "Complete flow verified (User → Backend → Scraper → DB → AI)"
else
    test_result 1 "Complete flow incomplete"
fi

# Summary
echo ""
echo "=================================="
echo "  TEST SUMMARY"
echo "=================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo ""
    echo "Your system is fully integrated and working!"
    echo ""
    echo "Next steps:"
    echo "  1. Open frontend: http://localhost:3000/dashboard"
    echo "  2. Add products and watch the real-time updates"
    echo "  3. Check AI recommendations powered by Ollama Mistral"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Make sure backend is running: npm run backend:dev"
    echo "  2. Check if Python is installed: python --version"
    echo "  3. Verify Ollama is running: ollama run mistral"
    echo "  4. Check backend logs for errors"
    echo ""
    echo "For detailed logs, check:"
    echo "  - Backend console output"
    echo "  - Browser console (F12)"
    exit 1
fi
