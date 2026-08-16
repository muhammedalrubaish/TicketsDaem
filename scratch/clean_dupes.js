const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://ryqohbjotnyeryepboxq.supabase.co', 'sb_publishable_5JyAXUXIBuduHFTTNyr1Mw_wwazbthB');

async function clean() {
  console.log("جاري جلب كافة البلاغات لفحص التكرار...");
  const { data: tickets, error } = await s.from('tickets').select('id, ticket_number, reception_date, receiver');
  
  if (error) {
    console.error("خطأ في الجلب:", error);
    return;
  }

  const seen = new Set();
  const toDelete = [];

  tickets.forEach(t => {
    // نعتبر البلاغ مكرر "يجب حذفه" إذا تطابق الرقم والتاريخ والمستقبل تماماً
    const key = `${t.ticket_number}-${t.reception_date}-${t.receiver}`;
    if (seen.has(key)) {
      toDelete.push(t.id);
    } else {
      seen.add(key);
    }
  });

  if (toDelete.length > 0) {
    console.log(`تم العثور على ${toDelete.length} بلاغات مكررة تماماً. جاري الحذف...`);
    // حذف على دفعات لتجنب المشاكل
    for (let i = 0; i < toDelete.length; i += 50) {
      const batch = toDelete.slice(i, i + 50);
      const { error: delErr } = await s.from('tickets').delete().in('id', batch);
      if (delErr) console.error("خطأ أثناء حذف الدفعة:", delErr);
    }
    console.log("✅ تم تنظيف قاعدة البيانات بنجاح.");
  } else {
    console.log("لم يتم العثور على تكرارات متطابقة تماماً لحذفها.");
  }
}

clean();
