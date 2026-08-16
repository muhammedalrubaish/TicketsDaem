const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const SUPABASE_URL = 'https://ryqohbjotnyeryepboxq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5JyAXUXIBuduHFTTNyr1Mw_wwazbthB';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CSV_PATH = 'C:\\Users\\am122\\OneDrive\\وحدة بلدي\\بيانات البلاغات\\بلاغات محفوظة حفظتها بـ 15 مايو\\داعم (توزيع البلاغات) 1d8de09eaabf80b185d9d373e1c4bc11_all.csv';

// Function to convert Excel serial date to YYYY-MM-DD
function excelDateToJSDate(serial) {
  if (isNaN(serial)) return serial;
  const date = XLSX.utils.format_cell({ t: 'n', v: serial, z: 'yyyy-mm-dd' });
  return date;
}

async function importDatabase() {
  console.log('--- Database Replacement Process Started ---');
  
  if (!fs.existsSync(CSV_PATH)) {
    console.error('CSV File not found at:', CSV_PATH);
    return;
  }

  // 1. Clear existing data
  console.log('1. Clearing current tickets in Supabase...');
  await supabase.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
  console.log('Database cleared.');

  // 2. Read CSV
  console.log('2. Reading CSV file...');
  const workbook = XLSX.readFile(CSV_PATH, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Found ${rawData.length} records in CSV.`);

  // 3. Map and Insert
  console.log('3. Mapping and Uploading data...');
  const tickets = rawData.map(row => {
    let recDateRaw = row['تاريخ استقبال البلاغ'];
    let recDate = null;
    
    if (recDateRaw) {
      if (typeof recDateRaw === 'number') {
        // Convert Excel serial date
        const dateObj = new Date((recDateRaw - 25569) * 86400 * 1000);
        recDate = dateObj.toISOString().split('T')[0];
      } else {
        recDate = String(recDateRaw).trim().replace(/\//g, '-');
        // Simple validation for YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}/.test(recDate)) {
           // If it's not a standard date, try to parse it
           const d = new Date(recDate);
           if (!isNaN(d.getTime())) {
             recDate = d.toISOString().split('T')[0];
           }
        }
      }
    }

    const tName = String(row['Name'] || '').trim();

    return {
      ticket_number: tName || 'غير محدد',
      reception_date: recDate || null,
      receiver: row['المستقبل'] || 'غير محدد',
      solution: row['الحل المقترح'] || 'لم يتم الحل',
      category_type: row['نوع التصنيف'] || 'أخرى',
      status: (row['الحل المقترح'] === 'تم الحل') ? 'إغلاق' : 'قيد المعالجة'
    };
  });

  // Batch insert
  const batchSize = 100; // Smaller batches to avoid memory/timeout issues
  for (let i = 0; i < tickets.length; i += batchSize) {
    const batch = tickets.slice(i, i + batchSize);
    console.log(`Uploading batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(tickets.length / batchSize)}...`);
    
    const { error: insertError } = await supabase
      .from('tickets')
      .insert(batch);

    if (insertError) {
      console.error(`Error in batch starting at ${i}:`, insertError);
    }
  }

  console.log('--- Database Replacement Completed Successfully! ---');
}

importDatabase();
