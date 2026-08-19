'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './portal.module.css';

interface ServiceCardItem {
  id: string;
  title: string;
  description: string;
  category: 'core' | 'field' | 'licensing' | 'admin';
  href: string;
  isExternal?: boolean;
  badge?: string;
  featured?: boolean;
  icon: 'dashboard' | 'camera' | 'chart' | 'users' | 'database' | 'files' | 'map' | 'support';
}

const SERVICES_DATA: ServiceCardItem[] = [
  {
    id: 'baladyunit',
    title: 'لوحة التحكم للبلاغات',
    description: 'إدارة ومتابعة ومعالجة بلاغات وحدة بلدي، توزيع التذاكر ومراقبة مؤشرات الإنجاز',
    category: 'core',
    href: '/baladyunit',
    badge: 'النظام الرئيسي',
    featured: true,
    icon: 'dashboard',
  },
  {
    id: 'adasati',
    title: 'نظام عدستي',
    description: 'رصد الملاحظات الميدانية والتشوهات البصرية وتوثيق الجولات التفتيشية الميدانية',
    category: 'field',
    href: 'https://adasati.balady.gov.sa',
    isExternal: true,
    badge: 'ميداني',
    featured: true,
    icon: 'camera',
  },
  {
    id: 'kpi-lic',
    title: 'منصة مؤشرات إدارة التراخيص (KPI-LIC)',
    description: 'متابعة مؤشرات أداء رخص البناء والأنشطة التجارية والامتثال البلدي في بلديات القصيم',
    category: 'licensing',
    href: 'https://kpi-lic.vercel.app',
    isExternal: true,
    badge: 'مؤشرات وأداء',
    featured: true,
    icon: 'chart',
  },
  {
    id: 'permissions',
    title: 'نظام إدارة الصلاحيات',
    description: 'التحكم بحسابات الموظفين والصلاحيات وتعيين الأدوار والمشرفين على المنظومة',
    category: 'admin',
    href: '/permissions',
    badge: 'إداري',
    icon: 'users',
  },
  {
    id: 'database',
    title: 'مركز إدارة قواعد البيانات',
    description: 'النسخ الاحتياطي ومزامنة البيانات وإدارة قاعدة بيانات PostgreSQL المحلية بالسيرفر',
    category: 'admin',
    href: '/database',
    badge: 'قواعد البيانات',
    icon: 'database',
  },
  {
    id: 'files',
    title: 'مركز النماذج والمرفقات الرسمية',
    description: 'أرشيف النماذج والخطابات والمستندات الرسمية المعتمدة لوحدة بلدي',
    category: 'admin',
    href: '/files',
    badge: 'المستندات',
    icon: 'files',
  },
];

