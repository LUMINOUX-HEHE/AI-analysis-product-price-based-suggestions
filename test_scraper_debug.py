"""Debug script to check what HTML we're getting from Amazon/Flipkart"""
from amazon_scraper import AmazonScraper
from flipkart_scraper import FlipkartScraper
from bs4 import BeautifulSoup

# Test Amazon
print("="*60)
print("Testing Amazon with Playwright...")
print("="*60)
try:
    amazon = AmazonScraper(use_dynamic=True)
    html = amazon.fetch(amazon._build_search_url("laptop"))
    
    # Check for common blocking indicators
    html_lower = html.lower()
    print(f"\n[*] HTML Length: {len(html)} characters")
    print(f"[*] Contains 'captcha': {('captcha' in html_lower)}")
    print(f"[*] Contains 'robot': {('robot' in html_lower)}")
    print(f"[*] Contains 'access denied': {('access denied' in html_lower)}")
    print(f"[*] Contains product search results selector: {('data-component-type' in html_lower)}")
    
    # Test parsing
    soup = BeautifulSoup(html, "html.parser")
    cards = soup.select("div[data-component-type='s-search-result']")
    print(f"\n[*] Found {len(cards)} product cards in HTML")
    
    if cards:
        # Test first card
        card = cards[0]
        title_el = card.select_one("h2 a span")
        link_el = card.select_one("h2 a")
        price_el = card.select_one("span.a-price span.a-offscreen")
        
        print(f"[*] First product title: {title_el.get_text(strip=True) if title_el else 'NOT FOUND'}")
        print(f"[*] First product price: {price_el.get_text(strip=True) if price_el else 'NOT FOUND'}")
        print(f"[*] First product link: {link_el.get('href') if link_el else 'NOT FOUND'}")
    
    # Save HTML for manual inspection
    with open("amazon_response.html", "w", encoding="utf-8") as f:
        f.write(html[:50000])  # First 50KB
    print("\n[+] Saved first 50KB of response to amazon_response.html")
    
except Exception as e:
    print(f"\n[!] Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("Testing Flipkart with Playwright...")
print("="*60)
try:
    flipkart = FlipkartScraper(use_dynamic=True)
    html = flipkart.fetch(flipkart._build_search_url("laptop"))
    
    html_lower = html.lower()
    print(f"\n[*] HTML Length: {len(html)} characters")
    print(f"[*] Contains 'captcha': {('captcha' in html_lower)}")
    print(f"[*] Contains 'robot': {('robot' in html_lower)}")
    print(f"[*] Contains 'access denied': {('access denied' in html_lower)}")
    
    # Test parsing
    soup = BeautifulSoup(html, "html.parser")
    # Check for Flipkart product cards
    cards = soup.select("div._1AtVbE, div[data-id]")
    print(f"\n[*] Found {len(cards)} product cards in HTML")
    
    with open("flipkart_response.html", "w", encoding="utf-8") as f:
        f.write(html[:50000])
    print("\n[+] Saved first 50KB of response to flipkart_response.html")
    
except Exception as e:
    print(f"\n[!] Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("Debug complete!")
print("="*60)
