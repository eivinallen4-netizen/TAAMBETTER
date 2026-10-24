import type { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/components/sections/PageHero';
import Section from '@/components/editorial/Section';
import Headline from '@/components/editorial/Headline';
import Mascot from '@/components/editorial/Mascot';
import Reveal from '@/components/editorial/Reveal';
import Arrow from '@/components/editorial/Arrow';
import { CAREER_ROLES } from '@/app/lib/careers';

export const metadata: Metadata = {
  title: 'Careers at TAAM | Senior Closer, Appointment Setter & Videographer',
  description:
    'TAAM is hiring a senior closer, a senior appointment setter and a senior videographer in Las Vegas. Senior roles only: we hire people who already do the job well.',
  alternates: { canonical: '/careers' },
};

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title={'Join\nthe\nteam.'}
        outlineFrom={2}
        subtitle="Three open seats: a closer, an appointment setter and a videographer. All senior. If you're already great at the job, we want to talk."
        actions={
          <a href="#roles" className="btn btn-solid">
            See the roles <Arrow dir="right" className="rotate-90" />
          </a>
        }
      />

      <Section tone="ink" index="01" label="Senior only">
        <div className="grid grid-cols-12 gap-x-6 gap-y-14 items-end">
          <div className="col-span-12 lg:col-span-7">
            <Headline text={"We can't\ntrain you\nyet."} outlineFrom={2} className="display-lg" />
          </div>
          <Reveal className="col-span-12 md:col-span-8 lg:col-span-5">
            <p className="lede text-[color:var(--tone-muted)]">
              We&apos;re a hungry team growing fast, and we don&apos;t have a training program yet. So every seat is
              senior: you walk in knowing the job, with numbers or a reel to prove it, and you run with it on day one.
            </p>
          </Reveal>
        </div>
      </Section>

      <Section tone="orange" index="02" label="Open roles" id="roles" className="scroll-mt-20">
        <ul className="border-t-2 rule">
          {CAREER_ROLES.map((role, i) => (
            <li key={role.slug} className="border-b-2 rule">
              <Link href={`/careers/${role.slug}`} className="group grid grid-cols-12 items-center gap-x-6 gap-y-4 py-10 md:py-14">
                <span className="eyebrow col-span-12 md:col-span-1">{String(i + 1).padStart(2, '0')}</span>
                <div className="col-span-9 md:col-span-7">
                  <h2 className="display display-md hover-outline">{role.title}</h2>
                  <p className="mt-4 max-w-xl text-lg font-semibold leading-snug">{role.summary}</p>
                  <p className="eyebrow mt-5 opacity-85">
                    Senior · {role.experience} · {role.location}
                  </p>
                  <p className="mt-2 text-sm font-semibold opacity-85">{role.pay}</p>
                </div>
                <div className="col-span-3 md:col-span-2 flex justify-center">
                  <Mascot pose={role.pose} size={160} className="w-20 md:w-32 h-auto transition-transform duration-500 group-hover:-rotate-6" />
                </div>
                <span className="col-span-12 md:col-span-2 md:justify-self-end btn btn-ghost !py-3 !px-5">
                  Apply <Arrow />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-12 max-w-xl font-semibold">
          Not one of these, but senior at what you do? Email{' '}
          <a href="mailto:info@taammarketing.com" className="link-line">info@taammarketing.com</a> with your best work.
        </p>
      </Section>
    </>
  );
}
