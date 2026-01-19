# Headless Product Scraper

Production-ready headless Playwright scraper for Amazon and Flipkart with anti-bot detection evasion.

## Features

✅ **Headless Browser Automation** - Playwright runs in headless mode (no UI opens)  
✅ **Stealth Mode** - Avoids bot detection with:
  - Random user-agents (Chrome, Firefox, Safari, Edge)
  - Random viewport sizes (1920x1080, 1366x768, etc.)
  - Realistic navigation headers
  - JavaScript-based webdriver property hiding
  - Random delays between actions (2-5 seconds)

✅ **Multi-Platform Support** - Scrapes Amazon.in and Flipkart.com  
✅ **Complete Data Extraction** - Captures:
  - Product name
  - Price (with numeric parsing)
  - Rating (with numeric conversion)
  - Product URL
  - Timestamp
  - Platform

✅ **Backend Integration** - Direct API submission to `http://localhost:3001/api/scrape`  
✅ **Data Validation** - Automatic price and rating parsing for API compatibility  
✅ **Error Handling** - Graceful failure recovery with detailed logging  
✅ **Modular Design** - Clean separation of concerns

## Project Structure

```
headless_scraper/
├── __init__.py                 # Package initialization
├── config.py                   # Stealth configuration & constants
├── utils.py                    # Price/rating parsing utilities
├── amazon_headless.py          # Amazon scraper
├── flipkart_headless.py        # Flipkart scraper
└── scraper_main.py             # CLI orchestrator
```

## Installation

### Prerequisites

- Python 3.10+
- Playwright (1.57.0+)
- Requests library

### Setup

```bash
# Navigate to project root
cd "Ai product analysis"

# Activate virtual environment
source .venv/Scripts/activate  # On Linux/Mac: source .venv/bin/activate

# Install dependencies (if not already installed)
pip install playwright requests

# Install Playwright browsers
playwright install chromium
```

## Usage

### Command Line Interface

#### Basic Scraping

```bash
# Search for products on Amazon
python headless_scraper/scraper_main.py --query "laptop" --limit 3 --platforms amazon

# Search both platforms
python headless_scraper/scraper_main.py --query "iPhone" --limit 5

# Search Flipkart only
python headless_scraper/scraper_main.py --query "samsung galaxy" --platforms flipkart
```

#### Options

```bash
python headless_scraper/scraper_main.py \
  --query "product name"              # Search query (required)
  --limit 5                            # Products per platform (default: 5)
  --platforms amazon flipkart          # Platforms (default: both)
  --api http://localhost:3001/scrape   # Custom API endpoint
  --save                               # Save to scraped_data.json
  --no-send                            # Skip API submission
```

### Programmatic Usage

```python
import asyncio
from headless_scraper.amazon_headless import AmazonHeadlessScraper
from headless_scraper.flipkart_headless import FlipkartHeadlessScraper

async def scrape_products():
    # Amazon
    amazon = AmazonHeadlessScraper()
    try:
        products = await amazon.search_products("MacBook Pro", limit=5)
        for p in products:
            print(f"{p['productName']} - {p['price']}")
    finally:
        await amazon.close()
    
    # Flipkart
    flipkart = FlipkartHeadlessScraper()
    try:
        products = await flipkart.search_products("iPhone", limit=5)
        for p in products:
            print(f"{p['productName']} - {p['price']}")
    finally:
        await flipkart.close()

asyncio.run(scrape_products())
```

## Output Format

Each scraped product returns JSON:

```json
{
  "productName": "Dell 15 Laptop, 14th Gen Intel Core...",
  "platform": "Amazon",
  "price": 39990,
  "rating": 3.9,
  "url": "https://www.amazon.in/...",
  "timestamp": "2026-01-19T22:35:40.991564"
}
```

### API Submission

Products are automatically sent to the backend API:

**Endpoint:** `POST http://localhost:3001/api/scrape`

**Response:** 
```json
{
  "success": true,
  "message": "Price data received and stored successfully",
  "data": {
    "productId": 10,
    "productName": "Dell 15 Laptop",
    "platform": "Amazon",
    "price": 39990,
    "currency": "INR"
  }
}
```

## Configuration

Edit `headless_scraper/config.py` to customize:

```python
# User-Agent rotation
USER_AGENTS = [...]

# Viewport sizes
VIEWPORTS = [...]

# Delay ranges
MIN_PAGE_LOAD_DELAY = 2.0
MAX_PAGE_LOAD_DELAY = 4.0
MIN_ACTION_DELAY = 1.0
MAX_ACTION_DELAY = 2.5

# API endpoint
API_ENDPOINT = "http://localhost:3001/api/scrape"

# Timeout
PAGE_TIMEOUT = 30000  # 30 seconds
```

## Anti-Bot Features

1. **Browser Fingerprinting**
   - Random user-agents (rotates per request)
   - Random viewport sizes
   - Locale & timezone settings
   - Realistic HTTP headers

2. **Navigation Stealth**
   - Disables `navigator.webdriver` property
   - Spoofs `navigator.plugins`
   - Custom HTTP headers
   - DNT flag enabled

3. **Behavior Simulation**
   - Random delays between requests (2-5s)
   - Page load delays (2-4s)
   - Realistic error handling
   - Headless mode (no UI)

4. **Request Headers**
   ```
   Accept: text/html,application/xhtml+xml,application/xml;q=0.9...
   Accept-Encoding: gzip, deflate, br
   Accept-Language: en-IN,en;q=0.9,hi;q=0.8
   DNT: 1
   Connection: keep-alive
   ```

## Troubleshooting

### Issue: "Connection refused" when sending to API

**Solution:** Start the backend server:
```bash
cd "Ai product analysis"
npm run backend:dev
```

### Issue: No products found

**Possible causes:**
- Website structure changed (selectors outdated)
- Too aggressive blocking by target website
- Timeout too short

**Solutions:**
- Increase timeout: Edit `PAGE_TIMEOUT` in config.py
- Check selectors in `amazon_headless.py` / `flipkart_headless.py`
- Try different search queries

### Issue: Playwright browser not installed

**Solution:**
```bash
playwright install chromium
```

### Issue: Prices showing as 0

**Cause:** Price parsing failed  
**Solution:** Check price format in product returned, verify parsing logic in `utils.py`

## Performance

- **Amazon:** ~20-30 seconds per 5 products
- **Flipkart:** ~20-30 seconds per 5 products (may require additional selectors)
- **Typical throughput:** 5-10 products per minute per platform

## Limitations

1. **Flipkart Parsing** - May require selector updates as website structure changes
2. **Rate Limiting** - Websites may block after multiple requests from same IP
3. **Dynamic Content** - Some prices loaded via JavaScript (handled by Playwright)
4. **Geographic Restrictions** - Some products only available in specific regions

## Best Practices

1. **Respect robots.txt** and terms of service
2. **Use reasonable delays** between requests
3. **Rotate user-agents** (already implemented)
4. **Monitor for blocking** (429, 403 status codes)
5. **Save data locally** before processing
6. **Handle errors gracefully**

## Supported Platforms

- ✅ Amazon India (amazon.in)
- ✅ Flipkart (flipkart.com)

## Requirements

- Python 3.10+
- 500MB+ disk space (for Playwright browser)
- Modern OS (Windows, macOS, Linux)

## License

MIT - Use freely in your hackathon project

## Support

For issues or feature requests, refer to the main project documentation.

---

**Status:** ✅ Production Ready  
**Last Updated:** January 19, 2026
