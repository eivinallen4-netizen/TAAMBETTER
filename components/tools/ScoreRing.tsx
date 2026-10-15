interface ScoreRingProps {
  score: number;
  label: string;
  size?: 'lg' | 'sm';
}

export function scoreVerdict(score: number): string {
  if (score >= 90) return 'Strong';
  if (score >= 70) return 'Needs work';
  if (score >= 50) return 'Weak';
  return 'Poor';
}

/** A 0–100 score as an orange arc on a faint track, number set in display type. */
export default function ScoreRing({ score, label, size = 'lg' }: ScoreRingProps) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <figure className="flex flex-col items-start gap-4">
      <div className={`relative ${size === 'lg' ? 'w-40 h-40 md:w-48 md:h-48' : 'w-24 h-24 md:w-28 md:h-28'}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(255 255 255 / 0.14)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="var(--taam-orange)"
            strokeWidth="8"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - clamped / 100)}
            className="transition-[stroke-dashoffset] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center display ${size === 'lg' ? 'text-5xl md:text-6xl' : 'text-3xl'}`}>
          {clamped}
        </span>
      </div>
      <figcaption>
        <span className="eyebrow block">{label}</span>
        <span className="block mt-1 font-bold">{scoreVerdict(clamped)}</span>
      </figcaption>
    </figure>
  );
}
