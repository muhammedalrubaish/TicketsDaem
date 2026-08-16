import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// Disable default static caching to ensure the Chrome extension gets real-time data
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 1000;
const START_DATE = '2026-04-04';

export async function GET() {
  try {
    // Step 1: الحصول على الإجمالي الحقيقي الكامل بدون جلب البيانات
    const { count: exactCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .gte('reception_date', START_DATE);

    // Step 2: جلب كل البيانات بـ pagination لتجاوز حد الـ 1000 الافتراضي
    let allData: any[] = [];
    let from = 0;

    while (true) {
      const { data: page, error: pageError } = await supabase
        .from('tickets')
        .select('id, notion_id, ticket_number, category_type, solution, receiver, reception_date')
        .gte('reception_date', START_DATE)
        .order('reception_date', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (pageError || !page || page.length === 0) break;
      allData.push(...page);
      // إذا أُرجع أقل من الصفحة الكاملة → وصلنا للنهاية
      if (page.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    // تحويل البيانات للصيغة المطلوبة من الإضافة
    const formattedTickets = allData.map(ticket => ({
      id: ticket.notion_id || ticket.id,
      statusPageId: ticket.notion_id || null,
      number: ticket.ticket_number || 'غير محدد',
      type: ticket.category_type || 'أخرى',
      solution: ticket.solution || 'لم يتم الحل',
      receiver: ticket.receiver || 'غير محدد',
      date: ticket.reception_date || ''
    }));

    // إرجاع الإجمالي الحقيقي منفصلاً عن مصفوفة البيانات
    return NextResponse.json({
      tickets: formattedTickets,
      totalCount: exactCount ?? formattedTickets.length
    });

  } catch (error: any) {
    console.error('Tickets JSON Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets from database' }, { status: 500 });
  }
}
