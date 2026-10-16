'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { getTool } from '@/app/lib/tools';
import ResultCTA from '@/components/tools/ResultCTA';
import Arrow from '@/components/editorial/Arrow';

const tool = getTool('serp-preview');

// Google truncates by pixel width, not characters. Approximate its result fonts with a canvas.
const LIMITS = {
  desktop: { title: 600, titleFont: '20px Arial', desc: 920, descFont: '14px Arial' },
  mobile: { title: 540, titleFont: '18px Arial', desc: 680, descFont: '14px Arial' },
};

type Device = keyof typeof LIMITS;

let canvas: CanvasRenderingContext2D | null = null;
const noopSubscribe = () => () => {};

/** Pixel width via canvas in the browser; a character estimate during server render (and before hydration). */
function useTextWidth() {
  const inBrowser = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return (text: string, font: string) => {
    if (inBrowser) canvas ??= document.createElement('canvas').getContext('2d');
    if (!inBrowser || !canvas) return text.length * (font.startsWith('20') ? 9.5 : 6.6);
    canvas.font = font;
    return canvas.measureText(text).width;
  };
}

function truncate(text: string, maxPx: number, font: string, measure: (t: string, f: string) => number) {
  if (measure(text, font) <= maxPx) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measure(text.slice(0, mid) + ' ...', font) <= maxPx) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo).trimEnd() + ' ...';
}

function Meter({ label, chars, px, maxPx, ideal }: { label: string; chars: number; px: number; maxPx: number; ideal: string }) {
  const pct = Math.min(100, (px / maxPx) * 100);
  const over = px > maxPx;
  return (
    <div className="mt-3">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className={`h-full transition-[width] duration-300 ${over ? 'bg-taam-orange' : 'bg-white'}`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`mt-2 text-sm font-semibold ${over ? 'text-taam-orange' : 'text-[color:var(--tone-muted)]'}`}>
        {chars} characters · {Math.round(px)} / {maxPx}px {over ? `· ${label} will be cut off` : `· ideal ${ideal}`}
      </p>
    </div>
  );
}

export default function SerpPreview() {
  const [title, setTitle] = useState('Pressure Washing in Las Vegas | Free Same-Week Quotes');
  const [description, setDescription] = useState(
    'Licensed, insured pressure washing for homes and businesses across Las Vegas and Henderson. 200+ five-star reviews. Get a free quote in 60 seconds.'
  );
  const [url, setUrl] = useState('https://yourbusiness.com/pressure-washing');
  const [device, setDevice] = useState<Device>('desktop');
  const measure = useTextWidth();
  const limit = LIMITS[device];

  let host = 'yourbusiness.com';
  let crumbs: string[] = [];
  try {
    const u = new URL(/^https?:\/\//.test(url) ? url : `https://${url}`);
    host = u.hostname.replace(/^www\./, '');
    crumbs = u.pathname.split('/').filter(Boolean);
  } catch {}

  const titleText = title.trim() || 'Your page title';
  const descText = description.trim() || 'Your meta description will appear here.';

  const fieldClass =
    'mt-2 w-full rounded-[1.25rem] bg-white/10 px-6 py-4 text-lg font-semibold outline-none focus:bg-white/15 focus:ring-2 focus:ring-white';

  return (
    <div className="space-y-14">
      <div className="grid grid-cols-12 gap-x-6 gap-y-12">
        <div className="col-span-12 lg:col-span-5 space-y-8">
          <label className="block">
            <span className="text-lg font-bold">Title tag</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
            <Meter label="title" chars={title.length} px={measure(title, limit.titleFont)} maxPx={limit.title} ideal="50–60 characters" />
          </label>
          <label className="block">
            <span className="text-lg font-bold">Meta description</span>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={`${fieldClass} resize-y`} />
            <Meter label="description" chars={description.length} px={measure(description, limit.descFont)} maxPx={limit.desc} ideal="140–160 characters" />
          </label>
          <label className="block">
            <span className="text-lg font-bold">Page URL</span>
            <input value={url} onChange={(e) => setUrl(e.target.value)} spellCheck={false} className={fieldClass} />
          </label>
        </div>

        <div className="col-span-12 lg:col-span-6 lg:col-start-7">
          <div className="flex items-center justify-between gap-4 mb-5">
            <p className="eyebrow">Preview</p>
            <div role="tablist" aria-label="Device" className="inline-flex rounded-full p-1 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)]">
              {(['desktop', 'mobile'] as const).map((d) => (
                <button
                  key={d}
                  role="tab"
                  aria-selected={device === d}
                  onClick={() => setDevice(d)}
                  className={`eyebrow rounded-full px-5 py-3 transition-colors ${device === d ? 'bg-white text-taam-near-black' : ''}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Approximation of a search result, in the search engine's own neutral styling. */}
          <div
            className={`rounded-[var(--radius-card)] bg-white p-6 md:p-8 text-left ${device === 'mobile' ? 'max-w-[400px]' : ''}`}
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1f3f4] text-xs font-bold text-[#5f6368]">
                {host.charAt(0).toUpperCase()}
              </span>
              <span className="leading-tight">
                <span className="block text-sm text-[#202124]">{host.split('.')[0]}</span>
                <span className="block text-xs text-[#4d5156]">
                  https://{host}
                  {crumbs.length > 0 && ` › ${crumbs.join(' › ')}`}
                </span>
              </span>
            </div>
            <p className={`mt-2 text-[#1a0dab] leading-snug ${device === 'desktop' ? 'text-xl' : 'text-lg'}`}>
              {truncate(titleText, limit.title, limit.titleFont, measure)}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[#4d5156]">{truncate(descText, limit.desc, limit.descFont, measure)}</p>
          </div>
          <p className="mt-4 text-sm font-medium text-[color:var(--tone-muted)]">
            Google may rewrite titles and descriptions it thinks don&apos;t match the search. Clear, accurate ones are kept more often.
          </p>
          <p className="mt-6 font-semibold">
            Want to check what your live page actually says?{' '}
            <Link href="/tools/seo-grader" className="link-line">Run the free SEO grader <Arrow /></Link>
          </p>
        </div>
      </div>

      <ResultCTA tool={tool} />
    </div>
  );
}
