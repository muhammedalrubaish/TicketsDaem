'use client';

import React, { useEffect, useState } from 'react';

const DEFAULT_TEMPLATE = `*{greeting} ⛅*

معك {name}
من الدعم الفني - وحدة بلدي
لديك تذكرة رقم ({ticket})

*ّنص البلاغ:ّ*
{report}

*كرماً صورة او فيديو للخطأ 👍🏻⏱️*`;

export default function WhatsappPopupPage() {
  const [empName, setEmpName] = useState<string>('محمد');
  const [msgTemplate, setMsgTemplate] = useState<string>(DEFAULT_TEMPLATE);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [ticketNumber, setTicketNumber] = useState<string>('');
  const [reportText, setReportText] = useState<string>('');
  
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // تحميل الإعدادات من التخزين المحلي والتحقق من الإصدار
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('balady_whatsapp_empName');
      const savedTemplate = localStorage.getItem('balady_whatsapp_template');
      if (savedName) setEmpName(savedName);
      if (savedTemplate) setMsgTemplate(savedTemplate);

      // التحقق من إصدار الإضافة ومقارنته بالإصدار الأخير
      const urlParams = new URLSearchParams(window.location.search);
      const extVersion = urlParams.get('v');
      const latestVersion = "2.2"; // رقم أحدث إصدار متاح للإضافة حالياً

      if (extVersion && parseFloat(extVersion) < parseFloat(latestVersion)) {
        window.parent.postMessage({ action: 'UPDATE_AVAILABLE' }, '*');
      }

      // طلب الإعدادات الرسمية المخزنة في كروم لمواجهة تصفير localStorage اليومي
      window.parent.postMessage({ action: 'GET_SETTINGS' }, '*');
    }

    // الاستماع للرسائل الواردة من نافذة الإضافة الأصلية (Parent Window)
    const handleMessage = (event: MessageEvent) => {
      if (event.data) {
        if (event.data.action === 'EXTRACTED_DATA') {
          const { ticketNumber, reportText, phoneNumber } = event.data.data || {};
          if (ticketNumber) setTicketNumber(ticketNumber);
          if (reportText) setReportText(reportText);
          if (phoneNumber) setPhoneNumber(formatPhone(phoneNumber));
          
          if (ticketNumber || reportText || phoneNumber) {
            showToast('تم سحب البيانات بنجاح! ⚡');
          } else {
            showToast('لم يتم العثور على بيانات. تأكد من أنك في صفحة البلاغ! ⚠️');
          }
        } else if (event.data.action === 'SETTINGS_DATA') {
          const { empName: extName, msgTemplate: extTemplate } = event.data.data || {};
          if (extName) {
            setEmpName(extName);
            localStorage.setItem('balady_whatsapp_empName', extName);
          }
          if (extTemplate) {
            setMsgTemplate(extTemplate);
            localStorage.setItem('balady_whatsapp_template', extTemplate);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('balady_whatsapp_empName', empName);
    localStorage.setItem('balady_whatsapp_template', msgTemplate);
    // إرسال الإعدادات ليتم تخزينها دائماً في chrome.storage.local
    window.parent.postMessage({
      action: 'SAVE_SETTINGS',
      data: { empName, msgTemplate }
    }, '*');
    showToast('تم حفظ الإعدادات بنجاح! 💾');
    setShowSettings(false);
  };

  const handleExtractData = () => {
    // إخطار النافذة الأب (الإضافة) لبدء سحب البيانات
    window.parent.postMessage({ action: 'EXTRACT_DATA' }, '*');
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    return hours < 12 ? 'السلام عليكم، صباح الخير' : 'السلام عليكم، مساء الخير';
  };

  const formatPhone = (phone: string) => {
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('05')) p = '966' + p.substring(1);
    if (p.length === 9) p = '966' + p;
    return p;
  };

  const cleanPhone = (phone: string) => {
    return phone.replace(/\D/g, '');
  };

  const handleSendToWhatsapp = () => {
    if (!phoneNumber) {
      showToast('يرجى إدخال رقم الجوال! ⚠️');
      return;
    }

    const greeting = getGreeting();
    let message = msgTemplate
      .replace(/{greeting}/g, greeting)
      .replace(/{name}/g, empName)
      .replace(/{ticket}/g, ticketNumber)
      .replace(/{report}/g, reportText);

    // نسخ الرسالة للحافظة أيضاً لتسهيل اللصق اليدوي إذا لزم الأمر
    navigator.clipboard.writeText(message).catch(() => {});

    const encodedMsg = encodeURIComponent(message);
    const url = `https://web.whatsapp.com/send?phone=${cleanPhone(phoneNumber)}&text=${encodedMsg}`;

    // إرسال رسالة للأب (popup.js) ليتعامل مع التبويب أو يفتح تبويب جديد
    window.parent.postMessage({ action: 'OPEN_WHATSAPP', url: url }, '*');
  };

  return (
    <div className="popup-container">
      <style>{`
        /* Reset and container styles */
        html, body {
          background: #0f172a !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          height: 100% !important;
        }

        .popup-container {
          background: #0f172a !important;
          color: #f8fafc !important;
          font-family: 'Cairo', sans-serif !important;
          margin: 0 !important;
          padding: 12px !important;
          width: 100% !important;
          height: 100vh !important;
          box-sizing: border-box !important;
          direction: rtl !important;
          display: flex !important;
          flex-direction: column !important;
          overflow-y: auto !important;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 4px !important;
        }
        ::-webkit-scrollbar-track {
          background: #0f172a !important;
        }
        ::-webkit-scrollbar-thumb {
          background: #334155 !important;
          border-radius: 4px !important;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #10b981 !important;
        }

        header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          padding-bottom: 8px !important;
          margin-bottom: 10px !important;
        }

        .logo {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }

        .logo-img {
          width: 28px !important;
          height: 28px !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3) !important;
          border: 1.5px solid #10b981 !important;
        }

        h1 {
          font-size: 13px !important;
          font-weight: 700 !important;
          color: #10b981 !important;
          margin: 0 !important;
        }

        .settings-btn {
          background: transparent !important;
          border: none !important;
          color: #94a3b8 !important;
          cursor: pointer !important;
          padding: 4px !important;
          border-radius: 6px !important;
          transition: all 0.2s !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .settings-btn:hover {
          color: #10b981 !important;
          background: rgba(255, 255, 255, 0.05) !important;
          transform: rotate(30deg) !important;
        }

        .input-group {
          margin-bottom: 10px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 4px !important;
        }

        label {
          font-size: 11px !important;
          font-weight: 600 !important;
          color: #94a3b8 !important;
        }

        input[type="text"], textarea {
          width: 100% !important;
          padding: 8px 10px !important;
          border-radius: 8px !important;
          border: 1px solid #334155 !important;
          background-color: #1e293b !important;
          color: white !important;
          font-family: 'Cairo', sans-serif !important;
          font-size: 11px !important;
          outline: none !important;
          box-sizing: border-box !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
          direction: rtl !important;
          text-align: right !important;
        }

        input[type="text"]:focus, textarea:focus {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2) !important;
        }

        .actions {
          display: flex !important;
          gap: 8px !important;
          margin-top: 6px !important;
        }

        button.btn-action {
          flex: 1 !important;
          padding: 10px !important;
          border-radius: 8px !important;
          font-family: 'Cairo', sans-serif !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          border: none !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          transition: all 0.2s !important;
        }

        .btn-primary {
          background: linear-gradient(135deg, #10b981, #059669) !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2) !important;
        }

        .btn-primary:hover {
          transform: translateY(-1px) !important;
          filter: brightness(1.08) !important;
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3) !important;
        }

        .btn-secondary {
          background: #1e293b !important;
          color: #f8fafc !important;
          border: 1px solid #334155 !important;
        }

        .btn-secondary:hover {
          background: #334155 !important;
          transform: translateY(-1px) !important;
        }

        footer {
          margin-top: auto !important;
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
          padding-top: 8px !important;
          text-align: center !important;
          font-size: 10px !important;
          color: #64748b !important;
        }

        /* Toast notification */
        .toast {
          position: fixed !important;
          bottom: 45px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          background-color: #10b981 !important;
          color: white !important;
          padding: 8px 16px !important;
          border-radius: 20px !important;
          font-size: 11px !important;
          font-weight: bold !important;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3) !important;
          z-index: 100 !important;
          animation: fadeInOut 0.3s ease !important;
        }

        @keyframes fadeInOut {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        /* Slide animations for settings panel */
        .slide-panel {
          animation: slideIn 0.25s ease forwards !important;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header>
        <div className="logo">
          <img src="/ايقونة داعم.png" alt="Baladi Logo" className="logo-img" />
          <h1>وحدة بلدي | واتساب</h1>
        </div>
        <button className="settings-btn" onClick={() => setShowSettings(!showSettings)} title="الإعدادات">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </header>

      {showSettings ? (
        <div className="slide-panel">
          <div className="input-group">
            <label>اسم الموظف</label>
            <input 
              type="text" 
              value={empName} 
              onChange={(e) => setEmpName(e.target.value)} 
              placeholder="مثلاً: محمد" 
            />
          </div>
          <div className="input-group">
            <label>قالب الرسالة</label>
            <textarea 
              rows={8} 
              value={msgTemplate} 
              onChange={(e) => setMsgTemplate(e.target.value)} 
              placeholder="قالب الرسالة..." 
            />
            <small style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', lineHeight: '1.4' }}>
              استبدال تلقائي: 
              <br />
              {"{greeting}"} : التحية حسب الوقت
              <br />
              {"{name}"} : اسم الموظف
              <br />
              {"{ticket}"} : رقم التذكرة
              <br />
              {"{report}"} : نص البلاغ
            </small>
          </div>
          <div className="actions">
            <button className="btn-action btn-primary" onClick={handleSaveSettings}>حفظ الإعدادات</button>
            <button className="btn-action btn-secondary" onClick={() => setShowSettings(false)}>إلغاء</button>
          </div>
        </div>
      ) : (
        <div className="slide-panel">
          <div className="input-group">
            <label>رقم الجوال</label>
            <input 
              type="text" 
              value={phoneNumber} 
              onChange={(e) => setPhoneNumber(e.target.value)} 
              placeholder="966XXXXXXXXX" 
            />
          </div>
          
          <div className="input-group">
            <label>رقم التذكرة</label>
            <input 
              type="text" 
              value={ticketNumber} 
              onChange={(e) => setTicketNumber(e.target.value)} 
              placeholder="IMXXXXXX" 
            />
          </div>

          <div className="input-group">
            <label>نص البلاغ</label>
            <textarea 
              rows={4} 
              value={reportText} 
              onChange={(e) => setReportText(e.target.value)} 
              placeholder="تفاصيل ونص البلاغ..." 
            />
          </div>

          <div className="actions">
            <button className="btn-action btn-secondary" onClick={handleExtractData}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              سحب البيانات
            </button>
            <button className="btn-action btn-primary" onClick={handleSendToWhatsapp}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"></path>
              </svg>
              إرسال للواتساب
            </button>
          </div>
        </div>
      )}

      {toastMessage && <div className="toast">{toastMessage}</div>}

      <footer>
        <span>الدعم الفني - وحدة بلدي</span>
      </footer>
    </div>
  );
}
