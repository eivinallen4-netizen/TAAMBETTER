'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Trash2, Plus, Eye } from 'lucide-react';

interface IntakeLink {
  id: string;
  token: string;
  title: string | null;
  url: string;
  is_active: boolean;
  created_at: string;
}

export default function IntakeManagementPage() {
  const router = useRouter();
  const [links, setLinks] = useState<IntakeLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function loadLinks() {
      try {
        const sessionRes = await fetch('/api/auth/session');
        if (!sessionRes.ok) {
          router.push('/auth/login');
          return;
        }

        const res = await fetch('/api/intake-links');
        if (!res.ok) throw new Error('Failed to load intake links');

        const data = await res.json();
        setLinks(data.links || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load intake links');
      } finally {
        setLoading(false);
      }
    }

    loadLinks();
  }, [router]);

  async function handleCreateLink() {
    if (!newTitle.trim()) {
      setError('Please enter a title for this form');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/intake-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!res.ok) throw new Error('Failed to create intake link');

      const data = await res.json();
      setLinks([data.link, ...links]);
      setNewTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create intake link');
    } finally {
      setCreating(false);
    }
  }

  function copyToClipboard(url: string, linkId: string) {
    navigator.clipboard.writeText(url);
    setCopied(linkId);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="min-h-screen bg-taam-near-black text-white py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-3">Intake Forms</h1>
          <p className="text-gray-400 text-lg">Create and manage intake forms for your clients</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-200 rounded">
            {error}
          </div>
        )}

        {/* Create new link */}
        <div className="mb-12 p-6 bg-gray-900/50 border border-gray-700 rounded">
          <h2 className="text-xl font-bold mb-4">Create New Intake Form</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateLink()}
              placeholder="Form title (e.g., 'Q4 Campaign Setup')"
              className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 focus:border-[#F46325] outline-none text-white placeholder-gray-500 rounded transition"
            />
            <button
              onClick={handleCreateLink}
              disabled={creating}
              className="flex items-center gap-2 px-6 py-3 bg-[#F46325] text-white font-bold uppercase tracking-wide hover:bg-[#E55A1A] transition disabled:opacity-40 rounded"
            >
              <Plus size={20} />
              Create
            </button>
          </div>
        </div>

        {/* Links list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-400">Loading intake forms...</div>
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No intake forms yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link) => (
              <div
                key={link.id}
                className="p-6 bg-gray-900/50 border border-gray-700 rounded-lg hover:border-gray-600 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">{link.title || 'Untitled Form'}</h3>
                    <p className="text-xs text-gray-500">Created {new Date(link.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-bold uppercase rounded ${link.is_active ? 'bg-green-500/20 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                      {link.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <code className="flex-1 px-3 py-2 bg-gray-950 border border-gray-700 rounded text-xs text-gray-300 break-all">
                    {link.url}
                  </code>
                  <button
                    onClick={() => copyToClipboard(link.url, link.id)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition"
                    title="Copy link"
                  >
                    {copied === link.id ? '✓' : <Copy size={18} />}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/intake-management/${link.id}/submissions`)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#F46325] hover:bg-[#F46325]/10 rounded transition"
                  >
                    <Eye size={16} />
                    View Submissions
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
