'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import TicketForm from '../TicketForm';

type Complaint = {
  id: string;
  statusPageId?: string;
  number: string;
  type: string;
  status: string;
  solution: string;
  date: string;
  receiver: string;
  createdAt?: string;
};

type Props = {
  complaints: Complaint[];
};

export default function NewTicketClient({ complaints }: Props) {
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'viewer' | 'editor' | 'super_admin' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // التحقق من ملف تعريف الارتباط وجلب المستخدم المالي
    const cookies = document.cookie.split('; ');
    const authCookie = cookies.find(row => row.startsWith('auth_token='));
    
    if (!authCookie) {
      router.push('/login');
      return;
    }

    const value = authCookie.split('=')[1];
    if (value === 'super_admin') {
      setUserRole('super_admin');
    } else if (value === 'viewer' || value === 'admin' || value === 'true') {
      setUserRole('viewer');
    } else if (value.startsWith('editor_')) {
      const name = decodeURIComponent(value.replace('editor_', ''));
      setLoggedInUser(name);
      if (name.includes('محمد الربيش')) {
        setUserRole('super_admin');
      } else {
        setUserRole('editor');
      }
    } else {
      router.push('/login');
      return;
    }
    setIsLoading(false);
  }, [router]);

  // حساب الموزع القادم (أقل عدد بلاغات)
  const suggestedReceiver = (() => {
    const priorityOrder = [
      'البراء النصيان',
      'محمد الربيش',
      'عبدالرحمن العمري',
      'عزام الحربي',
      'صالح الغصن',
      'طارق الهدياني',
      'ثامر المنصور'
    ];

    const counts: { [key: string]: number } = {};
    priorityOrder.forEach(name => {
      counts[name] = 0;
    });

    complaints.forEach(c => {
      const receiver = (c.receiver || '').trim().replace(/\s+/g, ' ');
      if (!receiver || receiver === 'غير محدد') return;

      const matchedName = priorityOrder.find(p => 
        receiver.includes(p.split(' ')[0]) || 
        p.includes(receiver.split(' ')[0])
      );

      if (matchedName) {
        counts[matchedName]++;
      }
    });

    let bestCandidate = priorityOrder[0];
    let minCount = counts[bestCandidate];

    for (const name of priorityOrder) {
      if (counts[name] < minCount) {
        minCount = counts[name];
        bestCandidate = name;
      }
    }

    return bestCandidate;
  })();

  if (isLoading) {
    return (
      <div className={styles.loginContainer} style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className={styles.loginContainer} style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
      <div className={styles.formContainer} style={{ maxWidth: '500px', width: '100%', animation: 'none' }}>
        <TicketForm 
          mode="notion" 
          currentUser={loggedInUser} 
          suggestedReceiver={userRole === 'super_admin' ? suggestedReceiver : undefined}
          onClose={() => router.push('/')}
        />
      </div>
    </div>
  );
}
