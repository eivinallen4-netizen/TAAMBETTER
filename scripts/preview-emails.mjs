// Renders every TAAM email to .email-previews/*.html (plus an index) so they can be checked in a
// browser before they go out. Run: node scripts/preview-emails.mjs
import { createJiti } from 'jiti';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Point image URLs at /public so previews show assets that aren't deployed yet.
if (process.argv.includes('--local-assets')) process.env.NEXT_PUBLIC_SITE_URL = 'file:///' + root.split(path.sep).join('/') + '/public';
const jiti = createJiti(import.meta.url, { alias: { '@': root } });

const { renderCrmEmail, renderOnboardingReceivedEmail } = await jiti.import(path.join(root, 'lib/crm-email.ts'));
const { renderBrandEmail } = await jiti.import(path.join(root, 'lib/brand-email.ts'));
const { renderToolEmail } = await jiti.import(path.join(root, 'lib/tool-email.ts'));
const { buildAdReport, buildGbpReport, GBP_QUESTIONS } = await jiti.import(path.join(root, 'app/lib/tool-reports.ts'));
const { renderCrmPackageEmail } = await jiti.import(path.join(root, 'lib/crm-site/email-template.ts'));

// Samples of what @taam/crm hands to crm.ts `email.render`.
const pkg = (kind, subject, heading, paragraphs, button, note) => ({ subject, html: renderCrmPackageEmail({ kind, subject, heading, paragraphs, button, note }) });

const base = { firstName: 'Maria', businessName: 'Desert Shine Detailing', when: '', title: '', note: '' };
const note = 'Great talking today. Send over anything you want us to look at before we start.';

const emails = {
  'website-onboarding': renderCrmEmail({ ...base, type: 'website_onboarding', link: 'https://www.taammarketing.com/onboarding/abc123', note }),
  'social-onboarding': renderCrmEmail({ ...base, type: 'social_onboarding', link: 'https://www.taammarketing.com/social-media-onboarding/abc123' }),
  zoom: renderCrmEmail({ ...base, type: 'zoom', link: 'https://zoom.us/j/123456789', when: 'Tue Nov 18, 2pm PT', title: 'Strategy call' }),
  link: renderCrmEmail({ ...base, type: 'link', link: 'https://www.taammarketing.com/c/proposal', title: 'Your proposal', when: 'Open the proposal', note }),
  'onboarding-received': renderOnboardingReceivedEmail('Maria', 'Desert Shine Detailing', true),
  'career-application': renderBrandEmail({
    preheader: 'Jordan Lee applied for Video editor',
    eyebrow: 'New application',
    title: 'Video editor applicant',
    body: 'Jordan Lee applied for the senior video editor role.\n\nCut 400+ shorts for local service brands; two hit 1M views.\n\nWhy TAAM: I want to work on real businesses.',
    mascot: 'wave',
    details: [['Experience', '5+ years'], ['Email', 'jordan@example.com'], ['Phone', '702-555-0100'], ['Link', 'https://example.com/reel']],
    footer: 'Sent from the careers page on taammarketing.com.',
  }),
  'crm-booking-confirmed': pkg('booking_confirmed', 'Confirmed: Strategy call with TAAM', "You're booked", ['Strategy call, Tuesday Nov 18 at 2:00 PM PT (30 minutes).', 'A calendar invite is attached.'], { label: 'Manage booking', url: 'https://www.taammarketing.com/c/b/abc' }, 'Need a different time? Use the link to reschedule or cancel.'),
  'crm-booking-host': pkg('booking_host_new', 'New booking: Jordan Lee, Strategy call', 'Jordan Lee booked Strategy call', ['Tuesday Nov 18 at 2:00 PM PT.\njordan@example.com · 702-555-0100'], { label: 'Open in CRM', url: 'https://www.taammarketing.com/admin/bookings/1' }),
  'crm-esign-request': pkg('esign_request', 'Please sign: Service agreement', 'Service agreement', ['TAAM sent you a document to sign. It takes about a minute.'], { label: 'Review and sign', url: 'https://www.taammarketing.com/c/sign/abc' }),
  'crm-sign-in-code': pkg('sign_in_code', 'Your TAAM sign-in code', 'Your code: 482 913', ['Enter this code to sign in. It works for 10 minutes.']),
  'tool-ad-report': renderToolEmail(buildAdReport({ budget: 2000, cpc: 4.5, conversion: 8, close: 30, jobValue: 600, margin: 50 }), 'Maria', true),
  'tool-gbp-report': renderToolEmail(
    buildGbpReport(Object.fromEntries(GBP_QUESTIONS.map((q, i) => [q.id, i % 3 ? 'yes' : 'no']))),
    'Maria'
  ),
};

const out = path.join(root, '.email-previews');
mkdirSync(out, { recursive: true });
for (const [name, e] of Object.entries(emails)) writeFileSync(path.join(out, `${name}.html`), e.html);
writeFileSync(
  path.join(out, 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>Email previews</title><body style="margin:0;background:#222;font-family:sans-serif;color:#fff">
${Object.entries(emails)
  .map(([name, e]) => `<section style="display:inline-block;vertical-align:top;margin:16px"><p style="margin:0 0 8px"><b>${name}</b><br><small>${e.subject ?? ''}</small></p>
<iframe src="${name}.html" style="width:640px;height:1400px;border:0;background:#111"></iframe>
<iframe src="${name}.html" style="width:375px;height:1400px;border:0;background:#111;margin-left:12px"></iframe></section>`)
  .join('\n')}`
);
console.log(`Wrote ${Object.keys(emails).length} previews to ${out}`);
