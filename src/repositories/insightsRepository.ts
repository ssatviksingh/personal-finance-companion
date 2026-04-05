import { getDatabase, SAVINGS_CATEGORY_ID } from '../db/database';
import {
  endOfMonth,
  startOfMonth,
  toISODateString,
  addMonths,
  yearMonthFromDate,
} from '../utils/dates';

export interface CategorySpend {
  category_id: string;
  category_name: string;
  color: string | null;
  total_cents: number;
}

export async function getTopExpenseCategoriesThisMonth(
  limit: number
): Promise<CategorySpend[]> {
  const db = await getDatabase();
  const now = new Date();
  const s = startOfMonth(now);
  const e = endOfMonth(now);
  return db.getAllAsync<CategorySpend>(
    `SELECT c.id as category_id, c.name as category_name, c.color, SUM(t.amount_cents) as total_cents
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.type = 'expense' AND t.occurred_at >= ? AND t.occurred_at <= ?
     GROUP BY c.id
     ORDER BY total_cents DESC
     LIMIT ?`,
    [toISODateString(s), toISODateString(e), limit]
  );
}

export async function getHighestExpenseCategoryThisMonth(): Promise<CategorySpend | null> {
  const rows = await getTopExpenseCategoriesThisMonth(1);
  return rows[0] ?? null;
}

export async function getWeekOverWeekExpenseDelta(): Promise<{
  thisWeek: number;
  lastWeek: number;
  percentChange: number | null;
}> {
  const db = await getDatabase();
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = (day + 6) % 7;
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - diffToMonday);
  thisWeekStart.setHours(0, 0, 0, 0);
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
  thisWeekEnd.setHours(23, 59, 59, 999);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekEnd);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

  const sumWeek = async (a: Date, b: Date) => {
    const row = await db.getFirstAsync<{ s: number | null }>(
      `SELECT COALESCE(SUM(amount_cents), 0) as s FROM transactions
       WHERE type = 'expense' AND occurred_at >= ? AND occurred_at <= ?`,
      [toISODateString(a), toISODateString(b)]
    );
    return row?.s ?? 0;
  };

  const thisWeek = await sumWeek(thisWeekStart, thisWeekEnd);
  const lastWeek = await sumWeek(lastWeekStart, lastWeekEnd);
  let percentChange: number | null = null;
  if (lastWeek > 0) {
    percentChange = ((thisWeek - lastWeek) / lastWeek) * 100;
  } else if (thisWeek > 0) {
    percentChange = 100;
  }
  return { thisWeek, lastWeek, percentChange };
}

export async function getMonthlyExpenseTrend(months: number): Promise<
  { yearMonth: string; total_cents: number; label: string }[]
> {
  const db = await getDatabase();
  const out: { yearMonth: string; total_cents: number; label: string }[] = [];
  const anchor = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = addMonths(anchor, -i);
    const ym = yearMonthFromDate(d);
    const s = startOfMonth(d);
    const e = endOfMonth(d);
    const row = await db.getFirstAsync<{ s: number | null }>(
      `SELECT COALESCE(SUM(amount_cents), 0) as s FROM transactions
       WHERE type = 'expense' AND occurred_at >= ? AND occurred_at <= ?`,
      [toISODateString(s), toISODateString(e)]
    );
    const total = row?.s ?? 0;
    out.push({
      yearMonth: ym,
      total_cents: total,
      label: d.toLocaleDateString(undefined, { month: 'short' }),
    });
  }
  return out;
}

export async function getMostFrequentExpenseCategoryThisMonth(): Promise<{
  category_name: string;
  count: number;
} | null> {
  const db = await getDatabase();
  const now = new Date();
  const s = startOfMonth(now);
  const e = endOfMonth(now);
  return (
    (await db.getFirstAsync<{ category_name: string; count: number }>(
      `SELECT c.name as category_name, COUNT(*) as count
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'expense' AND t.occurred_at >= ? AND t.occurred_at <= ?
       GROUP BY c.id
       ORDER BY count DESC
       LIMIT 1`,
      [toISODateString(s), toISODateString(e)]
    )) ?? null
  );
}

export async function getAverageExpenseTransactionThisMonth(): Promise<number | null> {
  const db = await getDatabase();
  const now = new Date();
  const s = startOfMonth(now);
  const e = endOfMonth(now);
  const row = await db.getFirstAsync<{ avg: number | null; c: number }>(
    `SELECT AVG(amount_cents) as avg, COUNT(*) as c FROM transactions
     WHERE type = 'expense' AND occurred_at >= ? AND occurred_at <= ?`,
    [toISODateString(s), toISODateString(e)]
  );
  if (!row || row.c === 0) return null;
  return row.avg ?? null;
}

/** Sum of Savings-category income in a calendar month (goal progress). */
export async function getSavingsIncomeForYearMonth(
  yearMonth: string
): Promise<number> {
  const db = await getDatabase();
  const [y, m] = yearMonth.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  const row = await db.getFirstAsync<{ s: number | null }>(
    `SELECT COALESCE(SUM(amount_cents), 0) as s FROM transactions
     WHERE type = 'income' AND category_id = ? AND occurred_at >= ? AND occurred_at <= ?`,
    [SAVINGS_CATEGORY_ID, toISODateString(start), toISODateString(end)]
  );
  return row?.s ?? 0;
}
