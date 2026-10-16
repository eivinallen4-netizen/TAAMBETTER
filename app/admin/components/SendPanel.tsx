'use client';

import { useCallback, useEffect, useState } from 'react';
import { Globe, Link2, Share2, Video, type LucideIcon } from 'lucide-react';
import { MESSAGE_META, MESSAGE_TYPES, type MessageType, type SentMessage } from '@/app/lib/crm-messages';
import { SendModal, type Recipient } from './SendModal';

// The "send them something" card on a person's CRM page, with everything already sent to them.

const ICONS: Record<MessageType, LucideIcon> = {
  website_onboarding: Globe,
  social_onboarding: Share2,
  zoom: Video,
  link: Link2,
};

export function SendPanel({ recipient, onSent, types = MESSAGE_TYPES }: { recipient: Recipient; onSent?: () => void; types?: readonly MessageType[] }) {
  const [open, setOpen] = useState<MessageType | null>(null);
  const [sent, setSent] = useState<SentMessage[]>([]);

  const load = useCallback(() => {
    if (!recipient.email) return;
    fetch(`/api/admin/send?email=${encodeURIComponent(recipient.email)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setSent(d.data ?? []))
      .catch(() => {});
  }, [recipient.email]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="mb-6 rounded-lg border border-gray-700 bg-gray-900 p-6">
      <h2 className="mb-1 text-lg font-black uppercase tracking-wide">Send them something</h2>
      <p className="mb-4 text-sm text-gray-400">Every email goes out branded, from TAAM. Onboarding is for paid clients.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {types.map((t) => {
          const Icon = ICONS[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => setOpen(t)}
              className="flex flex-col items-start gap-2 rounded-lg border border-gray-700 p-3 text-left text-sm font-bold text-gray-200 transition hover:border-[#F46325] hover:bg-[#F46325]/10 hover:text-white"
            >
              <Icon className="h-5 w-5 text-[#F46325]" />
              {MESSAGE_META[t].label}
            </button>
          );
        })}
      </div>

      {recipient.email && sent.length > 0 && (
        <div className="mt-5 border-t border-gray-800 pt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Sent</p>
          <ul className="space-y-2 text-sm">
            {sent.map((m) => (
              <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="min-w-0">
                  <span className="font-bold text-white">{MESSAGE_META[m.type]?.label ?? m.type}</span>
                  <span className="text-gray-400"> · {m.subject}</span>
                  {m.link && (
                    <a href={m.link} target="_blank" rel="noreferrer" className="block truncate text-xs text-[#FF9A66] hover:underline">
                      {m.link}
                    </a>
                  )}
                </span>
                <span className="shrink-0 text-xs text-gray-500">{new Date(m.sent_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && (
        <SendModal
          recipient={recipient}
          defaultType={open}
          onClose={() => setOpen(null)}
          onSent={() => {
            load();
            onSent?.();
          }}
        />
      )}
    </section>
  );
}
