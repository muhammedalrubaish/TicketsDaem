/**
 * نظام إجازات الموظفين ومعادلة عدد البلاغات
 * ==========================================
 * الفكرة:
 *  • عند تسجيل إجازة لموظف، يتوقف نظام التوزيع بالدور عن اختياره.
 *  • ولأن خوارزمية الدور تختار «صاحب أقل عدد بلاغات»، فإن ترك الغائب
 *    بعدد أقل يعني انهيال البلاغات عليه فور رجوعه.
 *  • الحل: يضيف النظام تلقائياً بلاغات باسم «إجازة» للموظف الغائب حتى
 *    يتساوى عدده مع أعلى زميل حاضر — وهو نفس ما كان يُعمل يدوياً.
 *  • ميزة إضافية: بما أن عدده يصبح مساوياً للأعلى، فإن كل الأنظمة التي
 *    تحسب «الأقل» تتخطاه تلقائياً — بما فيها إضافة كروم المثبتة محلياً.
 */

import { supabase } from './supabase';
import { EMPLOYEES, Employee, DISTRIBUTION_START_DATE, findEmployee } from './employees';
import { riyadhDate } from './transfer';

export interface LeaveRecord {
  id: number;
  employee_name: string;
  start_date: string;
  end_date: string | null;
  active: boolean;
  created_by?: string | null;
  created_at?: string;
}

/** خطأ يدل على أن جدول الإجازات لم يُنشأ بعد في قاعدة البيانات */
export function isMissingLeavesTable(error: any): boolean {
  const msg = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return msg.includes('employee_leaves') && (msg.includes('does not exist') || msg.includes('schema cache'));
}

// ─── قراءة الإجازات ────────────────────────────────────────────────────────
/**
 * جلب الإجازات السارية، مع إنهاء أي إجازة تجاوزت تاريخ نهايتها تلقائياً.
 * تُرجع مصفوفة فارغة بأمان إذا لم يكن الجدول موجوداً بعد.
 */
export async function getActiveLeaves(): Promise<LeaveRecord[]> {
  const { data, error } = await supabase
    .from('employee_leaves')
    .select('*')
    .eq('active', true);

  if (error) {
    if (isMissingLeavesTable(error)) return [];
    console.error('[Leaves] فشل جلب الإجازات:', error);
    return [];
  }

  const today = riyadhDate();
  const expired = (data || []).filter((l) => l.end_date && l.end_date < today);
  const stillActive = (data || []).filter((l) => !l.end_date || l.end_date >= today);

  // الإنهاء التلقائي: أي إجازة انتهى تاريخها تُغلق عند أول قراءة بعدها
  if (expired.length > 0) {
    try {
      await supabase
        .from('employee_leaves')
        .update({ active: false, ended_at: new Date().toISOString(), ended_by: 'انتهاء تلقائي' })
        .in('id', expired.map((l) => l.id));
    } catch (e) {
      console.error('[Leaves] فشل الإنهاء التلقائي للإجازات المنتهية:', e);
    }
  }

  return stillActive as LeaveRecord[];
}

/** أسماء الموظفين في إجازة سارية (بالاسم المعتمد في قائمة الموظفين) */
export async function getEmployeesOnLeave(): Promise<string[]> {
  const leaves = await getActiveLeaves();
  const names: string[] = [];
  for (const leave of leaves) {
    const emp = findEmployee(leave.employee_name);
    const name = emp ? emp.name : leave.employee_name;
    if (!names.includes(name)) names.push(name);
  }
  return names;
}

