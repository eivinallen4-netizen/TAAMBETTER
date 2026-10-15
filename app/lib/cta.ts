export interface ChallengeOption {
  value: string;
  icon: string;
  label: string;
}

export interface ServiceOption {
  value: string;
  label: string;
}

export const CHALLENGE_OPTIONS: ChallengeOption[] = [
  { value: 'leads', icon: 'TrendingDown', label: 'Not Getting Enough Leads or Sales' },
  { value: 'social', icon: 'Smartphone', label: 'Struggling to Keep Up with Social Media' },
  { value: 'content', icon: 'Video', label: 'Need Better Photo & Video Content' },
  { value: 'website', icon: 'Globe', label: 'Need a New Website or Website Redesign' },
  { value: 'marketing', icon: 'BarChart3', label: "My Marketing Isn't Producing Results" },
  { value: 'grow', icon: 'Rocket', label: 'I Want to Grow My Business Online' },
  { value: 'unsure', icon: 'HelpCircle', label: "I'm Not Sure — I'd Like Expert Advice" },
];

export const SERVICE_OPTIONS: ServiceOption[] = [
  { value: 'social_media', label: 'Social Media Marketing' },
  { value: 'photo_video', label: 'Photography & Videography' },
  { value: 'website_dev', label: 'Website Development' },
  { value: 'content_creation', label: 'Content Creation' },
  { value: 'branding', label: 'Branding' },
  { value: 'marketing_mgmt', label: 'Monthly Marketing Management' },
];

// Step 1 answer -> the Step 2 service that logically maps to it, pre-checked (not required) to reduce friction.
export const CHALLENGE_TO_SERVICE: Record<string, string> = {
  leads: 'marketing_mgmt',
  social: 'social_media',
  content: 'photo_video',
  website: 'website_dev',
  marketing: 'marketing_mgmt',
  grow: 'social_media',
};

// Maps a project/service category to the service option(s) it implies, for pre-filling the
// intake form when a visitor clicks a contextual CTA (e.g. from a photography project page).
const CATEGORY_TO_SERVICES: { match: RegExp; services: string[] }[] = [
  { match: /photo|video|content/i, services: ['photo_video', 'content_creation'] },
  { match: /web design|website|digital development/i, services: ['website_dev'] },
  { match: /brand/i, services: ['branding'] },
  { match: /social/i, services: ['social_media'] },
  { match: /creative strategy|marketing/i, services: ['marketing_mgmt'] },
];

export function getServicesForCategory(category?: string): string[] {
  if (!category) return [];
  const found = CATEGORY_TO_SERVICES.find((entry) => entry.match.test(category));
  return found ? found.services : [];
}

// Contextual CTA copy: what the button says depends on where it lives, not one fixed label.
const CATEGORY_TO_CTA: { match: RegExp; label: string }[] = [
  { match: /photo|video|content/i, label: 'Get Your Photos & Video' },
  { match: /web design|website|digital development/i, label: 'Get Your Website' },
  { match: /brand/i, label: 'Get Your Brand' },
  { match: /social/i, label: 'Get Your Social Strategy' },
  { match: /creative strategy|marketing/i, label: 'Get Your Marketing Plan' },
];

export function getCtaCopy(category?: string): string {
  if (!category) return 'Get Free Recommendations';
  const found = CATEGORY_TO_CTA.find((entry) => entry.match.test(category));
  return found ? found.label : 'Get Free Recommendations';
}

// ---------- Lead qualification ----------
// Asked before contact details so the team can see fit at a glance, and so visitors who aren't
// ready yet get pointed somewhere useful instead of a sales call. Tune the ranges and the rules in
// scoreLeadFit() to match real pricing.

export interface QualifierOption {
  value: string;
  label: string;
}

