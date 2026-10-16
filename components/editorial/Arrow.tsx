// Inline arrow sized to the surrounding text. An SVG, not the ↗/→ glyph, so phones never swap in an emoji.
export default function Arrow({ dir = 'up-right', className = '' }: { dir?: 'up-right' | 'right'; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.75}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      className={`inline-block w-[0.85em] h-[0.85em] align-[-0.05em] shrink-0 ${className}`}
    >
      {dir === 'right' ? <path d="M3 12H20M13 5L20 12L13 19" /> : <path d="M6 18L18 6M8 6H18V16" />}
    </svg>
  );
}
