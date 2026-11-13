// The TAAM email system: one shell that every email goes out in, built to read like the website.
// A full-bleed halftone orange hero (the homepage opener), the white "Say WOW" ribbon, ink content
// rows with numbered section labels, an optional orange "Let's talk" poster, then the poster sign-off.
// Table layout and inline styles only, for Gmail and Outlook. Images live in /public/email.
//
// Outline type (the site's statement style) is progressive: it is turned on in a separate <style>
// block behind @supports, so clients that drop it (Gmail, Outlook) show the same words solid.

export const ORANGE = '#F46325';
export const INK = '#111111';
export const RULE = '#2d2d2d';
export const MUTED = '#b3b3b3';
/** White at the site's tone-orange muted (82%) and rule (45%) strengths, flattened onto orange. */
export const ORANGE_MUTED = '#FDE6DC';
export const ORANGE_RULE = '#F9B194';
export const FONT = "Montserrat, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.taammarketing.com').replace(/\/$/, '');
export const REPLY_TO = process.env.TOOL_EMAIL_REPLY_TO || 'info@taammarketing.com';
export const PHONE = '702-997-6813';
export const TEL = `tel:+1${PHONE.replace(/\D/g, '')}`;

// Inboxes can't reach localhost, so images always come from a public host.
const ASSETS = /localhost|127\.0\.0\.1/.test(SITE) ? 'https://www.taammarketing.com' : SITE;
const asset = (file: string) => `${ASSETS}/email/${file}`;

/** The orange section background: the site's halftone dot screen, plain orange where images are off. */
const ORANGE_BG = `background-color:${ORANGE};background-image:url('${asset('halftone-orange.png')}');background-repeat:repeat;`;

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

/** Small all-caps label, tracked out like the site's .eyebrow. */
export const eyebrow = (text: string, color: string) =>
  `<div style="font:700 11px/1.5 ${FONT};letter-spacing:.22em;text-transform:uppercase;color:${color};">${esc(text)}</div>`;

/** Display type: one geometric sans, heavy, all caps, tight. */
export const display = (px: number, color = '#fff') =>
  `font:900 ${px}px/.92 ${FONT};letter-spacing:-.035em;text-transform:uppercase;color:${color};`;

/** Outlined statement words. `on` is the background, which fills the letters where it's supported. */
export const outline = (text: string, on: 'orange' | 'ink' | 'white') =>
  `<span class="ol-${on}" style="color:${on === 'white' ? INK : '#fff'};">${esc(text)}</span>`;

/** The site's .btn-solid: a white pill, ink type, arrow. Works on orange and on ink. */
export function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#ffffff" style="background:#fff;border-radius:999px;">
    <a href="${esc(url)}" style="display:inline-block;padding:19px 30px;font:800 13px/1 ${FONT};letter-spacing:.14em;text-transform:uppercase;color:${INK};text-decoration:none;border-radius:999px;">${esc(label)}&nbsp;&nbsp;&#8599;</a>
  </td></tr></table>`;
}

/** A pill drawn in a 2px line (the site's .btn-ghost and hero pill labels). */
export const ghostPill = (label: string, href: string, color = '#fff') =>
  `<td style="border:2px solid ${color};border-radius:999px;"><a href="${esc(href)}" style="display:inline-block;padding:11px 16px;font:800 11px/1 ${FONT};letter-spacing:.16em;text-transform:uppercase;color:${color};text-decoration:none;">${label}</a></td>`;

/** Label / value rows on the orange hero, ruled in the site's tone-rule white. */
export function detailRows(rows: [string, string][]): string {
  const live = rows.filter(([, v]) => v.trim());
  if (!live.length) return '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:30px;border-bottom:2px solid ${ORANGE_RULE};">${live
    .map(
      ([k, v]) => `<tr>
        <td valign="top" width="120" style="width:120px;padding:15px 16px 15px 0;border-top:2px solid ${ORANGE_RULE};font:700 11px/1.6 ${FONT};letter-spacing:.2em;text-transform:uppercase;color:${ORANGE_MUTED};">${esc(k)}</td>
        <td valign="top" style="padding:15px 0;border-top:2px solid ${ORANGE_RULE};font:800 16px/1.4 ${FONT};color:#fff;word-break:break-word;">${esc(v)}</td>
      </tr>`
    )
    .join('')}</table>`;
}

