// Shared shapes for the client onboarding flow (/onboarding/[token]) and its admin views.
// Passwords never live in `answers`; they travel separately and are encrypted at rest.

export const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'twitter', label: 'X / Twitter' },
  { key: 'google', label: 'Google Business' },
  { key: 'pinterest', label: 'Pinterest' },
  { key: 'other', label: 'Other' },
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]['key'];

export const WEBSITE_PLATFORMS = ['WordPress', 'Shopify', 'Squarespace', 'Wix', 'Webflow', 'GoDaddy', 'Custom / not sure', 'No website yet'];

// Each link is one kind of onboarding. "full" is the original combined flow; old links keep it.
export const ONBOARDING_KINDS = ['website', 'social'] as const;
export type OnboardingKind = (typeof ONBOARDING_KINDS)[number] | 'full';

export const KIND_LABELS: Record<OnboardingKind, string> = {
  website: 'Website',
  social: 'Social media',
  full: 'Website + social',
};

export function toKind(value: unknown): OnboardingKind {
  return value === 'website' || value === 'social' ? value : 'full';
}

export const REVIEW_PLATFORMS = ['Google', 'Yelp', 'Facebook', 'Tripadvisor', 'Nextdoor', 'Angi', 'Thumbtack', 'Houzz', 'Other'];

export const STEP_LABELS = {
  welcome: 'Welcome',
  business: 'Your business',
  social: 'Social logins',
  website: 'Website',
  services: 'What you offer',
  reviews: 'Reviews',
  review: 'Submit',
} as const;

export type StepKey = keyof typeof STEP_LABELS;

const KIND_STEPS: Record<OnboardingKind, StepKey[]> = {
  website: ['welcome', 'business', 'website', 'services', 'reviews', 'review'],
  social: ['welcome', 'business', 'social', 'services', 'reviews', 'review'],
  full: ['welcome', 'business', 'social', 'website', 'services', 'reviews', 'review'],
};

export function stepsFor(kind: OnboardingKind): { key: StepKey; label: string }[] {
  return KIND_STEPS[kind].map((key) => ({ key, label: STEP_LABELS[key] }));
}

export const ONBOARDING_STATUSES = ['sent', 'opened', 'in_progress', 'submitted', 'complete'] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export const STATUS_LABELS: Record<OnboardingStatus, string> = {
  sent: 'Sent',
  opened: 'Opened',
  in_progress: 'In progress',
  submitted: 'Submitted',
  complete: 'Complete',
};

export interface SocialLogin {
  id: string;
  platform: SocialPlatform;
  /** Custom name when platform is "other". */
  label: string;
  handle: string;
  login: string;
  twoFactor: string;
  notes: string;
}

/** Something the client sells, for their site and posts. */
export interface ServiceItem {
  id: string;
  name: string;
  details: string;
  price: string;
}

export interface ReviewLink {
  id: string;
  platform: string;
  url: string;
}

export interface OnboardingAnswers {
  business: {
    businessName: string;
    contactName: string;
    email: string;
    phone: string;
    bestContact: string;
    industry: string;
  };
  social: SocialLogin[];
  website: {
    currentUrl: string;
    otherLinks: string;
    platform: string;
    domainProvider: string;
    adminUrl: string;
    login: string;
  };
  services: {
    items: ServiceItem[];
    notes: string;
  };
  reviews: {
    links: ReviewLink[];
    favorites: string;
  };
}

/** Key in the password map for the website admin login; social logins use their row id. */
export const WEBSITE_PASSWORD_KEY = 'website';

export type PasswordMap = Record<string, string>;

export function emptyAnswers(seed?: { businessName?: string; contactName?: string; email?: string }): OnboardingAnswers {
  return {
    business: {
      businessName: seed?.businessName ?? '',
      contactName: seed?.contactName ?? '',
      email: seed?.email ?? '',
      phone: '',
      bestContact: '',
      industry: '',
    },
    social: [],
    website: { currentUrl: '', otherLinks: '', platform: '', domainProvider: '', adminUrl: '', login: '' },
    services: { items: [], notes: '' },
    reviews: { links: [], favorites: '' },
  };
}

/** Fill any missing sections so older or partial saves still render. */
export function normalizeAnswers(raw: unknown, seed?: Parameters<typeof emptyAnswers>[0]): OnboardingAnswers {
  const base = emptyAnswers(seed);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<OnboardingAnswers>;
  // Older saves kept what they sell as one free-text "offerings" field.
  const legacyOfferings = (r.services as { offerings?: unknown } | undefined)?.offerings;
  return {
    business: { ...base.business, ...r.business },
    social: Array.isArray(r.social) ? r.social : [],
    website: { ...base.website, ...r.website },
    services: {
      items: Array.isArray(r.services?.items) ? r.services.items : [],
      notes: typeof r.services?.notes === 'string' ? r.services.notes : typeof legacyOfferings === 'string' ? legacyOfferings : '',
    },
    reviews: {
      links: Array.isArray(r.reviews?.links) ? r.reviews.links : [],
      favorites: typeof r.reviews?.favorites === 'string' ? r.reviews.favorites : '',
    },
  };
}

export function platformLabel(login: Pick<SocialLogin, 'platform' | 'label'>): string {
  if (login.platform === 'other') return login.label || 'Other';
  return SOCIAL_PLATFORMS.find((p) => p.key === login.platform)?.label ?? login.platform;
}
