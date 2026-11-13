import type { ToolReport } from '@/app/lib/tool-reports';
import { renderToolPdf, toolPdfFilename } from '@/lib/tool-pdf';
import {
  FONT,
  ORANGE,
  PHONE,
  REPLY_TO,
  RULE,
  SITE,
  emailShell,
  esc,
  inkRow,
  paragraphs,
  sectionHead,
  statGrid,
} from '@/lib/brand-email';

// The branded email that delivers a free-tool report, and the Resend call that sends it.
// Built on the shared TAAM email shell in lib/brand-email.ts.

export function renderToolEmail(report: ToolReport, firstName: string, withPdf = false) {
  const hi = firstName ? `${firstName}, here's` : "Here's";
  const mailto = `mailto:${REPLY_TO}?subject=${encodeURIComponent(`Free call about my results (${report.toolName})`)}`;

  const sections = report.sections
    .map((sec, s) =>
      inkRow(
        `${sectionHead(s + 1, sec.title)}
        <div style="border-top:2px solid ${RULE};">${sec.items
          .map(
            (item, i) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px solid ${RULE};"><tr>
              <td width="44" valign="top" style="width:44px;padding:24px 0;font:700 11px/1.9 ${FONT};letter-spacing:.2em;color:${ORANGE};">${String(i + 1).padStart(2, '0')}</td>
              <td valign="top" style="padding:22px 0 12px;">
                <div style="font:800 18px/1.35 ${FONT};color:#fff;">${esc(item.title)}</div>
                ${item.tag ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:12px;"><tr><td style="border:2px solid ${ORANGE};border-radius:999px;padding:6px 12px;font:800 11px/1.2 ${FONT};letter-spacing:.14em;text-transform:uppercase;color:${ORANGE};">${esc(item.tag)}</td></tr></table>` : ''}
                <div style="padding-top:12px;">${paragraphs(item.body, `font:500 15px/1.65 ${FONT};color:#e6e6e6;`)}</div>
              </td>
            </tr></table>`
          )
          .join('')}</div>`,
        s ? 56 : 48
      )
    )
    .join('');

  const html = emailShell({
    title: `${report.toolName} report`,
    preheader: `${report.headline} Your full ${report.toolName} report from TAAM.`,
    hero: {
      eyebrow: `Free ${report.toolName}`,
      title: report.headline,
      mascot: 'counting',
      inner: [
        report.website ? `<div style="font:800 14px/1.4 ${FONT};color:#fff;padding-bottom:12px;word-break:break-all;">${esc(report.website)}</div>` : '',
        `<p style="margin:0 0 26px;font:600 17px/1.6 ${FONT};color:#fff;">${esc(hi)} everything from your report, so you can keep it, share it and work through it.${withPdf ? ' A printable PDF copy is attached.' : ''}</p>`,
        statGrid(report.stats),
      ].join(''),
    },
    rows: [inkRow(paragraphs(report.intro, `font:500 18px/1.65 ${FONT};color:#e6e6e6;`)), sections].join(''),
    poster: {
      eyebrow: 'Want us to fix it?',
      lines: ["Let's", 'talk.'],
      body: "Book a free call. We'll walk through your results and tell you what we'd fix first. Take the plan and run with it, with or without us. We'll give you better marketing or refer you to someone who can.",
      cta: { label: 'Book a free call', url: mailto },
    },
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
      from: process.env.TOOL_EMAIL_FROM || 'TAAM <reports@mail.taammarketing.com>',
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
