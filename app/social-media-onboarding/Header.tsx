'use client';

import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <div className="mb-6 flex justify-end">
      <button
        onClick={handleLogout}
        className="text-gray-400 hover:text-white text-sm font-bold uppercase tracking-wide transition"
      >
        Sign Out
      </button>
    </div>
  );
}
