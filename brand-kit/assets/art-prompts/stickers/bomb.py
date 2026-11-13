"""Pack every print/*.png into one sticker-bomb sheet (phone wallpaper ratio), like a racing decal sheet."""
import glob, random
import numpy as np
from PIL import Image
random.seed(11)
W, H, K = 1440, 2560, 8
files = sorted(glob.glob('../print/*.png'))
for scale in (1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7):
    ims = []
    for f in files:
        im = Image.open(f).convert('RGBA')
        a = im.width * im.height
        s = scale * 430 * (1.0 if a > 1.6e6 * 1.3 else 1.15)   # big round ones a bit smaller
        im.thumbnail((int(s), int(s)))
        ims.append(im.rotate(random.uniform(-8, 8), expand=True, resample=Image.BICUBIC))
    ims.sort(key=lambda i: -i.width * i.height)
    occ = np.zeros((H // K, W // K), bool)
    spots, ok = [], True
    for im in ims:
        m = np.array(im.getchannel('A').resize((im.width // K, im.height // K))) > 60
        h, w = m.shape
        best = None
        for y in range(0, occ.shape[0] - h, 2):
            for x in range(0, occ.shape[1] - w, 2):
                if not (occ[y:y + h, x:x + w] & m).sum() > 6:
                    best = (x, y); break
            if best: break
        if not best:
            ok = False; break
        x, y = best
        occ[y:y + h, x:x + w] |= m
        spots.append((im, x * K, y * K))
    if ok:
        break
bg = Image.new('RGBA', (W, H), (232, 226, 218, 255))
for im, x, y in spots:
    bg.paste(Image.new('RGBA', im.size, (0, 0, 0, 60)), (x + 5, y + 7), im.getchannel('A'))
    bg.alpha_composite(im, (x, y))
bot = max(y + im.height for im, x, y in spots)
bg.crop((0, 0, W, min(H, bot + 30))).convert('RGB').save('../preview/_sticker-bomb.png')
print('scale', scale, 'placed', len(spots), 'of', len(files))
