import { NextResponse } from 'next/server';
import { getNotionDatabases, isNotionConfigured } from '../../../lib/notion';

export const dynamic = 'force-dynamic';

/** إخفاء معظم معرّف قاعدة البيانات في المخرجات لأسباب أمنية */
function maskId(id: string): string {
  if (id.length <= 8) return '****';
  return `${id.slice(0, 4)}****${id.slice(-4)}`;
}

/**
 * فحص إعدادات قواعد بيانات نوشن المعرَّفة على هذا السيرفر.
 * مفيد للتأكد بعد إضافة قاعدة جديدة على السيرفر الخارجي.
 */
export async function GET() {
  const databases = getNotionDatabases().map(db => ({
    key: db.key,
    label: db.label,
    role: db.role,
    databaseId: maskId(db.databaseId),
    canCreate: db.canCreate,
    syncToSupabase: db.syncToSupabase,
    usesOwnSecret: !!db.secret,
  }));

  return NextResponse.json({
    configured: isNotionConfigured(),
    hasSecret: !!process.env.NOTION_SECRET,
    apiBaseUrl: process.env.NOTION_API_BASE_URL || 'https://api.notion.com (افتراضي)',
    count: databases.length,
    databases,
  });
}
