/**
 * ==============================================================
 *  عميل نوشن (Notion Client) - طبقة اتصال مستقلة
 * ==============================================================
 * فُصل الاتصال عن منطق المزامنة حتى يمكن:
 *  - استخدام توكن مختلف لكل قاعدة بيانات (secret داخل تعريف القاعدة).
 *  - توجيه الطلبات إلى وسيط/سيرفر خارجي عبر NOTION_API_BASE_URL.
 */

import { Client } from '@notionhq/client';
import type { NotionDatabaseConfig } from './config';

/** مخزن مؤقت للعملاء حسب (التوكن + العنوان) لتفادي إنشاء عميل جديد كل مرة */
const clients = new Map<string, Client>();

function createClient(auth: string, baseUrl?: string): Client {
  const cacheKey = `${auth}::${baseUrl || 'default'}`;
  const cached = clients.get(cacheKey);
  if (cached) return cached;

  const client = new Client(baseUrl ? { auth, baseUrl } : { auth });
  clients.set(cacheKey, client);
  return client;
}

/** العميل الافتراضي (التوكن العام NOTION_SECRET) */
export function getNotionClient(): Client {
  return createClient(
    (process.env.NOTION_SECRET || '').trim(),
    (process.env.NOTION_API_BASE_URL || '').trim() || undefined
  );
}

/** عميل خاص بقاعدة بيانات معينة (يستخدم توكنها إن وُجد) */
export function getClientForDatabase(db: NotionDatabaseConfig): Client {
  const auth = (db.secret || process.env.NOTION_SECRET || '').trim();
  return createClient(auth, (process.env.NOTION_API_BASE_URL || '').trim() || undefined);
}
