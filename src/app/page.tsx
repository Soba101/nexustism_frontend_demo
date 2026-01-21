"use client";

import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuthStore, useInitializeAuth } from '@/stores/authStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WebVitalsReporter } from '@/components/WebVitalsReporter';
import type { Ticket } from '@/types';

// Import feature components
import { LoginPage } from '@/features/auth';
import { Sidebar, PageWrapper, ToastContainer } from '@/components/layout';
import { SettingsPage } from '@/features/settings';
import { SearchPage } from '@/features/search';
import { TicketDetailPanel } from '@/features/tickets';
import { DashboardPage } from '@/features/dashboard';

// Lazy load heavy features
const AnalyticsPage = lazy(() => import('@/features/analytics').then(mod => ({ default: mod.AnalyticsPage })));
const RootCauseAnalysisPage = lazy(() => import('@/features/root-cause').then(mod => ({ default: mod.RootCauseAnalysisPage })));

/**
 * Loading Spinner Component
 */
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-96">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 dark:border-t-blue-400 animate-spin"></div>
    </div>
  </div>
);

/**
 * ==========================================
 * MAIN APPLICATION COMPONENTS
 * ==========================================
 */

// 4. Root App Component
function App() {
  // Auth state from Zustand
  const { user, isLoading: authLoading } = useAuthStore();
  useInitializeAuth();

  // Local UI state
  const [activePage, setActivePage] = useState('home');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedTicketForAnalysis, setSelectedTicketForAnalysis] = useState<Ticket | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  const [toasts, setToasts] = useState<{id: number, msg: string, type: 'success' | 'info' | 'error'}[]>([]);

  // Apply theme to HTML element
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Theme setter that also updates HTML element
  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  // Toasts Helper
  const addToast = (msg: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
       setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Show loading spinner while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 dark:border-t-blue-400 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginPage />
        <ToastContainer
          toasts={toasts}
          onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white transition-colors duration-300">
        <Sidebar 
          activePage={activePage} 
          setActivePage={setActivePage} 
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          user={user}
        />
        
        {activePage === 'home' && (
          <DashboardPage
            setActivePage={setActivePage}
            onSelectIncident={setSelectedTicket}
            addToast={addToast}
          />
        )}

        {activePage === 'search' && (
          <SearchPage
            onSelectIncident={setSelectedTicket}
            setIsMobileOpen={setIsMobileOpen}
            addToast={addToast}
          />
        )}

        {activePage === 'analyze' && (
          <PageWrapper setIsMobileOpen={setIsMobileOpen}>
            <Suspense fallback={<LoadingSpinner />}>
              <RootCauseAnalysisPage 
                addToast={addToast}
                targetTicket={selectedTicketForAnalysis}
              />
            </Suspense>
          </PageWrapper>
        )}

        {activePage === 'dashboard' && (
          <PageWrapper setIsMobileOpen={setIsMobileOpen}>
            <Suspense fallback={<LoadingSpinner />}>
              <AnalyticsPage addToast={addToast} />
            </Suspense>
          </PageWrapper>
        )}

        {activePage === 'settings' && (
          <PageWrapper setIsMobileOpen={setIsMobileOpen}>
            <SettingsPage theme={theme} setTheme={setTheme} onLogout={async () => { 
              try {
                await useAuthStore.getState().logout();
                addToast('Logged out successfully', 'info');
              } catch {
                addToast('Failed to logout', 'error');
              }
            }} />
          </PageWrapper>
        )}

        <TicketDetailPanel
          ticket={selectedTicket}
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onAnalyze={() => {
            setSelectedTicketForAnalysis(selectedTicket);
            setSelectedTicket(null);
            setActivePage('analyze');
          }}
          onSelectRelated={(related: Ticket) => setSelectedTicket(related)}
          addToast={addToast}
        />

        <ToastContainer
          toasts={toasts}
          onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
        />
      </div>
    );
  }

// Wrap App with Error Boundary
export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <WebVitalsReporter />
      <App />
    </ErrorBoundary>
  );
}
