import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'ويدجت البلاغات | وحدة بلدي',
  description: 'ويدجت الشاشة الرئيسية لنظام بلاغات وحدة بلدي',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'بلدي - بلاغات',
  },
  icons: {
    apple: '/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%A8%D9%84%D8%AF%D9%8A%20%D8%A7%D9%84%D8%B1%D8%B3%D9%85%D9%8A.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function MobileWidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* PWA standalone meta tag – يجعل الصفحة تعمل بدون شريط المتصفح عند إضافتها للشاشة الرئيسية */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0f172a' }}>
        {children}
      </body>
    </html>
  );
}
