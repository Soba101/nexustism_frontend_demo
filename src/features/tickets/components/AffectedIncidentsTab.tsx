import { AlertCircle, Loader2 } from 'lucide-react';
import type { Ticket } from '@/types';
import { useAffectedTickets } from '@/services';
import { Badge } from '@/components/ui/wrappers';

interface AffectedIncidentsTabProps {
  ticket: Ticket;
  onSelectIncident: (ticket: Ticket) => void;
}

export const AffectedIncidentsTab = ({ ticket, onSelectIncident }: AffectedIncidentsTabProps) => {
  const ticketId = ticket.id || ticket.number;
  const { data: affectedTickets, isLoading, error } = useAffectedTickets(ticketId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading affected incidents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-red-900 dark:text-red-100 text-sm">Error Loading Affected Incidents</h4>
          <p className="text-red-700 dark:text-red-300 text-xs mt-1">
            {error instanceof Error ? error.message : 'Failed to load affected incidents. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  if (!affectedTickets || affectedTickets.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No Affected Incidents</h4>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          This problem ticket does not have linked incidents yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg p-4 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-purple-900 dark:text-purple-100 text-sm">Linked Incidents</h4>
          <p className="text-purple-700 dark:text-purple-300 text-xs mt-1">
            {affectedTickets.length} incident{affectedTickets.length !== 1 ? 's' : ''} are linked to this problem ticket.
          </p>
        </div>
      </div>

      {affectedTickets.map((incident) => (
        <div
          key={incident.id || incident.number}
          className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-sm transition-all cursor-pointer group bg-white dark:bg-slate-800"
          onClick={() => onSelectIncident(incident)}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">{incident.number}</span>
              <Badge variant={incident.state === 'Resolved' ? 'low' : 'default'}>{incident.state}</Badge>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{incident.priority}</span>
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 truncate">
            {incident.short_description}
          </p>
          <div className="mt-3 flex items-center text-xs text-slate-500 dark:text-slate-400 space-x-4">
            <span>{incident.category}</span>
            <span>{new Date(incident.opened_at).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
