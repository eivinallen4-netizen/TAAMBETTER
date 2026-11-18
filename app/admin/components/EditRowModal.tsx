'use client';

import { useId, useState } from 'react';
import { Button, Field, Input, Modal } from '@taam/crm/client';
import { fieldClass } from './crm-ui';

export interface FieldSchema {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'email' | 'tel';
  required?: boolean;
  options?: { value: string; label: string }[];
}

interface EditRowModalProps {
  open: boolean;
  row: object | null;
  schema: FieldSchema[];
  onSave: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
  rowIdField: string;
  title: string;
}

// An edit dialog built from a list of fields, in the CRM's own dialog and field styles.
export function EditRowModal({ open, row, schema, onSave, onClose, rowIdField, title }: EditRowModalProps) {
  const formId = useId();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fill the form when a row opens.
  if (open && row && Object.keys(formData).length === 0) {
    const init: Record<string, unknown> = {};
    schema.forEach((field) => {
      init[field.key] = (row as Record<string, unknown>)[field.key] || '';
    });
    setFormData(init);
  }

  if (!open || !row) return null;

  const handleChange = (key: string, value: unknown) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleClose = () => {
    setFormData({});
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(String((row as Record<string, unknown>)[rowIdField]), formData);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} variant="primary" busy={saving} busyLabel="Saving…">
            Save changes
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {schema.map((field) => (
          <Field key={field.key} label={field.label} required={field.required}>
            {field.type === 'textarea' ? (
              <textarea
                rows={4}
                value={String(formData[field.key] || '')}
                onChange={(e) => handleChange(field.key, e.target.value)}
                required={field.required}
                className={`${fieldClass} resize-y`}
              />
            ) : field.type === 'select' && field.options ? (
              <select
                value={String(formData[field.key] || '')}
                onChange={(e) => handleChange(field.key, e.target.value)}
                required={field.required}
                className={fieldClass}
              >
                <option value="">Choose…</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                type={field.type}
                value={String(formData[field.key] || '')}
                onChange={(e) => handleChange(field.key, e.target.value)}
                required={field.required}
              />
            )}
          </Field>
        ))}
        {error && (
          <p role="alert" className="text-sm text-[var(--crm-bad)]">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
