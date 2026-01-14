"use client";

import { useState } from 'react';
import { Globe, Sun, Moon, Languages, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Wrapper component for Button with custom variants
const Button = ({ children, variant = 'primary', icon: Icon, onClick }: any) => {
  const variants: any = {
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  
  return (
    <button 
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${variants[variant]}`}
      onClick={onClick}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </button>
  );
};

interface SettingsPageProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onLogout: () => void;
}

export const SettingsPage = ({ theme, setTheme, onLogout }: SettingsPageProps) => {
  const [language, setLanguage] = useState('English (US)');

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
       <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your profile and application preferences.</p>
       </div>

       <div className="grid gap-8">
          <section className="space-y-4">
             <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
              <Globe className="w-5 h-5 mr-2 text-slate-400" /> Preferences
            </h2>
            <Card className="divide-y divide-slate-100 dark:divide-slate-700">
               <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Theme</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Customize the application appearance</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                     <button 
                       onClick={() => setTheme('light')}
                       className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                     >
                       <Sun className="w-4 h-4"/>
                     </button>
                     <button 
                       onClick={() => setTheme('dark')}
                       className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                     >
                       <Moon className="w-4 h-4"/>
                     </button>
                  </div>
               </div>
               
               <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Language</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Select interface language</p>
                  </div>
                  <div className="flex items-center space-x-2">
                     <Languages className="w-4 h-4 text-slate-400" />
                     <select 
                       className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm rounded-md px-2 py-1 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                       value={language}
                       onChange={(e) => setLanguage(e.target.value)}
                     >
                        <option>English (US)</option>
                        <option>Spanish</option>
                        <option>French</option>
                     </select>
                  </div>
               </div>
            </Card>
          </section>
          
          <div className="flex justify-end pt-4">
             <Button variant="destructive" onClick={onLogout}>
               <LogOut className="w-4 h-4" />
               Sign Out
             </Button>
          </div>
       </div>
    </div>
  );
};
