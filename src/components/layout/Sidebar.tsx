"use client";

import { Search, Network, LayoutDashboard, Settings, Activity, X } from 'lucide-react';
import type { User } from '@/types';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  user: User;
}

export const Sidebar = ({ activePage, setActivePage, isMobileOpen, setIsMobileOpen, user }: SidebarProps) => {
  const navItems = [
    { id: 'home', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'search', icon: Search, label: 'Search Tickets' },
    { id: 'analyze', icon: Network, label: 'Root Cause Analysis' },
    { id: 'dashboard', icon: Activity, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleNavClick = (pageId: string) => {
    setActivePage(pageId);
    setIsMobileOpen(false);
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
        <button onClick={() => setIsMobileOpen(false)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full" aria-label="Close menu">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activePage === item.id 
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
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <div className="relative w-64 bg-slate-50 dark:bg-slate-900 h-full shadow-xl flex flex-col animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
