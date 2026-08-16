import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { ticketId, createdAt, receiver, category, solution } = await req.json();

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    // التحقق من صلاحيات المشرف محمد الربيش لتجاوز قيد الساعتين
    const cookieStore = req.headers.get('cookie') || '';
    const isMainAdmin = cookieStore.includes('super_admin') || cookieStore.includes(encodeURIComponent('محمد الربيش'));

    // التحقق من الوقت (ساعتين) في السيرفر لزيادة الأمان (فقط لغير محمد الربيش)
    if (createdAt && !isMainAdmin) {
      const createdDate = new Date(createdAt);
      const now = new Date();
      const diffInHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours > 2) {
        return NextResponse.json({ error: 'عذراً، لا يمكن حذف البلاغات التي مر عليها أكثر من ساعتين.' }, { status: 403 });
      }
    }

    // الحذف من Supabase للمزامنة الفورية والمستقرة
    const { supabase } = await import('../../../lib/supabase');
    
    // نحذف بمطابقة المعرف كـ UUID الخاص بسوبابيس أو notion_id أو رقم البلاغ لضمان العمل على السجلات القديمة والجديدة
    const conditions = [];
    if (ticketId.includes('-') && ticketId.length > 20) {
      conditions.push(`id.eq.${ticketId}`);
    } else {
      conditions.push(`notion_id.eq.${ticketId}`);
    }
    if (ticketId.startsWith('IM')) {
      conditions.push(`ticket_number.eq.${ticketId}`);
    }

    const { error: dbError } = await supabase
      .from('tickets')
      .delete()
      .or(conditions.join(','));

    if (dbError) {
      throw dbError;
    }

    // إرسال إشعار عند حذف البلاغ
    try {
      const { sendPushNotification } = await import('../../../lib/push');
      const rcv = receiver || 'غير محدد';
      const cat = category || 'غير محدد';
      const sol = solution || 'غير محدد';
      await sendPushNotification({
        title: `🗑️ تم حذف البلاغ رقم: ${ticketId}`,
        body: `👤 المستقبل: ${rcv} ✦ 📁 التصنيف: ${cat} ✦ 💡 حالة المقترح: ${sol}`,
        url: '/'
      }, rcv);
    } catch (pushErr) {
      console.error('Failed to send delete push notification:', pushErr);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete Error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف البلاغ.' }, { status: 500 });
  }
}

