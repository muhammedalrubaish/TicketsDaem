const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://ryqohbjotnyeryepboxq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5JyAXUXIBuduHFTTNyr1Mw_wwazbthB';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function count() {
  const { data, error } = await supabase
    .from('tickets')
    .select('id')
    .gte('reception_date', '2026-04-04')
    .eq('solution', 'أخرى معلقة');
    
  if (error) console.error(error);
  else console.log(`Total 'Other Pending' (أخرى معلقة) tickets: ${data.length}`);
}
count();
