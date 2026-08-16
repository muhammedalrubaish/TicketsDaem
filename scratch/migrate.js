const { Client } = require('@notionhq/client');
const { createClient } = require('@supabase/supabase-js');

// تحميل البيانات من .env.local يدوياً أو عبر Node.js --env-file
const notion = new Client({ auth: process.env.NOTION_SECRET });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function migrate() {
  const databaseId = process.env.NOTION_DATABASE_ID;
  console.log('--- بدء عملية الهجرة من Notion إلى Supabase ---');

  let hasMore = true;
  let cursor = undefined;
  let totalMigrated = 0;

  while (hasMore) {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100
    });

    const tickets = response.results.map(page => {
      const props = page.properties;
      const getText = (propName) => {
        const prop = props[propName];
        if (!prop) return null;
        if (prop.type === 'title') return prop.title[0]?.plain_text || null;
        if (prop.type === 'rich_text') return prop.rich_text[0]?.plain_text || null;
        if (prop.type === 'select') return prop.select?.name || null;
        if (prop.type === 'status') return prop.status?.name || null;
        if (prop.type === 'date') return prop.date?.start || null;
        return null;
      };

      return {
        notion_id: page.id,
        ticket_number: getText('Name'),
        category_type: getText('نوع التصنيف'),
        status: getText('الحالة'),
        solution: getText('الحل المقترح'),
        reception_date: getText('تاريخ استقبال البلاغ'),
        receiver: getText('المستقبل'),
        created_at: page.created_time
      };
    });

    if (tickets.length > 0) {
      const { error } = await supabase.from('tickets').upsert(tickets, { onConflict: 'notion_id' });
      if (error) {
        console.error('خطأ أثناء الرفع إلى Supabase:', error);
      } else {
        totalMigrated += tickets.length;
        console.log(`تم نقل ${totalMigrated} بلاغ بنجاح...`);
      }
    }

    hasMore = response.has_more;
    cursor = response.next_cursor;
  }

  console.log('--- اكتملت عملية الهجرة بنجاح! ---');
}

migrate().catch(console.error);
