import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

const EMPLOYEES = [
  { name: 'البراء النصيان',     user: 'a.alnesayan',  pass: '1111' },
  { name: 'عبدالله العويد',     user: 'aalowaid',      pass: '2222' },
  { name: 'عبدالرحمن العمري',   user: 'af.alamri',     pass: '3333' },
  { name: 'عزام الحربي',        user: 'azz.alharbi',   pass: '4444' },
  { name: 'محمد الربيش',        user: 'mialrubaish',   pass: 'Balady.20' },
  { name: 'صالح الغصن',         user: 's.alghosen',    pass: '6666' },
  { name: 'طارق الهدياني',      user: 't.alhedyani',   pass: '7777' },
  { name: 'ثامر المنصور',       user: 't.almansour',   pass: '8888' },
];

const ADMIN_PASS = 'Balady.2026';
const START_DATE  = '2026-04-04';

// ذاكرة مؤقتة لتقليل استهلاك السيرفر عند استعلامات الويجيت المتكررة
const employeeCacheMap = new Map<string, { data: any; time: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 دقائق

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, mode } = body as {
      username?: string;
      password?: string;
      mode?: 'admin' | 'employee';
    };

    let employeeName: string;
    let isAdmin = false;

    if (mode === 'admin') {
      if (password !== ADMIN_PASS) {
        return NextResponse.json(
          { success: false, error: 'كلمة مرور المشرف غير صحيحة' },
          { status: 401 }
        );
      }
      isAdmin = true;
      employeeName = 'المشرف';
    } else {
      const cleanUser = (username ?? '').trim().toLowerCase();
      const cleanPass = (password ?? '').trim();
      const emp = EMPLOYEES.find(
        (e) => e.user.toLowerCase() === cleanUser && e.pass === cleanPass
      );
      if (!emp) {
        return NextResponse.json(
          { success: false, error: 'بيانات الدخول غير صحيحة' },
          { status: 401 }
        );
      }
      employeeName = emp.name;
    }

    const cacheKey = `${isAdmin ? 'admin' : employeeName}`;
    const now = Date.now();
    const cachedEntry = employeeCacheMap.get(cacheKey);
    if (cachedEntry && (now - cachedEntry.time) < CACHE_TTL_MS) {
      return NextResponse.json(cachedEntry.data);
    }

    const PAGE_SIZE = 1000;
    let allTickets: any[] = [];
    let from = 0;

    while (allTickets.length < 10000) {
      let query = supabase
        .from('tickets')
        .select('id, ticket_number, category_type, status, solution, receiver, reception_date')
        .gte('reception_date', START_DATE)
        .order('reception_date', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (!isAdmin) {
        query = query.eq('receiver', employeeName);
      }

      const { data: page, error } = await query;
      if (error) throw error;
      if (!page || page.length === 0) break;

      allTickets.push(...page);
      if (page.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    const tickets = allTickets.filter(
      (t) => t.ticket_number && !t.ticket_number.trim().startsWith('📢')
    );

    let newCount = 0, waitingCount = 0, ministryCount = 0,
        unsolvedCount = 0, solvedCount = 0, otherCount = 0;

    for (const t of tickets) {
      const status   = t.status   ?? '';
      const solution = t.solution ?? '';
      if (status === 'تم الحل' || solution === 'تم الحل') {
        solvedCount++;
      } else {
        unsolvedCount++;
        if (status === 'بلاغ جديد') newCount++;
        else if (status === 'بانتظار المستفيد') waitingCount++;
        else if (status === 'لدى الوزارة') ministryCount++;
        else if (status !== 'لم يتم الحل' && solution !== 'لم يتم الحل') otherCount++;
      }
    }

    const latest = tickets.slice(0, 5).map((t) => ({
      number: t.ticket_number   ?? 'غير محدد',
      type:   t.category_type   ?? 'أخرى',
      status: t.status          ?? 'غير محدد',
      date:   t.reception_date  ?? '',
    }));

    const responsePayload = {
      success: true,
      employeeName,
      isAdmin,
      stats: {
        total:    tickets.length,
        new:      newCount,
        waiting:  waitingCount,
        ministry: ministryCount,
        unsolved: unsolvedCount,
        solved:   solvedCount,
        other:    otherCount,
      },
      latest,
      hasNewTickets: newCount > 0,
    };

    employeeCacheMap.set(cacheKey, { data: responsePayload, time: now });

    return NextResponse.json(responsePayload);

  } catch (error: any) {
    console.error('Widget Employee API Error:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

