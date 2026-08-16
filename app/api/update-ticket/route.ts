import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { sendPushNotification } from '../../../lib/push';
import { updateNotionTicket } from '../../../lib/notionSync';

export async function POST(req: Request) {
  try {
    let { ticketId, solution, status, receiver, mainTicketId, number, category_type, date } = await req.json();

    const updateData: any = {};
    if (solution !== undefined) {
      // Map solution to status accordingly (e.g. تم الحل -> إغلاق, otherwise قيد المعالجة)
      updateData.status = (solution === 'تم الحل') ? 'إغلاق' : 'قيد المعالجة';
      updateData.solution = solution;
    }
    if (receiver !== undefined) {
      updateData.receiver = receiver;
    }
    if (category_type !== undefined) {
      updateData.category_type = category_type;
    }
    if (date !== undefined) {
      updateData.reception_date = date;
    }

    if (Object.keys(updateData).length > 0) {
      let query = supabase.from('tickets').update(updateData);
      
      const conditions: string[] = [];
      if (mainTicketId) {
        if (mainTicketId.includes('-') && mainTicketId.length > 20) {
          conditions.push(`id.eq.${mainTicketId}`);
        } else {
          conditions.push(`notion_id.eq.${mainTicketId}`);
        }
      }
      if (ticketId) {
        if (ticketId.includes('-') && ticketId.length > 20) {
          conditions.push(`id.eq.${ticketId}`);
        } else {
          conditions.push(`notion_id.eq.${ticketId}`);
        }
      }
      if (number && number !== 'غير محدد') {
        conditions.push(`ticket_number.eq.${number}`);
      }

      if (conditions.length > 0) {
        const { error } = await query.or(conditions.join(','));
        if (error) throw error;

        // الحصول على رقم البلاغ الفعلي للمزامنة مع Notion
        let ticketNumber = number;
        if (!ticketNumber && (ticketId || mainTicketId)) {
          const { data } = await supabase
            .from('tickets')
            .select('ticket_number')
            .or(conditions.join(','))
            .limit(1)
            .single();
          if (data) {
            ticketNumber = data.ticket_number;
          }
        }

        // تحديث في Notion إذا كان رقم البلاغ والحل أو التاريخ متوفرين
        if (ticketNumber && (solution !== undefined || date !== undefined)) {
          try {
            await updateNotionTicket(ticketNumber, solution, date);
          } catch (notionErr) {
            console.error('Failed to update Notion ticket:', notionErr);
          }
        }
        
        // إرسال إشعار Push حسب نوع التحديث
        try {
          const rcv = receiver || 'غير محدد';
          const category = category_type || 'غير محدد';
          const sol = solution || 'غير محدد';
          const isVacation = solution === 'إجازة' || solution === 'في إجازة';
          const ticketNum = ticketNumber || 'غير محدد';

          await sendPushNotification({
            title: isVacation ? '🏖️ تم إضافة إجازة' : `✏️ تم تحديث بلاغ رقم: ${ticketNum}`,
            body: `👤 المستقبل: ${rcv} ✦ 📁 التصنيف: ${category} ✦ 💡 حالة المقترح: ${sol}`,
            url: '/'
          }, rcv);
        } catch (pushErr) {
          console.error('Failed to trigger push notification for updated ticket:', pushErr);
        }
      } else {
        return NextResponse.json({ error: 'No ticket identifier provided' }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update Error:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء تحديث البيانات في قاعدة البيانات.',
      details: error?.message 
    }, { status: 500 });
  }
}

