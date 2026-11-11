'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Play, Printer } from 'lucide-react';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { websiteSlides } from '@/lib/website-deck';
import { Presenter, Scaled, useWidth } from '../components/deck/Presenter';
import { WebsiteSlide } from '../components/deck/WebsiteSlides';

// Website sales slides for in-person meetings: client sites with results, then the offer.
// Present full screen on a laptop or tablet, or Save PDF as a leave-behind.

const SLIDES = websiteSlides();

export default function WebsiteDeckPage() {
  useAdminAuth();
  const [current, setCurrent] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [stageRef, stageWidth] = useWidth<HTMLDivElement>();
  const total = SLIDES.length;
  const sel = SLIDES[current];
  const btn =
    'flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm font-bold text-gray-200 transition hover:border-gray-500 hover:text-white';

  return (
    <div className="mx-auto max-w-[1600px]">
      <style>{`
        @media print {
          @page { size: 1920px 1080px; margin: 0; }
          html, body { background: #111 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body > *:not(#deck-print) { display: none !important; }
          #deck-print { position: static !important; left: auto !important; }
          #deck-print > [data-slide] { break-after: page; }
        }
      `}</style>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-xl font-black text-white">Website slides</h1>
          <p className="text-xs font-semibold text-gray-500">Client sites, results and the $750 landing page offer. Wording lives in lib/website-deck.ts.</p>
        </div>
        <button type="button" onClick={() => window.print()} className={btn}>
          <Printer className="h-4 w-4" /> Save PDF
        </button>
        <button
          type="button"
          onClick={() => setPresenting(true)}
          className="flex items-center gap-2 rounded-lg bg-[#F46325] px-4 py-2 text-sm font-black text-white transition hover:bg-[#FF7B42]"
        >
          <Play className="h-4 w-4" /> Present
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
        <ol className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {SLIDES.map((s, i) => (
            <li key={s.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setCurrent(i)}
                className={`block overflow-hidden rounded-lg ring-2 transition ${i === current ? 'ring-[#F46325]' : 'ring-transparent hover:ring-gray-600'}`}
              >
                <Scaled width={170}>
                  <WebsiteSlide slide={s} index={i} total={total} />
                </Scaled>
              </button>
              <p className="mt-1 truncate text-[11px] font-bold text-gray-400">{s.label}</p>
            </li>
          ))}
        </ol>

        <div className="min-w-0">
          <div ref={stageRef} className="overflow-hidden rounded-xl border border-gray-800 shadow-2xl">
            {stageWidth > 0 && (
              <Scaled width={stageWidth}>
                <WebsiteSlide slide={sel} index={current} total={total} />
              </Scaled>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-gray-400">
            <button type="button" disabled={current === 0} onClick={() => setCurrent(current - 1)} className="flex items-center gap-1 font-semibold hover:text-white disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="font-semibold">{sel.label}</span>
            <button
              type="button"
              disabled={current >= total - 1}
              onClick={() => setCurrent(current + 1)}
              className="flex items-center gap-1 font-semibold hover:text-white disabled:opacity-30"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <div id="deck-print" aria-hidden style={{ position: 'fixed', left: -100000, top: 0 }}>
            {SLIDES.map((s, i) => (
              <div key={s.id} data-slide="">
                <WebsiteSlide slide={s} index={i} total={total} />
              </div>
            ))}
          </div>,
          document.body,
        )}

      {presenting && (
        <Presenter
          count={total}
          start={current}
          onClose={(at) => {
            setPresenting(false);
            setCurrent(at);
          }}
        >
          {(i) => <WebsiteSlide slide={SLIDES[i]} index={i} total={total} />}
        </Presenter>
      )}
    </div>
  );
}
