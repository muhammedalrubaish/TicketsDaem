import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { sendPushNotification } from '../../../lib/push';
import { findEmployee, normalizeCategory } from '../../../lib/employees';
import {
  verifyToken,
  corsHeaders,
  riyadhDate,
  riyadhTime,
  riyadhNow,
  buildTransferMessage,
} from '../../../lib/transfer';
import { balanceQuietly, getEmployeesOnLeave } from '../../../lib/leaves';

export const dynamic = 'force-dynamic';

/** استخراج الرمز من الترويسة أو من جسم الطلب */
function getToken(req: Request, body?: any): string | null {
  return req.headers.get('x-transfer-token') || body?.token || null;
}

/** هل الخطأ ناتج عن عدم وجود عمود transferred_at بعد في قاعدة البيانات؟ */
function isMissingColumnError(error: any): boolean {
  const msg = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return msg.includes('transferred_at') && (msg.includes('column') || msg.includes('schema cache'));
}

// ─── تسجيل تحويل بلاغ ──────────────────────────────────────────────────────
export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const body = await req.json();
    const user = verifyToken(getToken(req, body));

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً' },
        { status: 401, headers }
      );
    }

    // ── التحقق من المدخلات ──────────────────────────────────────────────
    const ticketNumber = String(body.ticketNumber || '').trim().toUpperCase();
    if (!/^IM\d{4,12}$/.test(ticketNumber)) {
      return NextResponse.json(
        { success: false, error: 'رقم البلاغ غير صحيح (المتوقع مثل IM12345678)' },
        { status: 400, headers }
      );
    }

    const emp = findEmployee(body.receiver);
    if (!emp) {
      return NextResponse.json(
        { success: false, error: 'اسم المحوّل له غير معروف' },
        { status: 400, headers }
      );
    }

    const category = normalizeCategory(body.category);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.date || '')) ? String(body.date) : riyadhDate();
    const time = riyadhTime();

    // تنبيه (وليس منعاً) عند التحويل لموظف في إجازة — القرار يبقى للمستخدم
    const onLeave = await getEmployeesOnLeave();
    const receiverOnLeave = onLeave.includes(emp.name);

    // ── منع التكرار: هل البلاغ مسجَّل مسبقاً؟ ────────────────────────────
    const { data: existing, error: lookupError } = await supabase
      .from('tickets')
      .select('id, receiver, reception_date')
      .eq('ticket_number', ticketNumber)
      .maybeSingle();

    if (lookupError) {
      console.error('[Transfer] Lookup error:', lookupError);
    }

    if (existing) {
      return NextResponse.json(
        {
          success: true,
          duplicate: true,
          message: `البلاغ ${ticketNumber} مسجَّل مسبقاً باسم (${existing.receiver || 'غير محدد'})`,
          transfer: { ticketNumber, receiver: existing.receiver || emp.name, category, date, time },
          whatsappMessage: buildTransferMessage(
            { ticketNumber, receiver: existing.receiver || emp.name, category, date, time },
            body.template
          ),
        },
        { headers }
      );
    }

    // ── الحفظ في قاعدة البيانات ─────────────────────────────────────────
    const baseRow = {
      ticket_number: ticketNumber,
      category_type: category,
      status: 'قيد المعالجة',
      solution: 'بلاغ جديد',
      reception_date: date,
      receiver: emp.name,
    };

    let inserted: any = null;
    let { data, error } = await supabase
      .from('tickets')
      .insert({ ...baseRow, transferred_at: riyadhNow().toISOString() })
      .select();

    // إن لم يكن عمود transferred_at موجوداً بعد، نحفظ بدونه حتى لا تتعطل الخدمة
    if (error && isMissingColumnError(error)) {
      console.warn('[Transfer] العمود transferred_at غير موجود — الحفظ بدونه');
      ({ data, error } = await supabase.from('tickets').insert(baseRow).select());
    }

    if (error) throw error;
    inserted = data?.[0];

    // ── إشعار الموظف (لا يوقف العملية عند الفشل) ────────────────────────
    try {
      await sendPushNotification(
        {
          title: `🔔 تحويل بلاغ رقم: ${ticketNumber}`,
          body: `👤 المحوّل له: ${emp.name} ✦ 📁 التصنيف: ${category} ✦ ⏰ ${time}`,
          url: '/',
        },
        emp.name
      );
    } catch (pushErr) {
      console.error('[Transfer] Push notification failed:', pushErr);
    }

    // معادلة الموظفين في إجازة بعد كل بلاغ جديد ليبقوا متساوين مع الأعلى
    await balanceQuietly();

    const transfer = { ticketNumber, receiver: emp.name, category, date, time };

    return NextResponse.json(
      {
        success: true,
        duplicate: false,
        id: inserted?.id || null,
        transfer,
        whatsappMessage: buildTransferMessage(transfer, body.template),
        by: user.name,
        receiverOnLeave,
        warning: receiverOnLeave ? `تنبيه: ${emp.name} مسجَّل في إجازة حالياً` : undefined,
      },
      { headers }
    );
  } catch (error: any) {
    console.error('[Transfer] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'تعذر حفظ التحويل' },
      { status: 500, headers }
    );
  }
}

// ─── آخر التحويلات (سجل سريع داخل التطبيق) ─────────────────────────────────
export async function GET(req: Request) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const user = verifyToken(getToken(req));
    if (!user) {
      return NextResponse.json({ success: false, error: 'جلسة غير صالحة' }, { status: 401, headers });
    }

    const { data, error } = await supabase
      .from('tickets')
      .select('id, ticket_number, category_type, receiver, reception_date')
      .order('id', { ascending: false })
      .limit(15);

    if (error) throw error;

    return NextResponse.json({ success: true, tickets: data || [] }, { headers });
  } catch (error: any) {
    console.error('[Transfer] History error:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر جلب آخر التحويلات' },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}