export default function PortalClient() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<'super_admin' | 'viewer' | 'editor' | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const cookies = document.cookie.split('; ');
    const authCookie = cookies.find((c) => c.startsWith('auth_token='));

    if (!authCookie) {
      router.push('/login');
      return;
    }

    const value = authCookie.split('=')[1] || '';
    if (value === 'super_admin') {
      setUserRole('super_admin');
      setUserName('المشرف العام');
    } else if (value === 'viewer' || value === 'admin' || value === 'true') {
      setUserRole('viewer');
      setUserName('مشرف النظام');
    } else if (value.startsWith('editor_')) {
      const decodedName = decodeURIComponent(value.replace('editor_', ''));
      setUserName(decodedName);
      if (decodedName.includes('محمد الربيش')) {
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

  const handleLogout = () => {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
  };

  const filteredServices = SERVICES_DATA.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === 'all') return matchesSearch;
    return matchesSearch && service.category === activeCategory;
  });

  const renderIcon = (type: ServiceCardItem['icon']) => {
    switch (type) {
      case 'dashboard':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9"></rect>
            <rect x="14" y="3" width="7" height="5"></rect>
            <rect x="14" y="12" width="7" height="9"></rect>
            <rect x="3" y="16" width="7" height="5"></rect>
          </svg>
        );
      case 'camera':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        );
      case 'chart':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        );
      case 'users':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
      case 'database':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
        );
      case 'files':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        );
      default:
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
          </svg>
        );
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#070d0b', fontFamily: 'Cairo, sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem', color: '#34d399' }}>
          <div style={{ width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.08)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#94a3b8' }}>جاري تهيئة بوابة الخدمات والأنظمة...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.portalContainer}>
      {/* Background Glowing Ambient Orbs */}
      <div className={styles.ambientOrb1}></div>
      <div className={styles.ambientOrb2}></div>

      {/* Top Gov Bar */}
      <div className={styles.topGovBar}>
        <div className={styles.govBadge}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
          </svg>
          <span>أمانة منطقة القصيم — بوابة الخدمات والأنظمة الموحدة</span>
        </div>
        <div className={styles.topGovLinks}>
          <span>المملكة العربية السعودية</span>
          <span>•</span>
          <span>إدارة التراخيص ووحدة بلدي</span>
        </div>
      </div>

      {/* Main Header */}
      <header className={styles.mainHeader}>
        <div className={styles.headerContent}>
          <div className={styles.brandGroup}>
            <div className={styles.logoWrapper}>
              <div className={styles.logoImgContainer}>
                <img
                  src="/qassim-logo.png"
                  alt="أمانة منطقة القصيم - إدارة التراخيص"
                  className={styles.logoImg}
                />
              </div>
              <div className={styles.brandTexts}>
                <span className={styles.brandTitle}>بوابة الخدمات الموحدة</span>
                <span className={styles.brandSubtitle}>إدارة التراخيص • وحدة بلدي</span>
              </div>
            </div>

            <nav className={styles.navLinks}>
              <a href="#" className={`${styles.navLink} ${styles.active}`}>
                الرئيسية
              </a>
              <a href="/baladyunit" className={styles.navLink}>
                لوحة البلاغات
              </a>
              <a href="https://kpi-lic.vercel.app" target="_blank" rel="noopener noreferrer" className={styles.navLink}>
                إدارة التراخيص (KPI) ↗
              </a>
            </nav>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.userChip}>
              <div className={styles.userAvatar}>
                {userName.charAt(0) || 'م'}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{userName}</span>
                <span className={styles.userRole}>
                  {userRole === 'super_admin' ? 'مشرف عام' : userRole === 'editor' ? 'محرر وموظف' : 'مستعرض'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className={`${styles.actionBtn} ${styles.actionBtnLogout}`}
              title="تسجيل الخروج"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero / Filter Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroHeading}>
            <div>
              <h1 className={styles.portalTitle}>بوابة الأنظمة والخدمات الإلكترونية</h1>
              <p className={styles.portalDesc}>منصة رقمية موحدة لإدارة البلاغات ومؤشرات التراخيص والعمليات الميدانية</p>
            </div>

            <div className={styles.searchBox}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="ابحث عن نظام أو خدمة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.filterTabs}>
            <button
              className={`${styles.filterTab} ${activeCategory === 'all' ? styles.activeTab : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              جميع الأنظمة ({SERVICES_DATA.length})
            </button>
            <button
              className={`${styles.filterTab} ${activeCategory === 'core' ? styles.activeTab : ''}`}
              onClick={() => setActiveCategory('core')}
            >
              أنظمة البلاغات
            </button>
            <button
              className={`${styles.filterTab} ${activeCategory === 'licensing' ? styles.activeTab : ''}`}
              onClick={() => setActiveCategory('licensing')}
            >
              التراخيص والمؤشرات
            </button>
            <button
              className={`${styles.filterTab} ${activeCategory === 'field' ? styles.activeTab : ''}`}
              onClick={() => setActiveCategory('field')}
            >
              الأنظمة الميدانية
            </button>
            <button
              className={`${styles.filterTab} ${activeCategory === 'admin' ? styles.activeTab : ''}`}
              onClick={() => setActiveCategory('admin')}
            >
              الإدارة والبيانات
            </button>
          </div>
        </div>
      </section>

      {/* Main Grid Cards */}
      <main className={styles.mainGridSection}>
        <div className={styles.cardsGrid}>
          {filteredServices.length > 0 ? (
            filteredServices.map((service) => (
              <div
                key={service.id}
                className={`${styles.portalCard} ${service.featured ? styles.featuredCard : ''}`}
              >
                <div>
                  <div className={styles.cardTop}>
                    <div className={styles.cardIconBox}>
                      {renderIcon(service.icon)}
                    </div>
                    {service.badge && (
                      <span className={styles.cardBadge}>{service.badge}</span>
                    )}
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{service.title}</h3>
                    <p className={styles.cardDescription}>{service.description}</p>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  {service.isExternal ? (
                    <a
                      href={service.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.enterBtn}
                    >
                      <span>الدخول للنظام</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="7" y1="17" x2="17" y2="7"></line>
                        <polyline points="7 7 17 7 17 17"></polyline>
                      </svg>
                    </a>
                  ) : (
                    <button
                      onClick={() => router.push(service.href)}
                      className={styles.enterBtn}
                    >
                      <span>الدخول للنظام</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>لا توجد خدمات أو أنظمة مطابقة لنتيجة البحث &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.portalFooter}>
        <div className={styles.footerContent}>
          <div className={styles.footerRights}>
            <span>أمانة منطقة القصيم — إدارة التراخيص ووحدة بلدي © {new Date().getFullYear()}</span>
          </div>
          <div>
            <span style={{ color: '#34d399', fontWeight: 700 }}>الإصدار الموحد v2.5</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
