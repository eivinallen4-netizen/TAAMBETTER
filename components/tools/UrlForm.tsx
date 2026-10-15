'use client';

import { useState } from 'react';
import Mascot from '@/components/editorial/Mascot';

interface UrlFormProps {
  onSubmit: (url: string) => void;
  loading: boolean;
  buttonLabel: string;
  loadingLabel: string;
}

/** One big address field and a button: the whole tool starts here. */
export default function UrlForm({ onSubmit, loading, buttonLabel, loadingLabel }: UrlFormProps) {
  const [url, setUrl] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (url.trim()) onSubmit(url.trim());
      }}
      className="relative flex flex-col md:flex-row gap-3"
    >
      {/* Stands on top of the button, flipping a coin while you type. */}
      <Mascot
        pose="sitting"
        size={128}
        className="mascot-pop hidden md:block absolute bottom-full right-8 mb-[-11px] w-24 lg:w-28 h-auto"
      />
      <label htmlFor="tool-url" className="sr-only">Website address</label>
      <input
        id="tool-url"
        type="text"
        inputMode="url"
        autoComplete="url"
        spellCheck={false}
        required
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="yourbusiness.com"
        className="min-w-0 flex-1 rounded-full bg-white/10 px-7 py-5 text-lg md:text-xl font-semibold outline-none placeholder:text-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white"
      />
      <button type="submit" disabled={loading} className="btn btn-solid justify-center !py-5 disabled:opacity-60">
        {loading ? loadingLabel : buttonLabel} {!loading && <span aria-hidden="true">↗</span>}
      </button>
    </form>
  );
}
