// ===================== CONSTRUCTIVIST PROPAGANDA x TAAM: "Why does Google rank them above you?" =====================
// Reference techniques kept: cached litho paper, exInk mottle + pinholes on every plate, halftone-screened cut-outs
// pasted under multiplied plates, slanted slabs, wedge-head bar arrows, Anton stencil numbers, the red(-orange) wedge
// between scenes, worn-print scratches, grain and vignette on every frame. Brand: TAAM orange replaces the red,
// TAAM ink replaces the black, the TAAM wordmark is the poster imprint, the TAAM mascot is the photomontage.
const RED = '#F46325', BLACK = '#111111', CREAM = '#e9dcbc';

// ---------------- BEATS: every time in the piece comes from here (word times from transcript.json) ----------------
const BEATS = [
  { id: 'hook',     start: 0.0,   end: 4.42,  said: "ever noticed your competitors website looks worse yours but Google still puts them above you",
    screen: 'title card YOUR WEBSITE NEEDS REFERENCES (printed on frame 1, leaves at 0.85 s); THEIRS vs YOURS cards re-stack under the Google G into #1 / #2',
    at: { titleOut: 0.85, site: 1.2, competitors: 0.78, worse: 1.9, yours: 2.08, google: 3.12, above: 3.98, you: 4.18 } },
  { id: 'reason',   start: 5.34,  end: 7.04,  said: "the reason isn't even on their website",
    screen: 'THE REASON? slab, orange cross stamped on their site, NOT ON THEIR SITE',
    at: { reason: 5.34, isnt: 5.56, website: 6.6 } },
  { id: 'pct',      start: 7.04,  end: 11.44, said: 'and it matters because less than 1% of people ever make it to page 2',
    screen: '200 cursors on PAGE 1, <1% counter, one cursor travels to PAGE 2',
    at: { less: 8.58, one: 9.08, people: 9.7, make: 10.36, page: 10.9, two: 11.22 }, wedge: 7.0 },
  { id: 'looking',  start: 11.44, end: 13.46, said: 'so what is Google looking at?',
    screen: 'magnifier swings in: Google G badge + ?', at: { so: 11.44, whats: 12.04, google: 12.7, looking: 12.88 } },
  { id: 'same',     start: 14.34, end: 20.16, said: 'Picture two guys applying for the same job same experience same skills same resume',
    screen: 'two identical mascots, SAME: JOB / EXPERIENCE / SKILLS / RESUME',
    at: { picture: 14.34, two: 14.72, same: 16.28, job: 16.54, experience: 17.68, skills: 18.62, resume: 19.68 }, wedge: 13.5 },
  { id: 'refs',     start: 20.16, end: 28.22, said: "but this guy has 10 references from big well known companies and this guy has one reference from his cousin who's getting hired",
    screen: '10 brand reference letters under the left mascot; 1 letter from his COUSIN under the right one; HIRED?',
    at: { thisguy: 20.54, ten: 21.24, references: 21.54, big: 22.38, companies: 23.34, thisguy2: 24.36, one: 25.2, reference1: 25.36, cousin: 26.56, who: 26.84, hired: 27.9 } },
  { id: 'first',    start: 28.22, end: 33.56, said: "Obviously the first guy that's exactly how Google sees your website",
    screen: 'left mascot lifts the trophy, HIRED!; mascot becomes YOUR SITE, letters become linking sites',
    at: { obviously: 28.22, first: 29.74, thats: 30.24, google: 32.28, your: 32.92, website: 33.12 } },
  { id: 'backlinks', start: 33.56, end: 41.72, said: 'those references are called backlinks and anytime another website like a new site or a local directory links back to us',
    screen: '10 arrows into YOUR SITE, BACKLINKS burst; then NEWS + LOCAL DIRECTORY linking back',
    at: { references: 34.34, backlinks: 35.28, its: 35.9, another: 37.04, news: 38.96, local: 40.1, directory: 40.3, links: 40.72, back: 41.02 } },
  { id: 'howmany',  start: 41.72, end: 46.36, said: "and Just like references It's not just how many you have.",
    screen: 'links flood in, counter runs up, NOT JUST HOW MANY, cross stamped on the count',
    at: { like: 42.96, not: 45.0, how: 45.5, many: 45.7, have: 46.14 } },
  { id: 'trust',    start: 47.06, end: 53.12, said: "One link from a site people actually trust is worth way more than 50 from a random site nobody's ever heard of.",
    screen: 'balance: 1 TRUSTED site outweighs 50 RANDOM sites',
    at: { one: 47.06, link: 47.3, site: 48.38, trust: 49.38, worth: 49.86, fifty: 50.86, random: 51.5, nobody: 52.04, of: 52.92 }, wedge: 46.4 },
  { id: 'follow',   start: 53.46, end: 56.98, said: 'So if you just realized your website needs backlinks, give me a follow.',
    screen: 'mascot on the phone, YOUR SITE NEEDS / BACKLINKS, FOLLOW, TAAM wordmark',
    at: { so: 53.46, realized: 53.92, website: 54.46, needs: 54.8, backlinks: 55.04, give: 56.38, follow: 56.72 }, wedge: 53.0 },
];
const B = Object.fromEntries(BEATS.map((b) => [b.id, b]));
const WEDGES = BEATS.filter((b) => b.wedge != null).map((b) => b.wedge);
const swapAt = (w) => w + 0.5; // the wedge covers the sheet at w + 0.5: that is where the scene swaps
const DURATION = +(BEATS[BEATS.length - 1].end + 1).toFixed(2);

