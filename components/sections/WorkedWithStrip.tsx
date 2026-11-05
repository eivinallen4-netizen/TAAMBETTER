/** "Worked with" logo row. Logos are knocked out to solid white so they sit in the ink/white system. */
const CLIENTS = [
  { name: 'AG', src: '/clients/ag-logo.avif', className: 'h-20 md:h-28 -my-4 md:-my-6' }, // source has wide built-in padding
  { name: 'Baldwin Armor', src: '/clients/baldwin-armor.svg', className: 'h-14 md:h-20' },
];

export default function WorkedWithStrip() {
  return (
    <section aria-label="Companies we've worked with" className="tone-ink gutter pt-24 pb-4 md:pt-32">
      <div className="flex flex-col items-center gap-8 md:flex-row md:justify-center md:gap-14">
        <p className="eyebrow text-[color:var(--tone-muted)]">Worked with</p>
        <ul className="flex items-center gap-12 md:gap-16">
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
