'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── أنواع البيانات ────────────────────────────────────────────────────────────
interface Stats {
  total: number; new: number; waiting: number;
  ministry: number; unsolved: number; solved: number; other: number;
}
interface Ticket  { number: string; type: string; status: string; date: string; }
interface WidgetData {
  success: boolean; employeeName: string; isAdmin: boolean;
  stats: Stats; latest: Ticket[]; hasNewTickets: boolean; error?: string;
}
interface Auth { mode: 'admin' | 'employee'; username: string; password: string; }

// ─── ثوابت ─────────────────────────────────────────────────────────────────────
const STORAGE_KEY   = 'balady_widget_auth_v2';
const REFRESH_MS    = 30_000; // تحديث كل 30 ثانية
const LOGO_URL      = '/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%A8%D9%84%D8%AF%D9%8A%20%D8%A7%D9%84%D8%B1%D8%B3%D9%85%D9%8A.png';

const STATUS_COLORS: Record<string, string> = {
  'بلاغ جديد':         '#8b5cf6',
  'بانتظار المستفيد':  '#ec4899',
  'لدى الوزارة':       '#f59e0b',
  'مشكلة عامة':        '#0ea5e9',
  'لم يتم الحل':       '#ef4444',
  'تم الحل':           '#10b981',
  'مجاز':              '#6b7280',
};

