import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { sendPushNotification } from '../../../../lib/push';

export async function GET() {
  try {
    // Calculate date threshold for 1 day ago (24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format to YYYY-MM-DD
    const thresholdDateStr = yesterday.toISOString().split('T')[0];

    // Fetch active (not closed) tickets where reception_date is older than yesterday
    const { data: delayedTickets, error } = await supabase
      .from('tickets')
      .select('*')
      .neq('status', 'إغلاق')
      .lt('reception_date', thresholdDateStr);

    if (error) {
      console.error('Error fetching delayed tickets:', error);
      throw error;
    }

    if (!delayedTickets || delayedTickets.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No delayed tickets.' });
    }

    const count = delayedTickets.length;
    let title = '⚠️ بلاغات بلدي متأخرة';
    let body = '';

    if (count === 1) {
      const ticket = delayedTickets[0];
      title = `⚠️ بلاغ متأخر رقم: ${ticket.ticket_number || 'غير محدد'}`;
      body = `👤 المستقبل: ${ticket.receiver || 'غير محدد'} ✦ 📁 التصنيف: ${ticket.category_type || 'غير محدد'} ✦ 📅 تاريخ الاستقبال: ${ticket.reception_date || 'غير محدد'}`;
    } else {
      body = `⚠️ يوجد عدد (${count}) بلاغات متأخرة لأكثر من يوم دون معالجة. يرجى المتابعة.`;
    }

    const result = await sendPushNotification({
      title: title,
      body: body,
      url: '/'
    });

    return NextResponse.json({ success: true, count, result });
  } catch (error: any) {
    console.error('Check Delayed API Error:', error);
    return NextResponse.json({ 
      error: error?.message || 'Failed to check delayed tickets.' 
    }, { status: 500 });
  }
}
