import { ReactNode } from 'react';

interface TextProps {
  children: ReactNode;
  as?: 'p' | 'span' | 'div';
  className?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg';
  color?: 'white' | 'gray-300' | 'gray-400' | 'gray-500' | 'gray-600';
}

const sizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
};

const colors = {
  white: 'text-white',
  'gray-300': 'text-gray-300',
  'gray-400': 'text-gray-400',
  'gray-500': 'text-gray-500',
  'gray-600': 'text-gray-600',
};

export default function Text({
  children,
  as = 'p',
  className = '',
  size = 'base',
  color = 'white'
}: TextProps) {
  const Component = as;
  return (
    <Component className={`${sizes[size]} ${colors[color]} ${className}`}>
      {children}
    </Component>
  );
}
