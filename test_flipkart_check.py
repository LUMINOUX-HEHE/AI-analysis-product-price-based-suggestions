"""Check what Flipkart returns."""
from flipkart_scraper import FlipkartScraper

scraper = FlipkartScraper(use_dynamic=False)
search_url = scraper._build_search_url('iPhone 16')

print("Fetching Flipkart...")
html = scraper.fetch(search_url)

# Check for common blocking patterns
checks = {
    'captcha': 'captcha' in html.lower(),
    'robot/bot': 'robot' in html.lower() or 'bot' in html.lower(),
    'access denied': 'access denied' in html.lower(),
    'temporarily unavailable': 'temporarily unavailable' in html.lower(),
    'unusual traffic': 'unusual traffic' in html.lower(),
}

print("\nBlocking indicators:")
for name, found in checks.items():
    status = "✗ FOUND" if found else "✓ Not found"
    print(f"  {status}: {name}")

# Check for actual product divs
from bs4 import BeautifulSoup
soup = BeautifulSoup(html, 'html.parser')

# Common Flipkart product selectors
selectors = [
    'div._1AtVbE',
    'div._13oc-S',
    'div._2kHMtA',
    'div[data-id]'
]

print("\nLooking for product elements:")
for selector in selectors:
    elements = soup.select(selector)
    print(f"  {selector}: {len(elements)} found")

# Check page title
title = soup.find('title')
print(f"\nPage title: {title.get_text() if title else 'None'}")
