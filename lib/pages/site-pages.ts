import siteContent from '@/app/content/siteContent.json';
import { FREE_TOOLS } from '@/app/lib/tools';
import { CAREER_ROLES } from '@/app/lib/careers';

// The pages built by hand in app/ (not in the `pages` table), with the keyword each one targets.
// list_pages returns these next to the /insights pages, and create_page / update_page refuse a
// main keyword one of them already owns, so Claude's duplicate checks see the whole site.
// Add a row here when you build a new page by hand.

export interface SitePage {
  path: string;
  title: string;
  main_keyword: string;
}

const CORE: SitePage[] = [
  { path: '/', title: 'TAAM | Better Marketing for the Best Businesses', main_keyword: 'las vegas marketing agency' },
  { path: '/about', title: 'About TAAM | Content Marketing Agency', main_keyword: 'content marketing agency las vegas' },
  { path: '/work', title: 'Our Work: Video and Content Marketing', main_keyword: 'video marketing case studies' },
  { path: '/tools', title: 'Free Marketing Tools for Small Businesses', main_keyword: 'free marketing tools for small businesses' },
  { path: '/free-video-offer', title: 'Free Week of Video', main_keyword: 'free video marketing for small business' },
  { path: '/blog', title: 'Marketing Blog: Video, Social and Lead Generation', main_keyword: 'marketing blog' },
  {
    path: '/blog/dont-let-your-agency-hold-you-back',
    title: "Don't Let Your Marketing Agency Hold You Back",
    main_keyword: 'marketing agency holding you back',
  },
  { path: '/careers', title: 'Careers at TAAM', main_keyword: 'marketing agency jobs las vegas' },
];

export function sitePages(): SitePage[] {
  return [
    ...CORE,
    ...FREE_TOOLS.map((t) => ({ path: `/tools/${t.slug}`, title: t.metaTitle, main_keyword: t.metaTitle.replace(/\s*\(.*\)$/, '').toLowerCase() })),
    ...CAREER_ROLES.map((r) => ({ path: `/careers/${r.slug}`, title: `${r.title} | Careers at TAAM`, main_keyword: `${r.title.toLowerCase()} job las vegas` })),
    ...siteContent.projects
      .filter((p) => p.published !== false)
      .map((p) => ({ path: `/work/${p.id}`, title: p.title, main_keyword: `${p.title.toLowerCase()} case study` })),
  ];
}
