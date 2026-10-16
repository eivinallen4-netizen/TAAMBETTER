import type { ToolReport } from '@/app/lib/tool-reports';
import { renderToolPdf, toolPdfFilename } from '@/lib/tool-pdf';
import {
  FONT,
  INK,
  ORANGE,
  PHONE,
  REPLY_TO,
  RULE,
  SITE,
  button,
  emailShell,
  esc,
  heroCard,
  inkRow,
  paragraphs,
} from '@/lib/brand-email';

// The branded email that delivers a free-tool report, and the Resend call that sends it.
// Built on the shared TAAM email shell in lib/brand-email.ts.

export function renderToolEmail(report: ToolReport, firstName: string, withPdf = false) {
  const hi = firstName ? `${firstName}, here's` : "Here's";
  const mailto = `mailto:${REPLY_TO}?subject=${encodeURIComponent(`Free call about my results (${report.toolName})`)}`;

  const stats = report.stats
    .map(
      (s) => `<td valign="top" width="50%" style="width:50%;padding:16px 12px 16px 0;border-top:2px solid ${INK};">
        <div style="font:800 11px/1.3 ${FONT};letter-spacing:.14em;text-transform:uppercase;color:${INK};">${esc(s.label)}</div>
        <div class="stat" style="font:900 34px/1.05 ${FONT};color:#fff;padding-top:8px;">${esc(s.value)}</div>
      </td>`
    )
    // Two per row keeps the numbers big on phones.
    .reduce<string[]>((rows, cell, i) => (i % 2 ? (rows[rows.length - 1] += cell, rows) : [...rows, cell]), [])
    .map((r) => `<tr>${r}</tr>`)
    .join('');

  const sections = report.sections
    .map((sec) =>
      inkRow(
        `<div style="font:900 26px/1.1 ${FONT};text-transform:uppercase;color:#fff;padding-bottom:16px;border-bottom:2px solid ${ORANGE};">${esc(sec.title)}</div>
        ${sec.items
          .map(
            (item, i) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px solid ${RULE};"><tr>
              <td width="44" valign="top" style="width:44px;padding:22px 0;font:900 15px/1.35 ${FONT};color:${ORANGE};">${String(i + 1).padStart(2, '0')}</td>
              <td valign="top" style="padding:22px 0 10px;">
                <div style="font:800 17px/1.35 ${FONT};color:#fff;">${esc(item.title)}</div>
                ${item.tag ? `<div style="font:800 11px/1.4 ${FONT};letter-spacing:.14em;text-transform:uppercase;color:${ORANGE};padding-top:6px;">${esc(item.tag)}</div>` : ''}
                <div style="padding-top:10px;">${paragraphs(item.body, `font:500 15px/1.6 ${FONT};color:#e6e6e6;`)}</div>
              </td>
            </tr></table>`
          )
          .join('')}`,
        48
      )
    )
    .join('');

  const rows = [
    heroCard({
      eyebrow: `Free ${report.toolName} · Full report`,
      title: report.headline,
      mascot: 'counting',
      inner: [
        report.website ? `<div style="font:800 14px/1.4 ${FONT};color:${INK};padding-bottom:12px;word-break:break-all;">${esc(report.website)}</div>` : '',
        `<p style="margin:0 0 24px;font:600 17px/1.55 ${FONT};color:${INK};">${esc(hi)} everything from your report, so you can keep it, share it and work through it.${withPdf ? ' A printable PDF copy is attached.' : ''}</p>`,
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${stats}</table>`,
      ].join(''),
    }),
    inkRow(paragraphs(report.intro, `font:500 17px/1.65 ${FONT};color:#e6e6e6;`)),
    sections,
    `<tr><td class="px" style="padding:56px 20px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${ORANGE};border-radius:24px;">
      <tr><td class="card" style="padding:36px 32px;">
        <div class="h1" style="font:900 40px/1 ${FONT};text-transform:uppercase;color:#fff;">Want us to fix it?</div>
        <p style="margin:16px 0 24px;font:600 16px/1.55 ${FONT};color:${INK};">Book a free call. We'll walk through your results and tell you what we'd fix first. Take the plan and run with it, with or without us. We'll give you better marketing or refer you to someone who can.</p>
        ${button('Book a free call', mailto)}
        <p style="margin:18px 0 0;font:700 14px/1.5 ${FONT};color:${INK};">Or just reply to this email · Call <a href="tel:+1${PHONE.replace(/\D/g, '')}" style="color:${INK};">${PHONE}</a></p>
      </td></tr></table>
    </td></tr>`,
  ].join('');

  const html = emailShell({
    title: `${report.toolName} report`,
    preheader: `${report.headline} Your full ${report.toolName} report from TAAM.`,
    rows,
    footer: `You're getting this because you asked for your report on ${SITE.replace(/^https?:\/\//, '')}/tools/${report.slug}. Run it again any time.`,
  });

  const text = [
    `${report.headline}`,
    report.website ?? '',
    '',
    `${firstName ? `${firstName}, here's` : "Here's"} everything from your ${report.toolName} report.${withPdf ? ' A printable PDF copy is attached.' : ''}`,
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
export async function sendToolEmail(to: string, report: ToolReport, firstName: string, withPdf = false): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('RESEND_API_KEY not set; skipping tool report email');
    return false;
  }
  // A PDF failure shouldn't cost the visitor their email; send it without the attachment.
  let pdf: Uint8Array | null = null;
  if (withPdf) {
    try {
      pdf = await renderToolPdf(report, firstName);
    } catch (err) {
      console.error('Tool report PDF failed:', err);
    }
  }
  const { subject, html, text } = renderToolEmail(report, firstName, !!pdf);
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
      ...(pdf ? { attachments: [{ filename: toolPdfFilename(report), content: Buffer.from(pdf).toString('base64') }] } : {}),
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
