const https = require('https');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function fetchPage(table, offset, limit, key) {
  return new Promise((resolve) => {
    const url = new URL(`${supabaseUrl}/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`);
    const options = {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            resolve({ error: `HTTP ${res.statusCode}: ${data}` });
          }
        } catch (e) {
          resolve({ error: e.message });
        }
      });
    }).on('error', (err) => resolve({ error: err.message }));
  });
}

async function fetchAllPages(table) {
  let allRecords = [];
  let offset = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    console.log(`  جلب السجلات من ${offset} إلى ${offset + limit}...`);
    let res = await fetchPage(table, offset, limit, supabaseKey);
    if (res && res.error) {
      res = await fetchPage(table, offset, limit, anonKey);
    }
    if (res && res.error) {
      console.error(`  خطأ:`, res.error);
      break;
    }
    if (Array.isArray(res)) {
      allRecords = allRecords.concat(res);
      if (res.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    } else {
      hasMore = false;
    }
  }
  return allRecords;
}

async function exportFull() {
  const tables = ['tickets', 'circulars', 'push_subscriptions'];
  const exportDir = path.join(__dirname, 'supabase_backup_' + new Date().toISOString().slice(0, 10));

  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  console.log('🚀 بدء جلب وتصدير كافة سجلات البيانات كاملة...');

  const summary = {};

  for (const table of tables) {
    console.log(`\n⏳ جلب جدول: ${table}...`);
    const records = await fetchAllPages(table);
    const filePath = path.join(exportDir, `${table}.json`);
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf8');
    console.log(`✅ تم حفظ ${table}: إجمالي ${records.length} سجل.`);
    summary[table] = records.length;
  }

  // Generate complete SQL Schema & Insert statements
  const sqlDumpPath = path.join(exportDir, 'import_to_postgres.sql');
  let sqlContent = `-- ملف استيراد وهيكلة البيانات إلى PostgreSQL لسيرفر العمل\n`;
  sqlContent += `-- تاريخ التصدير: ${new Date().toISOString()}\n\n`;

  // Tickets table schema
  sqlContent += `CREATE TABLE IF NOT EXISTS "tickets" (
  "id" TEXT PRIMARY KEY,
  "number" TEXT,
  "title" TEXT,
  "status" TEXT,
  "priority" TEXT,
  "department" TEXT,
  "assignee" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "data" JSONB
);\n\n`;

  // Circulars table schema
  sqlContent += `CREATE TABLE IF NOT EXISTS "circulars" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT,
  "description" TEXT,
  "file_url" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);\n\n`;

  // Push subscriptions table schema
  sqlContent += `CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" SERIAL PRIMARY KEY,
  "endpoint" TEXT UNIQUE,
  "keys" JSONB,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);\n\n`;

  for (const table of tables) {
    const jsonFile = path.join(exportDir, `${table}.json`);
    if (fs.existsSync(jsonFile)) {
      const records = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
      if (records.length > 0) {
        sqlContent += `-- ==========================================\n`;
        sqlContent += `-- بيانات جدول: ${table} (${records.length} سجل)\n`;
        sqlContent += `-- ==========================================\n`;
        for (const row of records) {
          const keys = Object.keys(row);
          const values = keys.map(k => {
            const val = row[k];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number' || typeof val === 'boolean') return val;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return `'${String(val).replace(/'/g, "''")}'`;
          });
          sqlContent += `INSERT INTO "${table}" ("${keys.join('", "')}") VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
        }
        sqlContent += '\n';
      }
    }
  }

  fs.writeFileSync(sqlDumpPath, sqlContent, 'utf8');
  console.log(`\n📄 تم إنشاء ملف SQL الشامل: ${path.basename(sqlDumpPath)}`);
  console.log('\n📊 ملخص السجلات المُصدرة:');
  console.table(summary);
}

exportFull();
