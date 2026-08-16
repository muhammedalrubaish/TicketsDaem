import { supabase } from '../lib/supabase';
import DashboardClient from './DashboardClient';
import { syncRecentNotionChanges } from '../lib/notionSync';

export const dynamic = 'force-dynamic';
export const revalidate = 0; 

async function getComplaints() {
  try {
    // تشغيل مزامنة التغييرات الأخيرة من نويشن إلى قاعدة البيانات قبل الاستعلام
    try {
      await syncRecentNotionChanges();
    } catch (syncErr) {
      console.error('Failed to run recent Notion changes sync on page load:', syncErr);
    }

    // Supabase يعيد 1000 سجل كحد أقصى في الطلب الواحد
    // لذا نجلب البيانات على دفعات لضمان الحصول على الأرشيف الكامل
    let allData: any[] = [];
    let from = 0;
    const batchSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .gte('reception_date', '2026-04-04')
        .order('reception_date', { ascending: false })
        .range(from, from + batchSize - 1);

      if (error) {
        console.error('Supabase error:', error);
        break;
      }

      if (!data || data.length === 0) break;
      
      allData = allData.concat(data);
      
      // إذا جلبنا أقل من الحد، يعني وصلنا لنهاية البيانات
      if (data.length < batchSize) break;
      
      from += batchSize;
    }

    return allData.map(ticket => ({
      id: ticket.notion_id || ticket.id || ticket.ticket_number,
      statusPageId: ticket.notion_id,
      number: ticket.ticket_number || 'غير محدد',
      type: ticket.category_type || 'غير محدد',
      status: ticket.status || 'غير محدد',
      solution: ticket.solution || 'غير محدد',
      date: ticket.reception_date || 'غير محدد',
      receiver: ticket.receiver || 'غير محدد',
      createdAt: ticket.created_at
    }));
  } catch (err) {
    console.error('Fetch error:', err);
    return [];
  }
}

export default async function Home() {
  const complaints = await getComplaints();
  return <DashboardClient complaints={complaints} />;
}
