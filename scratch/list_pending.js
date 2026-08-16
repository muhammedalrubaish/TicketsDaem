const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://ryqohbjotnyeryepboxq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5JyAXUXIBuduHFTTNyr1Mw_wwazbthB';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function list() {
  const { data, error } = await supabase
    .from('tickets')
    .select('ticket_number, receiver, reception_date')
    .gte('reception_date', '2026-04-04')
    .eq('solution', 'أخرى معلقة')
    .order('reception_date', { ascending: false });
    
  if (error) console.error(error);
  else {
    console.log('List of Other Pending (أخرى معلقة) Tickets:');
    data.forEach((t, i) => {
      console.log(`${i+1}. ${t.ticket_number} | ${t.receiver} | ${t.reception_date}`);
    });
  }
}
list();
