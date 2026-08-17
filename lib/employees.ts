/**
 * مصدر واحد موحّد لبيانات الموظفين والتصنيفات
 * ---------------------------------------------
 * كانت هذه القوائم مكررة في: app/TicketForm.tsx و app/api/widget-employee/route.ts
 * وإضافة المتصفح (Daem Plus). تم تجميعها هنا لاستخدامها في تطبيق تحويل البلاغات
 * بالجوال دون المساس بالملفات القديمة.
 */

export interface Employee {
  /** المعرّف المختصر المستخدم داخلياً */
  key: string;
  /** الاسم العربي كما يُخزَّن في عمود receiver بقاعدة البيانات */
  name: string;
  /** اسم المستخدم في منصة داعم (يُكتب في حقل «المعين له») */
  username: string;
  /** رقم الجوال بصيغة دولية لإرسال الواتساب */
  phone: string;
  /** كلمة مرور الدخول المبسّط (نفس المعتمدة في الويجيت) */
  pass: string;
  /** مشمول في التوزيع التلقائي بالدور */
  inRotation: boolean;
  /** أسماء بديلة للمطابقة المرنة */
  aliases: string[];
}

export const EMPLOYEES: Employee[] = [
  {
    key: 'alnesayan',
    name: 'البراء النصيان',
    username: 'a.alnesayan',
    phone: '966537313164',
    pass: '1111',
    inRotation: true,
    aliases: ['البراء النصيان', 'البراء علي ابراهيم النصيان', 'alnesayan', 'al-nesayan', 'albaraa', 'a.alnesayan'],
  },
  {
    key: 'alowaid',
    name: 'عبدالله العويد',
    username: 'aalowaid',
    phone: '966582060644',
    pass: '2222',
    // مستثنى من التوزيع التلقائي بالدور (نفس سلوك إضافة Daem Plus) مع بقائه متاحاً للاختيار اليدوي
    inRotation: false,
    aliases: ['عبدالله العويد', 'عبدالله عبدالعزيز محمد العويد', 'alowaid', 'al-owaid', 'aalowaid'],
  },
  {
    key: 'alamri',
    name: 'عبدالرحمن العمري',
    username: 'af.alamri',
    phone: '966553077432',
    pass: '3333',
    inRotation: true,
    aliases: ['عبدالرحمن العمري', 'عبدالرحمن فهيد العمري', 'alamri', 'al-amri', 'af.alamri'],
  },
  {
    key: 'alharbi',
    name: 'عزام الحربي',
    username: 'azz.alharbi',
    phone: '966500000000',
    pass: '4444',
    inRotation: true,
    aliases: ['عزام الحربي', 'عزام أحمد محمد الفريدي الحربي', 'alharbi', 'al-harbi', 'azz.alharbi'],
  },
  {
    key: 'alrubaish',
    name: 'محمد الربيش',
    username: 'mialrubaish',
    phone: '966595866711',
    pass: 'Balady.20',
    inRotation: true,
    aliases: ['محمد الربيش', 'محمد إبراهيم محمد الربيش', 'alrubaish', 'al-rubaish', 'mialrubaish'],
  },
  {
    key: 'alghosen',
    name: 'صالح الغصن',
    username: 's.alghosen',
    phone: '966557828464',
    pass: '6666',
    inRotation: true,
    aliases: ['صالح الغصن', 'صالح عبدالعزيز صالح الغصن', 'alghosen', 'al-ghosen', 's.alghosen'],
  },
  {
    key: 'alhedyani',
    name: 'طارق الهدياني',
    username: 't.alhedyani',
    phone: '966500221260',
    pass: '7777',
    inRotation: true,
    aliases: ['طارق الهدياني', 'طارق عبدالعزيز عبدالله الهدياني', 'alhedyani', 'al-hedyani', 't.alhedyani'],
  },
  {
    key: 'almansour',
    name: 'ثامر المنصور',
    username: 't.almansour',
    phone: '966570770940',
    pass: '8888',
    inRotation: true,
    aliases: ['ثامر المنصور', 'ثامر عبدالله محمد المنصور', 'almansour', 'al-mansour', 't.almansour'],
  },
];

/** كلمة مرور المشرف (نفس المعتمدة في الويجيت) */
export const ADMIN_PASS = 'Balady.2026';

/** تاريخ بداية احتساب التوزيع */
export const DISTRIBUTION_START_DATE = '2026-04-04';

