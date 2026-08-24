'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Instagram, Users, Music2, Youtube, Linkedin, Share2, Trash2, Plus } from 'lucide-react';

interface ConnectedAccount {
  id: string;
  platform: string;
  created_at: string;
  is_active: boolean;
}

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  facebook: Users,
  tiktok: Music2,
  youtube: Youtube,
  linkedin: Linkedin,
  twitter: Share2,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'from-pink-500 to-purple-500',
  facebook: 'from-blue-600 to-blue-400',
  tiktok: 'from-black to-gray-800',
  youtube: 'from-red-600 to-red-400',
  linkedin: 'from-blue-500 to-cyan-500',
  twitter: 'from-cyan-400 to-blue-500',
};

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuthAndLoadAccounts() {
      const sessionRes = await fetch('/api/auth/session');
      if (!sessionRes.ok) {
        router.push('/auth/login');
        return;
      }

      try {
        const res = await fetch('/api/social-media-accounts');
        if (!res.ok) throw new Error('Failed to load accounts');

        const data = await res.json();
        setAccounts(data.accounts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load accounts');
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndLoadAccounts();
  }, [router]);

  async function handleDisconnect(accountId: string) {
    if (!confirm('Are you sure you want to disconnect this account?')) return;

    setDisconnecting(accountId);

    try {
      const res = await fetch('/api/social-media-accounts/disconnect', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      if (!res.ok) throw new Error('Failed to disconnect account');

      setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect account');
    } finally {
      setDisconnecting(null);
    }
  }

  return (
    <div className="min-h-screen bg-taam-near-black text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-3">Connected Accounts</h1>
            <p className="text-gray-400 text-lg">Manage your social media accounts</p>
          </div>
          <button
            onClick={() => router.push('/social-media-onboarding')}
            className="flex items-center gap-2 px-6 py-3 bg-[#F46325] text-white font-bold uppercase tracking-wide hover:bg-[#E55A1A] transition rounded"
          >
            <Plus size={20} />
            Add Account
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-200 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-400">Loading accounts...</div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-6">No connected accounts yet</p>
            <button
              onClick={() => router.push('/social-media-onboarding')}
              className="px-8 py-4 bg-[#F46325] text-white font-bold uppercase tracking-wide hover:bg-[#E55A1A] transition rounded"
            >
              Connect Your First Account
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {accounts.map((account) => {
              const Icon = PLATFORM_ICONS[account.platform] || Instagram;
              const color = PLATFORM_COLORS[account.platform] || 'from-gray-600 to-gray-400';
              const platformName = account.platform.charAt(0).toUpperCase() + account.platform.slice(1);
              const createdDate = new Date(account.created_at).toLocaleDateString();

              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-6 bg-gray-900/50 border border-gray-700 rounded-lg hover:border-gray-600 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${color} text-white`}>
                      <Icon size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{platformName}</h3>
                      <p className="text-sm text-gray-400">Connected on {createdDate}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    disabled={disconnecting === account.id}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wide text-red-400 hover:bg-red-500/10 rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                    {disconnecting === account.id ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
