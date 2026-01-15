import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Ticket, GraphNode, GraphEdge } from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8001';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const datasetMode = useAuthStore.getState().datasetMode;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Dataset': datasetMode,
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
    // Handle 401 by signing out - session is invalid
    if (response.status === 401) {
      const { signOut } = await import('@/lib/supabase');
      try { await signOut(); } catch {}
      throw new Error('Session expired. Please log in again.');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.statusText}`);
  }

  return response.json();
}

// ----------------------------------------------------------------------------
// Backend search result normalization
// ----------------------------------------------------------------------------

type BackendSearchResult = {
  number: string;
  short_description: string;
  description: string;
  category: string;
  similarity_score: number;
  rrf_score?: number;
  rerank_score?: number;
  causal_score?: number;
};

type HybridSearchResponse = {
  results: BackendSearchResult[];
  query_original: string;
  query_expanded?: string;
  total_candidates: number;
  reranking_enabled: boolean;
};

const mapSearchResultToTicket = (result: BackendSearchResult): Ticket => {
  const baseScore = result.rerank_score ?? result.similarity_score ?? 0;
  const normalizedScore = Math.max(0, Math.min(1, baseScore)) * 100;

  return {
    id: result.number,
    number: result.number,
    short_description: result.short_description,
    description: result.description,
    category: result.category || 'General',
    priority: 'Medium',
    state: 'New',
    opened_at: new Date().toISOString(),
    assigned_group: 'Unassigned',
    similarity_score: Math.round(normalizedScore),
    related_ids: [],
  };
};

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
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['tickets', datasetMode, filters],
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
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['ticket', datasetMode, ticketId],
    queryFn: () => fetchAPI<Ticket>(`/api/tickets/${ticketId}`),
    staleTime: 2 * 60 * 1000,
    enabled: !!ticketId,
  });
};

export const useTicketTimeline = (ticketId: string) => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['ticket', datasetMode, ticketId, 'timeline'],
    queryFn: () =>
      fetchAPI<any[]>(`/api/tickets/${ticketId}/timeline`),
    staleTime: 2 * 60 * 1000,
    enabled: !!ticketId,
  });
};

export const useTicketAuditLog = (ticketId: string) => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['ticket', datasetMode, ticketId, 'audit'],
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
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'metrics', period],
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
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'volume', period],
    queryFn: () =>
      fetchAPI<{ date: string; count: number }[]>(
        `/api/analytics/volume?period=${period}`
      ),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsTeamPerformance = () => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'team-performance'],
    queryFn: () =>
      fetchAPI<any[]>(`/api/analytics/team-performance`),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsHeatmap = (period: '7d' | '30d' = '30d') => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'heatmap', period],
    queryFn: () =>
      fetchAPI<any[]>(`/api/analytics/heatmap?period=${period}`),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsPriorityBreakdown = () => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'priority-breakdown'],
    queryFn: () =>
      fetchAPI<Record<string, number>>(`/api/analytics/priority-breakdown`),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsSLACompliance = () => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'sla-compliance'],
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
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['search', datasetMode, 'suggestions', query],
    queryFn: () =>
      fetchAPI<HybridSearchResponse>(`/search/hybrid`, {
        method: 'POST',
        body: JSON.stringify({
          query,
          top_k: 5,
          enable_reranking: false,
          enable_query_expansion: true,
        }),
      }).then((res) =>
        res.results.map((r) => r.short_description || r.number).slice(0, 5)
      ),
    staleTime: 5 * 60 * 1000,
    enabled: query.trim().length > 1,
  });
};

export const useSemanticSearch = (query: string, filters?: any) => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['search', datasetMode, 'semantic', query, filters],
    queryFn: async () => {
      const payload = {
        query,
        top_k: filters?.limit ?? 10,
        enable_reranking: filters?.rerank ?? true,
        enable_query_expansion: filters?.expand ?? true,
      };

      const res = await fetchAPI<HybridSearchResponse>(`/search/hybrid`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const tickets = res.results.map(mapSearchResultToTicket);
      const scores = res.results.map(
        (r) => r.rerank_score ?? r.similarity_score ?? 0
      );

      return { results: tickets, scores };
    },
    staleTime: 2 * 60 * 1000,
    enabled: query.trim().length > 0,
  });
};

export const useCausalSearch = (
  query: string,
  options?: { top_k?: number; causal_threshold?: number }
) => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['search', datasetMode, 'causal', query, options],
    queryFn: async () => {
      const res = await fetchAPI<{ results: BackendSearchResult[] }>(
        `/search/causal`,
        {
          method: 'POST',
          body: JSON.stringify({
            query,
            top_k: options?.top_k ?? 5,
            causal_threshold: options?.causal_threshold ?? 0.5,
          }),
        }
      );

      return res.results.map(mapSearchResultToTicket);
    },
    staleTime: 2 * 60 * 1000,
    enabled: query.trim().length > 0,
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
