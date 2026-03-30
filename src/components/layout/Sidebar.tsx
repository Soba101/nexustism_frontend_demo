"use client";

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Network, LayoutDashboard, Settings, Activity, X, LogOut } from 'lucide-react';
import type { User } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  user: User;
}

export const Sidebar = ({ isMobileOpen, setIsMobileOpen, user }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { addToast } = useUIStore();
  const [isClosing, setIsClosing] = useState(false);
  const [isAnimatingOpen, setIsAnimatingOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navItems = [
    { path: '/home', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/search', icon: Search, label: 'Search Tickets' },
    { path: '/root-cause', icon: Network, label: 'Root Cause Analysis' },
    { path: '/analytics', icon: Activity, label: 'Analytics' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  useEffect(() => {
    if (!isMobileOpen) {
      const timeout = window.setTimeout(() => {
        setIsAnimatingOpen(false);
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    const raf = window.requestAnimationFrame(() => {
      setIsClosing(false);
      setIsAnimatingOpen(true);
    });

    return () => window.cancelAnimationFrame(raf);
  }, [isMobileOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const requestClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setIsAnimatingOpen(false);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsClosing(false);
      setIsMobileOpen(false);
    }, 200);
  };

  const handleNavClick = (path: string) => {
    router.push(path);
    requestClose();
  };

  const sidebarContent = (
    <>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">ITSM Nexus</span>
        </div>
        <button onClick={requestClose} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full" aria-label="Close menu">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavClick(item.path)}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === item.path
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-700' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center space-x-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
            {user.avatar}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.role}</p>
          </div>
          <button
            onClick={async () => {
              await useAuthStore.getState().logout();
              addToast('Signed out successfully', 'info');
              router.push('/login');
            }}
            className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen hidden md:flex flex-col fixed left-0 top-0 transition-colors duration-300">
        {sidebarContent}
      </div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200 ${
              isMobileOpen && !isClosing && isAnimatingOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={requestClose}
          />
          <div
            className={`relative w-64 bg-slate-50 dark:bg-slate-900 h-full shadow-xl flex flex-col will-change-transform transition-transform duration-200 ease-out ${
              isMobileOpen && !isClosing && isAnimatingOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
