// Switches for the Call Flow Score (/score). Server-only: read from env so they can be changed in
// Vercel without a code change.
//   SCORE_ALERT_EMAIL   comma-separated addresses that get a hot-lead alert. Defaults to the TAAM
//                       inbox; set it to "off" to stop alerts (the results page then stops promising
//                       a fast call).
//   SCORE_PLAN_EMAIL    "on" to email each lead their plan after the phone step. Off by default.
// Both need RESEND_API_KEY, the same email setup the CRM and the free tools use.

export const SCORE_SOURCE = 'Call Flow Score';

const DEFAULT_ALERT_EMAIL = 'info@taammarketing.com';

/** Who gets hot-lead alerts, or [] when alerts are off or email isn't set up. */
export function scoreAlertRecipients(): string[] {
  if (!process.env.RESEND_API_KEY) return [];
  const raw = (process.env.SCORE_ALERT_EMAIL ?? '').trim();
  if (raw.toLowerCase() === 'off') return [];
  return (raw || DEFAULT_ALERT_EMAIL).split(',').map((s) => s.trim()).filter(Boolean);
}

export function scoreAlertsOn(): boolean {
  return scoreAlertRecipients().length > 0;
}

export function scorePlanEmailOn(): boolean {
  return process.env.SCORE_PLAN_EMAIL === 'on' && Boolean(process.env.RESEND_API_KEY);
}
