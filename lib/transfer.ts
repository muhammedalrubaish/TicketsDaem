/**
 * منطق تحويل البلاغات المشترك (التوزيع بالدور + التوقيت + رمز الدخول)
 * -------------------------------------------------------------------
 * يُستخدم من واجهات API الخاصة بتطبيق التحويل بالجوال ومن سكربت داعم.
 */

import crypto from 'crypto';
import { EMPLOYEES, Employee, DISTRIBUTION_START_DATE, ADMIN_PASS, findEmployee } from './employees';

// ─── التوقيت (الرياض UTC+3) ────────────────────────────────────────────────
const RIYADH_OFFSET_MINUTES = 3 * 60;

/** لحظة زمنية بتوقيت الرياض */
export function riyadhNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + (now.getTimezoneOffset() + RIYADH_OFFSET_MINUTES) * 60000);
}

/** تاريخ اليوم بصيغة YYYY-MM-DD بتوقيت الرياض */
export function riyadhDate(): string {
  return riyadhNow().toISOString().split('T')[0];
}

/** الوقت بصيغة HH:MM بتوقيت الرياض */
export function riyadhTime(): string {
  const d = riyadhNow();
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// ─── التوزيع بالدور ────────────────────────────────────────────────────────
export interface TicketRow {
  receiver?: string | null;
  reception_date?: string | null;
  category_type?: string | null;
  ticket_number?: string | null;
}

/**
 * حساب الموظف الذي عليه الدور: صاحب أقل عدد بلاغات منذ تاريخ بداية التوزيع.
 * نفس خوارزمية `getLeastReceiver` في إضافة Daem Plus.
 */
export function pickNextReceiver(tickets: TicketRow[]): { employee: Employee; counts: Record<string, number> } {
  const rotation = EMPLOYEES.filter((e) => e.inRotation);
  const counts: Record<string, number> = {};
  rotation.forEach((e) => { counts[e.name] = 0; });

  (tickets || []).forEach((t) => {
    const date = (t.reception_date || '').slice(0, 10);
    if (!date || date < DISTRIBUTION_START_DATE) return;

    const type = t.category_type || '';
    if (type === 'تحديث نظام' || type === 'تحديثات النظام') return;
    if (t.ticket_number && t.ticket_number.includes('📢')) return;

    const receiver = (t.receiver || '').trim();
    if (!receiver || receiver === 'غير محدد' || receiver === 'غير حدد') return;

    const emp = findEmployee(receiver);
    if (emp && emp.name in counts) counts[emp.name]++;
  });

  let best = rotation[0];
  for (const emp of rotation) {
    if (counts[emp.name] < counts[best.name]) best = emp;
  }
  return { employee: best, counts };
}

// ─── رمز الدخول (Token) ────────────────────────────────────────────────────
/**
 * رمز موقّع بسيط يُخزَّن داخل سكربت داعم على الجوال، ليعمل السكربت
 * دون الحاجة لإعادة إدخال كلمة المرور في كل مرة.
 * الصيغة: base64url(user).timestamp.hmac
 */
const TOKEN_TTL_MS = 180 * 24 * 60 * 60 * 1000; // ١٨٠ يوماً

function tokenSecret(): string {
  return (
    process.env.TRANSFER_TOKEN_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'balady-transfer-fallback-secret'
  );
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', tokenSecret()).update(payload).digest('hex').slice(0, 32);
}

export function createToken(username: string): string {
  const user = Buffer.from(username, 'utf8').toString('base64url');
  const ts = Date.now().toString(36);
  const payload = `${user}.${ts}`;
  return `${payload}.${sign(payload)}`;
}

export interface TokenUser {
  username: string;
  name: string;
  isAdmin: boolean;
}

export function verifyToken(token?: string | null): TokenUser | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [user, ts, sig] = parts;
  const expected = sign(`${user}.${ts}`);
  // مقارنة ثابتة الزمن لمنع تسريب المعلومات عبر توقيت المقارنة
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  const issued = parseInt(ts, 36);
  if (!Number.isFinite(issued) || Date.now() - issued > TOKEN_TTL_MS) return null;

  let username = '';
  try {
    username = Buffer.from(user, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  if (username === 'admin') return { username: 'admin', name: 'المشرف', isAdmin: true };

  const emp = findEmployee(username);
  if (!emp) return null;
  return { username: emp.username, name: emp.name, isAdmin: false };
}

/** التحقق من بيانات الدخول المبسّط وإرجاع الرمز */
export function login(username: string, password: string): { token: string; name: string; isAdmin: boolean } | null {
  const user = (username || '').trim().toLowerCase();
  const pass = (password || '').trim();

  if (user === 'admin') {
    if (pass !== ADMIN_PASS) return null;
    return { token: createToken('admin'), name: 'المشرف', isAdmin: true };
  }

  const emp = EMPLOYEES.find((e) => e.username.toLowerCase() === user && e.pass === pass);
  if (!emp) return null;
  return { token: createToken(emp.username), name: emp.name, isAdmin: false };
}

// ─── ترويسات CORS لسكربت داعم ──────────────────────────────────────────────
const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/([a-z0-9-]+\.)*momah\.gov\.sa$/i,
  /^https?:\/\/([a-z0-9-]+\.)*momra\.gov\.sa$/i,
  /^https?:\/\/([a-z0-9-]+\.)*momrauh\.gov\.sa$/i,
  /^https?:\/\/([a-z0-9-]+\.)*vercel\.app$/i,
  /^https?:\/\/localhost(:\d+)?$/i,
];

/**
 * ترويسات CORS. السكربت يعمل داخل صفحة داعم لذا نسمح لنطاقاتها.
 * الحماية الفعلية تعتمد على الرمز الموقّع وليس على المصدر.
 */
export function corsHeaders(origin?: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin)) ? origin : '*';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Transfer-Token',
    'Access-Control-Max-Age': '86400',
  };
}

// ─── رسالة الواتساب المرجعية ───────────────────────────────────────────────
export interface TransferRecord {
  ticketNumber: string;
  receiver: string;
  category: string;
  date: string; // تاريخ البلاغ YYYY-MM-DD
  time: string; // وقت التحويل HH:MM
}

export const DEFAULT_WA_TEMPLATE = `📋 *تحويل بلاغ - وحدة بلدي*
━━━━━━━━━━━━━━━━━━
🔢 *رقم البلاغ:* {ticket}
👤 *المحوّل له:* {receiver}
📁 *التصنيف:* {category}
📅 *تاريخ البلاغ:* {date}
⏰ *وقت التحويل:* {time}
━━━━━━━━━━━━━━━━━━`;

/** بناء نص رسالة الواتساب المرجعية من القالب */
export function buildTransferMessage(record: TransferRecord, template?: string): string {
  const tpl = template && template.trim() ? template : DEFAULT_WA_TEMPLATE;
  return tpl
    .replace(/\{ticket\}/g, record.ticketNumber || '—')
    .replace(/\{receiver\}/g, record.receiver || '—')
    .replace(/\{category\}/g, record.category || '—')
    .replace(/\{date\}/g, record.date || '—')
    .replace(/\{time\}/g, record.time || '—');
}
