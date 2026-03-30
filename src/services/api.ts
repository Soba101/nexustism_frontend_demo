import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Ticket,
  GraphNode,
  GraphEdge,
  UserPreferences,
  CreateProblemTicketForm,
  AnalyticsDuplicates,
  AnalyticsIsolation,
  AnalyticsModelAccuracy,
  AnalyticsSystems,
  AnalyticsProblemTickets,
  AnalyticsTeamWorkflow,
  AnalyticsPredictions,
  AnalyticsRootCauses,
  AnalyticsVectorMap,
  AnalyticsVectorLabelBy,
  AnalyticsPeriod,
  DataStatus,
  ServiceNowConfig,
  ServiceNowConfigForm,
  ServiceNowTestResult,
  ServiceNowSyncStatusItem,
  SyncType,
  UserRoleInfo,
} from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { demoApiRequest } from '@/data/demoApi';
import { IS_STANDALONE_DEMO } from '@/lib/demoMode';
import { getSession } from '@/lib/supabase';

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

const getDatasetMode = () => useAuthStore.getState().datasetMode;

const requireProdDataset = (action: string) => {
  if (IS_STANDALONE_DEMO) {
    return;
  }
  if (getDatasetMode() === 'demo') {
    throw new Error(`${action} is unavailable in the demo dataset.`);
  }
};

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  if (IS_STANDALONE_DEMO) {
    return demoApiRequest<T>(endpoint, options);
  }

  const session = await getSession();
  const token = session?.access_token;
  const datasetMode = getDatasetMode();

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
  priority?: string;
  state?: string;
  assignment_group?: string;
  opened_at?: string;
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
    priority: (result.priority as Ticket['priority']) || 'Medium',
    state: (result.state as Ticket['state']) || 'New',
    opened_at: result.opened_at || new Date().toISOString(),
    assigned_group: result.assignment_group || 'Unassigned',
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
  const datasetMode = useAuthStore((state) => state.datasetMode);

  return useMutation({
    mutationFn: async ({
      ticketId,
      data,
    }: {
      ticketId: string;
      data: Partial<Ticket>;
    }) => {
      requireProdDataset('Ticket updates');
      return fetchAPI<Ticket>(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', datasetMode, data.id] });
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
// DATA STATUS + EMBEDDING MANAGEMENT
// ============================================================================

export const useDataStatus = () => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['data-status', datasetMode],
    queryFn: () => fetchAPI<DataStatus>('/api/data/status'),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
};

export const useEmbedPending = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      requireProdDataset('Re-indexing tickets');
      return fetchAPI<{ processed: number; failed: number; remaining: number }>(
        '/api/data/embed-pending',
        { method: 'POST' },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-status'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
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
        trendTotalTickets?: number;
        trendResolvedTickets?: number;
        trendAvgResolutionTime?: number;
        trendSlaCompliance?: number;
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

type VectorMapOptions = {
  limit?: number;
  labelBy?: AnalyticsVectorLabelBy;
};

export const useAnalyticsVectorMap = (
  period: AnalyticsPeriod = '30d',
  options?: VectorMapOptions
) => {
  const { datasetMode } = useAuthStore();
  const limit = options?.limit ?? 500;
  const labelBy = options?.labelBy ?? 'category';

  return useQuery({
    queryKey: ['analytics', datasetMode, 'vector-map', period, limit, labelBy],
    queryFn: () =>
      fetchAPI<AnalyticsVectorMap>(
        `/api/analytics/vector-map?period=${period}&limit=${limit}&label_by=${labelBy}`
      ),
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
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['causal-graph', datasetMode, ticketId],
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
      requireProdDataset('Graph feedback');
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
      requireProdDataset('Graph feedback');
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
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['user', 'preferences', user?.email ?? 'anonymous'],
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
// PROBLEM TICKET QUERIES
// ============================================================================

export const useAffectedTickets = (problemId: string) => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['tickets', datasetMode, problemId, 'affected'],
    queryFn: () => fetchAPI<Ticket[]>(`/api/tickets/${problemId}/related`),
    staleTime: 5 * 60 * 1000,
    enabled: !!problemId,
  });
};

export const useCreateProblemTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form: CreateProblemTicketForm) => {
      requireProdDataset('Problem ticket creation');
      return fetchAPI<Ticket>(`/api/tickets`, {
        method: 'POST',
        body: JSON.stringify({
          short_description: form.short_description,
          description: form.description,
          category: form.problem_category || 'Problem Investigation',
          priority: form.priority,
          assignment_group: form.assigned_group,
          state: 'New',
          ticket_type: 'problem',
          affected_ticket_ids: form.affected_ticket_ids,
          root_cause_summary: form.root_cause_summary,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
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

// ============================================================================
// SERVICENOW CONFIGURATION (Admin)
// ============================================================================

/**
 * Get current user's role
 */
export const useUserRole = () => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['user', 'role', user?.email ?? 'anonymous'],
    queryFn: () => fetchAPI<UserRoleInfo>('/api/user/role'),
    staleTime: Infinity,
  });
};

/**
 * Get ServiceNow configuration (admin only)
 */
export const useServiceNowConfig = (enabled: boolean = true) => {
  const { user, datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['admin', 'servicenow', 'config', datasetMode, user?.email ?? 'anonymous'],
    queryFn: () => fetchAPI<ServiceNowConfig>('/api/admin/servicenow/config'),
    staleTime: 30_000,
    enabled,
  });
};

/**
 * Update ServiceNow configuration (admin only)
 */
export const useUpdateServiceNowConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: ServiceNowConfigForm) => {
      requireProdDataset('ServiceNow configuration');
      return fetchAPI<{ success: boolean; message: string }>('/api/admin/servicenow/config', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'servicenow', 'config'] });
    },
  });
};

/**
 * Test ServiceNow connection (admin only)
 */
export const useTestServiceNowConnection = () => {
  return useMutation({
    mutationFn: (config?: ServiceNowConfigForm) => {
      requireProdDataset('ServiceNow connection testing');
      return fetchAPI<ServiceNowTestResult>('/api/admin/servicenow/test', {
        method: 'POST',
        body: config ? JSON.stringify(config) : '{}',
      });
    },
  });
};

/**
 * Get ServiceNow sync status history
 */
export const useServiceNowSyncStatus = (enabled: boolean = true) => {
  const { user, datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['admin', 'servicenow', 'sync-status', datasetMode, user?.email ?? 'anonymous'],
    queryFn: () => fetchAPI<ServiceNowSyncStatusItem[]>('/api/admin/servicenow/sync/status'),
    staleTime: 10_000,
    refetchInterval: (query) => {
      // Poll every 5s if there's a running sync
      const data = query.state.data;
      const hasRunning = data?.some((s) => s.status === 'running');
      return hasRunning ? 5_000 : 30_000;
    },
    enabled,
  });
};

/**
 * Trigger ServiceNow sync (admin only)
 */
export const useTriggerServiceNowSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (syncType: SyncType) => {
      requireProdDataset('ServiceNow sync');
      return fetchAPI<{ job_id: number; message: string; command: string }>('/api/admin/servicenow/sync/trigger', {
        method: 'POST',
        body: JSON.stringify({ sync_type: syncType }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'servicenow', 'sync-status'] });
    },
  });
};