// ---------------- reference print machinery (unchanged maths) ----------------
const fieldNoise = (w, h, seed, cell, oct, sx = 1, sy = 1) => {
  const nz = H.makeNoise(seed), gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2, g = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) g[j * gw + i] = nz.fbm2(i * 0.35 * sx, j * 0.35 * sy, oct);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const fy = y / cell, j = fy | 0, ty = fy - j;
    for (let x = 0; x < w; x++) {
      const fx = x / cell, i = fx | 0, tx = fx - i, k = j * gw + i;
      const a = g[k] + (g[k + 1] - g[k]) * tx, b = g[k + gw] + (g[k + gw + 1] - g[k + gw]) * tx;
      out[y * w + x] = a + (b - a) * ty;
    }
  }
  return out;
};
const inkify = (layer, seed, mottle, speck) => {
  const c = layer.getContext('2d'), w = layer.width, h = layer.height, img = c.getImageData(0, 0, w, h), d = img.data;
  const n1 = fieldNoise(w, h, seed, 4, 3), n2 = fieldNoise(w, h, seed + 9, 36, 3), r = H.rng(seed + 3);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    if (!d[i + 3]) continue;
    let a = 1 - mottle * Math.max(0, n1[p] * 1.7 + n2[p] * 1.1);
    if (r() < speck * (0.3 + Math.max(0, n2[p]) * 4)) a *= 0.2;
    d[i + 3] *= H.clamp(a, 0, 1);
  }
  c.putImageData(img, 0, 0);
};
const CACHE = {}; const CF = (k, ...a) => CACHE[k] || (CACHE[k] = fieldNoise(...a));
const EXC = {};
const exPaperC = (W, HH) => EXC.paper || (EXC.paper = (() => {
  const cv = H.layer(W, HH), x = cv.getContext('2d'), img = x.createImageData(W, HH), pd = img.data;
  const lo = CF('lo', W, HH, 41, 22, 4), fib = CF('fib', W, HH, 42, 2, 2, 4, 0.5), r0 = H.rng(5), base = H.hex(CREAM), tan = H.hex('#b99a62');
  for (let y = 0, p = 0; y < HH; y++) for (let xx = 0; xx < W; xx++, p++) {
    const ex = Math.min(xx, W - xx) / W, ey = Math.min(y, HH - y) / HH;
    const edge = Math.pow(1 - H.clamp(Math.min(ex * 4, ey * 3) + lo[p] * 0.2, 0, 1), 3), k = 0.4 * edge + 0.16 * Math.max(0, lo[p]);
    const s = 1 + fib[p] * 0.04 + (r0() - 0.5) * 0.05, i = p * 4;
    pd[i] = (base[0] + (tan[0] - base[0]) * k) * s; pd[i + 1] = (base[1] + (tan[1] - base[1]) * k) * s; pd[i + 2] = (base[2] + (tan[2] - base[2]) * k) * s; pd[i + 3] = 255;
  }
  x.putImageData(img, 0, 0); return cv;
})());
const exInk = (layer, seed, mottle, speck = 0) => { // cached-noise version of inkify (mottle + pinhole voids)
  const c = layer.getContext('2d'), w = layer.width, h = layer.height, img = c.getImageData(0, 0, w, h), d = img.data;
  const n1 = CF('ei1', w, h, seed, 4, 3), n2 = CF('ei2', w, h, seed + 9, 36, 3);
  const rnd = CACHE['rnd' + w] || (CACHE['rnd' + w] = (() => { const r = H.rng(seed + 3), a = new Float32Array(w * h); for (let i = 0; i < a.length; i++) a[i] = r(); return a; })());
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    if (!d[i + 3]) continue;
    const m = n2[p] > 0 ? n2[p] : 0;
    let a = 1 - mottle * Math.max(0, n1[p] * 1.7 + n2[p] * 1.1);
    if (rnd[p] < speck * (0.3 + m * 4)) a *= 0.2;
    d[i + 3] *= a < 0 ? 0 : a > 1 ? 1 : a;
  }
  c.putImageData(img, 0, 0);
};
// cut out + halftone-screen a grayscale "photograph" (drawn by fn) once; returns photo, dot layer and cut-out rim
const screenPhoto = (fn, W, HH, seed = 19, S = 6.2, gam = 1) => {
  const PH = H.layer(W, HH), pc = PH.getContext('2d');
  fn(pc);
  const pdat = pc.getImageData(0, 0, W, HH).data;
  const HT = H.layer(W, HH), hc = HT.getContext('2d');
  const th = Math.PI / 4, cs = Math.cos(th), sn = Math.sin(th);
  hc.fillStyle = BLACK; hc.beginPath();
  const ext = 1100;
  for (let v = -ext / S; v < ext / S; v++) for (let u = -ext / S; u < ext / S * 1.6; u++) {
    const x = (u * cs - v * sn) * S + 120, y = (u * sn + v * cs) * S - 400;
    if (x < 0 || y < 0 || x >= W || y >= HH) continue;
    const k = ((y | 0) * W + (x | 0)) * 4;
    const al = pdat[k + 3] / 255; if (al < 0.5) continue;
    const lum = gam === 1 ? pdat[k] / 255 : Math.pow(pdat[k] / 255, gam);
    const dk = Math.pow(1 - lum, 0.9);
    const rad = S * 0.62 * Math.sqrt(dk) + 0.35;
    hc.moveTo(x + rad, y); hc.arc(x, y, rad, 0, Math.PI * 2);
  }
  hc.fill();
  const SIL = H.layer(W, HH), sc = SIL.getContext('2d');
  sc.drawImage(PH, 0, 0); sc.globalCompositeOperation = 'source-in'; sc.fillStyle = '#efe5cc'; sc.fillRect(0, 0, W, HH);
  inkify(HT, seed, 0.18, 0.004);
  return { PH, HT, SIL };
};
// paste a screened photo: cream cut-out rim, faint tone, dots (all multiplied on paper). flip mirrors it, a fades it.
const paste = (ctx, P, x, y, s, rot = 0, flip = false, a = 1) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(flip ? -s : s, s);
  ctx.globalAlpha = a;
  const ro = Math.max(1, 3.2 / Math.max(0.05, s) / 4);
  for (const [dx, dy] of [[-4, 0], [4, 0], [0, -4], [0, 4], [-3, -3], [3, 3], [3, -3], [-3, 3]]) ctx.drawImage(P.SIL, dx * ro, dy * ro);
  ctx.drawImage(P.SIL, 0, 0);
  ctx.globalAlpha = 0.18 * a; ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(P.PH, 0, 0);
  ctx.globalAlpha = a; ctx.drawImage(P.HT, 1.5, -1);
  ctx.restore();
};
// heavy bar arrow with a wedge head
const barArrow = (c, x0, y0, x1, y1, p, w, col) => {
  if (p <= 0) return; const a = Math.atan2(y1 - y0, x1 - x0), l = Math.hypot(x1 - x0, y1 - y0) * p;
  c.save(); c.translate(x0, y0); c.rotate(a); c.fillStyle = col; c.fillRect(0, -w / 2, Math.max(0, l - w * 2.2), w);
  c.beginPath(); c.moveTo(l, 0); c.lineTo(l - w * 2.6, -w * 1.4); c.lineTo(l - w * 2.6, w * 1.4); c.closePath(); c.fill(); c.restore();
};
const slab = (c, txt, x, y, ang, font, fg, bg, padX = 14, padY = 10, p = 1) => { // slanted bar with lettering
  if (p <= 0) return; c.save(); c.translate(x, y); c.rotate(ang); c.font = font; c.letterSpacing = '3px';
  const m = c.measureText(txt), w = m.width + padX * 2, h = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + padY * 2;
  if (bg) { knock(c, w * p, h, -padX, -m.actualBoundingBoxAscent - padY); c.fillStyle = bg; c.fillRect(-padX, -m.actualBoundingBoxAscent - padY, w * p, h); }
  if (p >= 1) { c.fillStyle = fg; c.fillText(txt, 0, 0); }
  c.restore(); c.letterSpacing = '0px';
};
// worn-print finish: fine cream scratches through the ink
const scratches = (ctx, W, HH) => {
  const rs = H.rng(88);
  ctx.save(); ctx.strokeStyle = 'rgba(250,244,228,0.35)'; ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) { const x = rs.range(0, W), y = rs.range(0, HH), l = rs.range(4, 30), a2 = rs.range(0, 3); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a2) * l, y + Math.sin(a2) * l); ctx.stroke(); }
  ctx.restore();
};

