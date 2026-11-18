// TAAM Call Flow Score: every word, every answer's points, the tiers, and the scoring and routing.
// Ported from the prototype's quiz-data.js. Edit copy here; the /score page, /api/score-lead and the
// emails are all built from this file. No imports, so the scoring tests run with plain Node.

export type PillarId = 'website' | 'google' | 'video' | 'leads' | 'speed' | 'followup' | 'tracking';
export type Route = 'hot' | 'qualified' | 'nurture';

export interface QuizOption {
  value: string;
  label: string;
  rank?: number;
  authority?: 'decision_maker' | 'influencer' | 'researcher';
}

export interface Question {
  id: string;
  label: string;
  q: string;
  help: string;
  options: QuizOption[];
}

export interface Pillar {
  id: PillarId;
  label: string;
  q: string;
  help: string;
  /** Listed best to worst; the page shuffles them. */
  options: { label: string; score: number }[];
  result: {
    headline: string;
    diagnosis: string;
    good: string;
    questions: string[];
    plan: [string, string, string][];
    taam: string;
  };
}

export interface Tier {
  min: number;
  label: string;
  line: string;
}

export interface QuizData {
  config: {
    bookingUrl: string;
    bookingLabel: string;
    bookingNote: string;
    phoneDisplay: string;
    phoneHref: string;
    hotLeadPromise: string;
    videos: Record<PillarId, string>;
    qualifyRevenueRank: number;
  };
  landing: { kicker: string; headline: string; sub: string; button: string; note: string };
  qualifiers: Question[];
  pillars: Pillar[];
  timing: Question;
  tiers: Tier[];
  scoreNote: string;
}

