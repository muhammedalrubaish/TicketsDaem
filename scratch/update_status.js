const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://ryqohbjotnyeryepboxq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5JyAXUXIBuduHFTTNyr1Mw_wwazbthB';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const targetTickets = [
  'IM4501945', 'IM4503439', 'IM4486176', 'IM4482983', 'IM4483822',
  'IM4480639', 'IM4479273', 'IM4472625', 'IM4472698', 'IM4465669', 'IM4445881'
];

async function update() {
  console.log(`Updating ${targetTickets.length} tickets to 'لدى الوزارة'...`);
  
  const { data, error } = await supabase
    .from('tickets')
    .update({ solution: 'لدى الوزارة' })
    .in('ticket_number', targetTickets);
    
  if (error) {
    console.error('Error updating tickets:', error);
  } else {
    console.log('Successfully updated the 11 tickets to "لدى الوزارة"!');
  }
}
update();
