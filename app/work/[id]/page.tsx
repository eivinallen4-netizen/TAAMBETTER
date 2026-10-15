import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import siteContent from '../../content/siteContent.json';
import { getCtaCopy, getServicesForCategory } from '../../lib/cta';
import { stripHtml } from '@/lib/text-utils';
import PageHero from '@/components/sections/PageHero';
import CTASection from '@/components/sections/CTASection';
import Section from '@/components/editorial/Section';
import Headline from '@/components/editorial/Headline';
import MediaCard from '@/components/editorial/MediaCard';
import Reveal from '@/components/editorial/Reveal';
import ReelStrip from './ReelStrip';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = siteContent.projects.find((p) => String(p.id) === id);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://taammarketing.com";
  const description = stripHtml(project.description).substring(0, 160);

  return {
    title: `${project.title} | TAAM Portfolio`,
    description,
    openGraph: {
      title: `${project.title} | TAAM`,
      description,
      type: "website",
      images: project.image
        ? [
            {
              url: project.image,
              width: 1200,
              height: 630,
              alt: project.title,
            },
          ]
        : [],
    },
    alternates: {
      canonical: `${baseUrl}/work/${id}`,
    },
  };
}

export async function generateStaticParams() {
  return siteContent.projects
    .filter((project) => project.published !== false)
    .map((project) => ({ id: String(project.id) }));
}

interface StoryBlock {
  heading: string;
  body: string[];
}

/**
 * Case study copy is stored as plain text: blocks separated by blank lines, each block's
 * first line is its heading ("The Challenge", "The Solution", ...).
 */
function parseStory(description: string): StoryBlock[] {
  return stripHtml(description)
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0)
    .map((lines) =>
      lines.length > 1 && lines[0].length < 40 && !/[.!?]$/.test(lines[0])
        ? { heading: lines[0].replace(/^the\s+/i, ''), body: lines.slice(1) }
        : { heading: '', body: lines }
    );
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = siteContent.projects.find((p) => String(p.id) === id);

  if (!project || project.published === false) {
    notFound();
  }

  const story = parseStory(project.description);
  // Results and tagline get their own treatment from structured data when available.
  const blocks = story.filter((b) => {
    const h = b.heading.toLowerCase();
    if (h === 'results' && project.results) return false;
    if (h === 'tagline' && project.tagline) return false;
    return true;
  });
  const reels = (project.videos ?? []).filter((v) => v.src);
  const gallery = (project.images ?? []).filter((img) => img.src && img.src !== '/placeholder-project.jpg');
  const otherProjects = siteContent.projects.filter((p) => p.published !== false && String(p.id) !== id).slice(0, 2);

  // Sections alternate ink / orange after the orange hero; the footer is ink, so the
  // closing CTA only appears when it lands on orange.
  const tones = ['ink', 'orange'] as const;
  let n = 0;
  const nextTone = () => tones[n++ % 2];
  const reelsTone = reels.length > 0 ? nextTone() : null;
  const storyTone = nextTone();
  const tailTone = nextTone();
  const showCta = nextTone() === 'orange';
  let idx = 0;
  const nextIndex = () => String(++idx).padStart(2, '0');

  return (
    <>
      <PageHero
        eyebrow={`Case study — ${project.category}`}
        title={project.title.split(' ').reduce<string[]>((lines, word) => {
          // Two words per line keeps long names poster-sized.
          const last = lines[lines.length - 1];
          if (last && last.split(' ').length < 2) lines[lines.length - 1] = `${last} ${word}`;
          else lines.push(word);
          return lines;
        }, []).join('\n')}
        outlineFrom={1}
        size="lg"
        subtitle={project.technologies}
        image={project.image ? { src: project.image, alt: project.title } : undefined}
      >
        {project.results && (
          <dl className="mt-16 md:mt-24 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 border-t-2 rule pt-8">
            {project.results.map((r) => (
              <div key={r.label} className="flex flex-col">
                <dt className="eyebrow mt-3 order-2">{r.label}</dt>
                <dd className="display text-[clamp(3rem,7vw,7rem)] order-1">{r.value}</dd>
                {r.from && <dd className="text-sm mt-1 order-3 opacity-80">{r.from}</dd>}
              </div>
            ))}
          </dl>
        )}
      </PageHero>

      {reelsTone && (
        <Section tone={reelsTone} index={nextIndex()} label="The reels">
          <div className="grid grid-cols-12 gap-6 mb-14 md:mb-20">
            <Headline text={'Made for\nthe feed.'} outlineFrom={1} className="display-lg col-span-12 lg:col-span-8" />
            <p className="col-span-12 md:col-span-5 lg:col-span-3 lg:col-start-10 self-end lede text-[color:var(--tone-muted)]">
              Short-form, vertical, built to be watched to the end. Tap a reel to play it with sound.
            </p>
          </div>
          <ReelStrip reels={reels} />
        </Section>
      )}

      <Section tone={storyTone} index={nextIndex()} label="The story">
        {project.tagline && (
          <Headline text={project.tagline} outlineFrom={0} className="display-lg max-w-[16ch] mb-24 md:mb-36" />
        )}
        <div className="space-y-20 md:space-y-28">
          {blocks.map((block, i) => (
            <Reveal key={i} className="grid grid-cols-12 gap-x-6 gap-y-6 border-t-2 rule pt-8">
              {block.heading && <h2 className="col-span-12 md:col-span-5 display display-md">{block.heading}</h2>}
              <div className={`col-span-12 md:col-span-7 lg:col-span-6 ${block.heading ? 'lg:col-start-7' : 'md:col-start-6'} space-y-5`}>
                {block.body.map((para, j) => (
                  <p key={j} className="lede">{para}</p>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone={tailTone} index={nextIndex()} label={gallery.length > 0 ? 'Gallery' : 'More work'}>
          {gallery.length > 0 && (
            <div className="space-y-6">
              {gallery.map((img, i) => (
                <Reveal key={img.src} y={60} className={i % 2 ? 'md:ml-[16%]' : 'md:mr-[16%]'}>
                  <MediaCard src={img.src} alt={img.alt} aspect="aspect-[16/10]" sizes="(min-width: 768px) 84vw, 100vw" />
                </Reveal>
              ))}
            </div>
          )}

          {otherProjects.length > 0 && (
            <div className={gallery.length > 0 ? 'mt-28' : ''}>
              <p className="eyebrow mb-10 text-[color:var(--tone-muted)]">More work</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otherProjects.map((p) => (
                  <Link key={p.id} href={`/work/${p.id}`} className="group block">
                    {p.image && <MediaCard src={p.image} alt={p.title} aspect="aspect-[4/3]" sizes="(min-width: 768px) 50vw, 100vw" />}
                    <h3 className="display display-sm mt-6">{p.title}</h3>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link
            href="/work"
            className={gallery.length > 0 || otherProjects.length > 0 ? 'eyebrow link-line inline-block mt-20' : 'display display-lg link-line'}
          >
            ← All work
          </Link>
        </Section>

      {showCta && (
      <CTASection
        title="Start your project"
        headline={'Your\nturn.'}
        description="Tell us the problem you're trying to solve. We'll see if we can give you better marketing, or refer you to someone who can."
        buttonLabel={getCtaCopy(project.category)}
        services={getServicesForCategory(project.category)}
      />
      )}
    </>
  );
}
