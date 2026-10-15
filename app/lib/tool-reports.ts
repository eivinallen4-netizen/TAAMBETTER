// Shared, client-safe content for the free tools: the gated fix lists and the math behind them.
// The tool pages render from it, and the server rebuilds the emailed report from it, so the email
// always matches what the visitor unlocked and never carries text a visitor typed in.

import type { CheckStatus, SeoReport, SpeedResult } from './tool-types';

export const usd = (n: number, digits = 0) =>
  Number.isFinite(n) ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: digits, minimumFractionDigits: digits }) : '—';
export const num = (n: number, digits = 0) => (Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: digits }) : '—');

/** A tool result in a shape the email template can render without knowing which tool made it. */
export interface ToolReport {
  slug: string;
  toolName: string;
  /** The tested site, when the tool has one. */
  website?: string;
  headline: string;
  intro: string;
  stats: { label: string; value: string }[];
  sections: { title: string; items: { title: string; tag?: string; body: string }[] }[];
  /** One line for the CRM timeline. */
  summary: string;
}

const fixLabel = (i: number) => `Fix ${String(i + 1).padStart(2, '0')}`;

// ─── Website speed test ──────────────────────────────────────────────────────

// Plain-English versions of the Lighthouse audits that most often show up for small-business sites.
export const SPEED_FIX_NOTES: Record<string, string> = {
  'render-blocking-resources': 'Stylesheets and scripts make the browser wait before showing anything. Load non-critical scripts with defer/async and inline the CSS needed for the top of the page.',
  'render-blocking-insight': 'Stylesheets and scripts make the browser wait before showing anything. Load non-critical scripts with defer/async and inline the CSS needed for the top of the page.',
  'unused-javascript': 'The page downloads code it never runs, often from page-builder add-ons, sliders, chat widgets or tracking tags. Remove plugins you do not use and load the rest only where needed.',
  'unused-css-rules': 'Most of the downloaded CSS is not used on this page. Theme and page-builder stylesheets are the usual culprits.',
  'modern-image-formats': 'Images are in older formats. Serving WebP or AVIF typically cuts image weight by 25–50% with no visible difference.',
  'uses-optimized-images': 'Images are heavier than they need to be. Compress them before uploading or turn on automatic image optimization.',
  'image-delivery-insight': 'Images are larger or heavier than they need to be. Resize them to the size they display at and serve WebP or AVIF.',
  'uses-responsive-images': 'Phones are downloading desktop-sized images. Serve smaller versions to smaller screens.',
  'offscreen-images': 'Images below the fold load straight away. Lazy-load them so the first screen appears sooner.',
  'server-response-time': 'The server is slow to respond before anything loads. Better hosting, page caching or a CDN usually fixes it.',
  'document-latency-insight': 'The server is slow to send the page, or the page redirects first. Caching, better hosting or a CDN usually fixes it.',
  'redirects': 'The page bounces through redirects before loading. Link straight to the final address.',
  'uses-text-compression': 'Text files are sent uncompressed. Turning on gzip or Brotli at the server is usually a one-line change.',
  'uses-long-cache-ttl': 'Returning visitors re-download files that rarely change. Set long cache lifetimes for images, fonts and scripts.',
  'cache-insight': 'Returning visitors re-download files that rarely change. Set long cache lifetimes for images, fonts and scripts.',
  'unminified-javascript': 'Scripts are not minified. Most caching or optimization plugins can do this automatically.',
  'unminified-css': 'Stylesheets are not minified. Most caching or optimization plugins can do this automatically.',
  'legacy-javascript': 'Modern browsers are being sent old-browser code they do not need.',
  'legacy-javascript-insight': 'Modern browsers are being sent old-browser code they do not need.',
  'efficient-animated-content': 'Animated GIFs are very heavy. Replace them with short MP4 or WebM videos.',
  'lcp-lazy-loaded': 'The biggest image at the top of the page is lazy-loaded, which delays it. Load the hero image eagerly.',
  'lcp-discovery-insight': 'The browser finds the main hero image late. Load it eagerly and mark it high priority.',
  'third-party-summary': 'Third-party scripts (chat, tracking, embeds, reviews widgets) are slowing the page. Remove what you do not use and delay the rest until after load.',
  'third-parties-insight': 'Third-party scripts (chat, tracking, embeds, reviews widgets) are slowing the page. Remove what you do not use and delay the rest until after load.',
  'font-display': 'Text stays invisible while custom fonts load. Use font-display: swap.',
  'font-display-insight': 'Text stays invisible while custom fonts load. Use font-display: swap.',
  'bootup-time': 'Scripts take a long time to run on phones. Trim plugins and heavy widgets.',
  'mainthread-work-breakdown': 'The phone is busy processing the page instead of responding to taps. Reduce scripts and page-builder bloat.',
  'dom-size': 'The page has a very large number of elements, common with page builders. Simplify heavy sections.',
  'dom-size-insight': 'The page has a very large number of elements, common with page builders. Simplify heavy sections.',
  'duplicated-javascript': 'The same libraries are loaded more than once, usually by different plugins.',
  'duplicated-javascript-insight': 'The same libraries are loaded more than once, usually by different plugins.',
  'total-byte-weight': 'The page is heavy overall. Compress images and video and remove what is not needed.',
};

