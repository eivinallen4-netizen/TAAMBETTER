// Copy for the in-person website sales slides (/admin/website-deck).
// Change the wording or numbers here; the slides read straight from it.
// Pricing rule (CLAUDE.md): no discount language, no struck prices. Bonuses are things we add.

/** Days from kickoff to a live page. Used in the guarantee, so keep it a number you can hit. */
export const LAUNCH_DAYS = 14;

export const PAIN = {
  kicker: 'Sound familiar?',
  headline: ['Paying for leads that', 'never pick up?'] as [string, string],
  line: 'You pay Thumbtack or Yelp for the lead. You call. Nobody answers.',
};

export interface CaseStudy {
  id: string;
  client: string;
  url: string;
  /** Headline: the plain part, then the part drawn in outline type. */
  headline: [string, string];
  lines: string[];
  desktop: string;
  phone: string;
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'movers',
    client: 'Movers and Junk Removal',
    url: 'moversandjunkremoval.net',
    headline: ['Qualified leads', 'up 150%'],
    lines: [
      'Before: every lead came from Thumbtack and Yelp, and most never picked up.',
      'Now: they show up in Google search and get their own leads.',
      'Fewer repeat questions. Fewer wasted calls.',
    ],
    desktop: '/brand/deck/sites/movers-desktop.webp',
    phone: '/brand/deck/sites/movers-phone.webp',
  },
  {
    id: 'hvac',
    client: 'Wave Heating and Cooling',
    url: 'waveheatingandcooling.com',
    headline: ['They call', 'ready to book'],
    lines: ['More qualified leads.', 'Customers already know what they want.', 'Plus organic marketing, run by TAAM.'],
    desktop: '/brand/deck/sites/hvac-desktop.webp',
    phone: '/brand/deck/sites/hvac-phone.webp',
  },
];

export const OFFER = {
  name: 'The Phone-Ringer Page',
  price: '$750',
  anchor: 'One extra job a month pays for it.',
  points: ['A page built to make your phone ring', 'On-page SEO so Google finds you', 'Connected to your tools, ready for your ads'],
  guarantee: `Live in ${LAUNCH_DAYS} days, or we keep working at no extra charge until it is.`,
};

export const BONUSES = [
  { name: 'Competitor Teardown', body: 'We study who you’re up against before we design a thing.' },
  { name: 'Your Domain, Handled', body: 'Domain included and set up for you.' },
  { name: 'Google Profile Makeover', body: 'No Google Business Profile? We set it up, photos included.' },
];

export const OWNERSHIP = {
  kicker: 'A full marketing agency',
  headline: ['You own', 'all of it'] as [string, string],
  lines: [
    'The site, the graphics and the photos are yours to keep.',
    'Custom graphics and icons, made for your business.',
    'Need pictures? We come out and take them.',
  ],
};

export const CARE_PLAN = {
  kicker: 'After launch, you never touch it',
  price: '$150',
  per: 'a month',
  points: ['Text us a change. We make it.', 'Bugs fixed for you', '24/7 support'],
  // These slides set the appointment; the close happens on the call.
  cta: 'Book your website call',
};

export type WebsiteSlideId = 'pain' | `case:${string}` | 'offer' | 'bonuses' | 'own' | 'care';

export interface WebsiteSlideRef {
  id: WebsiteSlideId;
  label: string;
  tone: 'ink' | 'orange';
}

/** Ink / orange alternating, ending on orange. */
export function websiteSlides(): WebsiteSlideRef[] {
  const list: Omit<WebsiteSlideRef, 'tone'>[] = [
    { id: 'pain', label: 'The problem' },
    ...CASE_STUDIES.map((c) => ({ id: `case:${c.id}` as const, label: c.client })),
    { id: 'offer', label: `${OFFER.name} ${OFFER.price}` },
    { id: 'bonuses', label: 'Bonuses' },
    { id: 'own', label: 'You own all of it' },
    { id: 'care', label: `${CARE_PLAN.price} ${CARE_PLAN.per}` },
  ];
  return list.map((s, i) => ({ ...s, tone: (list.length - 1 - i) % 2 === 0 ? 'orange' : 'ink' }));
}
