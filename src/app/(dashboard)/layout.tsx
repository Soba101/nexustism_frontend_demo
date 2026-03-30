"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useInitializeAuth } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { TicketDetailPanel } from '@/features/tickets';
import { Sidebar, ToastContainer } from '@/components/layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  useInitializeAuth();

  const {
    theme,
    selectedTicket,
    isMobileOpen,
    toasts,
    setSelectedTicket,
    setSelectedTicketForAnalysis,
    setIsMobileOpen,
    dismissToast,
    addToast,
  } = useUIStore();

  // Apply theme to HTML element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auth guard: redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 dark:border-t-blue-400 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white transition-colors duration-300">
        <Sidebar
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          user={user}
        />
        <TicketDetailPanel
          ticket={selectedTicket}
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onAnalyze={() => {
            setSelectedTicketForAnalysis(selectedTicket);
            setSelectedTicket(null);
            router.push('/root-cause');
          }}
          onSelectRelated={(related) => setSelectedTicket(related)}
          addToast={addToast}
        />
        <ToastContainer toasts={toasts} onClose={dismissToast} />
        {children}
      </div>
    </ErrorBoundary>
  );
}
