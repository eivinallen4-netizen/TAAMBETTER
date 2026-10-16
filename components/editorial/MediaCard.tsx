import Image from 'next/image';
import type { ReactNode } from 'react';
import LoopVideo from './LoopVideo';
import ShortCredit, { type Credit } from './ShortCredit';

interface MediaCardProps {
  src: string;
  alt: string;
  /** Tailwind aspect class, e.g. "aspect-[21/9]". */
  aspect?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Darken the bottom of the frame so overlaid type stays legible. */
  scrim?: boolean;
  children?: ReactNode;
  position?: string;
  /** Muted looping footage over the image; laid over the image (`src`). */
  video?: string;
  /** Client credit overlaid on the bottom of the frame, linking to their site. */
  credit?: Credit;
}

/** Full-bleed cinematic imagery in a soft rounded card. */
export default function MediaCard({
  src,
  alt,
  aspect = 'aspect-[16/9]',
  sizes = '100vw',
  priority = false,
  className = '',
  scrim = false,
  children,
  position = 'center',
  video,
  credit,
}: MediaCardProps) {
  return (
    <div className={`media-card ${aspect} ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
        style={{ objectPosition: position }}
      />
      {video && <LoopVideo src={video} position={position} />}
      {scrim && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" aria-hidden="true" />
      )}
      {children && <div className="absolute inset-0 z-10">{children}</div>}
      {credit && <ShortCredit {...credit} />}
    </div>
  );
}
