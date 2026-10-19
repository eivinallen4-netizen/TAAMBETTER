'use client';

import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Loader2, Plus } from 'lucide-react';
import { CopyButton } from '../components/NewOnboardingModal';

// API keys for the CRM REST API and the MCP endpoint, plus how to plug Claude in.

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

// Claude connects to the live site, so the snippets use its public URL.
const origin = (process.env.NEXT_PUBLIC_SITE_URL || 'https://taammarketing.com').replace(/\/$/, '');

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '—');

function Snippet({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-gray-300">{label}</span>
        <CopyButton text={text} label="Copy" />
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-gray-950 px-3 py-2 font-mono text-xs text-gray-200">{text}</pre>
    </div>
  );
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('Claude');
  const [saving, setSaving] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/api-keys', { cache: 'no-store' });
      if (res.ok) setKeys((await res.json()).data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/admin/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    setSaving(false);
    if (!res.ok) return;
    setFresh((await res.json()).key);
    load();
  }

  async function revoke(k: ApiKey) {
    if (!window.confirm(`Revoke "${k.name}"? Anything using it stops working right away.`)) return;
    await fetch(`/api/admin/api-keys?id=${encodeURIComponent(k.id)}`, { method: 'DELETE' });
    load();
  }

  const key = fresh ?? 'taam_YOUR_KEY';

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-4xl font-black">
          <KeyRound className="h-8 w-8 text-[#F46325]" /> API &amp; Claude
        </h1>
        <p className="mt-1 max-w-2xl text-gray-400">
          Connect Claude (or anything else) to the CRM. A key has full admin access: contacts, appointment links, onboarding, and sending email.
        </p>
      </div>

      <form onSubmit={create} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-gray-700 bg-gray-900 p-5">
        <label className="block min-w-[14rem] flex-1">
          <span className="mb-1.5 block text-sm font-semibold text-gray-300">Key name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-white focus:border-[#F46325] focus:outline-none"
            placeholder="Claude"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#F46325] px-5 py-2.5 font-bold text-white hover:bg-[#FF7B42] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />} New key
        </button>
      </form>

      {fresh && (
        <div className="mb-6 rounded-lg border border-[#F46325]/60 bg-[#F46325]/10 p-5">
          <p className="text-sm font-bold uppercase tracking-wider text-[#FF9A66]">Copy it now. It won&apos;t be shown again.</p>
          <p className="mt-3 break-all rounded-md bg-gray-950 px-3 py-2 font-mono text-sm text-white">{fresh}</p>
          <div className="mt-3">
            <CopyButton text={fresh} label="Copy key" />
          </div>
        </div>
      )}

      <div className="mb-8 space-y-4 rounded-lg border border-gray-700 bg-gray-900 p-5">
        <p className="text-sm font-bold uppercase tracking-wider text-gray-400">Connect Claude</p>
        <Snippet label="Claude Code (terminal)" text={`claude mcp add --transport http taam-crm ${origin}/api/mcp --header "Authorization: Bearer ${key}"`} />
        <Snippet label="Claude.ai / Claude desktop: Settings → Connectors → Add custom connector, paste this URL (it contains the key, keep it private)" text={`${origin}/api/mcp/${key}`} />
        <Snippet label="REST API (OpenAPI spec at /api/v1/openapi.json)" text={`curl -H "Authorization: Bearer ${key}" ${origin}/api/v1/contacts?search=pizza`} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-700 text-xs uppercase tracking-wider text-gray-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Made</th>
              <th className="px-4 py-3">Last used</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : keys.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  No keys yet.
                </td>
              </tr>
            ) : (
              keys.map((k) => (
                <tr key={k.id} className={`border-b border-gray-800 last:border-0 ${k.revoked_at ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-bold">{k.name}</td>
                  <td className="px-4 py-3 font-mono text-gray-300">{k.prefix}…</td>
                  <td className="px-4 py-3 text-gray-400">{fmt(k.created_at)}</td>
                  <td className="px-4 py-3 text-gray-400">{fmt(k.last_used_at)}</td>
                  <td className="px-4 py-3 text-right text-xs font-semibold">
                    {k.revoked_at ? (
                      <span className="text-gray-500">Revoked</span>
                    ) : (
                      <button type="button" onClick={() => revoke(k)} className="text-red-300 hover:text-red-200">
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
