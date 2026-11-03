// Renders front-design options side by side for comparison.
// Run: node business-cards/variants.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const W = 86, H = 54, DPI = 600;
const OUT = path.join(__dirname, 'variants');
fs.mkdirSync(OUT, { recursive: true });

const markD = fs.readFileSync(path.join(__dirname, '../public/brand/taam-mark.svg'), 'utf8').match(/d="([^"]+)"/)[1];
const FONT = 'font-family="Montserrat" font-weight="900"';

// Measure a line of Montserrat Black at 100 units: ink box relative to the baseline origin.
async function measure(text, ls) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="300">
    <rect width="4000" height="300" fill="#fff"/>
    <text x="100" y="200" ${FONT} font-size="100" letter-spacing="${ls}">${text}</text></svg>`;
  const { info } = await sharp(Buffer.from(svg)).trim({ background: '#fff', threshold: 40 }).toBuffer({ resolveWithObject: true });
  return { left: -info.trimOffsetLeft - 100, top: -info.trimOffsetTop - 200, w: info.width, h: info.height };
}

// A line of type scaled so its ink spans exactly x..x+w, ink top at y. Returns { svg, h }.
async function fit(text, x, y, w, fill, ls = -3) {
  const m = await measure(text, ls);
  const s = w / m.w;
  return {
    h: m.h * s,
    svg: `<text transform="translate(${x - m.left * s} ${y - m.top * s}) scale(${s})" ${FONT} font-size="100"
      letter-spacing="${ls}" fill="${fill}">${text}</text>`,
  };
}

const mark = (x, y, size, fill) =>
  `<g transform="translate(${x} ${y}) scale(${size / 377.4}) translate(-295.8 -222.8)"><path d="${markD}" fill="${fill}" fill-rule="evenodd"/></g>`;

const card = (bg, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>${body}</svg>`;

// Small mark + URL on top, big BETTER / MARKETING. anchored to the bottom.
async function hero(bg, fg) {
  const m = 5, w = W - 2 * m, gap = 2.2;
  const pa = await measure('BETTER', -3), pb = await measure('MARKETING.', -3);
  const ha = pa.h * (w / pa.w), hb = pb.h * (w / pb.w);
  const top = H - m - hb - gap - ha;
  const A = await fit('BETTER', m, top, w, fg);
  const B = await fit('MARKETING.', m, top + ha + gap, w, fg);
  return card(bg, A.svg + B.svg +
    mark(m, m, 5, fg) +
    `<text x="${W - m}" y="${m + 3.6}" text-anchor="end" font-family="Montserrat" font-weight="700" font-size="2.5"
      letter-spacing="0.5" fill="${fg}">TAAMMARKETING.COM</text>`);
}

// BETTER runs off both sides, MARKETING. tucked under it, mark bottom-right.
async function bleed() {
  const pa = await measure('BETTER', -3);
  const ha = pa.h * ((W + 16) / pa.w);
  const top = 7;
  const A = await fit('BETTER', -8, top, W + 16, '#000');
  const B = await fit('MARKETING.', 5, top + ha + 2.2, 56, '#000');
  return card('#fff', A.svg + B.svg + mark(W - 5 - 8, H - 5 - 8, 8, '#000'));
}

// Full line, each row justified, clean Montserrat Black.
async function stack() {
  const m = 3, w = W - 2 * m, gap = 1.3;
  const rows = ['BETTER', 'MARKETING', 'FOR THE BEST', 'BUSINESSES.'];
  let y = m, out = '';
  const fitted = [];
  for (const r of rows) fitted.push(await measure(r, -3));
  const k = (H - 2 * m - gap * 3) / fitted.reduce((s, f) => s + f.h * (w / f.w), 0);
  for (const r of rows) {
    const f = await fit(r, m, y, w, '#000');
    // stretch vertically by k around the row's top so the stack fills the card
    out += `<g transform="translate(0 ${y}) scale(1 ${k}) translate(0 ${-y})">${f.svg}</g>`;
    y += f.h * k + gap;
  }
  return card('#fff', out);
}

(async () => {
  const variants = [
    ['A-better-marketing', await hero('#fff', '#000')],
    ['B-black', await hero('#000', '#fff')],
    ['C-bleed', await bleed()],
    ['D-full-line-clean', await stack()],
  ];
  const tiles = [];
  for (const [name, svg] of variants) {
    fs.writeFileSync(path.join(OUT, `${name}.svg`), svg);
    const png = await sharp(Buffer.from(svg), { density: DPI, limitInputPixels: false }).flatten({ background: '#fff' }).png().toBuffer();
    fs.writeFileSync(path.join(OUT, `${name}.png`), png);
    tiles.push(await sharp(png).resize(860, 540).extend({ top: 2, bottom: 2, left: 2, right: 2, background: '#bbb' }).png().toBuffer());
  }
  await sharp({ create: { width: 1824, height: 1184, channels: 3, background: '#e8e8e8' } })
    .composite(tiles.map((t, i) => ({ input: t, left: 30 + (i % 2) * 900, top: 30 + Math.floor(i / 2) * 580 })))
    .png().toFile(path.join(OUT, 'compare.png'));
  console.log('done');
})();
