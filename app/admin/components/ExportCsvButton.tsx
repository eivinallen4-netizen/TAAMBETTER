'use client';

interface ExportCsvButtonProps {
  dataset: 'leads' | 'contacts';
  search?: string;
}

export function ExportCsvButton({ dataset, search = '' }: ExportCsvButtonProps) {
  const params = new URLSearchParams();
  if (search) {
    params.append('search', search);
  }

  const href = `/api/admin/${dataset}/export?${params.toString()}`;

  return (
    <a
      href={href}
      download
      className="px-6 py-2 bg-green-700 text-white rounded hover:bg-green-600 transition text-sm font-bold inline-block"
    >
      Export CSV
    </a>
  );
}
