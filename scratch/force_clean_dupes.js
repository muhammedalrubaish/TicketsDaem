const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://ryqohbjotnyeryepboxq.supabase.co', 'sb_publishable_5JyAXUXIBuduHFTTNyr1Mw_wwazbthB');

async function forceClean() {
  console.log("جاري البحث عن تكرارات أرقام البلاغات (IM)...");
  // نركز فقط على البلاغات التي تبدأ بـ IM
  const { data: tickets, error } = await s.from('tickets').select('id, ticket_number, reception_date').ilike('ticket_number', 'IM%');
  
  if (error) {
    console.error("خطأ:", error);
    return;
  }

  const latestMap = new Map();
  const toDelete = [];

  // فرز البلاغات حسب التاريخ (الأحدث أولاً)
  const sorted = tickets.sort((a, b) => (b.reception_date || '').localeCompare(a.reception_date || ''));

  sorted.forEach(t => {
    const num = t.ticket_number.trim();
    if (latestMap.has(num)) {
      // إذا وجدنا الرقم مسبقاً (وهو الأحدث بسبب الفرز)، إذن هذا الحالي مكرر ويجب حذفه
      toDelete.push(t.id);
    } else {
      latestMap.set(num, t.id);
    }
  });

  if (toDelete.length > 0) {
    console.log(`تم العثور على ${toDelete.length} تكرار لأرقام IM. جاري الحذف...`);
    for (let i = 0; i < toDelete.length; i += 50) {
      const batch = toDelete.slice(i, i + 50);
      await s.from('tickets').delete().in('id', batch);
    }
    console.log("✅ تم حذف كافة التكرارات بنجاح.");
  } else {
    console.log("لم يتم العثور على تكرارات إضافية لأرقام IM.");
  }
}

forceClean();
