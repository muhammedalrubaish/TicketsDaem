'use client';

import { useState } from 'react';
import styles from './page.module.css';

const SUPERVISORS = [
  { area: 'بريدة-سكني', type: 'مشرف', name: 'منصور محمد السليم', phone: '966555135111' },
  { area: 'بريدة-سكني', type: 'بديل', name: 'بندر محمد المحيميد', phone: '966555132511' },
  { area: 'بريدة-تجاري', type: 'مشرف', name: 'أحمد صالح المهوس', phone: '966553140510' },
  { area: 'بريدة-تجاري', type: 'بديل', name: 'خالد صالح المطرودي', phone: '966555132521' },
  { area: 'عنيزة-سكني', type: 'مشرف', name: 'يوسف ابراهيم الفره', phone: '966505138125' },
  { area: 'عنيزة-سكني', type: 'بديل', name: 'عبدالله صالح الشبل', phone: '966504886616' },
  { area: 'عنيزة-تجاري', type: 'مشرف', name: 'ابراهيم عبدالله الزبيدي', phone: '966553134316' },
  { area: 'عنيزة-تجاري', type: 'بديل', name: 'ماجد عبدالعزيز الزيادي', phone: '966553144805' },
  { area: 'عنيزة-انشائي', type: 'مشرف', name: 'محمد عبدالعزيز الفنيخ', phone: '966505131015' },
  { area: 'عنيزة-انشائي', type: 'بديل', name: 'فهد شاهر العتيبي', phone: '966554273550' },
  { area: 'عنيزة-مباني تجاري', type: 'مشرف', name: 'أسامة عبدالله المانع', phone: '966500551301' },
  { area: 'عنيزة-مباني تجاري', type: 'بديل', name: 'وائل عبدالعزيز القبيل', phone: '966555171731' },
  { area: 'عنيزة-تجاري-سكني', type: 'مشرف', name: 'نواف علي العتيبي', phone: '966505151543' },
  { area: 'الرس-سكني', type: 'مشرف', name: 'فهد عبدالله الرشيد', phone: '966505131063' },
  { area: 'الرس-سكني', type: 'بديل', name: 'خالد فهد العقيل', phone: '966503140776' },
  { area: 'الرس-تجاري', type: 'مشرف', name: 'فهد عبدالله الرشيد', phone: '966505131063' },
  { area: 'الرس-تجاري', type: 'بديل', name: 'خالد فهد العقيل', phone: '966503140776' },
  { area: 'المذنب', type: 'مشرف', name: 'عبدالرحمن محمد العبودي', phone: '966505152504' },
  { area: 'البكيرية', type: 'مشرف', name: 'يوسف صالح الخليفي', phone: '966505131089' },
  { area: 'البكيرية', type: 'بديل', name: 'منصور محمد الراجحي', phone: '966553143362' },
  { area: 'البدائع-سكني', type: 'مشرف', name: 'مانع علي مانع الدويغري', phone: '966553140882' },
  { area: 'البدائع-سكني', type: 'بديل', name: 'أحمد عبدالله علي المنيع', phone: '966505141042' },
  { area: 'البدائع-انشائي', type: 'مشرف', name: 'محمد صالح الرفيدان', phone: '966504899505' },
  { area: 'البدائع-انشائي', type: 'بديل', name: 'يوسف حمدان العوفي', phone: '966503130310' },
  { area: 'الخبراء وسحاب', type: 'مشرف', name: 'عبدالله عبدالرحمن السلامة', phone: '966554898188' },
  { area: 'رياض الخبراء', type: 'مشرف', name: 'سليمان صالح النفيسة', phone: '966503138804' },
  { area: 'رياض الخبراء', type: 'بديل', name: 'عبدالله عبدالرحمن السلامة', phone: '966554898188' },
  { area: 'الأسياح', type: 'مشرف', name: 'فهد عبدالرحمن الفهيد', phone: '966503141153' },
  { area: 'الأسياح', type: 'بديل', name: 'عبدالعزيز محمد الفهيد', phone: '966553141153' },
  { area: 'النبهانية', type: 'مشرف', name: 'فهد محمد الحجي', phone: '966505146030' },
  { area: 'الشماسية', type: 'مشرف', name: 'عبدالرحمن ابراهيم الفوزان', phone: '966504893739' },
  { area: 'عيون الجواء', type: 'مشرف', name: 'عبدالعزيز صالح الربيعان', phone: '966503144144' },
  { area: 'أبانات', type: 'مشرف', name: 'بدر عبدالرحمن الحربي', phone: '966553205085' },
  { area: 'ضرية', type: 'مشرف', name: 'مشعل غازي العتيبي', phone: '966553018880' },
  { area: 'عقلة الصقور', type: 'مشرف', name: 'خالد عبدالله الموزان', phone: '966503144889' },
  { area: 'الفوارة', type: 'مشرف', name: 'عبدالله الحميدي الحربي', phone: '966505132204' },
  { area: 'قبة', type: 'مشرف', name: 'محمد مطلق الحربي', phone: '966500854483' },
  { area: 'البصر', type: 'مشرف', name: 'خالد صالح المطرودي', phone: '966555132521' },
];

export default function SupervisorsSearch() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = SUPERVISORS.filter(s => 
    s.area.includes(searchTerm) || 
    s.name.includes(searchTerm)
  );

  // تجميع البيانات حسب المنطقة
  const grouped = filtered.reduce((acc: any, curr) => {
    if (!acc[curr.area]) acc[curr.area] = [];
    acc[curr.area].push(curr);
    return acc;
  }, {});

  return (
    <div className={styles.supContainer}>
      <h2 className={styles.supTitle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
        دليل أرقام مشرفي البلديات
      </h2>
      <div className={styles.supSearchBox}>
        <input 
          type="text" 
          placeholder="ابحث باسم البلدية أو المشرف..." 
          className={styles.supInput}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.supGrid}>
        {Object.keys(grouped).map(area => (
          <div key={area} className={styles.supCard}>
            <div className={styles.supCardHeader}>{area}</div>
            <div className={styles.supCardBody}>
              {grouped[area].map((person: any, idx: number) => (
                <div key={idx} className={styles.supPersonRow}>
                  <div className={styles.supPersonInfo}>
                    <span className={styles.supLabel}>{person.type}:</span>
                    <span className={styles.supName}>{person.name}</span>
                  </div>
                  <a 
                    href={`https://wa.me/${person.phone}?text=${encodeURIComponent('السلام عليكم، تم استقبال بلاغ جديد لديكم.')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.supWaBtn}
                    title="تواصل عبر واتساب"
                    style={{ padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '35px', height: '35px' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"></path>
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
