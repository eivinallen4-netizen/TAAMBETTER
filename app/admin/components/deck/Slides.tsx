'use client';

import type { CSSProperties, ReactNode } from 'react';
import { INTERESTS, type Interest } from '@/lib/interests';
import { INTEREST_IMAGES, money, type DeckData, type DeckOverrides, type SlideRef } from '@/lib/deck';

// The marketing-plan slides, drawn on a fixed 1920×1080 artboard so the editor, present mode,
// print and the .pptx export all match. Pass `edit` to make the text click-to-edit.
// House rule (CLAUDE.md): one idea per slide, a big headline, at most 3–4 short lines.

export const SLIDE_W = 1920;
export const SLIDE_H = 1080;

const ORANGE = '#F46325';
const INK = '#111111';

/** Most lines a list on a slide can grow to in the editor. */
const MAX_LINES = 4;

export interface SlideProps {
  deck: DeckData;
  slide: SlideRef;
  index: number;
  total: number;
  logoSrc?: string;
  edit?: (patch: DeckOverrides) => void;
}

/** Text that turns into an inline editor when the slide is editable. */
function E({
  value,
  onChange,
  className = '',
  style,
  multiline = false,
}: {
  value: string;
  onChange?: (v: string) => void;
  className?: string;
  style?: CSSProperties;
  multiline?: boolean;
}) {
  if (!onChange)
    return (
      <span className={className} style={style}>
        {value}
      </span>
    );
  return (
    <span
      key={value}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      data-edit=""
      className={className}
      style={style}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !multiline) {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === 'Escape') {
          e.currentTarget.textContent = value;
          e.currentTarget.blur();
        }
      }}
      onPaste={(e) => {
        e.preventDefault();
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
      }}
      onBlur={(e) => {
        const v = (e.currentTarget.innerText || '').replace(/[ \t]+/g, ' ').trim();
        if (v !== value) onChange(v);
      }}
    >
      {value}
    </span>
  );
}

/** Replaces item i of a list; clearing an item removes it. */
function setItem<T>(list: T[], i: number, next: T | null): T[] {
  return next === null ? list.filter((_, j) => j !== i) : list.map((x, j) => (j === i ? next : x));
}

/** "+ Add" button shown only while editing (left out of print and export via data-chrome). */
function AddItem({ onClick, label = 'Add line', className = 'mt-6' }: { onClick: () => void; label?: string; className?: string }) {
  return (
    <button
      type="button"
      data-chrome=""
      onClick={onClick}
      className={`${className} rounded-full border-2 border-dashed border-current px-6 py-2 text-[22px] font-bold opacity-50 hover:opacity-100`}
    >
      + {label}
    </button>
  );
}

