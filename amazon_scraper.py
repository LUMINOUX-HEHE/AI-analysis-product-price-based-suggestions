"""Amazon scraper implementation."""
from __future__ import annotations

from typing import List, Optional
from urllib.parse import quote_plus, urljoin

from bs4 import BeautifulSoup

from base_scraper import BaseScraper
from scraper_config import AMAZON_BASE_URL
from scraper_utils import ProductRecord


class AmazonScraper(BaseScraper):
    platform = "Amazon"

    def _build_search_url(self, query: str) -> str:
        return f"{AMAZON_BASE_URL}/s?k={quote_plus(query)}"

    def search(self, query: str, *, limit: int) -> List[ProductRecord]:
        html = self.fetch(self._build_search_url(query))
        results = list(self._parse_listing(html))
        return self._trim_results(results, limit=limit)

    def scrape_product_page(self, url: str) -> Optional[ProductRecord]:
        html = self.fetch(url)
        soup = BeautifulSoup(html, "html.parser")
        title_el = soup.select_one("#productTitle")
        price_el = soup.select_one("#corePriceDisplay_desktop_feature_div .a-price span.a-offscreen")
        rating_el = soup.select_one("#averageCustomerReviews span.a-icon-alt")
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
        cards = soup.select("div[data-component-type='s-search-result']")
        records: List[ProductRecord] = []
        for card in cards:
            title_el = card.select_one("h2 a span")
            link_el = card.select_one("h2 a")
            price_el = card.select_one("span.a-price span.a-offscreen")
            rating_el = card.select_one("span.a-icon-alt")
            if not (title_el and link_el):
                continue
            url = urljoin(AMAZON_BASE_URL, link_el.get("href"))
            record = ProductRecord.from_raw(
                name=title_el.get_text(strip=True),
                platform=self.platform,
                price_text=price_el.get_text(strip=True) if price_el else None,
                rating_text=rating_el.get_text(strip=True) if rating_el else None,
                url=url,
            )
            records.append(record)
        return records
