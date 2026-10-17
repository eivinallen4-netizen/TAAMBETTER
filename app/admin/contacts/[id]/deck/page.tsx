'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Eye, EyeOff, Loader2, Play, Printer, RotateCcw, X } from 'lucide-react';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { INTERESTS, parseInterests } from '@/lib/interests';
import { resolveDeck, slidesFor, type DeckContact, type DeckOverrides, type PlanId } from '@/lib/deck';
import { LogoDrop, logoUrl } from '../../../components/ContactLogo';
import { SLIDE_H, SLIDE_W, Slide } from '../../../components/deck/Slides';

// A contact's marketing-plan slides: edit the text right on the slide, switch slides on and off,
// present full screen, print to PDF, or download as PowerPoint. Edits save themselves.

interface DeckContactRow extends DeckContact {
  id: string;
  name: string;
  email: string;
  logo_v: string;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/** A slide drawn at full size and scaled to fit `width` (and `height`, when given). */
function Scaled({ width, height, children }: { width: number; height?: number; children: React.ReactNode }) {
  const scale = Math.min(width / SLIDE_W, height ? height / SLIDE_H : Infinity);
  return (
    <div style={{ width: SLIDE_W * scale, height: SLIDE_H * scale }} className="relative overflow-hidden">
      <div
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export default function ContactDeckPage() {
  useAdminAuth();
  const { id } = useParams() as { id: string };

  const [contact, setContact] = useState<DeckContactRow | null>(null);
  const [overrides, setOverrides] = useState<DeckOverrides>({});
  const [error, setError] = useState('');
  const [save, setSave] = useState<SaveState>('idle');
  const [current, setCurrent] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [stageRef, stageWidth] = useWidth<HTMLDivElement>();

  useEffect(() => {
    fetch(`/api/admin/contacts/${id}/deck`, { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Failed to load');
        setContact(d.contact);
        setOverrides(d.overrides ?? {});
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [id]);

  const persist = useCallback(
    (next: DeckOverrides) => {
      setSave('saving');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const r = await fetch(`/api/admin/contacts/${id}/deck`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ overrides: next }),
          });
          setSave(r.ok ? 'saved' : 'error');
        } catch {
          setSave('error');
        }
      }, 600);
    },
    [id],
  );

