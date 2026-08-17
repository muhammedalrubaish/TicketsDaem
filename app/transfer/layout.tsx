import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'تحويل البلاغات | وحدة بلدي',
  description: 'تطبيق تحويل وإسناد البلاغات من الجوال عبر منصة داعم',
  manifest: '/transfer-manifest.json',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'تحويل البلاغات',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function TransferLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
