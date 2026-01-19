"""Central configuration for the Real-Time Product Price Intelligence scraper."""
from __future__ import annotations

import random
from typing import Final

BACKEND_ENDPOINT: Final[str] = "http://localhost:3000/scrape"
REQUEST_TIMEOUT: Final[int] = 30  # seconds - increased for stability

# User-Agent rotation for anti-detection
USER_AGENTS: Final[list[str]] = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
]

def get_random_headers() -> dict[str, str]:
    """Generate realistic browser headers with rotation."""
    return {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "en-US,en;q=0.9,hi;q=0.8",
        "cache-control": "max-age=0",
        "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent": random.choice(USER_AGENTS),
    }

REQUEST_HEADERS: Final[dict[str, str]] = get_random_headers()

# Retry configuration
MAX_RETRIES: Final[int] = 3
RETRY_DELAY_BASE: Final[float] = 2.0  # seconds
RETRY_DELAY_MAX: Final[float] = 10.0  # seconds

# Random delay ranges (seconds) to simulate human behavior
MIN_DELAY_BETWEEN_REQUESTS: Final[float] = 2.0
MAX_DELAY_BETWEEN_REQUESTS: Final[float] = 5.0

AMAZON_BASE_URL: Final[str] = "https://www.amazon.in"
FLIPKART_BASE_URL: Final[str] = "https://www.flipkart.com"
DEFAULT_RESULT_LIMIT: Final[int] = 5
SCRAPE_OUTPUT_PATH: Final[str] = "scrape-output.json"
PLAYWRIGHT_WAIT_SELECTOR: Final[str | None] = None
