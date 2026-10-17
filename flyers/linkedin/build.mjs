// Builds the LinkedIn banners (personal profile 1584x396, company page 1512x256), then screenshots them with headless Chrome.
// Run: node flyers/linkedin/build.mjs
// The profile photo / company logo covers the lower-left corner, so all content sits right of `left`.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const out = resolve(here, 'out');
mkdirSync(out, { recursive: true });
const url = (p) => pathToFileURL(resolve(root, p)).href;

const fonts = ['Medium', 'Bold', 'ExtraBold', 'Black']
  .map((w, i) => `@font-face{font-family:M;font-weight:${500 + i * 100};src:url('${url(`lib/fonts/Montserrat-${w}.ttf`)}')}`)
  .join('');

const own = resolve(here, 'characters', 'sitting-ledge.png');
const charSrc = existsSync(own) ? pathToFileURL(own).href : url('public/characters/wave.png');
// Fraction of the mascot image height where the hand he leans on touches the ledge (measured from the PNG).
const SEAT = 0.673;

const sizes = [
  // Personal profile: tall enough for the tagline under the headline.
  { file: 'linkedin-banner', w: 1584, h: 396, left: 380, right: 30, top: 178, charH: 300, stroke: 5, subSize: 30, subFirst: false },
  // Company page: too short for that, so the tagline sits above the headline, left of the mascot.
  { file: 'linkedin-company-cover', w: 1512, h: 256, left: 340, right: 30, top: 84, charH: 190, stroke: 4, subSize: 22, subFirst: true },
];

const page = (z) => `<!doctype html><html><head><meta charset="utf-8"><style>
${fonts}
*{margin:0;padding:0;box-sizing:border-box}
:root{--orange:#F46325;--ink:#111;--white:#fff}
html,body{width:${z.w}px;height:${z.h}px;overflow:hidden}
body{background:var(--orange);color:var(--white);font-family:M,sans-serif;position:relative}
.copy{position:absolute;left:${z.left}px;right:${z.right}px;top:${z.top}px;display:flex;flex-direction:${z.subFirst ? 'column-reverse' : 'column'}}
h1{font-weight:900;text-transform:uppercase;font-size:110px;line-height:.86;letter-spacing:-.035em;white-space:nowrap;width:max-content}
.outline{color:var(--orange);-webkit-text-stroke:${z.stroke}px var(--white);paint-order:stroke fill}
.sub{margin:${z.subFirst ? '0 0 14px 4px' : '20px 0 0 4px'};font-weight:700;font-size:${z.subSize}px;letter-spacing:.02em;display:flex;gap:18px;align-items:center}
.sub b{display:inline-block;width:${z.subSize * 1.7}px;height:${z.stroke}px;background:var(--white)}
.char{position:absolute;height:${z.charH}px}
</style></head><body>
<div class="copy">
  <h1>Better <span class="outline" id="m">marketing</span></h1>
  <p class="sub"><b></b>Built for the best businesses.</p>
</div>
<img class="char" id="c" src="${charSrc}">
<script>
document.fonts.load('900 100px M').then(()=>{
// Fit the headline to the space, then sit the mascot on top of "MARKETING".
const h=document.querySelector('h1'),max=${z.w - z.left - z.right};let f=160;h.style.fontSize=f+'px';
while(h.offsetWidth>max&&f>60){f-=2;h.style.fontSize=f+'px'}
const m=document.getElementById('m'),c=document.getElementById('c');
// Exact top of the "G" his hand rests on: baseline minus the glyph's ascent, plus half the outline stroke.
const probe=document.createElement('span');probe.style.cssText='display:inline-block;width:0;height:0;vertical-align:baseline';
m.appendChild(probe);const baseline=probe.getBoundingClientRect().top;probe.remove();
const ctx=document.createElement('canvas').getContext('2d');ctx.font='900 '+f+'px M';
const ledge=baseline-ctx.measureText('G').actualBoundingBoxAscent-${z.stroke / 2};
c.style.top=(ledge-${z.charH}*${SEAT})+'px';
// Center the resting hand (x 70-88% of the image) over the actual G glyph.
const t=m.firstChild,rg=document.createRange();rg.setStart(t,t.length-1);rg.setEnd(t,t.length);
const G=rg.getBoundingClientRect();c.style.left=(G.left+G.width/2-${z.charH}*0.79)+'px';
});
</script>
</body></html>`;

for (const z of sizes) {
  const html = resolve(out, `${z.file}.html`);
  writeFileSync(html, page(z));
  execFileSync('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
    '--force-device-scale-factor=1', `--window-size=${z.w},${z.h}`, '--virtual-time-budget=3000',
    `--screenshot=${resolve(out, `${z.file}.png`)}`, pathToFileURL(html).href,
  ], { stdio: 'ignore' });
  console.log(`wrote ${z.file}.png`);
}
