// One place for the legal names and the exact SMS opt-in wording. The privacy policy, the terms and
// every form with a phone field read from here, so what a person agreed to always matches the pages.
import siteContent from '../content/siteContent.json';

export const LEGAL = {
  entity: 'TAAM Marketing LLC',
  /** The business name used on the SMS (10DLC) registration. Must appear on the privacy policy and opt-in. */
  brand: 'TAAM Marketing',
  state: 'Nevada',
  county: 'Clark County',
  site: 'taammarketing.com',
  smsProgram: 'TAAM Marketing Texts',
  updated: 'November 14, 2026',
} as const;

/**
 * Bump the version whenever the SMS wording below changes. It is saved with each opt-in so we can show
 * which wording a person agreed to.
 */
export const SMS_CONSENT_VERSION = '2026-11-14-v2';

/** The message types, matching the use cases on the SMS registration. Shown beside every SMS checkbox. */
export const SMS_MESSAGE_TYPES =
  'replies to inquiries, call scheduling and appointment reminders, project and account updates, and occasional marketing messages about TAAM Marketing services';

/** The checkbox label itself. */
export const SMS_CONSENT_LABEL =
  `Yes, text me. I agree to receive text messages from ${LEGAL.brand} (${LEGAL.entity}) at the phone number I ` +
  'provided. Messages may be sent with automated technology. Consent is not a condition of purchase.';

/** The required disclosures, listed right under the checkbox label. */
export const SMS_DISCLOSURES = [
  { label: 'Message types', text: `${SMS_MESSAGE_TYPES.charAt(0).toUpperCase()}${SMS_MESSAGE_TYPES.slice(1)}.` },
  { label: 'Message frequency', text: 'Message frequency varies based on your inquiry and project.' },
  { label: 'Rates', text: 'Message and data rates may apply.' },
  { label: 'Opt out', text: 'Reply STOP to any message to opt out at any time.' },
  {
    label: 'Help',
    text: `Reply HELP for help, email ${siteContent.contact.email} or call ${siteContent.contact.phone}.`,
  },
] as const;

/** The full wording as one string, for anywhere it has to be plain text. */
export const SMS_CONSENT_TEXT = [
  SMS_CONSENT_LABEL,
  ...SMS_DISCLOSURES.map((d) => `${d.label}: ${d.text}`),
].join(' ');

/** What gets stored with the lead as proof of opt-in: when, where, and which wording. */
export function smsConsentRecord(sourcePage: string): string {
  return `opted in ${new Date().toISOString()} on ${sourcePage || 'website'} (wording ${SMS_CONSENT_VERSION})`;
}
