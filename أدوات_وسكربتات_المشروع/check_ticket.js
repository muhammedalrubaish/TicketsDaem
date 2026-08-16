const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ryqohbjotnyeryepboxq.supabase.co';
const supabaseKey = 'sb_publishable_5JyAXUXIBuduHFTTNyr1Mw_wwazbthB'; // wait, is this anon key? yes

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('ticket_number', 'IM4577289');

  if (error) {
    console.error('Error fetching ticket:', error);
  } else {
    console.log('Ticket Data:', JSON.stringify(data, null, 2));
  }
}

main();
