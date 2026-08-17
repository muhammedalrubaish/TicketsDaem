import { NextResponse } from 'next/server';
import { login, corsHeaders } from '../../../../lib/transfer';

export const dynamic = 'force-dynamic';

// دخول مبسّط لتطبيق تحويل البلاغات بالجوال — يُرجع رمزاً موقّعاً طويل الأمد
export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  try {
    const { username, password } = await req.json();
    const result = login(username || '', password || '');

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'بيانات الدخول غير صحيحة' },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { success: true, token: result.token, name: result.name, isAdmin: result.isAdmin },
      { headers: corsHeaders(origin) }
    );
  } catch (error: any) {
    console.error('[Transfer Auth] Error:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر إتمام تسجيل الدخول' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}
