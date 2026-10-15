export interface Credit {
  client: string;
  href: string;
  note: string;
}

/** Maintenance America LV: shorts pulled from their socials while their full project is still in progress. */
export const maintenanceAmericaCredit: Credit = {
  client: 'Maintenance America',
  href: 'https://www.maintenanceamericalv.com/',
  note: 'From their socials · Idea, filmed & edited by TAAM',
};

/** Client credit pinned to the bottom of a short: who it's for, where it came from, who made it. */
export default function ShortCredit({ client, href, note }: Credit) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 pb-5 pt-16 text-white">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-base font-semibold uppercase tracking-wide underline-offset-4 hover:underline"
      >
        {client} <span aria-hidden="true">↗</span>
      </a>
      <p className="mt-1 text-xs uppercase tracking-wider text-white/75">{note}</p>
    </div>
  );
}
