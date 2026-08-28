'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '@/lib/useAdminAuth';
import type { TableColumn } from '../components/DataTable';
import { ExportCsvButton } from '../components/ExportCsvButton';
import { EditRowModal, FieldSchema } from '../components/EditRowModal';

interface Lead {
  id: string;
  name: string;
  phone: string;
  business_name: string;
  sales_range: string;
  created_at: string;
}

const columns: TableColumn<Lead>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'phone', header: 'Phone', sortable: false },
  { key: 'business_name', header: 'Business Name', sortable: true },
  { key: 'sales_range', header: 'Sales Range', sortable: false },
  { key: 'created_at', header: 'Created At', sortable: true },
];

const editSchema: FieldSchema[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'phone', label: 'Phone', type: 'tel', required: true },
  { key: 'business_name', label: 'Business Name', type: 'text', required: true },
  {
    key: 'sales_range',
    label: 'Sales Range',
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

export default function LeadsPage() {
  useAdminAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState('created_at');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);


  const limit = 100;

  useEffect(() => {
    fetchLeads();
  }, [search, offset, sort, dir]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeads();
    }, 5000);
    return () => clearInterval(interval);
  }, [search, offset, sort, dir]);

  async function fetchLeads() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        limit: String(limit),
        offset: String(offset),
        sort,
        dir,
      });
      const res = await fetch(`/api/admin/leads?${params}`);
      const data = await res.json();
      setLeads(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(id: string, updates: Record<string, unknown>) {
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      throw new Error('Failed to save');
    }

    await fetchLeads();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('Failed to delete');
    }

    await fetchLeads();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-4">Leads</h1>
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
            placeholder="Search by name, business, or phone..."
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 focus:border-[#F46325] outline-none text-white rounded transition"
          />
        </div>
        <ExportCsvButton dataset="leads" search={search} />
      </div>

      <div className="overflow-x-auto bg-gray-900 rounded-lg border border-gray-700">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-6 py-4 text-left text-sm font-bold text-gray-300 hover:text-white cursor-pointer"
                  onClick={() => {
                    if (col.sortable !== false) {
                      const newDir = sort === String(col.key) && dir === 'asc' ? 'desc' : 'asc';
                      setSort(String(col.key));
                      setDir(newDir);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable !== false && sort === String(col.key) && (
                      <span className="text-xs">{dir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition">
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-6 py-4 text-sm text-gray-300">
                    {col.key === 'name' ? (
                      <Link href={`/admin/leads/${lead.id}`} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">
                        <div className="truncate max-w-xs">{String(lead[col.key] || '')}</div>
                      </Link>
                    ) : (
                      <div className="truncate max-w-xs">{String(lead[col.key] || '')}</div>
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="px-3 py-1 bg-blue-900/50 text-blue-400 rounded hover:bg-blue-900 transition text-xs font-bold"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => setEditingLead(lead)}
                      className="px-3 py-1 bg-[#F46325] text-white rounded hover:bg-[#E55A1A] transition text-xs font-bold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this record?')) {
                          handleDelete(lead.id);
                        }
                      }}
                      className="px-3 py-1 bg-red-900/50 text-red-400 rounded hover:bg-red-900 transition text-xs font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
        open={!!editingLead}
        row={editingLead}
        schema={editSchema}
        onSave={handleSave}
        onClose={() => setEditingLead(null)}
        rowIdField="id"
        title="Edit Lead"
      />
    </div>
  );
}
