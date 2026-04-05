import * as Crypto from 'expo-crypto';
import { getDatabase } from '../db/database';
import type {
  TransactionFilters,
  TransactionWithCategory,
  TxType,
} from '../db/types';
import { lastNDaysStart, startOfMonth, endOfMonth, toISODateString } from '../utils/dates';

function filterWhereClause(filters: TransactionFilters): {
  sql: string;
  params: (string | number)[];
} {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filters.type !== 'all') {
    clauses.push('t.type = ?');
    params.push(filters.type);
  }

  if (filters.categoryId) {
    clauses.push('t.category_id = ?');
    params.push(filters.categoryId);
  }

  const q = filters.search.trim();
  if (q.length > 0) {
    clauses.push('(t.note LIKE ? OR c.name LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like);
  }

  const now = new Date();
  if (filters.datePreset === 'week') {
    const start = lastNDaysStart(7);
    clauses.push('t.occurred_at >= ?');
    params.push(toISODateString(start));
  } else if (filters.datePreset === 'month') {
    const s = startOfMonth(now);
    const e = endOfMonth(now);
    clauses.push('t.occurred_at >= ? AND t.occurred_at <= ?');
    params.push(toISODateString(s), toISODateString(e));
  } else if (
    filters.datePreset === 'custom' &&
    filters.customStart &&
    filters.customEnd
  ) {
    clauses.push('t.occurred_at >= ? AND t.occurred_at <= ?');
    params.push(filters.customStart, filters.customEnd);
  }

  const sql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return { sql, params };
}

export async function listTransactions(
  filters: TransactionFilters
): Promise<TransactionWithCategory[]> {
  const db = await getDatabase();
  const { sql: whereSql, params: whereParams } = filterWhereClause(filters);
  const rows = await db.getAllAsync<TransactionWithCategory>(
    `SELECT t.id, t.amount_cents, t.type, t.category_id, t.occurred_at, t.note, t.created_at, t.updated_at,
            c.name as category_name, c.color as category_color
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     ${whereSql}
     ORDER BY t.occurred_at DESC, t.created_at DESC`,
    whereParams
  );
  return rows;
}

export async function getTransactionById(
  id: string
): Promise<TransactionWithCategory | null> {
  const db = await getDatabase();
  return (
    (await db.getFirstAsync<TransactionWithCategory>(
      `SELECT t.id, t.amount_cents, t.type, t.category_id, t.occurred_at, t.note, t.created_at, t.updated_at,
              c.name as category_name, c.color as category_color
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.id = ?`,
      [id]
    )) ?? null
  );
}

export interface UpsertTransactionInput {
  id?: string;
  amount_cents: number;
  type: TxType;
  category_id: string;
  occurred_at: string;
  note: string | null;
}

export async function upsertTransaction(
  input: UpsertTransactionInput
): Promise<string> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = input.id ?? Crypto.randomUUID();

  if (input.id) {
    await db.runAsync(
      `UPDATE transactions SET amount_cents = ?, type = ?, category_id = ?, occurred_at = ?, note = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.amount_cents,
        input.type,
        input.category_id,
        input.occurred_at,
        input.note,
        now,
        input.id,
      ]
    );
  } else {
    await db.runAsync(
      `INSERT INTO transactions (id, amount_cents, type, category_id, occurred_at, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.amount_cents,
        input.type,
        input.category_id,
        input.occurred_at,
        input.note,
        now,
        now,
      ]
    );
  }
  return id;
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM transactions WHERE id = ?`, [id]);
}

/** Sum income and expense between ISO date strings (inclusive), by type. */
export async function sumByTypeInRange(
  startISO: string,
  endISO: string
): Promise<{ income: number; expense: number }> {
  const db = await getDatabase();
  const income = await db.getFirstAsync<{ s: number | null }>(
    `SELECT COALESCE(SUM(amount_cents), 0) as s FROM transactions WHERE type = 'income' AND occurred_at >= ? AND occurred_at <= ?`,
    [startISO, endISO]
  );
  const expense = await db.getFirstAsync<{ s: number | null }>(
    `SELECT COALESCE(SUM(amount_cents), 0) as s FROM transactions WHERE type = 'expense' AND occurred_at >= ? AND occurred_at <= ?`,
    [startISO, endISO]
  );
  return {
    income: income?.s ?? 0,
    expense: expense?.s ?? 0,
  };
}

export async function getBalanceAllTime(): Promise<number> {
  const db = await getDatabase();
  const inc = await db.getFirstAsync<{ s: number | null }>(
    `SELECT COALESCE(SUM(amount_cents), 0) as s FROM transactions WHERE type = 'income'`
  );
  const exp = await db.getFirstAsync<{ s: number | null }>(
    `SELECT COALESCE(SUM(amount_cents), 0) as s FROM transactions WHERE type = 'expense'`
  );
  return (inc?.s ?? 0) - (exp?.s ?? 0);
}

export async function countTransactions(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM transactions`
  );
  return row?.c ?? 0;
}

/** Daily expense totals for last `days` days (including today). */
export async function getDailyExpenseSeries(
  days: number
): Promise<{ label: string; value: number; iso: string }[]> {
  const db = await getDatabase();
  const start = lastNDaysStart(days);
  const rows = await db.getAllAsync<{ d: string; s: number | null }>(
    `SELECT occurred_at as d, SUM(amount_cents) as s FROM transactions
     WHERE type = 'expense' AND occurred_at >= ?
     GROUP BY occurred_at ORDER BY occurred_at ASC`,
    [toISODateString(start)]
  );
  const map = new Map(rows.map((r) => [r.d, r.s ?? 0]));
  const out: { label: string; value: number; iso: string }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const iso = toISODateString(d);
    out.push({
      iso,
      value: map.get(iso) ?? 0,
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
    });
  }
  return out;
}
