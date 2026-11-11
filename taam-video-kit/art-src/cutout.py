"""Cut a Codex prop off its white background and save a trimmed webp for the kit.

The background is removed by flood-filling the near-white region connected to the image
border, so white fills inside the outline stay opaque. Usage:
    python cutout.py props/phone-ringing.png ../assets/props/phone-ringing.webp
"""
import sys
from collections import deque

from PIL import Image, ImageFilter


def cutout(src: str, dst: str, max_side: int = 900) -> None:
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    px = im.load()
    lum = lambda p: (p[0] + p[1] + p[2]) / 3
    bg = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        i = y * w + x
        if bg[i] or lum(px[x, y]) < 200:
            continue
        bg[i] = 1
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    alpha = Image.new("L", (w, h))
    alpha.putdata([0 if b else 255 for b in bg])
    # Soften the cut edge by a pixel so it doesn't look jagged when scaled.
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.8))
    im.putalpha(alpha)
    box = alpha.point(lambda a: 255 if a > 16 else 0).getbbox()
    im = im.crop(box)
    im.thumbnail((max_side, max_side), Image.LANCZOS)
    im.save(dst, "WEBP", quality=92)
    print(dst, im.size)


if __name__ == "__main__":
    cutout(sys.argv[1], sys.argv[2])
