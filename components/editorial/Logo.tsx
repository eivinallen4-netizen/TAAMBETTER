interface LogoProps {
  variant?: 'wordmark' | 'outline' | 'mark';
  className?: string;
  title?: string;
}

const sources = {
  wordmark: { src: '/brand/taam-wordmark.svg', ratio: 1447.89 / 361.08 },
  outline: { src: '/brand/taam-wordmark-outline.svg', ratio: 1447.89 / 361.08 },
  mark: { src: '/brand/taam-mark.svg', ratio: 1 },
};

/**
 * The TAAM wordmark, painted with `currentColor` through a CSS mask so it inherits
 * the surrounding text color. Size it by width or height; the aspect ratio is fixed.
 */
export default function Logo({ variant = 'wordmark', className = 'h-6', title = 'TAAM' }: LogoProps) {
  const { src, ratio } = sources[variant];

  return (
    <span
      role="img"
      aria-label={title}
      className={`inline-block bg-current ${className}`}
      style={{
        aspectRatio: ratio,
        WebkitMask: `url(${src}) center / contain no-repeat`,
        mask: `url(${src}) center / contain no-repeat`,
      }}
    />
  );
}
