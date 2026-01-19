"""Test Flipkart scraper directly."""
from flipkart_scraper import FlipkartScraper

scraper = FlipkartScraper(use_dynamic=False)
print("Testing Flipkart scraper...")
print("Searching for 'iPhone 16'...")

try:
    results = scraper.search('iPhone 16', limit=2)
    print(f"\n✓ Success! Found {len(results)} results")
    for r in results:
        print(f"  - {r.name} | {r.platform} | ${r.price}")
except Exception as e:
    print(f"\n✗ Failed: {type(e).__name__}")
    print(f"  Error: {str(e)}")
