"""New headless scraper - uses Playwright for Amazon & Flipkart"""
import asyncio
import sys
import os
import argparse
import json
from pathlib import Path
import traceback

# Add headless_scraper to path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from headless_scraper.amazon_headless import AmazonHeadlessScraper
    from headless_scraper.flipkart_headless import FlipkartHeadlessScraper
except ImportError as e:
    print(f"[ERROR] Failed to import scrapers: {e}")
    print("[INFO] Make sure Playwright is installed: pip install playwright")
    sys.exit(1)

from headless_scraper.utils import clean_product_data
import aiohttp


def safe_print(text: str):
    """Safely print text with Unicode characters"""
    try:
        print(text, flush=True)
    except UnicodeEncodeError:
        # Replace problematic Unicode characters
        safe_text = (text
            .replace('✓', '[OK]')
            .replace('✗', '[X]')
            .replace('✅', '[SUCCESS]')
            .replace('❌', '[FAIL]')
            .replace('▼', 'v')
            .replace('►', '>')
            .encode('ascii', errors='replace').decode('ascii'))
        print(safe_text, flush=True)


async def scrape_and_send(product_name: str, endpoint: str):
    """Scrape Amazon & Flipkart and send to backend endpoint"""
    
    all_products = []
    amazon_scraper = None
    flipkart_scraper = None
    
    # Scrape Amazon
    try:
        print(f"[Amazon] Searching for: {product_name}")
        amazon_scraper = AmazonHeadlessScraper()
        amazon_products = await amazon_scraper.search_products(product_name, limit=5)
        print(f"[Amazon] Found {len(amazon_products)} products")
        all_products.extend(amazon_products)
    except Exception as e:
        print(f"[Amazon] Error: {str(e)}")
        traceback.print_exc()
    finally:
        if amazon_scraper:
            try:
                await amazon_scraper.close()
            except:
                pass
    
    # Scrape Flipkart
    try:
        print(f"[Flipkart] Searching for: {product_name}")
        flipkart_scraper = FlipkartHeadlessScraper()
        flipkart_products = await flipkart_scraper.search_products(product_name, limit=5)
        print(f"[Flipkart] Found {len(flipkart_products)} products")
        all_products.extend(flipkart_products)
    except Exception as e:
        print(f"[Flipkart] Error: {str(e)}")
        traceback.print_exc()
    finally:
        if flipkart_scraper:
            try:
                await flipkart_scraper.close()
            except:
                pass
    
    if not all_products:
        print("[WARNING] No products found. This might be because:")
        print("  1. Chromium browser is not installed (run: python -m playwright install chromium)")
        print("  2. The websites are blocking the scraper")
        print("  3. Search results page structure changed")
        return
    
    # Send to backend
    print(f"\nSubmitting {len(all_products)} products to {endpoint}...")
    try:
        timeout = aiohttp.ClientTimeout(total=30)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            for idx, product in enumerate(all_products, 1):
                try:
                    # Clean data for API compatibility
                    cleaned = clean_product_data(product)
                    
                    async with session.post(endpoint, json=cleaned) as resp:
                        if resp.status == 200:
                            safe_print(f"  [OK] [{idx}/{len(all_products)}] {cleaned['productName']} - {cleaned['platform']}")
                        elif resp.status == 201:
                            safe_print(f"  [OK] [{idx}/{len(all_products)}] {cleaned['productName']} - {cleaned['platform']} (Created)")
                        else:
                            safe_print(f"  [X] [{idx}/{len(all_products)}] Failed: HTTP {resp.status}")
                except asyncio.TimeoutError:
                    safe_print(f"  [X] [{idx}/{len(all_products)}] Timeout sending to backend")
                except Exception as e:
                    safe_print(f"  [X] [{idx}/{len(all_products)}] Error: {str(e)}")
    except Exception as e:
        safe_print(f"[ERROR] Failed to send products to backend: {e}")
        traceback.print_exc()
    
    safe_print("\n[SUCCESS] Scraping complete!")


def main():
    parser = argparse.ArgumentParser(description="Headless scraper for Amazon & Flipkart")
    parser.add_argument("--product-name", required=True, help="Product name to search for")
    parser.add_argument("--endpoint", default="http://localhost:3001/api/scrape", help="Backend API endpoint")
    
    args = parser.parse_args()
    
    print(f"[INFO] Starting scraper for: {args.product_name}")
    print(f"[INFO] Backend endpoint: {args.endpoint}")
    
    try:
        # Run async scraper
        asyncio.run(scrape_and_send(args.product_name, args.endpoint))
        safe_print("[SUCCESS] Scraper completed successfully")
    except KeyboardInterrupt:
        safe_print("\n[INFO] Scraper interrupted by user")
        sys.exit(0)
    except Exception as e:
        safe_print(f"[ERROR] Scraper failed: {e}")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
