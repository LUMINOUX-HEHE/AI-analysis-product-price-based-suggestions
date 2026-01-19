# Price Intelligence Dashboard & Scraper

A dual-component system for real-time product price tracking.

## 🎨 Frontend (Next.js Dashboard)

Modern, responsive frontend for tracking product prices with AI-powered recommendations.

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

### Getting Started
```bash
npm install
npm run dev
```

## 🕷️ Scraper (Python)

Python-based scraping toolkit for gathering normalized product pricing data from Amazon and Flipkart.

### Prerequisites
- Python 3.10
- Google Chrome/Chromium

### Setup
```bash
pip install -r requirements-scraper.txt
python -m playwright install chromium
```

## Usage

```bash
python run_scraper.py --product-name "iphone 15" --limit 3
```

Optional flags:

- `--amazon-url` / `--flipkart-url`: scrape explicit product detail pages.
- `--use-dynamic`: enable Playwright rendering for dynamic/JS heavy pages.
- `--endpoint`: override the backend endpoint (defaults to `http://localhost:3000/scrape`).
- `--output`: choose where to store the JSON payload (defaults to `scrape-output.json`).

The script writes normalized JSON records with the schema:

```json
{
  "productName": "Iphone 15",
  "platform": "Amazon",
  "price": "79999.00",
  "rating": "4.6",
  "url": "https://www.amazon.in/...",
  "timestamp": "2026-01-19T12:34:56.000000+00:00"
}
```

All scraped records are also POSTed to the backend in a single array payload.

## Project Layout

- `scraper_config.py`: shared constants (domains, headers, timeouts, backend endpoint).
- `scraper_utils.py`: normalization helpers, product dataclass, JSON persistence.
- `base_scraper.py`: HTTP/session handling with optional Playwright rendering.
- `amazon_scraper.py` / `flipkart_scraper.py`: site-specific parsers.
- `data_sender.py`: HTTP POST to the backend service.
- `run_scraper.py`: CLI entry point orchestrating scrapes per query/URL.

## Notes

- Always follow each site's Terms of Service and robots.txt guidance before scraping.
- Consider introducing rotating proxies or request throttling if scaling beyond hackathon/demo usage.
- Extend `AmazonScraper`/`FlipkartScraper` or add new classes for additional marketplaces.
# AI-analysis-product-price-based-suggestions
