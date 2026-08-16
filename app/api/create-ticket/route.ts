import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { sendPushNotification } from '../../../lib/push';
import { createNotionTicket } from '../../../lib/notionSync';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. Insert directly into Supabase
    const { data: insertedData, error: insertError } = await supabase
      .from('tickets')
      .insert({
        ticket_number: data.ticketNumber,
        category_type: data.type || data.serviceType || 'أخرى',
        status: (data.solution === 'تم الحل') ? 'إغلاق' : 'قيد المعالجة',
        solution: data.solution || 'بلاغ جديد',
        reception_date: data.date,
        receiver: data.receiver || data.name || 'غير محدد'
      })
      .select();

    if (insertError) {
      throw insertError;
    }

    // 2. If the receiver is Mohamed Al-Robaish, insert to Notion database
    const isReceiverRobaish = data.receiver && (data.receiver.includes('محمد الربيش') || data.receiver.includes('الربيش'));
    if (isReceiverRobaish) {
      try {
        await createNotionTicket(
          data.ticketNumber,
          data.type || data.serviceType || 'أخرى',
          data.receiver || data.name || 'غير محدد',
          data.date,
          data.reportText || '',
          data.phoneNumber || '',
          data.municipality || '',
          data.journalUpdates || '',
          data.companyName || '',
          data.nationalId || ''
        );
      } catch (notionErr) {
        console.error('Failed to create ticket in Notion:', notionErr);
      }
    }

    const insertedTicket = insertedData?.[0];

    // Trigger Push Notification to all subscribed devices
    try {
      const ticketNum = data.ticketNumber || 'غير محدد';
      const category = data.type || data.serviceType || 'غير محدد';
      const rcv = data.receiver || data.name || 'غير محدد';
      const solutionText = data.solution || 'غير محدد';

      await sendPushNotification({
        title: `🔔 إسناد بلاغ جديد رقم: ${ticketNum}`,
        body: `👤 المستقبل: ${rcv} ✦ 📁 التصنيف: ${category} ✦ 💡 حالة المقترح: ${solutionText}`,
        url: '/'
      }, rcv);
    } catch (pushErr) {
      console.error('Failed to trigger push notification for new ticket:', pushErr);
    }

    return NextResponse.json({ 
      success: true, 
      pageId: insertedTicket?.id || 'supabase-' + Date.now() 
    });
  } catch (error: any) {
    console.error('Create Ticket Error:', error);
    return NextResponse.json({ 
      error: error?.message || 'حدث خطأ أثناء حفظ البلاغ في قاعدة البيانات.'
    }, { status: 500 });
  }
}
