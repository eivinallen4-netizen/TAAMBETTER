import { INTERESTS, parseInterests, type Interest } from './interests';

// Each CRM contact's marketing-plan slides. BASE_DECK is the content of
// public/brand/Base Marketing Plans.pptx; defaultDeckFor() personalizes it from the contact's row,
// and the team's edits are saved on the row (contacts.deck) as just the keys they changed, so
// anything they haven't touched keeps following the contact (new logo, new interests, budget).

export type PlanId = 'starter' | 'growth' | 'premium';

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  tagline: string;
  bullets: string[];
}

export interface InterestCopy {
  headline: string;
  body: string;
  points: string[];
}

export interface DeckData {
  /** Who the deck is for, as printed on the cover. */
  client: string;
  coverLine: string;
  coverNote: string;
  /** "What we heard": their goals in plain words, at most four. */
  goals: string[];
  recommended: PlanId;
  /** Price label after the amount. */
  cadence: string;
  plans: Plan[];
  compare: { label: string; values: [string, string, string] }[];
  /** The service slides shown, in order. */
  interests: Interest[];
  interestCopy: Record<Interest, InterestCopy>;
  bonuses: { term: string; who: string; body: string }[];
  bonusNote: string;
  billing: string[];
  promiseLead: string;
  promiseNote: string;
  promise: string[];
  cta: string;
  /** Slide ids switched off in the editor. */
  hidden: string[];
}

export type DeckOverrides = Partial<DeckData>;

// House rule (CLAUDE.md): one idea per slide, a big headline, at most 3–4 short lines.

// One set of rates, scaled by scope (never discounted): $75 a short, $250 a long-form video.
// Premium is the $3,000 organic package most clients start on; Growth is the $2,500 version.
export const BASE_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 900,
    tagline: 'Try consistent video',
    bullets: ['12 short-form videos', '1 filming day', 'Scripts and ideas'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 2500,
    tagline: 'Filmed, edited and posted',
    bullets: ['30 short-form videos', '1 long-form YouTube video', 'Posted to all 3 platforms'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 3000,
    tagline: 'The full organic package',
    bullets: ['30 short-form videos', '3 long-form YouTube videos', 'Posted to all 3 platforms'],
  },
];

export const BASE_INTEREST_COPY: Record<Interest, InterestCopy> = {
  website: {
    headline: 'A website that sells',
    body: 'Fast, good-looking and built to book.',
    points: ['Designed and built by us', 'Fast on every phone', 'Set up to rank'],
  },
  organic: {
    headline: 'Show up every day',
    body: 'Short videos that keep you top of mind.',
    points: ['Filmed at your location', 'TikTok, Reels and Shorts', 'Reports every cycle'],
  },
  gbp_seo: {
    headline: 'Be the first result',
    body: 'Win the search when locals look for you.',
    points: ['Google Business Profile makeover', 'On-page SEO fixes', 'More reviews'],
  },
  paid_ads: {
    headline: 'Ads that pay off',
    body: 'Our video, your offer, the right people.',
    points: ['Meta and Google ads', 'Creative from your shoots', 'Weekly optimization'],
  },
  branding: {
    headline: 'Look as good as you are',
    body: 'One clear look, everywhere customers see you.',
    points: ['Logo and identity', 'Colors and type', 'Social and print templates'],
  },
};

/** Mascot art for each slide, in the TAAM character style (CLAUDE.md: no other image style). */
export const INTEREST_IMAGES: Record<Interest | 'cover', string> = {
  cover: '/brand/deck/mascot/camera.webp',
  website: '/brand/deck/mascot/laptop.webp',
  organic: '/brand/deck/mascot/ringlight.webp',
  gbp_seo: '/brand/deck/mascot/map-pin.webp',
  paid_ads: '/brand/deck/mascot/megaphone.webp',
  branding: '/brand/deck/mascot/paintbrush.webp',
};

export const BASE_DECK: DeckData = {
  client: 'Your business',
  coverLine: 'Marketing plan',
  coverNote: 'We film, edit and post. You run the business.',
  goals: [],
  recommended: 'premium',
  cadence: '/ 4 weeks',
  plans: BASE_PLANS,
  compare: [
    { label: 'Short-form videos', values: ['12', '30', '30'] },
    { label: 'Long-form YouTube', values: ['—', '1', '3'] },
    { label: 'Filming days', values: ['1', '4', '6'] },
    { label: 'We post for you', values: ['—', '✓', '✓'] },
  ],
  interests: [],
  interestCopy: BASE_INTEREST_COPY,
  bonuses: [
    { term: '3 months', who: 'All plans', body: 'An extra month of marketing.' },
    { term: '6 months', who: 'Growth & Premium', body: 'A 5-page website, built and launched.' },
    { term: '12 months', who: 'All plans', body: 'A full Google Business Profile makeover.' },
  ],
  bonusNote: 'Website: 5-page template, one round of revisions. Hosting and domain are billed to you.',
  billing: ['Billed every 4 weeks', 'Split it into 2-week payments', 'Your billing date never moves'],
  promiseLead: 'Great content, on schedule. Every cycle.',
  promiseNote: "We don't promise a number of leads. No honest agency can.",
  promise: ['On-schedule delivery', 'Reports every cycle', 'Clear pricing, no surprises'],
  cta: "Let's pick your plan.",
  hidden: [],
};

const GOAL_FOR_INTEREST: Record<Interest, string> = {
  website: 'A website that sells',
  organic: 'Show up on social every day',
  gbp_seo: 'Get found on Google',
  paid_ads: 'Ads that bring in leads',
  branding: 'A sharper brand',
};

// The service a challenge already speaks for, so its goal isn't repeated in other words.
const INTEREST_FOR_CHALLENGE: Record<string, Interest> = { website: 'website', social: 'organic', content: 'organic' };

