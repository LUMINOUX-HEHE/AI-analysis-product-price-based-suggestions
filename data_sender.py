"""Utility for sending scraped payloads to the backend service."""
from __future__ import annotations

from typing import Iterable

import requests

from scraper_config import BACKEND_ENDPOINT, REQUEST_TIMEOUT
from scraper_utils import ProductRecord


def send_to_backend(
    records: Iterable[ProductRecord],
    *,
    endpoint: str = BACKEND_ENDPOINT,
) -> dict | None:
    payload = [record.to_payload() for record in records]
    if not payload:
        return None
    response = requests.post(endpoint, json=payload, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    try:
        return response.json()
    except ValueError:
        return None
