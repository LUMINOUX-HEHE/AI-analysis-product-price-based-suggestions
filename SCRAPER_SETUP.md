# Scraper Setup & Troubleshooting Guide

## Quick Start

### 1. Install Dependencies
```bash
# Install Python packages
pip install -r requirements-scraper.txt

# Install Chromium browser for Playwright
python -m playwright install chromium
```

### 2. Test the Scraper
```bash
# Run diagnostic to check if everything is set up
python diagnose_scraper.py

# Test scraper with a product
python run_scraper.py --product-name "iPhone" --endpoint http://localhost:3001/api/scrape
```

## Common Issues & Solutions

### Issue 1: "playwright command not found"
**Error Message:** `bash: playwright: command not found`

**Solution:**
```bash
# Use Python module instead of command
python -m playwright install chromium
```

### Issue 2: Chromium not installed
**Error Message:** `Error: Browser is not installed. Please run: npx playwright install`

**Solution:**
```bash
python -m playwright install chromium
```

### Issue 3: Scraper returns no results
**Possible Causes:**
- Website structure changed
- Website is blocking automation
- Browser/network issue
- Selectors need updating

**Solutions:**
1. Check if Chromium is working:
   ```bash
   python diagnose_scraper.py
   ```

2. Manually test a search URL:
   - Amazon: https://www.amazon.in/s?k=iPhone
   - Flipkart: https://www.flipkart.com/search?q=iPhone

3. The scraper will automatically try a fallback method using BeautifulSoup if Playwright fails

### Issue 4: Backend not receiving scraper data
**Symptom:** Product is added but no prices appear

**Solutions:**
1. Check backend is running:
   ```bash
   curl http://localhost:3001/health
   ```

2. Check scraper endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/scrape \
     -H "Content-Type: application/json" \
     -d '{"productName":"Test","platform":"Amazon","price":"999"}'
   ```

3. Check backend logs for errors

## Architecture

```
run_scraper.py (Main Entry Point)
├── AmazonHeadlessScraper (uses Playwright)
│   └── Falls back to FallbackScraper if needed
├── FlipkartHeadlessScraper (uses Playwright)
│   └── Falls back to FallbackScraper if needed
└── Sends data to Backend API (/api/scrape)
```

## Files

- `run_scraper.py` - Main script that orchestrates scraping
- `diagnose_scraper.py` - Diagnostic tool to check environment
- `headless_scraper/amazon_headless.py` - Amazon scraper
- `headless_scraper/flipkart_headless.py` - Flipkart scraper
- `headless_scraper/fallback_scraper.py` - Fallback scraper (BeautifulSoup)
- `headless_scraper/utils.py` - Utility functions
- `headless_scraper/config.py` - Configuration

## Testing

### Test 1: Check Dependencies
```bash
python diagnose_scraper.py
```

### Test 2: Test Amazon Scraper
```bash
python run_scraper.py --product-name "MacBook Pro"
```

### Test 3: Test Flipkart Scraper
```bash
python run_scraper.py --product-name "Samsung Galaxy"
```

### Test 4: Test Backend Integration
```bash
# Start backend first
npm run backend

# In another terminal, test scraper
python run_scraper.py --product-name "iPhone" --endpoint http://localhost:3001/api/scrape
```

## Environment Variables

Add to `.env` if needed:
```
PLAYWRIGHT_TIMEOUT=30000
PLAYWRIGHT_HEADLESS=true
```

## Advanced Options

### Run with Custom Endpoint
```bash
python run_scraper.py \
  --product-name "Sony Headphones" \
  --endpoint http://your-server:3001/api/scrape
```

### Run Diagnostics in Verbose Mode
```bash
python diagnose_scraper.py
```

## Performance Tips

1. **Limit Results**: Default is 5 products per site
2. **Timeout**: Default is 30 seconds per request
3. **Parallel Scraping**: Amazon and Flipkart run concurrently
4. **Fallback Method**: Automatically uses BeautifulSoup if Playwright fails

## Monitoring

Watch the scraper logs for:
- `[Amazon]` and `[Flipkart]` prefixes show which site
- `✓` indicates success
- `✗` indicates failure
- `[ERROR]` for critical errors
- `[WARNING]` for non-critical issues

## When Nothing Works

1. Run diagnostic:
   ```bash
   python diagnose_scraper.py
   ```

2. Check internet connection

3. Try manual verification:
   - Visit https://www.amazon.in in your browser
   - Visit https://www.flipkart.com in your browser
   - If they load, the issue is likely with the scraper setup

4. Check system requirements:
   - Windows 10+, macOS 10.14+, or Linux
   - 2GB+ RAM
   - 500MB disk space for Chromium

5. Reinstall Playwright:
   ```bash
   pip uninstall playwright
   pip install playwright
   python -m playwright install chromium
   ```

## Support

If issues persist:
1. Check the backend logs for scraper errors
2. Review the error messages in the scraper output
3. Ensure all dependencies are installed
4. Verify network connectivity
