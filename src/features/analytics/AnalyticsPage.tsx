
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  FileText,
  Clock,
  TrendingUp,
  PieChart,
  Activity,
  Target,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Copy,
  Brain,
  Database,
  Server,
  ShieldCheck,
  GitBranch,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  LineChart as RechartsLineChart,
  Line,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AreaChart, SimpleLineChart, DonutChart, GaugeChart, Heatmap, FunnelChartComponent, StackedBarChart } from '@/components/charts';
import { exportToCSV } from '@/utils';
import {
  useAnalyticsMetrics,
  useAnalyticsVolume,
  useAnalyticsTeamPerformance,
  useAnalyticsHeatmap,
  useAnalyticsPriorityBreakdown,
  useAnalyticsSLACompliance,
  useAnalyticsDuplicates,
  useAnalyticsIsolation,
  useAnalyticsModelAccuracy,
  useAnalyticsSystemBreakdown,
  useAnalyticsProblemTickets,
  useAnalyticsTeamWorkflow,
  useAnalyticsPredictions,
  useAnalyticsRootCauses,
} from '@/services';
import type { AnalyticsPeriod } from '@/types';

interface AnalyticsPageProps {
  addToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'ticket-intelligence', label: 'Ticket Intelligence' },
  { value: 'ai-performance', label: 'AI Performance' },
  { value: 'systems-teams', label: 'Systems & Teams' },
  { value: 'predictions', label: 'Predictions' },
];

