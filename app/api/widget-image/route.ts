import { NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

const EMPLOYEES = [
  { name: 'البراء النصيان',   user: 'a.alnesayan',  pass: '1111' },
  { name: 'عبدالله العويد',   user: 'aalowaid',      pass: '2222' },
  { name: 'عبدالرحمن العمري', user: 'af.alamri',     pass: '3333' },
  { name: 'عزام الحربي',      user: 'azz.alharbi',   pass: '4444' },
  { name: 'محمد الربيش',      user: 'mialrubaish',   pass: 'Balady.20' },
  { name: 'صالح الغصن',       user: 's.alghosen',    pass: '6666' },
  { name: 'طارق الهدياني',    user: 't.alhedyani',   pass: '7777' },
  { name: 'ثامر المنصور',     user: 't.almansour',   pass: '8888' },
];

const ADMIN_PASS = 'Balady.2026';
const START_DATE = '2026-04-04';

function x(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authParam = searchParams.get('auth') ?? '';

  let mode = 'employee', username = '', password = '';
  try {
    const decoded = Buffer.from(authParam, 'base64').toString('utf-8');
    const [m, u, ...rest] = decoded.split(':');
    mode = m ?? 'employee';
    username = u ?? '';
    password = rest.join(':') ?? '';
  } catch { /* invalid */ }

  // ── التحقق من بيانات الدخول ─────────────────────────────────
  let employeeName = '—';
  let isAdmin = false;
  let authOk = false;

  if (mode === 'admin') {
    if (password === ADMIN_PASS) { isAdmin = true; authOk = true; employeeName = 'المشرف'; }
  } else {
    const emp = EMPLOYEES.find(
      e => e.user.toLowerCase() === username.toLowerCase() && e.pass === password
    );
    if (emp) { authOk = true; employeeName = emp.name; }
  }

  // ── جلب الإحصائيات ──────────────────────────────────────────
  let stats = { total: 0, new: 0, unsolved: 0, solved: 0 };
  let hasNew = false;
  let connected = false;

  if (authOk) {
    try {
      let all: any[] = [];
      let from = 0;
      while (all.length < 10000) {
        let q = supabase
          .from('tickets')
          .select('ticket_number, status, solution')
          .gte('reception_date', START_DATE)
          .range(from, from + 999);
        if (!isAdmin) q = (q as any).eq('receiver', employeeName);
        const { data: page, error } = await q;
        if (error || !page || page.length === 0) break;
        all.push(...page);
        if (page.length < 1000) break;
        from += 1000;
      }
      const tickets = all.filter(t => t.ticket_number && !t.ticket_number.trim().startsWith('📢'));
      let n = 0, u2 = 0, s2 = 0;
      for (const t of tickets) {
        const st = t.status ?? ''; const sol = t.solution ?? '';
        if (st === 'تم الحل' || sol === 'تم الحل') {
          s2++;
        } else {
          u2++;
          if (st === 'بلاغ جديد') n++;
        }
      }
      stats = { total: tickets.length, new: n, unsolved: u2, solved: s2 };
      hasNew = n > 0;
      connected = true;
    } catch { connected = false; }
  }

  const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  const bg1 = hasNew ? '#1a0a2e' : '#0f172a';
  const bg2 = hasNew ? '#2d1060' : '#1e293b';
  const cardsY = hasNew ? 88 : 54;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
<defs>
  <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="${bg1}"/>
    <stop offset="100%" stop-color="${bg2}"/>
  </linearGradient>
  <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#1e293b" stop-opacity="0.9"/>
    <stop offset="100%" stop-color="#1e293b" stop-opacity="0.6"/>
  </linearGradient>
</defs>
<rect width="400" height="200" rx="16" fill="url(#bg)"/>
<circle cx="18" cy="22" r="5" fill="${connected ? '#10b981' : '#ef4444'}"/>
<text x="28" y="27" font-family="Arial" font-size="10" fill="${connected ? '#10b981' : '#ef4444'}">${connected ? 'متصل' : 'offline'}</text>
<text x="390" y="27" font-family="Segoe UI,Arial" font-size="14" font-weight="bold" fill="#f1f5f9" text-anchor="end">${x(employeeName)} &#x1F4CA;</text>
<line x1="10" y1="36" x2="390" y2="36" stroke="#334155" stroke-width="0.5"/>
${hasNew ? `<rect x="10" y="44" width="380" height="28" rx="6" fill="#7c3aed" fill-opacity="0.3" stroke="#8b5cf6" stroke-opacity="0.5" stroke-width="1"/>
<text x="200" y="62" font-family="Segoe UI,Arial" font-size="12" font-weight="bold" fill="#c4b5fd" text-anchor="middle">&#x1F514; ${stats.new} بلاغ جديد!</text>` : ''}
<!-- الإجمالي -->
<rect x="10" y="${cardsY}" width="88" height="72" rx="8" fill="url(#card)"/>
<text x="54" y="${cardsY+40}" font-family="Arial" font-size="26" font-weight="bold" fill="#f8fafc" text-anchor="middle">${stats.total}</text>
<text x="54" y="${cardsY+58}" font-family="Segoe UI,Arial" font-size="11" fill="#94a3b8" text-anchor="middle">الإجمالي</text>
<!-- جديد -->
<rect x="106" y="${cardsY}" width="88" height="72" rx="8" fill="url(#card)"/>
<text x="150" y="${cardsY+40}" font-family="Arial" font-size="26" font-weight="bold" fill="#8b5cf6" text-anchor="middle">${stats.new}</text>
<text x="150" y="${cardsY+58}" font-family="Segoe UI,Arial" font-size="11" fill="#94a3b8" text-anchor="middle">جديد</text>
<!-- غير محلول -->
<rect x="202" y="${cardsY}" width="88" height="72" rx="8" fill="url(#card)"/>
<text x="246" y="${cardsY+40}" font-family="Arial" font-size="26" font-weight="bold" fill="#ef4444" text-anchor="middle">${stats.unsolved}</text>
<text x="246" y="${cardsY+58}" font-family="Segoe UI,Arial" font-size="11" fill="#94a3b8" text-anchor="middle">غير محلول</text>
<!-- تم الحل -->
<rect x="298" y="${cardsY}" width="92" height="72" rx="8" fill="url(#card)"/>
<text x="344" y="${cardsY+40}" font-family="Arial" font-size="26" font-weight="bold" fill="#10b981" text-anchor="middle">${stats.solved}</text>
<text x="344" y="${cardsY+58}" font-family="Segoe UI,Arial" font-size="11" fill="#94a3b8" text-anchor="middle">تم الحل</text>
<text x="390" y="194" font-family="Arial" font-size="10" fill="#475569" text-anchor="end">&#x1F551; ${x(now)}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
