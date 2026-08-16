'use client';

import React, { useEffect, useState } from 'react';

interface Ticket {
  id: string;
  number: string;
  solution: string;
  receiver: string;
  date: string;
  type?: string;
}

interface Counts {
  new: number;
  recent: number;
  old: number;
  veryOld: number;
  unassigned: number;
  notSolved: number;
}
const LATEST_VERSION = '1.3';

export default function ExtensionPopupPage() {
  const [counts, setCounts] = useState<Counts>({ new: 0, recent: 0, old: 0, veryOld: 0, unassigned: 0, notSolved: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [clientVersion, setClientVersion] = useState<string>('');
  
  const [role, setRole] = useState<'admin' | 'support' | null>(null);
  // لا نعبئ كلمة المرور مسبقاً إطلاقاً حفاظاً على السرية عند مشاركة الإضافة
  const [password, setPassword] = useState<string>('');
  const [showPasswordField, setShowPasswordField] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [nextEmployee, setNextEmployee] = useState<string>('غير محدد');
  const [totalTickets, setTotalTickets] = useState<number>(0);

  const [selectedUser, setSelectedUser] = useState<string>('mialrubaish');
  const [userArabic, setUserArabic] = useState<string>('');
  const [spellingEnabled, setSpellingEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setClientVersion(params.get('v') || '');
      
      const paramRole = params.get('role');
      const paramSpelling = params.get('spelling');
      
      if (paramSpelling === 'false') {
        setSpellingEnabled(false);
      } else {
        setSpellingEnabled(true);
      }
      
      const savedRole = localStorage.getItem('daemRole') as 'admin' | 'support' | null;
      const savedUsername = localStorage.getItem('daemUsername') || '';
      const savedUserKey = localStorage.getItem('daemUserKey') || '';
      const savedUserArabic = localStorage.getItem('daemUserArabic') || '';

      // إزالة أي كلمة مرور مخزنة سابقاً (أمان: لا تُحفظ كلمة المرور بعد الآن)
      localStorage.removeItem('daemPassword');

      const activeRole = savedRole || (paramRole && paramRole !== 'null' ? (paramRole as 'admin' | 'support') : null);

      if (savedUsername) {
        setSelectedUser(savedUsername);
      }
      if (savedUserArabic) {
        setUserArabic(savedUserArabic);
      }

      if (activeRole) {
        setRole(activeRole);
        localStorage.setItem('daemRole', activeRole);
        window.parent.postMessage({
          action: 'SET_ROLE',
          role: activeRole,
          password: '',
          username: savedUsername,
          userKey: savedUserKey,
          userArabic: savedUserArabic
        }, '*');
      }
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/tickets-json');
        if (res.ok) {
          const resData = await res.json();
          // دعم الصيغة الجديدة { tickets, totalCount } والقديمة [ array ]
          const tickets: Ticket[] = Array.isArray(resData) ? resData : (resData.tickets || []);

          const calculatedCounts = calculateCounts(tickets, userArabic || null);
          setCounts(calculatedCounts);

          // حساب الموظف التالي بالدور - ترتيب الأولوية المعتمد
          const priorityOrder = [
            { name: 'البراء النصيان', user: 'a.alnesayan', key: 'alnesayan' },
            { name: 'عبدالله العويد', user: 'aalowaid', key: 'alowaid' },
            { name: 'عبدالرحمن العمري', user: 'af.alamri', key: 'alamri' },
            { name: 'عزام الحربي', user: 'azz.alharbi', key: 'alharbi' },
            { name: 'محمد الربيش', user: 'mialrubaish', key: 'alrubaish' },
            { name: 'صالح الغصن', user: 's.alghosen', key: 'alghosen' },
            { name: 'طارق الهدياني', user: 't.alhedyani', key: 'alhedyani' },
            { name: 'ثامر المنصور', user: 't.almansour', key: 'almansour' }
          ];

          const empCounts: Record<string, number> = {};
          priorityOrder.forEach(emp => {
            empCounts[emp.name] = 0;
          });

          // نفس فلاتر الموقع الرئيسي (DashboardClient baseComplaints)
          const baseTickets = tickets.filter(t => 
            t.date && 
            t.date >= '2026-04-04' && 
            t.type !== 'تحديث نظام' && 
            t.type !== 'تحديثات النظام' &&
            !(t.number && t.number.includes('📢'))
          );

          // إجمالي البلاغات بناءً على الموظف
          const userBaseTickets = baseTickets.filter(t => {
            if (!userArabic) return true;
            const receiver = (t.receiver || '').trim();
            const isNew = t.solution === 'بلاغ جديد' || t.solution === 'غير محدد' || !t.solution;
            const isAssignedToMe = receiver.includes(userArabic.split(' ')[0]) || userArabic.includes(receiver.split(' ')[0]);
            return isAssignedToMe || isNew;
          });

          setTotalTickets(baseTickets.length);

          baseTickets.forEach(t => {
            // تنظيف المسافات مثل DashboardClient تماماً
            const receiver = (t.receiver || '').trim().replace(/\s+/g, ' ');
            if (!receiver || receiver === 'غير حدد' || receiver === 'غير محدد') return;

            const matched = priorityOrder.find(p => 
              receiver.includes(p.name.split(' ')[0]) || 
              p.name.includes(receiver.split(' ')[0])
            );

            if (matched) {
              empCounts[matched.name]++;
            }
          });

          // البحث عن الموظف الأقل بلاغات - عند التساوي يقدم الأسبق في القائمة
          let bestCandidate = priorityOrder[0];
          let minCount = empCounts[bestCandidate.name];

          for (const emp of priorityOrder) {
            if (empCounts[emp.name] < minCount) {
              minCount = empCounts[emp.name];
              bestCandidate = emp;
            }
          }
          setNextEmployee(bestCandidate.name);
        }
      } catch (err) {
        console.error('Failed to load tickets in extension popup page:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [userArabic]);

  const handleLoginSupport = () => {
    setRole('support');
    localStorage.setItem('daemRole', 'support');
    localStorage.removeItem('daemPassword');
    localStorage.removeItem('daemUsername');
    localStorage.removeItem('daemUserKey');
    localStorage.removeItem('daemUserArabic');
    window.parent.postMessage({ action: 'SET_ROLE', role: 'support', password: '' }, '*');
    setUserArabic('');
  };

  const handleLoginAdmin = () => {
    const EMPLOYEES = [
      { name: 'البراء النصيان', user: 'a.alnesayan', key: 'alnesayan', pass: '1111' },
      { name: 'عبدالله العويد', user: 'aalowaid', key: 'alowaid', pass: '2222' },
      { name: 'عبدالرحمن العمري', user: 'af.alamri', key: 'alamri', pass: '3333' },
      { name: 'عزام الحربي', user: 'azz.alharbi', key: 'alharbi', pass: '4444' },
      { name: 'محمد الربيش', user: 'mialrubaish', key: 'alrubaish', pass: 'Balady.20' },
      { name: 'صالح الغصن', user: 's.alghosen', key: 'alghosen', pass: '6666' },
      { name: 'طارق الهدياني', user: 't.alhedyani', key: 'alhedyani', pass: '7777' },
      { name: 'ثامر المنصور', user: 't.almansour', key: 'almansour', pass: '8888' },
    ];

    let currentEmployees = EMPLOYEES;
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('balady_employees_v1');
      if (cached) {
        try {
          currentEmployees = JSON.parse(cached);
        } catch (e) {}
      }
    }

    const matchedEmp = currentEmployees.find(e => e.user === selectedUser);
    if (!matchedEmp) {
      setErrorMsg('الموظف غير موجود! ⚠️');
      return;
    }

    if (password.trim() === matchedEmp.pass.trim()) {
      const userRole = matchedEmp.user === 'mialrubaish' ? 'admin' : 'support';
      setRole(userRole);
      localStorage.setItem('daemRole', userRole);
      localStorage.setItem('daemUsername', matchedEmp.user);
      localStorage.setItem('daemUserKey', matchedEmp.key || '');
      localStorage.setItem('daemUserArabic', matchedEmp.name);

      setUserArabic(matchedEmp.name);
      // أمان: لا نحفظ ولا نمرر كلمة المرور بعد نجاح الدخول
      setPassword('');

      window.parent.postMessage({
        action: 'SET_ROLE',
        role: userRole,
        password: '',
        username: matchedEmp.user,
        userKey: matchedEmp.key || '',
        userArabic: matchedEmp.name
      }, '*');
      setErrorMsg('');
    } else {
      setErrorMsg('كلمة المرور غير صحيحة! ⚠️');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setRole(null);
    localStorage.removeItem('daemRole');
    localStorage.removeItem('daemPassword');
    localStorage.removeItem('daemUsername');
    localStorage.removeItem('daemUserKey');
    localStorage.removeItem('daemUserArabic');
    window.parent.postMessage({ action: 'SET_ROLE', role: 'support', password: '' }, '*');
    setShowPasswordField(false);
    setPassword('');
    setErrorMsg('');
    setUserArabic('');
  };

  const handleToggleSpelling = (checked: boolean) => {
    setSpellingEnabled(checked);
    window.parent.postMessage({ action: 'SET_SPELLING', enabled: checked }, '*');
  };

  function calculateCounts(tickets: Ticket[], loggedInEmpName: string | null): Counts {
    let counts = { new: 0, recent: 0, old: 0, veryOld: 0, unassigned: 0, notSolved: 0 };
    if (!Array.isArray(tickets)) return counts;

    tickets.forEach(ticket => {
      const status = (ticket.solution || '').trim();
      const receiver = (ticket.receiver || '').trim();

      const isAssignedToMe = loggedInEmpName ? (
        receiver.includes(loggedInEmpName.split(' ')[0]) || 
        loggedInEmpName.includes(receiver.split(' ')[0])
      ) : false;

      const isNew = status === 'بلاغ جديد' || status === 'غير محدد' || status === 'غير حدد' || status === '';

      // إذا كان الموظف مسجل دخوله، لا نعرض إلا البلاغات المسندة له أو الجديدة غير الموزعة
      if (loggedInEmpName && !isAssignedToMe && !isNew) {
        return;
      }

      if (status === 'بلاغ جديد') {
        counts.new++;
      } else if (status === 'بانتظار المستفيد') {
        counts.recent++;
      } else if (status === 'لدى الوزارة') {
        counts.veryOld++;
      } else if (status === 'مشكلة عامة') {
        counts.old++;
      } else if (status === 'لم يتم الحل') {
        counts.notSolved++;
      }

      // حساب التذاكر المتأخرة لأكثر من أسبوع
      if (isNew && ticket.date && ticket.date !== 'غير محدد' && ticket.date !== 'غير حدد') {
        try {
          const ticketDate = new Date(ticket.date);
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          if (ticketDate < oneWeekAgo) {
            counts.unassigned++;
          }
        } catch (e) {}
      }
    });
    return counts;
  }

  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);

  return (
    <div className="popup-container">
      <style>{`
        /* Reset and self-contain styles for extension-popup */
        html, body {
          background: #0f172a !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          height: 100% !important;
        }

        /* Custom scrollbar for dark theme */
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

        .popup-container {
          background: #0f172a !important;
          color: #f8fafc !important;
          font-family: 'Cairo', sans-serif !important;
          margin: 0 !important;
          padding: 10px !important;
          width: 100% !important;
          min-height: 100vh !important;
          box-sizing: border-box !important;
          direction: rtl !important;
          overflow-y: auto !important;
          display: flex !important;
          flex-direction: column !important;
        }

        .header-logo {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          margin-bottom: 4px !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          padding-bottom: 4px !important;
          width: 100% !important;
        }

        .logo-img {
          width: 38px !important;
          height: 38px !important;
          border-radius: 10px !important;
          margin-bottom: 4px !important;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25) !important;
          border: 2px solid #10b981 !important;
          transition: all 0.3s ease !important;
        }

        .logo-img:hover {
          transform: scale(1.06) rotate(3deg) !important;
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45) !important;
        }

        h3.title {
          margin: 0 !important;
          font-size: 13px !important;
          color: #10b981 !important;
          text-align: center !important;
          font-weight: 700 !important;
        }

        .stats-grid {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 6px !important;
        }

        .stat-card {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          padding: 7px 8px !important;
          background: rgba(255, 255, 255, 0.04) !important;
          border-radius: 10px !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          transition: all 0.25s ease !important;
          direction: rtl !important;
          cursor: default !important;
        }

        .stat-card:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          transform: translateY(-1px) !important;
        }

        .stat-info {
          display: flex !important;
          flex-direction: column !important;
          gap: 1px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: right !important;
        }

        .stat-label {
          font-size: 9.5px !important;
          color: #94a3b8 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          font-weight: 600 !important;
        }

        .stat-count {
          font-size: 22px !important;
          font-weight: 800 !important;
          line-height: 1.1 !important;
        }

        .update-banner {
          display: block !important;
          background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%) !important;
          color: white !important;
          text-decoration: none !important;
          text-align: center !important;
          padding: 8px 10px !important;
          border-radius: 8px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          margin-bottom: 10px !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          transition: all 0.2s ease !important;
          animation: banner-glow 1.5s infinite ease-in-out !important;
        }

        .update-banner:hover {
          filter: brightness(1.1) !important;
          transform: translateY(-1px) !important;
        }

        @keyframes banner-glow {
          0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.8); }
        }

        .daem-link-container {
          margin-top: 6px !important;
          display: flex !important;
          justify-content: center !important;
          width: 100% !important;
        }

        .daem-btn {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          padding: 4px 8px !important;
          background: linear-gradient(135deg, #10b981, #059669) !important;
          color: white !important;
          text-decoration: none !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          font-size: 10px !important;
          transition: all 0.3s ease !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15) !important;
        }

        .daem-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35) !important;
          filter: brightness(1.08) !important;
        }

        .footer {
          position: sticky !important;
          bottom: -10px !important;
          background: #0f172a !important;
          margin-top: auto !important;
          font-size: 10px !important;
          text-align: center !important;
          opacity: 1 !important;
          padding-top: 8px !important;
          padding-bottom: 8px !important;
          z-index: 1000 !important;
          width: calc(100% + 20px) !important;
          margin-right: -10px !important;
          margin-left: -10px !important;
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 -4px 10px rgba(15, 23, 42, 0.8) !important;
        }

        .logout-footer {
          margin-top: 6px !important;
          padding-top: 2px !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          padding-right: 10px !important;
          padding-left: 10px !important;
        }

        .badge-role {
          font-size: 9px !important;
          font-weight: 700 !important;
          color: #94a3b8 !important;
        }

        .btn-switch-account {
          background: transparent !important;
          border: none !important;
          color: #ef4444 !important;
          font-family: 'Cairo', sans-serif !important;
          font-size: 9px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          transition: all 0.2s !important;
        }

        .btn-switch-account:hover {
          background: rgba(239, 68, 68, 0.15) !important;
        }

        /* === مركز التوزيع الفضائي === */
        .space-dashboard {
          background: radial-gradient(ellipse at top, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0.95)) !important;
          border: 1px solid rgba(16, 185, 129, 0.25) !important;
          border-radius: 14px !important;
          padding: 12px 10px 10px !important;
          margin-top: 8px !important;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.08), inset 0 1px 0 rgba(255,255,255,0.05) !important;
          direction: rtl !important;
          text-align: center !important;
          font-family: 'Cairo', sans-serif !important;
          animation: space-pulse 5s infinite alternate !important;
          display: block !important;
          position: relative !important;
          overflow: hidden !important;
        }

        .space-dashboard::before {
          content: '' !important;
          position: absolute !important;
          top: -50% !important;
          left: -50% !important;
          width: 200% !important;
          height: 200% !important;
          background: radial-gradient(circle at 60% 40%, rgba(59, 130, 246, 0.04), transparent 60%) !important;
          pointer-events: none !important;
        }

        @keyframes space-pulse {
          0% { box-shadow: 0 0 12px rgba(16, 185, 129, 0.08), inset 0 1px 0 rgba(255,255,255,0.05); border-color: rgba(16, 185, 129, 0.2); }
          100% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.18), inset 0 1px 0 rgba(255,255,255,0.08); border-color: rgba(59, 130, 246, 0.45); }
        }

        .space-title {
          font-size: 9px !important;
          font-weight: 700 !important;
          color: #38bdf8 !important;
          letter-spacing: 0.8px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 5px !important;
          margin-bottom: 10px !important;
          text-transform: uppercase !important;
        }

        /* الحلقات المدارية الزخرفية */
        .orbital-wrapper {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          position: relative !important;
          width: 100px !important;
          height: 100px !important;
          margin: 0 auto 8px !important;
        }

        .orbital-ring {
          position: absolute !important;
          border-radius: 50% !important;
          pointer-events: none !important;
        }

        .orbital-ring-1 {
          width: 96px !important;
          height: 96px !important;
          border: 1px solid rgba(59, 130, 246, 0.18) !important;
          animation: orbit-spin 12s linear infinite !important;
        }

        .orbital-ring-2 {
          width: 108px !important;
          height: 108px !important;
          border: 1px dashed rgba(139, 92, 246, 0.12) !important;
          animation: orbit-spin 18s linear infinite reverse !important;
        }

        @keyframes orbit-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .orbital-svg {
          filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.5)) !important;
          position: relative !important;
          z-index: 1 !important;
        }

        /* المستقبل التالي */
        .space-text-row {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          font-size: 9.5px !important;
          color: #cbd5e1 !important;
          margin-top: 4px !important;
          direction: rtl !important;
          text-align: right !important;
        }

        .space-assignee-tag {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.1)) !important;
          color: #10b981 !important;
          padding: 3px 8px !important;
          border-radius: 20px !important;
          border: 1px solid rgba(16, 185, 129, 0.3) !important;
          font-weight: 700 !important;
          font-size: 9px !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 5px !important;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.15) !important;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 4px #10b981; }
          50% { opacity: 0.4; box-shadow: 0 0 8px #10b981; }
        }

        .live-dot {
          width: 5px !important;
          height: 5px !important;
          background: #10b981 !important;
          border-radius: 50% !important;
          display: inline-block !important;
          flex-shrink: 0 !important;
          animation: pulse-dot 1.5s ease-in-out infinite !important;
        }

        .login-view {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          min-height: 100vh !important;
          text-align: center !important;
        }

        .logo-container {
          margin-bottom: 15px !important;
        }

        .logo-img-login {
          width: 55px !important;
          height: 55px !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25) !important;
          border: 2px solid #10b981 !important;
        }

        h2.login-title {
          margin: 0 0 8px 0 !important;
          font-size: 15px !important;
          color: #10b981 !important;
          font-weight: 700 !important;
        }

        p.login-desc {
          margin: 0 0 20px 0 !important;
          font-size: 11px !important;
          color: #94a3b8 !important;
        }

        .login-btn {
          width: 100% !important;
          padding: 10px 12px !important;
          margin-bottom: 10px !important;
          border-radius: 8px !important;
          border: none !important;
          font-family: 'Cairo', sans-serif !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
        }

        .login-btn-primary {
          background: linear-gradient(135deg, #10b981, #059669) !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2) !important;
        }

        .login-btn-secondary {
          background: #1e293b !important;
          color: #f8fafc !important;
          border: 1px solid #334155 !important;
        }

        .login-btn:hover {
          transform: translateY(-2px) !important;
          filter: brightness(1.15) !important;
        }

        #password-section {
          width: 100% !important;
          margin-top: 10px !important;
          animation: slideDown 0.3s ease forwards !important;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .password-input-container {
          position: relative !important;
          width: 100% !important;
          margin-bottom: 8px !important;
        }

        .login-input {
          width: 100% !important;
          padding: 8px 38px 8px 12px !important;
          border-radius: 6px !important;
          border: 1px solid #334155 !important;
          background-color: #1e293b !important;
          color: white !important;
          font-family: 'Cairo', sans-serif !important;
          font-size: 11px !important;
          text-align: center !important;
          outline: none !important;
          box-sizing: border-box !important;
        }

        .login-input:focus {
          border-color: #10b981 !important;
        }

        .password-toggle-btn {
          position: absolute !important;
          right: 10px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          background: transparent !important;
          border: none !important;
          color: #94a3b8 !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0 !important;
          outline: none !important;
        }

        .password-toggle-btn:hover {
          color: #10b981 !important;
        }

        .error-message {
          color: #ef4444 !important;
          font-size: 10px !important;
          margin-bottom: 8px !important;
          font-weight: 700 !important;
        }

        .loading-pulse {
          text-align: center !important;
          padding: 80px 0 !important;
          font-size: 14px !important;
          opacity: 0.7 !important;
          animation: pulse 1.5s infinite ease-in-out !important;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>

      {role === null ? (
        <div className="login-view">
          <div className="logo-container">
            <img src="/ايقونة داعم.png" alt="Daem Plus Logo" className="logo-img-login" />
          </div>
          <h2 className="login-title">🚀 تسجيل الدخول إلى داعم بلس</h2>
          <p className="login-desc">الرجاء اختيار حسابك وإدخال كلمة المرور للبدء</p>
          
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="password-input-container">
              <select 
                className="login-input" 
                style={{ 
                  cursor: 'pointer', 
                  padding: '10px 12px',
                  textAlign: 'center',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  backgroundColor: '#1e293b',
                  color: 'white',
                  width: '100%',
                  fontFamily: 'Cairo, sans-serif'
                }}
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value);
                  setPassword('');
                  setErrorMsg('');
                }}
              >
                <option value="a.alnesayan">البراء النصيان (a.alnesayan)</option>
                <option value="aalowaid">عبدالله العويد (aalowaid)</option>
                <option value="af.alamri">عبدالرحمن العمري (af.alamri)</option>
                <option value="azz.alharbi">عزام الحربي (azz.alharbi)</option>
                <option value="mialrubaish">محمد الربيش (mialrubaish) - موزع البلاغات</option>
                <option value="s.alghosen">صالح الغصن (s.alghosen)</option>
                <option value="t.alhedyani">طارق الهدياني (t.alhedyani)</option>
                <option value="t.almansour">ثامر المنصور (t.almansour)</option>
              </select>
            </div>

            <div className="password-input-container">
              <input 
                type={showPasswordText ? "text" : "password"} 
                className="login-input" 
                style={{ padding: '10px 38px 10px 12px', borderRadius: '8px' }}
                placeholder="أدخل كلمة المرور الخاصة بك"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLoginAdmin();
                }}
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowPasswordText(!showPasswordText)}
                title={showPasswordText ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPasswordText ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>

            <button onClick={handleLoginAdmin} className="login-btn login-btn-primary">
              🔑 تسجيل الدخول
            </button>
            {errorMsg && <div className="error-message">{errorMsg}</div>}
          </div>
        </div>
      ) : (
        <>
          <div className="header-logo">
            <img src="/ايقونة داعم.png" alt="Daem Plus Logo" className="logo-img" />
            <h3 className="title">🚀 داعم بلس Premium</h3>
          </div>

          {/* تم إخفاء تنبيه التحديث */}

          {loading ? (
            <div className="loading-pulse">جاري جلب العدادات الحية... ⚡</div>
          ) : (
            <div className="stats-grid">
              {[
                { label: 'بلاغات جديدة', count: counts.new, color: '#3b82f6' },
                { label: 'بانتظار المستفيد', count: counts.recent, color: '#ec4899' },
                { label: 'لدى الوزارة', count: counts.veryOld, color: '#fbbf24' },
                { label: 'مشكلة عامة', count: counts.old, color: '#06b6d4' },
                { label: 'لم يتم الحل', count: counts.notSolved, color: '#ef4444' },
                { label: 'متأخر >أسبوع', count: counts.unassigned, color: '#f43f5e' },
              ].map(({ label, count, color }) => {
                const r = 14;
                const circ = 2 * Math.PI * r;
                const percent = totalTickets > 0 ? Math.min((count / totalTickets) * 100, 100) : 0;
                const dash = (percent / 100) * circ;
                return (
                  <div
                    key={label}
                    className="stat-card"
                    style={{ borderColor: `${color}55`, boxShadow: `0 0 10px ${color}18` }}
                  >
                    <svg width="38" height="38" viewBox="0 0 36 36" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
                      <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3.5" />
                      <circle
                        cx="18" cy="18" r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth="3.5"
                        strokeDasharray={`${dash} ${circ}`}
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dasharray 1s ease' }}
                      />
                      <text
                        x="18" y="18"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#f8fafc"
                        fontSize="7"
                        fontWeight="bold"
                        fontFamily="Cairo, sans-serif"
                        style={{ transform: 'rotate(90deg)', transformOrigin: '18px 18px' }}
                      >
                        {Math.round(percent)}%
                      </text>
                    </svg>
                    <div className="stat-info">
                      <span className="stat-label">{label}</span>
                      <span className="stat-count" style={{ color }}>{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* مركز التوزيع الفضائي أولاً */}
          <div className="space-dashboard">
            <div className="space-title">🛰️ مركز التوزيع والتحكم</div>

            {/* المؤشر الدائري الفضائي SVG */}
            <div className="orbital-wrapper">
              <div className="orbital-ring orbital-ring-1"></div>
              <div className="orbital-ring orbital-ring-2"></div>
              <svg className="orbital-svg" viewBox="0 0 90 90" width="90" height="90">
                <defs>
                  <linearGradient id="orbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <filter id="glowFilter">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* حلقة الخلفية */}
                <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="7" />
                {/* حلقة الإجمالي: max بصري = 2000 بلاغ */}
                <circle
                  cx="45" cy="45" r="36"
                  fill="none"
                  stroke="url(#orbGrad)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(226.2, (totalTickets / 2000) * 226.2)} 226.2`}
                  transform="rotate(-90 45 45)"
                  filter="url(#glowFilter)"
                  style={{ transition: 'stroke-dasharray 1.5s ease-in-out' }}
                />
                {/* الرقم الفعلي - يتكيف حجم الخط مع الأرقام الكبيرة */}
                <text x="45" y="39" textAnchor="middle" fill="#f8fafc" fontSize={totalTickets >= 1000 ? '14' : '18'} fontWeight="bold" fontFamily="Cairo, sans-serif">
                  {totalTickets.toLocaleString('en')}
                </text>
                <text x="45" y="54" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="Cairo, sans-serif">
                  إجمالي البلاغات
                </text>
              </svg>
            </div>

            {/* المستقبل التالي */}
            <div className="space-text-row">
              <span>🔄 المستقبل التالي بالدور:</span>
              <span className="space-assignee-tag">
                <span className="live-dot"></span>
                {nextEmployee}
              </span>
            </div>
          </div>

          {/* خيار التصحيح الإملائي */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '10px 14px',
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'Cairo, sans-serif'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>🪄 وضع التصحيح الإملائي:</span>
              <span style={{ fontSize: '11px', color: spellingEnabled ? '#10b981' : '#94a3b8', fontWeight: 'bold' }}>
                {spellingEnabled ? 'مفعل' : 'غير مفعل'}
              </span>
            </div>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '40px',
              height: '20px',
              cursor: 'pointer'
            }}>
              <input 
                type="checkbox" 
                style={{ opacity: 0, width: 0, height: 0 }}
                checked={spellingEnabled}
                onChange={(e) => handleToggleSpelling(e.target.checked)}
              />
              <span style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: spellingEnabled ? '#10b981' : '#475569',
                transition: '0.3s',
                borderRadius: '20px',
                boxShadow: spellingEnabled ? '0 0 6px rgba(16, 185, 129, 0.4)' : 'none'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '14px',
                  width: '14px',
                  left: spellingEnabled ? '22px' : '4px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  transition: '0.3s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>

          {/* منصة داعم الرسمية */}
          <div className="daem-link-container" style={{ marginTop: '8px' }}>
            <a href="https://daem.momah.gov.sa/sm/index.do" target="_blank" rel="noopener noreferrer" className="daem-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              منصة داعم الرسمية
            </a>
          </div>

          {/* التذييل: تطوير ذكي + الدور + تبديل الحساب */}
          <div className="footer">
            <div>تطوير ذكي - 2026 (تحديث فوري تلقائي ⚡)</div>
            <div className="logout-footer">
              <span className="badge-role" style={{ color: role === 'admin' ? '#10b981' : '#38bdf8' }}>
                الدور: {role === 'admin' ? '🔑 صلاحيات كاملة' : '👤 معالجة ودمج'}
              </span>
              <button onClick={handleLogout} className="btn-switch-account">
                ❌ تبديل الحساب
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
