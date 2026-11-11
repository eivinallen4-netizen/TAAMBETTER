'use client';

import type { ReactNode } from 'react';
import { BONUSES, CARE_PLAN, CASE_STUDIES, OFFER, OWNERSHIP, PAIN, type CaseStudy, type WebsiteSlideRef } from '@/lib/website-deck';
import { BrowserFrame, PhoneFrame } from './DeviceFrames';
import { INK, Kicker, ORANGE, Wordmark, outline } from './Slides';

// Portrait (1080×1920) versions of the website sales slides, for showing on a phone held upright.
// Same copy as the landscape deck (lib/website-deck.ts). Sizes are inline styles so every value renders.

export const PHONE_W = 1080;
export const PHONE_H = 1920;
const PAD = 72;

export interface PhoneSlideProps {
  slide: WebsiteSlideRef;
  index: number;
  total: number;
}

const contrast = (tone: WebsiteSlideRef['tone']) => (tone === 'orange' ? INK : ORANGE);

function PFrame({ tone, index, total, children }: { tone: WebsiteSlideRef['tone']; index: number; total: number; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden font-sans text-white" style={{ width: PHONE_W, height: PHONE_H, background: tone === 'orange' ? ORANGE : INK }}>
      {children}
      <div
        className="absolute flex items-center justify-between font-bold uppercase tracking-[0.2em] text-white/70"
        style={{ left: PAD, right: PAD, bottom: 60, fontSize: 22 }}
      >
        <Wordmark height={30} />
        <span>
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

function Mascot({ src, style }: { src: string; style: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="pointer-events-none absolute object-contain" style={{ filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.2))', ...style }} />
  );
}

const H = ({ children, size }: { children: ReactNode; size: number }) => (
  <h2 className="mt-6 font-black uppercase leading-[0.92] tracking-[-0.02em]" style={{ fontSize: size }}>
    {children}
  </h2>
);

function Pain({ slide, index, total }: PhoneSlideProps) {
  return (
    <PFrame tone={slide.tone} index={index} total={total}>
      <div className="absolute" style={{ left: PAD, right: PAD, top: 220 }}>
        <Kicker>{PAIN.kicker}</Kicker>
        <H size={128}>
          {PAIN.headline[0]}
          <br />
          <span style={outline(slide.tone, 4)}>{PAIN.headline[1]}</span>
        </H>
        <p className="font-bold leading-[1.2]" style={{ marginTop: 56, fontSize: 50 }}>
          {PAIN.line}
        </p>
      </div>
      <Mascot src="/characters/phone.webp" style={{ right: 80, bottom: 170, width: 460 }} />
    </PFrame>
  );
}

function Case({ slide, index, total, cs }: PhoneSlideProps & { cs: CaseStudy }) {
  return (
    <PFrame tone={slide.tone} index={index} total={total}>
      <div className="absolute" style={{ left: PAD, right: PAD, top: 110 }}>
        <Kicker>{cs.client}</Kicker>
        <H size={112}>
          {cs.headline[0]}
          <br />
          <span style={outline(slide.tone, 4)}>{cs.headline[1]}</span>
        </H>
      </div>
      <div className="absolute" style={{ left: PAD - 10, top: 560 }}>
        <BrowserFrame src={cs.desktop} url={cs.url} width={770} />
      </div>
      <div className="absolute" style={{ right: 50, top: 760 }}>
        <PhoneFrame src={cs.phone} width={250} />
      </div>
      <ul className="absolute" style={{ left: PAD, right: PAD, top: 1330 }}>
        {cs.lines.map((l, i) => (
          <li key={i} className="border-t-[3px] border-white/30 font-bold leading-[1.2] last:border-b-[3px]" style={{ fontSize: 38, padding: '22px 0' }}>
            {l}
          </li>
        ))}
      </ul>
    </PFrame>
  );
}

function Offer({ slide, index, total }: PhoneSlideProps) {
  const o = OFFER;
  return (
    <PFrame tone={slide.tone} index={index} total={total}>
      <Mascot src="/brand/deck/mascot/laptop.webp" style={{ right: 60, top: 600, width: 270, height: 200 }} />
      <div className="absolute" style={{ left: PAD, right: PAD, top: 110 }}>
        <Kicker>{o.name}</Kicker>
        <p className="font-black leading-[0.85] tracking-[-0.04em]" style={{ marginTop: 40, fontSize: 300, ...outline(slide.tone, 7) }}>
          {o.price}
        </p>
        <p className="font-black uppercase leading-[1.05]" style={{ marginTop: 36, fontSize: 56 }}>
          {o.anchor}
        </p>
      </div>
      <ul className="absolute flex flex-col" style={{ left: PAD, right: PAD, top: 820, gap: 24 }}>
        {o.points.map((pt, k) => (
          <li key={k} className="flex items-center rounded-[36px] bg-white/[0.1]" style={{ padding: '34px 40px', gap: 32 }}>
            <span className="shrink-0 font-black leading-none" style={{ fontSize: 56, ...outline(slide.tone, 3) }}>
              {String(k + 1).padStart(2, '0')}
            </span>
            <span className="font-black leading-[1.15]" style={{ fontSize: 38 }}>
              {pt}
            </span>
          </li>
        ))}
      </ul>
      <div className="absolute rounded-[40px]" style={{ left: PAD, right: PAD, bottom: 150, padding: '40px 48px', background: contrast(slide.tone) }}>
        <p className="font-black uppercase tracking-[0.3em] text-white/60" style={{ fontSize: 22 }}>
          Our guarantee
        </p>
        <p className="font-black uppercase leading-[1.05]" style={{ marginTop: 14, fontSize: 48 }}>
          {o.guarantee}
        </p>
      </div>
    </PFrame>
  );
}

function Bonuses({ slide, index, total }: PhoneSlideProps) {
  return (
    <PFrame tone={slide.tone} index={index} total={total}>
      <div className="absolute" style={{ left: PAD, right: PAD, top: 110 }}>
        <Kicker>Added to every Phone-Ringer Page</Kicker>
        <H size={128}>
          Plus
          <br />
          <span style={outline(slide.tone)}>3 bonuses</span>
        </H>
      </div>
      <div className="absolute flex flex-col" style={{ left: PAD, right: PAD, top: 520, gap: 32 }}>
        {BONUSES.map((b, i) => (
          <div key={i} className="rounded-[40px] border-[3px] border-white/35" style={{ padding: '40px 44px' }}>
            <span className="font-black uppercase tracking-[0.2em] text-white/60" style={{ fontSize: 22 }}>
              Bonus {i + 1}
            </span>
            <p className="font-black uppercase leading-[0.95] tracking-[-0.02em]" style={{ marginTop: 12, fontSize: 66 }}>
              {b.name}
            </p>
            <p className="font-bold leading-[1.2]" style={{ marginTop: 18, fontSize: 36 }}>
              {b.body}
            </p>
          </div>
        ))}
      </div>
    </PFrame>
  );
}

function Own({ slide, index, total }: PhoneSlideProps) {
  const o = OWNERSHIP;
  return (
    <PFrame tone={slide.tone} index={index} total={total}>
      <div className="absolute" style={{ left: PAD, right: PAD, top: 160 }}>
        <Kicker>{o.kicker}</Kicker>
        <H size={150}>
          {o.headline[0]}
          <br />
          <span style={outline(slide.tone)}>{o.headline[1]}</span>
        </H>
      </div>
      <ol className="absolute" style={{ left: PAD, right: PAD, top: 640 }}>
        {o.lines.map((l, i) => (
          <li key={i} className="flex items-baseline border-t-[3px] border-white/30 last:border-b-[3px]" style={{ gap: 28, padding: '34px 0' }}>
            <span className="shrink-0 font-black text-white/50" style={{ width: 64, fontSize: 36 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="font-black leading-[1.15]" style={{ fontSize: 50 }}>
              {l}
            </span>
          </li>
        ))}
      </ol>
      <Mascot src="/brand/deck/mascot/camera.webp" style={{ right: 80, bottom: 170, width: 340 }} />
    </PFrame>
  );
}

function Care({ slide, index, total }: PhoneSlideProps) {
  const c = CARE_PLAN;
  return (
    <PFrame tone={slide.tone} index={index} total={total}>
      <Mascot src="/characters/chill.webp" style={{ right: 60, top: 520, width: 340 }} />
      <div className="absolute" style={{ left: PAD, right: PAD, top: 110 }}>
        <Kicker>{c.kicker}</Kicker>
        <p className="font-black leading-[0.85] tracking-[-0.04em]" style={{ marginTop: 40, fontSize: 300, ...outline(slide.tone, 7) }}>
          {c.price}
        </p>
        <p className="font-black uppercase" style={{ marginTop: 20, fontSize: 72 }}>
          {c.per}
        </p>
      </div>
      <ul className="absolute" style={{ left: PAD, right: PAD, top: 920 }}>
        {c.points.map((p, i) => (
          <li key={i} className="border-t-[4px] border-white font-black uppercase leading-tight tracking-wide" style={{ fontSize: 46, padding: '26px 0' }}>
            {p}
          </li>
        ))}
      </ul>
      <div className="absolute rounded-[40px]" style={{ left: PAD, right: PAD, bottom: 150, padding: '44px 48px', background: contrast(slide.tone) }}>
        <p className="font-black uppercase tracking-[0.3em] text-white/60" style={{ fontSize: 22 }}>
          Next step
        </p>
        <p className="font-black uppercase leading-[0.95] tracking-[-0.01em]" style={{ marginTop: 12, fontSize: 76 }}>
          {c.cta}
        </p>
        <p className="font-black leading-snug" style={{ marginTop: 28, fontSize: 40 }}>
          702-997-6813
          <br />
          <span className="font-bold text-white/80" style={{ fontSize: 32 }}>
            info@taammarketing.com
          </span>
        </p>
      </div>
    </PFrame>
  );
}

export function PhoneWebsiteSlide(props: PhoneSlideProps) {
  const { id } = props.slide;
  if (id === 'pain') return <Pain {...props} />;
  if (id === 'offer') return <Offer {...props} />;
  if (id === 'bonuses') return <Bonuses {...props} />;
  if (id === 'own') return <Own {...props} />;
  if (id === 'care') return <Care {...props} />;
  const cs = CASE_STUDIES.find((c) => `case:${c.id}` === id);
  return cs ? <Case {...props} cs={cs} /> : null;
}
