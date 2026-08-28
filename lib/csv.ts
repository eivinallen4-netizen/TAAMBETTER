export interface CsvColumn<T> {
  key: keyof T;
  header: string;
}

function escapeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Formula injection prevention: prefix with single quote
  if (str.match(/^[=+\-@]/)) {
    return `'${str}`;
  }

  // Escape quotes and wrap if contains special chars
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  // UTF-8 BOM for Excel
  const bom = '﻿';

  // Header row
  const headers = columns.map((col) => escapeValue(col.header)).join(',');

  // Data rows
  const dataRows = rows.map((row) =>
    columns.map((col) => escapeValue(row[col.key])).join(',')
  );

  return bom + [headers, ...dataRows].join('\n');
}
