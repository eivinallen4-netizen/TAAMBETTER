'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Pencil, Phone, Trash2 } from 'lucide-react';
import { Button, Card, Field, Input, Notice, PageHeader, useConfirm, useToast } from '@taam/crm/client';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { fieldClass } from '../../components/crm-ui';

// One free video offer: what they told us, edit it in place, or delete it.

interface Lead {
  id: string;
  name: string;
  phone: string;
  business_name: string;
  sales_range: string;
  created_at: string;
}

const SALES_RANGES = ['Under $10k', '$10k - $50k', '$50k - $100k', '$100k - $500k', '$500k - $1M', 'Over $1M'];

const CRUMBS = (name: string) => [{ label: 'Free video offers', href: '/video-offers' }, { label: name }];

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="crm-eyebrow">{label}</dt>
      <dd className="mt-1 break-words text-[var(--crm-ink)]">{children || <span className="text-[var(--crm-muted)]">—</span>}</dd>
    </div>
  );
}

export default function VideoOfferDetailPage() {
  useAdminAuth();
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;
  const toast = useToast();
  const confirm = useConfirm();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchLead = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`);
      if (!res.ok) {
        setError(res.status === 404 ? 'This offer was not found. It may have been deleted.' : 'Could not load this offer. Reload to try again.');
        return;
      }
      const data = await res.json();
      setLead(data);
      setFormData(data);
    } catch (err) {
      setError('Could not load this offer. Reload to try again.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    const t = setTimeout(fetchLead, 0);
    return () => clearTimeout(t);
  }, [fetchLead]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!lead) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          business_name: formData.business_name,
          sales_range: formData.sales_range,
        }),
      });
      if (!res.ok) {
        setError('Could not save. Try again.');
        return;
      }
      setLead(await res.json());
      setIsEditing(false);
      toast('Saved', { tone: 'ok' });
    } catch (err) {
      setError('Could not save. Try again.');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!lead) return;
    const ok = await confirm({
      title: `Delete ${lead.name || 'this offer'}?`,
      body: 'This removes the free video offer for good.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('Could not delete. Try again.');
        return;
      }
      toast('Deleted');
      router.push('/admin/video-offers');
    } catch (err) {
      setError('Could not delete. Try again.');
      console.error('Delete error:', err);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4" aria-busy="true" aria-label="Loading offer">
        <div className="crm-skeleton h-4 w-32 rounded" />
        <div className="crm-skeleton h-8 w-1/2 rounded" />
        <div className="crm-skeleton h-48 rounded-xl" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Free video offer" breadcrumbs={CRUMBS('Not found')} />
        <Notice tone="bad">{error || 'This offer was not found.'}</Notice>
      </div>
    );
  }

  const received = new Date(lead.created_at);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={lead.name || 'No name'}
        subtitle={lead.business_name || undefined}
        breadcrumbs={CRUMBS(lead.name || 'Offer')}
        actions={
          !isEditing && (
            <>
              <Button variant="ghost" onClick={handleDelete}>
                <Trash2 className="size-4" aria-hidden /> Delete
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                <Pencil className="size-4" aria-hidden /> Edit
              </Button>
            </>
          )
        }
      />

      {error && (
        <div className="mb-4">
          <Notice tone="bad" onDismiss={() => setError(null)}>
            {error}
          </Notice>
        </div>
      )}

      {isEditing ? (
        <Card title="Edit offer">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required>
                <Input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </Field>
              <Field label="Phone" required>
                <Input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              </Field>
              <Field label="Business name">
                <Input value={formData.business_name || ''} onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} />
              </Field>
              <Field label="Sales range">
                <select value={formData.sales_range || ''} onChange={(e) => setFormData({ ...formData, sales_range: e.target.value })} className={fieldClass}>
                  <option value="">Choose a range</option>
                  {SALES_RANGES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                disabled={isSaving}
                onClick={() => {
                  setIsEditing(false);
                  setFormData(lead);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" busy={isSaving} busyLabel="Saving…">
                Save changes
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card title="Details">
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <Fact label="Name">{lead.name}</Fact>
            <Fact label="Phone">
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 tabular-nums hover:text-[var(--crm-brand-ink)]">
                  <Phone className="size-3.5 text-[var(--crm-muted)]" aria-hidden /> {lead.phone}
                </a>
              )}
            </Fact>
            <Fact label="Business name">{lead.business_name}</Fact>
            <Fact label="Sales range">{lead.sales_range}</Fact>
            <Fact label="Received">
              {Number.isNaN(received.getTime())
                ? lead.created_at
                : received.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </Fact>
          </dl>
        </Card>
      )}
    </div>
  );
}
