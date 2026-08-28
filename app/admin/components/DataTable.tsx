'use client';

import { useState } from 'react';

export interface TableColumn<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  keyField: string;
  onEdit: (row: T) => void;
  onDelete: (id: string) => void;
  onView?: (id: string) => void;
  loading?: boolean;
  onSortChange?: (key: string, dir: 'asc' | 'desc') => void;
  currentSort?: string;
  currentDir?: 'asc' | 'desc';
}

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  keyField,
  onEdit,
  onDelete,
  onView,
  loading = false,
  onSortChange,
  currentSort,
  currentDir = 'desc',
}: DataTableProps<T>) {
  const handleSort = (key: string) => {
    if (!onSortChange) return;
    const newDir =
      currentSort === key && currentDir === 'asc' ? 'desc' : 'asc';
    onSortChange(key, newDir);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>;
  }

  if (rows.length === 0) {
    return <div className="text-center py-8 text-gray-400">No records found</div>;
  }

  return (
    <div className="overflow-x-auto bg-gray-900 rounded-lg border border-gray-700">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-800">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-6 py-4 text-left text-sm font-bold text-gray-300 hover:text-white cursor-pointer"
                onClick={() => col.sortable !== false && handleSort(String(col.key))}
              >
                <div className="flex items-center gap-2">
                  {col.header}
                  {col.sortable !== false && currentSort === String(col.key) && (
                    <span className="text-xs">
                      {currentDir === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
            <th className="px-6 py-4 text-left text-sm font-bold text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={String(row[keyField as keyof T])}
              className="border-b border-gray-700 hover:bg-gray-800/50 transition"
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="px-6 py-4 text-sm text-gray-300">
                  <div className="truncate max-w-xs">
                    {String(row[col.key] || '')}
                  </div>
                </td>
              ))}
              <td className="px-6 py-4 text-sm">
                <div className="flex gap-2">
                  {onView && (
                    <button
                      onClick={() => onView(String(row[keyField as keyof T]))}
                      className="px-3 py-1 bg-blue-900/50 text-blue-400 rounded hover:bg-blue-900 transition text-xs font-bold"
                    >
                      View
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(row)}
                    className="px-3 py-1 bg-[#F46325] text-white rounded hover:bg-[#E55A1A] transition text-xs font-bold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this record?')) {
                        onDelete(String(row[keyField as keyof T]));
                      }
                    }}
                    className="px-3 py-1 bg-red-900/50 text-red-400 rounded hover:bg-red-900 transition text-xs font-bold"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
