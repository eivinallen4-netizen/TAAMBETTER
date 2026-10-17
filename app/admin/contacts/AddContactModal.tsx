'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, X } from 'lucide-react';
import { LogoDrop } from '../components/ContactLogo';

// Add someone to the CRM by hand, logo and all. Lands on their page, ready to send them something.

export function AddContactModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', business_name: '', website: '', message: '' });
  const [logo, setLogo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, logo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not add contact');
      router.push(`/admin/contacts/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add contact');
      setBusy(false);
    }
  }

  const input = 'w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-xl rounded-xl border border-gray-700 bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <UserPlus className="h-6 w-6 text-[#F46325]" /> Add contact
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            <LogoDrop src={logo} name={form.name} business={form.business_name} size="md" onChange={setLogo} pasteAnywhere />
            <p className="text-sm text-gray-400">
              <span className="block font-bold text-gray-200">Company logo</span>
              Click it, drop an image on it, or paste one.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input className={input} value={form.name} onChange={set('name')} placeholder="Name *" aria-label="Name" required autoFocus />
            <input className={input} value={form.business_name} onChange={set('business_name')} placeholder="Business" aria-label="Business" />
            <input type="email" className={input} value={form.email} onChange={set('email')} placeholder="Email *" aria-label="Email" required />
            <input type="tel" className={input} value={form.phone} onChange={set('phone')} placeholder="Phone" aria-label="Phone" />
            <input className={`${input} sm:col-span-2`} value={form.website} onChange={set('website')} placeholder="Website or Instagram" aria-label="Website" />
            <textarea className={`${input} resize-y sm:col-span-2`} rows={2} value={form.message} onChange={set('message')} placeholder="Notes (how you met, what they need…)" aria-label="Notes" />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={busy} className="w-full rounded-lg bg-[#F46325] py-3 font-bold text-white hover:bg-[#FF7B42] disabled:opacity-50">
            {busy ? 'Adding…' : 'Add contact'}
          </button>
        </div>
      </form>
    </div>
  );
}
