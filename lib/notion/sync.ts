/**
 * ==============================================================
 *  منطق المزامنة مع نوشن (Notion Sync)
 * ==============================================================
 * لا يحتوي هذا الملف على أي معرّف قاعدة بيانات ثابت، بل يعمل على
 * كل القواعد المعرَّفة في سجل القواعد (lib/notion/config.ts).
 * إضافة قاعدة جديدة مستقبلاً = متغير بيئة فقط على السيرفر الخارجي.
 */

import { supabase } from '../supabase';
import { getClientForDatabase } from './client';
import {
  getCreatableDatabases,
  getNotionDatabases,
  getSyncableDatabases,
  type NotionDatabaseConfig,
} from './config';

/** تحويل الحالات الخاصة في نوشن إلى حالة "بانتظار المستفيد" في الموقع */
export function mapNotionStatus(status: string): string {
  const targetStatuses = [
    'بانتظار الموظف',
    'بانتظار المكتب الهندسي',
    'بانتظار الأمانة',
    'بانتظار البلدية',
  ];
  if (targetStatuses.includes(status)) {
    return 'بانتظار المستفيد';
  }
  return status;
}

/** البحث عن صفحات البلاغ داخل قاعدة بيانات محددة برقم البلاغ */
async function findPagesByTicketNumber(db: NotionDatabaseConfig, ticketNumber: string) {
  const notion = getClientForDatabase(db);
  const response = await notion.databases.query({
    database_id: db.databaseId,
    filter: {
      property: db.properties.title,
      title: { starts_with: ticketNumber },
    },
  });
  return response.results as any[];
}

/**
 * تحديث الحالة/الحل المقترح/تاريخ الاستحقاق في كل قواعد نوشن المعرَّفة
 */
export async function updateNotionTicket(ticketNumber: string, solution?: string, dueDate?: string) {
  if (!ticketNumber || ticketNumber === 'غير محدد') return;
  console.log(`[Notion Sync] Updating ticket ${ticketNumber} with solution: ${solution}, dueDate: ${dueDate}`);

  for (const db of getNotionDatabases()) {
    try {
      const notion = getClientForDatabase(db);
      const pages = await findPagesByTicketNumber(db, ticketNumber);

      for (const page of pages) {
        const updateProps: any = {};

        if (solution !== undefined && db.properties.solution) {
          updateProps[db.properties.solution] = {
            select: solution ? { name: solution } : null,
          };
        }
        if (dueDate !== undefined && db.properties.dueDate) {
          updateProps[db.properties.dueDate] = {
            date: dueDate ? { start: dueDate } : null,
          };
        }

        if (Object.keys(updateProps).length > 0) {
          await notion.pages.update({ page_id: page.id, properties: updateProps });
          console.log(`[Notion Sync] Updated ${db.label} (${db.databaseId}) for page ${page.id}`);
        }
      }
    } catch (err: any) {
      console.error(`[Notion Sync Error] Failed to update ${db.label} (${db.key}):`, err.message);
    }
  }
}

/**
 * إنشاء صفحة بلاغ جديدة في قواعد نوشن المخصصة للإنشاء (canCreate)
 * تُرجع معرّف الصفحة المنشأة في أول قاعدة (توافقاً مع السلوك السابق).
 */
export async function createNotionTicket(
  ticketNumber: string,
  category: string,
  receiver: string,
  date: string,
  reportText: string,
  phoneNumber: string,
  municipality?: string,
  journalUpdates?: string,
  companyName?: string,
  nationalId?: string
) {
  const databases = getCreatableDatabases();
  if (databases.length === 0) return;

  let firstPageId: string | undefined;

  for (const dbConfig of databases) {
    const pageId = await createTicketInDatabase(dbConfig, {
      ticketNumber,
      category,
      receiver,
      date,
      reportText,
      phoneNumber,
      municipality,
      journalUpdates,
      companyName,
      nationalId,
    });
    if (pageId && !firstPageId) firstPageId = pageId;
  }

  return firstPageId;
}

interface CreateTicketInput {
  ticketNumber: string;
  category: string;
  receiver: string;
  date: string;
  reportText: string;
  phoneNumber: string;
  municipality?: string;
  journalUpdates?: string;
  companyName?: string;
  nationalId?: string;
}