export const SPEED_FIX_FALLBACK =
  'Google flagged this as slowing the page down. Ask whoever runs your site to review it, or book a call and we will walk you through it.';

/** What the speed-test page sends for the email: scores and fix ids, never free text beyond Lighthouse titles. */
export interface SpeedEmailInput {
  url: string;
  mobile: Pick<SpeedResult, 'scores' | 'opportunities' | 'fieldVerdict'>;
  desktop: Pick<SpeedResult, 'scores' | 'opportunities' | 'fieldVerdict'>;
}

export function buildSpeedReport(input: SpeedEmailInput): ToolReport {
  const { mobile, desktop } = input;
  const fixes = (r: SpeedEmailInput['mobile']) =>
    r.opportunities.map((o, i) => ({
      title: `${fixLabel(i)} · ${o.title}`,
      tag: o.savings ? `Saves about ${o.savings}` : undefined,
      body: SPEED_FIX_NOTES[o.id] ?? SPEED_FIX_FALLBACK,
    }));
  const verdict = mobile.fieldVerdict === 'FAST' ? 'good' : mobile.fieldVerdict === 'AVERAGE' ? 'needs improvement' : mobile.fieldVerdict === 'SLOW' ? 'poor' : null;
  return {
    slug: 'website-speed-test',
    toolName: 'Website speed test',
    website: input.url,
    headline: `Your mobile speed score is ${mobile.scores.performance}/100.`,
    intro:
      (verdict ? `Real Chrome users rate this site's Core Web Vitals as ${verdict} on mobile. That's the data Google uses for rankings. ` : '') +
      'Below are the fixes slowing the site down, ranked by time saved, with what each one means in plain English.',
    stats: [
      { label: 'Mobile performance', value: `${mobile.scores.performance}` },
      { label: 'Desktop performance', value: `${desktop.scores.performance}` },
      { label: 'SEO', value: `${mobile.scores.seo}` },
      { label: 'Accessibility', value: `${mobile.scores.accessibility}` },
    ],
    sections: [
      { title: 'Mobile fix list', items: fixes(mobile) },
      { title: 'Desktop fix list', items: fixes(desktop) },
    ].filter((s) => s.items.length > 0),
    summary: `Speed test for ${input.url}: mobile ${mobile.scores.performance}/100, desktop ${desktop.scores.performance}/100. Top fixes (mobile): ${mobile.opportunities.slice(0, 4).map((o) => o.title).join('; ') || 'none'}.`,
  };
}

// ─── On-page SEO grader ──────────────────────────────────────────────────────

const STATUS_TAG: Record<CheckStatus, string> = { fail: 'Fix now', warn: 'Worth improving', pass: 'Passed' };

export function sortSeoIssues(report: SeoReport) {
  return report.checks
    .filter((c) => c.status !== 'pass')
    .sort((a, b) => (a.status === b.status ? b.weight - a.weight : a.status === 'fail' ? -1 : 1));
}

