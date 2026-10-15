import type { Metadata } from 'next';
import siteContent from '../content/siteContent.json';
import PageHero from '@/components/sections/PageHero';
import CTASection from '@/components/sections/CTASection';
import Section from '@/components/editorial/Section';
import WorkGrid from './WorkGrid';

export const metadata: Metadata = {
  title: 'Work',
  description: 'Case studies from TAAM: creative that made real customers say WOW, for businesses that were already great at what they do.',
  alternates: {
    canonical: 'https://taammarketing.com/work',
  },
};

export default function Work() {
  const content = siteContent;
  const hero = content.hero.work;
  const publishedProjects = content.projects.filter((p) => p.published !== false);

  return (
    <>
      <PageHero eyebrow="Selected work" title={hero.title} outlineFrom={2} size="lg" subtitle={hero.subtitle} />

      <Section tone="ink" index="01" label="Case studies">
        <WorkGrid projects={publishedProjects} />
      </Section>

      <CTASection
        title="Your business could be next."
        headline={'Your\nturn.'}
        description="Tell us the goals you set. We'll see if we can give you better marketing, or refer you to someone who can."
      />
    </>
  );
}
