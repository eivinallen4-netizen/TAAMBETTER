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
