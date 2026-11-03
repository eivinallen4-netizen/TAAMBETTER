// Line diff for the page history view (LCS). Bodies are a few hundred lines, so the quadratic
// table is fine; past the cap it falls back to "all removed, all added".

export type DiffLine = { type: 'same' | 'add' | 'del'; text: string };

const CAP = 2500;

export function diffLines(before: string, after: string): DiffLine[] {
  const a = before ? before.split('\n') : [];
  const b = after ? after.split('\n') : [];
  if (a.length > CAP || b.length > CAP) {
    return [...a.map((text) => ({ type: 'del' as const, text })), ...b.map((text) => ({ type: 'add' as const, text }))];
  }
  const n = a.length;
  const m = b.length;
  const table = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: 'same', text: a[i] });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      out.push({ type: 'del', text: a[i++] });
    } else {
      out.push({ type: 'add', text: b[j++] });
    }
  }
  while (i < n) out.push({ type: 'del', text: a[i++] });
  while (j < m) out.push({ type: 'add', text: b[j++] });
  return out;
}

/** Any field value as diffable text: arrays one item per line, FAQ as Q/A pairs. */
export function fieldText(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((v) => (v && typeof v === 'object' ? `Q: ${(v as { question?: string }).question ?? ''}\nA: ${(v as { answer?: string }).answer ?? ''}` : String(v)))
      .join('\n');
  }
  return value == null ? '' : String(value);
}