export const QUIZ: QuizData = {
  config: {
    bookingUrl: "https://www.taammarketing.com/c/meet/marketing-strategy",
    bookingLabel: "Book my 30-minute results review",
    bookingNote: "Video call with TAAM. We go through your score and your 90-day plan together.",
    phoneDisplay: "702-997-6813",
    phoneHref: "tel:+17029976813",
    // Shown to hot leads only. Only promise a fast call if someone will actually make it.
    hotLeadPromise: "Someone from TAAM will call you shortly to walk through it.",
    // Optional short video per weak pillar (YouTube/Wistia/Vimeo embed URL). Empty = hidden.
    videos: { website: "", google: "", video: "", leads: "", speed: "", followup: "", tracking: "" },
    qualifyRevenueRank: 2 // $300K+ sees the booking button
  },

  landing: {
    kicker: "Free · 3 minutes · Built for Las Vegas home-service owners",
    headline: "What's the #1 thing keeping your phone from ringing?",
    sub: "Answer 12 quick questions about how customers find you, call you and book you. Get your Call Flow Score, the one gap costing you the most jobs, and a 90-day plan to fix it.",
    button: "Get my Call Flow Score",
    note: "Your score shows the moment you finish. Your plan is yours to keep, whether we ever talk or not."
  },

  qualifiers: [
    {
      id: "revenue", label: "Revenue",
      q: "{name}, about how much did the business bring in over the last 12 months?",
      help: "A rough range is fine. It helps us size the plan to where you are today.",
      options: [
        { value: "starting", label: "Just getting started", rank: 0 },
        { value: "under150", label: "Under $150K", rank: 0 },
        { value: "150-299", label: "$150K–$299K", rank: 1 },
        { value: "300-749", label: "$300K–$749K", rank: 2 },
        { value: "750-1.5m", label: "$750K–$1.5M", rank: 3 },
        { value: "1.5m+", label: "$1.5M+", rank: 4 }
      ]
    },
    {
      id: "team", label: "Team",
      q: "How many people work in the business, including you?",
      help: "Count techs, crew and office, full or part time.",
      options: [
        { value: "solo", label: "Just me" },
        { value: "2-5", label: "2–5" },
        { value: "6-15", label: "6–15" },
        { value: "16+", label: "16 or more" }
      ]
    },
    {
      id: "trade", label: "Trade",
      q: "What kind of work do you do?",
      help: "Pick where most of your revenue comes from.",
      options: [
        { value: "hvac", label: "HVAC" },
        { value: "plumbing", label: "Plumbing" },
        { value: "air-duct", label: "Air duct and dryer vent" },
        { value: "roofing", label: "Roofing" },
        { value: "pool", label: "Pool service" },
        { value: "landscaping", label: "Landscaping" },
        { value: "pressure-washing", label: "Pressure washing" },
        { value: "moving", label: "Moving and junk removal" },
        { value: "cleaning", label: "Cleaning" },
        { value: "other", label: "Other home service" }
      ]
    },
    {
      id: "role", label: "Your role",
      q: "{name}, what's your part in marketing decisions?",
      help: "This helps us match the plan to the calls you can make.",
      options: [
        { value: "owner", label: "Owner: I make the final call", authority: "decision_maker" },
        { value: "partner", label: "Partner: we decide together", authority: "decision_maker" },
        { value: "manager", label: "Office or marketing manager: I help decide", authority: "influencer" },
        { value: "researcher", label: "I'm looking into this for someone else", authority: "researcher" }
      ]
    }
  ],

  // Seven scored pillars. Options are listed best to worst; the page shuffles them.
  pillars: [
    {
      id: "website", label: "Website",
      q: "When someone lands on your website, does it turn them into calls you can count?",
      help: "Think about your call button, forms, and whether you know how many calls come from the site.",
      options: [
        { label: "Yes. Clear offer, tap-to-call on every page, and we count every call and form", score: 100 },
        { label: "It looks good and gets some calls, but we don't track how many", score: 65 },
        { label: "It works, but it's slow, dated or hard to use on a phone", score: 50 },
        { label: "It's a single page or a template we never update", score: 35 },
        { label: "We don't have a real website", score: 20 }
      ],
      result: {
        headline: "Your #1 gap is your website.",
        diagnosis: "People who find you on Google, Instagram or the side of your truck check your site before they call. If it's slow, dated or hard to use on a phone, they call the next company and you never know you lost them.",
        good: "A fast mobile site that says what you do and which parts of the valley you cover, shows your own jobs and reviews, keeps a call button on screen, and counts every call.",
        questions: [
          "How many people visited your site last month, and how many of them called?",
          "Can a customer call you with one tap from every page on their phone?",
          "Does the site show your own crew and jobs, or stock photos?"
        ],
        plan: [
          ["Days 1–30", "Fix the first screen", "Put your service, service area, review count and a call button at the top of every page. Add call tracking so every call is counted."],
          ["Days 31–60", "Add proof", "Swap stock photos for your own jobs and crew. Give each main service its own page."],
          ["Days 61–90", "Build pages that rank", "Add pages for each service and area customers search, then check which pages bring calls."]
        ],
        taam: "TAAM builds websites for Las Vegas service companies that are written to get calls and to show up in Google and AI search."
      }
    },
    {
      id: "google", label: "Google presence",
      q: "When someone in Vegas searches for your main service, do you show up in the map pack?",
      help: "The map pack is the three businesses Google shows on a map above the regular results.",
      options: [
        { label: "Yes, top 3 for our main services, with new reviews every week", score: 100 },
        { label: "We show up for some searches and get reviews now and then", score: 65 },
        { label: "We have a Google Business Profile but rarely touch it", score: 50 },
        { label: "We show up when people search our name, not our services", score: 35 },
        { label: "We don't know, or we don't have a Google Business Profile", score: 20 }
      ],
      result: {
        headline: "Your #1 gap is Google presence.",
        diagnosis: "Most people who need a home service pick from the three businesses Google shows on the map. If you're not there, the customers who are ready to book right now go to someone else.",
        good: "A complete Google Business Profile with new photos every week, new reviews every week, and website pages that match every service you list.",
        questions: [
          "Which three searches matter most to you, and where do you show up for each today?",
          "How many new reviews did you get last month?",
          "When did you last add photos or a post to your profile?"
        ],
        plan: [
          ["Days 1–30", "Clean up the profile", "Fill in every field, choose the right categories, and add 20 or more real photos of your crew, trucks and jobs."],
          ["Days 31–60", "Start a review habit", "Ask every happy customer the same day with a short link by text, and reply to every review."],
          ["Days 61–90", "Post every week", "Add a job photo or short video every week, and make sure your website has a page for each service on your profile."]
        ],
        taam: "TAAM shoots the photos and videos that keep your profile fresh and builds the website pages that back it up."
      }
    },
    {
      id: "video", label: "Video and social",
      q: "Do you post real videos of your crew and your jobs every week?",
      help: "Think about Instagram, TikTok, Facebook and YouTube Shorts.",
      options: [
        { label: "Yes. Several videos a week on a plan, and we know which ones bring calls", score: 100 },
        { label: "We post most weeks, but there's no real plan", score: 65 },
        { label: "We post when someone has time, mostly photos", score: 50 },
        { label: "We posted for a while, then stopped", score: 35 },
        { label: "We don't post at all", score: 20 }
      ],
      result: {
        headline: "Your #1 gap is video and social.",
        diagnosis: "Customers want to see who's coming to their house before they call. Without steady video you look like every other company in the results, and price becomes the only thing they compare.",
        good: "Short videos every week showing your crew, real jobs, before-and-afters and answers to common questions, posted on a schedule where your customers already scroll.",
        questions: [
          "Who on your team could be on camera every week?",
          "Which questions do customers ask on almost every job?",
          "Which post in the last year brought you a call?"
        ],
        plan: [
          ["Days 1–30", "Pick your topics", "List the 20 questions customers ask most and the jobs that look best on camera. Pick one person to be the face."],
          ["Days 31–60", "Film in batches", "Film a month of short videos in one or two sessions and post three to five a week."],
          ["Days 61–90", "Keep what works", "Check which videos brought calls and messages, and film more like them."]
        ],
        taam: "This is TAAM's core service: one Las Vegas team plans, films, edits and posts short videos every month for local service companies."
      }
    },
    {
      id: "leads", label: "Lead flow",
      q: "When the schedule gets light, can you turn on more leads?",
      help: "Can you create more calls on purpose, or do you wait for the phone to ring?",
      options: [
        { label: "Yes. We can raise ad spend and know what each booked job costs", score: 100 },
        { label: "We run ads, but we're not sure what we get for the money", score: 65 },
        { label: "We have a steady source, but we can't grow it on purpose", score: 50 },
        { label: "Most work comes from referrals, repeat customers or a lead service we don't control", score: 35 },
        { label: "No. When it's slow, we wait", score: 20 }
      ],
      result: {
        headline: "Your #1 gap is lead flow.",
        diagnosis: "If you can't turn on more calls when the board gets light, your crew sits and your cash swings with the season. Shared lead services sell the same customer to your competitors too.",
        good: "One or two lead sources you own, like ads to your own site, where you know the cost per call and per booked job and can turn spend up when you need work.",
        questions: [
          "What does a booked job cost you from each source today?",
          "How many calls a week does your crew need to stay full?",
          "Which source would you grow first if you knew it worked?"
        ],
        plan: [
          ["Days 1–30", "Count what you have", "Track every call and form by source for 30 days, and note how many became booked jobs."],
          ["Days 31–60", "Test one source you own", "Run one ad campaign to one service page with one clear message. Fix the page before adding budget."],
          ["Days 61–90", "Turn it up", "Put more budget behind what books jobs at a cost you're happy with, and stop what doesn't."]
        ],
        taam: "TAAM runs ads that point to pages and videos we make, so the ad, the page and the follow-up all match."
      }
    },
    {
      id: "speed", label: "Speed to lead",
      q: "When a new lead calls or fills out a form, how fast do they hear back?",
      help: "Answer for a normal week, not your best day.",
      options: [
        { label: "Within 5 minutes, every time, even after hours", score: 100 },
        { label: "Within the hour during business hours", score: 65 },
        { label: "Same day, usually", score: 50 },
        { label: "When someone gets to it, sometimes the next day", score: 35 },
        { label: "We don't know, and some calls go to voicemail", score: 20 }
      ],
      result: {
        headline: "Your #1 gap is speed to lead.",
        diagnosis: "People who need a home service usually contact more than one company. The first one to answer usually gets the job, so a slow callback means paying for leads a competitor closes.",
        good: "Every call answered or returned within five minutes, an instant text reply to every form and message, and a text back to every missed call.",
        questions: [
          "How many calls went to voicemail last week?",
          "Who answers new leads after 5 p.m. and on weekends?",
          "How long does a web form sit before someone calls?"
        ],
        plan: [
          ["Days 1–30", "Stop the leaks", "Turn on missed-call text back and an instant reply to every form and message."],
          ["Days 31–60", "Give every lead an owner", "Decide who answers new leads at each time of day and set a five-minute rule."],
          ["Days 61–90", "Check it every week", "Look at response time and booked rate weekly and fix the slowest hour first."]
        ],
        taam: "TAAM sets up the forms, instant replies and tracking around your site so no lead sits and waits."
      }
    },
    {
      id: "followup", label: "Follow-up",
      q: "What happens to estimates and quotes that don't book right away?",
      help: "Think about texts, calls and emails after the first visit or quote.",
      options: [
        { label: "Every one gets a set follow-up by text, call and email until they decide", score: 100 },
        { label: "We follow up a couple of times, then let it go", score: 65 },
        { label: "We follow up if someone remembers", score: 50 },
        { label: "We send the quote and wait for them to call", score: 35 },
        { label: "We don't keep track of open quotes", score: 20 }
      ],
      result: {
        headline: "Your #1 gap is follow-up.",
        diagnosis: "Many people who get a quote are still deciding a week later. Without follow-up, the job goes to whoever checks in, even when your work is better.",
        good: "Every open quote has a next step: a text the next day, a call a few days later, and a short video or review sent along the way until the customer says yes or no.",
        questions: [
          "How many open quotes do you have right now, and what are they worth?",
          "What happens on day 2 and day 7 after a quote goes out?",
          "Who owns following up?"
        ],
        plan: [
          ["Days 1–30", "List every open quote", "Put every open quote in one place with the amount and the date it went out."],
          ["Days 31–60", "Write the sequence", "Set a text, call and email for days 1, 3, 7 and 14. Include a short video of your crew and a recent review."],
          ["Days 61–90", "Track how many book", "Count booked quotes every week and change one thing at a time."]
        ],
        taam: "TAAM films the short videos and writes the messages that go into your follow-up, so it sounds like you."
      }
    },
    {
      id: "tracking", label: "Tracking",
      q: "Do you know which of your marketing brings in booked jobs?",
      help: "Think about calls, forms, ads, Google and social.",
      options: [
        { label: "Yes. We track every lead to the job and review it every month", score: 100 },
        { label: "We track leads by source, but not which ones book", score: 65 },
        { label: "We ask customers how they heard about us", score: 50 },
        { label: "We look at likes and views, not calls", score: 35 },
        { label: "No. We guess", score: 20 }
      ],
      result: {
        headline: "Your #1 gap is tracking.",
        diagnosis: "When you can't see which marketing books jobs, you keep paying for what doesn't work and stop what does. Every budget call becomes a guess.",
        good: "Every call and form tagged by source, matched to the job it became, and a one-page report each month showing cost per booked job by channel.",
        questions: [
          "Where did your last 10 booked jobs come from?",
          "What did you spend on marketing last month, by channel?",
          "Which channel would you cut today if you had to?"
        ],
        plan: [
          ["Days 1–30", "Tag every lead", "Add tracking numbers and form tags by source, and ask every caller how they found you."],
          ["Days 31–60", "Match leads to jobs", "Mark each lead as booked or not in one sheet or CRM."],
          ["Days 61–90", "Review it monthly", "Look at cost per booked job by channel each month and move budget to what works."]
        ],
        taam: "TAAM sets up tracking on the videos, pages and ads we make and reports which ones bring calls."
      }
    }
  ],

  timing: {
    id: "timing", label: "Timing",
    q: "{name}, if your 90-day plan makes sense, when would you want to start?",
    help: "This only changes the next step we show you. You get your full plan either way.",
    options: [
      { value: "now", label: "Right away, if the plan makes sense" },
      { value: "30days", label: "Within 30 days" },
      { value: "basics", label: "We'll fix the basics on our own first" },
      { value: "notnow", label: "We're not making changes right now" }
    ]
  },

  tiers: [
    { min: 86, label: "Booked solid", line: "Strong across the board. Your next jobs come from doing more of what already works." },
    { min: 72, label: "Strong, with one gap", line: "Most of your system works. One part is holding the rest back." },
    { min: 56, label: "Leaking calls", line: "Customers are finding you, and some are slipping away before they book." },
    { min: 41, label: "Big gaps", line: "Jobs are getting lost in more than one place. Fix the weakest part first." },
    { min: 0, label: "Starting from the basics", line: "The upside is big: fixing one part changes everything after it." }
  ],
  scoreNote: "Your score is weighted toward your weakest area, because a gap in one place loses calls everywhere after it."
};

