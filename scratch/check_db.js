const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://ryqohbjotnyeryepboxq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5JyAXUXIBuduHFTTNyr1Mw_wwazbthB';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data, error } = await supabase.from('tickets').select('*').limit(5);
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
check();
