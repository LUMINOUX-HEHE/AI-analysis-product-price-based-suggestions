#!/bin/bash
# Quick setup script for the scraper

echo "=================================="
echo "AI Product Analysis - Setup Script"
echo "=================================="
echo ""

# Detect if in virtual environment
if [ -z "$VIRTUAL_ENV" ]; then
    echo "[1/5] Activating virtual environment..."
    source .venv/Scripts/activate
fi

echo "[2/5] Installing dependencies..."
pip install -r requirements-scraper.txt

echo "[3/5] Installing Chromium browser..."
python -m playwright install chromium

echo "[4/5] Running diagnostics..."
python diagnose_scraper.py

echo ""
echo "[5/5] Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start backend: npm run backend"
echo "  2. Start frontend: npm run dev"
echo "  3. Test scraper: python run_scraper.py --product-name \"iPhone\""
