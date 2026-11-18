'use client';

import { useRef, type InputHTMLAttributes, type KeyboardEvent, type SelectHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

// The CRM kit's tabs, search box and select, for the website's own admin screens (SEO pages,
// client slides, video offers). @taam/crm/client doesn't export these three, so they are copied
// here with the same look. Colours come from the CRM's --crm-* variables (set on .crm-root), written
// as arbitrary values so the website's own Tailwind build always generates them.

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

/** Same as the kit's inputClass: one field style for every input, select and textarea. */
export const fieldClass =
  'w-full min-h-10 rounded-[var(--crm-radius-control)] border border-[var(--crm-field)] bg-[var(--crm-raised)] px-3 py-2 text-base text-[var(--crm-ink)] transition-colors placeholder:text-[var(--crm-muted)] hover:border-[var(--crm-muted)] focus:border-[var(--crm-brand)] focus:outline-none disabled:opacity-60 sm:text-sm';

export function SearchInput({ label, className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string }) {
  return (
    <div className={cx('relative min-w-0', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--crm-muted)]" aria-hidden />
      <input type="search" aria-label={label} placeholder={label} {...props} className={cx(fieldClass, 'pl-9')} />
    </div>
  );
}

export function SelectInput({ options, className, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  return (
    <select {...props} className={cx(fieldClass.replace('w-full ', ''), 'w-auto shrink-0 pr-8', className)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Underline tabs with a count pill on each, like the CRM's list screens. */
export function Tabs<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string; count?: number }[];
  label?: string;
}) {
  const list = useRef<HTMLDivElement>(null);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = options.findIndex((o) => o.value === value);
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % options.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + options.length) % options.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    if (next < 0) return;
    event.preventDefault();
    onChange(options[next].value);
    list.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };
  return (
    <div
      ref={list}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="mb-4 flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--crm-line)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cx(
              'inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1.5 text-sm font-medium transition-colors',
              on
                ? 'border-[var(--crm-brand)] text-[var(--crm-ink)]'
                : 'border-transparent text-[var(--crm-muted)] hover:border-[var(--crm-field)] hover:text-[var(--crm-ink)]'
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span
                className={cx(
                  'inline-grid min-w-5 place-items-center rounded-full px-1.5 py-px text-[11px] font-semibold leading-4 tabular-nums',
                  on ? 'bg-[color-mix(in_oklab,var(--crm-brand)_15%,transparent)] text-[var(--crm-brand-ink)]' : 'bg-[var(--crm-line)] text-[var(--crm-muted)]'
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