/** Big numbers along a rule, label underneath, two per row so they stay big on phones. */
export function statGrid(stats: { label: string; value: string }[]): string {
  const cells = stats.map(
    (s) => `<td valign="top" width="50%" style="width:50%;padding:18px 12px 20px 0;border-top:2px solid ${ORANGE_RULE};">
      <div class="stat" style="${display(42)}">${esc(s.value)}</div>
      <div style="padding-top:10px;font:700 10px/1.4 ${FONT};letter-spacing:.2em;text-transform:uppercase;color:${ORANGE_MUTED};">${esc(s.label)}</div>
    </td>`
  );
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 2) rows.push(`<tr>${cells[i]}${cells[i + 1] ?? '<td></td>'}</tr>`);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">${rows.join('')}</table>`;
}

/** A content row on the ink page. */
export const inkRow = (html: string, top = 48) => `<tr><td class="px" style="padding:${top}px 44px 0;">${html}</td></tr>`;

/** Numbered section opener on ink: "01 — Label" then a display headline. */
export const sectionHead = (index: number, title: string) =>
  `${eyebrow(`${String(index).padStart(2, '0')} — ${title}`, ORANGE)}
  <div class="h2" style="${display(34)}padding:14px 0 22px;">${esc(title)}</div>`;

/** A "Want us to fix it?"-style closing poster: full-bleed orange, giant two-line call, phone mascot. */
export interface Poster {
  eyebrow: string;
  /** Two lines; the second is set in outline type. */
  lines: [string, string];
  body: string;
  cta: { label: string; url: string };
}

function posterRow(p: Poster): string {
  return `<tr><td class="px" style="${ORANGE_BG}padding:56px 44px 52px;" bgcolor="${ORANGE}">
    ${eyebrow(p.eyebrow, '#fff')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;"><tr>
      <td valign="bottom"><div class="mega" style="${display(64)}line-height:.86;">${esc(p.lines[0])}<br>${outline(p.lines[1], 'orange')}</div></td>
      <td width="112" valign="bottom" align="right" class="hide-sm" style="width:112px;"><img src="${asset('phone.png')}" width="112" height="112" alt="" style="display:block;width:112px;height:112px;border:0;"></td>
    </tr></table>
    <p style="margin:26px 0 28px;font:600 16px/1.6 ${FONT};color:#fff;">${esc(p.body)}</p>
    ${button(p.cta.label, p.cta.url)}
    <p style="margin:20px 0 0;font:700 14px/1.5 ${FONT};color:#fff;">Or just reply &nbsp;·&nbsp; <a href="${TEL}" style="color:#fff;">${PHONE}</a></p>
  </td></tr>`;
}

/** The white ribbon from the site, held straight for email. */
function ribbon(): string {
  const words = ['Say WOW', 'Proven team', 'Always hungry', 'Las Vegas'];
  const dot = `<span style="display:inline-block;width:7px;height:7px;border-radius:7px;background:${INK};vertical-align:middle;margin:0 12px 4px;"></span>`;
  const line = words.map((w, i) => (i % 2 ? outline(w, 'white') : esc(w))).join(dot);
  return `<tr><td bgcolor="#ffffff" style="background:#fff;padding:16px 0;">
    <div style="width:100%;white-space:nowrap;overflow:hidden;text-align:center;${display(21, INK)}line-height:1;">${line}</div>
  </td></tr>`;
}

export interface Hero {
  /** Small caps line above the headline, e.g. "Website onboarding". */
  eyebrow: string;
  title: string;
  mascot?: Mascot;
  /** Trusted HTML built from the helpers here, set on orange. */
  inner: string;
}

/**
 * The page around every email: the orange hero with the wordmark, the ribbon, the content rows,
 * an optional poster, then the sign-off. `rows` is trusted HTML (<tr>s); `footer` is plain text
 * saying why they got this.
 */