/** إنشاء صفحة بلاغ داخل قاعدة بيانات واحدة */
async function createTicketInDatabase(dbConfig: NotionDatabaseConfig, input: CreateTicketInput) {
  const notion = getClientForDatabase(dbConfig);
  const props = dbConfig.properties;
  console.log(`[Notion Sync] Creating ticket page in ${dbConfig.label}: ${input.ticketNumber}`);

  try {
    const db: any = await notion.databases.retrieve({ database_id: dbConfig.databaseId });

    // حماية إضافية: قبول رقم جوال سعودي صحيح فقط ورفض أي نص آخر
    const phoneDigits = (input.phoneNumber || '').replace(/\D/g, '');
    const phoneMatch = phoneDigits.match(/0?5\d{8}/);
    let formattedPhone = phoneMatch ? phoneMatch[0] : '';
    if (formattedPhone.length === 9 && formattedPhone.startsWith('5')) {
      formattedPhone = '0' + formattedPhone;
    }

    // اختيار خيار موجود مسبقاً في قائمة select فقط - لا يتم إنشاء خيارات جديدة أبداً
    const matchSelectOption = (propName: string, value: string): string | null => {
      if (!value) return null;
      const options: any[] = db.properties?.[propName]?.select?.options || [];
      const exact = options.find(o => o.name === value);
      if (exact) return exact.name;
      const partial = options.find(o => o.name.includes(value) || value.includes(o.name));
      return partial ? partial.name : null;
    };

    // نوع التصنيف: مطابقة مع الخيارات الموجودة فقط، وإلا "أخرى" إن وجدت
    const categoryProp = props.category || 'نوع التصنيف';
    const categoryOption =
      matchSelectOption(categoryProp, input.category) || matchSelectOption(categoryProp, 'أخرى');

    const properties: any = {
      // العنوان = رقم التذكرة فقط
      [props.title]: {
        title: [{ text: { content: input.ticketNumber } }],
      },
      [categoryProp]: {
        select: categoryOption ? { name: categoryOption } : null,
      },
    };

    // الحالة دائماً "بلاغ جديد" عند الإنشاء
    if (props.solution) {
      properties[props.solution] = { select: { name: 'بلاغ جديد' } };
    }

    if (props.dueDate) {
      properties[props.dueDate] = { date: input.date ? { start: input.date } : null };
    }

    // سبب البلاغ في نوشن = حقل الوصف في داعم
    if (props.reason) {
      properties[props.reason] = {
        rich_text: [{ text: { content: (input.reportText || '').slice(0, 1900) } }],
      };
    }

    // تعبئة قيمة بحسب نوع الخاصية الفعلي في قاعدة نوشن
    const setByPropType = (propName: string, value: string) => {
      const propType = db.properties?.[propName]?.type;
      if (!propType || !value) return;
      if (propType === 'phone_number') {
        properties[propName] = { phone_number: value };
      } else if (propType === 'rich_text') {
        properties[propName] = { rich_text: [{ text: { content: value.slice(0, 1900) } }] };
      } else if (propType === 'select') {
        const opt = matchSelectOption(propName, value);
        if (opt) properties[propName] = { select: { name: opt } };
      }
    };

    // رقم الجوال: إن كان رقم الهوية يبدأ بـ 2 (وليس تصنيف حفريات) يوضع الرقم في خانة "المكتب الهندسي"، وإلا في "رقم الجوال"
    let isEngineeringOffice = false;
    if (input.nationalId) {
      const startsWith2 = input.nationalId.trim().startsWith('2');
      const isExcavation =
        categoryOption && (categoryOption.includes('حفريات') || categoryOption.includes('الحفريات'));
      isEngineeringOffice = !!(startsWith2 && !isExcavation);
    } else {
      // Fallback to name-based classification if nationalId is missing
      isEngineeringOffice = !!(
        input.companyName &&
        (input.companyName.includes('مكتب') || input.companyName.includes('هندس'))
      );
    }

    if (isEngineeringOffice && props.engineeringOffice && db.properties?.[props.engineeringOffice]) {
      setByPropType(props.engineeringOffice, formattedPhone);
    } else if (formattedPhone && props.phone) {
      properties[props.phone] = { phone_number: formattedPhone };
    }

    // البلدية: نفس قيمة داعم (من الخيارات الموجودة فقط إن كانت قائمة select)
    if (input.municipality && props.municipality && db.properties?.[props.municipality]) {
      setByPropType(props.municipality, input.municipality);
    }

    if (props.receiver && db.properties[props.receiver]) {
      properties[props.receiver] = {
        select: input.receiver ? { name: input.receiver } : null,
      };
    }

    const response = await notion.pages.create({
      parent: { database_id: dbConfig.databaseId },
      properties,
    });
    console.log(`[Notion Sync] Created Notion page: ${response.id} in ${dbConfig.label}`);

    // تحديثات دفتر اليومية في داعم -> تعليقات على صفحة البلاغ في نوشن
    if (dbConfig.postJournalComments && input.journalUpdates && input.journalUpdates.trim()) {
      const entries = input.journalUpdates
        .split(/-{4,}/)
        .map(e => e.trim())
        .filter(e => e.length > 0)
        .slice(-10); // آخر 10 تحديثات كحد أقصى

      for (const entry of entries) {
        try {
          await notion.comments.create({
            parent: { page_id: response.id },
            rich_text: [{ text: { content: entry.slice(0, 1900) } }],
          });
        } catch (commentErr: any) {
          console.error(`[Notion Sync Error] Failed to add journal comment:`, commentErr.message);
        }
      }
    }

    return response.id;
  } catch (err: any) {
    console.error(`[Notion Sync Error] Failed to create Notion page in ${dbConfig.label}:`, err.message);
  }
}

