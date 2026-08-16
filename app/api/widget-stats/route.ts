import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

const START_DATE = '2026-04-04';

// ذاكرة مؤقتة بحجم 5 دقائق لتقليل استهلاك Egress على Supabase
let cachedStatsResponse: any = null;
let lastStatsFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 دقائق

export async function GET() {
  const now = Date.now();
  if (cachedStatsResponse && (now - lastStatsFetchTime) < CACHE_TTL_MS) {
    return NextResponse.json(cachedStatsResponse);
  }

  try {
    const PAGE_SIZE = 1000;
    let allTickets: any[] = [];
    let from = 0;

    while (allTickets.length < 10000) {
      const { data: page, error: pageError } = await supabase
        .from('tickets')
        .select('id, notion_id, ticket_number, category_type, status, solution, receiver, reception_date')
        .gte('reception_date', START_DATE)
        .order('reception_date', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (pageError) throw pageError;
      if (!page || page.length === 0) break;

      allTickets.push(...page);
      if (page.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    const filteredTickets = allTickets.filter(t => t.ticket_number && !t.ticket_number.trim().startsWith('📢'));
    const totalCount = filteredTickets.length;

    let newCount = 0;
    let waitingCount = 0;
    let ministryCount = 0;
    let unsolvedCount = 0;
    let solvedCount = 0;
    let otherCount = 0;

    filteredTickets.forEach((ticket) => {
      const status = ticket.status || 'غير محدد';
      const solution = ticket.solution || 'لم يتم الحل';

      if (status === 'تم الحل' || solution === 'تم الحل') {
        solvedCount++;
      } else {
        unsolvedCount++;
        if (status === 'بلاغ جديد') newCount++;
        else if (status === 'بانتظار المستفيد') waitingCount++;
        else if (status === 'لدى الوزارة') ministryCount++;
        else if (status !== 'لم يتم الحل' && solution !== 'لم يتم الحل') otherCount++;
      }
    });

    const latestTickets = filteredTickets.slice(0, 5).map(t => ({
      number: t.ticket_number || 'غير محدد',
      type: t.category_type || 'أخرى',
      status: t.status || 'غير محدد',
      receiver: t.receiver || 'غير محدد',
      date: t.reception_date || ''
    }));

    cachedStatsResponse = {
      success: true,
      stats: {
        total: totalCount,
        new: newCount,
        waiting: waitingCount,
        ministry: ministryCount,
        unsolved: unsolvedCount,
        solved: solvedCount,
        other: otherCount
      },
      latest: latestTickets
    };
    lastStatsFetchTime = now;

    return NextResponse.json(cachedStatsResponse);

  } catch (error: any) {
    console.error('Widget Stats API Error:', error);
    if (cachedStatsResponse) {
      return NextResponse.json(cachedStatsResponse);
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch widget statistics' }, { status: 500 });
  }
}

