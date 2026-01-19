# Quick Start Guide

## 🚀 One-Command Setup

### Windows:
```bash
setup-scraper.bat
```

### macOS/Linux:
```bash
bash setup-scraper.sh
```

## 📋 Manual Setup (if above doesn't work)

### Step 1: Activate Virtual Environment
```bash
# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/Scripts/activate
```

### Step 2: Install Dependencies
```bash
pip install -r requirements-scraper.txt
```

### Step 3: Install Chromium Browser
```bash
python -m playwright install chromium
```

### Step 4: Verify Everything Works
```bash
python diagnose_scraper.py
```

You should see: `✅ All checks passed! Scraper should work correctly.`

## 🧪 Testing the System

### Test 1: Backend API
```bash
npm run backend
```
Then in another terminal:
```bash
curl http://localhost:3001/health
```

### Test 2: Frontend
```bash
npm run dev
```
Then open: http://localhost:3000/dashboard

### Test 3: Scraper
```bash
python run_scraper.py --product-name "MacBook Pro"
```

### Test 4: Full Integration
1. Terminal 1: `npm run backend`
2. Terminal 2: `npm run dev`
3. Terminal 3: Activate venv, then `python run_scraper.py --product-name "iPhone"`
4. Open http://localhost:3000/dashboard and add a product

## ⚠️ Troubleshooting

If you get "command not found" errors:
1. Make sure you're in the right directory: `cd "c:/Users/Sahil/Desktop/projects/Ai product analysis"`
2. Activate the virtual environment first
3. Run `python diagnose_scraper.py` to check what's missing

If scraper returns no results:
1. Check your internet connection
2. Verify websites are accessible:
   - https://www.amazon.in/s?k=iPhone
   - https://www.flipkart.com/search?q=iPhone
3. Check backend is running on port 3001
4. Check browser logs in backend terminal

## 📊 System Components

```
Frontend (http://localhost:3000)
    ↓
Backend API (http://localhost:3001)
    ↓
Python Scraper
    ↓
Amazon.in & Flipkart.com
    ↓
Data back to Backend
    ↓
Display on Frontend with AI Analysis (Ollama)
```

## 🔧 Key Commands

| Command | Purpose |
|---------|---------|
| `npm run backend` | Start API server |
| `npm run dev` | Start frontend dev server |
| `npm run build` | Build frontend for production |
| `python run_scraper.py --product-name "X"` | Run scraper for product |
| `python diagnose_scraper.py` | Check scraper setup |

## 📞 Support

For issues:
1. Run `python diagnose_scraper.py` 
2. Check SCRAPER_SETUP.md for detailed troubleshooting
3. Look at terminal logs for error messages
4. Ensure all services (backend, Ollama) are running
