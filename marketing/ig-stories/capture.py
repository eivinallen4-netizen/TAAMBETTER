"""Capture desktop + mobile full-page screenshots of each site for the story templates.
Run from this folder: python capture.py [id=url ...]
(The new Wave site is not live yet: python capture.py wave=http://localhost:3107)"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

SITES = {
    "taam": "https://taammarketing.com",
    "movers": "https://moversandjunkremoval.net",
    "wave": "https://waveheatingandcooling.com",
}
for arg in sys.argv[1:]:
    k, v = arg.split("=", 1)
    SITES[k] = v
ONLY = {a.split("=")[0] for a in sys.argv[1:]}
OUT = Path(__file__).parent / "shots"
OUT.mkdir(exist_ok=True)
SCROLL = """async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) {
  window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, 0); }"""

with sync_playwright() as p:
    b = p.chromium.launch()
    for sid, url in SITES.items():
        if ONLY and sid not in ONLY:
            continue
        for kind, vp, mobile in [("desktop", {"width": 1440, "height": 900}, False), ("mobile", {"width": 390, "height": 844}, True)]:
            ctx = b.new_context(viewport=vp, device_scale_factor=2, is_mobile=mobile, has_touch=mobile)
            pg = ctx.new_page()
            try:
                pg.goto(url, wait_until="networkidle", timeout=45000)
            except Exception:
                pg.wait_for_timeout(3000)
            pg.evaluate(SCROLL)
            pg.keyboard.press("Escape")
            # hide popups, cookie bars and the Next.js dev badge so they don't land in the shot
            pg.evaluate("document.querySelectorAll('dialog[open]').forEach(d => d.close())")
            pg.add_style_tag(content="dialog,nextjs-portal,[role=dialog],[aria-modal=true],[class*=cookie],[id*=cookie]{display:none!important}")
            pg.wait_for_timeout(1500)
            pg.screenshot(path=str(OUT / f"{sid}-{kind}.png"), full_page=True)
            print(sid, kind, "ok")
            ctx.close()
    b.close()
