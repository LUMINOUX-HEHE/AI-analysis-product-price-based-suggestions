"""Stealth configuration for headless Playwright scraper"""
import random
from typing import List, Dict

# User agents for rotation
USER_AGENTS: List[str] = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
]

# Viewport sizes for natural behavior
VIEWPORTS: List[Dict[str, int]] = [
    {"width": 1920, "height": 1080},
    {"width": 1366, "height": 768},
    {"width": 1536, "height": 864},
    {"width": 1440, "height": 900},
]

# Random delay ranges (seconds)
MIN_PAGE_LOAD_DELAY = 2.0
MAX_PAGE_LOAD_DELAY = 4.0
MIN_ACTION_DELAY = 1.0
MAX_ACTION_DELAY = 2.5

# Backend API
API_ENDPOINT = "http://localhost:3001/api/scrape"

# Scraping limits
DEFAULT_PRODUCT_LIMIT = 5
PAGE_TIMEOUT = 30000  # 30 seconds

def get_random_user_agent() -> str:
    """Get random user agent"""
    return random.choice(USER_AGENTS)

def get_random_viewport() -> Dict[str, int]:
    """Get random viewport size"""
    return random.choice(VIEWPORTS)

def random_delay(min_delay: float = MIN_ACTION_DELAY, max_delay: float = MAX_ACTION_DELAY) -> float:
    """Generate random delay"""
    return random.uniform(min_delay, max_delay)
