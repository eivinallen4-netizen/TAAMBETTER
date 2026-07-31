import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

const variants = {
  primary: 'text-xs font-black text-[#F46325] uppercase tracking-wide',
  secondary: 'text-xs font-bold text-[#FF9A66] uppercase tracking-wide',
};

export default function Badge({ children, className = '', variant = 'primary' }: BadgeProps) {
  return (
    <span className={`${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
