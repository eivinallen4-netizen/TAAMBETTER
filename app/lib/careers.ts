import type { MascotPose } from '@/components/editorial/Mascot';

export interface CareerRole {
  slug: string;
  title: string;
  /** Poster headline for the role page, lines split by "\n". */
  headline: string;
  /** One line for the careers list and meta description. */
  summary: string;
  pose: MascotPose;
  location: string;
  type: string;
  /** Pay line shown on the page and the job boards. */
  pay: string;
  experience: string;
  /** What the job is, day to day. */
  work: string[];
  /** What you already have to walk in with. */
  bring: string[];
  /** What we ask for on the application, so they know what to have ready. */
  linkLabel: string;
  proofLabel: string;
  proofPlaceholder: string;
}

// Every role is senior: we don't have a training program yet, so we hire people who already do the job well.
export const CAREER_ROLES: CareerRole[] = [
  {
    slug: 'closer',
    title: 'Closer',
    headline: 'Senior\ncloser.',
    summary: 'Run the video calls our setters book and turn the right businesses into clients.',
    pose: 'money-gun',
    location: 'Las Vegas, NV · Hybrid',
    type: 'Full time',
    pay: 'Commission only. High-ticket deals, strong commission.',
    experience: '3+ years closing',
    work: [
      'Run discovery and sales calls with business owners our setters book.',
      'Turn a goal into a clear scope, at our rates, and close it on the call or the follow-up.',
      'Tell the wrong fits no, and refer them to someone who can help.',
      'Keep every deal and next step up to date in our CRM.',
    ],
    bring: [
      '3+ years closing high-ticket services: agency, marketing, B2B or similar.',
      'Numbers you can show us: close rate, deal size, monthly revenue closed.',
      'You sell on value. You hold the price and change the scope, never the rate.',
      'You can run a call with no script and no one to hand it to.',
    ],
    linkLabel: 'LinkedIn',
    proofLabel: 'Your closing numbers',
    proofPlaceholder: 'Close rate, average deal size, revenue closed per month, and what you sold.',
  },
  {
    slug: 'appointment-setter',
    title: 'Appointment Setter',
    headline: 'Senior\nappointment\nsetter.',
    summary: 'Call Las Vegas businesses, start real conversations and book qualified calls for the closer.',
    pose: 'phone',
    location: 'Las Vegas, NV · Hybrid',
    type: 'Full time',
    pay: 'Commission only. High-ticket deals, strong commission.',
    experience: '2+ years setting',
    work: [
      'Cold call and follow up with local businesses from our lead lists.',
      'Qualify on the call: open, making sales, and a goal we can move.',
      'Book video calls straight onto the closer’s calendar.',
      'Log every call and outcome in our dialer and CRM.',
    ],
    bring: [
      '2+ years of outbound setting or SDR work, phone first.',
      'A daily dial and booking rate you can show us.',
      'You hear no all day and it doesn’t slow you down.',
      'You book calls that show up and fit, not just calls that fill a calendar.',
    ],
    linkLabel: 'LinkedIn',
    proofLabel: 'Your setting numbers',
    proofPlaceholder: 'Dials per day, conversations, appointments booked per week, show rate, and what you set for.',
  },
  {
    slug: 'videographer',
    title: 'Videographer',
    headline: 'Senior\nvideographer.',
    summary: 'Shoot and cut the short-form and long-form video our clients’ customers say WOW to.',
    pose: 'famous',
    location: 'Las Vegas, NV · On-site',
    type: 'Full time',
    pay: 'Starts at $20/hr, raise reviewed after about a month based on your work.',
    experience: '3+ years shooting',
    work: [
      'Plan and film shoots on location at client businesses around Las Vegas.',
      'Shoot and edit 30 shorts and 3 long-form videos a month per client.',
      'Write hooks and cuts that stop the scroll and keep people watching.',
      'Run a shoot day yourself, from setup to talking a nervous owner through a take.',
    ],
    bring: [
      '3+ years shooting and editing professionally: clients, brands or a channel.',
      'A reel with short-form work that performed, and the numbers behind it.',
      'Your own camera, audio and lighting kit, and a fast edit workflow.',
      'Taste. You know why a short works, not just how to make one.',
    ],
    linkLabel: 'Reel or portfolio link',
    proofLabel: 'About your reel',
    proofPlaceholder: 'What’s on the reel, what you shot vs. edited, and the views or results it got.',
  },
];

export const EXPERIENCE_OPTIONS = [
  { value: '2-3', label: '2–3 years' },
  { value: '3-5', label: '3–5 years' },
  { value: '5-10', label: '5–10 years' },
  { value: '10+', label: '10+ years' },
] as const;

export function getRole(slug: string): CareerRole | undefined {
  return CAREER_ROLES.find((r) => r.slug === slug);
}
