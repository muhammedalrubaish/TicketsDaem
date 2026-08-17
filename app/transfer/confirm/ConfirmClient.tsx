'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from '../transfer.module.css';

const SESSION_KEY = 'balady_transfer_session';
const SETTINGS_KEY = 'balady_transfer_settings';

/**
 * صفحة التأكيد الاحتياطية
 * ------------------------
 * تُفتح من أداة داعم عندما تمنع سياسة أمان صفحة المنصة إرسال الطلب مباشرة،
 * فيتم إتمام الحفظ من نطاق الموقع نفسه.
 */
export default function ConfirmClient() {
  const params = useSearchParams();
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const started = useRef(false);

  const ticket = (params.get('t') || '').toUpperCase();
  const receiver = params.get('r') || '';
  const category = params.get('c') || '';
  const date = params.get('d') || '';

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const save = async () => {
      let session: any = null;
      let template = '';
      try {
        session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
        template = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}').template || '';
      } catch { /* تجاهل بيانات تخزين تالفة */ }

      if (!session?.token) {
        setState('error');
        setMessage('لم يتم العثور على جلسة — سجّل الدخول أولاً ثم أعد المحاولة.');
        return;
      }
      if (!ticket) {
        setState('error');
        setMessage('لا يوجد رقم بلاغ في الرابط.');
        return;
      }

      setState('saving');
      try {
        const res = await fetch('/api/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Transfer-Token': session.token },
          body: JSON.stringify({ ticketNumber: ticket, receiver, category, date, template }),
        });
        const json = await res.json();

        if (json.success) {
          setState('done');
          setMessage(json.duplicate ? json.message : `تم تسجيل البلاغ ${ticket} باسم ${receiver} بنجاح.`);
          setWaMessage(json.whatsappMessage || '');
        } else {
          setState('error');
          setMessage(json.error || 'تعذر حفظ التحويل.');
        }
      } catch {
        setState('error');
        setMessage('تعذر الاتصال بالخادم.');
      }
    };

    save();
  }, [ticket, receiver, category, date]);

  const sendToGroup = () => {
    let groupLink = '';
    try {
      groupLink = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}').groupLink || '';
    } catch { /* تجاهل */ }
    const url = groupLink
      ? `${groupLink}${groupLink.includes('?') ? '&' : '?'}text=${encodeURIComponent(waMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div className={styles.app}>
      <div className={styles.shell}>
        <div className={styles.card}>
          <p className={styles.cardTitle}>📥 تأكيد تسجيل التحويل</p>

          <div className={styles.logItem}>
            <span className={styles.logNum}>{ticket || '—'}</span>
            <span className={styles.logMeta}>{receiver || '—'}</span>
          </div>
          <div className={styles.logItem}>
            <span className={styles.logMeta}>📁 {category || 'غير محدد'}</span>
            <span className={styles.logMeta}>📅 {date || '—'}</span>
          </div>

          {state === 'saving' && <p className={styles.muted}>⏳ جاري الحفظ...</p>}
          {state === 'done' && <div className={`${styles.alert} ${styles.alertOk}`}>✅ {message}</div>}
          {state === 'error' && <div className={`${styles.alert} ${styles.alertErr}`}>❌ {message}</div>}

          {state === 'done' && waMessage && (
            <button className={`${styles.btn} ${styles.btnWhatsapp}`} onClick={sendToGroup}>
              💬 إرسال النموذج للمجموعة
            </button>
          )}

          <div style={{ height: 8 }} />
          <Link href="/transfer" className={`${styles.btn} ${styles.btnGhost}`}>
            ↩️ العودة للتطبيق
          </Link>
        </div>
      </div>
    </div>
  );
}
