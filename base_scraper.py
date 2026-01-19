"""Base scraper with optional dynamic rendering support."""
from __future__ import annotations

import contextlib
import random
import time
from abc import ABC, abstractmethod
from typing import Iterable, List, Optional

import requests
from requests import Response
from requests.exceptions import RequestException

from scraper_config import (
    PLAYWRIGHT_WAIT_SELECTOR,
    REQUEST_TIMEOUT,
    get_random_headers,
    MAX_RETRIES,
    RETRY_DELAY_BASE,
    RETRY_DELAY_MAX,
    MIN_DELAY_BETWEEN_REQUESTS,
    MAX_DELAY_BETWEEN_REQUESTS,
)
from scraper_utils import ProductRecord

try:
    from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
    from playwright.sync_api import sync_playwright

    PLAYWRIGHT_AVAILABLE = True
except Exception:  # pragma: no cover - playwright is optional
    PLAYWRIGHT_AVAILABLE = False
    sync_playwright = None  # type: ignore
    PlaywrightTimeoutError = Exception  # type: ignore


class BaseScraper(ABC):
    platform: str

    def __init__(self, *, use_dynamic: bool = False, proxies: List[str] = None) -> None:
        self.session = requests.Session()
        self.use_dynamic = use_dynamic and PLAYWRIGHT_AVAILABLE
        self.proxies = proxies or []
        self.current_proxy_index = 0

    def _get_next_proxy(self) -> dict:
        """Get next proxy in rotation, or None if no proxies configured."""
        if not self.proxies:
            return None
        
        proxy_url = self.proxies[self.current_proxy_index]
        self.current_proxy_index = (self.current_proxy_index + 1) % len(self.proxies)
        
        return {
            'http': proxy_url,
            'https': proxy_url
        }

    def _fetch_with_requests(self, url: str) -> str:
        proxy = self._get_next_proxy()
        
        # Disable SSL verification when using proxies (common issue with free proxies)
        verify_ssl = proxy is None
        
        # Retry logic with exponential backoff
        for attempt in range(MAX_RETRIES):
            try:
                # Random delay before request (simulate human behavior)
                if attempt > 0:  # Don't delay on first attempt
                    delay = min(RETRY_DELAY_BASE * (2 ** attempt), RETRY_DELAY_MAX)
                    time.sleep(delay + random.uniform(0, 1))
                else:
                    time.sleep(random.uniform(MIN_DELAY_BETWEEN_REQUESTS, MAX_DELAY_BETWEEN_REQUESTS))
                
                # Get fresh headers for each request
                headers = get_random_headers()
                
                response: Response = self.session.get(
                    url,
                    headers=headers,
                    timeout=REQUEST_TIMEOUT,
                    proxies=proxy,
                    verify=verify_ssl
                )
                response.raise_for_status()
                return response.text
                
            except RequestException as e:
                if attempt == MAX_RETRIES - 1:  # Last attempt
                    raise
                print(f"⚠️  Attempt {attempt + 1}/{MAX_RETRIES} failed: {str(e)[:100]}")
                continue
        
        raise RequestException("Max retries exceeded")

    def _fetch_with_playwright(self, url: str) -> str:
        if not PLAYWRIGHT_AVAILABLE:
            raise RuntimeError("Playwright is not installed; dynamic fetch unavailable.")
        with contextlib.ExitStack() as stack:
            playwright = sync_playwright().start()
            stack.callback(playwright.stop)
            browser = playwright.chromium.launch(headless=True)
            stack.callback(browser.close)
            context = browser.new_context()
            stack.callback(context.close)
            page = context.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=REQUEST_TIMEOUT * 1000)
            if PLAYWRIGHT_WAIT_SELECTOR:
                with contextlib.suppress(PlaywrightTimeoutError):
                    page.wait_for_selector(PLAYWRIGHT_WAIT_SELECTOR, timeout=5000)
            return page.content()

    def fetch(self, url: str) -> str:
        if self.use_dynamic:
            return self._fetch_with_playwright(url)
        return self._fetch_with_requests(url)

    @abstractmethod
    def search(self, query: str, *, limit: int) -> List[ProductRecord]:
        raise NotImplementedError

    @abstractmethod
    def scrape_product_page(self, url: str) -> Optional[ProductRecord]:
        raise NotImplementedError

    def _trim_results(self, results: Iterable[ProductRecord], *, limit: int) -> List[ProductRecord]:
        trimmed: List[ProductRecord] = []
        for record in results:
            trimmed.append(record)
            if len(trimmed) >= limit:
                break
        return trimmed
