"""Build the plain-branding logo stickers from the real TAAM SVG renders.

Writes out/logo-*.png on a white background; diecut.py then adds the cut border.
Needs brand-taam-wordmark.png and brand-taam-mark.png (rendered from public/brand/*.svg).
"""
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ORANGE, INK, WHITE = (244, 99, 37), (17, 17, 17), (255, 255, 255)
S = 1400  # canvas

WORD = Image.open("brand-taam-wordmark.png").convert("RGBA").getchannel("A")
MARK = Image.open("brand-taam-mark.png").convert("RGBA").getchannel("A")


def fit(alpha, w):
    return alpha.resize((w, round(alpha.height * w / alpha.width)), Image.LANCZOS)


def grow(alpha, r):
    """Round outline of radius r around an alpha shape (blur + threshold)."""
    big = Image.new("L", (alpha.width + 4 * r, alpha.height + 4 * r), 0)
    big.paste(alpha, (2 * r, 2 * r))
    a = np.array(big) > 127
    h, w = a.shape
    pad = np.pad(a, r)
    out = a.copy()
    st = max(1, r // 12)
    for dy in range(-r, r + 1, st):
        for dx in range(-r, r + 1, st):
            if dx * dx + dy * dy <= r * r:
                out |= pad[r + dy:r + dy + h, r + dx:r + dx + w]
    m = Image.fromarray((out * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))
    return m.point(lambda v: 255 if v > 127 else 0).filter(ImageFilter.GaussianBlur(1)), 2 * r


def solid(alpha):
    """Fill every enclosed hole in a shape (keeps its outer outline as-is)."""
    inv = Image.fromarray(np.where(np.array(alpha) > 127, 0, 255).astype(np.uint8)).copy()
    ImageDraw.floodfill(inv, (0, 0), 128, thresh=0)
    return ImageChops.lighter(alpha, Image.fromarray(np.where(np.array(inv) == 128, 0, 255).astype(np.uint8)))


def fill_holes(alpha, close):
    """Bridge gaps (closing) and make the shape solid, so no notches show through."""
    a, _ = grow(alpha, close)
    a = a.crop((close * 2, close * 2, close * 2 + alpha.width, close * 2 + alpha.height))
    inv = Image.fromarray(np.where(np.array(a) > 127, 0, 255).astype(np.uint8)).copy()
    ImageDraw.floodfill(inv, (0, 0), 128, thresh=0)
    solid = Image.fromarray(np.where(np.array(inv) == 128, 0, 255).astype(np.uint8))
    # erode back by close so the outline still hugs the letters
    shrunk = solid.filter(ImageFilter.MinFilter(2 * (close // 2) + 1)).filter(ImageFilter.MinFilter(2 * (close - close // 2) + 1))
    return ImageChops.lighter(alpha, shrunk)


def canvas():
    return Image.new("RGB", (S, S), WHITE)


def put(im, alpha, colour, xy):
    im.paste(Image.new("RGB", alpha.size, colour), xy, alpha)


def centred(alpha, dy=0):
    return ((S - alpha.width) // 2, (S - alpha.height) // 2 + dy)


def save(im, name):
    im.save(f"out/{name}.png")
    print(name)


# 1. Classic: black wordmark, the die-cut follows the letters.
im = canvas(); w = fit(WORD, 1150); put(im, w, INK, centred(w)); save(im, "logo-classic")

# 2. Orange wordmark, thick ink outline and a chunky ink drop shadow (streetwear).
im = canvas(); w = fit(WORD, 1050)
o, off = grow(w, 34)
x, y = centred(o)
put(im, o, INK, (x + 30, y + 34))      # shadow
put(im, o, INK, (x, y))                # outline
put(im, w, ORANGE, (x + off, y + off))
save(im, "logo-orange-outline")

# 3. Round badge: orange disc, ink ring, black A-mark.
im = canvas(); d = ImageDraw.Draw(im); c, R = S // 2, 600
d.ellipse((c - R, c - R, c + R, c + R), fill=INK)
d.ellipse((c - R + 46, c - R + 46, c + R - 46, c + R - 46), fill=ORANGE)
m = fit(MARK, 700); put(im, m, INK, centred(m, 10)); save(im, "logo-mark-orange")

# 4. Ink badge: black disc, orange A-mark, thin orange inner ring.
im = canvas(); d = ImageDraw.Draw(im)
d.ellipse((c - R, c - R, c + R, c + R), fill=INK)
d.ellipse((c - R + 50, c - R + 50, c + R - 50, c + R - 50), outline=ORANGE, width=18)
m = fit(MARK, 700); put(im, m, ORANGE, centred(m, 10)); save(im, "logo-mark-ink")

# 5. Blob: white wordmark on an orange shape that hugs the letters (no box).
im = canvas(); w = fit(WORD, 1050)
o, off = grow(w, 70)
ring, off2 = grow(o, 22)
x, y = centred(ring)
put(im, ring, INK, (x, y))
put(im, o, ORANGE, (x + off2, y + off2))
put(im, w, WHITE, (x + off2 + off, y + off2 + off))
save(im, "logo-blob")

# 6. Stacked: A-mark over wordmark, ink on white, one hugging ink-outlined shape.
im = canvas(); m = fit(MARK, 520); w = fit(WORD, 1000)
stack = Image.new("L", (1000, m.height + 20 + w.height), 0)
stack.paste(m, ((1000 - m.width) // 2, 0)); stack.paste(w, (0, m.height + 20))
o, off = grow(stack, 55)
o = solid(o)
x, y = centred(o)
put(im, o, ORANGE, (x, y))
put(im, stack, INK, (x + off, y + off))
save(im, "logo-stacked")
