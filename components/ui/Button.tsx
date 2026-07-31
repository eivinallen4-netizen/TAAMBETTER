import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'dark' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  arrowIcon?: boolean;
}

const baseStyles = 'inline-flex items-center justify-center font-black tracking-wide transition outline-none';

const variants = {
  primary: 'px-8 py-4 bg-[#F46325] text-white hover:bg-[#FF7B42]',
  dark: 'px-8 py-4 bg-[#111111] text-[#F46325] hover:bg-gray-900',
  outline: 'px-4 py-2 border-2 border-gray-700 text-gray-400 hover:border-[#F46325] hover:text-white',
};

const sizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  href,
  type = 'button',
  disabled = false,
  arrowIcon = false,
}: ButtonProps) {
  const buttonClass = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    const isExternal = href.startsWith('http://') || href.startsWith('https://');
    return (
      <a href={href} className={buttonClass} {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}>
        {children}
        {arrowIcon && <span className="ml-2 transition-transform group-hover:translate-x-1">↗</span>}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={buttonClass}>
      {children}
      {arrowIcon && <span className="ml-2 transition-transform group-hover:translate-x-1">↗</span>}
    </button>
  );
}
