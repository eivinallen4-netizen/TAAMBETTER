// A small Markdown → HTML renderer for SEO page bodies. Bodies come from Claude through the MCP
// tools, so nothing in them is trusted: all text is escaped, raw HTML is shown as text, and links
// only keep http(s), mailto, tel, site-relative and #anchor targets. Images are dropped (only the
// TAAM character art goes on the site, never arbitrary pictures). Shared by /insights and the
// admin editor's live preview so both render the same thing.
//
// Supports: # headings (h2–h4; a lone # becomes h2, the page title is the h1), paragraphs,
// - / * / 1. lists, > quotes, ``` code, --- rules, | tables |, **bold**, *italic*, `code`,
// ~~strike~~ and [links](url).

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function headingId(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function safeHref(url: string): string | null {
  const u = url.trim();
  if (/^(https?:\/\/|mailto:|tel:)/i.test(u) || /^\/(?!\/)/.test(u) || u.startsWith('#')) return u;
  return null;
}

function inline(src: string): string {
  // Pull code spans and links out first so their contents aren't touched by the emphasis rules.
  const held: string[] = [];
  const hold = (html: string) => `\u0000${held.push(html) - 1}\u0000`;

  let s = src.replace(/`([^`]+)`/g, (_, code) => hold(`<code>${escapeHtml(code)}</code>`));
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label: string, url: string) => {
    const href = safeHref(url);
    if (!href) return label;
    const external = /^https?:\/\//i.test(href);
    return hold(
      `<a href="${escapeHtml(href)}" class="link-line font-semibold"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${inline(label)}</a>`
    );
  });

  s = escapeHtml(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\s][^*]*)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/(^|[^_\w])_([^_\s][^_]*)_(?!\w)/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');

  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => held[Number(i)]);
}

const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());

export interface RenderedMarkdown {
  html: string;
  /** The h2s, in order, for an "In this article" list. */
  headings: { id: string; text: string }[];
}

export function renderMarkdown(markdown: string): RenderedMarkdown {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  const headings: RenderedMarkdown['headings'] = [];
  const usedIds = new Set<string>();
  let i = 0;

  const isBlockStart = (line: string) =>
    /^(#{1,6}\s|>\s?|```|[-*]\s|\d+[.)]\s)/.test(line.trim()) || /^(-{3,}|\*{3,})$/.test(line.trim()) || isTableRow(line);

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++]);
      i++;
      out.push(`<pre class="overflow-x-auto rounded-2xl bg-black/40 p-5 text-sm"><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      const level = Math.min(4, Math.max(2, heading[1].length));
      const textContent = heading[2].replace(/#+$/, '').trim();
      if (level === 2) {
        let id = headingId(textContent) || `section-${headings.length + 1}`;
        while (usedIds.has(id)) id += '-x';
        usedIds.add(id);
        headings.push({ id, text: textContent });
        out.push(`<h2 id="${id}" class="display display-sm scroll-mt-28 border-t-2 rule pt-14 mt-14">${inline(textContent)}</h2>`);
      } else {
        out.push(`<h${level} class="text-xl font-extrabold uppercase tracking-tight pt-4">${inline(textContent)}</h${level}>`);
      }
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      out.push('<hr class="border-t-2 rule my-10" />');
      i++;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) quote.push(lines[i++].trim().replace(/^>\s?/, ''));
      out.push(`<blockquote class="border-l-4 border-[color:var(--taam-orange)] pl-6 lede">${inline(quote.join(' '))}</blockquote>`);
      continue;
    }

    if (/^([-*]|\d+[.)])\s/.test(trimmed)) {
      const ordered = /^\d/.test(trimmed);
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (/^([-*]|\d+[.)])\s/.test(t)) items.push(t.replace(/^([-*]|\d+[.)])\s+/, ''));
        else if (t && !isBlockStart(lines[i]) && items.length) items[items.length - 1] += ` ${t}`;
        else break;
        i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(
        `<${tag} class="border-t-2 rule">${items
          .map(
            (it, n) =>
              `<li class="border-b-2 rule py-4${ordered ? ' flex gap-5' : ''}">${
                ordered ? `<span class="font-black opacity-60 w-6 shrink-0">${n + 1}</span><span>${inline(it)}</span>` : inline(it)
              }</li>`
          )
          .join('')}</${tag}>`
      );
      continue;
    }

    if (isTableRow(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      const head = cells(line);
      i += 2;
      const body: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) body.push(cells(lines[i++]));
      out.push(
        `<div class="overflow-x-auto"><table class="w-full text-left text-base"><thead><tr class="border-b-2 rule">${head
          .map((h) => `<th class="eyebrow py-3 pr-4">${inline(h)}</th>`)
          .join('')}</tr></thead><tbody>${body
          .map((r) => `<tr class="border-b rule align-top">${r.map((c) => `<td class="py-3 pr-4">${inline(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div>`
      );
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !(para.length && isBlockStart(lines[i]))) para.push(lines[i++].trim());
    const paragraph = inline(para.join(' ')).trim();
    if (paragraph) out.push(`<p>${paragraph}</p>`);
  }

  return { html: out.join('\n'), headings };
}
