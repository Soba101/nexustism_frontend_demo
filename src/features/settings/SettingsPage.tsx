"use client";

import { useState, useEffect } from 'react';
import { Globe, Sun, Moon, Languages, LogOut, User, Bell, Search as SearchIcon, Gauge, Download, Type, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { storageHelper, exportToCSV } from '@/utils/helpers';
import type { UserPreferences } from '@/types';

interface SettingsPageProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onLogout: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'YYYY-MM-DD',
  defaultPage: 'search',
  itemsPerPage: 10,
  notifications: {
    showToasts: true,
    emailAlerts: false,
    desktopNotifications: false
  },
  accessibility: {
    fontSize: 16,
    reduceMotion: false,
    highContrast: false
  },
  uiDensity: 'comfortable'
};

export const SettingsPage = ({ theme, setTheme, onLogout }: SettingsPageProps) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => 
    storageHelper.get('user_preferences', DEFAULT_PREFERENCES)
  );
  
  const [profile, setProfile] = useState(() => 
    storageHelper.get('user_profile', { name: 'Admin User', email: 'admin@nexus.ai' })
  );

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    storageHelper.set('user_preferences', preferences);
    storageHelper.set('user_profile', profile);
  }, [preferences, profile]);

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const updateNotification = (key: keyof UserPreferences['notifications'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  const updateAccessibility = (key: keyof UserPreferences['accessibility'], value: any) => {
    setPreferences(prev => ({
      ...prev,
      accessibility: { ...prev.accessibility, [key]: value }
    }));
  };

  const handleExportData = () => {
    const exportData = {
      profile,
      preferences,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your profile and application preferences.</p>
      </div>

      <div className="grid gap-8">
        {/* Profile Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
            <User className="w-5 h-5 mr-2 text-slate-400" /> Profile
          </h2>
          <Card className="divide-y divide-slate-100 dark:divide-slate-700">
            <div className="p-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                💡 Changes are saved automatically to localStorage. Backend integration required for server-side persistence.
              </p>
            </div>
          </Card>
        </section>

        {/* Theme & Language */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
            <Globe className="w-5 h-5 mr-2 text-slate-400" /> Appearance & Language
          </h2>
          <Card className="divide-y divide-slate-100 dark:divide-slate-700">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Theme</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Customize the application appearance</p>
              </div>
              <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => { setTheme('light'); updatePreference('theme', 'light'); }}
                  className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Sun className="w-4 h-4"/>
                </button>
                <button 
                  onClick={() => { setTheme('dark'); updatePreference('theme', 'dark'); }}
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
                  value={preferences.language}
                  onChange={(e) => updatePreference('language', e.target.value)}
                >
                  <option value="en">English (US)</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Timezone</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Used for displaying dates and times</p>
              </div>
              <select 
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm rounded-md px-2 py-1 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                value={preferences.timezone}
                onChange={(e) => updatePreference('timezone', e.target.value)}
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Date Format</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">How dates are displayed</p>
              </div>
              <select 
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm rounded-md px-2 py-1 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                value={preferences.dateFormat}
                onChange={(e) => updatePreference('dateFormat', e.target.value as any)}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">UI Density</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Spacing between elements</p>
              </div>
              <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => updatePreference('uiDensity', 'comfortable')}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${preferences.uiDensity === 'comfortable' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}
                >
                  Comfortable
                </button>
                <button 
                  onClick={() => updatePreference('uiDensity', 'compact')}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${preferences.uiDensity === 'compact' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}
                >
                  Compact
                </button>
              </div>
            </div>
          </Card>
        </section>

        {/* Notifications */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
            <Bell className="w-5 h-5 mr-2 text-slate-400" /> Notifications
          </h2>
          <Card className="divide-y divide-slate-100 dark:divide-slate-700">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Toast Notifications</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Show in-app notification toasts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={preferences.notifications.showToasts}
                  onChange={(e) => updateNotification('showToasts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Email Alerts</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Receive email for high-priority tickets</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={preferences.notifications.emailAlerts}
                  onChange={(e) => updateNotification('emailAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Desktop Notifications</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Browser push notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={preferences.notifications.desktopNotifications}
                  onChange={(e) => updateNotification('desktopNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ⚠️ Email and desktop notifications require backend integration
              </p>
            </div>
          </Card>
        </section>

        {/* Search Preferences */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
            <SearchIcon className="w-5 h-5 mr-2 text-slate-400" /> Search Preferences
          </h2>
          <Card className="divide-y divide-slate-100 dark:divide-slate-700">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Default Landing Page</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Where you start when logging in</p>
              </div>
              <select 
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm rounded-md px-2 py-1 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                value={preferences.defaultPage}
                onChange={(e) => updatePreference('defaultPage', e.target.value as any)}
              >
                <option value="search">Search</option>
                <option value="analyze">Root Cause Analysis</option>
                <option value="dashboard">Dashboard</option>
                <option value="settings">Settings</option>
              </select>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Items Per Page</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Search results pagination</p>
              </div>
              <select 
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm rounded-md px-2 py-1 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                value={preferences.itemsPerPage}
                onChange={(e) => updatePreference('itemsPerPage', Number(e.target.value) as any)}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </Card>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
            <Eye className="w-5 h-5 mr-2 text-slate-400" /> Accessibility
          </h2>
          <Card className="divide-y divide-slate-100 dark:divide-slate-700">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Font Size</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Adjust base font size</p>
                </div>
                <Badge variant="outline">{preferences.accessibility.fontSize}px</Badge>
              </div>
              <input 
                type="range" 
                min="12" 
                max="20" 
                value={preferences.accessibility.fontSize}
                onChange={(e) => updateAccessibility('fontSize', Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>12px</span>
                <span>16px</span>
                <span>20px</span>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Reduce Motion</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Minimize animations and transitions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={preferences.accessibility.reduceMotion}
                  onChange={(e) => updateAccessibility('reduceMotion', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">High Contrast</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Increase contrast for better visibility</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={preferences.accessibility.highContrast}
                  onChange={(e) => updateAccessibility('highContrast', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </Card>
        </section>

        {/* Data Management */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
            <Download className="w-5 h-5 mr-2 text-slate-400" /> Data Management
          </h2>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Export Your Data</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Download your profile and preferences as JSON</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </Card>
        </section>

        {/* Logout */}
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button 
            variant="destructive" 
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
