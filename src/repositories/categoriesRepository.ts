import { getDatabase } from '../db/database';
import type { CategoryRow, TxType } from '../db/types';

export async function getCategoriesByType(type: TxType): Promise<CategoryRow[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryRow>(
    `SELECT id, name, type, color, icon_key FROM categories WHERE type = ? ORDER BY name ASC`,
    [type]
  );
  return rows;
}

export async function getAllCategories(): Promise<CategoryRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<CategoryRow>(
    `SELECT id, name, type, color, icon_key FROM categories ORDER BY type DESC, name ASC`
  );
}
