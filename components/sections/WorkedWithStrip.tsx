/** "Worked with" logo row. Logos are knocked out to solid white so they sit in the ink/white system. */
const CLIENTS = [
  { name: 'AG', src: '/clients/ag-logo.avif', className: 'h-20 md:h-28 -my-4 md:-my-6' }, // source has wide built-in padding
  { name: 'Baldwin Armor', src: '/clients/baldwin-armor.svg', className: 'h-14 md:h-20' },
  { name: 'Maintenance America', src: '/clients/maintenance-america.svg', className: 'h-12 md:h-16' },
  { name: 'Movers and Junk Removal', src: '/clients/movers-junk-removal.webp', className: 'h-14 md:h-20' },
];

export default function WorkedWithStrip() {
  return (
    // Pulled up into the offer's bottom padding and framed by hairlines, so it reads as a band, not a stray row.
    <section
      aria-label="Companies we've worked with"
      className="tone-ink relative gutter -mt-[calc(var(--section-pad)*0.45)]"
    >
      <div className="flex flex-col items-center gap-8 border-y rule py-8 md:flex-row md:justify-center md:gap-14 md:py-10">
        <p className="eyebrow text-[color:var(--tone-muted)]">Worked with</p>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-16">
          {CLIENTS.map((c) => (
            <li key={c.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.src}
                alt={c.name}
                className={`${c.className} w-auto brightness-0 invert opacity-90`}
                loading="lazy"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
