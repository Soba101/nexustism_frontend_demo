"use client";

import { RefreshCw, Database, AlertTriangle } from 'lucide-react';
import { useDataStatus, useEmbedPending } from '@/services/api';
import { useUIStore } from '@/stores/uiStore';

function formatRelativeTime(isoDate: string | null): string {
  if (!isoDate) return 'never';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export const DataStatusBadge = () => {
  const { data, isLoading } = useDataStatus();
  const embedPending = useEmbedPending();
  const { addToast } = useUIStore();

  const hasPending = (data?.pending_tickets ?? 0) > 0;

  const handleRefresh = async () => {
    try {
      const result = await embedPending.mutateAsync();
      if (result.remaining > 0) {
        addToast(
          `Indexed ${result.processed} ticket(s). ${result.remaining} still pending.`,
          'info',
        );
      } else {
        addToast(`All tickets indexed (${result.processed} processed).`, 'success');
      }
    } catch {
      addToast('Failed to trigger indexing. Check server logs.', 'error');
    }
  };

  if (isLoading || !data) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
      {hasPending ? (
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
          <AlertTriangle className="w-3.5 h-3.5" />
          {data.pending_tickets} unindexed
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <Database className="w-3.5 h-3.5" />
          Indexed {formatRelativeTime(data.last_embedded_at)}
        </span>
      )}
      <button
        onClick={handleRefresh}
        disabled={embedPending.isPending}
        title="Re-index pending tickets"
        aria-label="Re-index pending tickets"
        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${embedPending.isPending ? 'animate-spin' : ''}`}
        />
      </button>
    </div>
  );
};
