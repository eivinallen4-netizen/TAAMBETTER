'use client';

import { useState } from 'react';

export interface FieldSchema {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'email' | 'tel';
  required?: boolean;
  options?: { value: string; label: string }[];
}

interface EditRowModalProps {
  open: boolean;
  row: Record<string, any> | null;
  schema: FieldSchema[];
  onSave: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
  rowIdField: string;
  title: string;
}

export function EditRowModal({
  open,
  row,
  schema,
  onSave,
  onClose,
  rowIdField,
  title,
}: EditRowModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when row changes
  if (open && row && Object.keys(formData).length === 0) {
    const init: Record<string, any> = {};
    schema.forEach((field) => {
      init[field.key] = row[field.key] || '';
    });
    setFormData(init);
  }

  if (!open || !row) {
    return null;
  }

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const rowId = String(row[rowIdField]);
      await onSave(rowId, formData);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    setError(null);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {schema.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-bold mb-2 text-gray-300">
                    {field.label}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      value={String(formData[field.key] || '')}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      required={field.required}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 focus:border-[#F46325] outline-none text-white rounded transition min-h-24"
                    />
                  ) : field.type === 'select' && field.options ? (
                    <select
                      value={String(formData[field.key] || '')}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      required={field.required}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 focus:border-[#F46325] outline-none text-white rounded transition"
                    >
                      <option value="">Select...</option>
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={String(formData[field.key] || '')}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      required={field.required}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 focus:border-[#F46325] outline-none text-white rounded transition"
                    />
                  )}
                </div>
              ))}

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-[#F46325] text-white rounded hover:bg-[#E55A1A] transition disabled:opacity-50 font-bold"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
