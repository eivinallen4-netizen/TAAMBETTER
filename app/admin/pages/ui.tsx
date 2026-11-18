'use client';

import { Badge } from '@taam/crm/client';
import { STATUS_LABEL, type PageStatus } from '@/lib/pages/rules';
import { fieldClass } from '../components/crm-ui';

// Bits shared by the /admin/pages screens. They use the CRM's own badge and field styles so the
// SEO tools look like the rest of /admin.

const STATUS_TONE: Record<PageStatus, 'neutral' | 'brand' | 'ok' | 'warn' | 'bad'> = {
  draft: 'neutral',
  needs_review: 'warn',
  published: 'ok',
  archived: 'neutral',
};

export function PageStatusBadge({ status }: { status: PageStatus }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? 'neutral'} dot>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export const inputClass = fieldClass;

export function when(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function day(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