/**
 * جلب آخر التعديلات من كل قواعد نوشن وتحديثها في Supabase
 */
export async function syncRecentNotionChanges() {
  console.log('[Notion Sync] Starting sync of recent Notion changes...');

  // سنقوم بجلب التحديثات التي تمت في الساعتين الأخيرتين
  const sinceTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  for (const dbConfig of getSyncableDatabases()) {
    try {
      const notion = getClientForDatabase(dbConfig);
      const props = dbConfig.properties;

      const response = await notion.databases.query({
        database_id: dbConfig.databaseId,
        filter: {
          timestamp: 'last_edited_time',
          last_edited_time: { on_or_after: sinceTime },
        },
      });

      console.log(
        `[Notion Sync] Found ${response.results.length} recently edited pages in ${dbConfig.label}`
      );

      for (const page of response.results as any[]) {
        const fullTitle = page.properties?.[props.title]?.title?.[0]?.plain_text || '';
        const match = fullTitle.match(/(IM\d+)/);
        if (!match) continue;
        const ticketNumber = match[1];

        const rawSolution = props.solution ? page.properties?.[props.solution]?.select?.name : undefined;
        if (!rawSolution && !dbConfig.useFallbackValues) continue;

        const solution = mapNotionStatus(rawSolution || 'لم يتم الحل');

        const updateData: any = {
          solution,
          status: solution === 'تم الحل' ? 'إغلاق' : 'قيد المعالجة',
        };

        // الحقول الإضافية تُزامن فقط للقواعد التي تحمل بيانات التوزيع الكاملة
        if (dbConfig.useFallbackValues) {
          if (props.receiver) {
            updateData.receiver = page.properties?.[props.receiver]?.select?.name || 'غير محدد';
          }
          if (props.category) {
            updateData.category_type = page.properties?.[props.category]?.select?.name || 'أخرى';
          }
          if (props.receptionDate) {
            const receptionDate = page.properties?.[props.receptionDate]?.date?.start || null;
            if (receptionDate) updateData.reception_date = receptionDate;
          }
        }

        const { error } = await supabase
          .from('tickets')
          .update(updateData)
          .eq('ticket_number', ticketNumber);

        if (error) {
          console.error(
            `[Notion Sync Error] Failed to update Supabase ticket ${ticketNumber} from ${dbConfig.label}:`,
            error.message
          );
        } else {
          console.log(
            `[Notion Sync] Synced ticket ${ticketNumber} (${solution}) from ${dbConfig.label} to Supabase`
          );
        }
      }
    } catch (err: any) {
      console.error(`[Notion Sync Error] Error syncing ${dbConfig.label} (${dbConfig.key}):`, err.message);
    }
  }
}
