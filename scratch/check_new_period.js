const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://ryqohbjotnyeryepboxq.supabase.co', 'sb_publishable_5JyAXUXIBuduHFTTNyr1Mw_wwazbthB');

async function check() {
  const names = [
    'عزام الحربي',
    'البراء النصيان',
    'صالح الغصن',
    'طارق الهدياني',
    'ثامر المنصور',
    'عبدالرحمن العمري',
    'محمد الربيش'
  ];

  console.log("--- فحص الأعداد منذ 4 إبريل 2026 ---");
  for (const name of names) {
    const { count } = await s.from('tickets')
      .select('*', { count: 'exact', head: true })
      .ilike('receiver', `%${name.split(' ')[0]}%`)
      .gte('reception_date', '2026-04-04');
    
    console.log(`${name}: ${count || 0} بلاغ`);
  }
}
check();
