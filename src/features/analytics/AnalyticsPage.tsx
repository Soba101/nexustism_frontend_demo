'use client';

import { useMemo, useState } from 'react';
import { 
  Calendar, Download, FileText, Clock, Search, ArrowUpRight, ArrowDownRight,
  TrendingUp, PieChart, Activity, BarChart3, Target, Users, Zap, AlertTriangle,
  CheckCircle2, RefreshCw, TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AreaChart, SimpleLineChart, DonutChart, GaugeChart, Heatmap, FunnelChartComponent, StackedBarChart } from '@/components/charts';
import { exportToCSV } from '@/utils';
import { MOCK_TICKETS } from '@/data/mockTickets';

interface AnalyticsPageProps {
  addToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const AnalyticsPage = ({ addToast }: AnalyticsPageProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Calculate advanced metrics from MOCK_TICKETS
  const analytics = useMemo(() => {
    const total = MOCK_TICKETS.length;
    const resolved = MOCK_TICKETS.filter(t => t.state === 'Resolved' || t.state === 'Closed').length;
    const inProgress = MOCK_TICKETS.filter(t => t.state === 'In Progress').length;
    const newTickets = MOCK_TICKETS.filter(t => t.state === 'New').length;
    
    // SLA Compliance (mock calculation)
    const slaCompliance = Math.round((resolved / total) * 100 * 1.2); // Mock boost
    
    // Team performance
    const teamData = [
      { team: 'Network Operations', resolved: 2, inProgress: 1, new: 1 },
      { team: 'Service Desk L2', resolved: 0, inProgress: 1, new: 0 },
      { team: 'SAP Basis', resolved: 0, inProgress: 0, new: 1 },
      { team: 'Field Services', resolved: 0, inProgress: 0, new: 1 },
      { team: 'Service Desk L1', resolved: 0, inProgress: 0, new: 1 },
    ];

    // Repeat issues
    const categoryCount: Record<string, number> = {};
    MOCK_TICKETS.forEach(t => {
      categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    });
    const repeatIssues = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Ticket lifecycle funnel
    const funnelData = [
      { name: 'Submitted', value: total, fill: '#3b82f6' },
      { name: 'Assigned', value: total - 1, fill: '#8b5cf6' },
      { name: 'In Progress', value: inProgress + resolved, fill: '#f59e0b' },
      { name: 'Resolved', value: resolved, fill: '#10b981' },
    ];

    // Heatmap data (mock - tickets by day/hour)
    const heatmapData = [
      { day: 'Mon', hour: 8, value: 5 },
      { day: 'Mon', hour: 9, value: 12 },
      { day: 'Mon', hour: 10, value: 8 },
      { day: 'Mon', hour: 14, value: 6 },
      { day: 'Tue', hour: 9, value: 15 },
      { day: 'Tue', hour: 10, value: 10 },
      { day: 'Tue', hour: 11, value: 7 },
      { day: 'Wed', hour: 8, value: 8 },
      { day: 'Wed', hour: 9, value: 18 },
      { day: 'Wed', hour: 13, value: 9 },
      { day: 'Thu', hour: 9, value: 14 },
      { day: 'Thu', hour: 10, value: 11 },
      { day: 'Thu', hour: 15, value: 8 },
      { day: 'Fri', hour: 8, value: 6 },
      { day: 'Fri', hour: 9, value: 16 },
      { day: 'Fri', hour: 16, value: 12 },
    ];

    // First response time (mock)
    const avgFirstResponse = 23; // minutes

    return {
      total,
      resolved,
      inProgress,
      newTickets,
      slaCompliance,
      teamData,
      repeatIssues,
      funnelData,
      heatmapData,
      avgFirstResponse
    };
  }, []);

  const handleExport = () => {
    const exportData = {
      summary: {
        total: analytics.total,
        resolved: analytics.resolved,
        sla_compliance: analytics.slaCompliance,
        avg_first_response: analytics.avgFirstResponse
      },
      teams: analytics.teamData,
      categories: analytics.repeatIssues
    };
    exportToCSV([exportData], `analytics_${selectedPeriod}_${Date.now()}.csv`);
    addToast('Analytics report exported successfully', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Team performance, SLA tracking, and operational insights.</p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          {/* Period Selector */}
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {period === '7d' ? 'Last 7 Days' : period === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="default" size="sm" onClick={() => addToast('Data refreshed successfully', 'success')}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{analytics.total}</p>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
        </Card>

        <Card className="p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="flex items-center text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full whitespace-nowrap">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +18%
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">Resolved</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{analytics.resolved}</p>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl"></div>
        </Card>

        <Card className="p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="flex items-center text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full whitespace-nowrap">
              <TrendingDown className="w-3 h-3 mr-1" /> -15%
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">Avg Response Time</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{analytics.avgFirstResponse}m</p>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
        </Card>

        <Card className="p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="flex items-center text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full whitespace-nowrap">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +5%
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">SLA Compliance</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{analytics.slaCompliance}%</p>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>
        </Card>
      </div>

      {/* SLA Gauge + Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
              <Target className="w-4 h-4 mr-2 text-orange-500"/> SLA Compliance Tracker
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Percentage of tickets resolved within SLA</p>
          </div>
          <GaugeChart value={analytics.slaCompliance} label="SLA Met" thresholds={{ good: 90, warning: 75 }} />
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.resolved}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Within SLA</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{analytics.inProgress}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">At Risk</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">0</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Breached</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-500"/> Team Performance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ticket distribution by assignment group</p>
          </div>
          <StackedBarChart 
            data={analytics.teamData}
            onClick={(team) => addToast(`Filtering by ${team}...`, 'info')}
          />
        </Card>
      </div>

      {/* Time Heatmap */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
            <Zap className="w-4 h-4 mr-2 text-yellow-500"/> Ticket Volume Heatmap
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Peak hours and days for incident reporting</p>
        </div>
        <Heatmap 
          data={analytics.heatmapData}
          onClick={(cell) => addToast(`${cell.day} ${cell.hour}:00 - ${cell.value} tickets`, 'info')}
        />
      </Card>

      {/* Ticket Lifecycle Funnel + Repeat Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
              <Activity className="w-4 h-4 mr-2 text-purple-500"/> Ticket Lifecycle Funnel
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Track tickets through each stage of resolution</p>
          </div>
          <div className="h-80">
            <FunnelChartComponent 
              data={analytics.funnelData}
              onClick={(data) => addToast(`${data.name}: ${data.value} tickets`, 'info')}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 dark:text-slate-400">Conversion Rate</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {((analytics.resolved / analytics.total) * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Drop-off</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {analytics.total - analytics.resolved}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-red-500"/> Top Repeat Issues
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Most frequently reported problem categories</p>
          </div>
          <div className="space-y-4">
            {analytics.repeatIssues.map((issue, index) => {
              const percentage = (issue.count / analytics.total) * 100;
              const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-purple-500'];
              
              return (
                <div key={issue.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white w-4">#{index + 1}</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{issue.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{issue.count} tickets</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white min-w-[3rem] text-right">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors[index % colors.length]} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => addToast('Generating knowledge base recommendations...', 'info')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate KB Articles
            </Button>
          </div>
        </Card>
      </div>

      {/* Original Charts - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
           <div className="flex items-center justify-between mb-6">
             <div>
               <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                 <TrendingUp className="w-4 h-4 mr-2 text-blue-500"/> Ticket Volume Trend
               </h3>
               <p className="text-xs text-slate-500">Daily ticket submissions (14-day rolling)</p>
             </div>
           </div>
           <div className="h-64 w-full">
              <SimpleLineChart 
                data={[40, 55, 45, 60, 50, 75, 85, 70, 65, 80, 95, 70, 60, 50]} 
                color="#3b82f6"
                labels={['Jan 1', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5', 'Jan 6', 'Jan 7', 'Jan 8', 'Jan 9', 'Jan 10', 'Jan 11', 'Jan 12', 'Jan 13', 'Jan 14']}
                onClick={(data, index) => addToast(`${data.day}: ${data.value} tickets`, 'info')}
              />
           </div>
        </Card>

        <Card className="p-6">
           <div className="flex items-center justify-between mb-6">
             <div>
               <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                 <PieChart className="w-4 h-4 mr-2 text-purple-500"/> Priority Breakdown
               </h3>
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
                  onClick={(data, index) => addToast(`${data.label}: ${data.value}%`, 'info')}
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
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-green-500"/> Resolution Time Trends
                </h3>
                <p className="text-xs text-slate-500">Average hours to resolution (14 Day Trend)</p>
              </div>
            </div>
            <div className="h-64 w-full">
               <AreaChart 
                 data={[4.5, 4.2, 4.0, 3.8, 3.5, 3.2, 3.0, 2.8, 2.9, 2.7, 2.6, 2.5, 2.4, 2.3]} 
                 color="#10b981"
                 labels={['Jan 1', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5', 'Jan 6', 'Jan 7', 'Jan 8', 'Jan 9', 'Jan 10', 'Jan 11', 'Jan 12', 'Jan 13', 'Jan 14']}
                 onClick={(data, index) => addToast(`${data.day}: ${data.value} hours avg resolution`, 'info')}
               />
            </div>
         </Card>
      </div>
    </div>
  );
};
