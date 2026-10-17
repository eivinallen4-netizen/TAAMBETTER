// What a contact wants from TAAM, as the five buttons on their CRM page. Leads arrive with these
// filled in from wherever they came from (free tool, talk form answers, the page, their message),
// and the team can switch them on or off by hand. Stored on the row as a comma list.

export const INTERESTS = [
  { value: 'website', label: 'Website', short: 'Web' },
  { value: 'organic', label: 'Organic marketing', short: 'Organic' },
  { value: 'gbp_seo', label: 'Google Business / SEO', short: 'GBP/SEO' },
  { value: 'paid_ads', label: 'Paid ads', short: 'Ads' },
  { value: 'branding', label: 'Branding', short: 'Brand' },
] as const;

export type Interest = (typeof INTERESTS)[number]['value'];

const KNOWN = new Set<string>(INTERESTS.map((i) => i.value));

/** A comma list (or array) cut down to known interests, in button order. */
export function parseInterests(value: unknown): Interest[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const picked = new Set(raw.map((v) => String(v).trim()).filter((v) => KNOWN.has(v)));
  return INTERESTS.map((i) => i.value).filter((v) => picked.has(v));
}

export const joinInterests = (list: readonly string[]) => parseInterests([...list]).join(', ');

// Free tools by slug (see app/lib/tools.ts).
const TOOL_INTERESTS: Record<string, Interest[]> = {
  'website-speed-test': ['website'],
  'serp-preview': ['website', 'gbp_seo'],
  'seo-grader': ['website', 'gbp_seo'],
  'google-business-profile-audit': ['gbp_seo'],
  'ad-budget-calculator': ['paid_ads'],
};

// The talk form's older service codes (SERVICE_OPTIONS in app/lib/cta.ts).
const SERVICE_INTERESTS: Record<string, Interest[]> = {
  website_dev: ['website'],
  social_media: ['organic'],
  photo_video: ['organic'],
  content_creation: ['organic'],
  branding: ['branding'],
  marketing_mgmt: ['organic', 'paid_ads'],
};

// The talk form's "biggest challenge" answer (CHALLENGE_OPTIONS).
const CHALLENGE_INTERESTS: Record<string, Interest[]> = {
  website: ['website'],
  social: ['organic'],
  content: ['organic'],
  grow: ['organic'],
  marketing: ['organic'],
  leads: ['organic', 'paid_ads'],
};

const PAGE_INTERESTS: { match: RegExp; interests: Interest[] }[] = [
  { match: /free-video|social-media|video|content/i, interests: ['organic'] },
  { match: /web|site|intake/i, interests: ['website'] },
  { match: /brand/i, interests: ['branding'] },
  { match: /seo|google/i, interests: ['gbp_seo'] },
  { match: /ads?\b|ppc/i, interests: ['paid_ads'] },
];

const TEXT_INTERESTS: { match: RegExp; interests: Interest[] }[] = [
  {
    match: /\b(web ?site|web ?page|landing page|redesign|shopify|wordpress|squarespace|wix)\b/i,
    interests: ['website'],
  },
  {
    match: /\b(video|tiktok|reels?|shorts|youtube|instagram|social|content|posting|followers|ugc)\b/i,
    interests: ['organic'],
  },
  {
    match: /\b(seo|google business|gbp|google maps|map pack|reviews?|rank(ing)?|search results?)\b/i,
    interests: ['gbp_seo'],
  },
  {
    match: /\b(ads?|ppc|paid (ads|advertising|social|search)|advertis(e|ing)|meta ads|facebook ads|google ads|ad spend|campaigns?)\b/i,
    interests: ['paid_ads'],
  },
  {
    match: /\b(logo|brand(ing)?|rebrand|identity|packaging)\b/i,
    interests: ['branding'],
  },
];

export interface InterestSignals {
  source_page?: string | null;
  services_interested?: string | null;
  biggest_challenge?: string | null;
  message?: string | null;
}

/** Every interest the lead's own data points to. */
export function inferInterests(c: InterestSignals): Interest[] {
  const found: Interest[] = [];
  const page = (c.source_page ?? '').trim();

  const tool = /^\/tools\/([^/?#]+)/.exec(page)?.[1];
  if (tool) found.push(...(TOOL_INTERESTS[tool] ?? []));
  else if (page && page !== '/') for (const p of PAGE_INTERESTS) if (p.match.test(page)) found.push(...p.interests);

  for (const s of (c.services_interested ?? '').split(',')) found.push(...(SERVICE_INTERESTS[s.trim()] ?? []));
  found.push(...(CHALLENGE_INTERESTS[(c.biggest_challenge ?? '').trim()] ?? []));

  // Free tools put a summary of the report in the message; only read what the person wrote.
  const text = `${c.message ?? ''}`.replace(/^\[Free tool:[^\]]*\][^\n]*$/gm, '');
  for (const t of TEXT_INTERESTS) if (t.match.test(text)) found.push(...t.interests);

  return parseInterests(found);
}

/** Where the auto-filled interests came from, for the caption under the buttons. */
export function interestSource(c: InterestSignals): string {
  const tool = /^\/tools\/([^/?#]+)/.exec(c.source_page ?? '')?.[1];
  if (tool) return `the ${tool.replace(/-/g, ' ')} tool`;
  if (c.biggest_challenge || c.services_interested) return 'the talk form';
  if (c.source_page) return c.source_page;
  return 'their message';
}
