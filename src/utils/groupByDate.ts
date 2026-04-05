import type { TransactionWithCategory } from '../db/types';
import { formatDisplayDate } from './dates';

export interface Section {
  title: string;
  iso: string;
  data: TransactionWithCategory[];
}

export function groupTransactionsByDate(
  rows: TransactionWithCategory[]
): Section[] {
  const map = new Map<string, TransactionWithCategory[]>();
  for (const r of rows) {
    const key = r.occurred_at;
    const list = map.get(key) ?? [];
    list.push(r);
    map.set(key, list);
  }
  const sections: Section[] = [];
  for (const [iso, data] of map) {
    sections.push({
      iso,
      title: formatDisplayDate(iso),
      data,
    });
  }
  sections.sort((a, b) => (a.iso < b.iso ? 1 : -1));
  return sections;
}
