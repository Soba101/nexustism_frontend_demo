import type { Ticket } from '@/types';

interface OverviewTabProps {
  ticket: Ticket;
}

export const OverviewTab = ({ ticket }: OverviewTabProps) => (
  <div className="space-y-6 animate-in fade-in duration-300">
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Short Description</h3>
      <p className="text-slate-800 dark:text-slate-200 text-lg font-medium leading-relaxed break-words">
        {ticket.short_description}
      </p>
    </div>

    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Full Description</h3>
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
        {ticket.description}
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
        <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Category</span>
        <span className="font-medium text-slate-900 dark:text-white">{ticket.category}</span>
      </div>
      <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
        <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Assigned Group</span>
        <span className="font-medium text-slate-900 dark:text-white">{ticket.assigned_group}</span>
      </div>
    </div>
  </div>
);
