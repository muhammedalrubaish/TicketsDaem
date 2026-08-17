import { NextResponse } from 'next/server';
import { balanceLeaveTickets, canManageLeaves } from '../../../../lib/leaves';
import { corsHeaders, verifyToken } from '../../../../lib/transfer';

export const dynamic = 'force-dynamic';

// تشغيل المعادلة يدوياً لسد أي فرق متراكم
export async function POST(req: Request) {
  const headers = corsHeaders(req.headers.get('origin'));
  try {
    const body = await req.json().catch(() => ({}));

    const tokenUser = verifyToken(req.headers.get('x-transfer-token') || body.token);
    const actor = body.actor || tokenUser?.name || '';
    const allowed = (tokenUser && tokenUser.isAdmin) || (await canManageLeaves(actor));

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'لا تملك صلاحية إدارة الإجازات' },
        { status: 403, headers }
      );
    }

    const balance = await balanceLeaveTickets();
    const added = balance.balanced.reduce((sum, b) => sum + b.added, 0);

    return NextResponse.json(
      {
        success: true,
        balance,
        message: balance.skipped
          ? balance.skipped
          : added > 0
            ? `تمت إضافة ${added} بلاغ إجازة للمعادلة (المستوى ${balance.target})`
            : 'الجميع متوازٍ — لا حاجة لإضافة بلاغات',
      },
      { headers }
    );
  } catch (error: any) {
    console.error('[Leaves API] BALANCE error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'تعذرت المعادلة' },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}
