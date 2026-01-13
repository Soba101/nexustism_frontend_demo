import type { Ticket } from '@/types';

interface TimelineTabProps {
  ticket: Ticket;
}

export const TimelineTab = ({ ticket }: TimelineTabProps) => (
  <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-8 my-4 animate-in fade-in duration-300">
    <div className="relative">
      <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-slate-800"></div>
      <p className="text-sm font-bold text-slate-900 dark:text-white">Ticket Opened</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(ticket.opened_at).toLocaleString()}</p>
    </div>
    <div className="relative">
      <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-slate-800"></div>
      <p className="text-sm font-bold text-slate-900 dark:text-white">Assignment Changed</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(new Date(ticket.opened_at).getTime() + 1800000).toLocaleString()}</p>
      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">Assigned to <strong>{ticket.assigned_group}</strong>.</p>
    </div>
  </div>
);
