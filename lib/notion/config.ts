/**
 * ==============================================================
 *  سجل قواعد بيانات نوشن (Notion Databases Registry)
 * ==============================================================
 * الهدف: فصل تعريف قواعد بيانات نوشن عن منطق المزامنة، بحيث يمكن
 * مستقبلاً استيراد قاعدة بيانات نوشن جديدة وإضافتها على السيرفر
 * الخارجي عبر متغيرات البيئة فقط دون أي تعديل على الكود.
 *
 * طريقة الإضافة على السيرفر الخارجي:
 *   1. القواعد الأساسية: NOTION_DATABASE_ID و NOTION_STATUS_DATABASE_ID
 *   2. أي قاعدة إضافية: عبر المتغير NOTION_EXTRA_DATABASES (JSON)
 *      مثال:
 *      NOTION_EXTRA_DATABASES='[{"key":"archive","label":"أرشيف البلاغات",
 *        "databaseId":"xxxxxxxx","role":"status","syncToSupabase":true}]'
 */

/** دور قاعدة البيانات داخل النظام */
export type NotionDatabaseRole = 'distribution' | 'status' | 'custom';

/** أسماء خصائص (أعمدة) قاعدة البيانات في نوشن */
export interface NotionDatabaseProperties {
  /** خاصية العنوان (رقم البلاغ) */
  title: string;
  /** خاصية الحل/الحالة التي تُحدَّث من الموقع */
  solution?: string;
  /** خاصية تاريخ الاستحقاق */
  dueDate?: string;
  /** خاصية المستقبل (الموظف) */
  receiver?: string;
  /** خاصية نوع التصنيف */
  category?: string;
  /** خاصية تاريخ استقبال البلاغ */
  receptionDate?: string;
  /** خاصية سبب البلاغ (الوصف) */
  reason?: string;
  /** خاصية رقم الجوال */
  phone?: string;
  /** خاصية المكتب الهندسي */
  engineeringOffice?: string;
  /** خاصية البلدية */
  municipality?: string;
}

/** تعريف قاعدة بيانات نوشن واحدة */
export interface NotionDatabaseConfig {
  /** معرف داخلي مختصر */
  key: string;
  /** اسم للعرض في السجلات والتقارير */
  label: string;
  /** معرف قاعدة البيانات في نوشن */
  databaseId: string;
  /** دور القاعدة */
  role: NotionDatabaseRole;
  /** تفعيل/تعطيل القاعدة دون حذف إعداداتها */
  enabled: boolean;
  /** توكن نوشن خاص بهذه القاعدة (اختياري) - وإلا يُستخدم NOTION_SECRET العام */
  secret?: string;
  /** أسماء الخصائص داخل القاعدة */
  properties: NotionDatabaseProperties;
  /** هل تُنشأ فيها صفحات البلاغات الجديدة؟ */
  canCreate: boolean;
  /** هل تُقرأ تعديلاتها وتُزامن إلى Supabase؟ */
  syncToSupabase: boolean;
  /** استخدام قيم افتراضية عند غياب الخاصية أثناء المزامنة */
  useFallbackValues: boolean;
  /** إضافة تحديثات دفتر اليومية كتعليقات على الصفحة عند الإنشاء */
  postJournalComments: boolean;
}

/** الخصائص الافتراضية المعتمدة في قواعد بلاغات وحدة بلدي */
const DEFAULT_PROPERTIES: NotionDatabaseProperties = {
  title: 'Name',
  solution: 'الحالة',
  dueDate: 'Due Date',
  receiver: 'المستقبل',
  category: 'نوع التصنيف',
  receptionDate: 'تاريخ استقبال البلاغ',
  reason: 'سبب البلاغ',
  phone: 'رقم الجوال',
  engineeringOffice: 'المكتب الهندسي',
  municipality: 'البلدية',
};

/** القيم الافتراضية لأي قاعدة بيانات جديدة تُضاف لاحقاً */
const DEFAULT_CONFIG: Omit<NotionDatabaseConfig, 'key' | 'label' | 'databaseId'> = {
  role: 'custom',
  enabled: true,
  properties: DEFAULT_PROPERTIES,
  canCreate: false,
  syncToSupabase: true,
  useFallbackValues: false,
  postJournalComments: false,
};

/** قراءة قيمة نصية من البيئة مع تنظيف الفراغات */
function env(name: string): string {
  return (process.env[name] || '').trim();
}

/** قراءة قيمة منطقية من البيئة */
function envBool(name: string, fallback: boolean): boolean {
  const value = env(name).toLowerCase();
  if (!value) return fallback;
  return value === '1' || value === 'true' || value === 'yes';
}

