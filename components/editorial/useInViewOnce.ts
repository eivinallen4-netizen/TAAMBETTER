'use client';

import { useEffect, useState, type RefObject } from 'react';

/** True once `amount` (0-1) of the element has been on screen. Never flips back. */
export default function useInViewOnce(ref: RefObject<Element | null>, amount = 0) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: amount },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, amount, shown]);

  return shown;
}
