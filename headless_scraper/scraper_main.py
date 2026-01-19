"""Main orchestrator for headless scraping"""
import asyncio
import argparse
import json
import requests
from typing import List, Dict
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from headless_scraper.amazon_headless import AmazonHeadlessScraper
from headless_scraper.flipkart_headless import FlipkartHeadlessScraper
from headless_scraper.config import API_ENDPOINT, DEFAULT_PRODUCT_LIMIT
from headless_scraper.utils import clean_product_data

class ScraperOrchestrator:
    """Orchestrate scraping from multiple platforms"""
    
    def __init__(self, api_endpoint: str = API_ENDPOINT):
        self.api_endpoint = api_endpoint
        self.results = []
    
    async def scrape_all(self, query: str, limit: int = DEFAULT_PRODUCT_LIMIT, 
                        platforms: List[str] = None):
        """Scrape from all specified platforms"""
        if platforms is None:
            platforms = ['amazon', 'flipkart']
        
        print(f"\n{'='*60}")
        print(f"Starting Headless Scraper for: {query}")
        print(f"Platforms: {', '.join(platforms)}")
        print(f"Limit: {limit} products per platform")
        print(f"{'='*60}\n")
        
        # Scrape Amazon
        if 'amazon' in platforms:
            amazon_scraper = AmazonHeadlessScraper()
            try:
                amazon_products = await amazon_scraper.search_products(query, limit)
                self.results.extend(amazon_products)
            finally:
                await amazon_scraper.close()
        
        # Scrape Flipkart
        if 'flipkart' in platforms:
            flipkart_scraper = FlipkartHeadlessScraper()
            try:
                flipkart_products = await flipkart_scraper.search_products(query, limit)
                self.results.extend(flipkart_products)
            finally:
                await flipkart_scraper.close()
        
        return self.results
    
    def send_to_api(self, products: List[Dict]) -> int:
        """Send scraped products to backend API"""
        if not products:
            print("\n[API] No products to send")
            return 0
        
        print(f"\n{'='*60}")
        print(f"Sending {len(products)} products to API")
        print(f"Endpoint: {self.api_endpoint}")
        print(f"{'='*60}\n")
        
        success_count = 0
        for i, product in enumerate(products, 1):
            try:
                # Clean product data for API compatibility
                cleaned_product = clean_product_data(product)
                
                response = requests.post(
                    self.api_endpoint,
                    json=cleaned_product,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    print(f"[API] [{i}/{len(products)}] ✓ {product['productName'][:50]}...")
                    success_count += 1
                else:
                    print(f"[API] [{i}/{len(products)}] ✗ Failed: {response.status_code}")
                    if response.text:
                        print(f"       Error: {response.text[:100]}")
                    
            except Exception as e:
                print(f"[API] [{i}/{len(products)}] ✗ Error: {str(e)}")
        
        print(f"\n[API] Successfully sent {success_count}/{len(products)} products")
        return success_count
    
    def save_to_file(self, products: List[Dict], filename: str = "scraped_data.json"):
        """Save results to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(products, f, indent=2, ensure_ascii=False)
            print(f"\n[File] Saved {len(products)} products to {filename}")
        except Exception as e:
            print(f"\n[File] Error saving to file: {str(e)}")

async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Headless Product Scraper for Amazon and Flipkart"
    )
    parser.add_argument(
        '--query', '-q',
        required=True,
        help='Product search query (e.g., "laptop", "iphone")'
    )
    parser.add_argument(
        '--limit', '-l',
        type=int,
        default=DEFAULT_PRODUCT_LIMIT,
        help=f'Number of products per platform (default: {DEFAULT_PRODUCT_LIMIT})'
    )
    parser.add_argument(
        '--platforms', '-p',
        nargs='+',
        choices=['amazon', 'flipkart'],
        default=['amazon', 'flipkart'],
        help='Platforms to scrape (default: both)'
    )
    parser.add_argument(
        '--api', '-a',
        default=API_ENDPOINT,
        help=f'Backend API endpoint (default: {API_ENDPOINT})'
    )
    parser.add_argument(
        '--save', '-s',
        action='store_true',
        help='Save results to scraped_data.json'
    )
    parser.add_argument(
        '--no-send',
        action='store_true',
        help='Do not send to API (just scrape and optionally save)'
    )
    
    args = parser.parse_args()
    
    # Create orchestrator
    orchestrator = ScraperOrchestrator(api_endpoint=args.api)
    
    # Scrape products
    products = await orchestrator.scrape_all(
        query=args.query,
        limit=args.limit,
        platforms=args.platforms
    )
    
    # Display results
    print(f"\n{'='*60}")
    print(f"SCRAPING COMPLETE")
    print(f"{'='*60}")
    print(f"Total products scraped: {len(products)}")
    
    if products:
        print(f"\nSample product:")
        print(json.dumps(products[0], indent=2))
    
    # Send to API
    if not args.no_send and products:
        orchestrator.send_to_api(products)
    
    # Save to file
    if args.save and products:
        orchestrator.save_to_file(products)
    
    print(f"\n{'='*60}")
    print("Done!")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    asyncio.run(main())
