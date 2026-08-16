const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://ryqohbjotnyeryepboxq.supabase.co', 'sb_publishable_5JyAXUXIBuduHFTTNyr1Mw_wwazbthB');

async function check() {
  const nums = ['IM4438376', 'اجازة', 'IM4506703'];
  for (const n of nums) {
    const { data } = await s.from('tickets').select('*').ilike('ticket_number', `%${n}%`);
    console.log(`\n--- [ ${n} ] ---`);
    if (data) {
      console.log(`Count: ${data.length}`);
      data.forEach(t => console.log(`- Date: ${t.reception_date}, Receiver: ${t.receiver}, Status: ${t.solution}`));
    }
  }
}
check();
