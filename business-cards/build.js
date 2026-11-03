// Builds TAAM business cards (86 x 54 mm), black on white.
// Run: node business-cards/build.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PDFDocument, rgb } = require('pdf-lib');

const OUT = __dirname;
const W = 86, H = 54;            // card size in mm
const DPI = 1200;
const PX = (mm) => Math.round((mm / 25.4) * DPI);
const PT = (mm) => (mm / 25.4) * 72;

const PHONE = '702-997-6813';
const EMAIL = 'info@taammarketing.com';
const WEB = 'taammarketing.com';

const people = [
  { slug: 'alex', name: 'ALEX', title: 'CEO', long: 'CHIEF EXECUTIVE OFFICER' },
  { slug: 'theodore', name: 'THEODORE', title: 'COO', long: 'CHIEF OPERATING OFFICER' },
];


const svgWrap = (body) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#fff"/>
  ${body}
</svg>`;

// Front: "BETTER MARKETING FOR THE BEST BUSINESSES", each line justified to full width
// and stretched together so the stack fills the card (vector trace of the hero type).
const frontLines = JSON.parse(fs.readFileSync(path.join(__dirname, 'front-type.json'), 'utf8'));
function front() {
  const m = 1.6, gap = 0.75, w = W - 2 * m;
  const natural = frontLines.map((l) => w * (l.h / l.w));
  const k = (H - 2 * m - gap * (frontLines.length - 1)) / natural.reduce((a, b) => a + b, 0);
  let y = m;
  return svgWrap(frontLines.map((l, i) => {
    const h = natural[i] * k;
    const out = `<svg x="${m}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${l.w} ${l.h}" preserveAspectRatio="none">
    <path d="${l.d}" fill="#000" fill-rule="evenodd"/></svg>`;
    y += h + gap;
    return out;
  }).join('\n  '));
}

// Back: type-led. Solid name, giant outline title, contact under a full-width rule.
function back(p) {
  const font = 'font-family="Montserrat"';
  return svgWrap(`
  <text x="6" y="13.5" ${font} font-weight="900" font-size="8.6" fill="#000">${p.name}</text>
  <text x="6.2" y="18.2" ${font} font-weight="600" font-size="2" letter-spacing="0.55" fill="#000">${p.long}</text>
  <text x="80.6" y="38.6" text-anchor="end" ${font} font-weight="900" font-size="25" letter-spacing="0.6"
    fill="none" stroke="#000" stroke-width="0.4" stroke-linejoin="round">${p.title}</text>
  <rect x="6" y="41.6" width="74" height="0.45" fill="#000"/>
  <g ${font} font-size="2.55" fill="#000">
    <text x="6" y="46.4" font-weight="600">${PHONE}</text>
    <text x="6" y="49.9" font-weight="600">${EMAIL}</text>
    <text x="80" y="49.9" text-anchor="end" font-weight="800">${WEB}</text>
  </g>`);
}

async function render(svg, name) {
  fs.writeFileSync(path.join(OUT, `${name}.svg`), svg);
  const png = await sharp(Buffer.from(svg), { density: DPI, limitInputPixels: false })
    .resize(PX(W), PX(H)).flatten({ background: '#fff' }).png().toBuffer();
  fs.writeFileSync(path.join(OUT, `${name}.png`), png);
  return png;
}

// 2 x 5 letter sheet with crop marks. Backs mirror the columns for duplex printing.
async function sheet(pdf, png, mirror) {
  const page = pdf.addPage([PT(215.9), PT(279.4)]);
  const img = await pdf.embedPng(png);
  const cols = 2, rows = 5;
  const ox = (215.9 - cols * W) / 2, oy = (279.4 - rows * H) / 2;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const cc = mirror ? cols - 1 - c : c;
    page.drawImage(img, { x: PT(ox + cc * W), y: PT(oy + r * H), width: PT(W), height: PT(H) });
  }
  const k = { thickness: 0.4, color: rgb(0, 0, 0) };
  for (let c = 0; c <= cols; c++) {
    const x = PT(ox + c * W);
    page.drawLine({ start: { x, y: PT(oy - 1.5) }, end: { x, y: PT(oy - 4.5) }, ...k });
    page.drawLine({ start: { x, y: PT(oy + rows * H + 1.5) }, end: { x, y: PT(oy + rows * H + 4.5) }, ...k });
  }
  for (let r = 0; r <= rows; r++) {
    const y = PT(oy + r * H);
    page.drawLine({ start: { x: PT(ox - 1.5), y }, end: { x: PT(ox - 6), y }, ...k });
    page.drawLine({ start: { x: PT(ox + cols * W + 1.5), y }, end: { x: PT(ox + cols * W + 6), y }, ...k });
  }
}

(async () => {
  const frontPng = await render(front(), 'front');
  for (const p of people) {
    const backPng = await render(back(p), `back-${p.slug}`);

    const card = await PDFDocument.create();
    for (const png of [frontPng, backPng]) {
      const page = card.addPage([PT(W), PT(H)]);
      page.drawImage(await card.embedPng(png), { x: 0, y: 0, width: PT(W), height: PT(H) });
    }
    fs.writeFileSync(path.join(OUT, `card-${p.slug}-86x54.pdf`), await card.save());

    const sheetPdf = await PDFDocument.create();
    await sheet(sheetPdf, frontPng, false);
    await sheet(sheetPdf, backPng, true);
    fs.writeFileSync(path.join(OUT, `sheet-${p.slug}-letter-10up.pdf`), await sheetPdf.save());
  }
  console.log('done');
})();
