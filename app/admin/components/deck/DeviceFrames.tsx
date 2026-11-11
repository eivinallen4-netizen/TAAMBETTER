// Flat, bold-outline device frames for showing client websites on slides.
// Plain <img> inside so Save PDF and the image export both pick them up.

const LINE = '#111111';

/** A desktop browser window: thick outline, three dots and an address bar. */
export function BrowserFrame({ src, url, width, className = '' }: { src: string; url: string; width: number; className?: string }) {
  const bar = Math.round(width * 0.055);
  return (
    <div
      className={`overflow-hidden bg-white ${className}`}
      style={{ width, borderRadius: 28, border: `8px solid ${LINE}`, boxShadow: '0 40px 90px rgba(0,0,0,0.35)' }}
    >
      <div className="flex items-center gap-[14px] px-[22px]" style={{ height: bar, borderBottom: `6px solid ${LINE}` }}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-[18px] w-[18px] rounded-full" style={{ border: `4px solid ${LINE}` }} />
        ))}
        <span
          className="ml-4 flex-1 truncate rounded-full px-6 text-[20px] font-bold leading-[34px] text-[#111]"
          style={{ border: `4px solid ${LINE}` }}
        >
          {url}
        </span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="block w-full" style={{ aspectRatio: '1440 / 900', objectFit: 'cover', objectPosition: 'top' }} />
    </div>
  );
}

/** A phone: thick outline, rounded body and a speaker slot. Pass a position class (e.g. `absolute …`); it defaults to relative. */
export function PhoneFrame({ src, width, className = '' }: { src: string; width: number; className?: string }) {
  const pad = Math.round(width * 0.045);
  return (
    <div
      className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} bg-white ${className}`}
      style={{ width, padding: pad, paddingTop: pad * 2.6, paddingBottom: pad * 2.2, borderRadius: width * 0.16, border: `8px solid ${LINE}`, boxShadow: '0 40px 90px rgba(0,0,0,0.4)' }}
    >
      <span
        className="absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{ top: pad * 0.9, width: width * 0.28, height: pad * 0.7, background: LINE }}
      />
      <div className="overflow-hidden" style={{ borderRadius: width * 0.08, border: `5px solid ${LINE}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="block w-full" style={{ aspectRatio: '500 / 1000', objectFit: 'cover', objectPosition: 'top' }} />
      </div>
    </div>
  );
}
