import { Suspense } from 'react';
import { SearchPage } from '@/features/search';

export default function SearchRoute() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
