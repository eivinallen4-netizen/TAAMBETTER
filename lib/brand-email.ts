// The TAAM email system: one shell (real wordmark, orange hero card, poster sign-off) that every
// email goes out in, the pieces the CRM and free-tool emails build with, and the Resend call.
// Table layout and inline styles only, for Gmail and Outlook. Images live in /public/email.

export const ORANGE = '#F46325';
export const INK = '#111111';
export const RULE = '#2d2d2d';
export const MUTED = '#b3b3b3';
export const FONT = "Montserrat, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.taammarketing.com').replace(/\/$/, '');
export const REPLY_TO = process.env.TOOL_EMAIL_REPLY_TO || 'info@taammarketing.com';
export const PHONE = '702-997-6813';
const TEL = `tel:+1${PHONE.replace(/\D/g, '')}`;

// Inboxes can't reach localhost, so images always come from a public host.
const ASSETS = /localhost|127\.0\.0\.1/.test(SITE) ? 'https://www.taammarketing.com' : SITE;
const asset = (file: string) => `${ASSETS}/email/${file}`;

/** TAAM characters, pre-sized in /public/email. */
export type Mascot = 'wave' | 'phone' | 'counting';

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export const paragraphs = (text: string, style: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;${style}">${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');

/** Small all-caps label. */
export const eyebrow = (text: string, color: string) =>
  `<div style="font:800 11px/1.4 ${FONT};letter-spacing:.16em;text-transform:uppercase;color:${color};">${esc(text)}</div>`;

/** Pill button: ink on orange cards, orange on ink. */
export function button(label: string, url: string, on: 'orange' | 'ink' = 'orange'): string {
  const bg = on === 'orange' ? INK : ORANGE;
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${bg};border-radius:999px;">
    <a href="${esc(url)}" style="display:inline-block;padding:19px 30px;font:800 14px/1 ${FONT};letter-spacing:.12em;text-transform:uppercase;color:#fff;text-decoration:none;border-radius:999px;">${esc(label)}&nbsp;&#8599;</a>
  </td></tr></table>`;
}

/**
 * The orange hero card: eyebrow pill and mascot on top, the big white headline, then `inner`
 * (trusted HTML built from the helpers here).
 */
export function heroCard(o: { eyebrow: string; title: string; mascot?: Mascot; inner: string }): string {
  const mascot = o.mascot
    ? `<td width="96" align="right" valign="top" style="width:96px;"><img src="${asset(`${o.mascot}.png`)}" width="96" height="96" alt="" style="display:block;width:96px;height:96px;border:0;"></td>`
    : '';
  return `<tr><td class="px" style="padding:0 20px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${ORANGE};border-radius:24px;">
  <tr><td class="card" style="padding:32px 32px 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td valign="top" style="padding-top:6px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border:2px solid ${INK};border-radius:999px;padding:7px 14px;">${eyebrow(o.eyebrow, INK)}</td></tr></table>
      </td>${mascot}
    </tr></table>
    <h1 class="h1" style="margin:${o.mascot ? '8px' : '24px'} 0 20px;font:900 44px/1 ${FONT};letter-spacing:-.01em;text-transform:uppercase;color:#fff;">${esc(o.title)}</h1>
    ${o.inner}
  </td></tr></table>
</td></tr>`;
}

/** Label / value rows, ruled in ink, for inside an orange card. */
export function detailRows(rows: [string, string][]): string {
  const live = rows.filter(([, v]) => v.trim());
  if (!live.length) return '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">${live
    .map(
      ([k, v]) => `<tr>
        <td valign="top" style="padding:14px 16px 14px 0;border-top:2px solid ${INK};font:800 11px/1.5 ${FONT};letter-spacing:.14em;text-transform:uppercase;color:${INK};white-space:nowrap;">${esc(k)}</td>
        <td valign="top" style="padding:14px 0;border-top:2px solid ${INK};font:800 16px/1.4 ${FONT};color:${INK};word-break:break-word;">${esc(v)}</td>
      </tr>`
    )
    .join('')}</table>`;
}

/** A content row on the ink page, lined up with the text inside the card. */
export const inkRow = (html: string, top = 40) => `<tr><td class="px2" style="padding:${top}px 52px 0;">${html}</td></tr>`;

/**
 * The page around every email: the real TAAM wordmark on top, the content rows, then the poster
 * sign-off. `rows` is trusted HTML (<tr>s); `footer` is plain text saying why they got this.
 */
export function emailShell(o: { title: string; preheader: string; rows: string; footer: string }): string {
  const site = SITE.replace(/^https?:\/\//, '');
  const pill = (label: string, href: string) =>
    `<td style="border:2px solid #fff;border-radius:999px;"><a href="${href}" style="display:inline-block;padding:12px 18px;font:800 11px/1 ${FONT};letter-spacing:.14em;text-transform:uppercase;color:#fff;text-decoration:none;">${label}</a></td>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${esc(o.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  @media (max-width: 520px) {
    .px { padding-left: 10px !important; padding-right: 10px !important; }
    .px2 { padding-left: 28px !important; padding-right: 28px !important; }
    .card { padding: 26px 22px 30px !important; }
    .h1 { font-size: 34px !important; }
    .sign { font-size: 30px !important; }
    .stat { font-size: 28px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${INK};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(o.preheader)}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};">
<tr><td align="center" style="padding:0 0 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:${INK};">

  <tr><td style="height:6px;line-height:6px;font-size:0;background:${ORANGE};">&nbsp;</td></tr>
  <tr><td class="px2" style="padding:32px 52px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td valign="middle"><a href="${SITE}" style="text-decoration:none;"><img src="${asset('taam-wordmark-white.png')}" width="128" height="32" alt="TAAM" style="display:block;width:128px;height:32px;border:0;color:#fff;font:900 28px/1 ${FONT};"></a></td>
      <td valign="middle" align="right" style="font:800 10px/1.4 ${FONT};letter-spacing:.18em;text-transform:uppercase;color:${MUTED};">Las Vegas&nbsp;·&nbsp;NV</td>
    </tr></table>
  </td></tr>

  ${o.rows}

  <tr><td class="px2" style="padding:56px 52px 0;">
    <div class="sign" style="font:900 38px/1 ${FONT};letter-spacing:-.01em;text-transform:uppercase;color:#fff;">Better marketing for the <span style="color:${ORANGE};">best</span> businesses.</div>
  </td></tr>
  <tr><td class="px2" style="padding:24px 52px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      ${pill('Reply', `mailto:${REPLY_TO}`)}
      <td width="8" style="width:8px;"></td>
      ${pill(PHONE, TEL)}
    </tr></table>
  </td></tr>
  <tr><td class="px2" style="padding:40px 52px 0;"><div style="border-top:2px solid ${RULE};font-size:0;line-height:0;">&nbsp;</div></td></tr>
  <tr><td class="px2" style="padding:20px 52px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="40" valign="top" style="width:40px;padding-top:2px;"><img src="${asset('taam-mark-orange.png')}" width="28" height="28" alt="" style="display:block;width:28px;height:28px;border:0;"></td>
      <td valign="top" style="font:500 12px/1.6 ${FONT};color:${MUTED};">${esc(o.footer)}<br>TAAM Marketing · Las Vegas, NV · <a href="${SITE}" style="color:${MUTED};">${esc(site)}</a></td>
    </tr></table>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

export interface BrandEmail {
  /** Inbox preview line. */
  preheader: string;
  /** Small caps line above the headline, e.g. "Website onboarding". */
  eyebrow: string;
  /** Big all-caps headline in the orange card. */
  title: string;
  /** Plain text; blank lines start new paragraphs. */
  body: string;
  /** The TAAM character in the corner of the card. */
  mascot?: Mascot;
  cta?: { label: string; url: string };
  /** Label/value rows under the button, e.g. When / Where. */
  details?: [string, string][];
  /** A personal note from the team, shown in its own block. */
  note?: string;
  /** Small print at the bottom: why they got this. */
  footer: string;
}

export function renderBrandEmail(e: BrandEmail): { html: string; text: string } {
  const details = (e.details ?? []).filter(([, v]) => v.trim());

  const rows = [
    heroCard({
      eyebrow: e.eyebrow,
      title: e.title,
      mascot: e.mascot,
      inner: [
        paragraphs(e.body, `font:600 17px/1.55 ${FONT};color:${INK};`),
        e.cta ? `<div style="padding-top:10px;">${button(e.cta.label, e.cta.url)}</div>` : '',
        detailRows(details),
      ].join(''),
    }),
    e.note
      ? inkRow(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="4" style="width:4px;background:${ORANGE};border-radius:4px;"></td>
          <td style="padding:2px 0 2px 20px;">
            <div style="padding-bottom:10px;">${eyebrow('A note from the team', ORANGE)}</div>
            ${paragraphs(e.note, `font:500 16px/1.65 ${FONT};color:#e6e6e6;`)}
          </td></tr></table>`)
      : '',
    e.cta
      ? inkRow(
          `<p style="margin:0;font:500 12px/1.6 ${FONT};color:${MUTED};">Button not working? Paste this into your browser:<br><a href="${esc(e.cta.url)}" style="color:${ORANGE};word-break:break-all;">${esc(e.cta.url)}</a></p>`,
          e.note ? 28 : 32
        )
      : '',
  ].join('');

  const html = emailShell({ title: e.title, preheader: e.preheader, rows, footer: e.footer });

  const text = [
    e.title,
    '',
    e.body,
    e.cta ? `\n${e.cta.label}: ${e.cta.url}` : '',
    ...details.map(([k, v]) => `${k}: ${v}`),
    e.note ? `\nA note from the team:\n${e.note}` : '',
    '',
    `Questions? Just reply, or call ${PHONE}.`,
    `Better marketing for the best businesses. ${SITE}`,
  ]
    .filter((l, i, a) => !(l === '' && a[i - 1] === ''))
    .join('\n');

  return { html, text };
}

/** Sends through Resend. Throws with a readable message so the CRM can show why it didn't go. */
export async function sendBrandEmail(opts: { to: string; subject: string; html: string; text: string; tag: string }): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('Email is not set up yet (RESEND_API_KEY is missing)');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.CRM_EMAIL_FROM || process.env.TOOL_EMAIL_FROM || 'TAAM <hello@taammarketing.com>',
      to: [opts.to],
      reply_to: REPLY_TO,
      ...(process.env.TOOL_EMAIL_BCC ? { bcc: [process.env.TOOL_EMAIL_BCC] } : {}),
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      tags: [{ name: 'crm', value: opts.tag.replace(/[^a-zA-Z0-9_-]/g, '_') }],
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('CRM email failed:', res.status, detail);
    throw new Error(`Email didn't send (${res.status}). Check the Resend dashboard.`);
  }
}