// ─── المكوِّن الرئيسي ──────────────────────────────────────────────────────────
export default function MobileWidget() {
  const [auth,        setAuth]        = useState<Auth | null>(null);
  const [loginMode,   setLoginMode]   = useState<'select' | 'admin' | 'employee'>('select');
  const [username,    setUsername]    = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [data,        setData]        = useState<WidgetData | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [loginErr,    setLoginErr]    = useState('');
  const [lastUpdate,  setLastUpdate]  = useState<Date | null>(null);
  const prevNewCount  = useRef<number>(0);

  // ── جلب البيانات من API ────────────────────────────────────────────────────
  const fetchData = useCallback(async (creds: Auth) => {
    try {
      const res    = await fetch('/api/widget-employee', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(creds),
        cache:   'no-store',
      });
      const result: WidgetData = await res.json();

      if (result.success) {
        // إشعار المتصفح عند ظهور بلاغ جديد
        if (
          result.hasNewTickets &&
          result.stats.new > prevNewCount.current &&
          prevNewCount.current !== 0 &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          new Notification('🔔 وحدة بلدي — بلاغ جديد', {
            body: `لديك ${result.stats.new} بلاغ جديد`,
            icon: LOGO_URL,
          });
        }
        prevNewCount.current = result.stats.new;
        setData(result);
        setLastUpdate(new Date());
      } else if (res.status === 401) {
        // بيانات دخول منتهية — أعِد تسجيل الدخول
        localStorage.removeItem(STORAGE_KEY);
        setAuth(null);
      }
    } catch { /* تجاهل أخطاء الشبكة المؤقتة */ }
  }, []);

  // ── تحميل بيانات الجلسة من localStorage عند فتح الصفحة ─────────────────
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const creds = JSON.parse(stored) as Auth;
        setAuth(creds);
        setLoading(true);
        fetchData(creds).finally(() => setLoading(false));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    // طلب إذن الإشعارات
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [fetchData]);

  // ── التحديث التلقائي كل 30 ثانية ─────────────────────────────────────────
  useEffect(() => {
    if (!auth) return;
    const id = setInterval(() => fetchData(auth), REFRESH_MS);
    return () => clearInterval(id);
  }, [auth, fetchData]);

  // ── تسجيل الدخول ─────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginErr('');

    const creds: Auth = {
      mode:     loginMode as 'admin' | 'employee',
      username: loginMode === 'admin' ? 'admin' : username.trim(),
      password: password.trim(),
    };

    try {
      const res    = await fetch('/api/widget-employee', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(creds),
      });
      const result: WidgetData = await res.json();

      if (result.success) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
        prevNewCount.current = result.stats.new;
        setAuth(creds);
        setData(result);
        setLastUpdate(new Date());
      } else {
        setLoginErr(result.error ?? 'بيانات الدخول غير صحيحة');
      }
    } catch {
      setLoginErr('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  // ── تسجيل الخروج ─────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    prevNewCount.current = 0;
    setAuth(null); setData(null);
    setLoginMode('select'); setUsername(''); setPassword(''); setLoginErr('');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── شاشة تسجيل الدخول ─────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  if (!auth) {
    return (
      <>
        <style>{`
          * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          body { margin: 0; }
          input::placeholder { color: #475569; }
          input:focus { outline: none; border-color: #6366f1 !important; }
          @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
        <div style={S.page}>
          <div style={S.loginCard}>
            {/* شعار */}
            <img src={LOGO_URL} alt="شعار بلدي" style={S.logo} />
            <h1 style={S.appTitle}>نظام بلاغات وحدة بلدي</h1>
            <p style={S.appSub}>ويدجت الشاشة الرئيسية</p>

            {loginMode === 'select' ? (
              /* ── اختيار نوع الدخول ─────────────────────────────────────── */
              <div style={S.modeGrid}>
                <button style={S.modeBtn} onClick={() => setLoginMode('admin')}>
                  <span style={{ fontSize: '2.2rem' }}>👁️</span>
                  <span style={S.modeBtnTitle}>بوابة المشرف</span>
                  <span style={S.modeBtnSub}>رؤية جميع البلاغات</span>
                </button>
                <button style={S.modeBtn} onClick={() => setLoginMode('employee')}>
                  <span style={{ fontSize: '2.2rem' }}>👨‍💼</span>
                  <span style={S.modeBtnTitle}>بوابة الموظف</span>
                  <span style={S.modeBtnSub}>بلاغاتي الشخصية</span>
                </button>
              </div>
            ) : (
              /* ── نموذج تسجيل الدخول ────────────────────────────────────── */
              <form onSubmit={handleLogin} style={S.form}>
                <button
                  type="button"
                  style={S.backBtn}
                  onClick={() => { setLoginMode('select'); setLoginErr(''); setPassword(''); }}
                >
                  &#8592; العودة
                </button>
                <h2 style={S.formTitle}>
                  {loginMode === 'admin' ? '👁️ دخول المشرف' : '👨‍💼 دخول الموظف'}
                </h2>

                {loginMode === 'employee' && (
                  <input
                    style={S.input}
                    type="text"
                    inputMode="email"
                    autoComplete="username"
                    placeholder="اسم المستخدم"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    dir="ltr"
                  />
                )}

                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...S.input, paddingLeft: '2.8rem' }}
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={loginMode === 'admin' ? 'كلمة مرور المشرف' : 'كلمة السر'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={S.eyeBtn}
                    aria-label="إظهار/إخفاء كلمة السر"
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>

                {loginErr && <p style={S.errText}>{loginErr}</p>}

                <button type="submit" style={S.submitBtn} disabled={loading}>
                  {loading ? '⏳ جاري التحقق...' : '🔐 دخول النظام'}
                </button>
              </form>
            )}
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── شاشة التحميل الأولي ───────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  if (loading && !data) {
    return (
      <div style={S.page}>
        <div style={{ color: '#94a3b8', fontSize: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          جاري تحميل البيانات…
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── الويدجت الرئيسي ───────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  const stats   = data?.stats ?? { total:0, new:0, waiting:0, ministry:0, unsolved:0, solved:0, other:0 };
  const hasNew  = data?.hasNewTickets ?? false;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin:0; }
        @keyframes pulse {
          0%,100% { opacity:1; }
          50%      { opacity:.6; }
        }
        @keyframes fadeSlide {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0);   }
        }
        .alert-pulse { animation: pulse 2s infinite; }
        .fade-in     { animation: fadeSlide .4s ease forwards; }
      `}</style>

      <div
        style={{
          ...S.page,
          background: hasNew
            ? 'linear-gradient(160deg, #1a0a2e 0%, #2d0a4e 50%, #0f172a 100%)'
            : 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        <div style={S.widgetWrap} className="fade-in">

          {/* ── رأس الصفحة ───────────────────────────────────────────────── */}
          <div style={S.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img src={LOGO_URL} alt="بلدي" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              <span style={S.headerTitle}>{data?.employeeName ?? 'وحدة بلدي'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                ...S.badge,
                background: data?.success ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)',
                color:       data?.success ? '#10b981' : '#f87171',
              }}>
                {data?.success ? '● متصل' : '● غير متصل'}
              </span>
              <button onClick={handleLogout} style={S.iconBtn} title="تسجيل الخروج">⏏️</button>
            </div>
          </div>

          {/* ── تنبيه البلاغات الجديدة ────────────────────────────────────── */}
          {hasNew && (
            <div style={S.alertBox} className="alert-pulse">
              🔔 لديك <strong>{stats.new}</strong> بلاغ جديد يحتاج إلى معالجة!
            </div>
          )}

          {/* ── بطاقات الإحصائيات ────────────────────────────────────────── */}
          <div style={S.statsGrid}>
            <StatCard label="الإجمالي"   value={stats.total}    color="#f8fafc" />
            <StatCard label="جديد 🔴"    value={stats.new}      color="#8b5cf6" />
            <StatCard label="غير محلول"  value={stats.unsolved}  color="#ef4444" />
            <StatCard label="تم الحل ✅" value={stats.solved}    color="#10b981" />
          </div>

          {/* ── صف ثانوي للإحصائيات ──────────────────────────────────────── */}
          <div style={{ ...S.statsGrid, gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <StatCard label="بانتظار"  value={stats.waiting}  color="#ec4899" small />
            <StatCard label="الوزارة"  value={stats.ministry} color="#f59e0b" small />
            <StatCard label="أخرى"     value={stats.other}    color="#64748b" small />
          </div>

          {/* ── آخر البلاغات ─────────────────────────────────────────────── */}
          <div style={S.sectionTitle}>🕒 آخر البلاغات</div>

          {(data?.latest ?? []).length === 0 ? (
            <div style={S.emptyText}>
              {data?.success ? 'لا توجد بلاغات مسجلة' : 'تعذر تحميل البيانات'}
            </div>
          ) : (
            (data?.latest ?? []).slice(0, 4).map((t, i) => (
              <div key={i} style={S.ticketRow}>
                <span style={S.ticketNum}>🎫 {t.number}</span>
                <span style={S.ticketType}>{t.type}</span>
                <span style={{
                  ...S.ticketBadge,
                  color:      STATUS_COLORS[t.status] ?? '#3b82f6',
                  background: `${STATUS_COLORS[t.status] ?? '#3b82f6'}22`,
                }}>
                  {t.status}
                </span>
              </div>
            ))
          )}

          {/* ── ذيل الصفحة ─────────────────────────────────────────────── */}
          <div style={S.footer}>
            <span style={{ color: '#475569', fontSize: '0.73rem' }}>
              {lastUpdate
                ? `آخر تحديث: ${lastUpdate.toLocaleTimeString('ar-SA')}`
                : 'جاري التحديث…'}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href="/" style={S.footerLink}>فتح النظام 🔗</a>
              <button
                style={S.iconBtn}
                onClick={() => { setLoading(true); fetchData(auth!).finally(() => setLoading(false)); }}
                disabled={loading}
                title="تحديث الآن"
              >
                {loading ? '⏳' : '🔄'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

// ─── مكوِّن بطاقة الإحصائية ──────────────────────────────────────────────────
function StatCard({
  label, value, color, small = false
}: { label: string; value: number; color: string; small?: boolean }) {
  return (
    <div style={{
      background:    'rgba(30,41,59,.75)',
      borderRadius:  '12px',
      padding:       small ? '0.55rem 0.4rem' : '0.8rem 0.5rem',
      textAlign:     'center',
      border:        '1px solid rgba(148,163,184,.1)',
      backdropFilter:'blur(8px)',
    }}>
      <div style={{ fontSize: small ? '1.25rem' : '1.6rem', fontWeight: 700, color, lineHeight: 1.15 }}>
        {value}
      </div>
      <div style={{ fontSize: small ? '0.65rem' : '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
        {label}
      </div>
    </div>
  );
}

// ─── الأنماط الثابتة ─────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight:      '100svh',
    background:     'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontFamily:     '"Segoe UI", system-ui, -apple-system, sans-serif',
    direction:      'rtl',
    padding:        '1rem',
  },
  loginCard: {
    background:     'rgba(15,23,42,.92)',
    borderRadius:   '22px',
    padding:        '2rem 1.5rem',
    width:          '100%',
    maxWidth:       '360px',
    textAlign:      'center',
    border:         '1px solid rgba(148,163,184,.12)',
    backdropFilter: 'blur(12px)',
    animation:      'fadeIn .4s ease',
  },
  logo:       { width:80, height:80, objectFit:'contain', marginBottom:'0.8rem' },
  appTitle:   { color:'#f1f5f9', fontSize:'1.1rem', fontWeight:700, margin:'0 0 .2rem' },
  appSub:     { color:'#64748b', fontSize:'0.82rem', margin:'0 0 1.4rem' },
  modeGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.9rem', marginTop:'0.5rem' },
  modeBtn: {
    background: 'rgba(15,23,42,.8)',
    border:      '1px solid rgba(99,102,241,.35)',
    borderRadius:'14px',
    padding:     '1.2rem 0.6rem',
    color:       '#f1f5f9',
    cursor:      'pointer',
    display:     'flex',
    flexDirection:'column',
    alignItems:  'center',
    gap:         '0.35rem',
    transition:  'border-color .2s',
  },
  modeBtnTitle:{ fontSize:'0.95rem', fontWeight:700 },
  modeBtnSub:  { fontSize:'0.73rem', color:'#94a3b8' },
  form:        { display:'flex', flexDirection:'column', gap:'0.75rem', textAlign:'right' },
  formTitle:   { color:'#f1f5f9', fontSize:'1rem', fontWeight:700, margin:'0 0 .4rem', textAlign:'center' },
  backBtn: {
    background: 'none', border:'none', color:'#94a3b8', cursor:'pointer',
    fontSize:'0.88rem', padding:0, textAlign:'right',
  },
  input: {
    background:  'rgba(15,23,42,.7)',
    border:      '1px solid rgba(148,163,184,.2)',
    borderRadius:'10px',
    padding:     '0.82rem 1rem',
    color:       '#f1f5f9',
    fontSize:    '1rem',
    width:       '100%',
    textAlign:   'left',
  },
  eyeBtn: {
    position:  'absolute',
    left:      '0.8rem',
    top:       '50%',
    transform: 'translateY(-50%)',
    background:'none',
    border:    'none',
    cursor:    'pointer',
    fontSize:  '1.1rem',
  },
  errText: {
    color:'#f87171', fontSize:'0.83rem',
    background:'rgba(239,68,68,.1)', borderRadius:'8px', padding:'0.5rem 0.7rem', margin:0,
  },
  submitBtn: {
    background:    'linear-gradient(135deg,#6366f1,#8b5cf6)',
    border:        'none',
    borderRadius:  '12px',
    padding:       '0.9rem',
    color:         '#fff',
    fontSize:      '1rem',
    fontWeight:    700,
    cursor:        'pointer',
    marginTop:     '0.3rem',
  },
  // ── ويدجت ──────────────────────────────────────────────────────────────────
  widgetWrap: { width:'100%', maxWidth:'420px', display:'flex', flexDirection:'column', gap:'0.7rem' },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'center' },
  headerTitle:{ color:'#f1f5f9', fontSize:'1.05rem', fontWeight:700 },
  badge: {
    fontSize:'0.73rem', fontWeight:700,
    padding:'3px 9px', borderRadius:'6px',
  },
  iconBtn: {
    background:'none', border:'none', cursor:'pointer',
    fontSize:'1.1rem', color:'#64748b', padding:'4px',
  },
  alertBox: {
    background:    'rgba(124,58,237,.25)',
    border:        '1px solid rgba(139,92,246,.5)',
    borderRadius:  '12px',
    padding:       '0.75rem 1rem',
    color:         '#c4b5fd',
    fontWeight:    600,
    fontSize:      '0.92rem',
    textAlign:     'center',
  },
  statsGrid:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.5rem' },
  sectionTitle:{ color:'#64748b', fontSize:'0.82rem', fontWeight:700, letterSpacing:'.01em' },
  emptyText:   { color:'#475569', fontSize:'0.85rem', textAlign:'center', padding:'0.8rem 0' },
  ticketRow: {
    display:      'flex',
    alignItems:   'center',
    gap:          '0.45rem',
    background:   'rgba(30,41,59,.7)',
    borderRadius: '10px',
    padding:      '0.6rem 0.75rem',
    border:       '1px solid rgba(148,163,184,.08)',
  },
  ticketNum:  { fontSize:'0.78rem', fontWeight:700, color:'#f1f5f9', minWidth:'78px', flexShrink:0 },
  ticketType: { fontSize:'0.76rem', color:'#cbd5e1', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  ticketBadge:{ fontSize:'0.68rem', fontWeight:700, padding:'2px 7px', borderRadius:'5px', whiteSpace:'nowrap', flexShrink:0 },
  footer:     { display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'0.2rem' },
  footerLink: { color:'#6366f1', fontSize:'0.8rem', textDecoration:'none', fontWeight:600 },
};
