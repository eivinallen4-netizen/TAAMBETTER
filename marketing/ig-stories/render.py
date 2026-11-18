"""Render every story in stories.js to a 1080x1920 PNG.

  python capture.py                       # 1. fresh screenshots into shots/
  python render.py                        # 2. crops + all stories into out/
  python render.py movers                 #    just one site
  python render.py movers bento           #    one site, one layout

Edit words in stories.js and layouts in story.html, then run render.py again.
"""
import re
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

Image.MAX_IMAGE_PIXELS = None
HERE = Path(__file__).parent
SHOTS, CROPS, OUT = HERE / "shots", HERE / "crops", HERE / "out"


def make_crops(site: str) -> None:
    """Cut the huge full-page screenshots down to the parts the templates show."""
    CROPS.mkdir(exist_ok=True)
    d = Image.open(SHOTS / f"{site}-desktop.png").convert("RGB")
    m = Image.open(SHOTS / f"{site}-mobile.png").convert("RGB")
    w = d.width
    d.crop((0, 0, w, min(d.height, int(w * 0.62)))).save(CROPS / f"{site}-desktop-hero.jpg", quality=90)
    d.crop((0, 0, w, min(d.height, int(w * 3.2)))).save(CROPS / f"{site}-desktop-tall.jpg", quality=88)
    m.crop((0, 0, m.width, min(m.height, int(m.width * 2.3)))).save(CROPS / f"{site}-mobile.jpg", quality=90)


def drop_floaters(im: Image.Image, keep: float = 0.08) -> Image.Image:
    """Erase small detached bits (sparkles, snowflakes, speed lines) so nothing floats around a prop.
    Keeps every solid blob at least `keep` x the size of the biggest one."""
    S = 4  # label on a quarter-size alpha map: fast enough in plain Python
    a = im.getchannel("A")
    small = a.resize((a.width // S, a.height // S)).point(lambda v: 1 if v > 24 else 0)
    w, h = small.size
    px = list(small.get_flattened_data()) if hasattr(small, "get_flattened_data") else list(small.getdata())
    label = [0] * (w * h)
    sizes = {}
    n = 0
    for start in range(w * h):
        if not px[start] or label[start]:
            continue
        n += 1
        stack, label[start], count = [start], n, 0
        while stack:
            i = stack.pop()
            count += 1
            x, y = i % w, i // w
            for j in (i - 1 if x else -1, i + 1 if x < w - 1 else -1, i - w if y else -1, i + w if y < h - 1 else -1):
                if j >= 0 and px[j] and not label[j]:
                    label[j] = n
                    stack.append(j)
        sizes[n] = count
    if not sizes:
        return im
    big = max(sizes.values())
    kept = {k for k, v in sizes.items() if v >= big * keep}
    mask = Image.new("L", (w, h))
    mask.putdata([255 if l in kept else 0 for l in label])
    mask = mask.resize(a.size).point(lambda v: 255 if v > 0 else 0)
    from PIL import ImageChops, ImageFilter
    mask = mask.filter(ImageFilter.MaxFilter(9))  # grow a little so kept edges stay crisp
    out = im.copy()
    out.putalpha(ImageChops.multiply(a, mask))
    return out


# Props whose loose bits are bigger than usual (hearts, sound arcs): keep only blobs this close to the biggest.
KEEP = {"phone-play.png": 0.5, "megaphone.png": 0.5}


def trim_props() -> None:
    """Copy each prop in assets/ without floating bits, trimmed to its visible pixels,
    so it sits exactly on its floor line."""
    out = CROPS / "props"
    out.mkdir(parents=True, exist_ok=True)
    chars = HERE.parent.parent / "public" / "characters"
    jobs = [(f, f.name) for f in (HERE / "assets").glob("*.png")]
    jobs += [(f, "char-" + f.name) for f in chars.glob("*.png")]  # mascot poses, used as 'char:<pose>'
    for f, name in jobs:
        if (out / name).exists() and (out / name).stat().st_mtime > f.stat().st_mtime:
            continue
        im = drop_floaters(Image.open(f).convert("RGBA"), KEEP.get(name, 0.08))
        box = im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()
        (im.crop(box) if box else im).save(out / name)


def config():
    js = (HERE / "stories.js").read_text(encoding="utf-8")
    sites = re.findall(r"^  (\w+): \{", js, re.M)
    layouts = re.findall(r"'(\w+)'", re.search(r"LAYOUTS = \[(.*?)\]", js).group(1))
    return sites, layouts


def main() -> None:
    sites, layouts = config()
    if len(sys.argv) > 1:
        sites = [sys.argv[1]]
    if len(sys.argv) > 2:
        layouts = [sys.argv[2]]
    OUT.mkdir(exist_ok=True)
    for s in sites:
        make_crops(s)
    trim_props()
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1080, "height": 1920})
        for s in sites:
            for lay in layouts:
                pg.goto((HERE / "story.html").as_uri() + f"?site={s}&layout={lay}", wait_until="networkidle")
                pg.wait_for_selector("body[data-ready='1']", timeout=20000)
                pg.wait_for_timeout(300)
                path = OUT / f"{s}-{lay}.png"
                pg.screenshot(path=str(path))
                print(path.relative_to(HERE))
        b.close()


if __name__ == "__main__":
    main()
