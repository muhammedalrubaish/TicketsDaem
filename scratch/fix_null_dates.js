const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixNullDates() {
  // جلب السجلات التي ليس لها تاريخ
  const { data, error } = await supabase
    .from('tickets')
    .select('id, notion_id, ticket_number, created_at, reception_date')
    .is('reception_date', null);

  if (error) { console.error('Error fetching:', error); return; }
  
  console.log(`Found ${data.length} records with null reception_date`);
  
  let fixed = 0;
  for (const record of data) {
    // نعطيها تاريخ إنشائها كتاريخ استقبال
    const createdDate = record.created_at ? record.created_at.split('T')[0] : '2026-05-14';
    
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ reception_date: createdDate })
      .eq('id', record.id);

    if (updateError) {
      console.error(`Error updating ${record.id}:`, updateError);
    } else {
      fixed++;
    }
  }
  
  console.log(`Fixed ${fixed} records with null dates`);
  
  // التحقق النهائي
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .gte('reception_date', '2026-04-04');
  
  console.log(`Total tickets after April 4: ${count}`);
}

fixNullDates();
