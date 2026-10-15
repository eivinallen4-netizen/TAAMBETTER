import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { KIND_LABELS, stepsFor, toKind, type OnboardingKind } from '@/app/lib/onboarding';

// Dashboard data: every lead source plus onboarding progress per link kind, newest first.

export interface OverviewItem {
  kind: 'video_offer' | 'contact' | 'tool' | 'onboarding';
  id: string;
  name: string;
  business: string;
  detail: string;
  status: string;
  date: string;
  href: string;
  /** Onboarding rows only. */
  onboardingKind?: OnboardingKind;
  progress?: number;
}

const DAY = 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    await requireAdmin();
    const db = getAdminDb();
    await initializeTables(db);

    const [offers, contacts, onboardings] = await Promise.all([
      db.execute('SELECT id, name, phone, business_name, sales_range, created_at FROM free_video_offers ORDER BY created_at DESC LIMIT 200'),
      db.execute(
        'SELECT id, name, email, business_name, completion_status, timestamp, source_page, lead_fit FROM contacts ORDER BY timestamp DESC LIMIT 200'
      ),
      db.execute('SELECT id, kind, client_name, business_name, status, current_step, created_at, updated_at FROM client_onboardings ORDER BY updated_at DESC'),
    ]);

    const s = (v: unknown) => (v == null ? '' : String(v));
    // SQLite CURRENT_TIMESTAMP is "YYYY-MM-DD HH:MM:SS" in UTC with no zone marker.
    const iso = (v: unknown) => {
      const t = s(v);
      return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(t) ? `${t.replace(' ', 'T')}Z` : t;
    };

    const items: OverviewItem[] = [
      ...offers.rows.map((r) => ({
        kind: 'video_offer' as const,
        id: s(r.id),
        name: s(r.name),
        business: s(r.business_name),
        detail: [s(r.phone), s(r.sales_range)].filter(Boolean).join(' · '),
        status: 'new',
        date: iso(r.created_at),
        href: `/admin/leads/${s(r.id)}`,
      })),
      ...contacts.rows.map((r) => {
        const source = s(r.source_page);
        return {
          kind: source.startsWith('/tools/') ? ('tool' as const) : ('contact' as const),
          id: s(r.id),
          name: s(r.name) || s(r.email),
          business: s(r.business_name),
          detail: [s(r.email), source, s(r.lead_fit)].filter(Boolean).join(' · '),
          status: s(r.completion_status),
          date: iso(r.timestamp),
          href: `/admin/contacts/${s(r.id)}`,
        };
      }),
      ...onboardings.rows.map((r) => {
        const kind = toKind(r.kind);
        const steps = stepsFor(kind);
        const step = Math.min(Number(r.current_step ?? 0), steps.length - 1);
        const status = s(r.status);
        const done = status === 'submitted' || status === 'complete';
        return {
          kind: 'onboarding' as const,
          id: s(r.id),
          name: s(r.client_name),
          business: s(r.business_name),
          detail: `${KIND_LABELS[kind]} · ${done ? 'All steps done' : `On “${steps[step].label}”`}`,
          status,
          date: s(r.updated_at),
          href: `/admin/onboarding/${s(r.id)}`,
          onboardingKind: kind,
          progress: done ? 100 : Math.round((step / (steps.length - 1)) * 100),
        };
      }),
    ].sort((a, b) => (a.date < b.date ? 1 : -1));

    const now = Date.now();
    const leadItems = items.filter((i) => i.kind !== 'onboarding');
    const onboardingRows = onboardings.rows.map((r) => ({ status: s(r.status), kind: toKind(r.kind) }));
    // Old combined links count toward both cards.
    const countFor = (kind: 'website' | 'social') => {
      const rows = onboardingRows.filter((r) => r.kind === kind || r.kind === 'full');
      return {
        total: rows.length,
        waiting: rows.filter((r) => r.status === 'sent' || r.status === 'opened' || r.status === 'in_progress').length,
        toReview: rows.filter((r) => r.status === 'submitted').length,
        complete: rows.filter((r) => r.status === 'complete').length,
      };
    };

    return NextResponse.json({
      stats: {
        totalLeads: leadItems.length,
        leadsThisWeek: leadItems.filter((i) => now - new Date(i.date).getTime() < 7 * DAY).length,
        videoOffers: offers.rows.length,
        contacts: items.filter((i) => i.kind === 'contact').length,
        toolLeads: items.filter((i) => i.kind === 'tool').length,
        onboarding: { website: countFor('website'), social: countFor('social') },
      },
      items: items.slice(0, 300),
    });
  } catch (error) {
    console.error('Overview error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
