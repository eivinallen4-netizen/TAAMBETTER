'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { DataTable, TableColumn } from '../components/DataTable';
import { ExportCsvButton } from '../components/ExportCsvButton';
import { EditRowModal, FieldSchema } from '../components/EditRowModal';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  message: string | null;
  completion_status: string;
  timestamp: string;
  source_page: string | null;
  biggest_challenge: string | null;
  services_interested: string | null;
  industry: string | null;
  business_stage: string | null;
  budget: string | null;
  timeline: string | null;
  website: string | null;
  lead_fit: string | null;
}

const columns: TableColumn<Contact>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: false },
  { key: 'business_name', header: 'Business', sortable: true },
  { key: 'lead_fit', header: 'Fit', sortable: true },
  { key: 'budget', header: 'Budget', sortable: true },
  { key: 'completion_status', header: 'Status', sortable: false },
  { key: 'timestamp', header: 'Date', sortable: true },
];

const editSchema: FieldSchema[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'business_name', label: 'Business Name', type: 'text' },
  { key: 'message', label: 'Message', type: 'textarea' },
  {
    key: 'completion_status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'completed', label: 'Completed' },
      { value: 'pending', label: 'Pending' },
      { value: 'contacted', label: 'Contacted' },
    ],
  },
  { key: 'source_page', label: 'Source Page', type: 'text' },
  { key: 'biggest_challenge', label: 'Biggest Challenge', type: 'text' },
  { key: 'services_interested', label: 'Services Interested', type: 'text' },
];

export default function ContactsPage() {
  useAdminAuth();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState('timestamp');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const limit = 100;

  useEffect(() => {
    fetchContacts();
  }, [search, offset, sort, dir]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchContacts();
    }, 5000);
    return () => clearInterval(interval);
  }, [search, offset, sort, dir]);

  async function fetchContacts() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        limit: String(limit),
        offset: String(offset),
        sort,
        dir,
      });
      const res = await fetch(`/api/admin/contacts?${params}`);
      const data = await res.json();
      setContacts(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(id: string, updates: Record<string, unknown>) {
    const res = await fetch(`/api/admin/contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      throw new Error('Failed to save');
    }

    await fetchContacts();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/contacts/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('Failed to delete');
    }

    await fetchContacts();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-4">Contacts</h1>
        <p className="text-gray-400">
          {total} total • Showing {offset + 1}-{Math.min(offset + limit, total)}
        </p>
      </div>

      <div className="mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-bold mb-2 text-gray-300">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            placeholder="Search by name, email, or business..."
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 focus:border-[#F46325] outline-none text-white rounded transition"
          />
        </div>
        <ExportCsvButton dataset="contacts" search={search} />
      </div>

      <DataTable
        columns={columns}
        rows={contacts}
        keyField="id"
        loading={loading}
        onEdit={setEditingContact}
        onDelete={handleDelete}
        onView={(id) => router.push(`/admin/contacts/${id}`)}
        onSortChange={(key, newDir) => {
          setSort(key);
          setDir(newDir);
        }}
        currentSort={sort}
        currentDir={dir}
      />

      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={offset === 0}
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-50 transition"
        >
          Previous
        </button>
        <span className="text-gray-400">
          Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit) || 1}
        </span>
        <button
          onClick={() => setOffset(offset + limit)}
          disabled={offset + limit >= total}
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-50 transition"
        >
          Next
        </button>
      </div>

      <EditRowModal
        open={!!editingContact}
        row={editingContact}
        schema={editSchema}
        onSave={handleSave}
        onClose={() => setEditingContact(null)}
        rowIdField="id"
        title="Edit Contact"
      />
    </div>
  );
}
