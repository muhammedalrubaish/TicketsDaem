'use client';

import { useState } from 'react';

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

const BASE = 'https://tickets-daem.vercel.app';

export default function WidgetSetup() {
  const [mode, setMode]         = useState<'admin' | 'employee'>('employee');
  const [selectedEmp, setEmp]   = useState(EMPLOYEES[0]);
  const [adminPass, setAdminPass] = useState('');
  const [result, setResult]     = useState('');
  const [imgUrl, setImgUrl]     = useState('');
  const [copied, setCopied]     = useState(false);

  const generate = () => {
    let raw = '';
    if (mode === 'admin') {
      raw = `admin:admin:${adminPass}`;
    } else {
      raw = `employee:${selectedEmp.user}:${selectedEmp.pass}`;
    }
    const encoded = btoa(unescape(encodeURIComponent(raw)));
    const url = `${BASE}/api/widget-image?auth=${encoded}`;
    setResult(encoded);
    setImgUrl(url);
    setCopied(false);
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <h1 style={S.title}>⚙️ إعداد ويدجت الشاشة الرئيسية</h1>
        <p style={S.sub}>أنشئ رابطاً مشفراً خاصاً بكل موظف لاستخدامه في تطبيق الويدجت</p>

        {/* نوع الدخول */}
        <div style={S.row}>
          {(['employee', 'admin'] as const).map(m => (
            <button
              key={m}
              style={{ ...S.tab, ...(mode === m ? S.tabActive : {}) }}
              onClick={() => setMode(m)}
            >
              {m === 'employee' ? '👨‍💼 موظف' : '👁️ مشرف'}
            </button>
          ))}
        </div>

        {mode === 'employee' ? (
          <select
            style={S.select}
            value={selectedEmp.user}
            onChange={e => setEmp(EMPLOYEES.find(em => em.user === e.target.value)!)}
          >
            {EMPLOYEES.map(em => (
              <option key={em.user} value={em.user}>{em.name}</option>
            ))}
          </select>
        ) : (
          <input
            style={S.input}
            type="password"
            placeholder="كلمة مرور المشرف"
            value={adminPass}
            onChange={e => setAdminPass(e.target.value)}
            dir="ltr"
          />
        )}

        <button style={S.btn} onClick={generate}>
          🔗 توليد رابط الويدجت
        </button>

        {imgUrl && (
          <div style={S.resultBox}>
            <p style={S.label}>🖼️ رابط صورة الويدجت (للنسخ في KWGT أو Automate):</p>
            <div style={S.urlRow}>
              <code style={S.url}>{imgUrl}</code>
              <button style={S.copy} onClick={() => copy(imgUrl)}>
                {copied ? '✅' : '📋'}
              </button>
            </div>

            {/* معاينة الصورة */}
            <p style={S.label}>👀 معاينة الويدجت:</p>
            <img
              src={imgUrl}
              alt="معاينة الويدجت"
              style={{ width: '100%', borderRadius: '12px', border: '1px solid #334155' }}
              onError={e => (e.currentTarget.style.display = 'none')}
            />

            {/* تعليمات KWGT */}
            <details style={S.details}>
              <summary style={S.summary}>📱 طريقة الإعداد — KWGT Pro (الأفضل)</summary>
              <ol style={S.ol}>
                <li>حمّل تطبيق <strong>KWGT Kustom Widget Maker</strong> من Play Store</li>
                <li>افتح KWGT وأنشئ ويدجت جديد → اختر حجم 4×2</li>
                <li>اضغط <strong>+</strong> ثم اختر <strong>Image (صورة)</strong></li>
                <li>في خاصية Source اكتب الصيغة:<br/><code style={{fontSize:'0.75rem', color:'#8b5cf6', wordBreak:'break-all'}}>{'$bi(http,"'}{imgUrl}{'")$'}</code></li>
                <li>اضغط Save وأضف الويدجت للشاشة الرئيسية</li>
                <li>في إعدادات KWGT فعّل <strong>Auto Refresh</strong> كل 30 دقيقة</li>
              </ol>
            </details>

            {/* تعليمات Automate */}
            <details style={S.details}>
              <summary style={S.summary}>🤖 طريقة الإعداد — Automate (مجاني)</summary>
              <ol style={S.ol}>
                <li>حمّل تطبيق <strong>Automate by LlamaLab</strong> من Play Store (مجاني)</li>
                <li>أنشئ Flow جديد</li>
                <li>أضف بلوك <strong>Periodically</strong> → كل 30 دقيقة</li>
                <li>أضف بلوك <strong>HTTP request</strong> → POST إلى:<br/>
                  <code style={{fontSize:'0.75rem', color:'#8b5cf6', wordBreak:'break-all'}}>{BASE}/api/widget-employee</code><br/>
                  Body: <code style={{fontSize:'0.75rem'}}>{'{"mode":"'}{mode}{'","username":"'}{mode==='employee'?selectedEmp.user:'admin'}{'","password":"***"}'}</code>
                </li>
                <li>أضف بلوك <strong>JSON decode</strong> لاستخراج <code>stats.new</code></li>
                <li>أضف بلوك <strong>Widget notification</strong> لعرض البيانات</li>
                <li>أضف بلوك <strong>Notification show</strong> عند وجود بلاغات جديدة</li>
              </ol>
            </details>

            {/* الرابط البديل (صفحة الويدجت) */}
            <details style={S.details}>
              <summary style={S.summary}>🌐 بديل مجاني — صفحة الويدجت (PWA)</summary>
              <p style={{color:'#94a3b8', fontSize:'0.85rem', margin:'8px 0'}}>
                افتح الرابط التالي في Chrome ثم اضغط «إضافة للشاشة الرئيسية»:<br/>
                <code style={{color:'#6366f1', wordBreak:'break-all'}}>{BASE}/mobile-widget</code><br/>
                يفتح مباشرة بدون شريط متصفح ويعمل كتطبيق.
              </p>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif', direction: 'rtl',
  },
  card: {
    background: 'rgba(30,41,59,0.9)', borderRadius: '20px',
    padding: '2rem', width: '100%', maxWidth: '560px',
    border: '1px solid rgba(148,163,184,0.1)',
    display: 'flex', flexDirection: 'column', gap: '1rem',
  },
  title: { color: '#f1f5f9', fontSize: '1.3rem', fontWeight: 700, margin: 0 },
  sub:   { color: '#94a3b8', fontSize: '0.88rem', margin: 0 },
  row:   { display: 'flex', gap: '0.5rem' },
  tab: {
    flex: 1, padding: '0.6rem', borderRadius: '8px', cursor: 'pointer',
    background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(148,163,184,0.2)',
    color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem',
  },
  tabActive: { background: 'rgba(99,102,241,0.2)', borderColor: '#6366f1', color: '#a5b4fc' },
  select: {
    background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: '10px', padding: '0.75rem 1rem', color: '#f1f5f9',
    fontSize: '1rem', width: '100%',
  },
  input: {
    background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: '10px', padding: '0.75rem 1rem', color: '#f1f5f9',
    fontSize: '1rem', width: '100%', boxSizing: 'border-box',
  },
  btn: {
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    border: 'none', borderRadius: '10px', padding: '0.85rem',
    color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
  },
  resultBox: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  label:  { color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600, margin: 0 },
  urlRow: { display: 'flex', gap: '0.5rem', alignItems: 'flex-start' },
  url: {
    flex: 1, background: 'rgba(15,23,42,0.8)', color: '#818cf8',
    padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem',
    wordBreak: 'break-all', direction: 'ltr', textAlign: 'left',
  },
  copy: {
    background: 'rgba(99,102,241,0.2)', border: '1px solid #6366f1',
    borderRadius: '8px', padding: '0.5rem 0.7rem', cursor: 'pointer',
    fontSize: '1rem', flexShrink: 0,
  },
  details: {
    background: 'rgba(15,23,42,0.5)', borderRadius: '10px',
    border: '1px solid rgba(148,163,184,0.1)', overflow: 'hidden',
  },
  summary: {
    padding: '0.75rem 1rem', color: '#cbd5e1', fontSize: '0.88rem',
    fontWeight: 600, cursor: 'pointer', listStyle: 'none',
  },
  ol: { color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.8, margin: '0 0 1rem', paddingRight: '1.5rem' },
};
