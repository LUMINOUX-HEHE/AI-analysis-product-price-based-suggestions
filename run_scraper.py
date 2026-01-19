"""New headless scraper - uses Playwright for Amazon & Flipkart"""
import asyncio
import sys
import argparse
import json
from pathlib import Path

# Add headless_scraper to path
sys.path.insert(0, str(Path(__file__).parent))

from headless_scraper.amazon_headless import AmazonHeadlessScraper
from headless_scraper.flipkart_headless import FlipkartHeadlessScraper
from headless_scraper.utils import clean_product_data
import aiohttp


async def scrape_and_send(product_name: str, endpoint: str):
    """Scrape Amazon & Flipkart and send to backend endpoint"""
    
    all_products = []
    
    # Scrape Amazon
    try:
        print(f"[Amazon] Searching for: {product_name}")
        amazon_scraper = AmazonHeadlessScraper()
        amazon_products = await amazon_scraper.search_products(product_name, limit=5)
        print(f"[Amazon] Found {len(amazon_products)} products")
        all_products.extend(amazon_products)
    except Exception as e:
        print(f"[Amazon] Error: {str(e)}")
    
    # Scrape Flipkart
    try:
        print(f"[Flipkart] Searching for: {product_name}")
        flipkart_scraper = FlipkartHeadlessScraper()
        flipkart_products = await flipkart_scraper.search_products(product_name, limit=5)
        print(f"[Flipkart] Found {len(flipkart_products)} products")
        all_products.extend(flipkart_products)
    except Exception as e:
        print(f"[Flipkart] Error: {str(e)}")
    
    if not all_products:
        print("No products found.")
        return
    
    # Send to backend
    print(f"\nSubmitting {len(all_products)} products to {endpoint}...")
    async with aiohttp.ClientSession() as session:
        for idx, product in enumerate(all_products, 1):
            try:
                # Clean data for API compatibility
                cleaned = clean_product_data(product)
                
                async with session.post(endpoint, json=cleaned) as resp:
                    if resp.status == 200:
                        print(f"  ✓ [{idx}/{len(all_products)}] {cleaned['productName']} - {cleaned['platform']}")
                    else:
                        print(f"  ✗ [{idx}/{len(all_products)}] Failed: {resp.status}")
            except Exception as e:
                print(f"  ✗ [{idx}/{len(all_products)}] Error: {str(e)}")
    
    print("\n✅ Scraping complete!")


def main():
    parser = argparse.ArgumentParser(description="Headless scraper for Amazon & Flipkart")
    parser.add_argument("--product-name", required=True, help="Product name to search for")
    parser.add_argument("--endpoint", default="http://localhost:3001/api/scrape", help="Backend API endpoint")
    
    args = parser.parse_args()
    
    # Run async scraper
    asyncio.run(scrape_and_send(args.product_name, args.endpoint))


if __name__ == "__main__":
    main()
