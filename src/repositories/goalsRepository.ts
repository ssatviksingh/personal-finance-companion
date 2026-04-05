import * as Crypto from 'expo-crypto';
import { getDatabase } from '../db/database';
import type { MonthlyGoalRow } from '../db/types';

export async function getGoalForYearMonth(
  yearMonth: string
): Promise<MonthlyGoalRow | null> {
  const db = await getDatabase();
  return (
    (await db.getFirstAsync<MonthlyGoalRow>(
      `SELECT id, year_month, target_amount_cents, created_at, updated_at FROM monthly_goals WHERE year_month = ?`,
      [yearMonth]
    )) ?? null
  );
}

export async function listGoals(limit = 24): Promise<MonthlyGoalRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<MonthlyGoalRow>(
    `SELECT id, year_month, target_amount_cents, created_at, updated_at FROM monthly_goals
     ORDER BY year_month DESC LIMIT ?`,
    [limit]
  );
}

export async function upsertMonthlyGoal(
  yearMonth: string,
  targetAmountCents: number
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const existing = await getGoalForYearMonth(yearMonth);
  if (existing) {
    await db.runAsync(
      `UPDATE monthly_goals SET target_amount_cents = ?, updated_at = ? WHERE year_month = ?`,
      [targetAmountCents, now, yearMonth]
    );
  } else {
    const id = Crypto.randomUUID();
    await db.runAsync(
      `INSERT INTO monthly_goals (id, year_month, target_amount_cents, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, yearMonth, targetAmountCents, now, now]
    );
  }
}
