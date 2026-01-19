"""Flipkart scraper implementation."""
from __future__ import annotations

from typing import List, Optional
from urllib.parse import quote_plus, urljoin

from bs4 import BeautifulSoup

from base_scraper import BaseScraper
from scraper_config import FLIPKART_BASE_URL
from scraper_utils import ProductRecord


class FlipkartScraper(BaseScraper):
    platform = "Flipkart"

    def _build_search_url(self, query: str) -> str:
        encoded = quote_plus(query)
        return f"{FLIPKART_BASE_URL}/search?q={encoded}"

    def search(self, query: str, *, limit: int) -> List[ProductRecord]:
        html = self.fetch(self._build_search_url(query))
        results = list(self._parse_listing(html))
        return self._trim_results(results, limit=limit)

    def scrape_product_page(self, url: str) -> Optional[ProductRecord]:
        html = self.fetch(url)
        soup = BeautifulSoup(html, "html.parser")
        title_el = soup.select_one("span.VU-ZEz") or soup.select_one("span.B_NuCI")
        price_el = soup.select_one("div._30jeq3")
        rating_el = soup.select_one("div._3LWZlK")
        if not title_el:
            return None
        return ProductRecord.from_raw(
            name=title_el.get_text(strip=True),
            platform=self.platform,
            price_text=price_el.get_text(strip=True) if price_el else None,
            rating_text=rating_el.get_text(strip=True) if rating_el else None,
            url=url,
        )

    def _parse_listing(self, html: str) -> List[ProductRecord]:
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.select("div._13oc-S") or soup.select("div._1AtVbE")
        records: List[ProductRecord] = []
        for card in cards:
            title_el = card.select_one("div._4rR01T") or card.select_one("a.s1Q9rs")
            link_el = card.select_one("a._1fQZEK") or card.select_one("a.s1Q9rs")
            price_el = card.select_one("div._30jeq3")
            rating_el = card.select_one("div._3LWZlK")
            if not (title_el and link_el):
                continue
            url = urljoin(FLIPKART_BASE_URL, link_el.get("href"))
            record = ProductRecord.from_raw(
                name=title_el.get_text(strip=True),
                platform=self.platform,
                price_text=price_el.get_text(strip=True) if price_el else None,
                rating_text=rating_el.get_text(strip=True) if rating_el else None,
                url=url,
            )
            records.append(record)
        return records
