import Section from '@/components/editorial/Section';

export type LegalSection = { id: string; title: string; body: React.ReactNode };

/** The numbered, ruled body shared by the privacy policy and the terms, with a jump list on top. */
export default function LegalSections({ sections, label = 'The details' }: { sections: LegalSection[]; label?: string }) {
  return (
    <Section tone="ink" index="01" label={label}>
      <nav aria-label="On this page" className="mb-16 max-w-3xl">
        <ol className="grid gap-x-8 gap-y-2 sm:grid-cols-2 text-[color:var(--tone-muted)] font-semibold">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="link-line">
                <span className="tabular-nums mr-2">{String(i + 1).padStart(2, '0')}</span>
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="max-w-3xl space-y-14">
        {sections.map((s, i) => (
          <div key={s.id} id={s.id} className="scroll-mt-28 border-t-2 rule pt-8">
            <p className="eyebrow mb-3 text-[color:var(--tone-muted)]">{String(i + 1).padStart(2, '0')}</p>
            <h2 className="display display-sm mb-5">{s.title}</h2>
            <div className="space-y-4 text-lg leading-relaxed text-[color:var(--tone-muted)] [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_strong]:text-white [&_h3]:text-white [&_h3]:font-bold [&_h3]:pt-2">
              {s.body}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
