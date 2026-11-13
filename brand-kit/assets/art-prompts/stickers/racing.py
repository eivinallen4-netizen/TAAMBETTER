"""Racing / motorsport sponsor-decal stickers in TAAM colours, drawn in code.

Inspired by the sticker-bomb look of racing sponsor decals (shields, colour plates,
oil-company roundels, race numbers, speed bars, checkered flags), but every design is
TAAM's own: TAAM wordmark / A-mark, orange #F46325, ink #111111, white.

Writes out/race-*.png on white; diecut.py then adds the die-cut border.
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ORANGE, INK, WHITE = (244, 99, 37), (17, 17, 17), (255, 255, 255)
S = 1400
FONTS = "C:/Windows/Fonts/"
BLACK_I, BLACK, SCRIPT = "Montserrat-BlackItalic.ttf", "Montserrat-Black.ttf", "segoescb.ttf"

WORD = np.array(Image.open("brand-taam-wordmark.png").convert("RGBA").getchannel("A")) > 127
MARK = np.array(Image.open("brand-taam-mark.png").convert("RGBA").getchannel("A")) > 127


# ---------- mask helpers (bool arrays, S x S) ----------
def blank():
    return np.zeros((S, S), bool)


def dilate(a, r):
    if r <= 0:
        return a
    h, w = a.shape
    pad = np.pad(a, r)
    out = a.copy()
    st = max(1, r // 10)
    for dy in range(-r, r + 1, st):
        for dx in range(-r, r + 1, st):
            if dx * dx + dy * dy <= r * r:
                out |= pad[r + dy:r + dy + h, r + dx:r + dx + w]
    return out


def erode(a, r):
    return ~dilate(~a, r)


def smooth(a, k=3):
    m = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(k))
    return np.array(m) > 127


def poly(pts):
    m = Image.new("L", (S, S), 0)
    ImageDraw.Draw(m).polygon([tuple(map(float, p)) for p in pts], fill=255)
    return np.array(m) > 127


def rrect(x0, y0, x1, y1, r):
    m = Image.new("L", (S, S), 0)
    ImageDraw.Draw(m).rounded_rectangle((x0, y0, x1, y1), r, fill=255)
    return np.array(m) > 127


def ellipse(x0, y0, x1, y1):
    m = Image.new("L", (S, S), 0)
    ImageDraw.Draw(m).ellipse((x0, y0, x1, y1), fill=255)
    return np.array(m) > 127


def shear(a, skew):
    """Lean right like italics (keeps the bottom edge fixed)."""
    im = Image.fromarray((a * 255).astype(np.uint8))
    h = im.height
    out = im.transform((im.width + int(abs(skew) * h), h), Image.AFFINE,
                       (1, skew, -skew * h, 0, 1, 0), Image.BICUBIC)
    return np.array(out) > 127


def text(txt, font, size, track=0, stretch=1.0, skew=0.0):
    """Tight bool mask of a string."""
    f = ImageFont.truetype(FONTS + font, size)
    w = int(sum(f.getlength(c) for c in txt) + track * len(txt) + size)
    m = Image.new("L", (w, size * 2), 0)
    d = ImageDraw.Draw(m)
    x = size // 4
    for c in txt:
        d.text((x, size // 3), c, font=f, fill=255)
        x += f.getlength(c) + track
    m = m.crop(m.getbbox())
    if stretch != 1.0:
        m = m.resize((round(m.width * stretch), m.height), Image.LANCZOS)
    a = np.array(m) > 127
    return shear(a, skew) if skew else a


def fit(a, w=None, h=None):
    im = Image.fromarray((a * 255).astype(np.uint8))
    im = im.crop(im.getbbox())
    if w is not None and (h is None or im.height * w / im.width <= h):
        size = (w, round(im.height * w / im.width))
    else:
        size = (round(im.width * h / im.height), h)
    return np.array(im.resize(size, Image.LANCZOS)) > 127


def at(a, cx, cy):
    """Place a small mask centred at (cx, cy) on an S x S mask."""
    out = blank()
    h, w = a.shape
    x, y = int(cx - w / 2), int(cy - h / 2)
    out[y:y + h, x:x + w] = a
    return out


# ---------- painting ----------
class Sticker:
    def __init__(self):
        self.im = Image.new("RGB", (S, S), WHITE)

    def fill(self, mask, colour):
        m = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
        self.im.paste(Image.new("RGB", (S, S), colour), (0, 0), m)
        return self

    def save(self, name):
        self.im.save(f"out/{name}.png")
        print(name)


def outlined(st, shape, fill, line=24, colour=INK):
    """Ink outline around a shape, then the fill."""
    st.fill(smooth(dilate(shape, line)), colour)
    st.fill(shape, fill)


# 1. Shield crest: orange top with white TAAM, ink MARKETING band, striped base.
def shield():
    st = Sticker()
    W, H = 920, 1120
    x0, y0 = (S - W) / 2, 140
    x1, cx, y1 = x0 + W, S / 2, y0 + H
    side = []
    for t in np.linspace(0, 1, 40):  # quadratic curve from the side down to the point
        p0, c, p1 = np.array([x1, y0 + 0.5 * H]), np.array([x1, y0 + 0.86 * H]), np.array([cx, y1])
        side.append((1 - t) ** 2 * p0 + 2 * (1 - t) * t * c + t * t * p1)
    left = [(2 * cx - x, y) for x, y in reversed(side)]
    outer = smooth(dilate(erode(poly([(x0, y0), (x1, y0)] + side + left), 60), 60), 2)
    st.fill(outer, INK)
    inner = erode(outer, 34)
    band0, band1 = y0 + 0.43 * H, y0 + 0.58 * H
    rows = np.arange(S)[:, None]
    top = inner & (rows < band0 - 12)
    band = inner & (rows > band0 + 12) & (rows < band1 - 12)
    base = inner & (rows > band1 + 12)
    st.fill(top, ORANGE).fill(base, WHITE)
    word = fit(WORD, w=640)
    st.fill(at(word, cx, (y0 + 34 + band0) / 2 + 10), WHITE)
    st.fill(band, INK)
    st.fill(at(text("MARKETING", BLACK, 80, track=18), cx, (band0 + band1) / 2), WHITE)
    # three diagonal speed stripes across the base
    for i, col in enumerate((ORANGE, INK, ORANGE)):
        off = i * 95 - 95
        stripe = poly([(cx - 300 + off, y1), (cx - 220 + off, y1), (cx + 80 + off, band1), (cx + off, band1)])
        st.fill(stripe & base, col)
    st.save("race-shield")


# 2. Slanted orange plate with ink italic TAAM, MARKETING underneath.
def plate():
    st = Sticker()
    sk = 110
    p = poly([(150 + sk, 380), (1250 + sk, 380), (1250 - sk, 830), (150 - sk, 830)])
    p = smooth(dilate(erode(p, 30), 30))
    outlined(st, p, ORANGE, 26)
    st.fill(at(fit(text("TAAM", BLACK_I, 400, stretch=1.25, skew=0.22), w=960, h=330), S / 2, 605), INK)
    st.fill(at(fit(text("MARKETING", BLACK_I, 120, track=34, skew=0.22), w=820), S / 2 - 40, 960), INK)
    st.save("race-plate")


# 3. Ink box, wide orange TAAM whose first T's crossbar runs over the whole word.
def longbar():
    st = Sticker()
    box = rrect(110, 420, 1290, 980, 46)
    st.fill(box, INK)
    st.fill(rrect(140, 450, 1260, 950, 30) & ~rrect(156, 466, 1244, 934, 22), ORANGE)
    word = fit(text("TAAM", BLACK, 400, track=10, stretch=1.45), w=960)
    # crossbar thickness = rows where the T spans most of its own width
    tcol = fit(text("T", BLACK, 400, stretch=1.45), h=word.shape[0])
    bar_h = int((tcol.sum(1) > 0.6 * tcol.shape[1]).sum())
    wm = at(word, S / 2, 735)
    ys, xs = np.nonzero(wm)
    wm[ys.min():ys.min() + bar_h, xs.min():xs.max()] = True
    st.fill(wm, ORANGE)
    st.save("race-longbar")


# 4. Ink oval with orange pinstripe and white script Taam.
def oval():
    st = Sticker()
    e = ellipse(90, 330, 1310, 1070)
    st.fill(e, INK)
    st.fill(e & ~erode(e, 22) | (erode(e, 40) & ~erode(e, 56)), ORANGE)
    st.fill(at(fit(text("Taam", SCRIPT, 420), w=860, h=420), S / 2 + 10, 690), WHITE)
    st.save("race-oval")


# 5. Race number 01: orange italic digits, white then ink outline, chunky ink shadow, TAAM tab.
def number():
    st = Sticker()
    n = at(fit(text("01", BLACK_I, 700, track=-30, skew=0.12), w=1000, h=820), S / 2, 760)
    w1 = smooth(dilate(n, 26))
    w2 = smooth(dilate(w1, 26))
    st.fill(np.roll(np.roll(w2, 38, 0), 30, 1), INK)
    st.fill(w2, INK).fill(w1, WHITE).fill(n, ORANGE)
    tab = poly([(330, 210), (830, 210), (800, 330), (300, 330)])
    outlined(st, tab, INK, 18, WHITE)
    st.fill(at(fit(WORD, w=380), 565, 270), WHITE)
    st.save("race-number")


# 6. Long tyre-sponsor bar: white with ink TAAM MARKETING, orange end tab with the A-mark.
def bar():
    st = Sticker()
    b = rrect(60, 560, 1340, 840, 26)
    st.fill(b, INK)
    st.fill(rrect(84, 584, 1036, 816, 14), WHITE)
    st.fill(rrect(1060, 584, 1316, 816, 14), ORANGE)
    st.fill(at(fit(text("TAAM MARKETING", BLACK, 200, track=6, stretch=0.9), w=880, h=150), 560, 700), INK)
    st.fill(at(fit(MARK, h=180), 1188, 700), INK)
    st.save("race-bar")


# 7. Oil-can roundel: ink ring, orange disc, white band with the wordmark.
def roundel():
    st = Sticker()
    c, R = S / 2, 610
    disc = ellipse(c - R, c - R, c + R, c + R)
    st.fill(disc, INK)
    st.fill(erode(disc, 40), ORANGE)
    rows = np.arange(S)[:, None]
    band = erode(disc, 40) & (rows > c - 150) & (rows < c + 150)
    st.fill(dilate(band, 18) & erode(disc, 40), INK).fill(band, WHITE)
    st.fill(at(fit(WORD, w=760), c, c), INK)
    st.fill(at(fit(text("HIGH OCTANE", BLACK, 90, track=14), w=600), c, c - 290), WHITE)
    st.fill(at(fit(text("MARKETING", BLACK, 90, track=14), w=520), c, c + 290), WHITE)
    st.save("race-roundel")


# 8. Speed bars: ink slanted bar with orange/white/orange stripes and white italic TAAM.
def speedbars():
    st = Sticker()
    sk = 70
    body = smooth(dilate(erode(poly([(140 + sk, 520), (1300 + sk, 520), (1300 - sk, 880), (140 - sk, 880)]), 24), 24))
    st.fill(dilate(body, 22), ORANGE).fill(body, INK)
    for i, col in enumerate((ORANGE, WHITE, ORANGE)):
        x = 150 + i * 92
        st.fill(poly([(x + sk + 20, 560), (x + sk + 80, 560), (x - sk + 80, 840), (x - sk + 20, 840)]), col)
    st.fill(at(fit(text("TAAM", BLACK_I, 400, stretch=1.2, skew=0.2), w=780, h=280), 840, 700), WHITE)
    st.save("race-speedbars")


# 9. Checkered flag strip with an orange TAAM label.
def checker():
    st = Sticker()
    sk, x0, x1, y0, y1 = 90, 120, 1280, 470, 930
    flag = poly([(x0 + sk, y0), (x1 + sk, y0), (x1 - sk, y1), (x0 - sk, y1)])
    st.fill(smooth(dilate(flag, 26)), INK)
    cols, rows_n = 12, 4
    cell_w, cell_h = (x1 - x0) / cols, (y1 - y0) / rows_n
    for r in range(rows_n):
        for k in range(cols):
            if (r + k) % 2 == 0:
                ya, yb = y0 + r * cell_h, y0 + (r + 1) * cell_h
                def sx(x, y):
                    return x + sk - 2 * sk * (y - y0) / (y1 - y0)
                xa, xb = x0 + k * cell_w, x0 + (k + 1) * cell_w
                st.fill(poly([(sx(xa, ya), ya), (sx(xb, ya), ya), (sx(xb, yb), yb), (sx(xa, yb), yb)]) & flag, WHITE)
    lab = poly([(430 + 40, 580), (990 + 40, 580), (990 - 40, 820), (430 - 40, 820)])
    outlined(st, smooth(dilate(erode(lab, 16), 16)), ORANGE, 22)
    st.fill(at(fit(text("TAAM", BLACK_I, 300, skew=0.15), w=440, h=180), S / 2, 700), INK)
    st.save("race-checker")


if __name__ == "__main__":
    for fn in (shield, plate, longbar, oval, number, bar, roundel, speedbars, checker):
        fn()
