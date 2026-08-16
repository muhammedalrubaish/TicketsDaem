import { Client } from "@notionhq/client";
import { supabase } from "./supabase";

const notion = new Client({ auth: process.env.NOTION_SECRET });

const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || "";
const NOTION_STATUS_DATABASE_ID = process.env.NOTION_STATUS_DATABASE_ID || "";

// دالة تحويل الحالات الخاصة في نويشن إلى حالة "بانتظار المستفيد" في الموقع
function mapNotionStatus(status: string): string {
  const targetStatuses = [
    "بانتظار الموظف",
    "بانتظار المكتب الهندسي",
    "بانتظار الأمانة",
    "بانتظار البلدية"
  ];
  if (targetStatuses.includes(status)) {
    return "بانتظار المستفيد";
  }
  return status;
}

/**
 * تحديث الحالة/الحل المقترح/تاريخ الاستحقاق في نويشن للبلاغ المحدد
 */
export async function updateNotionTicket(ticketNumber: string, solution?: string, dueDate?: string) {
  if (!ticketNumber || ticketNumber === "غير محدد") return;
  console.log(`[Notion Sync] Updating ticket ${ticketNumber} with solution: ${solution}, dueDate: ${dueDate}`);

  // 1. تحديث قاعدة بيانات توزيع البلاغات (NOTION_DATABASE_ID) -> حقل 'الحل المقترح'
  if (NOTION_DATABASE_ID) {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        filter: {
          property: "Name",
          title: {
            starts_with: ticketNumber,
          },
        },
      });

      for (const page of response.results) {
        const updateProps: any = {};
        if (solution !== undefined) {
          updateProps["الحل المقترح"] = {
            select: solution ? { name: solution } : null,
          };
        }
        if (Object.keys(updateProps).length > 0) {
          await notion.pages.update({
            page_id: page.id,
            properties: updateProps,
          });
          console.log(`[Notion Sync] Updated database_id ${NOTION_DATABASE_ID} for page ${page.id}`);
        }
      }
    } catch (err: any) {
      console.error(`[Notion Sync Error] Failed to update NOTION_DATABASE_ID:`, err.message);
    }
  }

  // 2. تحديث قاعدة بيانات الحالات (NOTION_STATUS_DATABASE_ID) -> حقل 'الحالة' و 'Due Date'
  if (NOTION_STATUS_DATABASE_ID) {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_STATUS_DATABASE_ID,
        filter: {
          property: "Name",
          title: {
            starts_with: ticketNumber,
          },
        },
      });

      for (const page of response.results) {
        const updateProps: any = {};
        if (solution !== undefined) {
          updateProps["الحالة"] = {
            select: solution ? { name: solution } : null,
          };
        }
        if (dueDate !== undefined) {
          updateProps["Due Date"] = {
            date: dueDate ? { start: dueDate } : null,
          };
        }
        
        if (Object.keys(updateProps).length > 0) {
          await notion.pages.update({
            page_id: page.id,
            properties: updateProps,
          });
          console.log(`[Notion Sync] Updated status_database_id ${NOTION_STATUS_DATABASE_ID} for page ${page.id}`);
        }
      }
    } catch (err: any) {
      console.error(`[Notion Sync Error] Failed to update NOTION_STATUS_DATABASE_ID:`, err.message);
    }
  }
}

/**
 * إنشاء صفحة بلاغ جديدة في قاعدة بيانات الحالات في نويشن
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
  if (!NOTION_STATUS_DATABASE_ID) return;
  console.log(`[Notion Sync] Creating ticket page in Notion: ${ticketNumber}`);
  try {
    const db: any = await notion.databases.retrieve({ database_id: NOTION_STATUS_DATABASE_ID });

    // حماية إضافية: قبول رقم جوال سعودي صحيح فقط ورفض أي نص آخر
    const phoneDigits = (phoneNumber || "").replace(/\D/g, "");
    const phoneMatch = phoneDigits.match(/0?5\d{8}/);
    let formattedPhone = phoneMatch ? phoneMatch[0] : "";
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
    const categoryOption = matchSelectOption("نوع التصنيف", category) || matchSelectOption("نوع التصنيف", "أخرى");

    const properties: any = {
      // العنوان = رقم التذكرة فقط
      "Name": {
        title: [
          {
            text: {
              content: ticketNumber
            }
          }
        ]
      },
      "نوع التصنيف": {
        select: categoryOption ? { name: categoryOption } : null
      },
      // الحالة دائماً "بلاغ جديد" عند الإنشاء
      "الحالة": {
        select: { name: "بلاغ جديد" }
      },
      "Due Date": {
        date: date ? { start: date } : null
      },
      // سبب البلاغ في نوشن = حقل الوصف في داعم
      "سبب البلاغ": {
        rich_text: [
          {
            text: {
              content: (reportText || "").slice(0, 1900)
            }
          }
        ]
      }
    };

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
    if (nationalId) {
      const startsWith2 = nationalId.trim().startsWith('2');
      const isExcavation = categoryOption && (categoryOption.includes('حفريات') || categoryOption.includes('الحفريات'));
      isEngineeringOffice = !!(startsWith2 && !isExcavation);
    } else {
      // Fallback to name-based classification if nationalId is missing
      isEngineeringOffice = !!(companyName && (companyName.includes('مكتب') || companyName.includes('هندس')));
    }

    if (isEngineeringOffice && db.properties?.["المكتب الهندسي"]) {
      setByPropType("المكتب الهندسي", formattedPhone);
    } else if (formattedPhone) {
      properties["رقم الجوال"] = { phone_number: formattedPhone };
    }

    // البلدية: نفس قيمة داعم (من الخيارات الموجودة فقط إن كانت قائمة select)
    if (municipality && db.properties?.["البلدية"]) {
      setByPropType("البلدية", municipality);
    }

    if (db.properties["المستقبل"]) {
      properties["المستقبل"] = {
        select: receiver ? { name: receiver } : null
      };
    }

    const response = await notion.pages.create({
      parent: { database_id: NOTION_STATUS_DATABASE_ID },
      properties: properties
    });
    console.log(`[Notion Sync] Created Notion page: ${response.id}`);

    // تحديثات دفتر اليومية في داعم -> تعليقات على صفحة البلاغ في نوشن
    if (journalUpdates && journalUpdates.trim()) {
      const entries = journalUpdates
        .split(/-{4,}/)
        .map(e => e.trim())
        .filter(e => e.length > 0)
        .slice(-10); // آخر 10 تحديثات كحد أقصى

      for (const entry of entries) {
        try {
          await notion.comments.create({
            parent: { page_id: response.id },
            rich_text: [{ text: { content: entry.slice(0, 1900) } }]
          });
        } catch (commentErr: any) {
          console.error(`[Notion Sync Error] Failed to add journal comment:`, commentErr.message);
        }
      }
    }

    return response.id;
  } catch (err: any) {
    console.error(`[Notion Sync Error] Failed to create Notion page:`, err.message);
  }
}

/**
 * جلب آخر التعديلات من Notion وتحديثها في Supabase
 */
