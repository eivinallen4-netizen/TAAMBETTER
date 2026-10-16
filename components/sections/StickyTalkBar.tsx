'use client';

import { useEffect, useState } from 'react';
import ContactCTA from '@/app/components/ContactCTA';
import Arrow from '@/components/editorial/Arrow';

/**
 * Phone-only bottom bar: once the hero's buttons scroll away, the ask stays one thumb-tap away.
 * Steps aside near the end of the page, where the closing section has its own buttons.
 */
export default function StickyTalkBar({ phone }: { phone: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const nearEnd = y + window.innerHeight > document.documentElement.scrollHeight - window.innerHeight * 1.6;
      setShow(y > window.innerHeight * 0.9 && !nearEnd);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        show ? 'translate-y-0' : 'translate-y-[120%]'
      }`}
      inert={!show}
    >
      <div className="tone-ink flex items-center gap-3 rounded-full p-2 pl-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
        <a
          href={`tel:${phone.replace(/[^+\d]/g, '')}`}
          className="eyebrow flex-1 text-[0.7rem]"
        >
          Call {phone}
        </a>
        <ContactCTA className="btn btn-solid !py-3 !px-5 shrink-0">
          Let&apos;s talk <Arrow />
        </ContactCTA>
      </div>
    </div>
  );
}
