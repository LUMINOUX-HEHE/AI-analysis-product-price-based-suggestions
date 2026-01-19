#!/bin/bash

# Backend Startup Script for Real-Time Product Price Intelligence Dashboard
# This script will start the backend server with all necessary checks

echo "=================================================="
echo "  Product Price Intelligence Backend Startup"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${YELLOW}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"
echo ""

# Check if npm is installed
echo -e "${YELLOW}Checking npm installation...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm found: v$NPM_VERSION${NC}"
echo ""

# Check if node_modules exists
echo -e "${YELLOW}Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Dependencies not found. Installing...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to install dependencies${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi
echo ""

# Check if .env file exists
echo -e "${YELLOW}Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file with default values...${NC}"
    cat > .env << EOF
PORT=3000
NODE_ENV=development
H2_DB_PATH=./data/products
H2_DB_USER=sa
H2_DB_PASSWORD=
EOF
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi
echo ""

# Check if backend server file exists
echo -e "${YELLOW}Checking backend server files...${NC}"
if [ ! -f "src/backend/server.js" ]; then
    echo -e "${RED}Error: Backend server file not found${NC}"
    echo "Expected: src/backend/server.js"
    exit 1
fi
echo -e "${GREEN}✓ Backend server files found${NC}"
echo ""

# Create data directory if it doesn't exist
if [ ! -d "data" ]; then
    mkdir -p data
    echo -e "${GREEN}✓ Data directory created${NC}"
fi
echo ""

# Display startup information
echo "=================================================="
echo "  Starting Backend Server"
echo "=================================================="
echo ""
echo "  Server URL:    http://localhost:3000"
echo "  Health Check:  http://localhost:3000/health"
echo "  API Base:      http://localhost:3000/api"
echo ""
echo "  Available Endpoints:"
echo "    GET  /health"
echo "    POST /api/add-product"
echo "    GET  /api/get-prices"
echo "    GET  /api/get-history"
echo "    POST /api/scrape"
echo "    GET  /api/ai-summary"
echo "    GET  /api/products"
echo ""
echo "  Documentation:"
echo "    - BACKEND_API.md (API Reference)"
echo "    - QUICK_START.md (Getting Started)"
echo "    - ARCHITECTURE.md (System Design)"
echo ""
echo "=================================================="
echo ""
echo -e "${GREEN}Starting server in 3 seconds...${NC}"
sleep 3

# Start the server
npm run backend:dev
