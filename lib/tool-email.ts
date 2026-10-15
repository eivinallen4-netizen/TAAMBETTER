import type { ToolReport } from '@/app/lib/tool-reports';

// The branded email that delivers a free-tool report, and the Resend call that sends it.
// Table layout and inline styles only: that's what Gmail and Outlook reliably render.

const ORANGE = '#F46325';
const INK = '#111111';
const RULE = '#2d2d2d';
const MUTED = '#b3b3b3';
const FONT = "Montserrat, 'Helvetica Neue', Helvetica, Arial, sans-serif";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://taammarketing.com').replace(/\/$/, '');
const REPLY_TO = process.env.TOOL_EMAIL_REPLY_TO || 'info@taammarketing.com';
const PHONE = '702-997-6813';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const paragraphs = (text: string, style: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px;${style}">${esc(p)}</p>`)
    .join('');

export function renderToolEmail(report: ToolReport, firstName: string) {
  const hi = firstName ? `${esc(firstName)}, here's` : "Here's";
  const toolUrl = `${SITE}/tools/${report.slug}`;
  const mailto = `mailto:${REPLY_TO}?subject=${encodeURIComponent(`Free call about my results (${report.toolName})`)}`;

  const stats = report.stats
    .map(
      (s) => `<td valign="top" style="padding:16px 12px 16px 0;border-top:2px solid ${INK};">
        <div style="font:800 11px/1.3 ${FONT};letter-spacing:.12em;text-transform:uppercase;color:${INK};opacity:.75;">${esc(s.label)}</div>
        <div style="font:900 30px/1.1 ${FONT};color:${INK};padding-top:6px;">${esc(s.value)}</div>
      </td>`
    )
    // Two per row keeps the numbers big on phones.
    .reduce<string[]>((rows, cell, i) => (i % 2 ? (rows[rows.length - 1] += cell, rows) : [...rows, cell]), [])
    .map((r) => `<tr>${r}</tr>`)
    .join('');

  const sections = report.sections
    .map(
      (sec) => `<tr><td style="padding:40px 32px 0;">
        <div style="font:900 22px/1.2 ${FONT};text-transform:uppercase;letter-spacing:.02em;color:#fff;padding-bottom:16px;border-bottom:2px solid ${RULE};">${esc(sec.title)}</div>
        ${sec.items
          .map(
            (item) => `<div style="padding:20px 0;border-bottom:2px solid ${RULE};">
              <div style="font:800 17px/1.35 ${FONT};color:#fff;">${esc(item.title)}</div>
              ${item.tag ? `<div style="font:800 12px/1.4 ${FONT};letter-spacing:.1em;text-transform:uppercase;color:${ORANGE};padding-top:6px;">${esc(item.tag)}</div>` : ''}
              <div style="padding-top:10px;">${paragraphs(item.body, `font:500 15px/1.6 ${FONT};color:#e6e6e6;`)}</div>
            </div>`
          )
          .join('')}
      </td></tr>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${esc(report.toolName)} report</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;800;900&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${INK};">
<div style="display:none;max-height:0;overflow:hidden;">${esc(report.headline)} Your full ${esc(report.toolName)} report from TAAM.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${INK};">

  <tr><td style="padding:8px 32px 24px;">
    <a href="${SITE}" style="font:900 30px/1 ${FONT};letter-spacing:.04em;color:#fff;text-decoration:none;">TAAM<span style="color:${ORANGE};">.</span></a>
  </td></tr>

  <tr><td style="background:${ORANGE};border-radius:20px;padding:36px 32px 28px;">
    <div style="font:800 12px/1.4 ${FONT};letter-spacing:.14em;text-transform:uppercase;color:${INK};">Free ${esc(report.toolName)} · Full report</div>
    <h1 style="margin:14px 0 0;font:900 34px/1.08 ${FONT};text-transform:uppercase;color:#fff;">${esc(report.headline)}</h1>
    ${report.website ? `<div style="font:700 14px/1.4 ${FONT};color:${INK};padding-top:12px;word-break:break-all;">${esc(report.website)}</div>` : ''}
    <p style="margin:16px 0 20px;font:600 16px/1.55 ${FONT};color:${INK};">${hi} everything from your report, so you can keep it, share it and work through it.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${stats}</table>
  </td></tr>

  <tr><td style="padding:32px 32px 0;">${paragraphs(report.intro, `font:500 16px/1.6 ${FONT};color:#e6e6e6;`)}</td></tr>

  ${sections}

  <tr><td style="padding:48px 0 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${ORANGE};border-radius:20px;">
    <tr><td style="padding:36px 32px;">
      <div style="font:900 28px/1.1 ${FONT};text-transform:uppercase;color:#fff;">Want us to fix it?</div>
      <p style="margin:14px 0 24px;font:600 16px/1.55 ${FONT};color:${INK};">Book a free call. We'll walk through your results and tell you what we'd fix first. Take the plan and run with it, with or without us. We'll give you better marketing or refer you to someone who can.</p>
      <a href="${mailto}" style="display:inline-block;background:${INK};color:#fff;font:800 14px/1 ${FONT};letter-spacing:.1em;text-transform:uppercase;text-decoration:none;padding:18px 28px;border-radius:999px;">Book a free call ↗</a>
      <p style="margin:18px 0 0;font:700 14px/1.5 ${FONT};color:${INK};">Or just reply to this email · Call <a href="tel:+1${PHONE.replace(/\D/g, '')}" style="color:${INK};">${PHONE}</a></p>
    </td></tr></table>
  </td></tr>

  <tr><td style="padding:32px 32px 8px;">
    <div style="font:900 16px/1.3 ${FONT};text-transform:uppercase;color:#fff;">Better marketing for the best businesses.</div>
    <p style="margin:10px 0 0;font:500 13px/1.6 ${FONT};color:${MUTED};">You're getting this because you asked for your report on <a href="${toolUrl}" style="color:${MUTED};">${esc(SITE.replace(/^https?:\/\//, ''))}</a>. Run it again any time. TAAM Marketing · Las Vegas, NV</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  const text = [
    `${report.headline}`,
    report.website ?? '',
    '',
    `${firstName ? `${firstName}, here's` : "Here's"} everything from your ${report.toolName} report.`,
    '',
    report.stats.map((s) => `${s.label}: ${s.value}`).join('\n'),
    '',
    report.intro,
    ...report.sections.flatMap((sec) => ['', sec.title.toUpperCase(), ...sec.items.map((i) => `\n- ${i.title}${i.tag ? ` (${i.tag})` : ''}\n  ${i.body.replace(/\n+/g, ' ')}`)]),
    '',
    `Want us to fix it? Reply to this email or call ${PHONE} for a free call.`,
    `Better marketing for the best businesses. ${SITE}`,
  ]
    .filter((l, i, a) => !(l === '' && a[i - 1] === ''))
    .join('\n');

  return { subject: `${report.toolName} report: ${report.headline.replace(/\.$/, '')}`, html, text };
}

/** Sends through Resend. Returns false (and logs) when email isn't configured or the send fails. */
export async function sendToolEmail(to: string, report: ToolReport, firstName: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('RESEND_API_KEY not set; skipping tool report email');
    return false;
  }
  const { subject, html, text } = renderToolEmail(report, firstName);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.TOOL_EMAIL_FROM || 'TAAM <reports@taammarketing.com>',
      to: [to],
      reply_to: REPLY_TO,
      // Optional internal copy so the team sees exactly what went out.
      ...(process.env.TOOL_EMAIL_BCC ? { bcc: [process.env.TOOL_EMAIL_BCC] } : {}),
      subject,
      html,
      text,
      tags: [{ name: 'tool', value: report.slug.replace(/[^a-zA-Z0-9_-]/g, '_') }],
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    console.error('Tool report email failed:', res.status, await res.text().catch(() => ''));
    return false;
  }
  return true;
}
