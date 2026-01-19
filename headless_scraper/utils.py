"""Utility functions for headless scraper"""
import re
from typing import Optional

def parse_price(price_text: str) -> Optional[float]:
    """
    Parse price text and extract numeric value
    Examples: "₹1,09,900" -> 109900, "$99.99" -> 99.99
    """
    if not price_text:
        return None
    
    try:
        # Remove all non-numeric characters except decimal point
        # Keep only digits and period
        numeric = re.sub(r'[^\d.]', '', price_text)
        
        if not numeric:
            return None
        
        # Handle different formats
        # If there's more than one decimal point, it's likely comma-separated (Indian format)
        if numeric.count('.') > 1:
            # Indian format: 1,09,900 -> remove last comma and periods
            numeric = numeric.replace('.', '')
        
        return float(numeric)
    except (ValueError, AttributeError):
        return None

def parse_rating(rating_text: str) -> Optional[float]:
    """
    Parse rating text
    Examples: "4.5 out of 5 stars" -> 4.5, "4.2" -> 4.2
    """
    if not rating_text:
        return None
    
    try:
        # Extract first decimal number
        match = re.search(r'\d+\.?\d*', rating_text)
        if match:
            return float(match.group())
    except (ValueError, AttributeError):
        pass
    
    return None

def clean_product_data(product: dict) -> dict:
    """
    Clean and normalize product data for API
    """
    cleaned = product.copy()
    
    # Parse and convert price to numeric
    if 'price' in cleaned and isinstance(cleaned['price'], str):
        price_value = parse_price(cleaned['price'])
        if price_value is not None:
            cleaned['price'] = price_value
        else:
            cleaned['price'] = 0  # Default if parsing fails
    
    # Parse rating to numeric
    if 'rating' in cleaned and isinstance(cleaned['rating'], str):
        rating_value = parse_rating(cleaned['rating'])
        if rating_value is not None:
            cleaned['rating'] = rating_value
    
    return cleaned