// The talk form's "biggest challenge" (CHALLENGE_OPTIONS in app/lib/cta.ts), as a short goal.
const GOAL_FOR_CHALLENGE: Record<string, string> = {
  leads: 'More leads and sales',
  social: 'Keep up with social media',
  content: 'Better photo and video',
  website: 'A new website',
  marketing: 'Marketing that actually works',
  grow: 'Grow online',
};

export interface DeckContact {
  name?: string | null;
  business_name?: string | null;
  budget?: string | null;
  biggest_challenge?: string | null;
  message?: string | null;
  interests?: string | null;
  interests_suggested?: string | null;
}

/** The plan their budget fits; with no budget, the package most clients start on. */
function recommendFor(budget: string): PlanId {
  if (budget === 'under_1k') return 'starter';
  if (budget === '1k_2_5k') return 'growth';
  return 'premium';
}

/** The contact's interests, or the suggested ones while nobody has picked yet. */
export function contactInterests(c: DeckContact): Interest[] {
  return parseInterests(c.interests || c.interests_suggested || '');
}

/** Their own words: the first sentence or two of what they wrote, skipping tool report summaries. */
function theirWords(message: string): string {
  const text = message
    .replace(/^\[Free tool:[^\]]*\][^\n]*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  const cut = text.match(/^.{12,90}?[.!?](\s|$)/)?.[0]?.trim();
  if (cut) return cut;
  return text.length <= 90 ? text : `${text.slice(0, 87).replace(/\s+\S*$/, '')}…`;
}

export function defaultDeckFor(c: DeckContact): DeckData {
  const interests = contactInterests(c);
  const words = theirWords(c.message ?? '');
  const goals = [
    ...new Set([
      GOAL_FOR_CHALLENGE[c.biggest_challenge ?? ''],
      words && `“${words}”`,
      ...interests.filter((i) => i !== INTEREST_FOR_CHALLENGE[c.biggest_challenge ?? '']).map((i) => GOAL_FOR_INTEREST[i]),
    ]),
  ].filter((g): g is string => Boolean(g));

  return {
    ...BASE_DECK,
    client: (c.business_name || c.name || BASE_DECK.client).trim(),
    goals: goals.length ? goals.slice(0, 4) : ['More of the right customers', 'Content you are proud of', 'Marketing you never chase'],
    recommended: recommendFor(c.budget ?? ''),
    interests,
  };
}

const PLAN_IDS: PlanId[] = ['starter', 'growth', 'premium'];
const MAX_DECK_CHARS = 60_000;

function sameShape(a: unknown, b: unknown): boolean {
  if (Array.isArray(a)) return Array.isArray(b);
  return typeof a === typeof b && a !== null && b !== null && !Array.isArray(b);
}

/** Keeps only overrides that match the deck's shape, so a bad save can't break the slides. */
export function cleanOverrides(value: unknown): DeckOverrides {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    if (!(key in BASE_DECK) || !sameShape((BASE_DECK as unknown as Record<string, unknown>)[key], v)) continue;
    out[key] = v;
  }
  const o = out as DeckOverrides;
  if (o.recommended && !PLAN_IDS.includes(o.recommended)) delete o.recommended;
  if (o.plans && (o.plans.length !== 3 || o.plans.some((p, i) => p?.id !== PLAN_IDS[i] || typeof p.price !== 'number' || !Array.isArray(p.bullets)))) {
    delete o.plans;
  }
  // An empty list means nothing to show, so it falls back to following the contact.
  if (o.interests) o.interests = parseInterests(o.interests);
  if (o.interests && !o.interests.length) delete o.interests;
  if (o.interestCopy) o.interestCopy = { ...BASE_INTEREST_COPY, ...o.interestCopy };
  return o;
}

export function parseOverrides(raw: unknown): DeckOverrides {
  if (typeof raw !== 'string' || !raw || raw.length > MAX_DECK_CHARS) return {};
  try {
    return cleanOverrides(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function serializeOverrides(o: DeckOverrides): string | null {
  const json = JSON.stringify(cleanOverrides(o));
  return json.length > MAX_DECK_CHARS ? null : json;
}

export function resolveDeck(c: DeckContact, overrides: DeckOverrides): DeckData {
  return { ...defaultDeckFor(c), ...overrides };
}

export function money(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

// ---------- Slides ----------

export type SlideId = 'cover' | 'heard' | 'plans' | `interest:${Interest}` | 'compare' | 'bonuses' | 'billing' | 'promise';

export interface SlideRef {
  id: SlideId;
  label: string;
  tone: 'ink' | 'orange';
}

/**
 * Every slide in the deck in order, hidden ones included. Visible slides alternate ink and orange,
 * counted back from the last one, which is always orange.
 */
export function slidesFor(deck: DeckData): (SlideRef & { hidden: boolean })[] {
  const ids: { id: SlideId; label: string }[] = [
    { id: 'cover', label: 'Cover' },
    { id: 'heard', label: 'What we heard' },
    { id: 'plans', label: 'Plans' },
    ...deck.interests.map((i) => ({
      id: `interest:${i}` as SlideId,
      label: INTERESTS.find((x) => x.value === i)!.label,
    })),
    { id: 'compare', label: 'Compare' },
    { id: 'bonuses', label: 'Bonuses' },
    { id: 'billing', label: 'Billing' },
    { id: 'promise', label: 'Promise' },
  ];
  let after = ids.filter((s) => !deck.hidden.includes(s.id)).length;
  return ids.map((s) => {
    const hidden = deck.hidden.includes(s.id);
    if (!hidden) after--;
    const tone: SlideRef['tone'] = after % 2 === 0 ? 'orange' : 'ink';
    return { ...s, tone, hidden };
  });
}
