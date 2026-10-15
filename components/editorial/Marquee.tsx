interface MarqueeProps {
  items: string[];
  className?: string;
}

/** A slow, endless running line of outlined and solid display words. Decorative. */
export default function Marquee({ items, className = '' }: MarqueeProps) {
  const run = [...items, ...items];

  return (
    <div aria-hidden="true" className={`overflow-hidden select-none ${className}`}>
      <div className="marquee">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {run.map((item, i) => (
              <span
                key={`${copy}-${i}`}
                className={`display display-lg px-[0.25em] whitespace-nowrap ${i % 2 ? 'outline-type' : ''}`}
              >
                {item}
                <span className="inline-block align-middle mx-[0.35em] h-[0.18em] w-[0.18em] rounded-full bg-current translate-y-[-0.1em]" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
