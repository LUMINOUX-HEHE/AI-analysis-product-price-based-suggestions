"""Amazon headless scraper with Playwright"""
import time
import asyncio
from datetime import datetime
from typing import List, Dict, Optional
from playwright.async_api import async_playwright, Page, Browser
from urllib.parse import quote_plus
import sys
import os
import io

# Fix Unicode encoding for Windows console
if sys.platform == 'win32' and hasattr(sys.stdout, 'buffer'):
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    except:
        pass  # If this fails, just continue

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from headless_scraper.config import (
    get_random_user_agent,
    get_random_viewport,
    random_delay,
    PAGE_TIMEOUT,
    MIN_PAGE_LOAD_DELAY,
    MAX_PAGE_LOAD_DELAY
)

def safe_print(text: str):
    """Safely print text with Unicode characters"""
    try:
        print(text)
    except UnicodeEncodeError:
        # Remove problematic characters and print
        safe_text = text.encode('ascii', errors='replace').decode('ascii')
        print(safe_text)


class AmazonHeadlessScraper:
    """Amazon scraper using headless Playwright"""
    
    def __init__(self):
        self.platform = "Amazon"
        self.base_url = "https://www.amazon.in"
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
    
    async def init_browser(self):
        """Initialize headless browser with stealth settings"""
        playwright = await async_playwright().start()
        
        # Launch browser in headless mode
        self.browser = await playwright.chromium.launch(
            headless=True,  # No browser UI
            args=[
                '--disable-blink-features=AutomationControlled',  # Hide automation
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ]
        )
        
        # Create context with random user agent and viewport
        context = await self.browser.new_context(
            user_agent=get_random_user_agent(),
            viewport=get_random_viewport(),
            locale='en-IN',
            timezone_id='Asia/Kolkata',
            extra_http_headers={
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
        )
        
        # Additional stealth: Override navigator properties
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
        """)
        
        self.page = await context.new_page()
        print(f"[Amazon] Browser initialized in headless mode")
    
    async def search_products(self, query: str, limit: int = 5) -> List[Dict]:
        """Search for products and extract data"""
        if not self.page:
            await self.init_browser()
        
        search_url = f"{self.base_url}/s?k={quote_plus(query)}"
        print(f"[Amazon] Searching for: {query}")
        print(f"[Amazon] URL: {search_url}")
        
        try:
            # Navigate to search page
            await self.page.goto(search_url, wait_until='domcontentloaded', timeout=PAGE_TIMEOUT)
            
            # Random delay to mimic human behavior
            await asyncio.sleep(random_delay(MIN_PAGE_LOAD_DELAY, MAX_PAGE_LOAD_DELAY))
            
            # Wait for search results
            try:
                await self.page.wait_for_selector('div[data-component-type="s-search-result"]', timeout=10000)
            except:
                print(f"[Amazon] Warning: Search results selector not found, continuing...")
            
            # Extract products
            products = await self.page.evaluate("""() => {
                const results = [];
                const cards = document.querySelectorAll('div[data-component-type="s-search-result"]');
                
                cards.forEach(card => {
                    try {
                        // Extract title
                        const titleEl = card.querySelector('h2 a span') || 
                                      card.querySelector('h2 span') ||
                                      card.querySelector('.a-size-medium.a-text-normal');
                        const title = titleEl ? titleEl.innerText.trim() : '';
                        
                        // Extract link
                        const linkEl = card.querySelector('h2 a') || 
                                     card.querySelector('a.a-link-normal');
                        const href = linkEl ? linkEl.getAttribute('href') : '';
                        
                        // Extract price
                        const priceEl = card.querySelector('span.a-price span.a-offscreen') ||
                                      card.querySelector('.a-price .a-offscreen');
                        const price = priceEl ? priceEl.innerText.trim() : '';
                        
                        // Extract rating
                        const ratingEl = card.querySelector('span.a-icon-alt') ||
                                       card.querySelector('[aria-label*="out of"]');
                        const rating = ratingEl ? ratingEl.innerText.trim() : '';
                        
                        if (title && href) {
                            results.push({
                                title: title,
                                link: href,
                                price: price,
                                rating: rating
                            });
                        }
                    } catch (e) {
                        console.error('Error parsing product card:', e);
                    }
                });
                
                return results;
            }""")
            
            # Format results
            formatted_products = []
            for i, product in enumerate(products[:limit]):
                try:
                    # Build full URL
                    product_url = product['link']
                    if product_url.startswith('/'):
                        product_url = f"{self.base_url}{product_url}"
                    elif not product_url.startswith('http'):
                        product_url = f"{self.base_url}/{product_url}"
                    
                    # Clean price: remove currency symbols and convert to float
                    price_str = product['price'].replace('₹', '').strip()
                    try:
                        price_float = float(price_str.replace(',', ''))
                    except:
                        price_float = 0.0
                    
                    formatted_product = {
                        "productName": product['title'],
                        "platform": self.platform,
                        "price": str(price_float),
                        "rating": product['rating'],
                        "url": product_url,
                        "timestamp": datetime.now().isoformat()
                    }
                    formatted_products.append(formatted_product)
                    
                    # Safe print with Unicode handling
                    title_safe = product['title'][:60].encode('ascii', errors='replace').decode('ascii')
                    price_safe = product['price'].encode('ascii', errors='replace').decode('ascii')
                    safe_print(f"[Amazon] [{i+1}] {title_safe}... - {price_safe}")
                except Exception as e:
                    safe_print(f"[Amazon] Error formatting product: {str(e)}")
                    continue
            
            safe_print(f"[Amazon] Extracted {len(formatted_products)} products")
            return formatted_products
            
        except Exception as e:
            safe_print(f"[Amazon] Error during scraping: {str(e)}")
            import traceback
            traceback.print_exc()
            return []
    
    async def close(self):
        """Close browser"""
        if self.browser:
            await self.browser.close()
            safe_print(f"[Amazon] Browser closed")
