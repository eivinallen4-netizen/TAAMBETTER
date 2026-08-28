'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function DashboardStats() {
  const [leadsCount, setLeadsCount] = useState(0);
  const [contactsCount, setContactsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    try {
      const leadsRes = await fetch('/api/admin/leads?limit=1&offset=0');
      const leadsData = await leadsRes.json();
      setLeadsCount(leadsData.total || 0);

      const contactsRes = await fetch('/api/admin/contacts?limit=1&offset=0');
      const contactsData = await contactsRes.json();
      setContactsCount(contactsData.total || 0);
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Link href="/admin/leads">
        <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg hover:border-[#F46325] transition cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm font-bold mb-2">LEADS</p>
              <p className="text-5xl font-black text-[#F46325]">
                {loading ? '-' : leadsCount}
              </p>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-4">Manage free video offer leads</p>
        </div>
      </Link>

      <Link href="/admin/contacts">
        <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg hover:border-[#F46325] transition cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm font-bold mb-2">CONTACTS</p>
              <p className="text-5xl font-black text-[#F46325]">
                {loading ? '-' : contactsCount}
              </p>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-4">Manage form submissions</p>
        </div>
      </Link>
    </div>
  );
}
