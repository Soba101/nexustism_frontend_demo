import { Suspense } from 'react';
import { AnalyticsPage } from '@/features/analytics';
import { PageWrapper } from '@/components/layout';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-96">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 dark:border-t-blue-400 animate-spin"></div>
    </div>
  </div>
);

export default function AnalyticsRoute() {
  return (
    <PageWrapper>
      <Suspense fallback={<LoadingSpinner />}>
        <AnalyticsPage />
      </Suspense>
    </PageWrapper>
  );
}
