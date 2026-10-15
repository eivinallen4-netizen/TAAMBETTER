import { fetchPublicPage, normalizeUrl } from '@/lib/safe-fetch';
import type { SeoCheck, SeoReport } from '@/app/lib/tool-types';

// On-page SEO grading for /tools/seo-grader. Shared by the grader API and the emailed report, which
// re-grades the page server-side so the email only ever contains our own findings.

/** Thrown when the page answers with an HTTP error. */
export class PageStatusError extends Error {
  constructor(public status: number) {
    super(`That page returned an error (${status}). Check the address and try again.`);
  }
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? decode(m[1] ?? m[2] ?? m[3] ?? '') : null;
}

function decode(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

function innerText(html: string): string {
  return decode(html.replace(/<[^>]+>/g, ' '));
}

function grade(html: string, finalUrl: string): SeoCheck[] {
  const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0] ?? html;
  const body = html.match(/<body[\s\S]*<\/body>/i)?.[0] ?? html;
  const visible = body.replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ');

  const metas = new Map<string, string>();
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (attr(tag, 'name') ?? attr(tag, 'property'))?.toLowerCase();
    const content = attr(tag, 'content');
    if (key && content !== null && !metas.has(key)) metas.set(key, content);
  }

  const title = innerText(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const description = metas.get('description') ?? '';
  const h1s = (visible.match(/<h1\b[\s\S]*?<\/h1>/gi) ?? []).map(innerText).filter(Boolean);
  const h2s = (visible.match(/<h2\b[\s\S]*?<\/h2>/gi) ?? []).map(innerText).filter(Boolean);
  const imgs = visible.match(/<img\b[^>]*>/gi) ?? [];
  const missingAlt = imgs.filter((tag) => attr(tag, 'alt') === null).length;
  const words = innerText(visible).split(' ').filter((w) => /[a-z0-9]/i.test(w)).length;
  const canonicalTag = (head.match(/<link\b[^>]*>/gi) ?? []).find((t) => attr(t, 'rel')?.toLowerCase() === 'canonical');
  const canonical = canonicalTag ? attr(canonicalTag, 'href') : null;
  const schemaTypes = new Set<string>();
  for (const block of html.match(/<script[^>]+application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) ?? []) {
    for (const m of block.matchAll(/"@type"\s*:\s*"([^"]+)"/g)) schemaTypes.add(m[1]);
  }
  if (/itemtype\s*=\s*["']https?:\/\/schema\.org\//i.test(html)) schemaTypes.add('Microdata');
  const viewport = metas.get('viewport') ?? '';
  const robots = (metas.get('robots') ?? '').toLowerCase();
  const lang = attr(html.match(/<html\b[^>]*>/i)?.[0] ?? '', 'lang');

  const checks: SeoCheck[] = [];
  const add = (c: SeoCheck) => checks.push(c);

  add({
    id: 'indexable',
    label: 'Page can be indexed',
    weight: 3,
    status: robots.includes('noindex') ? 'fail' : 'pass',
    found: robots.includes('noindex') ? 'A robots meta tag tells Google not to index this page.' : 'No noindex tag found.',
    fix: robots.includes('noindex')
      ? 'Remove "noindex" from the robots meta tag (often a leftover setting from a staging site or a "discourage search engines" checkbox). Until it is gone, this page cannot rank for anything.'
      : 'Nothing to do. Google is allowed to index this page.',
  });

  add({
    id: 'https',
    label: 'Secure connection (HTTPS)',
    weight: 2,
    status: finalUrl.startsWith('https://') ? 'pass' : 'fail',
    found: finalUrl.startsWith('https://') ? 'The page loads over HTTPS.' : 'The page loads over plain HTTP.',
    fix: finalUrl.startsWith('https://')
      ? 'Nothing to do. Browsers show the page as secure.'
      : 'Install an SSL certificate (most hosts include one free) and redirect every http:// address to https://. Chrome labels HTTP pages "Not secure", which costs trust and clicks.',
  });

  add({
    id: 'title',
    label: 'Title tag',
    weight: 3,
    status: !title ? 'fail' : title.length < 30 || title.length > 60 ? 'warn' : 'pass',
    found: title ? `"${title}" (${title.length} characters)` : 'No title tag found.',
    fix: !title
      ? 'Add a <title> tag. It is the blue headline in Google results and the strongest on-page ranking signal. Lead with the service and city, then the brand: "Pressure Washing in Las Vegas | Brand".'
      : title.length > 60
        ? 'Shorten the title to about 50–60 characters so Google does not cut it off. Put the main keyword first and the brand name last.'
        : title.length < 30
          ? 'The title is short enough that it wastes space. Add the main service and location, aiming for 50–60 characters.'
          : 'Good length. Make sure it leads with what the page is about and what someone would search for.',
  });

  add({
    id: 'description',
    label: 'Meta description',
    weight: 2,
    status: !description ? 'fail' : description.length < 70 || description.length > 160 ? 'warn' : 'pass',
    found: description ? `${description.length} characters: "${description.slice(0, 120)}${description.length > 120 ? '…' : ''}"` : 'No meta description found.',
    fix: !description
      ? 'Add a meta description of 140–160 characters. Google often uses it as the grey text under your result. Treat it like ad copy: the benefit, a proof point, and a reason to click.'
      : description.length > 160
        ? 'Trim the description to 160 characters or less so the end (usually the call to action) is not cut off.'
        : description.length < 70
          ? 'Expand the description to 140–160 characters. Short descriptions are often replaced by whatever text Google picks from the page.'
          : 'Good length. Check it reads like an ad, with a clear reason to click.',
  });

  add({
    id: 'h1',
    label: 'One clear H1 heading',
    weight: 2,
    status: h1s.length === 1 ? 'pass' : h1s.length === 0 ? 'fail' : 'warn',
    found: h1s.length === 0 ? 'No H1 heading found.' : h1s.length === 1 ? `"${h1s[0].slice(0, 90)}"` : `${h1s.length} H1 headings found.`,
    fix:
      h1s.length === 1
        ? 'Good. Make sure the H1 says what the page offers in words a customer would search for.'
        : h1s.length === 0
          ? 'Add one H1 heading near the top that names the service and, for local businesses, the area you serve. Logos and sliders often push the real heading out of the H1.'
          : 'Use a single H1 for the page topic and turn the others into H2s. Several H1s blur what the page is about.',
  });

  add({
    id: 'h2',
    label: 'Subheadings (H2) structure the page',
    weight: 1,
    status: h2s.length >= 2 ? 'pass' : h2s.length === 1 ? 'warn' : 'fail',
    found: h2s.length ? `${h2s.length} H2 subheading${h2s.length === 1 ? '' : 's'} found.` : 'No H2 subheadings found.',
    fix:
      h2s.length >= 2
        ? 'Good. Subheadings that match real questions ("How much does X cost?") can win featured snippets.'
        : 'Break the page into sections with H2 subheadings: services, process, pricing, FAQs, areas served. Each one is another chance to match a search.',
  });

  const altShare = imgs.length ? missingAlt / imgs.length : 0;
  add({
    id: 'alt',
    label: 'Image alt text',
    weight: 1,
    status: imgs.length === 0 || missingAlt === 0 ? 'pass' : altShare > 0.3 ? 'fail' : 'warn',
    found: imgs.length === 0 ? 'No images found.' : `${missingAlt} of ${imgs.length} images are missing alt text.`,
    fix:
      missingAlt === 0
        ? 'Good. Every image has alt text.'
        : 'Add a short, literal description to every meaningful image ("Technician pressure washing a driveway in Henderson"). It helps image search, screen readers, and Google understand the page. Decorative images can use alt="".',
  });

  add({
    id: 'words',
    label: 'Enough content to rank',
    weight: 2,
    status: words >= 300 ? 'pass' : words >= 150 ? 'warn' : 'fail',
    found: `About ${words.toLocaleString()} words of visible text.`,
    fix:
      words >= 300
        ? 'Good. Keep it useful: answer the questions customers ask before they call.'
        : 'Thin pages rarely rank. Aim for at least 300–600 words that answer real questions: what you do, where, how much, how long, and why you. Image-only or video-only sections give Google nothing to read.',
  });

  add({
    id: 'canonical',
    label: 'Canonical tag',
    weight: 1,
    status: canonical ? 'pass' : 'warn',
    found: canonical ? canonical : 'No canonical tag found.',
    fix: canonical
      ? 'Good. Make sure it points to the version of the URL you want to rank.'
      : 'Add <link rel="canonical" href="..."> pointing to the preferred URL. It stops duplicates (www vs non-www, tracking parameters) from splitting your ranking signals.',
  });

  add({
    id: 'schema',
    label: 'Schema markup',
    weight: 2,
    status: schemaTypes.size ? 'pass' : 'fail',
    found: schemaTypes.size ? `Found: ${[...schemaTypes].slice(0, 6).join(', ')}` : 'No structured data found.',
    fix: schemaTypes.size
      ? 'Good. Local businesses should also have LocalBusiness (with address, hours and phone) and FAQ or Review schema where it fits.'
      : 'Add JSON-LD structured data. For local businesses, LocalBusiness schema with your name, address, phone and hours helps Google trust your details; FAQ and Review schema can earn richer results.',
  });

  add({
    id: 'viewport',
    label: 'Mobile-friendly viewport',
    weight: 2,
    status: viewport.includes('width=device-width') ? 'pass' : 'fail',
    found: viewport ? `viewport: ${viewport}` : 'No viewport meta tag found.',
    fix: viewport.includes('width=device-width')
      ? 'Good. The page is set up to scale on phones.'
      : 'Add <meta name="viewport" content="width=device-width, initial-scale=1">. Without it, phones show a zoomed-out desktop page, and Google ranks the mobile version first.',
  });

  const og = ['og:title', 'og:description', 'og:image'].filter((k) => metas.has(k));
  add({
    id: 'opengraph',
    label: 'Social sharing preview (Open Graph)',
    weight: 1,
    status: og.length === 3 ? 'pass' : og.length ? 'warn' : 'fail',
    found: og.length ? `${og.length} of 3 key tags present (${og.join(', ')}).` : 'No Open Graph tags found.',
    fix:
      og.length === 3
        ? 'Good. Links to this page will show a proper title and image when shared.'
        : 'Add og:title, og:description and og:image (1200×630). Without them, links shared on Facebook, LinkedIn or in texts show a blank or random preview, which gets fewer clicks.',
  });

  add({
    id: 'lang',
    label: 'Language declared',
    weight: 1,
    status: lang ? 'pass' : 'warn',
    found: lang ? `lang="${lang}"` : 'No lang attribute on the <html> tag.',
    fix: lang ? 'Good.' : 'Add lang="en" (or your language) to the <html> tag. It helps search engines and screen readers.',
  });

  return checks;
}

export async function gradePage(input: string): Promise<SeoReport> {
  const page = await fetchPublicPage(normalizeUrl(input));
  if (page.status >= 400) throw new PageStatusError(page.status);
  const checks = grade(page.html, page.finalUrl);
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.reduce((s, c) => s + c.weight * (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0), 0);
  return { url: page.finalUrl, score: Math.round((earned / total) * 100), checks };
}
