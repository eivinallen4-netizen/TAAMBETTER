"""Builds the site favicons and the LinkedIn page logo: the white TAAM "A" mark on brand orange.

Run: python flyers/icon/build.py
The A comes from the vector in public/brand/taam-mark.svg (rendered with headless Chrome so it stays crisp).
Writes the website icons straight into public/ and app/, and the LinkedIn logo to flyers/icon/out/.
"""
import re
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = HERE / "out"
OUT.mkdir(exist_ok=True)
CHROME = r"C:/Program Files/Google/Chrome/Application/chrome.exe"
MASTER = 1024

PATH = re.search(r'd="([^"]+)"', (ROOT / "public/brand/taam-mark.svg").read_text()).group(1)
# Bounding box of the A inside that path.
AX, AY, AW, AH = 299.5, 234.5, 370, 354


def render(name: str, a_height: float) -> Image.Image:
    """Square orange tile with the A centered at `a_height` (share of the tile height)."""
    s = a_height * MASTER / AH
    x = (MASTER - AW * s) / 2 - AX * s
    y = (MASTER - AH * s) / 2 - AY * s
    svg = OUT / f"{name}.svg"
    svg.write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{MASTER}" height="{MASTER}" viewBox="0 0 {MASTER} {MASTER}">'
        f'<rect width="100%" height="100%" fill="#F46325"/>'
        f'<path transform="translate({x:.2f} {y:.2f}) scale({s:.5f})" d="{PATH}" fill="#FFFFFF" fill-rule="evenodd"/></svg>'
    )
    png = OUT / f"{name}.png"
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                    f"--window-size={MASTER},{MASTER}", f"--screenshot={png}", svg.as_uri()],
                   check=True, capture_output=True)
    return Image.open(png).convert("RGBA")


def rounded(img: Image.Image) -> Image.Image:
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, img.width - 1, img.height - 1), radius=int(img.width * 0.22), fill=255)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def save(img: Image.Image, size: int, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.resize((size, size), Image.LANCZOS).save(path)
    print("wrote", path.relative_to(ROOT), f"{size}x{size}")


square = render("taam-icon", 0.62)
# At browser-tab sizes the A fills more of the tile so it still reads at 16px.
tab = rounded(render("taam-icon-tab", 0.74))

fav = ROOT / "public" / "brand-assets" / "app-icon" / "favicons"
save(tab, 16, fav / "favicon-16.png")
save(tab, 32, fav / "favicon-32.png")
save(rounded(square), 192, fav / "icon-192.png")
save(rounded(square), 512, fav / "icon-512.png")
# iOS rounds the corners itself, so the touch icon is full-bleed.
save(square, 180, fav / "apple-touch-icon-180.png")
save(square, 180, ROOT / "public" / "apple-touch-icon.png")

for ico in (ROOT / "public" / "favicon.ico", ROOT / "app" / "favicon.ico"):
    tab.resize((256, 256), Image.LANCZOS).save(ico, sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("wrote", ico.relative_to(ROOT))

# LinkedIn page logo: 400x400 recommended, shown as a square, so no rounded corners.
save(square, 400, OUT / "linkedin-logo-400.png")
