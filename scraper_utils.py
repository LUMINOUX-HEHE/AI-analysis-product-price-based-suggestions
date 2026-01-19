"""Utility helpers for scraping, normalization, and persistence."""
from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Optional

_NAME_SANITIZER = re.compile(r"[^a-z0-9+]+")
_PRICE_SANITIZER = re.compile(r"[\d,.]+")
_RATING_SANITIZER = re.compile(r"\d+(?:\.\d+)?")


def normalize_display_name(raw_name: str) -> str:
    cleaned = _NAME_SANITIZER.sub(" ", raw_name.lower()).strip()
    canonical = re.sub(r"\s+", " ", cleaned)
    return canonical.title()


def normalize_price(raw_price: str) -> Optional[float]:
    match = _PRICE_SANITIZER.search(raw_price.replace("\xa0", " "))
    if not match:
        return None
    normalized = match.group().replace(",", "")
    try:
        return float(normalized)
    except ValueError:
        return None


def normalize_rating(raw_rating: str) -> Optional[float]:
    match = _RATING_SANITIZER.search(raw_rating)
    if not match:
        return None
    try:
        return float(match.group())
    except ValueError:
        return None


@dataclass(slots=True)
class ProductRecord:
    productName: str
    platform: str
    price: Optional[float]
    rating: Optional[float]
    url: str
    timestamp: str

    @classmethod
    def from_raw(
        cls,
        *,
        name: str,
        platform: str,
        price_text: str | None,
        rating_text: str | None,
        url: str,
    ) -> "ProductRecord":
        normalized_name = normalize_display_name(name)
        price_value = normalize_price(price_text or "") if price_text else None
        rating_value = normalize_rating(rating_text or "") if rating_text else None
        timestamp = datetime.now(timezone.utc).isoformat()
        return cls(
            productName=normalized_name,
            platform=platform,
            price=price_value,
            rating=rating_value,
            url=url,
            timestamp=timestamp,
        )

    def to_payload(self) -> dict[str, str | float | None]:
        payload = asdict(self)
        if self.price is not None:
            payload["price"] = f"{self.price:.2f}"
        if self.rating is not None:
            payload["rating"] = f"{self.rating:.1f}"
        return payload


def dump_records(records: Iterable[ProductRecord], destination: str | Path) -> None:
    payload = [record.to_payload() for record in records]
    Path(destination).write_text(json.dumps(payload, indent=2), encoding="utf-8")