// ---------------- TAAM pieces ----------------
// the TAAM wordmark (public/brand/taam-wordmark.svg), drawn as a flat ink plate; h = cap height in px
const TAAM_PATH = new Path2D('M9.5 234.5L323 234.5L323 314.5L213.5 314.5L213.5 588.5L120 588.5L120 314.5L9.5 314.5ZM431 234.5L538 234.5L669.5 588.5L572 588.5L548.5 534L420.5 534L397 588.5L299.5 588.5ZM805.5 234.5L912.5 234.5L1044 588.5L946.5 588.5L923 534L795 534L771.5 588.5L674 588.5ZM1070 234.5L1156.5 234.5L1249.5 400.5L1342.5 234.5L1429 234.5L1429 588.5L1342.5 588.5L1342.5 403.5L1249.5 563.5L1156.5 403.5L1156.5 588.5L1070 588.5ZM859 341.5L901 455.5L817 455.5ZM434.362566 390.248533A78 78 0 0 1 504.687886 374.657786L452.779227 435.208361ZM511.177571 376.703976A78 78 0 0 1 559.842214 429.812114L481.449549 415.133186ZM561.315005 436.455442A78 78 0 0 1 539.654329 505.154329L513.170322 429.924825ZM534.637434 509.751467A78 78 0 0 1 464.312114 525.342214L516.220773 464.791639ZM457.822429 523.296024A78 78 0 0 1 409.157786 470.187886L487.550451 484.866814ZM407.684995 463.544558A78 78 0 0 1 429.345671 394.845671L455.829678 470.075175Z');
const logo = (c, x, y, h, col, ang = 0, sc = 1) => { // x,y = top-left; width = h * 4.0
  const s = h / 354; c.save(); c.translate(x, y); c.rotate(ang); c.scale(s * sc, s * sc); c.translate(-9.5, -234.5);
  c.fillStyle = col; c.fill(TAAM_PATH, 'evenodd'); c.restore();
};

// mascot cut-outs (pre-toned grayscale PNGs from public/characters, outside made transparent)
const MASC = {};
const loadMascots = () => Promise.all(Object.entries(MASCOT_SRC).map(([k, src]) => new Promise((res) => { const im = new Image(); im.onload = () => { MASC[k] = im; res(); }; im.src = src; })));
const exPhotos = () => EXC.ph || (EXC.ph = Object.fromEntries(Object.keys(MASC).map((k, i) => [k, screenPhoto((pc) => pc.drawImage(MASC[k], 0, 0), 600, 600, 23 + i * 6, 6.4, 0.85)])));

// knockout: cards punch their shape out of the back plate (beams/discs) like a printer's knockout
// (queued, then punched at print time, so draw order does not matter)
let KO = null;
const knock = (c, w, h, x0 = 0, y0 = 0) => { if (!KO) return; const m = c.getTransform(); KO.push((k) => { k.setTransform(m); k.fillRect(x0 - 3, y0 - 3, w + 6, h + 6); }); };
const knockArc = (x, y, r) => { if (!KO) return; KO.push((k) => { k.setTransform(1, 0, 0, 1, 0, 0); k.beginPath(); k.arc(x, y, r, 0, 7); k.fill(); }); };
const knockText = (c, txt, x, y) => { if (!KO) return; const m = c.getTransform(), f = c.font, al = c.textAlign, ls = c.letterSpacing; KO.push((k) => { k.setTransform(m); k.font = f; k.textAlign = al; k.letterSpacing = ls; k.lineWidth = 10; k.lineJoin = 'round'; k.strokeStyle = '#000'; k.fillText(txt, x, y); k.strokeText(txt, x, y); }); };
const punch = (bk, q) => { const k = bk.getContext('2d'); k.save(); k.globalCompositeOperation = 'destination-out'; k.fillStyle = '#000'; q.forEach((f) => f(k)); k.restore(); };
// a flat-printed website in a browser frame. kind: clean | ugly | plain | news | dir | trusted | random
const site = (c, x, y, w, h, ang, kind, p = 1, seed = 1) => {
  if (p <= 0) return;
  c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(ang); c.scale(p, p); c.translate(-w / 2, -h / 2);
  const lw = Math.max(3, w * 0.014), bar = Math.max(10, h * 0.14);
  knock(c, w, h); c.fillStyle = CREAM; c.fillRect(0, 0, w, h);
  c.fillStyle = BLACK; c.fillRect(0, 0, w, bar);
  c.fillStyle = CREAM; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(bar * 0.6 + i * bar * 0.7, bar / 2, bar * 0.2, 0, 7); c.fill(); }
  if (w > 200) c.fillRect(bar * 2.8, bar * 0.28, w - bar * 3.4, bar * 0.44);
  c.strokeStyle = BLACK; c.lineWidth = lw; c.strokeRect(lw / 2, lw / 2, w - lw, h - lw);
  const ix = w * 0.08, iy = bar + h * 0.08, iw = w * 0.84, ih = h - bar - h * 0.16, r = H.rng(seed);
  c.fillStyle = BLACK;
  if (kind === 'clean') {
    c.fillStyle = RED; c.fillRect(ix, iy, iw, ih * 0.42);
    c.fillStyle = CREAM; c.fillRect(ix + iw * 0.06, iy + ih * 0.12, iw * 0.5, ih * 0.08); c.fillRect(ix + iw * 0.06, iy + ih * 0.25, iw * 0.34, ih * 0.06);
    c.fillStyle = BLACK; for (let i = 0; i < 3; i++) c.fillRect(ix + i * iw * 0.35, iy + ih * 0.54, iw * 0.3, ih * 0.22);
    c.fillStyle = RED; c.fillRect(ix, iy + ih * 0.84, iw * 0.3, ih * 0.16);
  } else if (kind === 'ugly') { // crooked blocks, clashing sizes, nothing lines up
    const blocks = [[0, 0, 0.9, 0.18, -0.05, BLACK], [0.05, 0.26, 0.4, 0.3, 0.08, RED], [0.52, 0.22, 0.45, 0.1, -0.1, BLACK], [0.55, 0.38, 0.3, 0.07, 0.06, BLACK], [0.5, 0.5, 0.42, 0.07, -0.04, BLACK], [0.02, 0.66, 0.6, 0.08, 0.05, BLACK], [0.1, 0.8, 0.25, 0.2, -0.12, RED], [0.5, 0.78, 0.45, 0.06, 0.1, BLACK]];
    blocks.forEach(([bx, by, bw, bh, ba, col]) => { c.save(); c.translate(ix + bx * iw, iy + by * ih); c.rotate(ba); c.fillStyle = col; c.fillRect(0, 0, bw * iw, bh * ih); c.restore(); });
  } else if (kind === 'news') { // masthead + columns
    c.fillRect(ix, iy, iw, ih * 0.3);
    brand(c, 'newyorktimes', ix + iw / 2 - ih * 0.13, iy + ih * 0.025, ih * 0.25, CREAM);
    c.fillStyle = RED; c.fillRect(ix, iy + ih * 0.38, iw * 0.46, ih * 0.62);
    c.fillStyle = BLACK; for (let i = 0; i < 6; i++) c.fillRect(ix + iw * 0.54, iy + ih * (0.4 + i * 0.105), iw * (i % 3 === 2 ? 0.3 : 0.46), ih * 0.05);
  } else if (kind === 'dir') { // map pin + listing rows with stars
    brand(c, 'yelp', ix, iy + ih * 0.12, ih * 0.62, RED);
    c.fillStyle = BLACK; for (let i = 0; i < 4; i++) { const ry = iy + ih * (0.06 + i * 0.25); c.fillRect(ix + iw * 0.38, ry, iw * 0.4, ih * 0.08); for (let s = 0; s < 4; s++) star(c, ix + iw * (0.42 + s * 0.08), ry + ih * 0.16, ih * 0.04, s < 3 ? RED : BLACK); }
  } else if (kind === 'trusted') {
    c.fillRect(ix, iy, iw, ih * 0.16); for (let i = 0; i < 3; i++) c.fillRect(ix, iy + ih * (0.3 + i * 0.16), iw * 0.5, ih * 0.07);
    seal(c, ix + iw * 0.78, iy + ih * 0.58, ih * 0.36);
  } else if (kind === 'random') {
    c.fillRect(ix, iy, iw * r.range(0.4, 0.9), ih * 0.22); c.fillRect(ix, iy + ih * 0.45, iw * r.range(0.3, 0.8), ih * 0.18);
    if (r() < 0.4) { c.fillStyle = RED; c.fillRect(ix, iy + ih * 0.75, iw * 0.4, ih * 0.25); }
  } else { // plain
    c.fillRect(ix, iy, iw, ih * 0.2); for (let i = 0; i < 3; i++) c.fillRect(ix, iy + ih * (0.36 + i * 0.2), iw * (0.9 - i * 0.2), ih * 0.08);
  }
  c.restore();
};
const star = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); };
// stamped trust seal: toothed orange disc with a black star
const seal = (c, x, y, r) => { c.fillStyle = RED; c.beginPath(); for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2, rr = i % 2 ? r * 0.86 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); star(c, x, y, r * 0.55, BLACK); };
// a real brand mark (Simple Icons path, 24x24 box) printed as one flat ink
const brand = (c, name, x, y, size, col) => { c.save(); c.translate(x, y); c.scale(size / 24, size / 24); c.fillStyle = col; c.fill(BRAND[name]); c.restore(); };
const REF_BRANDS = ['apple', 'amazon', 'netflix', 'nike', 'tesla', 'spotify', 'cocacola', 'starbucks', 'mcdonalds', 'adidas'];
// Google's G printed in cream on a slanted ink block, stamped on twos
const gBadge = (c, x, y, s, ang, p) => { if (p <= 0) return; const k = H.clamp(p, 0, 1), sc = 1 + 0.5 * (1 - k);
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(sc, sc); knock(c, s, s, -s / 2, -s / 2); c.fillStyle = BLACK; c.fillRect(-s / 2, -s / 2, s, s);
  if (p >= 1) brand(c, 'google', -s * 0.34, -s * 0.34, s * 0.68, CREAM); c.restore(); };