export const CATEGORIES: string[] = [
  'الرخص التجارية', 'الرخص الإنشائية', 'بلدي أعمال', 'مسار منصة الحفريات',
  'التقرير المساحي', 'الإدارة الذكية للنظافة', 'خدمة المواعيد الالكترونية',
  'الشهادات الصحية', 'خدمة مرافق إيواء', 'مستشارك بلدي', 'نظام الصلاحيات',
  'تطبيق بلدي', 'شكوى المستفيد منصة بلدي', 'منصة الرقابة الموحدة (ممثل)',
  'لوحة التحكم', 'خدمة الدمج والتجزئة', 'خدمة تحديث الصكوك',
  'خدمة اعتماد المخططات الخاصة', 'تصنيف مقدمي خدمات المدن', 'الهوية العقارية',
  'شكوى المستفيد بلدي 940', 'خدمة الفرص الاستثمارية', 'خدمة السكن الجماعي',
  'خدمة السكن الجماعي للأفراد', 'صفحة بلدي', 'GIS Web Portal', 'رمز الاستجابة',
  'إكرام الموتى', 'التشوه البصري', 'امتثال', 'رقابة الصحي والأسواق',
  'الخرائط الجغرافية', 'صوت العميل', 'نظام المتاجر المتنقلة',
  'شؤون البلدية والقروية والإسكان', 'Investment Opportunities',
  'امتثال المباني', 'منصة رسم تقديم منتجات التبغ', 'فاتورة سداد آلياً', 'أخرى',
];

/** إيجاد موظف عبر الاسم العربي أو اسم المستخدم أو أي اسم بديل */
export function findEmployee(value?: string | null): Employee | null {
  if (!value) return null;
  const clean = value.trim().toLowerCase();
  if (!clean) return null;

  const exact = EMPLOYEES.find(
    (e) =>
      e.name.toLowerCase() === clean ||
      e.username.toLowerCase() === clean ||
      e.key === clean ||
      e.aliases.some((a) => a.toLowerCase() === clean)
  );
  if (exact) return exact;

  // مطابقة جزئية (مثال: «الربيش» أو «محمد الربيش ⬅️»)
  return (
    EMPLOYEES.find((e) =>
      e.aliases.some((a) => {
        const al = a.toLowerCase();
        return al.includes(clean) || clean.includes(al);
      })
    ) || null
  );
}

/** توحيد التصنيف القادم من منصة داعم إلى أحد التصنيفات المعتمدة */
export function normalizeCategory(rawCategory?: string | null): string {
  if (!rawCategory) return 'أخرى';
  const raw = rawCategory.trim();
  if (!raw) return 'أخرى';

  const known = CATEGORIES.filter((c) => c !== 'أخرى');

  const matched = known.find((cat) => raw.includes(cat) || cat.includes(raw));
  if (matched) return matched;

  const lower = raw.toLowerCase();
  if (lower.includes('digging') || lower.includes('حفريات')) return 'مسار منصة الحفريات';
  if (lower.includes('commercial') || lower.includes('تجارية') || lower.includes('رخصة تجارية')) return 'الرخص التجارية';
  // «Building Permit - خدمة الرخص الإنشائية» و«إصدار رخصة بناء» كلاهما يعني الرخص الإنشائية
  if (
    lower.includes('building') ||
    lower.includes('إنشائية') ||
    lower.includes('انشائية') ||
    lower.includes('رخصة بناء') ||
    lower.includes('رخص بناء')
  ) return 'الرخص الإنشائية';
  if (lower.includes('survey') || lower.includes('مساحي')) return 'التقرير المساحي';
  if (lower.includes('business') || lower.includes('أعمال')) return 'بلدي أعمال';
  if (lower.includes('complaint') || lower.includes('شكوى')) {
    return lower.includes('940') ? 'شكوى المستفيد بلدي 940' : 'شكوى المستفيد منصة بلدي';
  }
  if (lower.includes('hygiene') || lower.includes('صحي') || lower.includes('أسواق')) return 'رقابة الصحي والأسواق';
  if (lower.includes('clean') || lower.includes('نظافة')) return 'الإدارة الذكية للنظافة';
  if (lower.includes('health')) return 'الشهادات الصحية';
  if (lower.includes('appointment') || lower.includes('مواعيد')) return 'خدمة المواعيد الالكترونية';
  if (lower.includes('investment') || lower.includes('استثمار')) return 'خدمة الفرص الاستثمارية';
  if (lower.includes('housing') || lower.includes('سكن جماعي')) return 'خدمة السكن الجماعي';

  return 'أخرى';
}
