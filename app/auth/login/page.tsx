'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      router.push('/social-media-onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-taam-near-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-3">Welcome Back</h1>
          <p className="text-gray-400 text-lg">Sign in to manage your social media accounts</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 focus:border-[#F46325] outline-none text-white placeholder-gray-500 rounded transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-300">Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 focus:border-[#F46325] outline-none text-white placeholder-gray-500 rounded transition"
              placeholder="Your name"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-4 bg-[#F46325] text-white font-black text-sm md:text-base uppercase tracking-wide hover:bg-[#E55A1A] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
