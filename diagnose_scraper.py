#!/usr/bin/env python3
"""Diagnostic script to test scraper environment and dependencies"""
import sys
import subprocess
from pathlib import Path

def check_python():
    """Check Python version"""
    print(f"✓ Python version: {sys.version}")
    return True

def check_playwright():
    """Check if Playwright is installed"""
    try:
        import playwright
        print(f"✓ Playwright installed: {playwright.__version__}")
        return True
    except ImportError:
        print("✗ Playwright not installed")
        print("  Fix: pip install playwright")
        return False

def check_chromium():
    """Check if Chromium browser is installed"""
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            p.chromium.launch_server()
            print("✓ Chromium browser available")
            return True
    except Exception as e:
        print(f"✗ Chromium browser not available: {e}")
        print("  Fix: python -m playwright install chromium")
        return False

def check_dependencies():
    """Check all required dependencies"""
    dependencies = {
        'beautifulsoup4': 'bs4',
        'lxml': 'lxml',
        'aiohttp': 'aiohttp',
        'requests': 'requests'
    }
    
    all_ok = True
    for pkg, import_name in dependencies.items():
        try:
            __import__(import_name)
            print(f"✓ {pkg} installed")
        except ImportError:
            print(f"✗ {pkg} not installed")
            print(f"  Fix: pip install {pkg}")
            all_ok = False
    
    return all_ok

def test_scraper_imports():
    """Test if scraper modules can be imported"""
    try:
        sys.path.insert(0, str(Path(__file__).parent))
        from headless_scraper.amazon_headless import AmazonHeadlessScraper
        from headless_scraper.flipkart_headless import FlipkartHeadlessScraper
        print("✓ Scraper modules imported successfully")
        return True
    except ImportError as e:
        print(f"✗ Failed to import scraper modules: {e}")
        return False

def main():
    print("=" * 60)
    print("Scraper Environment Diagnostic")
    print("=" * 60)
    
    checks = [
        ("Python Version", check_python),
        ("Playwright Package", check_playwright),
        ("Chromium Browser", check_chromium),
        ("Dependencies", check_dependencies),
        ("Scraper Modules", test_scraper_imports),
    ]
    
    results = []
    for name, check in checks:
        print(f"\n[{name}]")
        try:
            result = check()
            results.append((name, result))
        except Exception as e:
            print(f"✗ Error: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nPassed: {passed}/{total}")
    
    if passed == total:
        print("\n✅ All checks passed! Scraper should work correctly.")
        return 0
    else:
        print("\n❌ Some checks failed. Please fix the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
