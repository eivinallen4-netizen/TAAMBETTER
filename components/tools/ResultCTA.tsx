import ContactCTA from '@/app/components/ContactCTA';
import type { FreeTool } from '@/app/lib/tools';

interface ResultCTAProps {
  tool: FreeTool;
  /** One line tying the result to the offer, e.g. "Your mobile score is 41." */
  hook?: string;
}

/** The ask that ends every result: we found the problem, we can fix it, here's the low-risk next step. */
export default function ResultCTA({ tool, hook }: ResultCTAProps) {
  return (
    <div className="tone-orange rounded-[var(--radius-card)] p-8 md:p-12 grid grid-cols-12 gap-x-6 gap-y-8 items-end">
      <div className="col-span-12 lg:col-span-7">
        {hook && <p className="eyebrow mb-4">{hook}</p>}
        <p className="display display-md">{tool.ctaQuestion}</p>
        <p className="lede mt-5 max-w-xl">
          Book a free call. We&apos;ll walk through your results, tell you what we&apos;d fix first, and you can
          take the plan and run with it, with or without us.
        </p>
      </div>
      <div className="col-span-12 lg:col-span-5 lg:justify-self-end">
        <ContactCTA challenge={tool.challenge} services={tool.services} className="btn btn-solid">
          Book a free call <span aria-hidden="true">↗</span>
        </ContactCTA>
        <p className="mt-4 text-sm font-semibold">No obligation · Reply within 1 business day</p>
      </div>
    </div>
  );
}