  const edit = useCallback(
    (patch: DeckOverrides) => {
      setOverrides((o) => {
        const next = { ...o, ...patch };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  async function reset() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setOverrides({});
    setSave('saving');
    const r = await fetch(`/api/admin/contacts/${id}/deck`, {
      method: 'DELETE',
    }).catch(() => null);
    setSave(r?.ok ? 'saved' : 'error');
  }

  async function saveLogo(logo: string) {
    const r = await fetch(`/api/admin/contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Couldn’t save that logo');
    setContact((c) => (c ? { ...c, logo_v: d.logo_v } : c));
  }

  const deck = useMemo(() => (contact ? resolveDeck(contact, overrides) : null), [contact, overrides]);
  const slides = useMemo(() => (deck ? slidesFor(deck) : []), [deck]);
  const visible = slides.filter((s) => !s.hidden);
  const logoSrc = contact ? logoUrl(contact.id, contact.logo_v) : '';
  const sel = slides[Math.min(current, slides.length - 1)];

  async function downloadPptx() {
    if (!deck) return;
    setExporting(true);
    try {
      const [{ toPng }, { default: PptxGenJS }] = await Promise.all([import('html-to-image'), import('pptxgenjs')]);
      await document.fonts.ready;
      const nodes = Array.from(document.querySelectorAll<HTMLElement>('#deck-print > [data-slide]'));
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_WIDE';
      pptx.title = `${deck.client} — TAAM marketing plan`;
      pptx.company = 'TAAM';
      for (const node of nodes) {
        const png = await toPng(node, {
          width: SLIDE_W,
          height: SLIDE_H,
          pixelRatio: 1,
          cacheBust: false,
          filter: (el) => !(el instanceof HTMLElement && 'chrome' in el.dataset),
        });
        pptx.addSlide().addImage({ data: png, x: 0, y: 0, w: 13.333, h: 7.5 });
      }
      await pptx.writeFile({
        fileName: `${deck.client.replace(/[\\/:*?"<>|]+/g, '')} - TAAM Marketing Plan.pptx`,
      });
    } catch (e) {
      console.error('PPTX export failed:', e);
      setError('Couldn’t build the PowerPoint. Try again, or use Save PDF.');
    } finally {
      setExporting(false);
    }
  }

  if (error && !contact) {
    return (
      <div className="mx-auto max-w-5xl">
        <Link href={`/admin/contacts/${id}`} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to contact
        </Link>
        <div className="rounded-xl border border-red-700 bg-red-900/20 p-4 text-red-400">{error}</div>
      </div>
    );
  }
  if (!contact || !deck || !sel) {
    return <div className="flex min-h-[50vh] items-center justify-center text-gray-500">Loading…</div>;
  }

  const visibleIndex = (slideId: string) => visible.findIndex((s) => s.id === slideId);
  const toggleHidden = (slideId: string) =>
    edit({
      hidden: deck.hidden.includes(slideId) ? deck.hidden.filter((h) => h !== slideId) : [...deck.hidden, slideId],
    });
  const btn =
    'flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm font-bold text-gray-200 transition hover:border-gray-500 hover:text-white disabled:opacity-50';
  const label = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500';
  const input = 'w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-[#F46325] focus:outline-none';

  return (
    <div className="mx-auto max-w-[1600px]">
      <style>{`
        [data-edit] { border-radius: 8px; cursor: text; transition: outline-color .15s; outline: 3px dashed transparent; outline-offset: 6px; }
        .deck-editing [data-edit]:hover { outline-color: rgba(255,255,255,.45); }
        .deck-editing [data-edit]:focus { outline: 3px solid #fff; }
        @media print {
          @page { size: 1920px 1080px; margin: 0; }
          html, body { background: #111 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body > *:not(#deck-print) { display: none !important; }
          #deck-print { position: static !important; left: auto !important; }
          #deck-print > [data-slide] { break-after: page; }
          [data-chrome] { display: none !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href={`/admin/contacts/${id}`} className="mr-auto inline-flex items-center gap-2 text-sm font-semibold text-gray-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> {deck.client}
        </Link>
        <span className="text-xs font-semibold text-gray-500">
          {save === 'saving' ? (
            'Saving…'
          ) : save === 'saved' ? (
            'All changes saved'
          ) : save === 'error' ? (
            <span className="text-red-400">Not saved, check your connection</span>
          ) : (
            'Click any text on a slide to edit it'
          )}
        </span>
        <button type="button" onClick={reset} className={btn} title="Throw away your edits and rebuild from their contact info">
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
        <button type="button" onClick={() => window.print()} className={btn}>
          <Printer className="h-4 w-4" /> Save PDF
        </button>
        <button type="button" onClick={downloadPptx} disabled={exporting} className={btn}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PowerPoint
        </button>
        <button
          type="button"
          onClick={() => {
            const at = visibleIndex(sel.id);
            setCurrent(at < 0 ? 0 : at);
            setPresenting(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-[#F46325] px-4 py-2 text-sm font-black text-white transition hover:bg-[#FF7B42]"
        >
          <Play className="h-4 w-4" /> Present
        </button>
      </div>
      {error && <div className="mb-4 rounded-xl border border-red-700 bg-red-900/20 p-3 text-sm text-red-400">{error}</div>}

      <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)_280px]">
        {/* Slide rail */}
        <ol className="flex gap-3 overflow-x-auto pb-2 lg:max-h-[calc(100vh-10rem)] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0 lg:pr-1">
          {slides.map((s, i) => (
            <li key={s.id} className="shrink-0">
              <div className={`group relative rounded-lg ring-2 transition ${sel.id === s.id ? 'ring-[#F46325]' : 'ring-transparent hover:ring-gray-600'}`}>
                <button type="button" onClick={() => setCurrent(i)} className={`block overflow-hidden rounded-lg ${s.hidden ? 'opacity-30' : ''}`}>
                  <Scaled width={170}>
                    <Slide deck={deck} slide={s} index={Math.max(0, visibleIndex(s.id))} total={visible.length} logoSrc={logoSrc} />
                  </Scaled>
                </button>
                <button
                  type="button"
                  onClick={() => toggleHidden(s.id)}
                  title={s.hidden ? 'Show this slide' : 'Hide this slide'}
                  className="absolute right-1.5 top-1.5 rounded-md bg-black/70 p-1 text-gray-300 opacity-0 transition hover:text-white group-hover:opacity-100"
                >
                  {s.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className={`mt-1 truncate text-[11px] font-bold ${s.hidden ? 'text-gray-600 line-through' : 'text-gray-400'}`}>{s.label}</p>
            </li>
          ))}
        </ol>

        {/* Stage */}
        <div className="min-w-0">
          <div ref={stageRef} className="deck-editing overflow-hidden rounded-xl border border-gray-800 shadow-2xl">
            {stageWidth > 0 && (
              <Scaled width={stageWidth}>
                <Slide deck={deck} slide={sel} index={Math.max(0, visibleIndex(sel.id))} total={visible.length} logoSrc={logoSrc} edit={edit} />
              </Scaled>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-gray-400">
            <button
              type="button"
              disabled={current === 0}
              onClick={() => setCurrent(current - 1)}
              className="flex items-center gap-1 font-semibold hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="font-semibold">
              {sel.label}
              {sel.hidden && <span className="ml-2 text-gray-600">(hidden)</span>}
            </span>
            <button
              type="button"
              disabled={current >= slides.length - 1}
              onClick={() => setCurrent(current + 1)}
              className="flex items-center gap-1 font-semibold hover:text-white disabled:opacity-30"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Settings */}
        <aside className="space-y-5 rounded-xl border border-gray-800 bg-gray-900/60 p-5">
          <div>
            <span className={label}>Their logo</span>
            <div className="flex items-center gap-3">
              <LogoDrop src={logoSrc} name={contact.name} business={contact.business_name ?? ''} size="md" onChange={saveLogo} pasteAnywhere />
              <p className="text-xs leading-snug text-gray-500">Click, drop, or copy it from their site and press Ctrl+V. It goes on the cover.</p>
            </div>
          </div>

          <div>
            <span className={label}>Recommended plan</span>
            <div className="grid grid-cols-3 gap-1.5">
              {deck.plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => edit({ recommended: p.id as PlanId })}
                  className={`rounded-lg border px-2 py-2 text-xs font-black transition ${deck.recommended === p.id ? 'border-[#F46325] bg-[#F46325] text-white' : 'border-gray-700 text-gray-300 hover:border-gray-500'}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={label}>Prices for {deck.client}</span>
            <div className="space-y-2">
              {deck.plans.map((p, i) => (
                <label key={p.id} className="flex items-center gap-2">
                  <span className="w-20 text-xs font-bold text-gray-400">{p.name}</span>
                  <span className="text-sm text-gray-500">$</span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    className={input}
                    value={p.price}
                    onChange={(e) =>
                      edit({
                        plans: deck.plans.map((x, j) =>
                          j === i
                            ? {
                                ...x,
                                price: Math.max(0, Number(e.target.value) || 0),
                              }
                            : x,
                        ),
                      })
                    }
                  />
                </label>
              ))}
              <label className="flex items-center gap-2">
                <span className="w-20 text-xs font-bold text-gray-400">Per</span>
                <input className={input} value={deck.cadence} onChange={(e) => edit({ cadence: e.target.value })} />
              </label>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-gray-500">Scale the scope to their budget instead of lowering the price.</p>
          </div>

          <div>
            <span className={label}>Service slides</span>
            <div className="flex flex-wrap gap-1.5">
              {INTERESTS.map((i) => {
                const on = deck.interests.includes(i.value);
                return (
                  <button
                    key={i.value}
                    type="button"
                    onClick={() =>
                      edit({
                        interests: parseInterests(on ? deck.interests.filter((x) => x !== i.value) : [...deck.interests, i.value]),
                      })
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-bold transition ${on ? 'border-[#F46325] bg-[#F46325]/15 text-white' : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'}`}
                  >
                    {i.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] leading-snug text-gray-500">Starts from what they’re interested in on their contact page.</p>
          </div>
        </aside>
      </div>

      {/* Full-size copies for Save PDF and the PowerPoint export. Off screen until printed. */}
      {createPortal(
        <div id="deck-print" aria-hidden style={{ position: 'fixed', left: -100000, top: 0 }}>
          {visible.map((s, i) => (
            <div key={s.id} data-slide="">
              <Slide deck={deck} slide={s} index={i} total={visible.length} logoSrc={logoSrc} />
            </div>
          ))}
        </div>,
        document.body,
      )}

      {presenting && (
        <Presenter
          count={visible.length}
          start={current}
          onClose={(at) => {
            setPresenting(false);
            const slideAt = visible[at];
            if (slideAt) setCurrent(slides.findIndex((s) => s.id === slideAt.id));
          }}
        >
          {(i) => <Slide deck={deck} slide={visible[i]} index={i} total={visible.length} logoSrc={logoSrc} />}
        </Presenter>
      )}
    </div>
  );
}

/** Full-screen slideshow: arrows, space or click to move, Esc to leave. */
function Presenter({
  count,
  start,
  onClose,
  children,
}: {
  count: number;
  start: number;
  onClose: (at: number) => void;
  children: (i: number) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(Math.min(start, count - 1));
  const [size, setSize] = useState({ w: 0, h: 0 });
  const at = useRef(i);
  useEffect(() => {
    at.current = i;
  }, [i]);

  useEffect(() => {
    const el = ref.current;
    el?.requestFullscreen?.().catch(() => {});
    const measure = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    measure();
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) setI((x) => Math.min(count - 1, x + 1));
      else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) setI((x) => Math.max(0, x - 1));
      else if (e.key === 'Home') setI(0);
      else if (e.key === 'End') setI(count - 1);
      else if (e.key === 'Escape' && !document.fullscreenElement) onClose(at.current);
      else return;
      e.preventDefault();
    };
    const onFs = () => {
      if (!document.fullscreenElement) onClose(at.current);
    };
    window.addEventListener('resize', measure);
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFs);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center bg-black"
      onClick={(e) => setI((x) => (e.clientX < window.innerWidth / 3 ? Math.max(0, x - 1) : Math.min(count - 1, x + 1)))}
    >
      {size.w > 0 && (
        <Scaled width={size.w} height={size.h}>
          {children(i)}
        </Scaled>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose(at.current);
        }}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/70 opacity-0 transition hover:opacity-100"
        aria-label="Exit"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
