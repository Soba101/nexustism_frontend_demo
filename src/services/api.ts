import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, getSession } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type {
  Ticket,
  GraphNode,
  GraphEdge,
  UserPreferences,
  AnalyticsDuplicates,
  AnalyticsIsolation,
  AnalyticsModelAccuracy,
  AnalyticsSystems,
  AnalyticsProblemTickets,
  AnalyticsTeamWorkflow,
  AnalyticsPredictions,
  AnalyticsRootCauses,
  AnalyticsPeriod,
} from '@/types';

const resolveApiBaseUrl = () => {
  const localUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8001';
  const tailscaleUrl = process.env.NEXT_PUBLIC_API_BASE_URL_TAILSCALE || '';

  if (typeof window === 'undefined') {
    return localUrl || tailscaleUrl;
  }

  const host = window.location.hostname;
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';
  return isLocalhost ? (localUrl || tailscaleUrl) : (tailscaleUrl || localUrl);
};

const API_BASE_URL = resolveApiBaseUrl();

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const session = await getSession();
  const token = session?.access_token;
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

type TicketTimelineEntry = Record<string, unknown>;
type TicketAuditEntry = Record<string, unknown>;
type TeamPerformanceEntry = {
  name: string;
  resolved?: number;
  inProgress?: number;
  new?: number;
};
type HeatmapCell = {
  day: number;
  hour: number;
  count: number;
};

type HybridSearchResponse = {
  results: BackendSearchResult[];
  query_original: string;
  query_expanded?: string;
  total_candidates: number;
  reranking_enabled: boolean;
  total?: number;
  offset?: number;
  limit?: number;
  has_more?: boolean;
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
    queryKey: [
      'tickets',
      datasetMode,
      filters?.category ?? null,
      filters?.priority ?? null,
      filters?.state ?? null,
      filters?.search ?? null,
      filters?.page ?? null,
      filters?.limit ?? null,
    ],
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
      fetchAPI<TicketTimelineEntry[]>(`/api/tickets/${ticketId}/timeline`),
    staleTime: 2 * 60 * 1000,
    enabled: !!ticketId,
  });
};

export const useTicketAuditLog = (ticketId: string) => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['ticket', datasetMode, ticketId, 'audit'],
    queryFn: () =>
      fetchAPI<TicketAuditEntry[]>(`/api/tickets/${ticketId}/audit`),
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

export const useRelatedTickets = (ticketId: string) => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['tickets', datasetMode, ticketId, 'related'],
    queryFn: () => fetchAPI<Ticket[]>(`/api/tickets/${ticketId}/related`),
    staleTime: 5 * 60 * 1000,
    enabled: !!ticketId,
  });
};

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