export const INDUSTRY_OPTIONS: QualifierOption[] = [
  { value: 'home_services', label: 'Trades & home services' },
  { value: 'real_estate', label: 'Real estate' },
  { value: 'food_hospitality', label: 'Restaurant & hospitality' },
  { value: 'health_wellness', label: 'Health, beauty & wellness' },
  { value: 'professional', label: 'Professional services' },
  { value: 'retail_ecom', label: 'Retail & e-commerce' },
  { value: 'other', label: 'Something else' },
];

export const STAGE_OPTIONS: QualifierOption[] = [
  { value: 'pre_launch', label: 'Not open yet' },
  { value: 'under_1y', label: 'Less than a year' },
  { value: '1_3y', label: '1–3 years' },
  { value: '3y_plus', label: '3+ years' },
];

// Who's filling it in. 'vendor' is someone pitching TAAM, not a buyer — the form turns them away and
// the API files them as not-a-lead. 'staff' can't sign off, so they cap at a possible fit.
export const ROLE_OPTIONS: QualifierOption[] = [
  { value: 'owner', label: "I'm the owner" },
  { value: 'decision_maker', label: 'I run marketing / sign off on spend' },
  { value: 'staff', label: 'I work there — someone else decides' },
  { value: 'vendor', label: "I'm pitching a service to TAAM" },
];

export const BUDGET_OPTIONS: QualifierOption[] = [
  { value: 'under_1k', label: 'Under $1,000 / mo' },
  { value: '1k_2_5k', label: '$1,000 – $2,500 / mo' },
  { value: '2_5k_5k', label: '$2,500 – $5,000 / mo' },
  { value: '5k_plus', label: '$5,000+ / mo' },
  { value: 'unsure', label: 'Not sure yet' },
];

export const TIMELINE_OPTIONS: QualifierOption[] = [
  { value: 'now', label: 'Right away' },
  { value: '1_3m', label: 'In the next 1–3 months' },
  { value: 'exploring', label: 'Just exploring' },
];

export type LeadFit = 'strong' | 'possible' | 'early' | 'not_a_lead';

export const LEAD_FIT_LABELS: Record<LeadFit, string> = {
  strong: 'Strong fit',
  possible: 'Possible fit',
  early: 'Too early',
  not_a_lead: 'Not a lead (vendor/spam)',
};

export function scoreLeadFit({
  stage,
  budget,
  timeline,
  role,
}: {
  stage?: string;
  budget?: string;
  timeline?: string;
  role?: string;
}): LeadFit {
  if (role === 'vendor') return 'not_a_lead';
  if (stage === 'pre_launch' || budget === 'under_1k') return 'early';
  const readyBudget = budget === '2_5k_5k' || budget === '5k_plus';
  const readySoon = timeline === 'now' || timeline === '1_3m';
  if (readyBudget && readySoon && stage !== 'under_1y' && role !== 'staff') return 'strong';
  return 'possible';
}

export function optionLabel(options: QualifierOption[], value?: string | null): string {
  return options.find((o) => o.value === value)?.label ?? value ?? '';
}

// ---------- Fake-lead filters ----------
// Shared by the form (inline errors) and the API (final say).

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com', '10minutemail.com',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'throwawaymail.com', 'yopmail.com', 'getnada.com',
  'trashmail.com', 'dispostable.com', 'maildrop.cc', 'fakeinbox.com', 'mintemail.com', 'emailondeck.com',
  'mohmal.com', 'tempail.com', 'burnermail.io', 'spamgourmet.com', 'mailnesia.com', 'tempr.email',
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1] ?? '';
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

/** 10+ digits, and not an obvious junk number like 0000000000 or 1234567890. */
export function isPlausiblePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return false;
  const last10 = digits.slice(-10);
  if (/^(\d)\1+$/.test(last10)) return false;
  if ('01234567890'.includes(last10) || '9876543210'.includes(last10)) return false;
  return true;
}

/** Below this, a completed 4-step form was filled by a script, not a person. */
export const MIN_HUMAN_FILL_MS = 6000;
