import type { ReactNode } from 'react';
import ContactCTA from '@/app/components/ContactCTA';
import Headline from '@/components/editorial/Headline';
import Reveal from '@/components/editorial/Reveal';
import type { Tone } from '@/components/editorial/Section';

interface CTASectionProps {
  /** Small line above the poster headline. */
  title: string;
  description?: string;
  email?: string;
  phone?: string;
  tone?: Tone;
  headline?: string;
  buttonLabel?: string;
  services?: string[];
  /** Short "what happens after you click" sequence, shown beside the copy. */
  nextSteps?: string[];
  /** Objections answered right beside the ask, so nobody leaves the page to find them. */
  faqs?: { q: string; a: ReactNode }[];
}

/** Closing poster: a giant two-line call, copy and a single action, off-axis. */
export default function CTASection({
  title,
  description,
  email,
  phone,
  tone = 'orange',
  headline = "Let's\ntalk.",
  buttonLabel = 'Get free recommendations',
  services,
  nextSteps,
  faqs,
}: CTASectionProps) {
  return (
    <section className={`tone-${tone} relative overflow-clip`}>
      <div className="gutter section-pad">
        <p className="eyebrow mb-10 max-w-md">{title}</p>
        <Headline text={headline} outlineFrom={1} className="display-mega" />

        <div className="grid grid-cols-12 gap-x-6 gap-y-14 mt-16 md:mt-24">
          {nextSteps && nextSteps.length > 0 && (
            <Reveal className="col-span-12 md:col-span-6 lg:col-span-5">
              <p className="eyebrow mb-6">What happens next</p>
              <ol className="border-t-2 rule">
                {nextSteps.map((item, i) => (
                  <li key={item} className="flex gap-6 border-b-2 rule py-5">
                    <span className="eyebrow pt-1">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-lg font-semibold leading-snug">{item}</span>
                  </li>
                ))}
              </ol>
            </Reveal>
          )}
          <Reveal className="col-span-12 md:col-span-6 md:col-start-7 lg:col-span-5 lg:col-start-8">
            {description && <p className="lede mb-10">{description}</p>}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
              <ContactCTA services={services} className="btn btn-solid">
                {buttonLabel} <span aria-hidden="true">↗</span>
              </ContactCTA>
              {phone && (
                <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="font-semibold link-line">
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="font-semibold link-line">
                  {email}
                </a>
              )}
            </div>
          </Reveal>
        </div>

        {faqs && faqs.length > 0 && (
          <div className="grid grid-cols-12 gap-x-6 gap-y-10 mt-24 md:mt-36">
            <Reveal className="col-span-12 lg:col-span-4">
              <p className="eyebrow mb-4">Before you call</p>
              <h3 className="display display-md">Questions we get asked.</h3>
            </Reveal>
            <div className="col-span-12 lg:col-span-8 border-t-2 rule">
              {faqs.map((f) => (
                <details key={f.q} className="group border-b-2 rule">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg md:text-xl font-bold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span aria-hidden="true" className="display text-2xl transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <div className="pb-7 pr-10 text-base md:text-lg leading-relaxed font-medium">{f.a}</div>
                </details>
              ))}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-5 pt-10">
                <ContactCTA services={services} className="btn btn-solid">
                  {buttonLabel} <span aria-hidden="true">↗</span>
                </ContactCTA>
                <p className="font-semibold">Question not here? Ask it on the call.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