// a reference letter: the company's mark in the header, text lines, signature, seal
const refLetter = (c, x, y, s, rot, i) => {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  const w = 92, h = 118; c.translate(-w / 2, -h / 2); knock(c, w, h);
  c.fillStyle = CREAM; c.fillRect(0, 0, w, h); c.strokeStyle = BLACK; c.lineWidth = 4; c.strokeRect(2, 2, w - 4, h - 4);
  const col = i % 2 ? RED : BLACK; c.fillStyle = col;
  brand(c, REF_BRANDS[i % REF_BRANDS.length], 8, 8, 28, col); // the company's own mark
  c.fillStyle = BLACK; c.fillRect(42, 14, 40, 7); c.fillRect(42, 26, 28, 5);
  for (let k = 0; k < 4; k++) c.fillRect(10, 48 + k * 12, k === 3 ? 44 : 72, 5);
  c.lineWidth = 3; c.beginPath(); c.moveTo(10, 104); c.bezierCurveTo(20, 90, 26, 112, 36, 98); c.bezierCurveTo(42, 92, 46, 106, 54, 100); c.stroke();
  seal(c, 74, 100, 12);
  c.restore();
};
// the cousin's reference: a plain sheet, scrawled lines and a heart where a company mark would be
const cousinLetter = (c, x, y, s, rot) => {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  const w = 92, h = 118; c.translate(-w / 2, -h / 2); knock(c, w, h);
  c.fillStyle = CREAM; c.fillRect(0, 0, w, h); c.strokeStyle = BLACK; c.lineWidth = 4; c.strokeRect(2, 2, w - 4, h - 4);
  c.fillStyle = RED; c.beginPath(); c.moveTo(22, 34); c.bezierCurveTo(4, 22, 10, 8, 22, 17); c.bezierCurveTo(34, 8, 40, 22, 22, 34); c.fill();
  c.lineWidth = 3; c.lineCap = 'round';
  for (let k = 0; k < 5; k++) { c.beginPath(); const y0 = 50 + k * 12; c.moveTo(10, y0); c.bezierCurveTo(30, y0 - 5, 50, y0 + 5, k === 4 ? 46 : 80, y0 - 2); c.stroke(); }
  c.restore();
};
// mouse cursor = one visitor (no people drawn)
const cursor = (c, x, y, s, col) => {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 22); c.lineTo(5.5, 17); c.lineTo(9.5, 26); c.lineTo(13, 24.5); c.lineTo(9, 16); c.lineTo(16, 16); c.closePath(); c.fill(); c.restore();
};
// beam fan from a point (reference beams), alternating orange/ink
const fan = (c, x, y, beams, len) => beams.forEach(([a, w], i) => { if (len <= 0) return; c.fillStyle = i % 2 ? RED : BLACK; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a - w) * len, y + Math.sin(a - w) * len); c.lineTo(x + Math.cos(a + w) * len, y + Math.sin(a + w) * len); c.closePath(); c.fill(); });
const burstAt = (c, x, y, p, n = 12, len = 520) => { if (p <= 0) return; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.1; c.fillStyle = i % 2 ? RED : BLACK; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a - 0.08) * len * p, y + Math.sin(a - 0.08) * len * p); c.lineTo(x + Math.cos(a + 0.08) * len * p, y + Math.sin(a + 0.08) * len * p); c.closePath(); c.fill(); } };
const cross = (c, x, y, p, r = 70, w = 28) => { if (p <= 0) return; c.save(); c.translate(x, y); c.fillStyle = RED; c.rotate(0.785); c.fillRect(-r * p, -w / 2, 2 * r * p, w); c.fillRect(-w / 2, -r * p, w, 2 * r * p); c.restore(); };
const check = (c, x, y, p, s = 1, col = BLACK) => { if (p <= 0) return; c.save(); c.translate(x, y); c.rotate(0.72); c.scale(s, s); c.fillStyle = col; c.fillRect(-56 * Math.min(1, p * 2), -28, 56 * Math.min(1, p * 2), 28); if (p > 0.5) c.fillRect(0, -28 - 120 * (p - 0.5) * 2, 28, 120 * (p - 0.5) * 2 + 28); c.restore(); };

