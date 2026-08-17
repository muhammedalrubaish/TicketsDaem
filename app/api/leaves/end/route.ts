import { NextResponse } from 'next/server';
import { endLeave, canManageLeaves } from '../../../../lib/leaves';
import { corsHeaders, verifyToken } from '../../../../lib/transfer';

export const dynamic = 'force-dynamic';

// إنهاء إجازة يدوياً (رجوع الموظف من الإجازة)
export async function POST(req: Request) {
  const headers = corsHeaders(req.headers.get('origin'));
  try {
    const body = await req.json();

    const tokenUser = verifyToken(req.headers.get('x-transfer-token') || body.token);
    const actor = body.actor || tokenUser?.name || '';
    const allowed = (tokenUser && tokenUser.isAdmin) || (await canManageLeaves(actor));

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'لا تملك صلاحية إدارة الإجازات' },
        { status: 403, headers }
      );
    }

    const result = await endLeave({
      employeeName: body.employeeName,
      leaveId: body.leaveId,
      endedBy: actor,
    });

    if (result.ended === 0) {
      return NextResponse.json(
        { success: false, error: 'لا توجد إجازة سارية لهذا الموظف' },
        { status: 404, headers }
      );
    }

    const added = result.balance.balanced.reduce((sum, b) => sum + b.added, 0);

    return NextResponse.json(
      {
        success: true,
        ended: result.ended,
        balance: result.balance,
        message:
          added > 0
            ? `تم إنهاء الإجازة بعد معادلة أخيرة بـ ${added} بلاغ (المستوى ${result.balance.target})`
            : 'تم إنهاء الإجازة — الموظف متساوٍ مع زملائه',
      },
      { headers }
    );
  } catch (error: any) {
    console.error('[Leaves API] END error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'تعذر إنهاء الإجازة' },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}
