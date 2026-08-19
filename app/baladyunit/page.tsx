import { getLocalDb } from '../../lib/db';
import { supabase } from '../../lib/supabase';
import DashboardClient from '../DashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getComplaints() {
  try {
    // 1. محاولة جلب البلاغات مباشرة من قاعدة بيانات PostgreSQL المحلية على السيرفر
    try {
      const pool = getLocalDb();
      const queryText = `
        SELECT 
          id, notion_id, ticket_number, category_type, status, solution, 
          TO_CHAR(reception_date, 'YYYY-MM-DD') as reception_date, 
          receiver, created_at 
        FROM tickets 
        ORDER BY reception_date DESC NULLS LAST, created_at DESC NULLS LAST
      `;
      const res = await pool.query(queryText);
      if (res && res.rows && res.rows.length > 0) {
        return res.rows.map(ticket => ({
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
      }
    } catch (dbErr: any) {
      console.warn('Local PostgreSQL query skipped/failed, falling back to Supabase:', dbErr.message);
    }

    // 2. كخيار احتياطي فقط (في حال تشغيل المشروع خارج بيئة السيرفر)
    let allData: any[] = [];
    let from = 0;
    const batchSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('reception_date', { ascending: false })
        .range(from, from + batchSize - 1);

      if (error || !data || data.length === 0) break;
      allData = allData.concat(data);
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

export default async function BaladyUnitPage() {
  const complaints = await getComplaints();
  return <DashboardClient complaints={complaints} />;
}
