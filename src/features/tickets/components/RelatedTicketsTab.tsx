import { Clock, AlertCircle, Loader2 } from 'lucide-react';
import type { Ticket } from '@/types';
import { useRelatedTickets } from '@/services';
import { Badge } from '@/components/ui/wrappers';

interface RelatedTicketsTabProps {
  ticket: Ticket;
  onSelectRelated: (ticket: Ticket) => void;
}

export const RelatedTicketsTab = ({ ticket, onSelectRelated }: RelatedTicketsTabProps) => {
  const ticketId = ticket.id || ticket.number;
  const { data: relatedTickets, isLoading, error } = useRelatedTickets(ticketId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Finding related tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-red-900 dark:text-red-100 text-sm">Error Loading Related Tickets</h4>
          <p className="text-red-700 dark:text-red-300 text-xs mt-1">
            {error instanceof Error ? error.message : 'Failed to load related tickets. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  if (!relatedTickets || relatedTickets.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No Related Tickets Found</h4>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          No semantically similar tickets were found for this incident.
        </p>
      </div>
    );
  }

  // Get top similarity score for insight message
  const topMatch = relatedTickets[0];
  const topScore = topMatch?.similarity_score || 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">AI Insight</h4>
          <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
            Found {relatedTickets.length} related ticket{relatedTickets.length !== 1 ? 's' : ''}.
            {topScore >= 80 && topMatch && ` ${topMatch.number} shows a ${topScore}% semantic similarity and may indicate a recurring issue.`}
            {topScore >= 60 && topScore < 80 && ` The highest match (${topScore}%) suggests potential connection to past incidents.`}
            {topScore < 60 && ` Matches have moderate similarity - review to determine relevance.`}
          </p>
        </div>
      </div>

      {relatedTickets.map(related => (
        <div
          key={related.id || related.number}
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
