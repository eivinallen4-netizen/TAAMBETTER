'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAdminAuth } from '@/lib/useAdminAuth';
import Link from 'next/link';
import { SendPanel } from '../../components/SendPanel';

interface Lead {
  id: string;
  name: string;
  phone: string;
  business_name: string;
  sales_range: string;
  created_at: string;
}

export default function LeadDetailsPage() {
  useAdminAuth();
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  async function fetchLead() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Lead not found');
        } else {
          setError('Failed to load lead');
        }
        return;
      }
      const data = await res.json();
      setLead(data);
      setFormData(data);
    } catch (err) {
      setError('Failed to load lead');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!lead) return;

    setIsSaving(true);
    try {
      const updates = {
        name: formData.name,
        phone: formData.phone,
        business_name: formData.business_name,
        sales_range: formData.sales_range,
      };

      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        setError('Failed to save lead');
        return;
      }

      const updatedLead = await res.json();
      setLead(updatedLead);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save lead');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        setError('Failed to delete lead');
        return;
      }

      router.push('/admin/leads');
    } catch (err) {
      setError('Failed to delete lead');
      console.error('Delete error:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-[#F46325] hover:text-[#f0b896] mb-6 transition"
        >
          ← Back to Leads
        </Link>
        <div className="bg-red-900/20 border border-red-700 rounded p-4 text-red-400">
          {error || 'Lead not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-2 text-[#F46325] hover:text-[#f0b896] mb-6 transition"
      >
        ← Back to Leads
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">{lead.name}</h1>
        <p className="text-gray-400">Lead ID: {lead.id}</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-700 rounded p-4 text-red-400">
          {error}
        </div>
      )}

      {!isEditing && (
        <SendPanel recipient={{ name: lead.name, email: '', businessName: lead.business_name, source: 'lead', sourceId: lead.id }} />
      )}

      <div className="bg-gray-900 rounded-lg border border-gray-700 p-8 mb-6">
        {isEditing ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-300">Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 focus:border-[#F46325] outline-none text-white rounded transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-300">Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 focus:border-[#F46325] outline-none text-white rounded transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-300">Business Name</label>
              <input
                type="text"
                value={formData.business_name || ''}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 focus:border-[#F46325] outline-none text-white rounded transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-300">Sales Range</label>
              <select
                value={formData.sales_range || ''}
                onChange={(e) => setFormData({ ...formData, sales_range: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 focus:border-[#F46325] outline-none text-white rounded transition"
              >
                <option value="">Select a range</option>
                <option value="Under $10k">Under $10k</option>
                <option value="$10k - $50k">$10k - $50k</option>
                <option value="$50k - $100k">$50k - $100k</option>
                <option value="$100k - $500k">$100k - $500k</option>
                <option value="$500k - $1M">$500k - $1M</option>
                <option value="Over $1M">Over $1M</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-[#F46325] text-white font-bold rounded hover:bg-[#f0b896] disabled:opacity-50 transition"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(lead);
                }}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 font-bold rounded hover:bg-gray-700 disabled:opacity-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Name</p>
                <p className="text-lg text-white">{lead.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Phone</p>
                <p className="text-lg text-white">{lead.phone}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Business Name</p>
                <p className="text-lg text-white">{lead.business_name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Sales Range</p>
                <p className="text-lg text-white">{lead.sales_range}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Created At</p>
              <p className="text-white">
                {new Date(lead.created_at).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-4 py-2 bg-[#F46325] text-white font-bold rounded hover:bg-[#f0b896] transition"
              >
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 px-4 py-2 bg-red-900 text-red-300 font-bold rounded hover:bg-red-800 transition"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-sm mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Delete Lead?</h2>
            <p className="text-gray-400 mb-6">
              This will permanently delete <span className="font-semibold text-white">{lead.name}</span> and all associated data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-900 text-red-300 font-bold rounded hover:bg-red-800 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 font-bold rounded hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
