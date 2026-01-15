'use client';

import { useState, useMemo } from 'react';
import { Search, TrendingUp, Clock, AlertCircle, CheckCircle2, Activity, ArrowUpRight, ArrowDownRight, Users, Ticket as TicketIcon, Loader2 } from 'lucide-react';
import { useTickets, useAnalyticsMetrics } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Ticket } from '@/types';

interface DashboardPageProps {
  setActivePage: (page: string) => void;
  onSelectIncident: (incident: Ticket) => void;
  addToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const DashboardPage = ({ setActivePage, onSelectIncident, addToast }: DashboardPageProps) => {
  const [quickSearch, setQuickSearch] = useState('');

  // API hooks for data
  const { data: ticketsData, isLoading: isTicketsLoading, error: ticketsError } = useTickets({ limit: 50 });
  const { data: metricsData, isLoading: isMetricsLoading } = useAnalyticsMetrics('30d');

  const tickets = ticketsData?.tickets || [];
  const isLoading = isTicketsLoading || isMetricsLoading;

  // Calculate KPIs from API data
  const kpis = useMemo(() => {
    const total = metricsData?.totalTickets || ticketsData?.total || tickets.length;
    const openTickets = tickets.filter(t => t.state === 'New' || t.state === 'In Progress').length;
    const criticalTickets = tickets.filter(t => t.priority === 'Critical').length;
    const resolvedToday = metricsData?.resolvedTickets || tickets.filter(t => t.state === 'Resolved').length;

    return {
      total,
      open: openTickets,
      critical: criticalTickets,
      resolved: resolvedToday,
      openPercent: total > 0 ? Math.round((openTickets / total) * 100) : 0,
      criticalPercent: total > 0 ? Math.round((criticalTickets / total) * 100) : 0
    };
  }, [tickets, ticketsData, metricsData]);

  // Get recent tickets from API
  const recentTickets = useMemo(() => {
    return tickets.slice(0, 5);
  }, [tickets]);

  // Get high priority tickets from API
  const urgentTickets = useMemo(() => {
    return tickets.filter(t => t.priority === 'Critical' || t.priority === 'High').slice(0, 4);
  }, [tickets]);

  const handleQuickSearch = () => {
    if (quickSearch.trim()) {
      setActivePage('search');
      addToast(`Searching for: ${quickSearch}`, 'info');
    }
  };

  return (
    <div className="flex-1 md:ml-64 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Dashboard Overview
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Welcome back! Here's what's happening with your tickets.
          </p>
        </div>

        {/* Quick Search */}
        <div className="mb-8 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickSearch()}
                placeholder="Quick search tickets..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button onClick={handleQuickSearch} className="px-6">
              Search
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setActivePage('search')}
            >
              Advanced Search
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Tickets */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TicketIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <ArrowUpRight className="w-4 h-4" />
                <span>+12%</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Tickets</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{kpis.total}</p>
          </div>

          {/* Open Tickets */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400">
                <span>{kpis.openPercent}%</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Open Tickets</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{kpis.open}</p>
          </div>

          {/* Critical Tickets */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                <span>{kpis.criticalPercent}%</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Critical</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{kpis.critical}</p>
          </div>

          {/* Resolved Tickets */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <ArrowUpRight className="w-4 h-4" />
                <span>+8%</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Resolved</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{kpis.resolved}</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tickets */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Tickets</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setActivePage('search')}
              >
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.number}
                  onClick={() => onSelectIncident(ticket)}
                  className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {ticket.number}
                    </span>
                    <Badge variant={
                      ticket.priority === 'Critical' ? 'destructive' :
                      ticket.priority === 'High' ? 'default' : 'secondary'
                    }>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-900 dark:text-white mb-2 line-clamp-2">
                    {ticket.short_description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{ticket.category}</span>
                    <span>•</span>
                    <span>{ticket.state}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Urgent Attention */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Needs Attention</h2>
              <Badge variant="destructive">{urgentTickets.length}</Badge>
            </div>
            <div className="space-y-4">
              {urgentTickets.map((ticket) => (
                <div
                  key={ticket.number}
                  onClick={() => onSelectIncident(ticket)}
                  className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 cursor-pointer transition-colors border border-red-200 dark:border-red-900/30"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-sm font-semibold text-red-600 dark:text-red-400">
                      {ticket.number}
                    </span>
                    <Badge variant="destructive">
                      {ticket.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-900 dark:text-white mb-2 line-clamp-2">
                    {ticket.short_description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{ticket.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-1">AI-Powered Analysis Ready</h3>
              <p className="text-blue-100">Explore root cause relationships and ticket dependencies</p>
            </div>
            <Button
              onClick={() => setActivePage('analyze')}
              variant="secondary"
              className="whitespace-nowrap"
            >
              Open Root Cause Analysis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
