import { NextResponse } from 'next/server';
import { getLeavesStatus, startLeave, canManageLeaves } from '../../../lib/leaves';
import { corsHeaders, verifyToken } from '../../../lib/transfer';

export const dynamic = 'force-dynamic';

// ─── حالة الإجازات وأعداد البلاغات ─────────────────────────────────────────
export async function GET(req: Request) {
  const headers = corsHeaders(req.headers.get('origin'));
  try {
    const status = await getLeavesStatus();
    return NextResponse.json({ success: true, ...status }, { headers });
  } catch (error: any) {
    console.error('[Leaves API] GET error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'تعذر جلب حالة الإجازات' },
      { status: 500, headers }
    );
  }
}

// ─── تسجيل إجازة جديدة ─────────────────────────────────────────────────────
export async function POST(req: Request) {
  const headers = corsHeaders(req.headers.get('origin'));
  try {
    const body = await req.json();

    // الصلاحية: أي موظف يملك صلاحية إدارة الموظفين، أو حامل رمز تطبيق التحويل
    const tokenUser = verifyToken(req.headers.get('x-transfer-token') || body.token);
    const actor = body.actor || tokenUser?.name || '';
    const allowed = (tokenUser && tokenUser.isAdmin) || (await canManageLeaves(actor));

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'لا تملك صلاحية إدارة الإجازات' },
        { status: 403, headers }
      );
    }

    if (!body.employeeName) {
      return NextResponse.json(
        { success: false, error: 'حدّد اسم الموظف' },
        { status: 400, headers }
      );
    }

    const result = await startLeave({
      employeeName: body.employeeName,
      startDate: body.startDate,
      endDate: body.endDate || null,
      createdBy: actor,
      note: body.note,
    });

    const added = result.balance.balanced.reduce((sum, b) => sum + b.added, 0);

    return NextResponse.json(
      {
        success: true,
        leave: result.leave,
        balance: result.balance,
        message:
          added > 0
            ? `تم تسجيل الإجازة وإضافة ${added} بلاغ إجازة للمعادلة (المستوى ${result.balance.target})`
            : 'تم تسجيل الإجازة — العدد متساوٍ بالفعل مع الزملاء',
      },
      { headers }
    );
  } catch (error: any) {
    console.error('[Leaves API] POST error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'تعذر تسجيل الإجازة' },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}
