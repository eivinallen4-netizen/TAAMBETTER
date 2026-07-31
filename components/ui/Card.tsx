import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  style?: React.CSSProperties;
}

export default function Card({ children, className = '', onClick, href, style }: CardProps) {
  const baseClass = `bg-gradient-to-br rounded-lg border-2 border-gray-700 hover:border-[#F46325] transition-all duration-300 group cursor-pointer overflow-hidden relative flex flex-col justify-end ${className}`;

  if (href) {
    const isExternal = href.startsWith('http://') || href.startsWith('https://');
    return (
      <a
        href={href}
        className={baseClass}
        style={style}
        {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
      >
        {children}
      </a>
    );
  }

  return (
    <div
      onClick={onClick}
      className={baseClass}
      style={style}
    >
      {children}
    </div>
  );
}