// ---------- Scoring and routing (keep exactly) ----------

/** Score: 80% weakest pillar + 20% average of all seven. */
export function scoreQuiz(pillarScores: Record<string, number>): number {
  const vals = Object.values(pillarScores);
  const weakest = Math.min(...vals);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.round(weakest * 0.8 + avg * 0.2);
}

/** hot = qualified + decision maker + starting within 30 days. */
export function routeLead(revenueRank: number, authority: string, timing: string, qualifyRank: number): Route {
  const qualified = revenueRank >= qualifyRank;
  const decides = authority === 'decision_maker';
  const soon = timing === 'now' || timing === '30days';
  if (qualified && decides && soon) return 'hot';
  if (qualified) return 'qualified';
  return 'nurture';
}

export function tierFor(score: number): Tier {
  return QUIZ.tiers.find((t) => score >= t.min) ?? QUIZ.tiers[QUIZ.tiers.length - 1];
}

/** Every answer, as sent by the page. Pillar answers are the index into that pillar's (unshuffled) options. */
export type Answers = Record<string, string>;

export const QUESTION_COUNT = QUIZ.qualifiers.length + QUIZ.pillars.length + 1;

const question = (id: string): Question | undefined => (id === 'timing' ? QUIZ.timing : QUIZ.qualifiers.find((q) => q.id === id));

