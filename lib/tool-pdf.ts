import { readFile } from 'fs/promises';
import path from 'path';
import { PDFDocument, PDFName, PDFString, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { ToolReport } from '@/app/lib/tool-reports';

// The downloadable PDF copy of a free-tool report, attached to the report email.
// Same content as the email, laid out for print: orange cover band, ink type on white, orange CTA.
// Fonts are read from lib/fonts (traced into the function via next.config); Helvetica if they're missing.

const ORANGE = rgb(0xf4 / 255, 0x63 / 255, 0x25 / 255);
const INK = rgb(0x11 / 255, 0x11 / 255, 0x11 / 255);
const MUTED = rgb(0.42, 0.42, 0.42);
const RULE = rgb(0.86, 0.86, 0.86);
const WHITE = rgb(1, 1, 1);

const W = 612; // US Letter
const H = 792;
const M = 48;
const COL = W - M * 2;
const FOOTER = 40;

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.taammarketing.com').replace(/\/$/, '');
const REPLY_TO = process.env.TOOL_EMAIL_REPLY_TO || 'info@taammarketing.com';
const PHONE = '702-997-6813';

interface Fonts {
  medium: PDFFont;
  bold: PDFFont;
  xbold: PDFFont;
  black: PDFFont;
  /** Custom fonts cover far more glyphs than Helvetica's WinAnsi set. */
  custom: boolean;
}

async function loadFonts(doc: PDFDocument): Promise<Fonts> {
  try {
    doc.registerFontkit(fontkit);
    const dir = path.join(process.cwd(), 'lib', 'fonts');
    const load = async (w: string) => doc.embedFont(await readFile(path.join(dir, `Montserrat-${w}.ttf`)), { subset: true });
    const [medium, bold, xbold, black] = await Promise.all(['Medium', 'Bold', 'ExtraBold', 'Black'].map(load));
    return { medium, bold, xbold, black, custom: true };
  } catch (err) {
    console.warn('Montserrat unavailable for PDF, using Helvetica:', err);
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    return { medium: regular, bold, xbold: bold, black: bold, custom: false };
  }
}

// Swap the few symbols our copy uses that the fonts can't draw, then drop anything else exotic.
function clean(s: string, custom: boolean): string {
  const t = s.replace(/[↗→]/g, '>').replace(/[✓✔]/g, '+').replace(/\t/g, ' ');
  return custom ? t.replace(/[^ -ɏ‐-‧‰-⁞€™\n]/g, '') : t.replace(/[^ -ÿ–—‘’“”•…€\n]/g, '');
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width) {
        line = next;
        continue;
      }
      if (line) lines.push(line);
      // A single word wider than the column (long URLs) gets hard-broken.
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > width) {
        let cut = rest.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut--;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = rest;
    }
    lines.push(line);
  }
  return lines;
}

function addLink(doc: PDFDocument, page: PDFPage, x: number, y: number, w: number, h: number, url: string) {
  const annot = doc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [x, y, x + w, y + h],
    Border: [0, 0, 0],
    A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
  });
  const annots = page.node.lookup(PDFName.of('Annots'));
  const ref = doc.context.register(annot);
  if (annots && 'push' in annots) (annots as unknown as { push(r: unknown): void }).push(ref);
  else page.node.set(PDFName.of('Annots'), doc.context.obj([ref]));
}

export function toolPdfFilename(report: ToolReport): string {
  const site = report.website?.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9.-]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return `TAAM-${report.slug}${site ? `-${site}` : ''}-report.pdf`;
}

