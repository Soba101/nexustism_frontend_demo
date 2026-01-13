import { Clock, AlertCircle } from 'lucide-react';
import type { Ticket } from '@/types';
import { MOCK_TICKETS } from '@/data/mockTickets';
import { Badge } from '@/components/ui/wrappers';

interface RelatedTicketsTabProps {
  ticket: Ticket;
  onSelectRelated: (ticket: Ticket) => void;
}

export const RelatedTicketsTab = ({ ticket, onSelectRelated }: RelatedTicketsTabProps) => {
  const relatedTickets = MOCK_TICKETS.filter(t => ticket.related_ids.includes(t.id));

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">AI Insight</h4>
          <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
            This ticket has a 98% semantic similarity to TKT000985. It is likely a recurrence of the Singapore Gateway latency issue.
          </p>
        </div>
      </div>

      {relatedTickets.map(related => (
        <div
          key={related.id}
          className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all cursor-pointer group bg-white dark:bg-slate-800"
          onClick={() => onSelectRelated(related)}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">{related.number}</span>
              <Badge variant={related.state === 'Resolved' ? 'low' : 'default'}>{related.state}</Badge>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-green-600 dark:text-green-400">{related.similarity_score}% Match</span>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">{related.short_description}</p>
          <div className="mt-3 flex items-center text-xs text-slate-500 dark:text-slate-400 space-x-4">
            <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {new Date(related.opened_at).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
