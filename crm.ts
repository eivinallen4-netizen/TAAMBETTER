import { defineCrm } from '@taam/crm';
import { createCrm } from '@taam/crm/next';
import { taamSiteModule } from '@/lib/crm-site/module';
import { taamInstallsModule } from '@/lib/crm-site/installs/module';
import { taamReviewsModule } from '@/lib/crm-site/reviews/module';

// The TAAM CRM (@taam/crm) installed in the TAAM website: staff screens at /admin, customer
// pages at /c (plus the older /call/[token] and /onboarding/[token] links, which keep working).
// The website's own tools (SEO pages, slides, free-video-offer leads) plug in as one extra module.
export const crm = createCrm(
  defineCrm({
    industry: 'agency',
    company: {
      name: 'TAAM',
      email: 'info@taammarketing.com',
      website: 'https://www.taammarketing.com',
      timezone: 'America/Los_Angeles',
    },
    branding: {
      color: '#F46325',
      theme: 'dark',
      // PDFs, emails and customer pages need an absolute address.
      logoUrl: 'https://www.taammarketing.com/brand-assets/logos/transparent/TAAM_logo_orange_transparent.png',
      // The admin shell: the wide lockup in the sidebar, the square mark in the phone bar.
      sidebarLogoUrl: '/brand/crm-sidebar-logo.svg',
      markUrl: '/brand/crm-mark.svg',
    },
    paths: { admin: '/admin', api: '/api/crm', public: '/c' },
    // Same cookie and key prefix as the CRM this replaces, so nobody is signed out and
    // existing API keys (taam_…) and the Claude connector keep working.
    session: { cookieName: 'admin_session' },
    apiKeyPrefix: 'taam',
    // The website's own tools (lib/crm-site/module.ts) and the client installs list
    // (lib/crm-site/installs, owner only) are always on.
    // Site reviews (lib/crm-site/reviews) talk to the review app on its own subdomain.
    modules: { 'taam-site': true, 'taam-installs': true, 'taam-reviews': true },
    // The appointment setters keep Appointments (only the links they made) and the Call list.
    // Leads, onboarding, sales settings and deleting from the call list stay owner-only.
    permissions: {
      'appointments:manage': ['owner', 'setter'],
      'coldcall:manage': ['owner', 'setter'],
    },
    assistant: {
      instructions: [
        'TAAM is a Las Vegas marketing agency.',
        'TAAM never offers discounts. Never write "discount", "% off", "deal", "save" or "sale" in an email, a page or a quote. A smaller budget gets a smaller scope at the same rates.',
        'Onboarding is only for clients who have paid.',
        'Confirm with the user before deleting anything or sending email.',
        'Site reviews: list_review_requests returns only requests the team pushed (queued). Set each to in_progress, make the change in the code of that site, then update_review_requests with done and a short plain reply the client will read.',
        'SEO pages for /insights: call list_pages first (it covers the whole site and shows rejection notes). create_page always saves for review; publish only when the user asks.',
      ],
    },
  }),
  [taamSiteModule, taamInstallsModule, taamReviewsModule]
);