export async function renderToolPdf(report: ToolReport, firstName: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${report.toolName} report`);
  doc.setAuthor('TAAM Marketing');
  doc.setCreator(SITE);
  const f = await loadFonts(doc);
  const c = (s: string) => clean(s, f.custom);

  let page = doc.addPage([W, H]);
  let y = H;

  const newPage = () => {
    page = doc.addPage([W, H]);
    y = H - M;
  };
  const ensure = (needed: number) => {
    if (y - needed < M + FOOTER) newPage();
  };
  const text = (s: string, x: number, size: number, font: PDFFont, color = INK, width = COL, leading = 1.45) => {
    const lines = wrap(c(s), font, size, width);
    for (const line of lines) {
      ensure(size * leading);
      y -= size * leading;
      page.drawText(line, { x, y: y + size * (leading - 1) * 0.5, size, font, color });
    }
  };
  const blockHeight = (s: string, size: number, font: PDFFont, width = COL, leading = 1.45) => wrap(c(s), font, size, width).length * size * leading;

  // ── Cover band ────────────────────────────────────────────────────────────
  const hi = firstName ? `${firstName}, here's` : "Here's";
  const intro = `${hi} everything from your report, so you can keep it, share it and work through it.`;
  const headlineSize = 30;
  const headlineH = blockHeight(report.headline.toUpperCase(), headlineSize, f.black, COL - 16, 1.12);
  const statRows = Math.ceil(report.stats.length / 2);
  const bandH = 64 + 26 + headlineH + (report.website ? 22 : 0) + blockHeight(intro, 12, f.bold, COL - 16) + 24 + statRows * 62 + 24;
  page.drawRectangle({ x: 0, y: H - bandH, width: W, height: bandH, color: ORANGE });

  y = H - M + 8;
  page.drawText('TAAM', { x: M, y: y - 22, size: 26, font: f.black, color: WHITE });
  page.drawText('.', { x: M + f.black.widthOfTextAtSize('TAAM', 26), y: y - 22, size: 26, font: f.black, color: INK });
  addLink(doc, page, M, y - 26, 90, 30, SITE);
  const eyebrow = c(`FREE ${report.toolName.toUpperCase()} · FULL REPORT`);
  page.drawText(eyebrow, { x: W - M - f.xbold.widthOfTextAtSize(eyebrow, 8.5), y: y - 18, size: 8.5, font: f.xbold, color: INK });
  y -= 64;

  text(report.headline.toUpperCase(), M, headlineSize, f.black, WHITE, COL - 16, 1.12);
  if (report.website) {
    y -= 6;
    text(report.website, M, 11, f.bold, INK);
  }
  y -= 10;
  text(intro, M, 12, f.bold, INK, COL - 16);
  y -= 18;

  const statW = COL / 2;
  report.stats.forEach((s, i) => {
    const col = i % 2;
    if (col === 0 && i > 0) y -= 62;
    const x = M + col * statW;
    page.drawRectangle({ x, y: y - 2, width: statW - 16, height: 2, color: INK });
    page.drawText(c(s.label.toUpperCase()), { x, y: y - 18, size: 8, font: f.xbold, color: INK, opacity: 0.8 });
    page.drawText(c(s.value), { x, y: y - 46, size: 24, font: f.black, color: INK });
  });
  y = H - bandH - 32;

  // ── Body ─────────────────────────────────────────────────────────────────
  for (const para of report.intro.split(/\n{2,}/)) {
    text(para, M, 11.5, f.medium, INK);
    y -= 8;
  }

  for (const sec of report.sections) {
    if (!sec.items.length) continue;
    // Keep a section title with at least its first item.
    ensure(70);
    y -= 22;
    text(sec.title.toUpperCase(), M, 17, f.black, INK, COL, 1.2);
    y -= 8;
    page.drawRectangle({ x: M, y, width: COL, height: 2, color: INK });
    y -= 4;

    for (const item of sec.items) {
      const bodies = item.body.split(/\n{2,}/);
      ensure(14 + blockHeight(item.title, 12.5, f.xbold) + (item.tag ? 16 : 0) + Math.min(60, blockHeight(bodies[0], 10.5, f.medium)));
      y -= 14;
      text(item.title, M, 12.5, f.xbold, INK, COL, 1.35);
      if (item.tag) {
        y -= 2;
        text(item.tag.toUpperCase(), M, 8.5, f.xbold, ORANGE, COL, 1.5);
      }
      y -= 4;
      for (const b of bodies) {
        text(b, M, 10.5, f.medium, rgb(0.2, 0.2, 0.2), COL, 1.5);
        y -= 4;
      }
      y -= 8;
      ensure(2);
      page.drawRectangle({ x: M, y, width: COL, height: 1, color: RULE });
    }
  }

  // ── CTA ──────────────────────────────────────────────────────────────────
  const ctaBody = "Book a free call. We'll walk through your results and tell you what we'd fix first. Take the plan and run with it, with or without us. We'll give you better marketing or refer you to someone who can.";
  const ctaH = 28 + 30 + blockHeight(ctaBody, 11.5, f.bold, COL - 48) + 16 + 36 + 28;
  ensure(ctaH + 32);
  y -= 32;
  const ctaTop = y;
  page.drawRectangle({ x: M, y: ctaTop - ctaH, width: COL, height: ctaH, color: ORANGE });
  y -= 28;
  text('WANT US TO FIX IT?', M + 24, 22, f.black, WHITE, COL - 48, 1.2);
  y -= 6;
  text(ctaBody, M + 24, 11.5, f.bold, INK, COL - 48);
  y -= 16;
  const contact = c(`Call ${PHONE}  ·  ${REPLY_TO}`);
  const btnLabel = 'BOOK A FREE CALL';
  const btnW = f.xbold.widthOfTextAtSize(btnLabel, 10) + 40;
  page.drawRectangle({ x: M + 24, y: y - 32, width: btnW, height: 32, color: INK });
  page.drawText(btnLabel, { x: M + 44, y: y - 20, size: 10, font: f.xbold, color: WHITE });
  addLink(doc, page, M + 24, y - 32, btnW, 32, `mailto:${REPLY_TO}?subject=${encodeURIComponent(`Free call about my results (${report.toolName})`)}`);
  page.drawText(contact, { x: M + 24 + btnW + 16, y: y - 20, size: 10, font: f.bold, color: INK });
  addLink(doc, page, M + 24 + btnW + 16, y - 26, f.bold.widthOfTextAtSize(contact, 10), 18, `tel:+1${PHONE.replace(/\D/g, '')}`);
  y = ctaTop - ctaH;

  // ── Footer on every page ─────────────────────────────────────────────────
  const pages = doc.getPages();
  const domain = SITE.replace(/^https?:\/\//, '');
  pages.forEach((p, i) => {
    p.drawRectangle({ x: M, y: M - 4, width: COL, height: 1, color: RULE });
    p.drawText(c('Better marketing for the best businesses.'), { x: M, y: M - 18, size: 8, font: f.xbold, color: INK });
    const right = c(`TAAM Marketing · ${domain} · ${i + 1}/${pages.length}`);
    p.drawText(right, { x: W - M - f.medium.widthOfTextAtSize(right, 8), y: M - 18, size: 8, font: f.medium, color: MUTED });
  });

  return doc.save();
}
