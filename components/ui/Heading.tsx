import { ReactNode } from 'react';

interface HeadingProps {
  children: ReactNode;
  as?: 'h2' | 'h3' | 'h4' | 'h5';
  className?: string;
  color?: 'white' | 'orange';
}

const sizes = {
  h2: 'text-2xl md:text-3xl',
  h3: 'text-xl md:text-2xl',
  h4: 'text-lg md:text-xl',
  h5: 'text-base md:text-lg',
};

const colors = {
  white: 'text-white',
  orange: 'text-[#F46325]',
};

export default function Heading({ children, as = 'h2', className = '', color = 'white' }: HeadingProps) {
  const Component = as;
  return (
    <Component className={`${sizes[as]} ${colors[color]} font-bold ${className}`}>
      {children}
    </Component>
  );
}
