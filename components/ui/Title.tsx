import { ReactNode } from 'react';

interface TitleProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
  color?: 'white' | 'orange';
}

const sizes = {
  h1: 'text-4xl md:text-6xl',
  h2: 'text-3xl md:text-4xl',
  h3: 'text-2xl md:text-3xl',
};

const colors = {
  white: 'text-white',
  orange: 'text-[#F46325]',
};

export default function Title({ children, as = 'h1', className = '', color = 'white' }: TitleProps) {
  const Component = as;
  return (
    <Component className={`${sizes[as]} ${colors[color]} font-black leading-tight ${className}`}>
      {children}
    </Component>
  );
}
