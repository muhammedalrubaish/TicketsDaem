import TransferClient from './TransferClient';

// تطبيق تحويل البلاغات بالجوال — صفحة مستقلة عن لوحة التحكم
export const dynamic = 'force-dynamic';

export default function TransferPage() {
  return <TransferClient />;
}
