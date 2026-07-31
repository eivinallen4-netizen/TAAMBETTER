'use client';

import { useEffect } from 'react';

export default function ScrollAnimations({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Handle CSS animation elements with animation-delay
    const elements = document.querySelectorAll('[style*="animation-delay"]');

    elements.forEach((el) => {
      const classList = el.className;
      if (classList && (classList.includes('opacity-0') || classList.includes('animate-'))) {
        el.classList.add('!opacity-0');
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('!opacity-0');
          }
        });
      },
      { threshold: 0.05 }
    );

    elements.forEach((el) => observer.observe(el));

    // Handle Motion-powered scroll animations (data-scroll-animate)
    // These work automatically with Motion's whileInView prop
    // This is kept for backward compatibility with existing markup

    return () => {
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}