export const useAnalyticsMetrics = (period: AnalyticsPeriod = '30d') => {
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

export const useAnalyticsVolume = (period: AnalyticsPeriod = '30d') => {
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

export const useAnalyticsTeamPerformance = (period: AnalyticsPeriod = '30d') => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'team-performance', period],
    queryFn: () =>
      fetchAPI<TeamPerformanceEntry[]>(`/api/analytics/team-performance?period=${period}`),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsHeatmap = (period: AnalyticsPeriod = '30d') => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'heatmap', period],
    queryFn: () =>
      fetchAPI<HeatmapCell[]>(`/api/analytics/heatmap?period=${period}`),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsPriorityBreakdown = (period: AnalyticsPeriod = '30d') => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'priority-breakdown', period],
    queryFn: () =>
      fetchAPI<Record<string, number>>(`/api/analytics/priority-breakdown?period=${period}`),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsSLACompliance = (period: AnalyticsPeriod = '30d') => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'sla-compliance', period],
    queryFn: () =>
      fetchAPI<{ overall: number; byPriority: Record<string, number> }>(
        `/api/analytics/sla-compliance?period=${period}`
      ),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsDuplicates = (period: AnalyticsPeriod = '30d') => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'duplicates', period],
    queryFn: () =>
      fetchAPI<AnalyticsDuplicates>(`/api/analytics/duplicates?period=${period}`),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsIsolation = (period: AnalyticsPeriod = '30d') => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'isolation', period],
    queryFn: () =>
      fetchAPI<AnalyticsIsolation>(`/api/analytics/isolation?period=${period}`),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsModelAccuracy = (period: AnalyticsPeriod = '30d') => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'model-accuracy', period],
    queryFn: () =>
      fetchAPI<AnalyticsModelAccuracy>(`/api/analytics/model-accuracy?period=${period}`),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsSystemBreakdown = (period: AnalyticsPeriod = '30d') => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'systems', period],
    queryFn: () =>
      fetchAPI<AnalyticsSystems>(`/api/analytics/systems?period=${period}`),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsProblemTickets = (period: AnalyticsPeriod = '30d') => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'problem-tickets', period],
    queryFn: () =>
      fetchAPI<AnalyticsProblemTickets>(`/api/analytics/problem-tickets?period=${period}`),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsTeamWorkflow = (period: AnalyticsPeriod = '30d') => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'team-workflow', period],
    queryFn: () =>
      fetchAPI<AnalyticsTeamWorkflow>(`/api/analytics/team-workflow?period=${period}`),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsPredictions = (period: AnalyticsPeriod = '30d') => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'predictions', period],
    queryFn: () =>
      fetchAPI<AnalyticsPredictions>(`/api/analytics/predictions?period=${period}`),
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsRootCauses = (period: AnalyticsPeriod = '30d') => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['analytics', datasetMode, 'root-causes', period],
    queryFn: () =>
      fetchAPI<AnalyticsRootCauses>(`/api/analytics/root-causes?period=${period}`),
    staleTime: 10 * 60 * 1000,
  });
};

// ============================================================================
// SEARCH QUERIES
// ============================================================================

export const useSearchSuggestions = (query: string) => {
  const { datasetMode } = useAuthStore();
  const trimmedQuery = query.trim();
  return useQuery({
    queryKey: ['search', datasetMode, 'suggestions', trimmedQuery],
    queryFn: () =>
      fetchAPI<HybridSearchResponse>(`/search/hybrid`, {
        method: 'POST',
        body: JSON.stringify({
          query: trimmedQuery,
          top_k: 5,
          enable_reranking: false,
          enable_query_expansion: true,
        }),
      }).then((res) =>
        res.results.map((r) => r.short_description || r.number).slice(0, 5)
      ),
    staleTime: 5 * 60 * 1000,
    enabled: trimmedQuery.length > 1,
  });
};

type SemanticSearchFilters = {
  limit?: number;
  offset?: number;
  rerank?: boolean;
  expand?: boolean;
};

export const useSemanticSearch = (query: string, filters?: SemanticSearchFilters) => {
  const { datasetMode } = useAuthStore();
  const limit = filters?.limit ?? 10;
  const offset = filters?.offset ?? 0;
  const rerank = filters?.rerank ?? true;
  const expand = filters?.expand ?? true;
  return useQuery({
    queryKey: ['search', datasetMode, 'semantic', query, limit, offset, rerank, expand],
    queryFn: async () => {
      const payload = {
        query,
        top_k: limit,
        offset,
        enable_reranking: rerank,
        enable_query_expansion: expand,
      };

      const res = await fetchAPI<HybridSearchResponse>(`/search/hybrid`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const tickets = res.results.map(mapSearchResultToTicket);
      const scores = res.results.map(
        (r) => r.rerank_score ?? r.similarity_score ?? 0
      );

      return {
        results: tickets,
        scores,
        total: res.total ?? res.total_candidates ?? res.results.length,
        offset: res.offset ?? offset,
        limit: res.limit ?? limit,
        has_more: res.has_more ?? false,
      };
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
      fetchAPI<UserPreferences>(`/api/user/preferences`),
    staleTime: Infinity, // Doesn't change often
  });
};

export const useUpdateUserPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: UserPreferences) =>
      fetchAPI<UserPreferences>(`/api/user/preferences`, {
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
