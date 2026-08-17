import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { DISTRIBUTION_START_DATE } from '../../../../lib/employees';
import { verifyToken, corsHeaders, pickNextReceiver } from '../../../../lib/transfer';
import { getEmployeesOnLeave } from '../../../../lib/leaves';

export const dynamic = 'force-dynamic';

// حساب الموظف الذي عليه الدور (أقل عدد بلاغات مستلمة منذ بداية التوزيع)
export async function GET(req: Request) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const url = new URL(req.url);
    const token = req.headers.get('x-transfer-token') || url.searchParams.get('token');
    if (!verifyToken(token)) {
      return NextResponse.json({ success: false, error: 'جلسة غير صالحة' }, { status: 401, headers });
    }

    const PAGE_SIZE = 1000;
    let all: any[] = [];
    let from = 0;

    // جلب البلاغات على دفعات لتفادي حد الصفوف في Supabase
    while (all.length < 10000) {
      const { data, error } = await supabase
        .from('tickets')
        .select('receiver, reception_date, category_type, ticket_number')
        .gte('reception_date', DISTRIBUTION_START_DATE)
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      all = all.concat(data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    // استثناء الموظفين في إجازة سارية من الدور
    const onLeave = await getEmployeesOnLeave();
    const { employee, counts } = pickNextReceiver(all, onLeave);

    return NextResponse.json(
      {
        success: true,
        next: { name: employee.name, username: employee.username },
        counts,
        onLeave,
        total: all.length,
      },
      { headers }
    );
  } catch (error: any) {
    console.error('[Transfer Next] Error:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر حساب الموظف التالي' },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}
