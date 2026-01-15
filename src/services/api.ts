import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Ticket, GraphNode, GraphEdge } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `API Error: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// TICKET QUERIES
// ============================================================================

export const useTickets = (filters?: {
  category?: string;
  priority?: string;
  state?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.state) params.append('state', filters.state);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      return fetchAPI<{ tickets: Ticket[]; total: number }>(
        `/api/tickets?${params.toString()}`
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useTicket = (ticketId: string) => {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => fetchAPI<Ticket>(`/api/tickets/${ticketId}`),
    staleTime: 2 * 60 * 1000,
    enabled: !!ticketId,
  });
};

export const useTicketTimeline = (ticketId: string) => {
  return useQuery({
    queryKey: ['ticket', ticketId, 'timeline'],
    queryFn: () =>
      fetchAPI<any[]>(`/api/tickets/${ticketId}/timeline`),
    staleTime: 2 * 60 * 1000,
    enabled: !!ticketId,
  });
};

export const useTicketAuditLog = (ticketId: string) => {
  return useQuery({
    queryKey: ['ticket', ticketId, 'audit'],
    queryFn: () =>
      fetchAPI<any[]>(`/api/tickets/${ticketId}/audit`),
    staleTime: 2 * 60 * 1000,
    enabled: !!ticketId,
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      data,
    }: {
      ticketId: string;
      data: Partial<Ticket>;
    }) => {
      return fetchAPI<Ticket>(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', data.id] });
    },
  });
};

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

export const useAnalyticsMetrics = (period: '7d' | '30d' | '90d' = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'metrics', period],
    queryFn: () =>
      fetchAPI<{
        totalTickets: number;
        resolvedTickets: number;
        avgResolutionTime: number;
        adoptionRate: number;
      }>(`/api/analytics/metrics?period=${period}`),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsVolume = (period: '7d' | '30d' | '90d' = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'volume', period],
    queryFn: () =>
      fetchAPI<{ date: string; count: number }[]>(
        `/api/analytics/volume?period=${period}`
      ),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsTeamPerformance = () => {
  return useQuery({
    queryKey: ['analytics', 'team-performance'],
    queryFn: () =>
      fetchAPI<any[]>(`/api/analytics/team-performance`),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsHeatmap = (period: '7d' | '30d' = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'heatmap', period],
    queryFn: () =>
      fetchAPI<any[]>(`/api/analytics/heatmap?period=${period}`),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsPriorityBreakdown = () => {
  return useQuery({
    queryKey: ['analytics', 'priority-breakdown'],
    queryFn: () =>
      fetchAPI<Record<string, number>>(`/api/analytics/priority-breakdown`),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsSLACompliance = () => {
  return useQuery({
    queryKey: ['analytics', 'sla-compliance'],
    queryFn: () =>
      fetchAPI<{ overall: number; byPriority: Record<string, number> }>(
        `/api/analytics/sla-compliance`
      ),
    staleTime: 10 * 60 * 1000,
  });
};

// ============================================================================
// SEARCH QUERIES
// ============================================================================

export const useSearchSuggestions = (query: string) => {
  return useQuery({
    queryKey: ['search', 'suggestions', query],
    queryFn: () =>
      fetchAPI<string[]>(`/api/search/suggestions?q=${encodeURIComponent(query)}`),
    staleTime: 5 * 60 * 1000,
    enabled: query.length > 1,
  });
};

export const useSemanticSearch = (query: string, filters?: any) => {
  return useQuery({
    queryKey: ['search', 'semantic', query, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query });
      if (filters?.expand) params.append('expand', 'true');
      if (filters?.rerank) params.append('rerank', 'true');

      return fetchAPI<{ results: Ticket[]; scores: number[] }>(
        `/api/search/semantic?${params.toString()}`
      );
    },
    staleTime: 2 * 60 * 1000,
    enabled: query.length > 0,
  });
};

// ============================================================================
// CAUSAL GRAPH QUERIES
// ============================================================================

export const useCausalGraph = (ticketId: string) => {
  return useQuery({
    queryKey: ['causal-graph', ticketId],
    queryFn: () =>
      fetchAPI<{ nodes: GraphNode[]; edges: GraphEdge[] }>(
        `/api/causal-graph/${ticketId}`
      ),
    staleTime: 5 * 60 * 1000,
    enabled: !!ticketId,
  });
};

export const useSubmitGraphFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedback: {
      ticketId: string;
      nodeId: string;
      rating: number;
      confidence: number;
      evidence: string;
    }) => {
      return fetchAPI<{ success: boolean }>(
        `/api/feedback/graph`,
        {
          method: 'POST',
          body: JSON.stringify(feedback),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['causal-graph'] });
    },
  });
};

export const useFlagGraphIncorrect = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ticketId: string; nodeId: string }) => {
      return fetchAPI<{ success: boolean }>(
        `/api/feedback/graph/flag-incorrect`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['causal-graph'] });
    },
  });
};

// ============================================================================
// SETTINGS/PREFERENCES QUERIES
// ============================================================================

export const useUserPreferences = () => {
  return useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: () =>
      fetchAPI<any>(`/api/user/preferences`),
    staleTime: Infinity, // Doesn't change often
  });
};

export const useUpdateUserPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: any) =>
      fetchAPI<any>(`/api/user/preferences`, {
        method: 'PUT',
        body: JSON.stringify(preferences),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'preferences'] });
    },
  });
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Export ticket data as CSV
 */
export const exportTicketsAsCSV = async (ticketIds: string[]) => {
  return fetchAPI<Blob>(`/api/export/csv`, {
    method: 'POST',
    body: JSON.stringify({ ticketIds }),
  });
};
