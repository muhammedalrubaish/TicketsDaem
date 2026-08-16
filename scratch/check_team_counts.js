const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://ryqohbjotnyeryepboxq.supabase.co', 'sb_publishable_5JyAXUXIBuduHFTTNyr1Mw_wwazbthB');

async function check() {
  const names = [
    'البراء النصيان',
    'محمد الربيش',
    'عبدالرحمن العمري',
    'عزام الحربي',
    'صالح الغصن',
    'طارق الهدياني',
    'ثامر المنصور'
  ];

  console.log("--- فحص عدد البلاغات (بعد 4 إبريل) ---");
  for (const name of names) {
    const { count, error } = await s.from('tickets')
      .select('receiver', { count: 'exact', head: true })
      .ilike('receiver', `%${name.split(' ')[0]}%`) // نبحث بالاسم الأول لضمان المطابقة
      .gte('reception_date', '2026-04-04');
    
    console.log(`${name}: ${count || 0} بلاغ`);
  }
}
check();
