"""Detailed test of Flipkart scraper."""
from flipkart_scraper import FlipkartScraper
from base_scraper import BaseScraper

scraper = FlipkartScraper(use_dynamic=False)
search_url = scraper._build_search_url('iPhone 16')

print(f"Search URL: {search_url}")
print("\nTrying to fetch...")

try:
    html = scraper.fetch(search_url)
    print(f"✓ Fetched HTML, length: {len(html)} bytes")
    
    # Check if we got blocked
    if '503' in html or 'captcha' in html.lower() or 'robot' in html.lower():
        print("✗ Appears to be blocked/captcha")
    
    # Try to parse
    results = list(scraper._parse_listing(html))
    print(f"✓ Parsed {len(results)} results")
    
    if len(results) == 0:
        print("\nHTML preview (first 500 chars):")
        print(html[:500])
    else:
        for r in results[:3]:
            print(f"  - {r.name} | ${r.price}")
            
except Exception as e:
    print(f"✗ Error: {type(e).__name__}")
    print(f"  {str(e)}")
