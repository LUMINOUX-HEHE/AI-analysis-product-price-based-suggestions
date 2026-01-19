"""Fallback scraper using requests and BeautifulSoup when Playwright fails"""
import requests
from bs4 import BeautifulSoup
import asyncio
from datetime import datetime
from typing import List, Dict

class FallbackScraper:
    """Simple fallback scraper using requests instead of Playwright"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    async def search_amazon(self, query: str, limit: int = 5) -> List[Dict]:
        """Search Amazon using requests + BeautifulSoup"""
        try:
            url = f"https://www.amazon.in/s?k={query}"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'lxml')
            products = []
            
            # Find product cards
            for card in soup.find_all('div', {'data-component-type': 's-search-result'})[:limit]:
                try:
                    title_elem = card.find('h2', {'class': 'a-size-mini'})
                    if not title_elem:
                        title_elem = card.find('span', {'class': 'a-size-medium'})
                    
                    price_elem = card.find('span', {'class': 'a-price-whole'})
                    
                    if title_elem:
                        title = title_elem.get_text(strip=True)
                        price = price_elem.get_text(strip=True) if price_elem else "N/A"
                        
                        products.append({
                            "productName": title,
                            "platform": "Amazon",
                            "price": price,
                            "url": url,
                            "timestamp": datetime.now().isoformat()
                        })
                except:
                    continue
            
            return products
        except Exception as e:
            print(f"[Fallback] Amazon scrape error: {e}")
            return []
    
    async def search_flipkart(self, query: str, limit: int = 5) -> List[Dict]:
        """Search Flipkart using requests + BeautifulSoup"""
        try:
            url = f"https://www.flipkart.com/search?q={query}"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'lxml')
            products = []
            
            # Find product containers
            for container in soup.find_all('div', {'class': '_2kHmtP'})[:limit]:
                try:
                    title_elem = container.find('a', {'class': 's1Q9rs6'})
                    price_elem = container.find('div', {'class': '_30jeq3'})
                    
                    if title_elem:
                        title = title_elem.get_text(strip=True)
                        price = price_elem.get_text(strip=True) if price_elem else "N/A"
                        
                        products.append({
                            "productName": title,
                            "platform": "Flipkart",
                            "price": price,
                            "url": url,
                            "timestamp": datetime.now().isoformat()
                        })
                except:
                    continue
            
            return products
        except Exception as e:
            print(f"[Fallback] Flipkart scrape error: {e}")
            return []
