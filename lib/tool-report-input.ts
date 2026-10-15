import { normalizeUrl } from '@/lib/safe-fetch';
import { gradePage } from '@/lib/seo-grade';
import {
  buildAdReport,
  buildGbpReport,
  buildSeoReport,
  buildSpeedReport,
  GBP_QUESTIONS,
  SPEED_FIX_NOTES,
  type AdInputs,
  type GbpAnswer,
  type SpeedEmailInput,
  type ToolReport,
} from '@/app/lib/tool-reports';

// Turns the `report` payload a tool page sends with a lead into the report we email. Everything is
// rebuilt or whitelisted server-side, so the endpoint can't be used to mail arbitrary text to strangers.

type Raw = Record<string, unknown>;

const obj = (v: unknown): Raw => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : {});
const clampNum = (v: unknown, min: number, max: number) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
};
const plain = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[<>\r\n]/g, '').trim().slice(0, max) : '');

function speedSide(raw: unknown): SpeedEmailInput['mobile'] {
  const r = obj(raw);
  const s = obj(r.scores);
  const score = (k: string) => Math.round(clampNum(s[k], 0, 100));
  const opportunities = (Array.isArray(r.opportunities) ? r.opportunities : [])
    .slice(0, 8)
    .map(obj)
    // Only audits we know: their advice is ours, and the title is Google's audit name.
    .filter((o) => typeof o.id === 'string' && o.id in SPEED_FIX_NOTES)
    .map((o) => {
      const savingsMs = Math.round(clampNum(o.savingsMs, 0, 120_000));
      return { id: o.id as string, title: plain(o.title, 120) || 'Speed improvement', savingsMs, savings: savingsMs >= 50 ? `${(savingsMs / 1000).toFixed(1)} s` : null };
    });
  const verdict = r.fieldVerdict === 'FAST' || r.fieldVerdict === 'AVERAGE' || r.fieldVerdict === 'SLOW' ? r.fieldVerdict : null;
  return {
    scores: { performance: score('performance'), accessibility: score('accessibility'), bestPractices: score('bestPractices'), seo: score('seo') },
    opportunities,
    fieldVerdict: verdict,
  };
}

/** Returns null when the payload can't produce a report (the lead is still saved). */
export async function resolveToolReport(slug: string, payload: unknown): Promise<ToolReport | null> {
  const p = obj(payload);
  switch (slug) {
    case 'seo-grader': {
      if (typeof p.url !== 'string') return null;
      return buildSeoReport(await gradePage(p.url));
    }
    case 'website-speed-test': {
      if (typeof p.url !== 'string') return null;
      return buildSpeedReport({ url: normalizeUrl(p.url).toString(),mobile: speedSide(p.mobile), desktop: speedSide(p.desktop) });
    }
    case 'ad-budget-calculator': {
      const inputs: AdInputs = {
        budget: clampNum(p.budget, 0, 10_000_000),
        cpc: clampNum(p.cpc, 0, 10_000),
        conversion: clampNum(p.conversion, 0, 100),
        close: clampNum(p.close, 0, 100),
        jobValue: clampNum(p.jobValue, 0, 100_000_000),
        margin: clampNum(p.margin, 0, 100),
      };
      return buildAdReport(inputs);
    }
    case 'google-business-profile-audit': {
      const answers: Record<string, GbpAnswer> = {};
      for (const q of GBP_QUESTIONS) {
        const a = p[q.id];
        if (a === 'yes' || a === 'no' || a === 'unsure') answers[q.id] = a;
      }
      return Object.keys(answers).length ? buildGbpReport(answers) : null;
    }
    default:
      return null;
  }
}
