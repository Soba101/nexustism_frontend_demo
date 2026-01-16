'use client';

import { useState } from 'react';
import {
  Calendar, Download, FileText, Clock, Search, ArrowUpRight, ArrowDownRight,
  TrendingUp, PieChart, Activity, BarChart3, Target, Users, Zap, AlertTriangle,
  CheckCircle2, RefreshCw, TrendingDown, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AreaChart, SimpleLineChart, DonutChart, GaugeChart, Heatmap, FunnelChartComponent, StackedBarChart } from '@/components/charts';
import { exportToCSV } from '@/utils';
import {
  useAnalyticsMetrics,
  useAnalyticsVolume,
  useAnalyticsTeamPerformance,
  useAnalyticsHeatmap,
  useAnalyticsPriorityBreakdown,
  useAnalyticsSLACompliance,
} from '@/services/api';

interface AnalyticsPageProps {
  addToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const AnalyticsPage = ({ addToast }: AnalyticsPageProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch all analytics data from API
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useAnalyticsMetrics(selectedPeriod);
  const { data: volume, isLoading: volumeLoading, refetch: refetchVolume } = useAnalyticsVolume(selectedPeriod);
  const { data: teamPerformance, isLoading: teamLoading, refetch: refetchTeam } = useAnalyticsTeamPerformance();
  const { data: heatmapData, isLoading: heatmapLoading, refetch: refetchHeatmap } = useAnalyticsHeatmap(selectedPeriod);
  const { data: priorityBreakdown, isLoading: priorityLoading, refetch: refetchPriority } = useAnalyticsPriorityBreakdown();
  const { data: slaData, isLoading: slaLoading, refetch: refetchSLA } = useAnalyticsSLACompliance();

  const isLoading = metricsLoading || volumeLoading || teamLoading || heatmapLoading || priorityLoading || slaLoading;

  // Transform data for charts
  const totalTickets = metrics?.totalTickets ?? 0;
  const resolvedTickets = metrics?.resolvedTickets ?? 0;
  const avgResolutionTime = metrics?.avgResolutionTime ?? 0;
  const slaCompliance = slaData?.overall ?? 0;

  // Team performance for stacked bar chart
  const teamData = (teamPerformance ?? []).map((t: any) => ({
    team: t.name,
    resolved: t.resolved ?? 0,
    inProgress: t.inProgress ?? 0,
    new: t.new ?? 0,
  }));

  // Priority breakdown for donut chart
  const priorityData = priorityBreakdown ? Object.entries(priorityBreakdown).map(([label, value]) => {
    const colors: Record<string, string> = {
      'Critical': '#ef4444',
      'High': '#f97316',
      'Medium': '#eab308',
      'Low': '#22c55e',
      '1 - Critical': '#ef4444',
      '2 - High': '#f97316',
      '3 - Moderate': '#eab308',
      '4 - Low': '#22c55e',
    };
    return { label, value: value as number, color: colors[label] || '#6b7280' };
  }) : [];

  // Calculate totals from priority breakdown for repeat issues
  const repeatIssues = priorityData.map(p => ({ category: p.label, count: p.value }));
  const priorityTotal = priorityData.reduce((sum, p) => sum + p.value, 0);

  // Volume data for line chart
  const volumeLabels = (volume ?? []).map((v: any) => v.date?.slice(5) ?? ''); // MM-DD format
  const volumeValues = (volume ?? []).map((v: any) => v.count ?? 0);

  // Heatmap transformation
  const heatmapForChart = (heatmapData ?? []).map((h: any) => ({
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][h.day] ?? 'Mon',
    hour: h.hour ?? 9,
    value: h.count ?? 0,
  }));

  // Funnel data
  const inProgressTickets = totalTickets - resolvedTickets;
  const funnelData = [
    { name: 'Submitted', value: totalTickets, fill: '#3b82f6' },
    { name: 'Assigned', value: Math.max(0, totalTickets - 1), fill: '#8b5cf6' },
    { name: 'In Progress', value: inProgressTickets + resolvedTickets, fill: '#f59e0b' },
    { name: 'Resolved', value: resolvedTickets, fill: '#10b981' },
  ];

  const handleExport = () => {
    const exportData = {
      summary: {
        total: totalTickets,
        resolved: resolvedTickets,
        sla_compliance: slaCompliance,
        avg_resolution_time: avgResolutionTime
      },
      teams: teamData,
      priorities: priorityBreakdown
    };
    exportToCSV([exportData], `analytics_${selectedPeriod}_${Date.now()}.csv`);
    addToast('Analytics report exported successfully', 'success');
  };

