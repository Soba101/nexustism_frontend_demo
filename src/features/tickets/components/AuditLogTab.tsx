import type { Ticket } from '@/types';

interface AuditLogTabProps {
  ticket: Ticket;
}

export const AuditLogTab = ({ ticket }: AuditLogTabProps) => {
  const auditLogs = [
    { user: 'System', action: 'Created Ticket', time: new Date(ticket.opened_at).toLocaleTimeString() },
    { user: 'AI Engine', action: 'Added Similarity Score', time: new Date(new Date(ticket.opened_at).getTime() + 5000).toLocaleTimeString() },
    { user: 'Jane Smith', action: 'Changed State to In Progress', time: new Date(new Date(ticket.opened_at).getTime() + 100000).toLocaleTimeString() }
  ];

  return (
    <div className="space-y-4 my-4 animate-in fade-in duration-300">
      {auditLogs.map((log, i) => (
        <div key={i} className="flex gap-4 p-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
              {log.user.charAt(0)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{log.user}</p>
              <span className="text-xs text-slate-400 whitespace-nowrap">{log.time}</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{log.action}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