/** The TAAM wordmark in white, as a plain image so it survives the .pptx export. */
function Wordmark({ height }: { height: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/deck/taam-wordmark-white.svg" alt="TAAM" style={{ height, width: (height * 1447.89) / 361.08 }} />;
}

function Frame({
  tone,
  children,
  deck,
  index,
  total,
  bare = false,
  footerLeft = 96,
}: {
  tone: SlideRef['tone'];
  children: ReactNode;
  deck: DeckData;
  index: number;
  total: number;
  bare?: boolean;
  /** Where the footer starts, so it clears an image on the left. */
  footerLeft?: number;
}) {
  return (
    <div className="relative overflow-hidden font-sans text-white" style={{ width: SLIDE_W, height: SLIDE_H, background: tone === 'orange' ? ORANGE : INK }}>
      {children}
      {!bare && (
        <div
          style={{ left: footerLeft }}
          className="absolute bottom-[48px] right-[96px] flex items-center justify-between text-[20px] font-bold uppercase tracking-[0.2em] text-white/70"
        >
          <Wordmark height={26} />
          <span className="truncate px-8">{deck.client}</span>
          <span>
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  );
}

/** Outlined display type (stroke painted under the fill, so Montserrat's overlaps don't show). */
const outline = (tone: SlideRef['tone'], width = 4): CSSProperties => ({
  color: tone === 'orange' ? ORANGE : INK,
  WebkitTextStroke: `${width}px #fff`,
  paintOrder: 'stroke fill',
});

function Kicker({ children }: { children: ReactNode }) {
  return <p className="text-[24px] font-black uppercase tracking-[0.3em] text-white/70">{children}</p>;
}

function Title({ children, size = 120 }: { children: ReactNode; size?: number }) {
  return (
    <h2 className="mt-5 font-black uppercase leading-[0.9] tracking-[-0.02em]" style={{ fontSize: size }}>
      {children}
    </h2>
  );
}

/** A small mascot accent. The pitch carries the slide; the character only adds a wink. */
function Accent({ src, className }: { src: string; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`pointer-events-none absolute object-contain ${className}`} style={{ filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.2))' }} />
  );
}

function titleSize(text: string, sizes: [number, number, number, number]) {
  const n = text.length;
  return n <= 10 ? sizes[0] : n <= 16 ? sizes[1] : n <= 26 ? sizes[2] : sizes[3];
}

// ---------- Slides ----------

function Cover({ deck, slide, logoSrc, edit, index, total }: SlideProps) {
  const size = titleSize(deck.client, [230, 176, 132, 96]);
  return (
    <Frame tone={slide.tone} deck={deck} index={index} total={total} bare>
      <Accent src={INTEREST_IMAGES.cover} className="bottom-[88px] right-[96px] w-[260px]" />
      <div className="absolute inset-[96px] flex flex-col justify-between gap-10">
        <div className="flex items-center gap-8">
          {logoSrc && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} alt="" className="h-[150px] w-[150px] rounded-[32px] bg-white object-contain p-4" />
              <span className="text-[60px] font-black text-white/60">×</span>
            </>
          )}
          <Wordmark height={64} />
        </div>
        <div>
          <Kicker>Prepared for</Kicker>
          <h1 className="mt-4 break-words font-black uppercase leading-[0.92] tracking-[-0.02em]" style={{ fontSize: size }}>
            <E value={deck.client} onChange={edit && ((client) => edit({ client }))} />
          </h1>
          <p className="mt-6 max-w-[1350px] font-black uppercase leading-[0.95]" style={{ fontSize: 110, ...outline(slide.tone, 4) }}>
            <E value={deck.coverLine} onChange={edit && ((coverLine) => edit({ coverLine }))} />
          </p>
          <p className="mt-10 max-w-[1100px] text-[40px] font-bold leading-snug">
            <E value={deck.coverNote} onChange={edit && ((coverNote) => edit({ coverNote }))} />
          </p>
          <p className="mt-6 text-[22px] font-bold uppercase tracking-[0.2em] text-white/60">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · taammarketing.com
          </p>
        </div>
      </div>
    </Frame>
  );
}

function Heard({ deck, slide, index, total, edit }: SlideProps) {
  return (
    <Frame tone={slide.tone} deck={deck} index={index} total={total}>
      <div className="absolute inset-[96px] bottom-[140px] grid grid-cols-[600px_1fr] items-center gap-[96px]">
        <div>
          <Kicker>What we heard</Kicker>
          <Title size={140}>
            Your
            <br />
            <span style={outline(slide.tone)}>goals</span>
          </Title>
        </div>
        <ol>
          {deck.goals.map((g, i) => (
            <li key={i} className="flex items-baseline gap-8 border-t-[3px] border-white/30 py-8 last:border-b-[3px]">
              <span className="w-[72px] shrink-0 text-[36px] font-black text-white/50">{String(i + 1).padStart(2, '0')}</span>
              <E
                value={g}
                multiline
                className="text-[52px] font-black leading-[1.1]"
                onChange={edit && ((v) => edit({ goals: setItem(deck.goals, i, v || null) }))}
              />
            </li>
          ))}
          {edit && deck.goals.length < MAX_LINES && <AddItem label="Add goal" onClick={() => edit({ goals: [...deck.goals, 'New goal'] })} />}
        </ol>
      </div>
    </Frame>
  );
}

