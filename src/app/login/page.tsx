"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useInitializeAuth } from '@/stores/authStore';
import { LoginPage } from '@/features/auth';

export default function LoginRoute() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  useInitializeAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/home');
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 dark:border-t-blue-400 animate-spin"></div>
        </div>
      </div>
    );
  }

  return <LoginPage />;
}
