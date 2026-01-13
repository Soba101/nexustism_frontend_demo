'use client';

import { 
  Calendar, Download, FileText, Clock, Search, ArrowUpRight, ArrowDownRight,
  TrendingUp, PieChart, Activity, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AreaChart, SimpleLineChart, DonutChart } from '@/components/charts';
import { exportToCSV } from '@/utils';

interface AnalyticsPageProps {
  addToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const AnalyticsPage = ({ addToast }: AnalyticsPageProps) => {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Team performance and search adoption metrics.</p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
           <div className="hidden sm:flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm">
              <Calendar className="w-4 h-4 text-slate-400 mr-2"/>
              <span className="text-slate-700 dark:text-slate-300">Last 30 Days</span>
           </div>
           <Button variant="outline" size="sm" onClick={() => {
              exportToCSV([{ total: 1284, resolution_time: '2.5hrs', adoption: '84%' }], 'analytics_report.csv');
              addToast('Downloading report...', 'success');
           }}>
             <Download className="w-4 h-4" />
             Export
           </Button>
           <Button variant="default" size="sm" onClick={() => addToast('Data refreshed successfully', 'success')}>Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="flex items-center text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full whitespace-nowrap">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +12%
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">Total Tickets</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">1,284</p>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
        </Card>

        <Card className="p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="flex items-center text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full whitespace-nowrap">
              <ArrowDownRight className="w-3 h-3 mr-1" /> -45m
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">Avg Resolution Time</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">2.5 hrs</p>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
        </Card>

        <Card className="p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Search className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="flex items-center text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full whitespace-nowrap">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +8%
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">Search Adoption</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">84%</p>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
           <div className="flex items-center justify-between mb-6">
             <div>
               <h3 className="font-semibold text-slate-900 dark:text-white flex items-center"><TrendingUp className="w-4 h-4 mr-2 text-blue-500"/> Ticket Volume Trend</h3>
               <p className="text-xs text-slate-500">Daily ticket volume over current month</p>
             </div>
           </div>
           <div className="h-64 w-full">
              <SimpleLineChart 
                data={[40, 55, 45, 60, 50, 75, 85, 70, 65, 80, 95, 70, 60, 50]} 
                color="#3b82f6" 
              />
           </div>
        </Card>

        <Card className="p-6">
           <div className="flex items-center justify-between mb-6">
             <div>
               <h3 className="font-semibold text-slate-900 dark:text-white flex items-center"><PieChart className="w-4 h-4 mr-2 text-purple-500"/> Priority Breakdown</h3>
               <p className="text-xs text-slate-500">Distribution by urgency level</p>
             </div>
           </div>
           <div className="flex items-center justify-center h-64 overflow-hidden">
              <div className="flex items-center gap-8 flex-wrap justify-center">
                <DonutChart 
                  data={[
                    { label: 'Critical', value: 15, color: '#ef4444' },
                    { label: 'High', value: 35, color: '#f97316' },
                    { label: 'Medium', value: 30, color: '#eab308' },
                    { label: 'Low', value: 20, color: '#22c55e' },
                  ]}
                />
                <div className="space-y-3 hidden sm:block">
                  {[
                    { label: 'Critical', value: '15%', color: 'bg-red-500' },
                    { label: 'High', value: '35%', color: 'bg-orange-500' },
                    { label: 'Medium', value: '30%', color: 'bg-yellow-500' },
                    { label: 'Low', value: '20%', color: 'bg-green-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center text-sm">
                      <div className={`w-3 h-3 rounded-full ${item.color} mr-2`} />
                      <span className="text-slate-600 dark:text-slate-400 w-16">{item.label}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </Card>
      </div>

      {/* Resolution Time Trend */}
      <div className="grid grid-cols-1">
         <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center"><Activity className="w-4 h-4 mr-2 text-green-500"/> Resolution Time Trends</h3>
                <p className="text-xs text-slate-500">Average hours to resolution (14 Day Trend)</p>
              </div>
            </div>
            <div className="h-64 w-full">
               <AreaChart 
                 data={[4.5, 4.2, 4.0, 3.8, 3.5, 3.2, 3.0, 2.8, 2.9, 2.7, 2.6, 2.5, 2.4, 2.3]} 
                 color="#10b981" 
               />
            </div>
         </Card>
      </div>

      {/* Category Distribution */}
      <div className="grid grid-cols-1">
         <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center"><BarChart3 className="w-4 h-4 mr-2 text-slate-400"/> Category Distribution</h3>
            </div>
            <div className="space-y-4">
               {[
                 { label: 'Hardware', val: 35, color: 'bg-red-500' },
                 { label: 'Network', val: 28, color: 'bg-blue-500' },
                 { label: 'Software', val: 22, color: 'bg-green-500' },
                 { label: 'Access', val: 15, color: 'bg-orange-500' },
                 { label: 'Database', val: 10, color: 'bg-purple-500' },
               ].map((item) => (
                 <div key={item.label} className="relative">
                   <div className="flex justify-between text-sm mb-1 z-10 relative">
                     <span className="text-slate-700 dark:text-slate-300 font-medium">{item.label}</span>
                     <span className="text-slate-500 dark:text-slate-400">{item.val}%</span>
                   </div>
                   <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                     <div className={`h-full ${item.color} bg-opacity-80`} style={{ width: `${item.val}%` }}></div>
                   </div>
                 </div>
               ))}
             </div>
         </Card>
      </div>
    </div>
  );
};
