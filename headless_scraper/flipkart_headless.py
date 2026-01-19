"""Flipkart headless scraper with Playwright"""
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

class FlipkartHeadlessScraper:
    """Flipkart scraper using headless Playwright"""
    
    def __init__(self):
        self.platform = "Flipkart"
        self.base_url = "https://www.flipkart.com"
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
    
    async def init_browser(self):
        """Initialize headless browser with stealth settings"""
        playwright = await async_playwright().start()
        
        # Launch browser in headless mode
        self.browser = await playwright.chromium.launch(
            headless=True,  # No browser UI
            args=[
                '--disable-blink-features=AutomationControlled',
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
        
        # Additional stealth
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
        """)
        
        self.page = await context.new_page()
        safe_print(f"[Flipkart] Browser initialized in headless mode")
    
    async def search_products(self, query: str, limit: int = 5) -> List[Dict]:
        """Search for products and extract data"""
        if not self.page:
            await self.init_browser()
        
        search_url = f"{self.base_url}/search?q={quote_plus(query)}"
        safe_print(f"[Flipkart] Searching for: {query}")
        safe_print(f"[Flipkart] URL: {search_url}")
        
        try:
            # Navigate to search page
            await self.page.goto(search_url, wait_until='domcontentloaded', timeout=PAGE_TIMEOUT)
            
            # Random delay
            await asyncio.sleep(random_delay(MIN_PAGE_LOAD_DELAY, MAX_PAGE_LOAD_DELAY))
            
            # Wait for products to load
            try:
                await self.page.wait_for_selector('div._1AtVbE, div[data-id], a._1fQZEK', timeout=10000)
            except:
                safe_print(f"[Flipkart] Warning: Product selector not found, continuing...")
            
            # Extract products using JavaScript evaluation
            products = await self.page.evaluate("""() => {
                const results = [];
                
                // Try multiple selector patterns for Flipkart
                const cards = document.querySelectorAll('div._1AtVbE, div[data-id], div._2kHMtA, div._13oc-S');
                
                cards.forEach(card => {
                    try {
                        // Extract title - multiple patterns
                        const titleEl = card.querySelector('a._1fQZEK') ||
                                      card.querySelector('div._4rR01T') ||
                                      card.querySelector('a.IRpwTa') ||
                                      card.querySelector('a.s1Q9rs');
                        const title = titleEl ? titleEl.innerText.trim() : '';
                        
                        // Extract link
                        const linkEl = card.querySelector('a._1fQZEK') ||
                                     card.querySelector('a[href*="/p/"]') ||
                                     card.querySelector('a.IRpwTa');
                        const href = linkEl ? linkEl.getAttribute('href') : '';
                        
                        // Extract price
                        const priceEl = card.querySelector('div._30jeq3') ||
                                      card.querySelector('div._3I9_wc') ||
                                      card.querySelector('div._25b18c');
                        const price = priceEl ? priceEl.innerText.trim() : '';
                        
                        // Extract rating
                        const ratingEl = card.querySelector('div._3LWZlK') ||
                                       card.querySelector('div._1lRcqv') ||
                                       card.querySelector('span._1lRcqv');
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
                    
                    # Clean price - remove rupee symbol and convert to numeric
                    price_str = product['price'].replace('₹', '').replace('Rs', '').strip()
                    try:
                        price_numeric = float(price_str.split(',')[0]) if price_str else 0.0
                    except (ValueError, IndexError):
                        price_numeric = 0.0
                    
                    formatted_product = {
                        "productName": product['title'],
                        "platform": self.platform,
                        "price": str(price_numeric),
                        "rating": product['rating'],
                        "url": product_url,
                        "timestamp": datetime.now().isoformat()
                    }
                    formatted_products.append(formatted_product)
                    safe_print(f"[Flipkart] [{i+1}] {product['title'][:60]}... - ₹{price_numeric:.2f}")
                except Exception as e:
                    safe_print(f"[Flipkart] Error formatting product: {str(e)}")
            
            safe_print(f"[Flipkart] Extracted {len(formatted_products)} products")
            return formatted_products
            
        except Exception as e:
            safe_print(f"[Flipkart] Error during scraping: {str(e)}")
            import traceback
            traceback.print_exc()
            return []
    
    async def close(self):
        """Close browser"""
        if self.browser:
            await self.browser.close()
            safe_print(f"[Flipkart] Browser closed")
