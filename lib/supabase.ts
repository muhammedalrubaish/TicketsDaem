import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

// 1. الاتصال بقاعدة بيانات PostgreSQL المحلية على السيرفر
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

// 2. كائن Supabase كخيار احتياطي فقط (إن وُجد)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
