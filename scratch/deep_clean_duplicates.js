const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ryqohbjotnyeryepboxq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5JyAXUXIBuduHFTTNyr1Mw_wwazbthB';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanAllDuplicates() {
  console.log('Fetching all tickets for deep cleanup...');
  
  let allTickets = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('tickets')
      .select('id, ticket_number, notion_id, receiver, status, solution')
      .range(from, from + batchSize - 1);
      
    if (error) {
      console.error('Error fetching:', error);
      break;
    }
    if (!data || data.length === 0) break;
    
    allTickets = allTickets.concat(data);
    if (data.length < batchSize) break;
    from += batchSize;
  }

  console.log(`Total records found: ${allTickets.length}`);

  const seen = new Map();
  const idsToDelete = [];

  allTickets.forEach(ticket => {
    const num = ticket.ticket_number ? ticket.ticket_number.trim() : null;
    if (num && num !== 'غير محدد') {
      if (seen.has(num)) {
        const existing = seen.get(num);
        // نفضل الاحتفاظ بالذي له "حل" أو "مستقبل" محدد
        const currentScore = (ticket.solution && ticket.solution !== 'غير محدد' ? 2 : 0) + (ticket.receiver && ticket.receiver !== 'غير محدد' ? 1 : 0);
        const existingScore = (existing.solution && existing.solution !== 'غير محدد' ? 2 : 0) + (existing.receiver && existing.receiver !== 'غير محدد' ? 1 : 0);
        
        if (currentScore > existingScore) {
          idsToDelete.push(existing.id);
          seen.set(num, ticket);
        } else {
          idsToDelete.push(ticket.id);
        }
      } else {
        seen.set(num, ticket);
      }
    }
  });

  console.log(`Unique tickets identified: ${seen.size}`);
  console.log(`Duplicates to delete: ${idsToDelete.length}`);

  if (idsToDelete.length > 0) {
    for (let i = 0; i < idsToDelete.length; i += 50) {
      const batch = idsToDelete.slice(i, i + 50);
      const { error: delError } = await supabase
        .from('tickets')
        .delete()
        .in('id', batch);
        
      if (delError) {
        console.error('Delete error:', delError);
      } else {
        console.log(`Deleted batch ${Math.floor(i/50) + 1}`);
      }
    }
  }

  console.log('Cleanup finished!');
}

cleanAllDuplicates();
