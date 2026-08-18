/**
 * ⚠️ ملف توافق (Compatibility Shim)
 * تم فصل منطق نوشن إلى وحدة مستقلة داخل مجلد `lib/notion`:
 *   - lib/notion/config.ts : سجل قواعد بيانات نوشن (من متغيرات البيئة)
 *   - lib/notion/client.ts : عميل الاتصال بنوشن (يدعم سيرفر خارجي)
 *   - lib/notion/sync.ts   : منطق الإنشاء والتحديث والمزامنة
 *
 * أُبقي هذا الملف لعدم كسر الاستيرادات القديمة. يُفضّل في الكود الجديد:
 *   import { createNotionTicket } from '../lib/notion';
 */
export {
  updateNotionTicket,
  createNotionTicket,
  syncRecentNotionChanges,
  mapNotionStatus,
} from './notion';
