// One place for the legal names and the exact SMS opt-in wording. The privacy policy, the terms and
// every form with a phone field read from here, so what a person agreed to always matches the pages.

export const LEGAL = {
  entity: 'TAAM Media LLC',
  brand: 'TAAM',
  state: 'Nevada',
  county: 'Clark County',
  site: 'taammarketing.com',
  smsProgram: 'TAAM Texts',
  updated: 'November 11, 2026',
} as const;

/**
 * Bump the version whenever SMS_CONSENT_TEXT changes. It is saved with each opt-in so we can show
 * which wording a person agreed to.
 */
export const SMS_CONSENT_VERSION = '2026-11-11';

export const SMS_CONSENT_TEXT =
  'Yes, text me. I agree to receive text messages from TAAM (TAAM Media LLC) at the number I gave, ' +
  'including replies about my request, call scheduling and reminders, and occasional offers. Messages may be ' +
  'sent with automated technology. Consent is not a condition of buying anything. Message frequency varies. ' +
  'Msg & data rates may apply. Reply STOP to opt out, HELP for help.';

/** What gets stored with the lead as proof of opt-in: when, where, and which wording. */
export function smsConsentRecord(sourcePage: string): string {
  return `opted in ${new Date().toISOString()} on ${sourcePage || 'website'} (wording ${SMS_CONSENT_VERSION})`;
}
