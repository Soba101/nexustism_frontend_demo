'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, AlertCircle, CheckCircle2, Activity, ArrowUpRight, Ticket as TicketIcon } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useTickets, useAnalyticsMetrics } from '@/services';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const DashboardPage = () => {
  const router = useRouter();
  const { setSelectedTicket, addToast } = useUIStore();
  const [quickSearch, setQuickSearch] = useState('');

  // API hooks for data
  const { data: ticketsData } = useTickets({ limit: 50 });
  const { data: metricsData } = useAnalyticsMetrics('30d');

  const tickets = ticketsData?.tickets ?? [];

  // Calculate KPIs from API data
  const kpis = (() => {
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
  })();

  // Get recent tickets from API
  const recentTickets = tickets.slice(0, 5);

  // Get problem tickets from API
  const problemTickets = tickets.filter(t => t.ticket_type === 'problem').slice(0, 4);

  const handleQuickSearch = () => {
    if (quickSearch.trim()) {
      router.push(`/search?q=${encodeURIComponent(quickSearch.trim())}`);
      addToast(`Searching for: ${quickSearch}`, 'info');
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Dashboard Overview
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Welcome back! Here is what is happening with your tickets.
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
              onClick={() => router.push('/search')}
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
                onClick={() => router.push('/search')}
              >
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.number}
                  onClick={() => setSelectedTicket(ticket)}
                  className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {ticket.number}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        ticket.priority === 'Critical' ? 'destructive' :
                        ticket.priority === 'High' ? 'default' : 'secondary'
                      }>
                        {ticket.priority}
                      </Badge>
                      {ticket.ticket_type === 'problem' && (
                        <Badge className="bg-purple-600 text-white border-purple-600">
                          PROBLEM
                        </Badge>
                      )}
                    </div>
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

          {/* Problem Ticket Suggestion */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Problem Ticket Suggestion</h2>
              <Badge className="bg-purple-600 text-white border-purple-600">{problemTickets.length}</Badge>
            </div>
            <div className="space-y-4">
              {problemTickets.length > 0 ? (
                problemTickets.map((ticket) => (
                  <div
                    key={ticket.number}
                    onClick={() => setSelectedTicket(ticket)}
                    className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/20 cursor-pointer transition-colors border border-purple-200 dark:border-purple-900/30"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {ticket.number}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-600 text-white border-purple-600">
                          PROBLEM
                        </Badge>
                        {ticket.priority && (
                          <Badge variant={
                            ticket.priority === 'Critical' ? 'destructive' :
                            ticket.priority === 'High' ? 'default' : 'secondary'
                          }>
                            {ticket.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-900 dark:text-white mb-2 line-clamp-2">
                      {ticket.short_description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{ticket.category}</span>
                      <span>•</span>
                      <span>{ticket.state}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                  <p>No problem tickets available</p>
                </div>
              )}
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
              onClick={() => router.push('/root-cause')}
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
