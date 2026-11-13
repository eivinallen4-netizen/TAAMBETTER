"""Turn a Codex sticker render into a print-ready die-cut sticker.

For each out/<name>.png:
  1. Remove the white background (flood fill from the border, so white fills inside
     the outline stay).
  2. Grow a smooth, rounded white border around the whole shape (the die-cut line
     follows the outside of this border).
  3. Save print/<name>.png: transparent background, white border, 300 DPI.
  4. Save preview/<name>.png: the sticker on grey with the cut line drawn in magenta.
Also builds preview/_sheet.png with all stickers together.

Usage: python diecut.py [name ...]   (no names = every png in out/)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

HERE = Path(__file__).parent
OUT, PRINT, PREVIEW = HERE / "out", HERE.parent / "print", HERE.parent / "preview"
ART_SIDE = 1800          # longest side of the artwork before the border (px)
BORDER = 60              # white border width (px) ~ 5 mm at 300 DPI
DPI = 300


def art_mask(im: Image.Image) -> Image.Image:
    """Opaque everywhere except the white region connected to the image edge."""
    bw = im.convert("L").point(lambda v: 255 if v >= 232 else 0)
    pad = 4
    g = Image.new("L", (bw.width + 2 * pad, bw.height + 2 * pad), 255)
    g.paste(bw, (pad, pad))
    ImageDraw.floodfill(g, (0, 0), 128, thresh=0)
    g = g.crop((pad, pad, g.width - pad, g.height - pad))
    return g.point(lambda v: 0 if v == 128 else 255)


def _morph(a, r, op):
    """Disk dilation (op=max) or erosion (op=min) of a bool array by radius r."""
    h, w = a.shape
    pad = np.pad(a, r, constant_values=(op is np.minimum))
    out = a.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy <= r * r:
                out = op(out, pad[r + dy:r + dy + h, r + dx:r + dx + w])
    return out


def grow(mask: Image.Image, r: int, close: int = 70) -> Image.Image:
    """Smooth die-cut shape: dilate by r+close, fill holes, erode by close (a morphological
    closing, so narrow gaps and notches get bridged), then blur for clean curves.
    Works at 1/4 scale for speed."""
    k = 4
    small = mask.resize((mask.width // k, mask.height // k), Image.BILINEAR)
    a = np.array(small) > 20
    a = _morph(a, (r + close) // k, np.maximum)
    # fill interior holes: anything not reachable from the edge becomes solid
    inv = Image.fromarray(np.where(a, 0, 255).astype(np.uint8)).copy()
    ImageDraw.floodfill(inv, (0, 0), 128, thresh=0)
    a = np.array(inv) != 128
    a = _morph(a, close // k, np.minimum)
    m = Image.fromarray((a * 255).astype(np.uint8)).resize(mask.size, Image.BICUBIC)
    m = m.filter(ImageFilter.GaussianBlur(6)).point(lambda v: 255 if v > 127 else 0)
    # never cut into the art itself
    m = ImageChops.lighter(m, mask.filter(ImageFilter.MaxFilter(21)))
    return m.filter(ImageFilter.GaussianBlur(1.2))


def process(src: Path) -> Image.Image:
    im = Image.open(src).convert("RGB")
    mask = art_mask(im)
    box = mask.getbbox()
    im, mask = im.crop(box), mask.crop(box)
    s = ART_SIDE / max(im.size)
    size = (round(im.width * s), round(im.height * s))
    im = im.resize(size, Image.LANCZOS)
    mask = mask.resize(size, Image.LANCZOS).point(lambda v: 255 if v > 127 else 0)

    pad = BORDER + 120
    W, H = size[0] + 2 * pad, size[1] + 2 * pad
    big = Image.new("L", (W, H), 0)
    big.paste(mask, (pad, pad))
    border = grow(big, BORDER)

    sticker = Image.new("RGBA", (W, H), (255, 255, 255, 0))
    white = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    sticker.paste(white, (0, 0), border)
    art = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    art.paste(im, (pad, pad), mask.filter(ImageFilter.GaussianBlur(0.7)))
    sticker = Image.alpha_composite(sticker, art)
    sticker = sticker.crop(sticker.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())

    PRINT.mkdir(exist_ok=True)
    sticker.save(PRINT / f"{src.stem}.png", dpi=(DPI, DPI))

    # preview: grey board, drop shadow, magenta cut line
    a = sticker.getchannel("A").point(lambda v: 255 if v > 127 else 0)
    edge = ImageChops.subtract(a, a.filter(ImageFilter.MinFilter(7)))
    pv = Image.new("RGBA", (sticker.width + 120, sticker.height + 120), (214, 214, 214, 255))
    shadow = Image.new("RGBA", sticker.size, (0, 0, 0, 90))
    pv.paste(shadow, (72, 76), a.filter(ImageFilter.GaussianBlur(10)))
    pv.alpha_composite(sticker, (60, 60))
    pv.paste((236, 0, 140, 255), (60, 60), edge)
    PREVIEW.mkdir(exist_ok=True)
    pv.convert("RGB").save(PREVIEW / f"{src.stem}.png")
    w_in, h_in = sticker.width / DPI, sticker.height / DPI
    print(f"{src.stem}: {sticker.width}x{sticker.height}px = {w_in:.1f} x {h_in:.1f} in @ {DPI} DPI")
    return pv


def sheet(previews):
    th = [p.copy() for p in previews]
    for t in th:
        t.thumbnail((700, 700))
    cols = 3
    rows = (len(th) + cols - 1) // cols
    sh = Image.new("RGB", (cols * 720, rows * 720), (214, 214, 214))
    for i, t in enumerate(th):
        x = (i % cols) * 720 + (720 - t.width) // 2
        y = (i // cols) * 720 + (720 - t.height) // 2
        sh.paste(t, (x, y))
    sh.save(PREVIEW / "_sheet.png")


if __name__ == "__main__":
    names = sys.argv[1:] or sorted(p.stem for p in OUT.glob("*.png"))
    pvs = [process(OUT / f"{n}.png") for n in names]
    if len(pvs) > 1:
        sheet(pvs)