export function labelOf(id: string, value: string | undefined): string {
  return question(id)?.options.find((o) => o.value === value)?.label ?? '';
}

export function pillarAnswer(p: Pillar, answers: Answers): { label: string; score: number } | null {
  const raw = answers[p.id];
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return null;
  return p.options[Number(raw)] ?? null;
}

/** True when every one of the 12 questions has a valid answer. */
export function isComplete(answers: Answers): boolean {
  const quals = [...QUIZ.qualifiers, QUIZ.timing].every((q) => q.options.some((o) => o.value === answers[q.id]));
  return quals && QUIZ.pillars.every((p) => pillarAnswer(p, answers) !== null);
}

/** Keeps only known question ids with valid answers, so nothing else from the request is trusted. */
export function cleanAnswers(raw: unknown): Answers {
  const out: Answers = {};
  if (!raw || typeof raw !== 'object') return out;
  const input = raw as Record<string, unknown>;
  for (const q of [...QUIZ.qualifiers, QUIZ.timing]) {
    const v = input[q.id];
    if (typeof v === 'string' && q.options.some((o) => o.value === v)) out[q.id] = v;
  }
  for (const p of QUIZ.pillars) {
    const v = input[p.id];
    if (typeof v === 'string' && /^\d+$/.test(v) && p.options[Number(v)]) out[p.id] = v;
  }
  return out;
}

