// Builds one 1080x1350 Instagram post per free tool, then screenshots each with headless Chrome.
// Run: node flyers/tools/build.mjs
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const out = resolve(here, 'out');
mkdirSync(out, { recursive: true });
const url = (p) => pathToFileURL(resolve(root, p)).href;

// lines: [text, outline?]
const tools = [
  {
    file: '01-website-speed-test',
    slug: 'website-speed-test',
    name: 'Website speed test',
    lines: [['Is your', false], ['site', false], ['slow?', true]],
    pitch: 'Mobile and desktop scores, Core Web Vitals and the fixes that matter most.',
    char: 'speed',
    fallback: 'phone',
  },
  {
    file: '02-seo-grader',
    slug: 'seo-grader',
    name: 'On-page SEO grader',
    lines: [['Grade', false], ['your', true], ['SEO.', false]],
    pitch: 'Titles, headings, alt text, schema and more, graded on any page in seconds.',
    char: 'seo',
    fallback: 'peek',
  },
  {
    file: '03-ad-budget-calculator',
    slug: 'ad-budget-calculator',
    name: 'Ad budget & lead calculator',
    lines: [['What does', false], ['a lead', true], ['cost?', false]],
    pitch: 'See how many leads your ad budget buys, what each one costs and what it returns.',
    char: 'calculator',
    fallback: 'counting',
  },
  {
    file: '04-google-business-profile-audit',
    slug: 'google-business-profile-audit',
    name: 'Google Business Profile audit',
    lines: [['Are you', false], ['on the', true], ['map?', false]],
    pitch: 'A two-minute self-check that scores your profile and shows what is costing you calls.',
    char: 'map-pin',
    fallback: 'famous',
  },
  {
    file: '05-serp-preview',
    slug: 'serp-preview',
    name: 'Google SERP preview',
    lines: [['See your', false], ['Google', true], ['result.', false]],
    pitch: 'Write titles and descriptions that fit, with a live preview of how you show up.',
    char: 'search',
    fallback: 'wave',
  },
];

const fonts = ['Medium', 'Bold', 'ExtraBold', 'Black']
  .map((w, i) => `@font-face{font-family:M;font-weight:${500 + i * 100};src:url('${url(`lib/fonts/Montserrat-${w}.ttf`)}')}`)
  .join('');

function html(t, i) {
  const own = resolve(here, 'characters', `${t.char}.png`);
  const charSrc = existsSync(own) ? pathToFileURL(own).href : url(`public/characters/${t.fallback}.png`);
  const lines = t.lines
    .map(([txt, o]) => `<span class="${o ? 'outline' : ''}">${txt}</span>`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fonts}
*{margin:0;padding:0;box-sizing:border-box}
:root{--orange:#F46325;--ink:#111;--white:#fff}
html,body{width:1080px;height:1350px;overflow:hidden}
body{background:var(--orange);color:var(--white);font-family:M,sans-serif;position:relative}
.top{position:absolute;top:64px;left:72px;right:72px;display:flex;justify-content:space-between;align-items:center}
.logo{height:92px;margin:-14px 0 0 -18px}
.chip{border:4px solid var(--white);border-radius:999px;padding:14px 26px 12px;font-weight:800;font-size:24px;letter-spacing:.14em;text-transform:uppercase}
.eyebrow{position:absolute;top:220px;left:72px;font-weight:800;font-size:26px;letter-spacing:.2em;text-transform:uppercase;display:flex;gap:20px;align-items:center}
.eyebrow b{display:inline-block;width:56px;height:5px;background:var(--white)}
h1{font-weight:900;text-transform:uppercase;font-size:150px;line-height:.9;letter-spacing:-.035em}
h1 span{display:block;width:max-content;white-space:nowrap}
.outline{color:var(--orange);-webkit-text-stroke:6px var(--white);paint-order:stroke fill}
.stack{position:absolute;top:282px;left:66px;right:40px}
.pitch{margin:56px 0 0 6px;width:470px;font-weight:600;font-size:31px;line-height:1.35}
.char{position:absolute;right:16px;bottom:168px;width:470px;height:470px;object-fit:contain;object-position:right bottom}
.bar{position:absolute;left:0;right:0;bottom:0;height:150px;background:var(--ink);display:flex;align-items:center;justify-content:space-between;padding:0 72px}
.url{font-weight:800;font-size:30px;letter-spacing:.01em}
.url small{display:block;font-weight:600;font-size:20px;letter-spacing:.2em;text-transform:uppercase;color:var(--orange);margin-bottom:8px}
.cta{background:var(--orange);color:var(--white);border-radius:999px;padding:22px 36px 20px;font-weight:900;font-size:28px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.tags{position:absolute;top:1100px;left:72px;display:flex;gap:12px}
.tags span{background:var(--white);color:var(--ink);border-radius:999px;padding:10px 20px 8px;font-weight:800;font-size:19px;letter-spacing:.1em;text-transform:uppercase}
</style></head><body>
<div class="top"><img class="logo" src="${url('public/brand-assets/logos/transparent/TAAM_logo_white_transparent.png')}"><div class="chip">Free tool</div></div>
<div class="eyebrow"><b></b>${t.name}</div>
<div class="stack"><h1>${lines}</h1>
<p class="pitch">${t.pitch}</p></div>
<div class="tags"><span>Free</span><span>No signup</span><span>Results in seconds</span></div>
<img class="char" src="${charSrc}">
<script>const h=document.querySelector('h1');let f=170;h.style.fontSize=f+'px';while([...h.children].some(c=>c.scrollWidth>960)&&f>80){f-=2;h.style.fontSize=f+'px'}</script>
<div class="bar"><div class="url"><small>Link in bio</small>taammarketing.com/tools</div><div class="cta">Try it free &rarr;</div></div>
</body></html>`;
}

const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
tools.forEach((t, i) => {
  const page = resolve(out, `${t.file}.html`);
  writeFileSync(page, html(t, i));
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
    '--force-device-scale-factor=1', '--window-size=1080,1350', '--virtual-time-budget=3000',
    `--screenshot=${resolve(out, `${t.file}.png`)}`, pathToFileURL(page).href,
  ], { stdio: 'ignore' });
  console.log('wrote', `${t.file}.png`);
});
