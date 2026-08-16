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

async function analyze() {
  // جلب كل البيانات
  const { data, error } = await supabase
    .from('tickets')
    .select('reception_date, ticket_number, category_type, receiver')
    .order('reception_date', { ascending: false })
    .limit(10000);

  if (error) { console.error(error); return; }

  console.log('=== Total records in DB:', data.length);

  // بعد 4 أبريل مع تاريخ صالح
  const afterApril = data.filter(c => c.reception_date && c.reception_date !== 'غير محدد' && c.reception_date >= '2026-04-04');
  console.log('=== After April 4 (with valid date):', afterApril.length);

  // بدون تاريخ أو تاريخ "غير محدد"
  const noDate = data.filter(c => !c.reception_date || c.reception_date === 'غير محدد');
  console.log('=== No date or "غير محدد":', noDate.length);

  // تاريخ قبل 4 أبريل
  const beforeApril = data.filter(c => c.reception_date && c.reception_date !== 'غير محدد' && c.reception_date < '2026-04-04');
  console.log('=== Before April 4:', beforeApril.length);

  // تحديثات النظام
  const sysUpdates = afterApril.filter(c => c.category_type === 'تحديث نظام');
  console.log('=== System updates (after April):', sysUpdates.length);

  // إجازات
  const vacations = afterApril.filter(c => 
    (c.ticket_number || '').includes('إجازة') || 
    (c.ticket_number || '').includes('اجازة') || 
    (c.ticket_number || '').includes('اجازه') ||
    (c.ticket_number || '').includes('أجازه') ||
    (c.ticket_number || '').includes('أجازة')
  );
  console.log('=== Vacations (after April):', vacations.length);

  // عينة من البلاغات التي ليس لها تاريخ
  console.log('\n=== Sample records WITHOUT date:');
  noDate.slice(0, 5).forEach(r => {
    console.log(`  ticket: ${r.ticket_number}, date: "${r.reception_date}", type: ${r.category_type}, receiver: ${r.receiver}`);
  });

  // التأكد: الإجمالي الصحيح (بعد أبريل، بدون شروط أخرى)
  console.log('\n=== EXPECTED TOTAL (afterApril - no filters):', afterApril.length);
  console.log('=== Without system updates:', afterApril.filter(c => c.category_type !== 'تحديث نظام').length);
}

analyze();
