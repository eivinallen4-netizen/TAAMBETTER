"""Render a 1080x1080 highlight cover from cover.html.
  python render_cover.py "WEB|SITES"   ->  out/covers/highlight-websites.png
"""
import sys
from urllib.parse import quote
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE = Path(__file__).parent
text = sys.argv[1] if len(sys.argv) > 1 else "WEB|SITES"
out = HERE / "out" / "covers"
out.mkdir(parents=True, exist_ok=True)
path = out / f"highlight-{text.replace('|', '').lower()}.png"
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1080, "height": 1080})
    pg.goto((HERE / "cover.html").as_uri() + "?text=" + quote(text), wait_until="networkidle")
    pg.wait_for_selector("body[data-ready='1']")
    pg.screenshot(path=str(path))
    b.close()
print(path)
