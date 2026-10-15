'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAdminAuth } from '@/lib/useAdminAuth';
import Link from 'next/link';
import {
  BUDGET_OPTIONS,
  INDUSTRY_OPTIONS,
  LEAD_FIT_LABELS,
  ROLE_OPTIONS,
  STAGE_OPTIONS,
  TIMELINE_OPTIONS,
  optionLabel,
  type LeadFit,
} from '@/app/lib/cta';

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
  industry?: string | null;
  business_stage?: string | null;
  budget?: string | null;
  timeline?: string | null;
  website?: string | null;
  lead_fit?: string | null;
  role?: string | null;
}

export default function ContactDetailsPage() {
  useAdminAuth();
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Contact>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchContact();
  }, [contactId]);

  async function fetchContact() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/contacts/${contactId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Contact not found');
        } else {
          setError('Failed to load contact');
        }
        return;
      }
      const data = await res.json();
      setContact(data);
      setFormData(data);
    } catch (err) {
      setError('Failed to load contact');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!contact) return;

    setIsSaving(true);
    try {
      const updates = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        business_name: formData.business_name,
        message: formData.message,
        completion_status: formData.completion_status,
        source_page: formData.source_page,
        biggest_challenge: formData.biggest_challenge,
        services_interested: formData.services_interested,
      };

      const res = await fetch(`/api/admin/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        setError('Failed to save contact');
        return;
      }

      const updatedContact = await res.json();
      setContact(updatedContact);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save contact');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/admin/contacts/${contactId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        setError('Failed to delete contact');
        return;
      }

      router.push('/admin/contacts');
    } catch (err) {
      setError('Failed to delete contact');
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

  if (error || !contact) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href="/admin/contacts"
          className="inline-flex items-center gap-2 text-[#F46325] hover:text-[#f0b896] mb-6 transition"
        >
          ← Back to Contacts
        </Link>
        <div className="bg-red-900/20 border border-red-700 rounded p-4 text-red-400">
          {error || 'Contact not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/admin/contacts"
        className="inline-flex items-center gap-2 text-[#F46325] hover:text-[#f0b896] mb-6 transition"
      >
        ← Back to Contacts
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">{contact.name}</h1>
        <p className="text-gray-400">Contact ID: {contact.id}</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-700 rounded p-4 text-red-400">
          {error}
        </div>
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
              <label className="block text-sm font-bold mb-2 text-gray-300">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              <label className="block text-sm font-bold mb-2 text-gray-300">Status</label>
              <select
                value={formData.completion_status || ''}
                onChange={(e) => setFormData({ ...formData, completion_status: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 focus:border-[#F46325] outline-none text-white rounded transition"
              >
                <option value="">Select a status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-300">Message</label>
              <textarea
                value={formData.message || ''}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 focus:border-[#F46325] outline-none text-white rounded transition min-h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-300">Biggest Challenge</label>
              <input
                type="text"
                value={formData.biggest_challenge || ''}
                onChange={(e) => setFormData({ ...formData, biggest_challenge: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 focus:border-[#F46325] outline-none text-white rounded transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-300">Services Interested</label>
              <input
                type="text"
                value={formData.services_interested || ''}
                onChange={(e) => setFormData({ ...formData, services_interested: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 focus:border-[#F46325] outline-none text-white rounded transition"
              />
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
                  setFormData(contact);
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
                <p className="text-lg text-white">{contact.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Email</p>
                <p className="text-lg text-white">{contact.email}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Phone</p>
                <p className="text-lg text-white">{contact.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Business Name</p>
                <p className="text-lg text-white">{contact.business_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Status</p>
                <p className="text-lg text-white capitalize">{contact.completion_status}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Source Page</p>
                <p className="text-lg text-white">{contact.source_page || 'N/A'}</p>
              </div>
            </div>

            {(contact.lead_fit || contact.budget || contact.industry) && (
              <div className="grid grid-cols-2 gap-6 border-t border-gray-700 pt-6">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Lead Fit</p>
                  <p className="text-lg text-white">
                    {LEAD_FIT_LABELS[contact.lead_fit as LeadFit] ?? (contact.lead_fit || 'N/A')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Role</p>
                  <p className="text-lg text-white">{optionLabel(ROLE_OPTIONS, contact.role) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Monthly Budget</p>
                  <p className="text-lg text-white">{optionLabel(BUDGET_OPTIONS, contact.budget) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Timeline</p>
                  <p className="text-lg text-white">{optionLabel(TIMELINE_OPTIONS, contact.timeline) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Industry</p>
                  <p className="text-lg text-white">{optionLabel(INDUSTRY_OPTIONS, contact.industry) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Time in Business</p>
                  <p className="text-lg text-white">{optionLabel(STAGE_OPTIONS, contact.business_stage) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Website / Instagram</p>
                  <p className="text-lg text-white break-all">{contact.website || 'N/A'}</p>
                </div>
              </div>
            )}

            {contact.message && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Message</p>
                <p className="text-white whitespace-pre-wrap">{contact.message}</p>
              </div>
            )}

            {contact.biggest_challenge && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Biggest Challenge</p>
                <p className="text-white">{contact.biggest_challenge}</p>
              </div>
            )}

            {contact.services_interested && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Services Interested</p>
                <p className="text-white">{contact.services_interested}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Created At</p>
              <p className="text-white">
                {new Date(contact.timestamp).toLocaleString()}
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
            <h2 className="text-xl font-bold text-white mb-4">Delete Contact?</h2>
            <p className="text-gray-400 mb-6">
              This will permanently delete <span className="font-semibold text-white">{contact.name}</span> and all associated data.
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
