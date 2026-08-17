'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './transfer.module.css';
import { EMPLOYEES, CATEGORIES } from '../../lib/employees';

// ─── ثوابت التخزين المحلي ──────────────────────────────────────────────────
const SESSION_KEY = 'balady_transfer_session';
const SETTINGS_KEY = 'balady_transfer_settings';
const LOGO_URL = '/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%A8%D9%84%D8%AF%D9%8A%20%D8%A7%D9%84%D8%B1%D8%B3%D9%85%D9%8A.png';

const DEFAULT_TEMPLATE = `📋 *تحويل بلاغ - وحدة بلدي*
━━━━━━━━━━━━━━━━━━
🔢 *رقم البلاغ:* {ticket}
👤 *المحوّل له:* {receiver}
📁 *التصنيف:* {category}
📅 *تاريخ البلاغ:* {date}
⏰ *وقت التحويل:* {time}
━━━━━━━━━━━━━━━━━━`;

interface Session { token: string; name: string; isAdmin: boolean; }
interface Settings { groupLink: string; template: string; }
interface Feedback { kind: 'ok' | 'warn' | 'err'; text: string; }

// ─── مساعدات التوقيت (الرياض UTC+3) ────────────────────────────────────────
function riyadhNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + (now.getTimezoneOffset() + 180) * 60000);
}
function riyadhDateStr(): string {
  return riyadhNow().toISOString().split('T')[0];
}
function riyadhTimeStr(): string {
  const d = riyadhNow();
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function buildMessage(tpl: string, v: Record<string, string>): string {
  return (tpl || DEFAULT_TEMPLATE)
    .replace(/\{ticket\}/g, v.ticket || '—')
    .replace(/\{receiver\}/g, v.receiver || '—')
    .replace(/\{category\}/g, v.category || '—')
    .replace(/\{date\}/g, v.date || '—')
    .replace(/\{time\}/g, v.time || '—');
}

export default function TransferClient() {
  // ── الجلسة والإعدادات ────────────────────────────────────────────────
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>({ groupLink: '', template: DEFAULT_TEMPLATE });
  const [showSettings, setShowSettings] = useState(false);

  // ── نموذج الدخول ─────────────────────────────────────────────────────
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginErr, setLoginErr] = useState('');

  // ── نموذج التحويل ────────────────────────────────────────────────────
  const [ticketNumber, setTicketNumber] = useState('');
  const [receiver, setReceiver] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(riyadhDateStr());

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [lastTransfer, setLastTransfer] = useState<Record<string, string> | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // ── تحميل الجلسة والإعدادات ──────────────────────────────────────────
  useEffect(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      if (s) setSession(JSON.parse(s));
      const st = localStorage.getItem(SETTINGS_KEY);
      if (st) setSettings({ ...{ groupLink: '', template: DEFAULT_TEMPLATE }, ...JSON.parse(st) });
    } catch { /* تجاهل بيانات تخزين تالفة */ }
    setReady(true);
  }, []);

  const saveSettings = (next: Settings) => {
    setSettings(next);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { }
  };

  // ── جلب آخر التحويلات ────────────────────────────────────────────────
  const loadHistory = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/transfer', { headers: { 'X-Transfer-Token': token }, cache: 'no-store' });
      const json = await res.json();
      if (json.success) setHistory(json.tickets || []);
    } catch { /* أخطاء الشبكة المؤقتة لا تُعرض */ }
  }, []);

  useEffect(() => {
    if (session?.token) loadHistory(session.token);
  }, [session, loadHistory]);

  // ── تسجيل الدخول ─────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr('');
    setBusy(true);
    try {
      const res = await fetch('/api/transfer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      const json = await res.json();
      if (!json.success) {
        setLoginErr(json.error || 'بيانات الدخول غير صحيحة');
        return;
      }
      const next: Session = { token: json.token, name: json.name, isAdmin: json.isAdmin };
      setSession(next);
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      // ملء اسم المحوَّل له افتراضياً بالمستخدم نفسه لتسريع الاستخدام
      const me = EMPLOYEES.find((emp) => emp.name === json.name);
      if (me) setReceiver(me.username);
    } catch {
      setLoginErr('تعذر الاتصال بالخادم');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setPassword('');
  };

  // ── الموظف الذي عليه الدور ───────────────────────────────────────────
  const pickNext = async () => {
    if (!session) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/transfer/next?token=${encodeURIComponent(session.token)}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setReceiver(json.next.username);
        setFeedback({ kind: 'ok', text: `🎲 الدور الحالي على: ${json.next.name}` });
      } else {
        setFeedback({ kind: 'warn', text: json.error || 'تعذر حساب الدور' });
      }
    } catch {
      setFeedback({ kind: 'err', text: 'تعذر الاتصال بالخادم' });
    } finally {
      setBusy(false);
    }
  };

  // ── تسجيل التحويل ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const ticket = ticketNumber.trim().toUpperCase();
    const emp = EMPLOYEES.find((x) => x.username === receiver);

    if (!/^IM\d{4,12}$/.test(ticket)) {
      setFeedback({ kind: 'err', text: '❌ رقم البلاغ غير صحيح (المتوقع مثل IM12345678)' });
      return;
    }
    if (!emp) {
      setFeedback({ kind: 'err', text: '❌ اختر اسم المحوَّل له' });
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Transfer-Token': session.token },
        body: JSON.stringify({
          ticketNumber: ticket,
          receiver: emp.name,
          category: category || 'أخرى',
          date,
          template: settings.template,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setFeedback({ kind: 'err', text: `❌ ${json.error || 'تعذر حفظ التحويل'}` });
        return;
      }

      const record = {
        ticket,
        receiver: json.transfer?.receiver || emp.name,
        category: json.transfer?.category || category || 'أخرى',
        date: json.transfer?.date || date,
        time: json.transfer?.time || riyadhTimeStr(),
      };
      setLastTransfer(record);

      setFeedback(
        json.duplicate
          ? { kind: 'warn', text: `⚠️ ${json.message}` }
          : { kind: 'ok', text: `✅ تم تسجيل البلاغ ${ticket} باسم ${record.receiver} — وقت التحويل ${record.time}` }
      );

      if (!json.duplicate) setTicketNumber('');
      loadHistory(session.token);
    } catch {
      setFeedback({ kind: 'err', text: '❌ تعذر الاتصال بالخادم' });
    } finally {
      setBusy(false);
    }
  };

  // ── إرسال النموذج المرجعي للمجموعة ───────────────────────────────────
  const sendToGroup = () => {
    const record = lastTransfer || {
      ticket: ticketNumber.trim().toUpperCase(),
      receiver: EMPLOYEES.find((x) => x.username === receiver)?.name || '',
      category: category || 'أخرى',
      date,
      time: riyadhTimeStr(),
    };
    const msg = buildMessage(settings.template, record);
    const link = settings.groupLink.trim();
    const url = link
      ? `${link}${link.includes('?') ? '&' : '?'}text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // ═══════════════════════════════════════════════════════════════════════
  if (!ready) {
    return (
      <div className={styles.app}>
        <div className={styles.shell}>
          <p className={styles.muted}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // ── شاشة الدخول ──────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className={styles.app}>
        <div className={styles.shell}>
          <div className={styles.header}>
            <div className={styles.brand}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_URL} alt="شعار بلدي" className={styles.logo} />
              <div>
                <h1>تحويل البلاغات</h1>
                <span>وحدة بلدي — الدعم الفني</span>
              </div>
            </div>
          </div>

          <form className={styles.card} onSubmit={handleLogin}>
            <p className={styles.cardTitle}>🔐 تسجيل الدخول</p>
            <label className={styles.label}>اسم المستخدم</label>
            <input
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثال: mialrubaish"
              autoCapitalize="off"
              autoCorrect="off"
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
            <label className={styles.label}>كلمة المرور</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
            {loginErr && <div className={`${styles.alert} ${styles.alertErr}`}>{loginErr}</div>}
            <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy} type="submit">
              {busy ? '⏳ جاري التحقق...' : '➡️ دخول'}
            </button>
          </form>

          <p className={styles.muted}>
            تطبيق مخصّص لتحويل البلاغات من الجوال. بيانات الدخول هي نفسها المستخدمة في ويدجت البلاغات.
          </p>
        </div>
      </div>
    );
  }

  // ── الشاشة الرئيسية ──────────────────────────────────────────────────
  return (
    <div className={styles.app}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <div className={styles.brand}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="شعار بلدي" className={styles.logo} />
            <div>
              <h1>تحويل البلاغات</h1>
              <span>👤 {session.name}</span>
            </div>
          </div>
          <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={handleLogout}>
            خروج
          </button>
        </div>

        {/* ── نموذج التحويل ── */}
        <form className={styles.card} onSubmit={handleSubmit}>
          <p className={styles.cardTitle}>📝 بيانات التحويل</p>

          <label className={styles.label}>رقم البلاغ</label>
          <input
            className={`${styles.input} ${styles.ticketInput}`}
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            placeholder="IM12345678"
            autoCapitalize="characters"
            autoCorrect="off"
            inputMode="text"
          />

          <label className={styles.label}>اسم المحوَّل له</label>
          <select className={styles.select} value={receiver} onChange={(e) => setReceiver(e.target.value)}>
            <option value="">— اختر الموظف —</option>
            {EMPLOYEES.map((emp) => (
              <option key={emp.key} value={emp.username}>{emp.name}</option>
            ))}
          </select>

          <button type="button" className={`${styles.btn} ${styles.btnDashed}`} onClick={pickNext} disabled={busy}>
            🎲 اختيار الموظف الذي عليه الدور
          </button>

          <label className={styles.label}>تصنيف البلاغ</label>
          <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">— اختر التصنيف —</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className={styles.row}>
            <div>
              <label className={styles.label}>تاريخ البلاغ</label>
              <input
                className={styles.input}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className={styles.label}>وقت التحويل</label>
              <input className={styles.input} value={`${riyadhTimeStr()} (تلقائي)`} readOnly />
            </div>
          </div>

          {feedback && (
            <div
              className={`${styles.alert} ${
                feedback.kind === 'ok' ? styles.alertOk : feedback.kind === 'warn' ? styles.alertWarn : styles.alertErr
              }`}
            >
              {feedback.text}
            </div>
          )}

          <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy} type="submit">
            {busy ? '⏳ جاري الحفظ...' : '💾 تسجيل التحويل بالموقع'}
          </button>

          <div style={{ height: 8 }} />

          <button type="button" className={`${styles.btn} ${styles.btnWhatsapp}`} onClick={sendToGroup}>
            💬 إرسال النموذج للمجموعة
          </button>
        </form>

        {/* ── تنفيذ التحويل داخل منصة داعم ── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>🏛️ التحويل داخل منصة داعم</p>
          <p className={styles.muted}>
            افتح البلاغ في منصة داعم من متصفح الجوال، ثم شغّل أداة «تحويل بلاغ» لتعبئة المعين له والحفظ والخروج تلقائياً.
          </p>
          <div className={styles.linkRow}>
            <Link href="/transfer/setup" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>
              ⚙️ تركيب الأداة على الجوال
            </Link>
            <a
              href="https://daem.momah.gov.sa"
              target="_blank"
              rel="noreferrer"
              className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
            >
              🔗 فتح منصة داعم
            </a>
          </div>
        </div>

        {/* ── الإعدادات ── */}
        <div className={styles.card}>
          <p className={styles.cardTitle} onClick={() => setShowSettings(!showSettings)} style={{ cursor: 'pointer' }}>
            ⚙️ الإعدادات {showSettings ? '▲' : '▼'}
          </p>
          {showSettings && (
            <>
              <label className={styles.label}>رابط مجموعة الواتساب (اختياري)</label>
              <input
                className={styles.input}
                value={settings.groupLink}
                onChange={(e) => saveSettings({ ...settings, groupLink: e.target.value })}
                placeholder="https://chat.whatsapp.com/... أو https://wa.me/9665xxxxxxxx"
                style={{ direction: 'ltr', textAlign: 'left', fontSize: 13 }}
              />
              <p className={styles.muted} style={{ marginBottom: 10 }}>
                💡 روابط دعوة المجموعات لا تقبل نصاً جاهزاً. للحصول على أفضل نتيجة ضع رقم جوالك بصيغة
                {' '}<span style={{ direction: 'ltr', display: 'inline-block' }}>https://wa.me/9665xxxxxxxx</span>{' '}
                لتصلك الرسالة أولاً ثم تعيد توجيهها للمجموعة، أو اتركه فارغاً ليفتح الواتساب ويطلب منك اختيار المجموعة.
              </p>

              <label className={styles.label}>قالب رسالة التسجيل</label>
              <textarea
                className={styles.input}
                rows={9}
                value={settings.template}
                onChange={(e) => saveSettings({ ...settings, template: e.target.value })}
                style={{ fontSize: 13, lineHeight: 1.8 }}
              />
              <p className={styles.muted}>
                المتغيرات المتاحة: {'{ticket}'} {'{receiver}'} {'{category}'} {'{date}'} {'{time}'}
              </p>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => saveSettings({ ...settings, template: DEFAULT_TEMPLATE })}
                type="button"
              >
                ♻️ استعادة القالب الافتراضي
              </button>
            </>
          )}
        </div>

        {/* ── آخر التحويلات ── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>🗂️ آخر البلاغات المسجّلة</p>
          {history.length === 0 && <p className={styles.muted}>لا توجد بيانات بعد.</p>}
          {history.map((t) => (
            <div key={t.id} className={styles.logItem}>
              <span className={styles.logNum}>{t.ticket_number}</span>
              <span className={styles.logMeta}>
                {t.receiver} • {t.category_type}
              </span>
            </div>
          ))}
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => session && loadHistory(session.token)}
          >
            🔄 تحديث
          </button>
        </div>

        <p className={styles.muted} style={{ textAlign: 'center' }}>
          <Link href="/" style={{ color: '#94a3b8' }}>العودة للوحة التحكم</Link>
        </p>
      </div>
    </div>
  );
}
