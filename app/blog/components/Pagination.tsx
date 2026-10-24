import Link from 'next/link';
import type { PageInfo } from '../pagination';
import { pageHref } from '../pagination';

export function Pagination({ basePath, info }: { basePath: string; info: PageInfo }) {
  if (info.totalPages <= 1) {
    return null;
  }
  return (
    <nav className="mt-12 flex items-center justify-between gap-4" aria-label="Pagination">
      {info.hasPrev ? (
        <Link href={pageHref(basePath, info.page - 1)} className="btn btn-solid">
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="eyebrow opacity-70">
        Page {info.page} of {info.totalPages}
      </span>
      {info.hasNext ? (
        <Link href={pageHref(basePath, info.page + 1)} className="btn btn-solid">
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