export function buildSeoReport(report: SeoReport): ToolReport {
  const issues = sortSeoIssues(report);
  const passed = report.checks.filter((c) => c.status === 'pass');
  return {
    slug: 'seo-grader',
    toolName: 'On-page SEO grader',
    website: report.url,
    headline: `Your page scored ${report.score}/100 for on-page SEO.`,
    intro: `${passed.length} of ${report.checks.length} checks passed. Here's how to fix the rest, biggest ranking lift first. Forward this to whoever runs your site.`,
    stats: [
      { label: 'SEO score', value: `${report.score}` },
      { label: 'Issues found', value: `${issues.length}` },
      { label: 'Checks passed', value: `${passed.length}` },
    ],
    sections: [
      {
        title: 'Your fix list',
        items: issues.map((c, i) => ({ title: `${fixLabel(i)} · ${c.label}`, tag: STATUS_TAG[c.status], body: `What we found: ${c.found}\n\n${c.fix}` })),
      },
      { title: 'What is already working', items: passed.map((c) => ({ title: c.label, body: c.found })) },
    ].filter((s) => s.items.length > 0),
    summary: `SEO score ${report.score}/100 for ${report.url}. Issues: ${issues.map((c) => c.label).join('; ') || 'none'}.`,
  };
}

// ─── Ad budget & lead calculator ─────────────────────────────────────────────

export interface AdInputs {
  budget: number;
  cpc: number;
  conversion: number;
  close: number;
  jobValue: number;
  margin: number;
}

export function projectAds(i: AdInputs) {
  const clicks = i.cpc > 0 ? i.budget / i.cpc : 0;
  const leads = clicks * (i.conversion / 100);
  const customers = leads * (i.close / 100);
  const revenue = customers * i.jobValue;
  const grossProfit = revenue * (i.margin / 100);
  return {
    clicks,
    leads,
    customers,
    revenue,
    cpl: leads > 0 ? i.budget / leads : NaN,
    cpa: customers > 0 ? i.budget / customers : NaN,
    roas: i.budget > 0 ? revenue / i.budget : NaN,
    profit: grossProfit - i.budget,
  };
}

/** The gated plan: unit economics plus three levers run against the visitor's numbers. */
export function adPlan(inputs: AdInputs) {
  const leadValue = inputs.jobValue * (inputs.close / 100);
  const maxCpl = leadValue * (inputs.margin / 100);
  const breakEvenCpc = maxCpl * (inputs.conversion / 100);
  return {
    economics: [
      { k: 'One lead is worth', v: usd(leadValue), d: 'Average job value × close rate, in revenue.' },
      { k: 'Most you can pay per lead', v: usd(maxCpl), d: 'Above this, each lead costs more than it earns after job costs.' },
      { k: 'Break-even cost per click', v: usd(breakEvenCpc, 2), d: 'Clicks cheaper than this make money at your conversion and close rates.' },
    ],
    levers: [
      { label: `Landing page converts at ${num(inputs.conversion + 3, 1)}% instead of ${num(inputs.conversion, 1)}%`, p: projectAds({ ...inputs, conversion: inputs.conversion + 3 }), how: 'Faster page, one clear offer, click-to-call above the fold, reviews next to the form.' },
      { label: `Close rate rises to ${num(Math.min(inputs.close + 10, 100))}%`, p: projectAds({ ...inputs, close: Math.min(inputs.close + 10, 100) }), how: 'Answer leads within five minutes, follow up by text, and qualify with a short form.' },
      { label: `Cost per click drops 20% to ${usd(inputs.cpc * 0.8, 2)}`, p: projectAds({ ...inputs, cpc: inputs.cpc * 0.8 }), how: 'Tighter keywords, negative keywords, ad-to-page message match and a better Quality Score.' },
    ],
  };
}

export function adSummary(inputs: AdInputs) {
  const r = projectAds(inputs);
  return `Ad calculator: ${usd(inputs.budget)}/mo budget, ${usd(inputs.cpc, 2)} CPC, ${inputs.conversion}% conv, ${inputs.close}% close, ${usd(inputs.jobValue)} job value. Result: ${num(r.leads, 1)} leads at ${usd(r.cpl)} CPL, ${num(r.customers, 1)} customers, ${num(r.roas, 1)}x ROAS.`;
}

