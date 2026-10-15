import Image from 'next/image';

/** Intrinsic sizes of the trimmed art in /public/characters. */
const POSES = {
  peek: [750, 505],
  wave: [824, 653],
  fishing: [920, 851],
  counting: [895, 711],
  'money-gun': [958, 707],
  chill: [831, 738],
  phone: [749, 689],
  sitting: [743, 748],
  famous: [760, 864],
} as const;

export type MascotPose = keyof typeof POSES;

interface MascotProps {
  pose: MascotPose;
  className?: string;
  /** Rendered width hint for the image optimizer, in CSS px. */
  size?: number;
  priority?: boolean;
}

/** The TAAM mascot. Purely decorative, so it's hidden from screen readers and never catches clicks. */
export default function Mascot({ pose, className = '', size = 256, priority }: MascotProps) {
  const [width, height] = POSES[pose];
  return (
    <Image
      src={`/characters/${pose}.webp`}
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      sizes={`${size}px`}
      priority={priority}
      draggable={false}
      className={`pointer-events-none select-none ${className}`}
    />
  );
}
