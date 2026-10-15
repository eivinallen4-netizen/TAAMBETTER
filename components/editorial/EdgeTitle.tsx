interface EdgeTitleProps {
  children: string;
  /** Which edge the word bleeds off. */
  side?: 'left' | 'right';
  outline?: boolean;
  className?: string;
}

/**
 * An oversized single word that runs off the edge of its section, cropped by the
 * section's overflow. Purely decorative — the real heading lives elsewhere.
 */
export default function EdgeTitle({ children, side = 'right', outline = true, className = '' }: EdgeTitleProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none whitespace-nowrap display text-[clamp(7rem,30vw,32rem)] leading-[0.75] ${
        outline ? 'outline-type' : ''
      } ${side === 'right' ? 'text-right -mr-[0.08em] translate-x-[18%]' : '-ml-[0.06em] -translate-x-[14%]'} ${className}`}
    >
      {children}
    </div>
  );
}
