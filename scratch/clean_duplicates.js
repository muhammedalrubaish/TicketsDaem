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

async function deepCleanup() {
  const { data, error } = await supabase.from('tickets').select('id, ticket_number');
  if (error) { console.error(error); return; }

  const seen = new Map();
  const toDelete = [];
  
  data.forEach(t => {
    const cleanNum = (t.ticket_number || '').trim().toUpperCase();
    if (cleanNum.startsWith('IM')) {
      if (seen.has(cleanNum)) {
        toDelete.push(t.id);
      } else {
        seen.set(cleanNum, t.id);
      }
    }
  });

  console.log('Deep search found duplicates:', toDelete.length);
  
  if (toDelete.length > 0) {
    for (let i = 0; i < toDelete.length; i += 100) {
      const batch = toDelete.slice(i, i + 100);
      const { error: delError } = await supabase.from('tickets').delete().in('id', batch);
      if (delError) console.error('Delete error:', delError);
    }
    console.log('Deep cleanup successful!');
  }
}

deepCleanup();
