import { Suspense } from 'react';
import ConfirmClient from './ConfirmClient';

// صفحة التأكيد الاحتياطية لأداة داعم
export const dynamic = 'force-dynamic';

export default function TransferConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmClient />
    </Suspense>
  );
}
