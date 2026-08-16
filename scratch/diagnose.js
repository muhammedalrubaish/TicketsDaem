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

async function diagnose() {
  // 1. البلاغات التي فيها كلمة إجازة
  const { data: vacations } = await supabase
    .from('tickets')
    .select('ticket_number, reception_date, receiver, category_type')
    .or('ticket_number.ilike.%إجازة%,ticket_number.ilike.%اجازة%,ticket_number.ilike.%اجازه%,ticket_number.ilike.%أجازة%');

  console.log('=== Actual vacation records:', vacations?.length);
  if (vacations) {
    vacations.slice(0, 5).forEach(v => console.log(`  ${v.ticket_number} | ${v.reception_date} | ${v.receiver}`));
  }

  // 2. البلاغات التي تاريخها 2026-04-05 (تاريخ الترحيل المشبوه)
  const { data: april5 } = await supabase
    .from('tickets')
    .select('ticket_number, reception_date, receiver, category_type, created_at')
    .eq('reception_date', '2026-04-05');

  console.log('\n=== Tickets with date 2026-04-05 (migration date):', april5?.length);
  if (april5) {
    april5.slice(0, 10).forEach(v => console.log(`  ${v.ticket_number} | type: ${v.category_type} | receiver: ${v.receiver} | created: ${v.created_at}`));
  }

  // 3. التحقق من الـ 108 سجل اللي عدلنا تاريخها
  const { data: allData } = await supabase
    .from('tickets')
    .select('reception_date, created_at, ticket_number')
    .limit(5000);

  // سجلات تاريخ استقبالها = تاريخ إنشائها (يعني تم تعديلها من null)
  const suspectRecords = allData?.filter(r => {
    if (!r.created_at) return false;
    const createdDate = r.created_at.split('T')[0];
    return r.reception_date === createdDate && createdDate >= '2026-04-04';
  });
  console.log('\n=== Suspect records (reception_date = created_at date):', suspectRecords?.length);
  if (suspectRecords) {
    suspectRecords.slice(0, 5).forEach(v => console.log(`  ${v.ticket_number} | date: ${v.reception_date} | created: ${v.created_at}`));
  }
}

diagnose();
