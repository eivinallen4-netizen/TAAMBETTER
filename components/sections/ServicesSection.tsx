import Link from 'next/link';
import { getServiceInfo } from '@/app/lib/services';
import Headline from '@/components/editorial/Headline';
import Icon, { serviceIconNames } from '@/components/editorial/Icon';
import Mascot from '@/components/editorial/Mascot';
import Reveal from '@/components/editorial/Reveal';
import Section, { type Tone } from '@/components/editorial/Section';

interface ServicesSectionProps {
  services: string[];
  showMoreLink?: boolean;
  tone?: Tone;
  index?: string;
}

/** Services as an index of oversized names; each row flips to outlined type on hover. */
export default function ServicesSection({ services, showMoreLink = true, tone = 'orange', index = '02' }: ServicesSectionProps) {
  return (
    <Section tone={tone} index={index} label="Services">
      <div className="grid grid-cols-12 gap-x-6 gap-y-10 mb-20 md:mb-28">
        <Headline text={'What\nwe do.'} outlineFrom={1} className="display-xl col-span-12 md:col-span-7" />
        <Reveal className="col-span-12 md:col-span-5 lg:col-span-4 lg:col-start-9 self-end">
          <p className="lede">
            We can&apos;t make your product great. You did that. We make the creative that shows it to the people
            who need to see it, with strategy, video, design and development under one roof.
          </p>
          {showMoreLink && (
            <Link href="/about" className="eyebrow link-line inline-block mt-8">
              More about us ↗
            </Link>
          )}
        </Reveal>
      </div>

      <ol className="relative border-t-2 rule">
        {/* Casting a line into the list. */}
        <Reveal className="absolute bottom-full right-0 -mb-10 w-36 md:w-52 hidden sm:block">
          <Mascot pose="fishing" size={208} className="w-full h-auto" />
        </Reveal>
        {services.map((service, i) => {
          const info = getServiceInfo(service);
          const icon = serviceIconNames[service.toLowerCase()] ?? 'strategy';
          return (
            <Reveal as="li" key={service} delay={i * 0.05} className="group border-b-2 rule">
              <div className="grid grid-cols-12 items-center gap-x-6 gap-y-4 py-8 md:py-10">
                <span className="col-span-2 md:col-span-1 eyebrow">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="col-span-10 md:col-span-6 display display-md hover-outline">
                  {info.name}
                </h3>
                <p className="col-span-10 col-start-3 md:col-span-4 md:col-start-auto text-base md:text-lg leading-relaxed font-medium">
                  {info.description}
                </p>
                <Icon
                  name={icon}
                  className="hidden md:block col-span-1 justify-self-end w-11 h-11 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-90"
                />
              </div>
            </Reveal>
          );
        })}
      </ol>
    </Section>
  );
}
