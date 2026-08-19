import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:BaladyAdmin2026Secure!@db:5432/balady_db';

let localPool: Pool | null = null;

export function getLocalDb(): Pool {
  if (!localPool) {
    localPool = new Pool({
      connectionString: databaseUrl,
      ssl: false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return localPool;
}