export function emailShell(o: { title: string; preheader: string; hero: Hero; rows: string; poster?: Poster; footer: string }): string {
  const site = SITE.replace(/^https?:\/\//, '');
  const h = o.hero;
  const mascot = h.mascot
    ? `<td width="104" align="right" valign="bottom" style="width:104px;"><img src="${asset(`${h.mascot}.png`)}" width="104" height="104" alt="" style="display:block;width:104px;height:104px;border:0;"></td>`
    : '';

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<title>${esc(o.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  @media (max-width: 520px) {
    .px { padding-left: 24px !important; padding-right: 24px !important; }
    .h1 { font-size: 40px !important; }
    .h2 { font-size: 28px !important; }
    .mega { font-size: 48px !important; }
    .sign { font-size: 34px !important; }
    .stat { font-size: 32px !important; }
    .hide-sm { display: none !important; }
  }
</style>
<style>
  @supports (-webkit-text-stroke: 1px #fff) {
    .ol-orange { color: ${ORANGE} !important; -webkit-text-stroke: 3px #fff; paint-order: stroke fill; }
    .ol-ink { color: ${INK} !important; -webkit-text-stroke: 3px #fff; paint-order: stroke fill; }
    .ol-white { color: #fff !important; -webkit-text-stroke: 3px ${INK}; paint-order: stroke fill; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${INK};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(o.preheader)}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${INK}" style="background:${INK};">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;table-layout:fixed;background:${INK};">

  <tr><td class="px" bgcolor="${ORANGE}" style="${ORANGE_BG}padding:28px 44px 48px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td valign="middle"><a href="${SITE}" style="text-decoration:none;"><img src="${asset('taam-wordmark-white.png')}" width="120" height="30" alt="TAAM" style="display:block;width:120px;height:30px;border:0;color:#fff;font:900 26px/1 ${FONT};"></a></td>
      <td valign="middle" align="right"><table role="presentation" cellpadding="0" cellspacing="0" align="right"><tr>${ghostPill('Let&#39;s talk', TEL)}</tr></table></td>
    </tr></table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:44px;"><tr>
      <td valign="bottom">${eyebrow(h.eyebrow, '#fff')}</td>
      <td valign="bottom" align="right" class="hide-sm" style="font:700 11px/1.5 ${FONT};letter-spacing:.22em;text-transform:uppercase;color:#fff;white-space:nowrap;">Las Vegas, NV</td>
    </tr></table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;"><tr>
      <td valign="bottom"><h1 class="h1" style="margin:0;${display(54)}line-height:.88;">${esc(h.title)}</h1></td>
      ${mascot}
    </tr></table>
    <div style="height:28px;line-height:28px;font-size:0;">&nbsp;</div>
    ${h.inner}
  </td></tr>

  ${ribbon()}

  ${o.rows}

  ${o.poster ? `<tr><td style="height:56px;line-height:56px;font-size:0;">&nbsp;</td></tr>${posterRow(o.poster)}` : ''}

  <tr><td class="px" style="padding:${o.poster ? 56 : 64}px 44px 0;">
    ${eyebrow('TAAM Marketing', ORANGE)}
    <div class="sign" style="${display(44)}line-height:.9;padding-top:16px;">Better marketing<br>${outline('for the best', 'ink')}<br>businesses.</div>
  </td></tr>
  <tr><td class="px" style="padding:28px 44px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      ${ghostPill('Reply', `mailto:${REPLY_TO}`)}
      <td width="8" style="width:8px;"></td>
      ${ghostPill(PHONE, TEL)}
    </tr></table>
  </td></tr>
  <tr><td class="px" style="padding:44px 44px 0;"><div style="border-top:2px solid ${RULE};font-size:0;line-height:0;">&nbsp;</div></td></tr>
  <tr><td class="px" style="padding:22px 44px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="40" valign="top" style="width:40px;padding-top:2px;"><img src="${asset('taam-mark-orange.png')}" width="28" height="28" alt="" style="display:block;width:28px;height:28px;border:0;"></td>
      <td valign="top" style="font:500 12px/1.65 ${FONT};color:${MUTED};">${esc(o.footer)}<br>TAAM Marketing · Las Vegas, NV · <a href="${SITE}" style="color:${MUTED};">${esc(site)}</a></td>
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
  /** Big all-caps headline on the orange hero. */
  title: string;
  /** Plain text; blank lines start new paragraphs. */
  body: string;
  /** The TAAM character beside the headline. */
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

  const hero: Hero = {
    eyebrow: e.eyebrow,
    title: e.title,
    mascot: e.mascot,
    inner: [
      paragraphs(e.body, `font:600 17px/1.6 ${FONT};color:#fff;`),
      e.cta ? `<div style="padding-top:12px;">${button(e.cta.label, e.cta.url)}</div>` : '',
      detailRows(details),
    ].join(''),
  };

  const rows = [
    e.note
      ? inkRow(`${eyebrow('A note from the team', ORANGE)}
          <div style="margin-top:16px;padding-top:20px;border-top:2px solid ${RULE};">${paragraphs(e.note, `font:600 19px/1.55 ${FONT};color:#fff;`)}</div>`)
      : '',
    e.cta
      ? inkRow(
          `<p style="margin:0;font:500 12px/1.6 ${FONT};color:${MUTED};">Button not working? Paste this into your browser:<br><a href="${esc(e.cta.url)}" style="color:${ORANGE};word-break:break-all;">${esc(e.cta.url)}</a></p>`,
          e.note ? 24 : 40
        )
      : '',
  ].join('');

  const html = emailShell({ title: e.title, preheader: e.preheader, hero, rows, footer: e.footer });

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
      from: process.env.CRM_EMAIL_FROM || process.env.TOOL_EMAIL_FROM || 'TAAM <hello@mail.taammarketing.com>',
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