// ─── عدّ البلاغات ──────────────────────────────────────────────────────────
/** جلب كل البلاغات المحتسبة في التوزيع منذ تاريخ بداية التوزيع */
async function fetchCountableTickets(): Promise<any[]> {
  const PAGE_SIZE = 1000;
  let all: any[] = [];
  let from = 0;

  while (all.length < 20000) {
    const { data, error } = await supabase
      .from('tickets')
      .select('ticket_number, category_type, receiver, reception_date')
      .gte('reception_date', DISTRIBUTION_START_DATE)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    all = all.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

/**
 * عدّ بلاغات كل موظف بنفس قواعد لوحة التحكم:
 * تُستثنى تحديثات النظام والتعاميم، وتُحتسب الإجازات كبلاغ.
 */
export function countByEmployee(tickets: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  EMPLOYEES.filter((e) => e.inRotation).forEach((e) => { counts[e.name] = 0; });

  (tickets || []).forEach((t) => {
    const type = t.category_type || '';
    if (type === 'تحديث نظام' || type === 'تحديثات النظام') return;
    if (t.ticket_number && t.ticket_number.includes('📢')) return;

    const receiver = (t.receiver || '').trim();
    if (!receiver || receiver === 'غير محدد' || receiver === 'غير حدد') return;

    const emp = findEmployee(receiver);
    if (emp && emp.name in counts) counts[emp.name]++;
  });

  return counts;
}

// ─── المعادلة ──────────────────────────────────────────────────────────────
export interface BalanceResult {
  balanced: { employee: string; added: number; from: number; to: number }[];
  target: number;
  skipped?: string;
}

/**
 * معادلة الموظفين في إجازة: رفع عدد بلاغات كل غائب ليساوي أعلى زميل حاضر.
 * تُستدعى تلقائياً بعد كل تسجيل بلاغ جديد، وأيضاً يدوياً من اللوحة.
 */
export async function balanceLeaveTickets(): Promise<BalanceResult> {
  const onLeave = await getEmployeesOnLeave();
  if (onLeave.length === 0) return { balanced: [], target: 0, skipped: 'لا يوجد موظفون في إجازة' };

  const tickets = await fetchCountableTickets();
  const counts = countByEmployee(tickets);

  const rotation = EMPLOYEES.filter((e) => e.inRotation);
  const present = rotation.filter((e) => !onLeave.includes(e.name));
  const absent = rotation.filter((e) => onLeave.includes(e.name));

  if (present.length === 0) return { balanced: [], target: 0, skipped: 'جميع الموظفين في إجازة' };
  if (absent.length === 0) return { balanced: [], target: 0, skipped: 'لا يوجد موظف غائب ضمن التوزيع' };

  // المعيار المعتمد: مساواة الغائب بأعلى زميل حاضر
  const target = Math.max(...present.map((e) => counts[e.name] || 0));
  const today = riyadhDate();
  const stamp = Date.now().toString(36);
  const result: BalanceResult = { balanced: [], target };

  for (const emp of absent) {
    const current = counts[emp.name] || 0;
    const gap = target - current;
    if (gap <= 0) continue;

    const rows = [];
    for (let i = 1; i <= gap; i++) {
      rows.push({
        // الرقم يحتوي كلمة «إجازة» ليتوافق مع فلاتر اللوحة الموجودة
        ticket_number: `إجازة-${today}-${emp.key}-${stamp}-${i}`,
        category_type: 'إجازة',
        status: 'إغلاق',
        solution: 'مجاز',
        reception_date: today,
        receiver: emp.name,
      });
    }

    const { error } = await supabase.from('tickets').insert(rows);
    if (error) {
      console.error(`[Leaves] فشل إضافة بلاغات الإجازة لـ ${emp.name}:`, error);
      continue;
    }

    result.balanced.push({ employee: emp.name, added: gap, from: current, to: target });
  }

  return result;
}

/** معادلة صامتة تُستدعى بعد تسجيل بلاغ — لا ترفع أخطاء أبداً */
export async function balanceQuietly(): Promise<void> {
  try {
    const result = await balanceLeaveTickets();
    if (result.balanced.length > 0) {
      console.log('[Leaves] تمت معادلة الإجازات:', JSON.stringify(result.balanced));
    }
  } catch (e) {
    console.error('[Leaves] تعذرت المعادلة التلقائية:', e);
  }
}

// ─── إدارة الإجازة ─────────────────────────────────────────────────────────
export async function startLeave(params: {
  employeeName: string;
  startDate?: string;
  endDate?: string | null;
  createdBy?: string;
  note?: string;
}): Promise<{ leave: LeaveRecord; balance: BalanceResult }> {
  const emp = findEmployee(params.employeeName);
  if (!emp) throw new Error('اسم الموظف غير معروف');

  const startDate = params.startDate || riyadhDate();
  const endDate = params.endDate || null;

  if (endDate && endDate < startDate) throw new Error('تاريخ نهاية الإجازة قبل تاريخ بدايتها');

  const { data, error } = await supabase
    .from('employee_leaves')
    .insert({
      employee_name: emp.name,
      start_date: startDate,
      end_date: endDate,
      active: true,
      created_by: params.createdBy || null,
      note: params.note || null,
    })
    .select()
    .single();

  if (error) {
    if (isMissingLeavesTable(error)) {
      throw new Error('جدول الإجازات غير موجود — نفّذ ملف جدول_إجازات_الموظفين.sql في Supabase أولاً');
    }
    // فهرس فريد يمنع أكثر من إجازة سارية لنفس الموظف
    if (`${error.message}`.includes('duplicate') || error.code === '23505') {
      throw new Error(`${emp.name} لديه إجازة سارية بالفعل`);
    }
    throw error;
  }

  // معادلة فورية حتى لا يُختار الغائب في الدور مباشرة بعد تسجيل الإجازة
  const balance = await balanceLeaveTickets();
  return { leave: data as LeaveRecord, balance };
}

export async function endLeave(params: {
  employeeName?: string;
  leaveId?: number;
  endedBy?: string;
}): Promise<{ ended: number; balance: BalanceResult }> {
  // معادلة أخيرة قبل الإنهاء ليعود الموظف مساوياً لزملائه تماماً
  const balance = await balanceLeaveTickets();

  let query = supabase
    .from('employee_leaves')
    .update({ active: false, ended_at: new Date().toISOString(), ended_by: params.endedBy || null })
    .eq('active', true);

  if (params.leaveId) {
    query = query.eq('id', params.leaveId);
  } else if (params.employeeName) {
    const emp = findEmployee(params.employeeName);
    query = query.eq('employee_name', emp ? emp.name : params.employeeName);
  } else {
    throw new Error('يجب تحديد الموظف أو رقم الإجازة');
  }

  const { data, error } = await query.select();
  if (error) {
    if (isMissingLeavesTable(error)) throw new Error('جدول الإجازات غير موجود');
    throw error;
  }

  return { ended: (data || []).length, balance };
}

// ─── الصلاحيات ─────────────────────────────────────────────────────────────
/**
 * التحقق من صلاحية إدارة الإجازات: أي موظف يملك صلاحية إدارة الموظفين
 * (addEmployee) أو المشرف العام.
 */
export async function canManageLeaves(actorName?: string | null): Promise<boolean> {
  const name = (actorName || '').trim();
  if (!name) return false;

  // المشرف العام دائماً مخوَّل
  if (name.includes('الربيش') || name === 'المشرف' || name === 'admin') return true;

  try {
    const { data, error } = await supabase
      .from('employees')
      .select('name, permissions')
      .eq('name', name)
      .maybeSingle();

    if (error || !data) return false;
    const perms = (data as any).permissions || {};
    return perms.addEmployee === true;
  } catch {
    return false;
  }
}

/** حالة الإجازات مع أعداد البلاغات — لعرضها في اللوحة */
export async function getLeavesStatus(): Promise<{
  leaves: LeaveRecord[];
  counts: Record<string, number>;
  onLeave: string[];
  employees: { name: string; key: string; inRotation: boolean; onLeave: boolean; count: number }[];
}> {
  const leaves = await getActiveLeaves();

  // الأعداد ثانوية: إن تعذّر جلبها نُرجع الإجازات على الأقل حتى لا تتعطل
  // كل الأنظمة التي تعتمد على معرفة من هو في إجازة
  let counts: Record<string, number> = {};
  try {
    counts = countByEmployee(await fetchCountableTickets());
  } catch (e) {
    console.error('[Leaves] تعذر حساب أعداد البلاغات:', e);
  }
  const onLeave = leaves.map((l) => {
    const emp = findEmployee(l.employee_name);
    return emp ? emp.name : l.employee_name;
  });

  const employees = EMPLOYEES.map((e: Employee) => ({
    name: e.name,
    key: e.key,
    inRotation: e.inRotation,
    onLeave: onLeave.includes(e.name),
    count: counts[e.name] || 0,
  }));

  return { leaves, counts, onLeave, employees };
}
