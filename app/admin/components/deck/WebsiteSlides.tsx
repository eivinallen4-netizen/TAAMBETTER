'use client';

import { BONUSES, CARE_PLAN, CASE_STUDIES, OFFER, OWNERSHIP, PAIN, type CaseStudy, type WebsiteSlideRef } from '@/lib/website-deck';
import { BrowserFrame, PhoneFrame } from './DeviceFrames';
import { Accent, Frame, INK, Kicker, ORANGE, outline } from './Slides';

// In-person website sales slides: the problem, two client sites with results, the offer,
// its bonuses and the care plan. Same 1920×1080 artboard and look as the contact deck.
// Copy lives in lib/website-deck.ts. Positions are inline styles so every value renders.

export interface WebsiteSlideProps {
  slide: WebsiteSlideRef;
  index: number;
  total: number;
}

const FOOTER = { client: 'Websites by TAAM' };
const contrast = (tone: WebsiteSlideRef['tone']) => (tone === 'orange' ? INK : ORANGE);

function PainSlide({ slide, index, total }: WebsiteSlideProps) {
  return (
    <Frame tone={slide.tone} deck={FOOTER} index={index} total={total}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/characters/phone.webp"
        alt=""
        className="pointer-events-none absolute object-contain"
        style={{ right: 110, bottom: 150, width: 380, filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.2))' }}
      />
      <div className="absolute" style={{ left: 96, top: 140, width: 1250 }}>
        <Kicker>{PAIN.kicker}</Kicker>
        <h2 className="mt-6 font-black uppercase leading-[0.92] tracking-[-0.02em]" style={{ fontSize: 132 }}>
          {PAIN.headline[0]}
          <br />
          <span style={outline(slide.tone, 4)}>{PAIN.headline[1]}</span>
        </h2>
        <p className="mt-12 font-bold leading-[1.2]" style={{ fontSize: 44, maxWidth: 1050 }}>
          {PAIN.line}
        </p>
      </div>
    </Frame>
  );
}

function CaseSlide({ slide, index, total, cs }: WebsiteSlideProps & { cs: CaseStudy }) {
  const long = cs.headline[1].length > 14;
  return (
    <Frame tone={slide.tone} deck={FOOTER} index={index} total={total}>
      <div className="absolute" style={{ left: 96, top: 96, width: 660 }}>
        <Kicker>{cs.client}</Kicker>
        <h2 className="mt-6 font-black uppercase leading-[0.92] tracking-[-0.02em]" style={{ fontSize: long ? 92 : 104, textWrap: 'balance' }}>
          {cs.headline[0]}
          <br />
          <span style={outline(slide.tone, long ? 3 : 4)}>{cs.headline[1]}</span>
        </h2>
        <ul className="mt-12">
          {cs.lines.map((l, i) => (
            <li key={i} className="border-t-[3px] border-white/30 py-6 font-bold leading-[1.2] last:border-b-[3px]" style={{ fontSize: 31 }}>
              {l}
            </li>
          ))}
        </ul>
      </div>
      <div className="absolute" style={{ right: 200, top: 130 }}>
        <BrowserFrame src={cs.desktop} url={cs.url} width={900} />
      </div>
      <div className="absolute" style={{ right: 80, top: 380 }}>
        <PhoneFrame src={cs.phone} width={280} />
      </div>
    </Frame>
  );
}

function OfferSlide({ slide, index, total }: WebsiteSlideProps) {
  const o = OFFER;
  return (
    <Frame tone={slide.tone} deck={FOOTER} index={index} total={total}>
      <Accent src="/brand/deck/mascot/laptop.webp" className="right-[96px] top-[80px] h-[230px] w-[300px]" />
      <div className="absolute" style={{ left: 96, right: 480, top: 80 }}>
        <Kicker>{o.name}</Kicker>
        <div className="mt-3 flex items-end gap-12">
          <p className="font-black leading-[0.85] tracking-[-0.04em]" style={{ fontSize: 220, ...outline(slide.tone, 6) }}>
            {o.price}
          </p>
          <p className="pb-4 font-black uppercase leading-[1.05]" style={{ fontSize: 44, maxWidth: 520 }}>
            {o.anchor}
          </p>
        </div>
      </div>
      <ul className="absolute grid grid-cols-3" style={{ left: 96, right: 96, top: 400, gap: 32 }}>
        {o.points.map((pt, k) => (
          <li key={k} className="flex flex-col justify-between rounded-[40px] bg-white/[0.1]" style={{ minHeight: 230, padding: 40, gap: 20 }}>
            <span className="font-black leading-none" style={{ fontSize: 52, ...outline(slide.tone, 3) }}>
              {String(k + 1).padStart(2, '0')}
            </span>
            <span className="font-black leading-[1.15]" style={{ fontSize: 34 }}>
              {pt}
            </span>
          </li>
        ))}
      </ul>
      <div className="absolute flex items-center rounded-[40px]" style={{ left: 96, right: 96, bottom: 130, padding: '36px 56px', gap: 36, background: contrast(slide.tone) }}>
        <span className="shrink-0 font-black uppercase tracking-[0.3em] text-white/60" style={{ fontSize: 22 }}>
          Our guarantee
        </span>
        <span className="font-black uppercase leading-[1.05]" style={{ fontSize: 40 }}>
          {o.guarantee}
        </span>
      </div>
    </Frame>
  );
}

