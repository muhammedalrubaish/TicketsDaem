'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';

const EMPLOYEES = [
  { name: 'البراء النصيان', user: 'a.alnesayan', phone: '966537313164', pass: '1111' },
  { name: 'عبدالله العويد', user: 'aalowaid', phone: '966582060644', pass: '2222' },
  { name: 'عبدالرحمن العمري', user: 'af.alamri', phone: '966553077432', pass: '3333' },
  { name: 'عزام الحربي', user: 'azz.alharbi', phone: '966500000000', pass: '4444' },
  { name: 'محمد الربيش', user: 'mialrubaish', phone: '966595866711', pass: 'Balady.20' },
  { name: 'صالح الغصن', user: 's.alghosen', phone: '966557828464', pass: '6666' },
  { name: 'طارق الهدياني', user: 't.alhedyani', phone: '966500221260', pass: '7777' },
  { name: 'ثامر المنصور', user: 't.almansour', phone: '966570770940', pass: '8888' },
];

export default function LoginPage() {
  const [loginMode, setLoginMode] = useState<'admin' | 'employee' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [employeesList, setEmployeesList] = useState(EMPLOYEES);

  // تحديث الصفحة تلقائياً عند الرجوع للخلف بالمتصفح
  useEffect(() => {
    const handlePopState = () => {
      window.location.reload();
    };
    window.addEventListener('popstate', handlePopState);

    const cached = localStorage.getItem('balady_employees_v1');
    if (cached) {
      try {
        setEmployeesList(JSON.parse(cached));
      } catch (e) {
        console.error('Failed to parse cached employees list', e);
      }
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleResetToModes = () => {
    setLoginMode(null);
    setError('');
    setPassword('');
    setUsername('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (failedAttempts >= 3) {
      setError('تم حظر الدخول لتجاوز عدد المحاولات المسموح به (3 محاولات). يرجى مراجعة المسؤول.');
      return;
    }

    setIsLoading(true);
    setError('');

    setTimeout(() => {
      let isSuccess = false;
      let targetPath = '/';

      if (loginMode === 'admin') {
        if (password === 'Balady.2026') {
          document.cookie = 'auth_token=viewer; path=/; max-age=604800';
          isSuccess = true;
        }
      } else {
        const cleanUsername = username.trim().toLowerCase();
        const emp = employeesList.find(e => e.user.toLowerCase() === cleanUsername && e.pass === password.trim());
        if (emp) {
          document.cookie = `auth_token=editor_${encodeURIComponent(emp.name)}; path=/; max-age=604800`;
          isSuccess = true;
        }
      }

      if (isSuccess) {
        window.location.href = targetPath;
      } else {
        const newCount = failedAttempts + 1;
        setFailedAttempts(newCount);
        setIsLoading(false);
        
        if (newCount >= 3) {
          setError('تم حظر الدخول لتجاوز عدد المحاولات (3 محاولات). يرجى مراجعة المسؤول.');
        } else {
          setError(`بيانات الدخول غير صحيحة. المحاولات المتبقية: ${3 - newCount}`);
        }
      }
    }, 600);
  };

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top, #132418 0%, #0a110d 50%, #050806 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(18, 28, 22, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(76, 154, 42, 0.25)',
        borderRadius: '24px',
        padding: '36px 30px',
        width: '100%',
        maxWidth: loginMode ? '440px' : '520px',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(76, 154, 42, 0.12)',
        transition: 'all 0.3s ease'
      }}>
        {/* الشعار */}
        <div style={{ display: 'inline-block', padding: '10px', background: 'rgba(76, 154, 42, 0.08)', borderRadius: '50%', marginBottom: '16px', border: '1px solid rgba(76, 154, 42, 0.2)' }}>
          <img 
            src="/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%A8%D9%84%D8%AF%D9%8A%20%D8%A7%D9%84%D8%B1%D8%B3%D9%85%D9%8A.png" 
            alt="شعار بلدي" 
            style={{ width: '64px', height: '64px', objectFit: 'contain', display: 'block' }} 
          />
        </div>

        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>
          نظام بلاغات <span style={{ color: '#4C9A2A' }}>وحدة بلدي</span>
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 24px 0' }}>
          المنصة الداخلية للمتابعة وإدارة البلاغات
        </p>
        
        {!loginMode ? (
          /* شبكة اختيار البوابة */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <button 
              onClick={() => setLoginMode('admin')}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '22px 14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                color: '#ffffff',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4C9A2A';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.background = 'rgba(76, 154, 42, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(76, 154, 42, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4C9A2A' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>بوابة المشرف</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>للمتابعة فقط</p>
            </button>

            <button 
              onClick={() => setLoginMode('employee')}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '22px 14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                color: '#ffffff',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4C9A2A';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.background = 'rgba(76, 154, 42, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(76, 154, 42, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4C9A2A' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>بوابة الموظف</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>تحديث ومعالجة البلاغات</p>
            </button>
          </div>
        ) : (
          /* مرحلة اسم المستخدم وكلمة المرور */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#ffffff' }}>
                {loginMode === 'admin' ? 'دخول المشرف (رؤية فقط)' : 'دخول الموظف (تعديل)'}
              </span>
              <button 
                onClick={handleResetToModes}
                style={{ background: 'none', border: 'none', color: '#4C9A2A', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                ← العودة للخيارات
              </button>
            </div>
            
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {loginMode === 'employee' && (
                <div>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    autoComplete="username"
                    placeholder="اسم المستخدم"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(0, 0, 0, 0.35)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      textAlign: 'right',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    required
                  />
                </div>
              )}
              
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  autoComplete="current-password"
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 46px 14px 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(0, 0, 0, 0.35)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    textAlign: 'right',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: showPassword ? '#4C9A2A' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px',
                    zIndex: 10,
                    transition: 'all 0.2s ease'
                  }}
                  title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  )}
                </button>
              </div>

              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px', borderRadius: '10px', fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#4C9A2A',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: isLoading ? 'wait' : 'pointer',
                  boxShadow: '0 4px 15px rgba(76, 154, 42, 0.35)',
                  transition: 'all 0.2s ease',
                  marginTop: '6px'
                }}
              >
                {isLoading ? 'جاري التحقق...' : 'دخول النظام'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