export const AnalyticsPage = ({ addToast }: AnalyticsPageProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('30d');
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'overview';
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return TABS.some((item) => item.value === tab) ? (tab as string) : 'overview';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === activeTab) return;
    params.set('tab', activeTab);
    const query = params.toString();
    const next = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, '', next);
  }, [activeTab]);

  const periodDays = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;

  // Fetch all analytics data from API
  const { data: metrics, isLoading: metricsLoading, isError: metricsError, refetch: refetchMetrics } = useAnalyticsMetrics(selectedPeriod);
  const { data: volume, isLoading: volumeLoading, isError: volumeError, refetch: refetchVolume } = useAnalyticsVolume(selectedPeriod);
  const { data: teamPerformance, isLoading: teamLoading, isError: teamError, refetch: refetchTeam } = useAnalyticsTeamPerformance(selectedPeriod);
  const { data: heatmapData, isLoading: heatmapLoading, isError: heatmapError, refetch: refetchHeatmap } = useAnalyticsHeatmap(selectedPeriod);
  const { data: priorityBreakdown, isLoading: priorityLoading, isError: priorityError, refetch: refetchPriority } = useAnalyticsPriorityBreakdown(selectedPeriod);
  const { data: slaData, isLoading: slaLoading, isError: slaError, refetch: refetchSLA } = useAnalyticsSLACompliance(selectedPeriod);

  const { data: duplicates, isLoading: duplicatesLoading, isError: duplicatesError, refetch: refetchDuplicates } = useAnalyticsDuplicates(selectedPeriod);
  const { data: isolation, isLoading: isolationLoading, isError: isolationError, refetch: refetchIsolation } = useAnalyticsIsolation(selectedPeriod);
  const { data: modelAccuracy, isLoading: modelLoading, isError: modelError, refetch: refetchModel } = useAnalyticsModelAccuracy(selectedPeriod);
  const { data: systems, isLoading: systemsLoading, isError: systemsError, refetch: refetchSystems } = useAnalyticsSystemBreakdown(selectedPeriod);
  const { data: problemTickets, isLoading: problemLoading, isError: problemError, refetch: refetchProblem } = useAnalyticsProblemTickets(selectedPeriod);
  const { data: teamWorkflow, isLoading: workflowLoading, isError: workflowError, refetch: refetchWorkflow } = useAnalyticsTeamWorkflow(selectedPeriod);
  const { data: predictions, isLoading: predictionsLoading, isError: predictionsError, refetch: refetchPredictions } = useAnalyticsPredictions(selectedPeriod);
  const { data: rootCauses, isLoading: rootLoading, isError: rootError, refetch: refetchRoot } = useAnalyticsRootCauses(selectedPeriod);

  const isLoading =
    metricsLoading ||
    volumeLoading ||
    teamLoading ||
    heatmapLoading ||
    priorityLoading ||
    slaLoading ||
    duplicatesLoading ||
    isolationLoading ||
    modelLoading ||
    systemsLoading ||
    problemLoading ||
    workflowLoading ||
    predictionsLoading ||
    rootLoading;

  const hasError =
    metricsError ||
    volumeError ||
    teamError ||
    heatmapError ||
    priorityError ||
    slaError ||
    duplicatesError ||
    isolationError ||
    modelError ||
    systemsError ||
    problemError ||
    workflowError ||
    predictionsError ||
    rootError;

  // Transform data for charts
  const totalTickets = metrics?.totalTickets ?? 0;
  const resolvedTickets = metrics?.resolvedTickets ?? 0;
  const avgResolutionTime = metrics?.avgResolutionTime ?? 0;
  const slaComplianceRaw = slaData?.overall ?? 0;
  const slaComplianceValue = totalTickets > 0 ? slaComplianceRaw : 0;
  const slaComplianceDisplay = totalTickets > 0 ? `${Math.round(slaComplianceValue * 10) / 10}%` : 'N/A';
  const avgResolutionTimeDisplay = totalTickets > 0 ? `${avgResolutionTime}m` : 'N/A';
  const suppressCharts = !!metrics && metrics.totalTickets === 0 && !metricsError;

  // Team performance for stacked bar chart
  const rawTeamData = (teamPerformance ?? []).map((t) => ({
    team: t.name,
    resolved: t.resolved ?? 0,
    inProgress: t.inProgress ?? 0,
    new: t.new ?? 0,
  }));
  const teamData = suppressCharts ? [] : rawTeamData;

  const teamTotals = teamData.reduce(
    (acc, team) => ({
      resolved: acc.resolved + team.resolved,
      inProgress: acc.inProgress + team.inProgress,
      new: acc.new + team.new,
    }),
    { resolved: 0, inProgress: 0, new: 0 }
  );
  const clampedResolved = Math.min(resolvedTickets, totalTickets);
  const derivedNewTickets = Math.min(teamTotals.new, Math.max(0, totalTickets - clampedResolved));
  const assignedTickets = Math.max(0, totalTickets - derivedNewTickets);
  const remainingAfterResolved = Math.max(0, assignedTickets - clampedResolved);
  const inProgressTickets = teamTotals.inProgress > 0
    ? Math.min(teamTotals.inProgress, remainingAfterResolved)
    : remainingAfterResolved;

  // Priority breakdown for donut chart
  const rawPriorityData = priorityBreakdown ? Object.entries(priorityBreakdown).map(([label, value]) => {
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
  const priorityData = suppressCharts ? [] : rawPriorityData;

  // Calculate totals from priority breakdown for repeat issues
  const repeatIssues = priorityData.map(p => ({ category: p.label, count: p.value }));
  const priorityTotal = priorityData.reduce((sum, p) => sum + p.value, 0);

  const fallbackVolume = useMemo(() => {
    const base = new Date();
    const days = Math.min(periodDays, 30);
    const values = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date(base);
      date.setDate(base.getDate() - i);
      values.push({
        date: date.toISOString().slice(0, 10),
        count: 120 + ((days - i) % 7) * 5,
      });
    }
    return values;
  }, [periodDays]);

  const volumeSeriesBase = (volume && volume.length > 0) ? volume : (volumeError ? fallbackVolume : []);
  const volumeSeries = suppressCharts ? [] : volumeSeriesBase;
  const showVolumeFallback = volumeError && !suppressCharts;

  // Volume data for line chart
  const volumeLabels = volumeSeries.map((v) => v.date?.slice(5) ?? ''); // MM-DD format
  const volumeValues = volumeSeries.map((v) => v.count ?? 0);

  const fallbackHeatmap = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const cells = [];
    for (let d = 0; d < days.length; d += 1) {
      for (let h = 0; h < 24; h += 1) {
        const isPeak = h >= 9 && h <= 17;
        const base = isPeak ? 6 : 2;
        const value = base + ((d + h) % 4);
        cells.push({ day: days[d], hour: h, value });
      }
    }
    return cells;
  }, []);

  const heatmapForChart = (heatmapData ?? []).map((h) => ({
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][h.day] ?? 'Mon',
    hour: h.hour ?? 9,
    value: h.count ?? 0,
  }));
  const heatmapSeriesBase = heatmapForChart.length > 0 ? heatmapForChart : (heatmapError ? fallbackHeatmap : []);
  const heatmapSeries = suppressCharts ? [] : heatmapSeriesBase;
  const showHeatmapFallback = heatmapError && !suppressCharts;

  const resolutionTrendSeries = useMemo(() => {
    if (!avgResolutionTime || totalTickets === 0) return [];
    const points = volumeSeries.length > 0 ? volumeSeries.length : Math.min(periodDays, 14);
    return Array.from({ length: points }, () => avgResolutionTime);
  }, [avgResolutionTime, totalTickets, volumeSeries.length, periodDays]);

  const resolutionLabels = volumeSeries.length > 0
    ? volumeLabels
    : resolutionTrendSeries.map((_, index) => `Day ${index + 1}`);

  const showResolutionFallback = avgResolutionTime > 0 && volumeSeries.length === 0;

  // Funnel data
  const funnelData = [
    { name: 'Submitted', value: totalTickets, fill: '#3b82f6' },
    { name: 'Assigned', value: assignedTickets, fill: '#8b5cf6' },
    { name: 'In Progress', value: inProgressTickets, fill: '#f59e0b' },
    { name: 'Resolved', value: clampedResolved, fill: '#10b981' },
  ];

  const duplicateTrendValues = duplicates?.trend?.map((point) => Math.round(point.duplicate_rate * 1000) / 10) ?? [];
  const duplicateTrendLabels = duplicates?.trend?.map((point) => point.date.slice(5)) ?? [];
  const duplicateRateDisplay = duplicates ? `${(duplicates.duplicate_rate * 100).toFixed(1)}%` : 'N/A';
  const duplicateClusterDisplay = duplicates?.cluster_count?.toLocaleString() ?? '0';
  const duplicateAvgSizeDisplay = duplicates?.avg_cluster_size?.toFixed(1) ?? '0';

  const isolationTrendValues = isolation?.trend?.map((point) => Math.round(point.isolation_rate * 1000) / 10) ?? [];
  const isolationTrendLabels = isolation?.trend?.map((point) => point.date.slice(5)) ?? [];
  const isolationRateDisplay = isolation ? `${(isolation.isolation_rate * 100).toFixed(1)}%` : 'N/A';
  const isolatedCountDisplay = isolation?.isolated_count?.toLocaleString() ?? '0';

  const problemCategoryData = (problemTickets?.by_category ?? []).map((item) => {
    const colorMap: Record<string, string> = {
      Configuration: '#6366f1',
      Capacity: '#22c55e',
      'Change Management': '#f97316',
      'Known Error': '#ef4444',
      'Third Party': '#0ea5e9',
      Unknown: '#94a3b8',
    };
    return { label: item.category, value: item.count, color: colorMap[item.category] || '#6b7280' };
  });
  const problemCategoryTotal = problemCategoryData.reduce((sum, item) => sum + item.value, 0);

  const problemLifecycleSeries = problemTickets?.lifecycle_trend ?? [];

  const modelHistogram = modelAccuracy?.similarity_histogram ?? [];
  const highConfidenceDisplay = modelAccuracy ? `${(modelAccuracy.high_confidence_rate * 100).toFixed(1)}%` : 'N/A';
  const falsePositiveDisplay = modelAccuracy ? `${(modelAccuracy.false_positive_rate * 100).toFixed(1)}%` : 'N/A';

  const graphFeedbackSeries = modelAccuracy?.graph_feedback ?? [];

  const systemsData = (systems?.systems ?? []).slice().sort((a, b) => b.ticket_count - a.ticket_count);
  const systemsBarData = systemsData.slice(0, 6);
  const systemsTop = systemsData.slice(0, 5);

  const teamWorkflowData = teamWorkflow?.team_load ?? [];
  const escalationPaths = teamWorkflow?.escalation_paths ?? [];
  const responseTimeHistogram = teamWorkflow?.response_time_histogram ?? [];
  const firstTouchRateDisplay = teamWorkflow ? `${(teamWorkflow.first_touch_rate * 100).toFixed(1)}%` : 'N/A';

  const predictionForecast = predictions?.forecast ?? [];
  const emergingClusters = predictions?.emerging_clusters ?? [];
  const seasonalPatterns = predictions?.seasonal_patterns ?? [];
  const seasonalHeatmap = seasonalPatterns.map((pattern) => ({
    day: pattern.day,
    hour: pattern.hour,
    value: pattern.count,
  }));

  const rootCauseCoverageDisplay = rootCauses ? `${(rootCauses.coverage_pct * 100).toFixed(1)}%` : 'N/A';
  const changeRelatedDisplay = rootCauses ? `${(rootCauses.change_related_pct * 100).toFixed(1)}%` : 'N/A';
  const rootCauseDepthSeries = rootCauses?.graph_depth_histogram ?? [];

  const mttrHours = systemsData.length
    ? systemsData.reduce((sum, item) => sum + item.avg_resolution_hours, 0) / systemsData.length
    : 0;
  const mtbfHours = totalTickets > 0 ? (periodDays * 24) / totalTickets : 0;
  const recurrenceRate = duplicates?.duplicate_rate ?? 0;

  const handleExport = () => {
    const exportData = {
      summary: {
        total: totalTickets,
        resolved: clampedResolved,
        sla_compliance: slaComplianceValue,
        avg_resolution_time: avgResolutionTime,
      },
      teams: teamData,
      priorities: priorityBreakdown,
      duplicates,
      isolation,
      model_accuracy: modelAccuracy,
      systems,
      problem_tickets: problemTickets,
      team_workflow: teamWorkflow,
      predictions,
      root_causes: rootCauses,
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
    refetchDuplicates();
    refetchIsolation();
    refetchModel();
    refetchSystems();
    refetchProblem();
    refetchWorkflow();
    refetchPredictions();
    refetchRoot();
    addToast('Data refreshed successfully', 'success');
  };

  const hasAnyData =
    totalTickets > 0 ||
    teamData.length > 0 ||
    priorityData.length > 0 ||
    volumeSeries.length > 0 ||
    heatmapSeries.length > 0 ||
    (duplicates?.cluster_count ?? 0) > 0 ||
    (isolation?.isolated_count ?? 0) > 0 ||
    (systemsData.length > 0) ||
    (problemTickets?.problem_count ?? 0) > 0;
  const showNoData = !isLoading && !hasAnyData && !hasError;
  const trendLabel = totalTickets > 0 ? 'No trend data' : 'No data';

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
                aria-pressed={selectedPeriod === period}
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

      {hasError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
          Some analytics data failed to load. Use Refresh to retry.
        </div>
      )}

      {showNoData && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No analytics data found for the selected period.
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="px-3">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full whitespace-nowrap">
                  {trendLabel}
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
                <span className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full whitespace-nowrap">
                  {trendLabel}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">Resolved</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{clampedResolved.toLocaleString()}</p>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl"></div>
            </Card>

            <Card className="p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full whitespace-nowrap">
                  {trendLabel}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">Avg Resolution Time</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{avgResolutionTimeDisplay}</p>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
            </Card>

            <Card className="p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full whitespace-nowrap">
                  {trendLabel}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">SLA Compliance</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{slaComplianceDisplay}</p>
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
              <GaugeChart value={slaComplianceValue} label={totalTickets > 0 ? 'SLA Met' : 'No data'} thresholds={{ good: 90, warning: 75 }} />
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalTickets > 0 ? clampedResolved.toLocaleString() : '0'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Within SLA</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalTickets > 0 ? inProgressTickets.toLocaleString() : '0'}</p>
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
            {heatmapSeries.length > 0 ? (
              <Heatmap
                data={heatmapSeries}
                onClick={(cell) => addToast(`${cell.day} ${cell.hour}:00 - ${cell.value} tickets`, 'info')}
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400">No heatmap data available</div>
            )}
            {showHeatmapFallback && (
              <p className="text-xs text-slate-400 mt-3">Showing sample data due to a service error.</p>
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
                    {totalTickets > 0 ? ((clampedResolved / totalTickets) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Drop-off</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {(totalTickets - clampedResolved).toLocaleString()}
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
               {showVolumeFallback && (
                 <p className="text-xs text-slate-400 mt-3">Showing sample data due to a service error.</p>
               )}
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
                          onClick={(data) => addToast(`${data.label}: ${data.value}%`, 'info')}
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
                    <p className="text-xs text-slate-500">Average minutes to resolution</p>
                  </div>
                </div>
                <div className="h-64 w-full">
                   {resolutionTrendSeries.length > 0 ? (
                     <AreaChart
                       data={resolutionTrendSeries}
                       color="#10b981"
                       labels={resolutionLabels}
                       onClick={(data, index) => addToast(`${resolutionLabels[index]}: ${data.value ?? data} minutes avg resolution`, 'info')}
                     />
                   ) : (
                     <div className="h-full flex items-center justify-center text-slate-400">No resolution time data available</div>
                   )}
                </div>
                {showResolutionFallback && (
                  <p className="text-xs text-slate-400 mt-3">Showing period average until trend data is available.</p>
                )}
             </Card>
          </div>

          {/* Overview highlights from other tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">Ticket Intelligence Snapshot</h3>
                <p className="text-xs text-slate-500">Duplicates, isolation, and problem activity</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-slate-500">Duplicate Rate</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{duplicateRateDisplay}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-slate-500">Isolation Rate</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{isolationRateDisplay}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-slate-500">Problems</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{problemTickets?.problem_count ?? 0}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-24">
                  {duplicateTrendValues.length > 0 ? (
                    <SimpleLineChart
                      data={duplicateTrendValues}
                      color="#2563eb"
                      labels={duplicateTrendLabels}
                      onClick={(data, index) => addToast(`${duplicateTrendLabels[index]}: ${data.value}% duplicate rate`, 'info')}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">No duplicate trend</div>
                  )}
                </div>
                <div className="h-24">
                  {isolationTrendValues.length > 0 ? (
                    <SimpleLineChart
                      data={isolationTrendValues}
                      color="#f97316"
                      labels={isolationTrendLabels}
                      onClick={(data, index) => addToast(`${isolationTrendLabels[index]}: ${data.value}% isolation rate`, 'info')}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">No isolation trend</div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">AI Performance Snapshot</h3>
                <p className="text-xs text-slate-500">Model accuracy and feedback health</p>
              </div>
              <GaugeChart
                value={modelAccuracy ? Math.round(modelAccuracy.high_confidence_rate * 100) : 0}
                label="High Confidence"
                thresholds={{ good: 70, warning: 50 }}
              />
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-slate-500">False Positives</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{falsePositiveDisplay}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-slate-500">Query Expansion</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {modelAccuracy ? `${(modelAccuracy.query_expansion_hit_rate.with_expansion * 100).toFixed(0)}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">Top Systems Snapshot</h3>
                <p className="text-xs text-slate-500">Highest volume systems this period</p>
              </div>
              <div className="space-y-3">
                {systemsTop.length > 0 ? (
                  systemsTop.map((system) => (
                    <div key={system.system} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{system.system}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {system.ticket_count} | {Math.round(system.critical_pct * 100)}%
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="h-32 flex items-center justify-center text-xs text-slate-400">No system data</div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ticket-intelligence" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Duplicate Rate</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{duplicateRateDisplay}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Clusters: {duplicateClusterDisplay} - Avg size: {duplicateAvgSizeDisplay}</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <GitBranch className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Isolated Tickets</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{isolatedCountDisplay}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Isolation Rate: {isolationRateDisplay}</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Problem Tickets</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{problemTickets?.problem_count ?? 0}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Escalation Rate: {problemTickets ? `${(problemTickets.escalation_rate * 100).toFixed(1)}%` : 'N/A'}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-blue-500"/> Duplicate Trend
                </h3>
                <p className="text-xs text-slate-500">Duplicate detection rate over time</p>
              </div>
              <div className="h-56">
                {duplicateTrendValues.length > 0 ? (
                  <SimpleLineChart
                    data={duplicateTrendValues}
                    color="#2563eb"
                    labels={duplicateTrendLabels}
                    onClick={(data, index) => addToast(`${duplicateTrendLabels[index]}: ${data.value}% duplicate rate`, 'info')}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">No duplicate trend data</div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-red-500"/> Top Duplicate Themes
                </h3>
                <p className="text-xs text-slate-500">Most frequent duplicate clusters</p>
              </div>
              <div className="space-y-3">
                {(duplicates?.top_themes ?? []).length > 0 ? (
                  duplicates!.top_themes.map((theme, index) => {
                    const max = Math.max(...duplicates!.top_themes.map((t) => t.count), 1);
                    const width = (theme.count / max) * 100;
                    return (
                      <div key={`${theme.theme}-${index}`} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-700 dark:text-slate-300">{theme.theme}</span>
                          <span className="text-slate-500 dark:text-slate-400">{theme.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-2 rounded-full bg-blue-500" style={{ width: `${width}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400">No duplicate themes available</div>
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 lg:col-span-2">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-amber-500"/> Isolation Trend
                </h3>
                <p className="text-xs text-slate-500">Share of tickets with no related links</p>
              </div>
              <div className="h-56">
                {isolationTrendValues.length > 0 ? (
                  <SimpleLineChart
                    data={isolationTrendValues}
                    color="#f97316"
                    labels={isolationTrendLabels}
                    onClick={(data, index) => addToast(`${isolationTrendLabels[index]}: ${data.value}% isolation rate`, 'info')}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">No isolation trend data</div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-amber-500"/> Isolation by Category
                </h3>
                <p className="text-xs text-slate-500">Systems producing isolated tickets</p>
              </div>
              <div className="space-y-3">
                {(isolation?.by_category ?? []).length > 0 ? (
                  isolation!.by_category.map((item) => {
                    const max = Math.max(...isolation!.by_category.map((c) => c.count), 1);
                    const width = (item.count / max) * 100;
                    return (
                      <div key={item.category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-700 dark:text-slate-300">{item.category}</span>
                          <span className="text-slate-500 dark:text-slate-400">{item.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-2 rounded-full bg-amber-500" style={{ width: `${width}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-32 flex items-center justify-center text-slate-400">No isolation breakdown</div>
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <PieChart className="w-4 h-4 mr-2 text-purple-500"/> Problem Category Breakdown
                </h3>
                <p className="text-xs text-slate-500">Distribution of problem ticket categories</p>
              </div>
              <div className="flex items-center justify-center h-56">
                {problemCategoryData.length > 0 ? (
                  <DonutChart
                    data={problemCategoryData.map((item) => ({
                      ...item,
                      value: problemCategoryTotal > 0 ? Math.round((item.value / problemCategoryTotal) * 100) : 0,
                    }))}
                    onClick={(data) => addToast(`${data.label}: ${data.value}%`, 'info')}
                  />
                ) : (
                  <div className="text-slate-400">No problem category data</div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-green-500"/> Problem Lifecycle
                </h3>
                <p className="text-xs text-slate-500">Open vs resolved problems</p>
              </div>
              <div className="h-56">
                {problemLifecycleSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={problemLifecycleSeries}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => value.slice(5)}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="open" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">No lifecycle data available</div>
                )}
              </div>
              <div className="mt-4 text-xs text-slate-500">
                Avg time to problem creation: {problemTickets?.time_to_creation_hours ?? 0}h
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-performance" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">High Confidence</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{highConfidenceDisplay}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Matches with similarity &gt;= 80</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">False Positives</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{falsePositiveDisplay}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Flagged incorrect relationships</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Query Expansion</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {modelAccuracy ? `${(modelAccuracy.query_expansion_hit_rate.with_expansion * 100).toFixed(0)}%` : 'N/A'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                vs {modelAccuracy ? `${(modelAccuracy.query_expansion_hit_rate.without_expansion * 100).toFixed(0)}%` : 'N/A'} without
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-blue-500"/> Similarity Score Distribution
                </h3>
                <p className="text-xs text-slate-500">Histogram of similarity scores</p>
              </div>
              <div className="h-64">
                {modelHistogram.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={modelHistogram}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">No similarity data available</div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-2 text-emerald-500"/> High Confidence Gauge
                </h3>
                <p className="text-xs text-slate-500">Percent of high-confidence matches</p>
              </div>
              <GaugeChart
                value={modelAccuracy ? Math.round(modelAccuracy.high_confidence_rate * 100) : 0}
                label="High Confidence"
                thresholds={{ good: 70, warning: 50 }}
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-emerald-500"/> Graph Feedback Trend
                </h3>
                <p className="text-xs text-slate-500">Positive vs negative feedback</p>
              </div>
              <div className="h-56">
                {graphFeedbackSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={graphFeedbackSeries}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(5)} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">No feedback data available</div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-purple-500"/> Root Cause Intelligence
                </h3>
                <p className="text-xs text-slate-500">Coverage and top root causes</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-slate-500">Coverage</p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">{rootCauseCoverageDisplay}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-slate-500">Change-related</p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">{changeRelatedDisplay}</p>
                </div>
              </div>
              <div className="space-y-2">
                {(rootCauses?.top_root_causes ?? []).length > 0 ? (
                  rootCauses!.top_root_causes.map((item) => (
                    <div key={item.cause} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-300 truncate">{item.cause}</span>
                      <span className="text-slate-500 dark:text-slate-400">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-sm">No root cause summaries available</div>
                )}
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-indigo-500"/> Causal Graph Depth
              </h3>
              <p className="text-xs text-slate-500">Distribution of graph complexity</p>
            </div>
            <div className="h-52">
              {rootCauseDepthSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={rootCauseDepthSeries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="depth" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">No graph depth data</div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="systems-teams" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">MTTR</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{mttrHours ? `${mttrHours.toFixed(1)}h` : 'N/A'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Mean time to repair</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">MTBF</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{mtbfHours ? `${mtbfHours.toFixed(1)}h` : 'N/A'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Mean time between failures</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Recurrence</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{(recurrenceRate * 100).toFixed(1)}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Recurring incident rate</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-indigo-500"/> Ticket Volume by System
                </h3>
                <p className="text-xs text-slate-500">Top categories by ticket volume</p>
              </div>
              <div className="h-72">
                {systemsBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={systemsBarData} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis dataKey="system" type="category" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <RechartsTooltip />
                      <Bar dataKey="ticket_count" fill="#6366f1" radius={[0, 6, 6, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">No system data available</div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <Users className="w-4 h-4 mr-2 text-blue-500"/> Team Workflow Load
                </h3>
                <p className="text-xs text-slate-500">New, in-progress, and backlog by team</p>
              </div>
              <div className="space-y-4">
                {teamWorkflowData.length > 0 ? (
                  teamWorkflowData.map((team) => {
                    const total = team.new + team.in_progress + team.backlog;
                    const newPct = total > 0 ? (team.new / total) * 100 : 0;
                    const inProgressPct = total > 0 ? (team.in_progress / total) * 100 : 0;
                    const backlogPct = total > 0 ? (team.backlog / total) * 100 : 0;
                    return (
                      <div key={team.team} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-700 dark:text-slate-300">{team.team}</span>
                          <span className="text-slate-500 dark:text-slate-400">{total} tickets</span>
                        </div>
                        <div className="flex h-7 rounded-lg overflow-hidden">
                          <div className="bg-blue-500" style={{ width: `${newPct}%` }} title={`New: ${team.new}`} />
                          <div className="bg-amber-500" style={{ width: `${inProgressPct}%` }} title={`In Progress: ${team.in_progress}`} />
                          <div className="bg-slate-400" style={{ width: `${backlogPct}%` }} title={`Backlog: ${team.backlog}`} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400">No workflow data available</div>
                )}
              </div>
              <div className="mt-4 text-xs text-slate-500">
                First-touch resolution rate: {firstTouchRateDisplay}
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="mb-4 flex flex-col gap-1">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                <Server className="w-4 h-4 mr-2 text-indigo-500"/> System Health Table
              </h3>
              <p className="text-xs text-slate-500">Ticket volume, critical concentration, MTTR, and SLA by system</p>
            </div>
            {systemsData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>System</TableHead>
                    <TableHead>Tickets</TableHead>
                    <TableHead>Critical %</TableHead>
                    <TableHead>Avg Resolution</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Problems</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemsData.map((system) => (
                    <TableRow key={system.system}>
                      <TableCell className="font-medium">{system.system}</TableCell>
                      <TableCell>{system.ticket_count}</TableCell>
                      <TableCell>{(system.critical_pct * 100).toFixed(0)}%</TableCell>
                      <TableCell>{system.avg_resolution_hours.toFixed(1)}h</TableCell>
                      <TableCell>{system.sla_compliance_pct.toFixed(0)}%</TableCell>
                      <TableCell>{system.problem_ticket_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400">No system metrics available</div>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <GitBranch className="w-4 h-4 mr-2 text-blue-500"/> Escalation Paths
                </h3>
                <p className="text-xs text-slate-500">Most common transfer sequences</p>
              </div>
              <div className="space-y-3">
                {escalationPaths.length > 0 ? (
                  escalationPaths.map((path, index) => (
                    <div key={`${path.from}-${path.to}-${index}`} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{path.from} -&gt; {path.to}</span>
                      <span className="text-slate-500 dark:text-slate-400">{path.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="h-32 flex items-center justify-center text-slate-400">No escalation paths available</div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-emerald-500"/> Response Time Distribution
                </h3>
                <p className="text-xs text-slate-500">Time to first assignment</p>
              </div>
              <div className="h-56">
                {responseTimeHistogram.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={responseTimeHistogram}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">No response data available</div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-blue-500"/> Ticket Volume Forecast
                </h3>
                <p className="text-xs text-slate-500">Next 7 days projection</p>
              </div>
              <div className="h-64">
                {predictionForecast.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={predictionForecast}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(5)} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                      {predictionForecast.some((p) => p.actual !== undefined) && (
                        <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                      )}
                    </RechartsLineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">No forecast data available</div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-amber-500"/> Emerging Issue Clusters
                </h3>
                <p className="text-xs text-slate-500">New spikes not yet linked to problems</p>
              </div>
              <div className="space-y-3">
                {emergingClusters.length > 0 ? (
                  emergingClusters.map((cluster) => (
                    <div key={cluster.theme} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{cluster.theme}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{cluster.count} tickets</span>
                      </div>
                      {cluster.system && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">System: {cluster.system}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="h-40 flex items-center justify-center text-slate-400">No emerging clusters</div>
                )}
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                <Zap className="w-4 h-4 mr-2 text-yellow-500"/> Seasonal Patterns
              </h3>
              <p className="text-xs text-slate-500">Day-of-week and hour hotspots</p>
            </div>
            {seasonalHeatmap.length > 0 ? (
              <Heatmap data={seasonalHeatmap} onClick={(cell) => addToast(`${cell.day} ${cell.hour}:00 - ${cell.value} tickets`, 'info')} />
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400">No seasonal pattern data available</div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
