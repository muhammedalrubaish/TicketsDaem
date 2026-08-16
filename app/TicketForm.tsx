'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';

type TicketFormProps = {
  mode: 'whatsapp' | 'notion';
  onClose?: () => void;
  currentUser?: string | null;
  onAddOptimistic?: (ticket: any) => void;
  suggestedReceiver?: string;
  onLoading?: (isLoading: boolean) => void;
};

const EMPLOYEES = [
  { name: 'البراء النصيان', user: 'a.alnesayan', phone: '966537313164' },
  { name: 'عبدالله العويد', user: 'aalowaid', phone: '966582060644' },
  { name: 'عبدالرحمن العمري', user: 'af.alamri', phone: '966553077432' },
  { name: 'عزام الحربي', user: 'azz.alharbi', phone: '966500000000' },
  { name: 'محمد الربيش', user: '966595866711', phone: '966595866711' },
  { name: 'صالح الغصن', user: 's.alghosen', phone: '966557828464' },
  { name: 'طارق الهدياني', user: 't.alhedyani', phone: '966500221260' },
  { name: 'ثامر المنصور', user: 't.almansour', phone: '966570770940' },
];

const CATEGORIES = [
  "الرخص التجارية", "الرخص الإنشائية", "بلدي أعمال", "مسار منصة الحفريات", 
  "التقرير المساحي", "الإدارة الذكية للنظافة", "خدمة المواعيد الالكترونية", 
  "الشهادات الصحية", "خدمة مرافق إيواء", "مستشارك بلدي", "نظام الصلاحيات", 
  "تطبيق بلدي", "شكوى المستفيد منصة بلدي", "منصة الرقابة الموحدة (ممثل)", 
  "لوحة التحكم", "خدمة الدمج والتجزئة", "خدمة تحديث الصكوك", 
  "خدمة اعتماد المخططات الخاصة", "تصنيف مقدمي خدمات المدن", "الهوية العقارية", 
  "شكوى المستفيد بلدي 940", "خدمة الفرص الاستثمارية", "خدمة السكن الجماعي", 
  "خدمة السكن الجماعي للأفراد", "صفحة بلدي", "GIS Web Portal", "رمز الاستجابة", 
  "إكرام الموتى", "التشوه البصري", "امتثال", "رقابة الصحي والأسواق", 
  "الخرائط الجغرافية", "صوت العميل", "نظام المتاجر المتنقلة", 
  "شؤون البلدية والقروية والإسكان", "Investment Opportunities", 
  "امتثال المباني", "منصة رسم تقديم منتجات التبغ", "فاتورة سداد آلياً", "أخرى"
];

