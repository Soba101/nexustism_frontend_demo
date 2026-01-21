"use client";

import { useState } from 'react';
import { X, Share2, Download, Network } from 'lucide-react';
import type { Ticket } from '@/types';
import { exportToCSV } from '@/utils/helpers';
import { Badge, Button } from '@/components/ui/wrappers';
import { OverviewTab } from './components/OverviewTab';
import { RelatedTicketsTab } from './components/RelatedTicketsTab';
import { TimelineTab } from './components/TimelineTab';
import { AuditLogTab } from './components/AuditLogTab';

interface TicketDetailPanelProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: () => void;
  onSelectRelated: (ticket: Ticket) => void;
  addToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

interface TicketDetailPanelContentProps extends Omit<TicketDetailPanelProps, 'ticket'> {
  ticket: Ticket;
}

export const TicketDetailPanel = (props: TicketDetailPanelProps) => {
  if (!props.ticket) return null;

  return (
    <TicketDetailPanelContent
      key={props.ticket.number}
      {...props}
      ticket={props.ticket}
    />
  );
};

const TicketDetailPanelContent = ({
  ticket,
  isOpen,
  onClose,
  onAnalyze,
  onSelectRelated,
  addToast
}: TicketDetailPanelContentProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <>
      {/* Backdrop - positioned below header on mobile */}
      <div
        className={`fixed inset-0 md:inset-0 top-16 md:top-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel - slides from right on desktop, bottom on mobile */}
      <div className={`fixed top-16 md:top-0 right-0 h-[calc(100vh-4rem)] md:h-full w-full md:w-[600px] lg:w-[700px] bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-slate-200 dark:border-slate-700 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between bg-white dark:bg-slate-900 gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{ticket.number}</h2>
              <div className="flex gap-2">
                <Badge variant={ticket.priority.toLowerCase() as 'critical' | 'high' | 'medium' | 'low'}>{ticket.priority}</Badge>
                <Badge variant="outline">{ticket.state}</Badge>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Opened {new Date(ticket.opened_at).toLocaleDateString()} at {new Date(ticket.opened_at).toLocaleTimeString()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors flex-shrink-0" aria-label="Close panel">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => addToast('Link copied to clipboard', 'success')}>
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              exportToCSV([ticket], `ticket_${ticket.number}.csv`);
              addToast('Download started', 'info');
            }}>
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 border-none text-white" onClick={onAnalyze}>
            <Network className="w-4 h-4" />
            Analyze Root Cause
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
          <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
            <div className="flex space-x-6 overflow-x-auto no-scrollbar">
              {['Overview', 'Related Tickets', 'Timeline', 'Audit Log'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.toLowerCase()
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {activeTab === 'overview' && <OverviewTab ticket={ticket} />}
            {activeTab === 'related tickets' && (
              <RelatedTicketsTab
                ticket={ticket}
                onSelectRelated={onSelectRelated}
              />
            )}
            {activeTab === 'timeline' && <TimelineTab ticket={ticket} />}
            {activeTab === 'audit log' && <AuditLogTab ticket={ticket} />}
          </div>
        </div>
      </div>
    </>
  );
};
