'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';

// A contact's company logo (or their initials when there isn't one), plus the drop / click / paste
// uploader. Uploads are shrunk in the browser so the stored logo stays small.

const MAX_SIDE = 256;
const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml,image/gif';

export function logoUrl(id: string, version?: string | null) {
  return version ? `/api/admin/contacts/${id}/logo?v=${encodeURIComponent(version)}` : '';
}

function initials(name: string, business: string) {
  const words = (business || name).trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?';
}

const SIZES = {
  sm: 'h-10 w-10 rounded-lg text-sm',
  md: 'h-14 w-14 rounded-xl text-lg',
  lg: 'h-24 w-24 rounded-2xl text-3xl sm:h-28 sm:w-28',
};

export function ContactAvatar({
  src,
  name,
  business = '',
  size = 'sm',
}: {
  src?: string;
  name: string;
  business?: string;
  size?: keyof typeof SIZES;
}) {
  // Remember which URL failed, so a new upload gets a fresh try.
  const [brokenSrc, setBrokenSrc] = useState('');

  return src && src !== brokenSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${business || name} logo`}
      onError={() => setBrokenSrc(src)}
      className={`${SIZES[size]} shrink-0 border border-gray-700 bg-white object-contain p-1`}
    />
  ) : (
    <span
      aria-hidden
      className={`${SIZES[size]} flex shrink-0 items-center justify-center border border-[#F46325]/40 bg-[#F46325]/15 font-black tracking-tight text-[#FF9A66]`}
    >
      {initials(name, business)}
    </span>
  );
}

/** Reads an image file and returns it as a small PNG/WebP data: URL that fits in MAX_SIDE. */
export async function shrinkLogo(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('That file isn’t an image');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Couldn’t read that image'));
      el.src = url;
    });
    const w = img.naturalWidth || MAX_SIDE;
    const h = img.naturalHeight || MAX_SIDE;
    const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    // WebP keeps transparency and stays small; browsers that can't encode it hand back PNG.
    return canvas.toDataURL('image/webp', 0.9);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** The first image on the clipboard, if any. */
export function imageFromClipboard(e: ClipboardEvent | React.ClipboardEvent): File | null {
  for (const item of Array.from(e.clipboardData?.items ?? [])) {
    if (item.kind === 'file' && item.type.startsWith('image/')) return item.getAsFile();
  }
  return null;
}

/**
 * The logo as a drop zone: click to pick a file, drop one on it, or paste an image anywhere on the
 * page while it's mounted (unless you're typing in a field).
 */
export function LogoDrop({
  src,
  name,
  business,
  size = 'lg',
  onChange,
  pasteAnywhere = false,
}: {
  src?: string;
  name: string;
  business?: string;
  size?: keyof typeof SIZES;
  /** Called with the shrunk data: URL, or '' to remove it. */
  onChange: (logo: string) => Promise<void> | void;
  pasteAnywhere?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');

  async function take(file: File | null | undefined) {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      await onChange(await shrinkLogo(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save that logo');
    } finally {
      setBusy(false);
    }
  }

  const takeRef = useRef(take);
  useEffect(() => {
    takeRef.current = take;
  });
  useEffect(() => {
    if (!pasteAnywhere) return;
    function onPaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"]')) return;
      const file = imageFromClipboard(e);
      if (file) {
        e.preventDefault();
        takeRef.current(file);
      }
    }
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [pasteAnywhere]);

  return (
    <div className="flex shrink-0 flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files[0]);
        }}
        title={src ? 'Change logo (click, drop or paste)' : 'Add their logo (click, drop or paste)'}
        className={`group relative rounded-2xl outline-none ring-[#F46325] ring-offset-2 ring-offset-gray-900 focus-visible:ring-2 ${over ? 'ring-2' : ''}`}
      >
        <ContactAvatar src={src} name={name} business={business} size={size} />
        <span
          className={`absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl bg-black/70 text-[11px] font-bold uppercase tracking-wider text-white transition ${
            busy || over ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5 text-[#F46325]" />}
          {busy ? 'Saving' : src ? 'Change' : 'Add logo'}
        </span>
      </button>
      {src && !busy && (
        <button
          type="button"
          onClick={async () => {
            setBusy(true);
            try {
              await onChange('');
            } finally {
              setBusy(false);
            }
          }}
          className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-red-300"
        >
          <Trash2 className="h-3 w-3" /> Remove
        </button>
      )}
      {error && <p className="max-w-[10rem] text-xs text-red-400">{error}</p>}
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
