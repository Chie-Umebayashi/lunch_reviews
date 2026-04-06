import { Pool } from "pg";

function connectionString(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL が設定されていません");
  }
  try {
    const u = new URL(raw);
    u.search = "";
    return u.toString();
  } catch {
    return raw.split("?")[0];
  }
}

const globalForPg = globalThis as unknown as { pgPool: Pool | undefined };

export function getPool(): Pool {
  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool({
      connectionString: connectionString(),
      max: 10,
    });
  }
  return globalForPg.pgPool;
}