/**
 * قاعدة (1): توزيع البلاغات - يُحدَّث فيها حقل "الحل المقترح" فقط
 */
function buildDistributionDatabase(): NotionDatabaseConfig | null {
  const databaseId = env('NOTION_DATABASE_ID');
  if (!databaseId) return null;
  return {
    ...DEFAULT_CONFIG,
    key: 'distribution',
    label: 'داعم - توزيع البلاغات',
    databaseId,
    role: 'distribution',
    enabled: envBool('NOTION_DATABASE_ENABLED', true),
    properties: {
      ...DEFAULT_PROPERTIES,
      solution: 'الحل المقترح',
      // لا يتم تحديث تاريخ الاستحقاق في قاعدة التوزيع
      dueDate: undefined,
    },
    canCreate: false,
    syncToSupabase: true,
    useFallbackValues: true,
  };
}

/**
 * قاعدة (2): حالات البلاغات - تُنشأ فيها البلاغات ويُحدَّث فيها "الحالة" و"Due Date"
 */
function buildStatusDatabase(): NotionDatabaseConfig | null {
  const databaseId = env('NOTION_STATUS_DATABASE_ID');
  if (!databaseId) return null;
  return {
    ...DEFAULT_CONFIG,
    key: 'status',
    label: 'داعم - حالات البلاغات',
    databaseId,
    role: 'status',
    enabled: envBool('NOTION_STATUS_DATABASE_ENABLED', true),
    properties: { ...DEFAULT_PROPERTIES },
    canCreate: true,
    syncToSupabase: true,
    useFallbackValues: false,
    postJournalComments: true,
  };
}

/**
 * قواعد إضافية تُعرَّف بالكامل من متغير البيئة NOTION_EXTRA_DATABASES (JSON Array)
 * تُدمج مع القيم الافتراضية، فيكفي تمرير key و databaseId.
 */
function buildExtraDatabases(): NotionDatabaseConfig[] {
  const raw = env('NOTION_EXTRA_DATABASES');
  if (!raw) return [];

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (err: any) {
    console.error('[Notion Config] تعذّر قراءة NOTION_EXTRA_DATABASES (صيغة JSON غير صحيحة):', err.message);
    return [];
  }

  const list = Array.isArray(parsed) ? parsed : [parsed];
  const databases: NotionDatabaseConfig[] = [];

  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const databaseId = String(item.databaseId || item.database_id || '').trim();
    const key = String(item.key || '').trim();
    if (!databaseId || !key) {
      console.error('[Notion Config] تم تجاهل قاعدة بيانات إضافية بدون key أو databaseId');
      continue;
    }
    databases.push({
      ...DEFAULT_CONFIG,
      ...item,
      key,
      label: String(item.label || key),
      databaseId,
      properties: { ...DEFAULT_PROPERTIES, ...(item.properties || {}) },
    });
  }

  return databases;
}

/**
 * إرجاع كافة قواعد بيانات نوشن المعرَّفة (المفعّلة فقط).
 * تُقرأ من البيئة في كل استدعاء حتى تلتقط أي تغيير على السيرفر الخارجي.
 */
export function getNotionDatabases(): NotionDatabaseConfig[] {
  const databases = [
    buildDistributionDatabase(),
    buildStatusDatabase(),
    ...buildExtraDatabases(),
  ].filter((db): db is NotionDatabaseConfig => !!db && db.enabled && !!db.databaseId);

  // منع تكرار نفس المفتاح (الأحدث يستبدل الأقدم)
  const unique = new Map<string, NotionDatabaseConfig>();
  for (const db of databases) unique.set(db.key, db);
  return Array.from(unique.values());
}

/** القواعد التي تُنشأ فيها البلاغات الجديدة */
export function getCreatableDatabases(): NotionDatabaseConfig[] {
  return getNotionDatabases().filter(db => db.canCreate);
}

/** القواعد التي تُزامن تعديلاتها إلى Supabase */
export function getSyncableDatabases(): NotionDatabaseConfig[] {
  return getNotionDatabases().filter(db => db.syncToSupabase);
}

/** جلب قاعدة محددة بمفتاحها */
export function getNotionDatabase(key: string): NotionDatabaseConfig | undefined {
  return getNotionDatabases().find(db => db.key === key);
}

/** هل إعدادات نوشن مكتملة؟ (توكن + قاعدة واحدة على الأقل) */
export function isNotionConfigured(): boolean {
  return !!env('NOTION_SECRET') && getNotionDatabases().length > 0;
}
