'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface Submission {
  id: string;
  email: string;
  name: string | null;
  accountCount: number;
  platforms: string[];
  submittedAt: string;
}

export default function SubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const linkId = params.id as string;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubmissions() {
      try {
        const sessionRes = await fetch('/api/auth/session');
        if (!sessionRes.ok) {
          router.push('/auth/login');
          return;
        }

        const res = await fetch(`/api/intake-links/${linkId}/submissions`);
        if (!res.ok) throw new Error('Failed to load submissions');

        const data = await res.json();
        setSubmissions(data.submissions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    }

    loadSubmissions();
  }, [linkId, router]);

  const totalAccounts = submissions.reduce((sum, s) => sum + s.accountCount, 0);
  const allPlatforms = new Set(submissions.flatMap((s) => s.platforms));

  return (
    <div className="min-h-screen bg-taam-near-black text-white py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-6">Form Submissions</h1>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-gray-900/50 border border-gray-700 rounded">
              <p className="text-gray-400 text-sm mb-1">Total Submissions</p>
              <p className="text-3xl font-bold">{submissions.length}</p>
            </div>
            <div className="p-4 bg-gray-900/50 border border-gray-700 rounded">
              <p className="text-gray-400 text-sm mb-1">Total Accounts</p>
              <p className="text-3xl font-bold">{totalAccounts}</p>
            </div>
            <div className="p-4 bg-gray-900/50 border border-gray-700 rounded">
              <p className="text-gray-400 text-sm mb-1">Platforms</p>
              <p className="text-3xl font-bold">{allPlatforms.size}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-200 rounded">
            {error}
          </div>
        )}

        {/* Submissions list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-400">Loading submissions...</div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No submissions yet. Share your intake form link to start receiving submissions!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="p-6 bg-gray-900/50 border border-gray-700 rounded-lg hover:border-gray-600 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold">{submission.name || 'Anonymous'}</h3>
                    <p className="text-sm text-gray-400">{submission.email}</p>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(submission.submittedAt).toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-[#F46325]/20 text-[#F46325] text-xs font-bold rounded">
                    {submission.accountCount} account{submission.accountCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {submission.platforms.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {submission.platforms.map((platform) => (
                      <span
                        key={platform}
                        className="px-3 py-1 bg-gray-800 text-gray-300 text-xs font-bold rounded capitalize"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
