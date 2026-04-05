import * as SQLite from 'expo-sqlite';

const DB_NAME = 'finance.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income','expense')),
      color TEXT,
      icon_key TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      amount_cents INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income','expense')),
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      occurred_at TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_occurred ON transactions(occurred_at);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

    CREATE TABLE IF NOT EXISTS monthly_goals (
      id TEXT PRIMARY KEY NOT NULL,
      year_month TEXT NOT NULL UNIQUE,
      target_amount_cents INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await seedCategoriesIfEmpty(db);
  return db;
}

async function seedCategoriesIfEmpty(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM categories'
  );
  if (row && row.c > 0) return;

  const seed: [string, string, string, string, string][] = [
    ['cat_salary', 'Salary', 'income', '#16A34A', 'salary'],
    ['cat_freelance', 'Freelance', 'income', '#15803D', 'work'],
    ['cat_savings', 'Savings', 'income', '#0EA5E9', 'savings'],
    ['cat_food', 'Food & Dining', 'expense', '#F97316', 'food'],
    ['cat_transport', 'Transport', 'expense', '#EAB308', 'car'],
    ['cat_shopping', 'Shopping', 'expense', '#EC4899', 'shopping'],
    ['cat_bills', 'Bills & Utilities', 'expense', '#64748B', 'bills'],
    ['cat_entertainment', 'Entertainment', 'expense', '#8B5CF6', 'fun'],
    ['cat_health', 'Health', 'expense', '#EF4444', 'health'],
    ['cat_other_exp', 'Other', 'expense', '#94A3B8', 'other'],
    ['cat_other_inc', 'Other Income', 'income', '#22C55E', 'other'],
  ];

  for (const [id, name, type, color, icon] of seed) {
    await db.runAsync(
      `INSERT INTO categories (id, name, type, color, icon_key) VALUES (?, ?, ?, ?, ?)`,
      [id, name, type, color, icon]
    );
  }
}

/** Savings income category id — goal progress sums transactions in this category. */
export const SAVINGS_CATEGORY_ID = 'cat_savings';