export interface QuizResult {
  pillarScores: Record<PillarId, number>;
  score: number;
  weakest: Pillar;
  weakestScore: number;
  /** The strongest pillar, only when its score is a unique max. */
  strongest: Pillar | null;
  route: Route;
  tier: Tier;
}

/** Scores a finished quiz. Ties for weakest go to the first pillar in quiz order. */
export function computeResult(answers: Answers): QuizResult {
  const pillarScores = {} as Record<PillarId, number>;
  for (const p of QUIZ.pillars) pillarScores[p.id] = pillarAnswer(p, answers)?.score ?? 0;
  const score = scoreQuiz(pillarScores);
  const values = QUIZ.pillars.map((p) => pillarScores[p.id]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const weakest = QUIZ.pillars.find((p) => pillarScores[p.id] === min)!;
  const uniqueMax = values.filter((v) => v === max).length === 1;
  const strongest = uniqueMax ? QUIZ.pillars.find((p) => pillarScores[p.id] === max)! : null;
  const rev = QUIZ.qualifiers[0].options.find((o) => o.value === answers.revenue);
  const role = QUIZ.qualifiers[3].options.find((o) => o.value === answers.role);
  const route = routeLead(rev?.rank ?? -1, role?.authority ?? '', answers.timing ?? '', QUIZ.config.qualifyRevenueRank);
  return { pillarScores, score, weakest, weakestScore: min, strongest, route, tier: tierFor(score) };
}

/** Swaps in the first name, or drops a leading "{name}, " cleanly when there isn't one. */
export function personal(s: string, firstName: string): string {
  const n = firstName.trim();
  return n ? s.replace('{name}', n) : s.replace(/^\{name\},\s*(\w)/, (_, c: string) => c.toUpperCase()).replace('{name}', '');
}

export interface LeadPerson {
  firstName: string;
  lastName: string;
  business: string;
}

/** The brief the caller reads before dialing. */
export function callBrief(person: LeadPerson, answers: Answers, r: QuizResult): string {
  const p = r.weakest;
  const said = pillarAnswer(p, answers)?.label ?? '';
  const role = labelOf('role', answers.role).split(':')[0].toLowerCase();
  const name = `${person.firstName} ${person.lastName}`.trim();
  return (
    `${name}, ${role} at ${person.business} (${labelOf('trade', answers.trade)}, ${labelOf('revenue', answers.revenue)}, ${labelOf('team', answers.team)} people). ` +
    `Call Flow Score ${r.score} (${r.tier.label}). #1 gap: ${p.label} (${r.weakestScore}). They said "${said}". ` +
    `Timing: ${labelOf('timing', answers.timing)}. Open with: "I saw your answer on ${p.label.toLowerCase().replace('google', 'Google')}. ${p.result.questions[0]}"`
  );
}

/** Score line, each pillar's score with the exact answer, then revenue and team. */
export function answerDetails(answers: Answers, r: QuizResult): string {
  return [
    `Score ${r.score}/100 (${r.tier.label}) · Route: ${r.route}`,
    '',
    ...QUIZ.pillars.map((p) => `${p.label}: ${r.pillarScores[p.id]} · "${pillarAnswer(p, answers)?.label ?? ''}"`),
    '',
    `Revenue: ${labelOf('revenue', answers.revenue)}`,
    `Team: ${labelOf('team', answers.team)}`,
  ].join('\n');
}

/** The plan as plain text, for "Copy my plan" and the email. */
export function planText(business: string, r: QuizResult): string {
  const p = r.weakest;
  return [
    `${business ? `${business}: ` : ''}Call Flow Score ${r.score}/100 (${r.tier.label})`,
    '',
    ...QUIZ.pillars.map((x) => `${x.label}: ${r.pillarScores[x.id]}`),
    '',
    p.result.headline,
    p.result.diagnosis,
    '',
    `What good looks like: ${p.result.good}`,
    '',
    'Ask yourself this week:',
    ...p.result.questions.map((q, i) => `${i + 1}. ${q}`),
    '',
    '90-day plan:',
    ...p.result.plan.map(([d, t, x]) => `${d}, ${t}: ${x}`),
    '',
    `TAAM · ${QUIZ.config.phoneDisplay} · taammarketing.com`,
  ].join('\n');
}

// ---------- CRM mapping: quiz answers to the sales-settings values (/admin sales settings) ----------

/** Every trade on the quiz is a home service. */
export const CRM_INDUSTRY = 'home_services';

export const CRM_ROLE: Record<string, string> = {
  owner: 'owner',
  partner: 'owner',
  manager: 'decision_maker',
  researcher: 'staff',
};

export const CRM_TIMELINE: Record<string, string> = {
  now: 'now',
  '30days': '1_3m',
  basics: 'exploring',
  notnow: 'exploring',
};

/**
 * The service tied to each gap. speed, followup and tracking have no exact service in the sales
 * settings, so they map to the closest one: speed → website (forms and instant replies around the
 * site), followup → content (the follow-up videos), tracking → paid_ads (tracking the ads we run).
 */
export const CRM_SERVICE: Record<PillarId, string> = {
  website: 'website',
  google: 'seo',
  video: 'content',
  leads: 'paid_ads',
  speed: 'website',
  followup: 'content',
  tracking: 'paid_ads',
};

/** `?trade=hvac` → the trade option, for one ad per trade. */
export function tradeFromParam(value: string | null | undefined): QuizOption | null {
  if (!value) return null;
  return QUIZ.qualifiers[2].options.find((o) => o.value === value.toLowerCase()) ?? null;
}
