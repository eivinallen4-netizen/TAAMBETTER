import { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'accent';
}

const variants = {
  default: 'bg-[#111111] border-b border-gray-800',
  dark: 'bg-black border-t border-gray-800',
  accent: 'bg-[#F46325]',
};

export default function Section({ children, className = '', variant = 'default' }: SectionProps) {
  return (
    <section className={`${variants[variant]} ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-14 md:py-16">{children}</div>
    </section>
  );
}
