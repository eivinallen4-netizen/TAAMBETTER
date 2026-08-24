'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';

export default function VerifyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      const sessionRes = await fetch('/api/auth/session');
      if (!sessionRes.ok) {
        router.push('/auth/login');
      }
    }
    checkSession();
  }, [router]);

  async function handleSendVerification() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send verification email');
      }

      const data = await res.json();
      setSent(true);

      // In development, show the token
      if (data.token) {
        setToken(data.token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-taam-near-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-[#F46325]/20 rounded-full">
            <Mail size={48} className="text-[#F46325]" />
          </div>
        </div>

        <h1 className="text-4xl font-black mb-3 text-center">Verify Your Email</h1>
        <p className="text-gray-400 text-lg text-center mb-8">
          We've sent a verification link to your email. Click it to continue.
        </p>

        {error && <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded mb-6">{error}</div>}

        {sent ? (
          <div className="bg-green-500/20 border border-green-500 text-green-200 p-4 rounded">
            <p className="font-bold mb-2">✓ Verification email sent!</p>
            <p className="text-sm mb-4">Check your inbox for the verification link.</p>

            {token && (
              <div className="mt-4 p-3 bg-gray-900 rounded text-xs">
                <p className="text-gray-400 mb-2">Development token:</p>
                <code className="break-all text-gray-300">{token}</code>
              </div>
            )}

            <button
              onClick={handleSendVerification}
              disabled={loading}
              className="mt-4 w-full text-sm font-bold uppercase tracking-wide text-gray-400 hover:text-white transition disabled:opacity-40"
            >
              Resend Email
            </button>
          </div>
        ) : (
          <button
            onClick={handleSendVerification}
            disabled={loading}
            className="w-full px-8 py-4 bg-[#F46325] text-white font-black text-sm md:text-base uppercase tracking-wide hover:bg-[#E55A1A] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Verification Email'}
          </button>
        )}

        <p className="text-center text-gray-400 text-sm mt-8">
          Already verified?{' '}
          <button
            onClick={() => router.push('/social-media-onboarding')}
            className="text-[#F46325] hover:underline font-bold"
          >
            Go to onboarding
          </button>
        </p>
      </div>
    </div>
  );
}