export async function syncRecentNotionChanges() {
  console.log("[Notion Sync] Starting sync of recent Notion changes...");
  
  // سنقوم بجلب التحديثات التي تمت في الساعتين الأخيرتين
  const sinceTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  // 1. مزامنة قاعدة البيانات الأولى (داعم - توزيع البلاغات)
  if (NOTION_DATABASE_ID) {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        filter: {
          timestamp: "last_edited_time",
          last_edited_time: {
            on_or_after: sinceTime,
          },
        },
      });

      console.log(`[Notion Sync] Found ${response.results.length} recently edited pages in NOTION_DATABASE_ID`);

      for (const page of response.results as any[]) {
        const fullTitle = page.properties.Name?.title?.[0]?.plain_text || "";
        const match = fullTitle.match(/(IM\d+)/);
        if (!match) continue;
        const ticketNumber = match[1];

        const rawSolution = page.properties["الحل المقترح"]?.select?.name || "لم يتم الحل";
        const solution = mapNotionStatus(rawSolution);
        const receiver = page.properties["المستقبل"]?.select?.name || "غير محدد";
        const categoryType = page.properties["نوع التصنيف"]?.select?.name || "أخرى";
        const receptionDate = page.properties["تاريخ استقبال البلاغ"]?.date?.start || null;

        // تحديث في Supabase
        const updateData: any = {
          solution,
          receiver,
          category_type: categoryType,
          status: (solution === "تم الحل") ? "إغلاق" : "قيد المعالجة"
        };
        if (receptionDate) {
          updateData.reception_date = receptionDate;
        }

        const { error } = await supabase
          .from("tickets")
          .update(updateData)
          .eq("ticket_number", ticketNumber);

        if (error) {
          console.error(`[Notion Sync Error] Failed to update Supabase ticket ${ticketNumber}:`, error.message);
        } else {
          console.log(`[Notion Sync] Synced ticket ${ticketNumber} from NOTION_DATABASE_ID to Supabase`);
        }
      }
    } catch (err: any) {
      console.error(`[Notion Sync Error] Error syncing NOTION_DATABASE_ID:`, err.message);
    }
  }

  // 2. مزامنة قاعدة البيانات الثانية (داعم - الحالات)
  if (NOTION_STATUS_DATABASE_ID) {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_STATUS_DATABASE_ID,
        filter: {
          timestamp: "last_edited_time",
          last_edited_time: {
            on_or_after: sinceTime,
          },
        },
      });

      console.log(`[Notion Sync] Found ${response.results.length} recently edited pages in NOTION_STATUS_DATABASE_ID`);

      for (const page of response.results as any[]) {
        const fullTitle = page.properties.Name?.title?.[0]?.plain_text || "";
        const match = fullTitle.match(/(IM\d+)/);
        if (!match) continue;
        const ticketNumber = match[1];

        const rawSolution = page.properties["الحالة"]?.select?.name;
        if (!rawSolution) continue;
        const solution = mapNotionStatus(rawSolution);

        const { error } = await supabase
          .from("tickets")
          .update({
            solution,
            status: (solution === "تم الحل") ? "إغلاق" : "قيد المعالجة"
          })
          .eq("ticket_number", ticketNumber);

        if (error) {
          console.error(`[Notion Sync Error] Failed to update Supabase ticket ${ticketNumber} from status DB:`, error.message);
        } else {
          console.log(`[Notion Sync] Synced ticket ${ticketNumber} status (${solution}) from NOTION_STATUS_DATABASE_ID to Supabase`);
        }
      }
    } catch (err: any) {
      console.error(`[Notion Sync Error] Error syncing NOTION_STATUS_DATABASE_ID:`, err.message);
    }
  }
}
