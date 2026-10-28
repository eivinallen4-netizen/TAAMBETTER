import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHero from '@/components/sections/PageHero';
import Section from '@/components/editorial/Section';
import Headline from '@/components/editorial/Headline';
import Mascot from '@/components/editorial/Mascot';
import Reveal from '@/components/editorial/Reveal';
import Arrow from '@/components/editorial/Arrow';
import { CAREER_ROLES, getRole } from '@/app/lib/careers';
import ApplicationForm from '../ApplicationForm';
import { SITE_URL } from '@/lib/site-url';

export function generateStaticParams() {
  return CAREER_ROLES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const role = getRole(slug);
  if (!role) return { title: 'Role not found' };
  return {
    title: `Senior ${role.title} | Careers at TAAM`,
    description: `${role.summary} Senior role, ${role.location}.`,
    alternates: { canonical: `/careers/${role.slug}` },
  };
}

export default async function CareerRolePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const role = getRole(slug);
  if (!role) notFound();

  const jobPosting = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: `Senior ${role.title}`,
    description: [role.summary, ...role.work, ...role.bring].join(' '),
    datePosted: '2026-10-23',
    employmentType: 'FULL_TIME',
    ...(role.slug === 'videographer' && {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: { '@type': 'QuantitativeValue', minValue: 20, unitText: 'HOUR' },
      },
    }),
    hiringOrganization: { '@type': 'Organization', name: 'TAAM', sameAs: SITE_URL },
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: 'Las Vegas', addressRegion: 'NV', addressCountry: 'US' },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPosting) }} />

      <PageHero
        eyebrow="Careers — Open role"
        title={role.headline}
        outlineFrom={1}
        size="lg"
        subtitle={role.summary}
        actions={
          <a href="#apply" className="btn btn-solid">
            Apply now <Arrow dir="right" className="rotate-90" />
          </a>
        }
        note={
          <>
            <span className="eyebrow block">
              {role.type} · {role.experience} · {role.location}
            </span>
            <span className="mt-3 block">{role.pay}</span>
          </>
        }
      />

      <Section tone="ink" index="01" label="The job">
        <div className="grid grid-cols-12 gap-x-6 gap-y-16">
          <Reveal className="col-span-12 md:col-span-6">
            <h2 className="display display-md mb-8">What you&apos;ll do</h2>
            <List items={role.work} />
          </Reveal>
          <Reveal className="col-span-12 md:col-span-6" delay={0.1}>
            <h2 className="display display-md mb-8 outline-type">What you bring</h2>
            <List items={role.bring} />
          </Reveal>
        </div>
        <div className="mt-20 md:mt-28 flex flex-col md:flex-row md:items-end justify-between gap-10">
          <Headline text={"Senior\nonly."} outlineFrom={1} className="display-lg" />
          <p className="lede max-w-md text-[color:var(--tone-muted)]">
            We can&apos;t train yet. This seat is for someone who already does this job well and can prove it.
          </p>
        </div>
      </Section>

      <Section tone="orange" index="02" label="Apply" id="apply" className="scroll-mt-20">
        <div className="grid grid-cols-12 gap-x-6 gap-y-14">
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <h2 className="display display-md mb-6">Apply for {role.title.toLowerCase()}.</h2>
              <p className="lede mb-10">Show us the numbers. Skip the cover letter.</p>
              <Mascot pose={role.pose} size={240} className="mascot-bob w-36 lg:w-56 h-auto" />
            </div>
          </div>
          <div className="col-span-12 lg:col-span-7 lg:col-start-6">
            <ApplicationForm
              role={role.slug}
              roleTitle={role.title}
              linkLabel={role.linkLabel}
              proofLabel={role.proofLabel}
              proofPlaceholder={role.proofPlaceholder}
            />
          </div>
        </div>
        <div className="mt-20 border-t-2 rule pt-8 flex flex-wrap gap-x-8 gap-y-3">
          <span className="eyebrow">Other roles</span>
          {CAREER_ROLES.filter((r) => r.slug !== role.slug).map((r) => (
            <Link key={r.slug} href={`/careers/${r.slug}`} className="font-semibold link-line">
              {r.title} <Arrow />
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="border-t-2 rule">
      {items.map((item, i) => (
        <li key={item} className="flex gap-6 border-b-2 rule py-5">
          <span className="eyebrow pt-1">{String(i + 1).padStart(2, '0')}</span>
          <span className="text-lg font-semibold leading-snug">{item}</span>
        </li>
      ))}
    </ul>
  );
}
