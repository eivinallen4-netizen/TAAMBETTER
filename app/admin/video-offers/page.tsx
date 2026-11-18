'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Pencil, Trash2, Video } from 'lucide-react';
import { Button, Empty, PageHeader, Table, useConfirm, useToast } from '@taam/crm/client';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { EditRowModal, FieldSchema } from '../components/EditRowModal';
import { SearchInput, SelectInput } from '../components/crm-ui';

interface Lead {
  id: string;
  name: string;
  phone: string;
  business_name: string;
  sales_range: string;
  created_at: string;
}

type SortKey = 'name' | 'business_name' | 'created_at';

const editSchema: FieldSchema[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'phone', label: 'Phone', type: 'tel', required: true },
  { key: 'business_name', label: 'Business name', type: 'text', required: true },
  {
    key: 'sales_range',
    label: 'Sales range',
    type: 'select',
    required: true,
    options: [
      { value: 'Under $10k', label: 'Under $10k' },
      { value: '$10k - $50k', label: '$10k - $50k' },
      { value: '$50k - $100k', label: '$50k - $100k' },
      { value: '$100k - $500k', label: '$100k - $500k' },
      { value: '$500k - $1M', label: '$500k - $1M' },
      { value: 'Over $1M', label: 'Over $1M' },
    ],
  },
];

const LIMIT = 100;

function shortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function VideoOffersPage() {
  useAdminAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState<SortKey>('created_at');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams({ search, limit: String(LIMIT), offset: String(offset), sort, dir });
      const res = await fetch(`/api/admin/leads?${params}`);
      const data = await res.json();
      setLeads(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoaded(true);
    }
  }, [search, offset, sort, dir]);

  // Load now, then refresh quietly every few seconds so new offers appear on their own.
  useEffect(() => {
    const first = setTimeout(fetchLeads, 0);
    const interval = setInterval(fetchLeads, 5000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [fetchLeads]);

  async function handleSave(id: string, updates: Record<string, unknown>) {
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Could not save. Try again.');
    toast('Saved', { tone: 'ok' });
    await fetchLeads();
  }

  async function handleDelete(lead: Lead) {
    const ok = await confirm({
      title: `Delete ${lead.name || 'this offer'}?`,
      body: 'This removes the free video offer for good.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/leads/${lead.id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast('Could not delete. Try again.', { tone: 'bad' });
      return;
    }
    toast('Deleted');
    await fetchLeads();
  }

  const SORTS = [
    { value: 'created_at:desc', label: 'Newest first' },
    { value: 'created_at:asc', label: 'Oldest first' },
    { value: 'name:asc', label: 'Name A to Z' },
    { value: 'business_name:asc', label: 'Business A to Z' },
  ];
  const sortValue = SORTS.some((o) => o.value === `${sort}:${dir}`) ? `${sort}:${dir}` : 'created_at:desc';

  const exportHref = `/api/admin/leads/export?${new URLSearchParams(search ? { search } : {})}`;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Free video offers"
        subtitle={total === 1 ? '1 offer from the free video form.' : `${total} offers from the free video form.`}
        actions={
          <Button variant="secondary" onClick={() => (window.location.href = exportHref)}>
            <Download className="size-4" aria-hidden /> Export CSV
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput
          label="Search by name, business or phone"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOffset(0);
          }}
          className="w-full sm:w-auto sm:min-w-56 sm:flex-1"
        />
        <SelectInput
          aria-label="Sort"
          value={sortValue}
          onChange={(e) => {
            const [key, d] = e.target.value.split(':') as [SortKey, 'asc' | 'desc'];
            setSort(key);
            setDir(d);
            setOffset(0);
          }}
          options={SORTS}
        />
      </div>

      {!loaded ? (
        <div className="overflow-hidden rounded-xl border border-[var(--crm-line)]" aria-busy="true" aria-label="Loading offers">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-6 border-b border-[var(--crm-line)] px-4 py-4 last:border-0">
              <div className="crm-skeleton h-3 w-1/4 rounded" />
              <div className="crm-skeleton h-3 w-1/5 rounded" />
              <div className="crm-skeleton ml-auto h-3 w-16 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <Table
          caption="Free video offers"
          rows={leads}
          rowKey={(l) => l.id}
          href={(l) => `/video-offers/${l.id}`}
          cards
          empty={
            <Empty icon={Video} title={search ? 'Nothing matches that search' : 'No free video offers yet'}>
              {search ? 'Try a different name, or clear the search.' : 'People who ask for the free video show up here.'}
            </Empty>
          }
          columns={[
            {
              header: 'Name',
              cell: (l) => (
                <span className="block min-w-0">
                  <span className="block truncate font-semibold">{l.name || 'No name'}</span>
                  <span className="block truncate text-xs text-[var(--crm-muted)]">{l.business_name}</span>
                </span>
              ),
            },
            { header: 'Phone', cell: (l) => <span className="whitespace-nowrap tabular-nums">{l.phone}</span> },
            { header: 'Sales range', wide: true, cell: (l) => <span className="text-[var(--crm-muted)]">{l.sales_range}</span> },
            {
              header: 'Received',
              align: 'right',
              cell: (l) => <span className="whitespace-nowrap tabular-nums text-[var(--crm-muted)]">{shortDate(l.created_at)}</span>,
            },
            {
              header: 'Actions',
              align: 'right',
              hideOnCard: true,
              cell: (l) => (
                <span className="inline-flex gap-1">
                  <Button size="sm" variant="ghost" aria-label={`Edit ${l.name}`} onClick={() => setEditingLead(l)}>
                    <Pencil className="size-3.5" aria-hidden />
                  </Button>
                  <Button size="sm" variant="ghost" aria-label={`Delete ${l.name}`} onClick={() => handleDelete(l)}>
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </span>
              ),
            },
          ]}
        />
      )}

      {total > LIMIT && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button variant="secondary" size="sm" onClick={() => setOffset(Math.max(0, offset - LIMIT))} disabled={offset === 0}>
            Previous
          </Button>
          <span className="text-sm tabular-nums text-[var(--crm-muted)]">
            {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setOffset(offset + LIMIT)} disabled={offset + LIMIT >= total}>
            Next
          </Button>
        </div>
      )}

      <EditRowModal
        open={!!editingLead}
        row={editingLead}
        schema={editSchema}
        onSave={handleSave}
        onClose={() => setEditingLead(null)}
        rowIdField="id"
        title="Edit free video offer"
      />
    </div>
  );
}