// ======================================== THE EXPLAINER (9:16, 720 x 1280) ========================================
const explainer = (ctx, W, HH, t) => {
  const E = H.ease, cl = H.clamp, S = (a, b) => cl((t - a) / (b - a), 0, 1), lerp = H.lerp;
  const tq = Math.floor(t * 15) / 15; // agitprop staccato: punches land on twos
  const Sq = (a, b) => cl((tq - a) / (b - a), 0, 1);
  const LEAD = 0.1; // reveals complete up to 0.1 s ahead of their word
  const on = (w, d = 0.12) => Sq(w - LEAD - d, w - LEAD); // slab progress that completes just before word w
  // a word slammed down from oversize, stepped on twos
  const slam = (c, txt, x, y, ang, size, col, ts, shadow, align = 'left', font = 'Anton') => {
    if (tq < ts - LEAD) return; const k = cl((tq - ts + LEAD) / 0.2, 0, 1), sc = 1 + 0.6 * (1 - k);
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(sc, sc); c.font = `400 ${size}px "${font}"`; c.textAlign = align; c.letterSpacing = '2px';
    knockText(c, txt, 0, 0); if (shadow) { knockText(c, txt, size * 0.05, size * 0.05); c.fillStyle = shadow; c.fillText(txt, size * 0.05, size * 0.05); } c.fillStyle = col; c.fillText(txt, 0, 0); c.restore(); c.letterSpacing = '0px';
  };
  const numBox = (c, txt, x, y, ang, size, w, bg, fg, p = 1) => { // stencil number in a slanted box
    c.save(); c.translate(x, y); c.rotate(ang); knock(c, w * E.out(p), size * 1.1, -24, -size * 0.92); c.fillStyle = bg; c.fillRect(-24, -size * 0.92, w * E.out(p), size * 1.1);
    if (p >= 1) { c.fillStyle = fg; c.font = `400 ${size}px "Anton"`; c.letterSpacing = '4px'; c.fillText(txt, 0, 0); c.letterSpacing = '0px'; }
    c.restore();
  };
  const badgeP = (w) => (tq < w - LEAD - 0.07 ? 0 : cl((tq - w + LEAD + 0.07) / 0.14, 0, 1)); // the G block stamps down; the G prints when it lands
  const scene = t < swapAt(WEDGES[0]) ? 1 : t < swapAt(WEDGES[1]) ? 2 : t < swapAt(WEDGES[2]) ? 3 : t < swapAt(WEDGES[3]) ? 4 : 5;
  const PH = exPhotos();
  ctx.drawImage(exPaperC(W, HH), 0, 0);
  const BK = H.layer(W, HH), bc = BK.getContext('2d'); // back plate: discs, beams, bursts (under the cut-outs)
  const L = H.layer(W, HH), c = L.getContext('2d'); c.textBaseline = 'alphabetic'; // front plate
  const pastes = []; const KOQ = (KO = []);

  // ---------- SCENE 1: hook + reason ----------
  if (scene === 1) {
    const A = B.hook.at, R = B.reason.at;
    // disc and beams are already printed on frame 1, so the very first frame is a finished poster
    bc.fillStyle = RED; bc.beginPath(); bc.arc(560, 430, 250, 0, 7); bc.fill();
    fan(bc, 560, 430, [[-2.6, 0.05], [-2.15, 0.09], [1.95, 0.05], [2.45, 0.08]], 1700);
    // title card for the scroll: YOUR WEBSITE / NEEDS / REFERENCES, then it shoots up and away
    const ttl = E.in(S(A.titleOut, A.titleOut + 0.3));
    if (ttl < 1) {
      c.save(); c.translate(0, -ttl * 900); c.translate(360, 560); c.scale(1 - ttl * 0.4, 1 - ttl * 0.4); c.translate(-360, -560);
      c.rotate(-0.08); c.textAlign = 'left'; c.letterSpacing = '2px';
      c.font = '400 112px "Anton"'; knockText(c, 'YOUR WEBSITE', 34, 470); knockText(c, 'YOUR WEBSITE', 40, 476);
      c.fillStyle = RED; c.fillText('YOUR WEBSITE', 40, 476); c.fillStyle = BLACK; c.fillText('YOUR WEBSITE', 34, 470);
      c.letterSpacing = '0px'; c.restore();
      c.save(); c.translate(0, -ttl * 900); c.translate(360, 560); c.scale(1 - ttl * 0.4, 1 - ttl * 0.4); c.translate(-360, -560);
      slab(c, 'NEEDS', 46, 588, -0.08, '400 64px "Russo One"', CREAM, BLACK, 20, 12);
      c.rotate(-0.08); c.font = '400 126px "Anton"'; c.letterSpacing = '2px';
      knockText(c, 'REFERENCES', 30, 746); knockText(c, 'REFERENCES', 37, 753);
      c.fillStyle = BLACK; c.fillText('REFERENCES', 37, 753); c.fillStyle = RED; c.fillText('REFERENCES', 30, 746);
      c.letterSpacing = '0px'; c.restore();
    }
    const rk = E.inOut(S(A.google, A.above)); // free cards -> Google's results column
    const th = { x: lerp(40, 170, rk), y: lerp(190, 250, rk), w: lerp(440, 500, rk), h: lerp(320, 280, rk), a: lerp(-0.06, -0.03, rk) };
    const yo = { x: lerp(240, 170, rk), y: lerp(620, 640, rk), w: lerp(440, 500, rk), h: lerp(320, 280, rk), a: lerp(0.05, -0.03, rk) };
    const inT = E.out(S(A.site - 0.3, A.site)), inY = E.out(S(A.yours - 0.35, A.yours - 0.05));
    site(c, th.x - (1 - inT) * 800, th.y + (1 - inT) * 300, th.w, th.h, th.a, 'ugly', inT > 0 ? 1 : 0, 3);
    site(c, yo.x + (1 - inY) * 800, yo.y + (1 - inY) * 300, yo.w, yo.h, yo.a, 'clean', inY > 0 ? 1 : 0, 4);
    slab(c, 'THEIRS', th.x + 18, th.y - 24, th.a - 0.04, '400 40px "Russo One"', CREAM, BLACK, 14, 9, on(A.site + 0.15));
    slab(c, 'YOURS', yo.x + 18, yo.y - 24, yo.a - 0.04, '400 40px "Russo One"', CREAM, RED, 14, 9, on(A.yours + 0.1));
    if (rk <= 0) slab(c, 'LOOKS WORSE', th.x + 120, th.y + th.h + 44, -0.08, '700 34px "Oswald"', CREAM, RED, 12, 7, on(A.worse));
    slam(c, '#1', 16, 470, -0.08, 130, RED, A.above, BLACK);
    slam(c, '#2', 16, 850, -0.08, 130, BLACK, A.you);
    gBadge(c, 610, 140, 140, -0.1, badgeP(A.google));
    // the reason is not on their site: cross stamped on it, slogan underneath
    slab(c, 'THE REASON?', 50, 1010, -0.1, '400 46px "Russo One"', CREAM, BLACK, 16, 10, on(R.reason));
    cross(c, 420, 390, Sq(R.isnt - 0.05, R.isnt + 0.08), 110, 32);
    slam(c, 'NOT ON THEIR SITE', 40, 1120, -0.1, 74, RED, R.website, BLACK);
  }

  // ---------- SCENE 2: <1% reach page 2, then "what is Google looking at?" ----------
  if (scene === 2) {
    const P = B.pct.at, K = B.looking.at, t0 = swapAt(B.pct.wedge);
    const away = E.in(S(K.so + 0.1, K.so + 0.5)); // the page-1 board drops out for the lens
    c.save(); c.translate(-away * 900, away * 300);
    // 200 cursors = 200 searchers; exactly one reaches page 2 (0.5%, less than 1%)
    const gx = 60, gy = 180, dx = 31, dy = 38;
    for (let j = 0; j < 10; j++) { const p = Sq(t0 + 0.05 + j * 0.06, t0 + 0.1 + j * 0.06); if (p <= 0) continue;
      for (let i = 0; i < 20; i++) { if (i === 19 && j === 0) continue; cursor(c, gx + i * dx, gy + j * dy + (1 - p) * -30, 1.2, BLACK); } }
    const mv = E.inOut(S(P.page, P.two)), ox = gx + 19 * dx, oy = gy;
    if (tq > t0 + 0.1) cursor(c, lerp(ox, 600, mv), lerp(oy, 990, mv) - Math.sin(mv * Math.PI) * 80, lerp(1.2, 2.4, mv), RED);
    slab(c, 'PAGE 1', gx + 4, 610, -0.04, '400 44px "Russo One"', CREAM, BLACK, 16, 10, Sq(t0 + 0.6, t0 + 0.75));
    numBox(c, '<1%', 74, 850, -0.1, 200, 440, BLACK, CREAM, Sq(P.less - 0.2, P.one - LEAD));
    if (tq >= P.one - LEAD) slab(c, 'OF SEARCHERS', 84, 920, -0.1, '700 34px "Oswald"', CREAM, RED, 12, 7, on(P.people));
    barArrow(c, 200, 1010, 390, 1060, E.out(S(P.make, P.page)), 18, BLACK);
    slab(c, 'PAGE 2', 410, 1090, -0.04, '400 44px "Russo One"', CREAM, RED, 16, 10, on(P.two));
    c.restore();
    // the lens: Google looking
    const sw = E.back(S(K.whats - 0.2, K.whats + 0.35));
    if (sw > 0) {
      const lx = lerp(1100, 360, sw), ly = 620, rr = 210;
      fan(bc, lx, ly, [[-1.2, 0.05], [-0.5, 0.08], [0.3, 0.04], [2.2, 0.06], [2.9, 0.05], [-2.3, 0.07]], 1600 * Sq(K.google - 0.2, K.google));
      c.save(); c.translate(lx, ly); c.rotate(0.95); c.fillStyle = BLACK; c.fillRect(rr - 6, -32, 340, 64); c.restore();
      knockArc(lx, ly, rr + 18); c.fillStyle = RED; c.beginPath(); c.arc(lx, ly, rr, 0, 7); c.fill();
      c.strokeStyle = BLACK; c.lineWidth = 36; c.beginPath(); c.arc(lx, ly, rr, 0, 7); c.stroke();
      slam(c, '?', lx - 4, ly + 120, -0.1, 340, CREAM, K.looking, BLACK, 'center');
      gBadge(c, lx - 150, ly - 300, 170, -0.1, badgeP(K.google));
    }
  }

  // ---------- SCENE 3: two equal candidates -> references -> backlinks -> not just how many ----------
  if (scene === 3) {
    const Sm = B.same.at, Rf = B.refs.at, F = B.first.at, BL = B.backlinks.at, HM = B.howmany.at;
    const k = E.out(S(Sm.two - 0.25, Sm.two + 0.25));
    const morph = E.inOut(S(F.thats, F.thats + 0.8)); // mascot -> YOUR SITE, letters -> linking sites
    const hiredFirst = tq >= F.first - LEAD;
    const dp = E.out(Sq(Rf.thisguy - 0.2, Rf.thisguy + 0.1)); // emphasis disc behind "this guy"
    if (dp > 0 && morph < 1) { bc.fillStyle = RED; bc.beginPath(); bc.arc(180 - (1 - dp) * 400, 300, 205 * (1 - morph), 0, 7); bc.fill(); }
    if (morph < 1) { // left mascot (the one with references) and his mirrored twin
      const ly = 100 + (1 - k) * 200 + morph * 700;
      pastes.push([hiredFirst ? 'famous' : 'wave', -14 - (1 - k) * 500, ly - (hiredFirst ? 24 : 0), 0.64, 0, false, 1 - morph]);
      pastes.push(['wave', 734 + (1 - k) * 500 + morph * 500, ly, 0.64, 0, true, hiredFirst ? 0.55 : 1]);
    }
    const gone = E.in(Sq(Rf.thisguy - 0.3, Rf.thisguy)); // SAME column shoots away when "this guy" is singled out
    if (gone < 1) {
      c.save(); c.translate(gone * 900, 0);
      slam(c, 'SAME', 56, 610, -0.1, 120, RED, Sm.same, BLACK);
      [['JOB', Sm.job], ['EXPERIENCE', Sm.experience], ['SKILLS', Sm.skills], ['RESUME', Sm.resume]].forEach(([w, at], i) =>
        slab(c, '= ' + w, 70, 700 + i * 76, -0.1, '400 44px "Russo One"', CREAM, i % 2 ? RED : BLACK, 14, 9, on(at)));
      c.restore();
    }
    if (morph <= 0) {
      barArrow(c, 330, 590, 215, 420, E.out(Sq(Rf.thisguy - 0.1, Rf.thisguy + 0.2)), 24, RED);
      numBox(c, '10', 52, 960, -0.1, 130, 190, BLACK, CREAM, Sq(Rf.ten - LEAD - 0.15, Rf.ten - LEAD));
      slab(c, 'REFERENCES', 44, 1048, -0.1, '400 34px "Russo One"', CREAM, RED, 12, 8, on(Rf.references + 0.2));
      // "and this guy has one reference from his cousin"
      barArrow(c, 400, 590, 520, 420, E.out(Sq(Rf.thisguy2 - 0.1, Rf.thisguy2 + 0.2)), 24, BLACK);
      numBox(c, '1', 440, 940, -0.1, 130, 110, BLACK, CREAM, Sq(Rf.one - LEAD - 0.15, Rf.one - LEAD));
      slab(c, 'COUSIN', 440, 1020, -0.1, '400 34px "Russo One"', CREAM, BLACK, 12, 8, on(Rf.cousin));
      slam(c, hiredFirst ? 'HIRED!' : 'HIRED?', 52, 1196, -0.1, 120, hiredFirst ? RED : BLACK, Rf.hired, hiredFirst ? BLACK : null);
      check(c, 520, 1176, Sq(F.first - LEAD, F.first + 0.05), 0.9, BLACK);
    }
    { // the cousin's lone letter: no company mark, a scrawled heart instead; leaves with the twin
      const ti = Rf.reference1 - LEAD, p = E.out(cl((tq - ti) / 0.2, 0, 1));
      if (p > 0 && morph < 1) cousinLetter(c, lerp(900, 560, p) + morph * 500, lerp(-100, 690, p), 1.1, 0.14);
    }
    // the ten letters (each from a well-known company): a fanned hand under him, then the ten linking sites
    const sitePos = (i) => ({ x: 34 + (i % 5) * 134, y: 140 + Math.floor(i / 5) * 116 });
    const collapse = E.inOut(S(BL.its, BL.another)); // 10 sites -> news + directory
    for (let i = 0; i < 10; i++) {
      const ti = Rf.references - LEAD + i * 0.27, p = E.out(cl((tq - ti) / 0.2, 0, 1)); if (p <= 0) continue;
      const fx = 70 + i * 30, fy = 660 + Math.pow(i - 4.5, 2) * 3, rot = (i - 4.5) * 0.06;
      const sx = lerp(900, fx, p), sy = lerp(-100, fy, p), sp = sitePos(i);
      const x = lerp(sx, sp.x + 46, morph), y = lerp(sy, sp.y + 38, morph);
      if (collapse > 0 && i < 8) { // eight sites slide out to the left
        const off = E.in(cl(collapse * 1.6 - i * 0.08, 0, 1)); if (off >= 1) continue;
        site(c, x - 46 - off * 800, y - 38, 92, 76, 0, 'plain', 1, i); continue;
      }
      if (collapse > 0) { // two grow into NEWS / LOCAL DIRECTORY
        const tgt = i === 8 ? { x: 30, y: 280 } : { x: 380, y: 280 }, g = collapse;
        const kind = i === 8 ? (tq >= BL.news - LEAD ? 'news' : 'plain') : (tq >= BL.local - LEAD ? 'dir' : 'plain');
        site(c, lerp(x - 46, tgt.x, g), lerp(y - 38, tgt.y, g), lerp(92, 310, g), lerp(76, 200, g), 0, g < 1 ? 'plain' : kind, 1, i); continue;
      }
      if (morph < 0.5) refLetter(c, x, y, lerp(1.1, 0.9, morph), rot * (1 - morph), i);
      else site(c, x - 46, y - 38, 92, 76, 0, 'plain', 1, i);
      if (morph >= 1) barArrow(c, sp.x + 46, sp.y + 78, 360 + (sp.x - 300) * 0.4, 556, E.out(Sq(BL.references - LEAD + i * 0.06, BL.references + 0.1 + i * 0.06)), 10, i % 2 ? RED : BLACK);
    }
    // YOUR SITE grows out of the hired mascot
    if (morph > 0) {
      const g = morph, x = lerp(110, 110, g), y = lerp(220, 560, g), w = lerp(110, 500, g), h = lerp(100, 330, g);
      if (tq >= BL.backlinks - LEAD - 0.1 && collapse < 1) burstAt(bc, 360, 725, E.out(Sq(BL.backlinks - LEAD - 0.1, BL.backlinks)) * (1 - collapse), 14, 400);
      site(c, x, y, w, h, 0, 'clean', 1, 9);
      if (tq < HM.like) slab(c, 'YOUR SITE', x + 24, y + h + 70, -0.06, '400 46px "Russo One"', CREAM, BLACK, 16, 10, on(F.website));
    }
    { // BACKLINKS: slams big between the sites, then shrinks into the scene heading
      const hd = E.inOut(S(BL.its, BL.its + 0.5)), x = lerp(32, 190, hd), y = lerp(526, 160, hd), sz = lerp(140, 92, hd);
      slam(c, 'BACKLINKS', x, y, -0.06, sz, RED, BL.backlinks, BLACK);
    }
    if (collapse >= 1) {
      slab(c, 'NEWS', 44, 262, -0.06, '400 36px "Russo One"', CREAM, RED, 12, 8, on(BL.news));
      slab(c, 'LOCAL DIRECTORY', 392, 262, -0.06, '400 30px "Russo One"', CREAM, BLACK, 10, 7, on(BL.local + 0.3));
      barArrow(c, 190, 488, 290, 556, E.out(Sq(BL.links - LEAD - 0.15, BL.links)), 26, RED);
      barArrow(c, 530, 488, 430, 556, E.out(Sq(BL.back - LEAD - 0.15, BL.back)), 26, RED);
      // NOT JUST HOW MANY: links flood in, the count runs up, a cross is stamped over the count
      const fl = S(HM.not - 0.2, HM.many), r = H.rng(77);
      for (let j = 0; j < 30; j++) { const side = j % 3, x0 = side === 1 ? 760 : -40, y0 = r.range(500, 1240), tj = HM.not - 0.2 + j * 0.03, p = E.out(Sq(tj, tj + 0.15));
        r(); barArrow(bc, x0, y0, r.range(140, 580), r.range(570, 880), p, 5, j % 3 ? BLACK : RED); }
      if (fl > 0) { const n = Math.round(lerp(2, 99, E.in(fl))); numBox(c, String(n), 450, 1100, -0.1, 120, 200, BLACK, CREAM); slab(c, 'LINKS', 470, 968, -0.1, '400 40px "Russo One"', CREAM, RED, 12, 8); }
      slab(c, 'NOT JUST', 50, 1020, -0.1, '400 44px "Russo One"', CREAM, BLACK, 14, 9, on(HM.not));
      slab(c, 'HOW MANY', 50, 1094, -0.1, '400 44px "Russo One"', CREAM, RED, 14, 9, on(HM.how));
      cross(c, 540, 1050, Sq(HM.many - 0.05, HM.many + 0.08), 85, 26);
    }
  }

  // ---------- SCENE 4: one trusted link outweighs fifty random ones ----------
  if (scene === 4) {
    const T = B.trust.at, t0 = swapAt(B.trust.wedge);
    const px = 360, py = 650, half = 250;
    // beam angle: level, tips left as the trusted link lands, jolts when 50 land, settles still left-down
    const land1 = S(T.link - 0.1, T.link + 0.5), land50 = S(T.fifty, T.fifty + 0.6);
    let th = -0.2 * E.back(land1);
    th += 0.07 * Math.sin(land50 * Math.PI) * (1 - land50 * 0.3);
    const ca = Math.cos(th), sa = Math.sin(th), Lx = px - half * ca, Ly = py - half * sa, Rx = px + half * ca, Ry = py + half * sa;
    bc.fillStyle = RED; bc.beginPath(); bc.arc(Lx, Ly + 150, 175 * E.out(Sq(T.trust - 0.2, T.trust + 0.1)), 0, 7); bc.fill();
    const bp = E.out(Sq(t0, t0 + 0.3)); // fulcrum + beam on twos
    c.fillStyle = BLACK; c.beginPath(); c.moveTo(px, py); c.lineTo(px - 100 * bp, 930); c.lineTo(px + 100 * bp, 930); c.closePath(); c.fill();
    c.save(); c.translate(px, py); c.rotate(th); c.fillRect(-half * bp - 20, -12, (half * 2 + 40) * bp, 24); c.restore();
    const pan = (x, y, p) => { if (p <= 0) return; c.strokeStyle = BLACK; c.lineWidth = 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 96, y + 130); c.moveTo(x, y); c.lineTo(x + 96, y + 130); c.stroke();
      c.fillStyle = BLACK; c.beginPath(); c.moveTo(x - 115, y + 130); c.lineTo(x + 115, y + 130); c.lineTo(x + 84, y + 154); c.lineTo(x - 84, y + 154); c.closePath(); c.fill(); };
    pan(Lx, Ly, bp); pan(Rx, Ry, bp);
    const d1 = E.out(Sq(T.one - LEAD - 0.15, T.one - LEAD + 0.05));
    if (d1 > 0) site(c, Lx - 80, lerp(-200, Ly + 130 - 125, d1), 160, 125, 0, 'trusted', 1, 11);
    for (let i = 0; i < 50; i++) { // fifty random sites rain into the right pan
      const ti = T.fifty - LEAD - 0.1 + i * 0.008, p = E.in(cl((t - ti) / 0.22, 0, 1)); if (p <= 0) continue;
      const row = Math.floor(i / 8), col = i % 8, w = 24, hh = 17;
      const x = Rx - 106 + col * 26 + (row % 2) * 4, y = Ry + 130 - hh - row * 17;
      site(c, x, lerp(-80 - i * 6, y, p), w, hh, 0, 'random', 1, 100 + i);
    }
    numBox(c, '1', 64, 330, -0.08, 150, 130, BLACK, RED, Sq(T.one - LEAD - 0.2, T.one - LEAD));
    slab(c, 'TRUSTED', 50, 440, -0.08, '400 44px "Russo One"', CREAM, RED, 14, 9, on(T.trust));
    numBox(c, '50', 430, 310, -0.08, 150, 210, BLACK, CREAM, Sq(T.fifty - LEAD - 0.2, T.fifty - LEAD));
    slab(c, 'RANDOM', 430, 420, -0.08, '400 44px "Russo One"', CREAM, BLACK, 14, 9, on(T.random));
    slam(c, '1 > 50', 360, 1080, -0.08, 130, RED, T.nobody, BLACK, 'center');
  }

  // ---------- SCENE 5: takeaway ----------
  if (scene === 5) {
    const F = B.follow.at, t0 = swapAt(B.follow.wedge);
    const k = E.out(S(t0 + 0.1, t0 + 0.7));
    fan(bc, 330, 260, [[-2.5, 0.06], [-2.0, 0.1], [-1.3, 0.05], [-0.75, 0.08], [-0.25, 0.05], [3.0, 0.05]], 1100 * Sq(t0 + 0.3, t0 + 0.5));
    pastes.push(['phone', 110 - (1 - k) * 500, 40 + (1 - k) * 200, 0.7]);
    // the disc sits on the type plate so cream type can print over it; it pulses on FOLLOW
    const dp = E.out(Sq(t0, t0 + 0.4)), pulse = 1 + 0.06 * Math.exp(-Math.max(0, t - F.follow + LEAD) * 7) * (t > F.follow - LEAD ? 1 : 0);
    const dx = 520 + (1 - dp) * 500, dr = 230 * pulse; knockArc(dx, 1010, dr); c.fillStyle = RED; c.beginPath(); c.arc(dx, 1010, dr, 0, 7); c.fill();
    burstAt(bc, dx, 1010, E.out(Sq(F.follow - LEAD - 0.1, F.follow)), 16, 420);
    slab(c, 'YOUR SITE NEEDS', 50, 560, -0.12, '400 46px "Russo One"', CREAM, BLACK, 16, 10, on(F.website));
    slam(c, 'BACKLINKS', 36, 740, -0.12, 150, BLACK, F.backlinks, null);
    if (tq >= F.follow - LEAD) { const fk = cl((tq - F.follow + LEAD) / 0.2, 0, 1), sc = 1 + 0.5 * (1 - fk);
      c.save(); c.translate(64, 930); c.scale(sc, sc); numBox(c, 'FOLLOW', 0, 0, -0.12, 120, 380, BLACK, CREAM); c.restore(); }
    if (tq >= F.follow + 0.25) { const lk = cl((tq - F.follow - 0.25) / 0.2, 0, 1); logo(c, 380, 1030, 56, CREAM, -0.12, 1 + 0.5 * (1 - lk)); }
  }

  // ---------- corner imprint: the TAAM wordmark ----------
  if (scene < 5) logo(c, 30, 40, 34, BLACK);

  // ---------- the orange wedge drives across between scenes ----------
  const WL = H.layer(W, HH), wc = WL.getContext('2d'); let wedgeOn = false;
  for (const w of WEDGES) {
    const u = S(w, w + 0.95); if (u <= 0 || u >= 1) continue; wedgeOn = true; const c = wc;
    const tx = H.lerp(-100, 3300, E.inOut(u));
    c.fillStyle = RED; c.beginPath(); c.moveTo(tx, HH / 2); c.lineTo(tx - 2400, -1400); c.lineTo(tx - 2400, HH + 1400); c.closePath(); c.fill();
    c.fillStyle = BLACK; c.beginPath(); c.moveTo(tx + 60, HH / 2 + 30); c.lineTo(tx - 2400, -1360); c.lineTo(tx - 2400, -1330); c.closePath(); c.fill();
  }

  // ---------- print: back plate, pasted cut-outs, front plate, wedge, then finish ----------
  KO = null; punch(BK, KOQ); exInk(BK, 7, 0.26, 0.006); exInk(L, 7, 0.26, 0.006);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(BK, 0, 0); ctx.restore();
  pastes.forEach(([k, x, y, s, rot, flip, a]) => paste(ctx, PH[k], x, y, s, rot || 0, !!flip, a == null ? 1 : a));
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(L, 0, 0); ctx.restore();
  if (wedgeOn) { exInk(WL, 7, 0.12, 0.004); ctx.drawImage(WL, 0, 0); }
  scratches(ctx, W, HH);
  H.grain(ctx, W, HH, 0.08, 4 + Math.floor(t * 12), true);
  H.vignette(ctx, W, HH, 0.25, '50,30,10');
};
const FW = 720, FH = 1280; // 9:16 frame
const FONT_SPECS = ['400 150px "Anton"', '400 40px "Russo One"', '700 34px "Oswald"'];
const ready = async () => { try { await Promise.all(FONT_SPECS.map((f) => document.fonts.load(f, 'AaZz09<>%#?!'))); await document.fonts.ready; } catch (e) {} await loadMascots(); };