export function buildAdReport(inputs: AdInputs): ToolReport {
  const r = projectAds(inputs);
  const plan = adPlan(inputs);
  return {
    slug: 'ad-budget-calculator',
    toolName: 'Ad budget & lead calculator',
    headline: Number.isFinite(r.cpl) ? `Your cost per lead: ${usd(r.cpl)}.` : 'Your ad budget plan.',
    intro:
      (r.profit >= 0
        ? `After ad spend and job costs, that's about ${usd(r.profit)} gross profit a month from ads, from ${num(r.clicks)} clicks.`
        : `At these numbers ads lose about ${usd(-r.profit)} a month after job costs. The levers below show which one fixes that fastest.`) +
      ` Based on ${usd(inputs.budget)}/mo budget, ${usd(inputs.cpc, 2)} per click, ${num(inputs.conversion, 1)}% conversion, ${num(inputs.close, 1)}% close rate, ${usd(inputs.jobValue)} average job and ${num(inputs.margin)}% margin.`,
    stats: [
      { label: 'Leads / mo', value: num(r.leads, 1) },
      { label: 'Cost per lead', value: usd(r.cpl) },
      { label: 'New customers / mo', value: num(r.customers, 1) },
      { label: 'Cost per customer', value: usd(r.cpa) },
      { label: 'Revenue / mo', value: usd(r.revenue) },
      { label: 'Return on ad spend', value: Number.isFinite(r.roas) ? `${num(r.roas, 1)}x` : '—' },
    ],
    sections: [
      { title: 'Your unit economics', items: plan.economics.map((e) => ({ title: e.k, tag: e.v, body: e.d })) },
      {
        title: 'Three levers, same budget',
        items: plan.levers.map((l, i) => ({
          title: `0${i + 1} · ${l.label}`,
          tag: `${l.p.revenue - r.revenue >= 0 ? '+' : ''}${usd(l.p.revenue - r.revenue)} revenue / mo`,
          body: `${num(l.p.leads, 1)} leads · ${num(l.p.customers, 1)} customers.\n\n${l.how}`,
        })),
      },
    ],
    summary: adSummary(inputs),
  };
}

// ─── Google Business Profile audit ───────────────────────────────────────────

export type GbpAnswer = 'yes' | 'no' | 'unsure';

export const GBP_QUESTIONS: { id: string; group: string; q: string; weight: number; title: string; fix: string }[] = [
  { id: 'verified', group: 'Basics', weight: 3, title: 'Verify your profile', q: 'Is your profile claimed and verified?', fix: 'Claim and verify the profile at business.google.com. Unverified profiles rank poorly and anyone can suggest edits to them.' },
  { id: 'category', group: 'Basics', weight: 3, title: 'Sharpen your primary category', q: 'Is your primary category the most specific one for what you do?', fix: 'Your primary category is the biggest ranking factor you control. Pick the most specific match ("Pressure washing service", not "Cleaning service"). Look at which category the top three map results in your area use.' },
  { id: 'secondary', group: 'Basics', weight: 1, title: 'Add secondary categories', q: 'Have you added secondary categories for your other services?', fix: 'Add every secondary category that truly applies. Each one lets you show up for another set of searches.' },
  { id: 'name', group: 'Basics', weight: 2, title: 'Clean up your business name', q: 'Does the business name match your real signage, with no extra keywords?', fix: 'Use your real business name. Stuffing in keywords ("Best Plumber Las Vegas") breaks Google\'s guidelines and can get the profile suspended.' },
  { id: 'nap', group: 'Basics', weight: 2, title: 'Match your name, address and phone everywhere', q: 'Do your name, address/service area and phone match your website exactly?', fix: 'Make name, address and phone identical on your profile, website footer and major directories (Yelp, Facebook, BBB). Mismatches erode Google\'s confidence in your details.' },
  { id: 'hours', group: 'Basics', weight: 1, title: 'Set accurate hours', q: 'Are your hours accurate, including holiday hours?', fix: 'Set regular and holiday hours. Google may show you as "Closed" otherwise, and searches with "open now" filter you out.' },
  { id: 'website', group: 'Content', weight: 1, title: 'Point the website link at the right page', q: 'Does the website link go to your most relevant page?', fix: 'Link to your homepage, or to a location page if you have several locations. Add UTM tags so you can see profile traffic in analytics.' },
  { id: 'services', group: 'Content', weight: 2, title: 'List your services', q: 'Have you listed your services or products with descriptions?', fix: 'Add every service with a short description and a starting price where you can. It helps Google match you to specific searches and answers buyer questions up front.' },
  { id: 'description', group: 'Content', weight: 1, title: 'Rewrite your description', q: 'Does your description mention your main services and the area you serve?', fix: 'Use most of the 750 characters: what you do, who for, where, and what makes you different. Write it for people, not for keywords.' },
  { id: 'photos', group: 'Content', weight: 2, title: 'Add real photos', q: 'Do you have at least 10 real photos (team, work, vehicles, location)?', fix: 'Upload real photos of your team, finished jobs, before-and-afters and branded vehicles. Skip stock photos. Profiles with plenty of photos tend to get more calls and direction requests.' },
  { id: 'fresh-photos', group: 'Content', weight: 1, title: 'Keep photos fresh', q: 'Have you added new photos in the last 30 days?', fix: 'Add a few new job photos every week or two. Fresh activity signals an active business to customers and to Google.' },
  { id: 'posts', group: 'Content', weight: 1, title: 'Post updates regularly', q: 'Have you published a Google post in the last 30 days?', fix: 'Post an update, offer or recent project every week or two. Posts show on your profile and give searchers another reason to call.' },
  { id: 'review-count', group: 'Reviews', weight: 3, title: 'Get to 25+ reviews', q: 'Do you have at least 25 Google reviews?', fix: 'Ask every happy customer, every time, with a direct review link sent by text right after the job. Review count is one of the strongest local ranking and trust signals.' },
  { id: 'review-recent', group: 'Reviews', weight: 2, title: 'Keep reviews coming every month', q: 'Did you get a new review in the last 30 days?', fix: 'Recency matters to both rankings and buyers. Build review requests into your job-completion routine so they keep coming every week.' },
  { id: 'rating', group: 'Reviews', weight: 2, title: 'Lift your average rating', q: 'Is your average rating 4.5 or higher?', fix: 'Raise the average by asking more of your happy customers (most never leave one unless asked) and by fixing the issues the negative reviews mention.' },
  { id: 'replies', group: 'Reviews', weight: 2, title: 'Reply to every review', q: 'Do you reply to every review, good and bad?', fix: 'Reply to every review within a few days. Thank the good ones by name and mention the service; answer bad ones calmly with how you made it right. Future customers read the replies.' },
  { id: 'booking', group: 'Reviews', weight: 1, title: 'Make it easy to book or ask for a quote', q: 'Can customers book, request a quote or message you from the profile?', fix: 'Turn on a booking or quote link (and messaging if you can answer quickly). Every extra step between the profile and a lead loses people.' },
];

