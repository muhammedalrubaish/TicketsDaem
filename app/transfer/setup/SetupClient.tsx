'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../transfer.module.css';

const SESSION_KEY = 'balady_transfer_session';
const SETTINGS_KEY = 'balady_transfer_settings';

export default function SetupClient() {
  const [token, setToken] = useState('');
  const [name, setName] = useState('');
  const [groupLink, setGroupLink] = useState('');
  const [base, setBase] = useState('');
  const [embedded, setEmbedded] = useState('');
  const [loadingEmbedded, setLoadingEmbedded] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    setBase(window.location.origin);
    try {
      const s = localStorage.getItem(SESSION_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        setToken(parsed.token || '');
        setName(parsed.name || '');
      }
      const st = localStorage.getItem(SETTINGS_KEY);
      if (st) setGroupLink(JSON.parse(st).groupLink || '');
    } catch { /* تجاهل بيانات تخزين تالفة */ }
  }, []);

  // الإعدادات التي تُحقن مع السكربت داخل صفحة داعم
  const cfgLine = `window.__BALADY_TRANSFER_CFG__={base:${JSON.stringify(base)},token:${JSON.stringify(
    token
  )},group:${JSON.stringify(groupLink)}};`;

  // ① النسخة الخفيفة: تُحمّل السكربت من الموقع (تبقى محدّثة دائماً)
  const loaderBookmarklet =
    'javascript:' +
    encodeURIComponent(
      `(function(){${cfgLine}var s=document.createElement('script');s.src='${base}/daem-mobile.js?v='+Date.now();s.onerror=function(){alert('تعذر تحميل الأداة من الموقع. استخدم النسخة المدمجة.');};(document.body||document.documentElement).appendChild(s);})()`
    );

  // ② النسخة المدمجة: السكربت كاملاً داخل الرابط (تعمل حتى لو منعت الصفحة التحميل الخارجي)
  const buildEmbedded = async () => {
    setLoadingEmbedded(true);
    try {
      const res = await fetch('/daem-mobile.js', { cache: 'no-store' });
      const code = await res.text();
      setEmbedded('javascript:' + encodeURIComponent(`(function(){${cfgLine}${code}})()`));
    } catch {
      setEmbedded('');
      alert('تعذر تجهيز النسخة المدمجة. تأكد من الاتصال بالإنترنت.');
    } finally {
      setLoadingEmbedded(false);
    }
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 2500);
    } catch {
      alert('تعذر النسخ تلقائياً. اضغط مطولاً على الكود لنسخه يدوياً.');
    }
  };

  if (!token) {
    return (
      <div className={styles.app}>
        <div className={styles.shell}>
          <div className={styles.card}>
            <p className={styles.cardTitle}>🔐 مطلوب تسجيل الدخول</p>
            <p className={styles.muted}>
              يجب تسجيل الدخول في التطبيق أولاً ليتم تضمين رمز الدخول داخل الأداة.
            </p>
            <Link href="/transfer" className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginTop: 10 }}>
              ➡️ الذهاب لتسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <div>
              <h1>⚙️ تركيب أداة داعم</h1>
              <span>👤 {name}</span>
            </div>
          </div>
          <Link href="/transfer" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>
            رجوع
          </Link>
        </div>

        {/* ── ما هي الأداة ── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>💡 ما هي الأداة؟</p>
          <p className={styles.muted}>
            متصفحات الجوال لا تدعم إضافات كروم، لذلك نستخدم «إشارة مرجعية تنفيذية» (Bookmarklet).
            تحفظها مرة واحدة في المفضلة، وعند فتح أي بلاغ في منصة داعم من جوالك تشغّلها فتظهر لوحة عربية
            تختار منها المحوَّل له، ثم تعبّئ حقل «المعين له» وتسجّل البلاغ بالموقع وتضغط «حفظ وخروج» تلقائياً.
          </p>
        </div>

        {/* ── النسخة الخفيفة ── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>① النسخة الخفيفة (مستحسنة)</p>
          <p className={styles.muted}>
            رابط قصير يجلب الأداة من الموقع، فتبقى محدّثة تلقائياً مع كل تحسين.
          </p>
          <div className={styles.codeBox} style={{ marginTop: 8 }}>{loaderBookmarklet}</div>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ marginTop: 9 }}
            onClick={() => copy(loaderBookmarklet, 'light')}
          >
            {copied === 'light' ? '✅ تم النسخ' : '📋 نسخ الكود'}
          </button>
        </div>

        {/* ── النسخة المدمجة ── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>② النسخة المدمجة (احتياطية)</p>
          <p className={styles.muted}>
            تحتوي على الأداة كاملة داخل الرابط، فتعمل حتى لو منعت سياسة أمان منصة داعم تحميل ملفات خارجية.
            استخدمها إذا لم تعمل النسخة الخفيفة.
          </p>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            style={{ marginTop: 9 }}
            onClick={buildEmbedded}
            disabled={loadingEmbedded}
          >
            {loadingEmbedded ? '⏳ جاري التجهيز...' : '🧩 تجهيز النسخة المدمجة'}
          </button>
          {embedded && (
            <>
              <div className={styles.codeBox} style={{ marginTop: 9 }}>{embedded.slice(0, 300)}…</div>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ marginTop: 9 }}
                onClick={() => copy(embedded, 'full')}
              >
                {copied === 'full' ? '✅ تم النسخ' : '📋 نسخ الكود كاملاً'}
              </button>
            </>
          )}
        </div>

        {/* ── خطوات الآيفون ── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>📱 التركيب على الآيفون (Safari)</p>
          <ol className={styles.steps}>
            <li>انسخ الكود من الأعلى.</li>
            <li>افتح Safari وأضف أي صفحة للمفضلة (زر المشاركة ← «إضافة إشارة مرجعية») وسمّها «تحويل بلاغ».</li>
            <li>افتح المفضلة ← اضغط «تحرير» ← اختر «تحويل بلاغ».</li>
            <li>امسح العنوان القديم بالكامل والصق الكود المنسوخ مكانه ثم احفظ.</li>
            <li>افتح بلاغ داعم، ثم افتح المفضلة واضغط «تحويل بلاغ» فتظهر اللوحة.</li>
          </ol>
        </div>

        {/* ── خطوات الأندرويد ── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>🤖 التركيب على الأندرويد</p>
          <ol className={styles.steps}>
            <li>الأفضل: متصفح <b>Kiwi Browser</b> أو <b>Firefox</b> — يدعمان تثبيت إضافة «Daem Plus» الأصلية مباشرة.</li>
            <li>بديل: في Chrome أضف الصفحة للإشارات المرجعية، ثم عدّل رابطها وضع الكود المنسوخ، وسمّها اختصاراً مثل <b>tt</b>.</li>
            <li>عند فتح بلاغ داعم اكتب <b>tt</b> في شريط العنوان واختر الإشارة المرجعية لتشغيل الأداة.</li>
          </ol>
        </div>

        {/* ── ملاحظات ── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>⚠️ ملاحظات مهمة</p>
          <ul className={styles.steps}>
            <li>الرمز داخل الكود شخصي — لا تشاركه مع أحد.</li>
            <li>عند تغيير كلمة المرور أعد تسجيل الدخول وأعد نسخ الكود.</li>
            <li>إن لم يُعثر على حقل «المعين له» ستخبرك اللوحة، وتستطيع إدخاله يدوياً مع بقاء التسجيل بالموقع يعمل.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