function BonusSlide({ slide, index, total }: WebsiteSlideProps) {
  return (
    <Frame tone={slide.tone} deck={FOOTER} index={index} total={total}>
      <div className="absolute" style={{ left: 96, right: 96, top: 80 }}>
        <Kicker>Added to every Phone-Ringer Page</Kicker>
        <h2 className="mt-5 font-black uppercase leading-[0.9] tracking-[-0.02em]" style={{ fontSize: 112 }}>
          Plus <span style={outline(slide.tone)}>3 bonuses</span>
        </h2>
      </div>
      <div className="absolute grid grid-cols-3" style={{ left: 96, right: 96, top: 340, gap: 40 }}>
        {BONUSES.map((b, i) => (
          <div key={i} className="flex flex-col rounded-[40px] border-[3px] border-white/35" style={{ minHeight: 480, padding: 48 }}>
            <span className="font-black uppercase tracking-[0.2em] text-white/60" style={{ fontSize: 22 }}>
              Bonus {i + 1}
            </span>
            <p className="mt-5 font-black uppercase leading-[0.95] tracking-[-0.02em]" style={{ fontSize: 66 }}>
              {b.name}
            </p>
            <p className="mt-auto pt-8 font-bold leading-[1.2]" style={{ fontSize: 34 }}>
              {b.body}
            </p>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function OwnSlide({ slide, index, total }: WebsiteSlideProps) {
  const o = OWNERSHIP;
  return (
    <Frame tone={slide.tone} deck={FOOTER} index={index} total={total}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/deck/mascot/camera.webp"
        alt=""
        className="pointer-events-none absolute object-contain"
        style={{ left: 96, bottom: 140, width: 250, filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.2))' }}
      />
      <div className="absolute grid items-center" style={{ left: 96, right: 96, top: 96, bottom: 150, gridTemplateColumns: '720px 1fr', gap: 80 }}>
        <div style={{ alignSelf: 'start', paddingTop: 40 }}>
          <Kicker>{o.kicker}</Kicker>
          <h2 className="mt-6 whitespace-nowrap font-black uppercase leading-[0.9] tracking-[-0.02em]" style={{ fontSize: 118 }}>
            {o.headline[0]}
            <br />
            <span style={outline(slide.tone)}>{o.headline[1]}</span>
          </h2>
        </div>
        <ol>
          {o.lines.map((l, i) => (
            <li key={i} className="flex items-baseline border-t-[3px] border-white/30 last:border-b-[3px]" style={{ gap: 32, padding: '34px 0' }}>
              <span className="shrink-0 font-black text-white/50" style={{ width: 72, fontSize: 36 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-black leading-[1.1]" style={{ fontSize: 50 }}>
                {l}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Frame>
  );
}

function CareSlide({ slide, index, total }: WebsiteSlideProps) {
  const c = CARE_PLAN;
  return (
    <Frame tone={slide.tone} deck={FOOTER} index={index} total={total}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/characters/chill.webp"
        alt=""
        className="pointer-events-none absolute object-contain"
        style={{ right: 110, top: 80, width: 340, filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.2))' }}
      />
      <div className="absolute" style={{ left: 96, right: 480, top: 96 }}>
        <Kicker>{c.kicker}</Kicker>
        <p className="mt-4 flex items-baseline gap-8">
          <span className="font-black leading-[0.85] tracking-[-0.04em]" style={{ fontSize: 240, ...outline(slide.tone, 6) }}>
            {c.price}
          </span>
          <span className="font-black uppercase" style={{ fontSize: 64 }}>
            {c.per}
          </span>
        </p>
      </div>
      <ul className="absolute grid grid-cols-3" style={{ left: 96, right: 96, top: 460, gap: 40 }}>
        {c.points.map((p, i) => (
          <li key={i} className="border-t-[4px] border-white pt-6 font-black uppercase leading-tight tracking-wide" style={{ fontSize: 40 }}>
            {p}
          </li>
        ))}
      </ul>
      <div
        className="absolute inset-x-[96px] bottom-[120px] flex items-center justify-between gap-12 rounded-[40px] px-[56px] py-[44px]"
        style={{ background: contrast(slide.tone) }}
      >
        <div>
          <p className="text-[22px] font-black uppercase tracking-[0.3em] text-white/60">Next step</p>
          <p className="mt-3 text-[68px] font-black uppercase leading-[0.95] tracking-[-0.01em]">{c.cta}</p>
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

export function WebsiteSlide(props: WebsiteSlideProps) {
  const { id } = props.slide;
  if (id === 'pain') return <PainSlide {...props} />;
  if (id === 'offer') return <OfferSlide {...props} />;
  if (id === 'bonuses') return <BonusSlide {...props} />;
  if (id === 'own') return <OwnSlide {...props} />;
  if (id === 'care') return <CareSlide {...props} />;
  const cs = CASE_STUDIES.find((c) => `case:${c.id}` === id);
  return cs ? <CaseSlide {...props} cs={cs} /> : null;
}
