import Headline from '@/components/editorial/Headline';
import Icon, { processIconNames } from '@/components/editorial/Icon';
import MediaCard from '@/components/editorial/MediaCard';
import Reveal from '@/components/editorial/Reveal';
import Section, { type Tone } from '@/components/editorial/Section';
import { maintenanceAmericaCredit, type Credit } from '@/components/editorial/ShortCredit';

interface ProcessStep {
  step: string;
  title: string;
  description: string;
}

interface ProcessSectionProps {
  steps: ProcessStep[];
  tone?: Tone;
  index?: string;
  image?: { src: string; alt: string; video?: string; credit?: Credit };
}

/** A sticky cinematic card on one side; the four steps run past it with outlined numerals. */
export default function ProcessSection({
  steps,
  tone = 'orange',
  index = '04',
  image = { src: '/media/ma-shop.jpg', video: '/media/ma-shop.mp4', alt: 'A Maintenance America LV short TAAM filmed in their Las Vegas shop', credit: maintenanceAmericaCredit },
}: ProcessSectionProps) {
  return (
    <Section tone={tone} index={index} label="Process">
      <Headline text={'How we\nwork.'} outlineFrom={1} className="display-xl mb-20 md:mb-32" />

      <div className="grid grid-cols-12 gap-x-6 gap-y-16">
        <div className="col-span-12 lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <Reveal y={60}>
              <MediaCard src={image.src} video={image.video} alt={image.alt} credit={image.credit} aspect="aspect-[4/5]" sizes="(min-width: 1024px) 40vw, 100vw" />
            </Reveal>
          </div>
        </div>

        <ol className="col-span-12 lg:col-span-6 lg:col-start-7">
          {steps.map((step, i) => (
            <Reveal as="li" key={step.step} className="border-t-2 rule pt-8 pb-16 md:pb-24 last:pb-0">
              <div className="flex items-start justify-between gap-6">
                <span className="display outline-type text-[clamp(4.5rem,9vw,9rem)]">{step.step}</span>
                <Icon name={processIconNames[i % processIconNames.length]} className="w-12 h-12 mt-2 shrink-0" />
              </div>
              <h3 className="display display-sm mt-6">{step.title}</h3>
              <p className="lede mt-5 text-[color:var(--tone-muted)]">{step.description}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </Section>
  );
}
