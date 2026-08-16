const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const s = createClient('https://ryqohbjotnyeryepboxq.supabase.co', 'sb_publishable_5JyAXUXIBuduHFTTNyr1Mw_wwazbthB');

async function sync() {
  console.log("--- بدء المزامنة الذكية ---");
  
  // 1. جلب الأرقام الموجودة حالياً لتجنب التكرار
  const { data: existing, error: fetchErr } = await s.from('tickets').select('ticket_number');
  if (fetchErr) {
    console.error("Error fetching existing:", fetchErr);
    return;
  }
  const existingNumbers = new Set(existing.map(t => (t.ticket_number || '').trim()));
  console.log(`تم العثور على ${existingNumbers.size} بلاغ في Supabase.`);

  // 2. قراءة ملف الـ CSV
  const csvPath = 'c:\\Users\\am122\\OneDrive\\وحدة بلدي\\Tickets\\نسخة احتياطية\\ExportBlock-2c5fc0aa-491e-496b-ad3c-21f28aaabc0c-Part-1\\داعم (توزيع البلاغات) 1d8de09eaabf80b185d9d373e1c4bc11_all.csv';
  const content = fs.readFileSync(csvPath, 'utf8');
  const rows = content.split('\n').slice(1); // تجاهل الهيدر

  const toInsert = [];
  const processedInThisBatch = new Set();

  for (const row of rows) {
    if (!row.trim()) continue;
    
    // معالجة الفواصل داخل علامات التنصيص (مثل التاريخ)
    const cleaned = row.replace(/"[^"]*"/g, (m) => m.replace(/,/g, '---COMMA---'));
    const cols = cleaned.split(',').map(c => c.replace(/---COMMA---/g, ',').replace(/"/g, '').trim());

    const ticketNumber = (cols[0] || '').replace(/^﻿/, ''); 
    const solution = cols[2] || 'لم يتم الحل';
    const receiver = cols[3] || 'غير محدد';
    const receptionDate = cols[4] || null;
    const categoryType = cols[6] || 'أخرى';

    // القواعد:
    if (ticketNumber.startsWith('IM') && !existingNumbers.has(ticketNumber) && !processedInThisBatch.has(ticketNumber)) {
      // التأكد من أن التاريخ بتنسيق صحيح (Y/M/D) أو تحويله
      let formattedDate = receptionDate;
      if (receptionDate && receptionDate.includes('/')) {
        formattedDate = receptionDate.replace(/\//g, '-'); // تحويل 2025/04/17 إلى 2025-04-17
      }

      toInsert.push({
        ticket_number: ticketNumber,
        receiver: receiver,
        reception_date: formattedDate,
        solution: solution,
        category_type: categoryType,
        status: 'قديم (مستورد)'
      });
      processedInThisBatch.add(ticketNumber);
    }
  }

  console.log(`تم العثور على ${toInsert.push()} بلاغ جديد في الـ CSV غير موجود في Supabase.`);

  // 3. الرفع على دفعات
  if (toInsert.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize);
      const { error: insErr } = await s.from('tickets').insert(batch);
      if (insErr) {
        console.error(`Error inserting batch ${i}:`, insErr);
      } else {
        console.log(`تم رفع الدفعة ${i / batchSize + 1} بنجاح.`);
      }
    }
  }

  console.log("--- انتهت المزامنة بنجاح ---");
}

sync();