const GBP_TOTAL = GBP_QUESTIONS.reduce((s, q) => s + q.weight, 0);

export const gbpImpact = (weight: number) => (weight === 3 ? 'High impact' : weight === 2 ? 'Medium impact' : 'Quick win');

export function scoreGbp(answers: Record<string, GbpAnswer>) {
  const score = Math.round((GBP_QUESTIONS.reduce((s, q) => s + (answers[q.id] === 'yes' ? q.weight : 0), 0) / GBP_TOTAL) * 100);
  const gaps = GBP_QUESTIONS.filter((q) => answers[q.id] && answers[q.id] !== 'yes').sort((a, b) => b.weight - a.weight);
  return { score, gaps };
}

export function buildGbpReport(answers: Record<string, GbpAnswer>): ToolReport {
  const { score, gaps } = scoreGbp(answers);
  const done = GBP_QUESTIONS.filter((q) => answers[q.id] === 'yes').length;
  return {
    slug: 'google-business-profile-audit',
    toolName: 'Google Business Profile audit',
    headline: `Your Google Business Profile scored ${score}/100.`,
    intro: `You're doing ${done} of ${GBP_QUESTIONS.length} things right. Here are the ${gaps.length} gaps costing you calls, ranked by impact, with exactly what to change.`,
    stats: [
      { label: 'Profile score', value: `${score}` },
      { label: 'Gaps found', value: `${gaps.length}` },
      { label: 'Done right', value: `${done}` },
    ],
    sections: [
      { title: 'Your fix list', items: gaps.map((g, i) => ({ title: `${fixLabel(i)} · ${g.title}`, tag: gbpImpact(g.weight), body: g.fix })) },
      {
        title: 'Keep it working',
        items: [
          {
            title: 'A 10-minute weekly routine',
            body: 'Text a review link to every customer you finished a job for this week. Reply to every new review. Upload 2–3 new job photos. Every other week, publish a Google post about a recent project or offer.',
          },
        ],
      },
    ].filter((s) => s.items.length > 0),
    summary: `GBP audit score ${score}/100. Gaps: ${gaps.map((g) => g.id).join(', ') || 'none'}.`,
  };
}
