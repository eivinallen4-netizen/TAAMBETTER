import Headline from '@/components/editorial/Headline';
import MediaCard from '@/components/editorial/MediaCard';
import Reveal from '@/components/editorial/Reveal';
import Section, { type Tone } from '@/components/editorial/Section';
import Arrow from '@/components/editorial/Arrow';

interface NewsItem {
  id: number;
  title: string;
  description: string;
  link: string;
  date: string;
  image?: string;
}

interface NewsSectionProps {
  items: NewsItem[];
  tone?: Tone;
  index?: string;
}

export default function NewsSection({ items, tone = 'ink', index = '05' }: NewsSectionProps) {
  if (items.length === 0) return null;

  return (
    <Section tone={tone} index={index} label="News">
      {/* Cinematic statement card */}
      <Reveal y={60}>
        <MediaCard src="/media/cc-recap.jpg" video="/media/cc-recap.mp4" alt="Guests at A Night of Connection & Cocktails, a real estate networking event TAAM filmed" aspect="aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]" scrim>
          <div className="flex h-full items-end p-6 md:p-12">
            <p className="display display-lg max-w-[12ch]">
              Make them say WOW.
            </p>
          </div>
        </MediaCard>
      </Reveal>

      <div className="mt-28 md:mt-40 space-y-24">
        {items.map((item) => {
          const date = new Date(item.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
          const isLink = item.link && item.link !== '#';
          return (
            <article key={item.id} className="grid grid-cols-12 gap-x-6 gap-y-10">
              <div className="col-span-12 lg:col-span-7">
                <p className="eyebrow mb-8 text-[color:var(--tone-muted)]">
                  <time dateTime={item.date}>{date}</time>
                </p>
                <Headline text={item.title} className="display-lg" />
                <Reveal className="mt-10 max-w-xl">
                  <p className="lede text-[color:var(--tone-muted)]">{item.description}</p>
                  {isLink && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="eyebrow link-line inline-block mt-8">
                      Read more <Arrow />
                    </a>
                  )}
                </Reveal>
              </div>
              {item.image && (
                <Reveal className="col-span-12 md:col-span-8 md:col-start-5 lg:col-span-4 lg:col-start-9 self-end" delay={0.15}>
                  <MediaCard src={item.image} video={item.image.startsWith('/media/') ? item.image.replace(/\.jpg$/, '.mp4') : undefined} alt="" aspect="aspect-[4/5]" sizes="(min-width: 1024px) 33vw, 100vw" />
                </Reveal>
              )}
            </article>
          );
        })}
      </div>
    </Section>
  );
}
