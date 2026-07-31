'use client';

import { SocialIcon } from 'react-social-icons';
import { ReactNode } from 'react';

interface SocialLinkProps {
  url: string;
  style?: React.CSSProperties;
  bgColor?: string;
  fgColor?: string;
  className?: string;
  children?: ReactNode;
}

export default function SocialLink({
  url,
  style,
  bgColor,
  fgColor,
  className,
  children,
}: SocialLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={className}
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <SocialIcon
        url={url}
        style={style}
        bgColor={bgColor}
        fgColor={fgColor}
      />
    </div>
  );
}
