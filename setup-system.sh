#!/bin/bash

# Complete System Setup Script
# Real-Time Product Price Intelligence Dashboard

echo "=================================================="
echo "  Product Price Intelligence - System Setup"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Node.js
echo -e "${YELLOW}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check Python
echo -e "${YELLOW}Checking Python...${NC}"
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python not found${NC}"
    echo "Please install Python from https://python.org/"
    exit 1
fi
PYTHON_CMD=$(command -v python3 || command -v python)
echo -e "${GREEN}✓ Python $($PYTHON_CMD --version)${NC}"

# Check Ollama
echo -e "${YELLOW}Checking Ollama...${NC}"
if ! command -v ollama &> /dev/null; then
    echo -e "${RED}✗ Ollama not found${NC}"
    echo "Installing Ollama..."
    curl https://ollama.ai/install.sh | sh
fi
echo -e "${GREEN}✓ Ollama found${NC}"

# Install Node dependencies
echo ""
echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Node dependencies installed${NC}"

# Install Python dependencies
echo ""
echo -e "${YELLOW}Installing Python dependencies...${NC}"
$PYTHON_CMD -m pip install -r requirements-scraper.txt
echo -e "${GREEN}✓ Python dependencies installed${NC}"

# Pull Mistral model
echo ""
echo -e "${YELLOW}Checking Ollama Mistral model...${NC}"
ollama pull mistral
echo -e "${GREEN}✓ Mistral model ready${NC}"

# Create data directory
mkdir -p data

echo ""
echo -e "${GREEN}=================================================="
echo "  Setup Complete!"
echo "==================================================${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Start Ollama:"
echo "   ${YELLOW}ollama run mistral${NC}"
echo ""
echo "2. In a new terminal, start Backend:"
echo "   ${YELLOW}npm run backend:dev${NC}"
echo ""
echo "3. In another terminal, start Frontend:"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "4. Open your browser:"
echo "   ${YELLOW}http://localhost:3001${NC}"
echo ""
echo -e "${GREEN}Ready to analyze product prices!${NC}"
