import type { Pool } from "pg";

const ANONYMOUS_DISPLAY_NAME = "__anonymous_like__";

export async function getOrCreateAnonymousUserId(pool: Pool): Promise<number> {
  const found = await pool.query<{ id: string }>(
    "SELECT id FROM users WHERE display_name = $1 LIMIT 1",
    [ANONYMOUS_DISPLAY_NAME]
  );
  if (found.rows[0]) return Number(found.rows[0].id);
  const ins = await pool.query<{ id: string }>(
    "INSERT INTO users (display_name) VALUES ($1) RETURNING id",
    [ANONYMOUS_DISPLAY_NAME]
  );
  return Number(ins.rows[0].id);
}