export default function TicketForm({ mode, onClose, currentUser, onAddOptimistic, suggestedReceiver, onLoading }: TicketFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: suggestedReceiver || currentUser || '', 
    ticketNumber: '',
    serviceType: '',
    solution: 'بلاغ جديد',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  // التركيز التلقائي الذكي والـ refs للإغلاق عند النقر خارج القوائم
  const ticketInputRef = useRef<HTMLInputElement>(null);
  const receiverInputRef = useRef<HTMLSelectElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (ticketInputRef.current) {
      ticketInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (onLoading) onLoading(true);
    
    if (mode === 'notion' && onAddOptimistic) {
      onAddOptimistic({
        id: 'temp-' + Date.now(),
        date: formData.date,
        receiver: formData.name,
        number: formData.ticketNumber,
        type: formData.serviceType,
        solution: formData.solution,
        createdAt: new Date().toISOString()
      });
    }

    try {
      if (mode === 'notion') {
        const response = await fetch('/api/create-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: formData.date,
            receiver: formData.name,
            ticketNumber: formData.ticketNumber,
            type: formData.serviceType,
            solution: formData.solution
          }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'فشل الإرسال');
        }
        setIsSuccess(true);
      } else {
        const message = `*نموذج بلاغ تقني - وحدة بلدي*
________________________________________________________________________________________________
 *تاريخ البلاغ:* ${formData.date}
 *المستقبل:* ${formData.name}
 *رقم البلاغ:* ${formData.ticketNumber}
 *نوع التصنيف:* ${formData.serviceType}
 *الحالة:* ${formData.solution}
________________________________________________________________________________________________`;

        const selectedEmp = EMPLOYEES.find(e => e.name === formData.name);
        const phone = selectedEmp?.phone || '966595866711'; 
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        setIsSuccess(true);
      }
      
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (error: any) {
      alert(error?.message || 'حدث خطأ أثناء تنفيذ العملية.');
    } finally {
      setIsSubmitting(false);
      if (onLoading) onLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <button type="button" className={styles.closeButton} onClick={onClose}>&times;</button>
      <h2 className={styles.formTitle}>
        {mode === 'notion' ? 'إدخال بلاغ بالنظام' : 'إنشاء بلاغ واتساب'}
      </h2>

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
        <button 
          type="button"
          className={styles.quickBtn}
          onClick={() => {
            setFormData(prev => ({
              ...prev,
              ticketNumber: 'إجازة',
              solution: 'مجاز',
              serviceType: 'أخرى'
            }));
          }}
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid #3b82f6',
            color: '#3b82f6',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          📅 إضافة إجازة سريعة
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="date">
            <span>📅</span> تاريخ استقبال البلاغ
          </label>
          <input 
            type="date" 
            id="date" 
            name="date" 
            value={formData.date} 
            onChange={handleChange} 
            required 
            lang="en-US" 
            dir="ltr"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="name">
            <span>👤</span> المستقبل (الموظف)
          </label>
          <select 
            id="name" 
            name="name" 
            ref={receiverInputRef}
            value={formData.name} 
            onChange={handleChange} 
            required
          >
            <option value="">-- اختر الموظف --</option>
            {EMPLOYEES.map(emp => (
              <option key={emp.user} value={emp.name}>{emp.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="ticketNumber">
            <span>🔢</span> رقم البلاغ / التذكرة
          </label>
          <input 
            type="text" 
            id="ticketNumber" 
            name="ticketNumber" 
            ref={ticketInputRef}
            value={formData.ticketNumber} 
            onChange={handleChange} 
            placeholder="مثال: IM450XXXX" 
            required 
          />
        </div>

        <div className={styles.formGroup} ref={categoryRef}>
          <label htmlFor="serviceType">
            <span>📋</span> نوع التصنيف
          </label>
          <div className={styles.customSelectWrapper}>
            <div 
              className={styles.customSelectTrigger}
              onClick={() => {
                setIsCategoryOpen(!isCategoryOpen);
                setIsStatusOpen(false);
              }}
            >
              <span>{formData.serviceType || '-- اختر نوع التصنيف --'}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            {isCategoryOpen && (
              <div 
                className={styles.customSelectOptions} 
                style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0, 
                  zIndex: 1001, 
                  maxHeight: '220px', 
                  overflowY: 'auto', 
                  display: 'flex', 
                  flexDirection: 'column',
                  padding: 0
                }}
              >
                <div style={{ padding: '8px', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10, borderBottom: '1px solid var(--border)' }}>
                  <input 
                    type="text" 
                    placeholder="ابحث عن تصنيف..." 
                    value={categorySearch} 
                    onChange={(e) => setCategorySearch(e.target.value)} 
                    onClick={(e) => e.stopPropagation()} 
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--background)',
                      color: 'var(--foreground)',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ padding: '4px' }}>
                  {CATEGORIES.filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase())).length > 0 ? (
                    CATEGORIES.filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase())).map(cat => (
                      <div 
                        key={cat} 
                        className={styles.customOption}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, serviceType: cat }));
                          setIsCategoryOpen(false);
                          setCategorySearch('');
                        }}
                      >
                        {cat}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      لا توجد نتائج مطابقة
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.formGroup} ref={statusRef}>
          <label htmlFor="solution">
            <span>💡</span> الحل المقترح (الحالة)
          </label>
          <div className={styles.customSelectWrapper}>
            <div 
              className={styles.customSelectTrigger}
              onClick={() => {
                setIsStatusOpen(!isStatusOpen);
                setIsCategoryOpen(false);
              }}
            >
              <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                {(() => {
                  const iconPath = [
                    { label: 'بلاغ جديد', icon: 'M12 5v14M5 12h14' },
                    { label: 'بانتظار المستفيد', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { label: 'لدى الوزارة', icon: 'M3 21h18M3 10h18M5 10V7a2 2 0 012-2h10a2 2 0 012 2v3M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4' },
                    { label: 'مشكلة عامة', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9-3-9' },
                    { label: 'لم يتم الحل', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { label: 'تم الحل', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { label: 'مجاز', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }
                  ].find(i => i.label === formData.solution)?.icon;
                  
                  return iconPath ? (
                    <svg className={styles.optionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={iconPath} />
                    </svg>
                  ) : null;
                })()}
                <span>{formData.solution}</span>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            {isStatusOpen && (
              <div className={styles.customSelectOptions}>
                {[
                  { label: 'بلاغ جديد', icon: 'M12 5v14M5 12h14' },
                  { label: 'بانتظار المستفيد', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { label: 'لدى الوزارة', icon: 'M3 21h18M3 10h18M5 10V7a2 2 0 012-2h10a2 2 0 012 2v3M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4' },
                  { label: 'مشكلة عامة', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9-3-9' },
                  { label: 'لم يتم الحل', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { label: 'تم الحل', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { label: 'مجاز', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }
                ].map(opt => (
                  <div 
                    key={opt.label} 
                    className={styles.customOption}
                    onClick={() => {
                      setFormData({ ...formData, solution: opt.label });
                      setIsStatusOpen(false);
                    }}
                  >
                    <svg className={styles.optionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={opt.icon} />
                    </svg>
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button 
          type="submit" 
          className={mode === 'notion' ? styles.notionBtnColored : styles.whatsappBtnColored} 
          disabled={isSubmitting}
          style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
        >
          {isSubmitting ? (
            'جاري الإرسال...'
          ) : isSuccess ? (
            '✅ تم بنجاح'
          ) : (
            <>
              {mode === 'notion' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"></path>
                </svg>
              )}
              {mode === 'notion' ? 'حفظ في قاعدة البيانات' : 'إرسال عبر الواتساب'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