function Plans({ deck, slide, index, total, edit }: SlideProps) {
  const setPlan = (i: number, p: Partial<DeckData['plans'][number]>) => edit?.({ plans: deck.plans.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  return (
    <Frame tone={slide.tone} deck={deck} index={index} total={total}>
      <div className="absolute inset-x-[96px] top-[80px]">
        <Kicker>Plans for {deck.client}</Kicker>
        <Title size={104}>
          Choose your <span style={outline(slide.tone)}>plan</span>
        </Title>
      </div>
      <div className="absolute inset-x-[96px] bottom-[130px] top-[320px] grid grid-cols-3 gap-[40px]">
        {deck.plans.map((p, i) => {
          const pick = p.id === deck.recommended;
          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-[40px] px-[48px] py-[44px] ${pick ? 'bg-white text-[#111]' : 'border-[3px] border-white/35'}`}
              style={pick ? { boxShadow: '0 30px 80px rgba(0,0,0,0.35)' } : undefined}
            >
              {pick && (
                <span
                  className="absolute -top-[26px] left-[48px] rounded-full px-6 py-2 text-[22px] font-black uppercase tracking-[0.18em] text-white"
                  style={{ background: slide.tone === 'orange' ? INK : ORANGE }}
                >
                  Our pick for you
                </span>
              )}
              <p className="text-[34px] font-black uppercase tracking-[0.12em]">
                <E value={p.name} onChange={edit && ((name) => setPlan(i, { name }))} />
              </p>
              <p className="mt-2 flex items-baseline gap-3 whitespace-nowrap">
                <E
                  value={money(p.price)}
                  className="text-[96px] font-black leading-none tracking-[-0.03em]"
                  onChange={edit && ((v) => setPlan(i, { price: Number(v.replace(/[^0-9.]/g, '')) || p.price }))}
                />
                <span className={`text-[26px] font-bold ${pick ? 'text-black/50' : 'text-white/60'}`}>{deck.cadence}</span>
              </p>
              <p className={`mt-3 text-[30px] font-bold leading-snug ${pick ? 'text-[#F46325]' : ''}`}>
                <E value={p.tagline} onChange={edit && ((tagline) => setPlan(i, { tagline }))} />
              </p>
              <ul className={`mt-6 space-y-4 border-t-[3px] pt-6 ${pick ? 'border-black/10' : 'border-white/25'}`}>
                {p.bullets.map((b, k) => (
                  <li key={k} className="flex gap-4 text-[28px] font-semibold leading-snug">
                    <span className={pick ? 'text-[#F46325]' : 'text-white/60'}>●</span>
                    <E value={b} onChange={edit && ((v) => setPlan(i, { bullets: setItem(p.bullets, k, v || null) }))} />
                  </li>
                ))}
              </ul>
              {edit && p.bullets.length < MAX_LINES && (
                <AddItem className="mt-5 self-start" onClick={() => setPlan(i, { bullets: [...p.bullets, 'New line'] })} />
              )}
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

function InterestSlide({ deck, slide, index, total, edit, interest }: SlideProps & { interest: Interest }) {
  const copy = deck.interestCopy[interest];
  const set = (p: Partial<typeof copy>) => edit?.({ interestCopy: { ...deck.interestCopy, [interest]: { ...copy, ...p } } });
  const label = INTERESTS.find((x) => x.value === interest)?.label ?? '';
  return (
    <Frame tone={slide.tone} deck={deck} index={index} total={total}>
      <Accent src={INTEREST_IMAGES[interest]} className="right-[96px] top-[80px] h-[230px] w-[300px]" />
      <div className="absolute left-[96px] right-[440px] top-[96px]">
        <Kicker>{label}</Kicker>
        <h2 className="mt-5 text-[140px] font-black uppercase leading-[0.9] tracking-[-0.02em]" style={{ textWrap: 'balance' }}>
          <E value={copy.headline} onChange={edit && ((headline) => set({ headline }))} />
        </h2>
        <p className="mt-8 text-[44px] font-bold leading-[1.2]" style={{ textWrap: 'balance' }}>
          <E value={copy.body} onChange={edit && ((body) => set({ body }))} />
        </p>
      </div>
      <ul className="absolute inset-x-[96px] bottom-[140px] grid grid-flow-col auto-cols-fr gap-[40px]">
        {copy.points.map((pt, k) => (
          <li key={k} className="flex min-h-[210px] flex-col justify-between gap-6 rounded-[40px] bg-white/[0.1] p-[44px]">
            <span className="text-[56px] font-black leading-none" style={outline(slide.tone, 3)}>
              {String(k + 1).padStart(2, '0')}
            </span>
            <E value={pt} className="text-[38px] font-black leading-[1.1]" onChange={edit && ((v) => set({ points: setItem(copy.points, k, v || null) }))} />
          </li>
        ))}
      </ul>
      {edit && copy.points.length < MAX_LINES && (
        <div className="absolute right-[96px] top-[330px]">
          <AddItem className="" label="Add point" onClick={() => set({ points: [...copy.points, 'New point'] })} />
        </div>
      )}
    </Frame>
  );
}

function Compare({ deck, slide, index, total, edit }: SlideProps) {
  const col = deck.plans.findIndex((p) => p.id === deck.recommended);
  const setRow = (r: number, row: DeckData['compare'][number] | null) => edit?.({ compare: setItem(deck.compare, r, row) });
  const cell = 'px-8 py-[24px] text-center';
  const hi = (i: number) => (i === col ? 'bg-white text-[#111]' : '');
  return (
    <Frame tone={slide.tone} deck={deck} index={index} total={total}>
      <div className="absolute inset-x-[96px] top-[80px]">
        <Kicker>Side by side</Kicker>
        <Title size={104}>
          Compare <span style={outline(slide.tone)}>plans</span>
        </Title>
      </div>
      <table className="absolute left-[96px] top-[330px] w-[1728px] border-collapse text-[34px]">
        <thead>
          <tr>
            <th className="w-[620px]" />
            {deck.plans.map((p, i) => (
              <th key={p.id} className={`${cell} rounded-t-[28px] text-[28px] font-black uppercase tracking-[0.12em] ${hi(i)}`}>
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t-[3px] border-white/30">
            <td className="py-[24px] pr-8 font-bold">Price {deck.cadence}</td>
            {deck.plans.map((p, i) => (
              <td key={p.id} className={`${cell} text-[42px] font-black ${hi(i)}`}>
                {money(p.price)}
              </td>
            ))}
          </tr>
          {deck.compare.map((row, r) => (
            <tr key={r} className="border-t-[3px] border-white/30">
              <td className="py-[24px] pr-8 font-bold">
                <E value={row.label} onChange={edit && ((label) => setRow(r, label ? { ...row, label } : null))} />
              </td>
              {row.values.map((v, i) => (
                <td key={i} className={`${cell} font-bold ${hi(i)} ${r === deck.compare.length - 1 && i === col ? 'rounded-b-[28px]' : ''}`}>
                  <E
                    value={v}
                    onChange={edit && ((nv) => setRow(r, { ...row, values: row.values.map((x, j) => (j === i ? nv || '—' : x)) as [string, string, string] }))}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {edit && deck.compare.length < 5 && (
        <div className="absolute right-[96px] top-[170px]">
          <AddItem className="" label="Add row" onClick={() => edit({ compare: [...deck.compare, { label: 'New row', values: ['—', '—', '—'] }] })} />
        </div>
      )}
    </Frame>
  );
}

function Bonuses({ deck, slide, index, total, edit }: SlideProps) {
  const setBonus = (i: number, p: Partial<DeckData['bonuses'][number]>) => edit?.({ bonuses: deck.bonuses.map((b, j) => (j === i ? { ...b, ...p } : b)) });
  return (
    <Frame tone={slide.tone} deck={deck} index={index} total={total}>
      <div className="absolute inset-x-[96px] top-[80px]">
        <Kicker>Contract bonuses</Kicker>
        <Title size={104}>
          Stay longer, <span style={outline(slide.tone)}>get more</span>
        </Title>
      </div>
      <div className="absolute inset-x-[96px] top-[340px] grid grid-cols-3 gap-[40px]">
        {deck.bonuses.map((b, i) => (
          <div key={i} className="flex min-h-[460px] flex-col rounded-[40px] border-[3px] border-white/35 p-[48px]">
            <p className="text-[92px] font-black uppercase leading-[0.9] tracking-[-0.02em]">
              <E value={b.term} onChange={edit && ((term) => setBonus(i, { term }))} />
            </p>
            <p className="mt-5 text-[22px] font-black uppercase tracking-[0.2em] text-white/60">
              <E value={b.who} onChange={edit && ((who) => setBonus(i, { who }))} />
            </p>
            <p className="mt-auto pt-8 text-[36px] font-bold leading-[1.2]">
              <E value={b.body} multiline onChange={edit && ((body) => setBonus(i, { body }))} />
            </p>
          </div>
        ))}
      </div>
      <p className="absolute inset-x-[96px] bottom-[110px] text-[21px] font-medium text-white/60">
        <E value={deck.bonusNote} onChange={edit && ((bonusNote) => edit({ bonusNote }))} />
      </p>
    </Frame>
  );
}

function Billing({ deck, slide, index, total, edit }: SlideProps) {
  const plan = deck.plans.find((p) => p.id === deck.recommended) ?? deck.plans[1];
  return (
    <Frame tone={slide.tone} deck={deck} index={index} total={total}>
      <div className="absolute inset-[96px] bottom-[140px] grid grid-cols-[1fr_600px] items-center gap-[96px]">
        <div>
          <Kicker>Simple and predictable</Kicker>
          <Title size={112}>
            How billing <span style={outline(slide.tone)}>works</span>
          </Title>
          <ul className="mt-14">
            {deck.billing.map((b, i) => (
              <li key={i} className="border-t-[3px] border-white/30 py-7 text-[44px] font-black leading-tight last:border-b-[3px]">
                <E value={b} onChange={edit && ((v) => edit({ billing: setItem(deck.billing, i, v || null) }))} />
              </li>
            ))}
          </ul>
          {edit && deck.billing.length < MAX_LINES && <AddItem onClick={() => edit({ billing: [...deck.billing, 'New line'] })} />}
        </div>
        <div className="flex flex-col gap-[40px]">
          <div className="rounded-[40px] bg-white p-[52px] text-[#111]">
            <p className="text-[200px] font-black leading-[0.8] tracking-[-0.04em] text-[#F46325]">13</p>
            <p className="mt-6 text-[36px] font-black uppercase tracking-wide">payments a year</p>
          </div>
          <div className="rounded-[40px] border-[3px] border-white/40 p-[44px]">
            <p className="text-[22px] font-black uppercase tracking-[0.2em] text-white/60">{plan.name}, split in two</p>
            <p className="mt-3 text-[68px] font-black leading-none tracking-[-0.02em]">2 × {money(plan.price / 2)}</p>
            <p className="mt-3 text-[28px] font-bold text-white/80">every 2 weeks</p>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function PromiseSlide({ deck, slide, index, total, edit }: SlideProps) {
  return (
    <Frame tone={slide.tone} deck={deck} index={index} total={total}>
      <div className="absolute inset-x-[96px] top-[96px]">
        <Kicker>Our promise</Kicker>
        <p className="mt-6 max-w-[1600px] text-[112px] font-black uppercase leading-[0.92] tracking-[-0.02em]">
          <E value={deck.promiseLead} multiline onChange={edit && ((promiseLead) => edit({ promiseLead }))} />
        </p>
        <p className="mt-8 text-[32px] font-semibold text-white/85">
          <E value={deck.promiseNote} onChange={edit && ((promiseNote) => edit({ promiseNote }))} />
        </p>
      </div>
      <ul className="absolute inset-x-[96px] top-[530px] grid grid-cols-3 gap-[40px]">
        {deck.promise.map((p, i) => (
          <li key={i} className="border-t-[4px] border-white pt-6 text-[36px] font-black uppercase leading-tight tracking-wide">
            <E value={p} onChange={edit && ((v) => edit({ promise: setItem(deck.promise, i, v || null) }))} />
          </li>
        ))}
      </ul>
      <Accent src="/characters/peek.webp" className="bottom-[298px] left-[865px] w-[190px]" />
      <div
        className="absolute inset-x-[96px] bottom-[120px] flex items-center justify-between gap-12 rounded-[40px] px-[56px] py-[44px]"
        style={{ background: slide.tone === 'orange' ? INK : ORANGE }}
      >
        <div>
          <p className="text-[22px] font-black uppercase tracking-[0.3em] text-white/60">Next step</p>
          <p className="mt-3 text-[68px] font-black uppercase leading-[0.95] tracking-[-0.01em]">
            <E value={deck.cta} onChange={edit && ((cta) => edit({ cta }))} />
          </p>
        </div>
        <p className="shrink-0 text-right text-[34px] font-black leading-snug">
          702-997-6813
          <br />
          <span className="text-[28px] font-bold text-white/80">info@taammarketing.com</span>
        </p>
      </div>
    </Frame>
  );
}

export function Slide(props: SlideProps) {
  const { id } = props.slide;
  if (id === 'cover') return <Cover {...props} />;
  if (id === 'heard') return <Heard {...props} />;
  if (id === 'plans') return <Plans {...props} />;
  if (id === 'compare') return <Compare {...props} />;
  if (id === 'bonuses') return <Bonuses {...props} />;
  if (id === 'billing') return <Billing {...props} />;
  if (id === 'promise') return <PromiseSlide {...props} />;
  return <InterestSlide {...props} interest={id.slice('interest:'.length) as Interest} />;
}
