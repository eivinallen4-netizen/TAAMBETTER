// Shapes returned by the free-tool APIs (app/api/tools/*), shared with their client pages.

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface SeoCheck {
  id: string;
  label: string;
  status: CheckStatus;
  /** What we found, shown free. */
  found: string;
  /** Why it matters and how to fix it, unlocked by email. */
  fix: string;
  weight: number;
}

export interface SeoReport {
  url: string;
  score: number;
  checks: SeoCheck[];
}

export interface SpeedMetric {
  id: string;
  label: string;
  display: string;
  /** Lighthouse 0–1 score for the metric. */
  score: number | null;
}

export interface SpeedOpportunity {
  id: string;
  title: string;
  /** Estimated time saved, e.g. "1.2 s". */
  savings: string | null;
  savingsMs: number;
}

export interface SpeedResult {
  /** 0–100 Lighthouse category scores. */
  scores: { performance: number; accessibility: number; bestPractices: number; seo: number };
  metrics: SpeedMetric[];
  opportunities: SpeedOpportunity[];
  /** Real-user Core Web Vitals verdict from the Chrome UX Report, when Google has enough traffic data. */
  fieldVerdict: 'FAST' | 'AVERAGE' | 'SLOW' | null;
}

export interface SpeedReport {
  url: string;
  mobile: SpeedResult;
  desktop: SpeedResult;
}