  const handleRefresh = () => {
    refetchMetrics();
    refetchVolume();
    refetchTeam();
    refetchHeatmap();
    refetchPriority();
    refetchSLA();
    addToast('Data refreshed successfully', 'success');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-500 dark:text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

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
          <Button variant="default" size="sm" onClick={handleRefresh}>
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
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{totalTickets.toLocaleString()}</p>
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
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{resolvedTickets.toLocaleString()}</p>
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
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">Avg Resolution Time</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{avgResolutionTime}m</p>
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
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{slaCompliance}%</p>
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
          <GaugeChart value={slaCompliance} label="SLA Met" thresholds={{ good: 90, warning: 75 }} />
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{resolvedTickets.toLocaleString()}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Within SLA</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{inProgressTickets.toLocaleString()}</p>
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
          {teamData.length > 0 ? (
            <StackedBarChart
              data={teamData}
              onClick={(team) => addToast(`Filtering by ${team}...`, 'info')}
            />
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400">No team data available</div>
          )}
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
        {heatmapForChart.length > 0 ? (
          <Heatmap
            data={heatmapForChart}
            onClick={(cell) => addToast(`${cell.day} ${cell.hour}:00 - ${cell.value} tickets`, 'info')}
          />
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-400">No heatmap data available</div>
        )}
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
              data={funnelData}
              onClick={(data) => addToast(`${data.name}: ${data.value} tickets`, 'info')}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 dark:text-slate-400">Conversion Rate</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Drop-off</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {(totalTickets - resolvedTickets).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-red-500"/> Priority Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tickets by priority level</p>
          </div>
          <div className="space-y-4">
            {repeatIssues.length > 0 ? repeatIssues.map((issue, index) => {
              const percentage = priorityTotal > 0 ? (issue.count / priorityTotal) * 100 : 0;
              const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500'];

              return (
                <div key={issue.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white w-4">#{index + 1}</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{issue.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{issue.count.toLocaleString()} tickets</span>
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
            }) : (
              <div className="h-48 flex items-center justify-center text-slate-400">No priority data available</div>
            )}
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

      {/* Volume Trend + Priority Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
           <div className="flex items-center justify-between mb-6">
             <div>
               <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                 <TrendingUp className="w-4 h-4 mr-2 text-blue-500"/> Ticket Volume Trend
               </h3>
               <p className="text-xs text-slate-500">Daily ticket submissions</p>
             </div>
           </div>
           <div className="h-64 w-full">
             {volumeValues.length > 0 ? (
               <SimpleLineChart
                 data={volumeValues}
                 color="#3b82f6"
                 labels={volumeLabels}
                 onClick={(data, index) => addToast(`${volumeLabels[index]}: ${volumeValues[index]} tickets`, 'info')}
               />
             ) : (
               <div className="h-full flex items-center justify-center text-slate-400">No volume data available</div>
             )}
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
                {priorityData.length > 0 ? (
                  <>
                    <DonutChart
                      data={priorityData.map(p => ({ ...p, value: priorityTotal > 0 ? Math.round((p.value / priorityTotal) * 100) : 0 }))}
                      onClick={(data, index) => addToast(`${data.label}: ${data.value}%`, 'info')}
                    />
                    <div className="space-y-3 hidden sm:block">
                      {priorityData.map((item) => {
                        const percentage = priorityTotal > 0 ? Math.round((item.value / priorityTotal) * 100) : 0;
                        return (
                          <div key={item.label} className="flex items-center text-sm">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                            <span className="text-slate-600 dark:text-slate-400 w-24 truncate">{item.label}</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400">No priority data available</div>
                )}
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
                <p className="text-xs text-slate-500">Average hours to resolution</p>
              </div>
            </div>
            <div className="h-64 w-full">
               <AreaChart
                 data={[4.5, 4.2, 4.0, 3.8, 3.5, 3.2, 3.0, 2.8, 2.9, 2.7, 2.6, 2.5, 2.4, 2.3]}
                 color="#10b981"
                 labels={['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9', 'Day 10', 'Day 11', 'Day 12', 'Day 13', 'Day 14']}
                 onClick={(data, index) => addToast(`Day ${index + 1}: ${data.value ?? data} hours avg resolution`, 'info')}
               />
            </div>
         </Card>
      </div>
    </div>
  );
};
