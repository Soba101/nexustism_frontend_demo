import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Ticket, GraphNode, GraphEdge, UserPreferences, CreateProblemTicketForm } from '@/types';
import { MOCK_TICKETS, GRAPH_NODES, GRAPH_EDGES } from '@/data/mockTickets';
import {
  getMockMetrics,
  getMockVolume,
  getMockTeamPerformance,
  getMockHeatmap,
  getMockPriorityBreakdown,
  getMockSLACompliance,
} from '@/data/mockAnalytics';
import { getMockTimeline, getMockAuditLog } from '@/data/mockTimeline';
import { MOCK_USER_PREFERENCES } from '@/data/mockUserPreferences';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const delay = (ms = 200) => new Promise<void>((r) => setTimeout(r, ms));

const getNextProblemNumber = () => {
  const maxNumber = tickets
    .map((ticket) => ticket.number)
    .filter((number) => number.startsWith('PRB'))
    .map((number) => Number(number.replace('PRB', '')))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0);

  const next = String(maxNumber + 1).padStart(6, '0');
  return `PRB${next}`;
};

// In-memory mutable state for mutations
let tickets = [...MOCK_TICKETS];
let userPreferences: UserPreferences = { ...MOCK_USER_PREFERENCES };

// ---------------------------------------------------------------------------
// TICKET QUERIES
// ---------------------------------------------------------------------------

export const useTickets = (filters?: {
  category?: string;
  priority?: string;
  state?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [
      'tickets',
      'demo',
      filters?.category ?? null,
      filters?.priority ?? null,
      filters?.state ?? null,
      filters?.search ?? null,
      filters?.page ?? null,
      filters?.limit ?? null,
    ],
    queryFn: async () => {
      await delay();
      let filtered = [...tickets];
      if (filters?.category) filtered = filtered.filter((t) => t.category === filters.category);
      if (filters?.priority) filtered = filtered.filter((t) => t.priority === filters.priority);
      if (filters?.state) filtered = filtered.filter((t) => t.state === filters.state);
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.short_description.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.number.toLowerCase().includes(q)
        );
      }
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 10;
      const start = (page - 1) * limit;
      return {
        tickets: filtered.slice(start, start + limit),
        total: filtered.length,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useTicket = (ticketId: string) => {
  return useQuery({
    queryKey: ['ticket', 'demo', ticketId],
    queryFn: async () => {
      await delay();
      const t = tickets.find((t) => t.id === ticketId || t.number === ticketId);
      if (!t) throw new Error('Ticket not found');
      return t;
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!ticketId,
  });
};

export const useTicketTimeline = (ticketId: string) => {
  return useQuery({
    queryKey: ['ticket', 'demo', ticketId, 'timeline'],
    queryFn: async () => {
      await delay();
      return getMockTimeline(ticketId);
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!ticketId,
  });
};

export const useTicketAuditLog = (ticketId: string) => {
  return useQuery({
    queryKey: ['ticket', 'demo', ticketId, 'audit'],
    queryFn: async () => {
      await delay();
      return getMockAuditLog(ticketId);
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!ticketId,
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, data }: { ticketId: string; data: Partial<Ticket> }) => {
      await delay();
      const idx = tickets.findIndex((t) => t.id === ticketId);
      if (idx === -1) throw new Error('Ticket not found');
      tickets[idx] = { ...tickets[idx], ...data };
      return tickets[idx];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', data.id] });
    },
  });
};

export const useRelatedTickets = (ticketId: string) => {
  return useQuery({
    queryKey: ['tickets', 'demo', ticketId, 'related'],
    queryFn: async () => {
      await delay();
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) return [];
      return tickets.filter((t) => ticket.related_ids.includes(t.id));
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!ticketId,
  });
};

export const useAffectedTickets = (problemId: string) => {
  return useQuery({
    queryKey: ['tickets', 'demo', problemId, 'affected'],
    queryFn: async () => {
      await delay();
      const problemTicket = tickets.find((t) => t.id === problemId || t.number === problemId);
      if (!problemTicket?.affected_ticket_ids?.length) return [];
      return tickets.filter(
        (t) =>
          problemTicket.affected_ticket_ids?.includes(t.id) &&
          (t.ticket_type ?? 'incident') === 'incident'
      );
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!problemId,
  });
};

export const useCreateProblemTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form: CreateProblemTicketForm) => {
      await delay();
      const newId = String(
        tickets.reduce((max, ticket) => Math.max(max, Number(ticket.id) || 0), 0) + 1
      );
      const newTicket: Ticket = {
        id: newId,
        number: getNextProblemNumber(),
        short_description: form.short_description,
        description: form.description,
        category: 'Problem Investigation',
        priority: form.priority,
        state: 'New',
        opened_at: new Date().toISOString(),
        assigned_group: form.assigned_group,
        similarity_score: 100,
        related_ids: [...form.affected_ticket_ids],
        ticket_type: 'problem',
        problem_category: form.problem_category,
        affected_ticket_ids: [...form.affected_ticket_ids],
        root_cause_summary: form.root_cause_summary,
      };

      tickets = [newTicket, ...tickets].map((ticket) => {
        if (!form.affected_ticket_ids.includes(ticket.id)) {
          return ticket;
        }
        const relatedIds = new Set(ticket.related_ids ?? []);
        relatedIds.add(newTicket.id);
        return { ...ticket, related_ids: Array.from(relatedIds) };
      });

      return newTicket;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', created.id] });
      queryClient.invalidateQueries({ queryKey: ['causal-graph'] });
    },
  });
};

// ---------------------------------------------------------------------------
// ANALYTICS QUERIES
// ---------------------------------------------------------------------------

export const useAnalyticsMetrics = (period: '7d' | '30d' | '90d' = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'demo', 'metrics', period],
    queryFn: async () => {
      await delay();
      return getMockMetrics(period);
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsVolume = (period: '7d' | '30d' | '90d' = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'demo', 'volume', period],
    queryFn: async () => {
      await delay();
      return getMockVolume(period);
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsTeamPerformance = (period: '7d' | '30d' | '90d' = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'demo', 'team-performance', period],
    queryFn: async () => {
      await delay();
      return getMockTeamPerformance(period);
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsHeatmap = (period: '7d' | '30d' | '90d' = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'demo', 'heatmap', period],
    queryFn: async () => {
      await delay();
      return getMockHeatmap(period);
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsPriorityBreakdown = (period: '7d' | '30d' | '90d' = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'demo', 'priority-breakdown', period],
    queryFn: async () => {
      await delay();
      return getMockPriorityBreakdown(period);
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useAnalyticsSLACompliance = (period: '7d' | '30d' | '90d' = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'demo', 'sla-compliance', period],
    queryFn: async () => {
      await delay();
      return getMockSLACompliance(period);
    },
    staleTime: 10 * 60 * 1000,
  });
};

// ---------------------------------------------------------------------------
// SEARCH QUERIES
// ---------------------------------------------------------------------------

export const useSearchSuggestions = (query: string) => {
  const trimmedQuery = query.trim();
  return useQuery({
    queryKey: ['search', 'demo', 'suggestions', trimmedQuery],
    queryFn: async () => {
      await delay(100);
      const q = trimmedQuery.toLowerCase();
      return tickets
        .filter((t) => t.short_description.toLowerCase().includes(q))
        .map((t) => t.short_description)
        .slice(0, 5);
    },
    staleTime: 5 * 60 * 1000,
    enabled: trimmedQuery.length > 1,
  });
};

export const useSemanticSearch = (
  query: string,
  filters?: { limit?: number; offset?: number; rerank?: boolean; expand?: boolean }
) => {
  const limit = filters?.limit ?? 10;
  const offset = filters?.offset ?? 0;
  const rerank = filters?.rerank ?? true;
  const expand = filters?.expand ?? true;
  return useQuery({
    queryKey: ['search', 'demo', 'semantic', query, limit, offset, rerank, expand],
    queryFn: async () => {
      await delay(300);
      const q = query.toLowerCase();
      const keywords = q.split(/\s+/);

      const scored = tickets
        .map((t) => {
          const text = `${t.short_description} ${t.description}`.toLowerCase();
          const hits = keywords.filter((kw) => text.includes(kw)).length;
          const score = hits / keywords.length;
          return { ticket: t, score };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score);

      const total = scored.length;
      const paged = scored.slice(offset, offset + limit);

      return {
        results: paged.map((s) => ({
          ...s.ticket,
          similarity_score: Math.round(s.score * 100),
        })),
        scores: paged.map((s) => s.score),
        total,
        offset,
        limit,
        has_more: offset + limit < total,
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
  return useQuery({
    queryKey: ['search', 'demo', 'causal', query, options],
    queryFn: async () => {
      await delay(300);
      const q = query.toLowerCase();
      return tickets
        .filter(
          (t) =>
            t.short_description.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q)
        )
        .slice(0, options?.top_k ?? 5);
    },
    staleTime: 2 * 60 * 1000,
    enabled: query.trim().length > 0,
  });
};

// ---------------------------------------------------------------------------
// CAUSAL GRAPH QUERIES
// ---------------------------------------------------------------------------

export const useCausalGraph = (ticketId: string) => {
  return useQuery({
    queryKey: ['causal-graph', ticketId],
    queryFn: async (): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> => {
      await delay(300);
      const ticket = tickets.find((t) => t.id === ticketId || t.number === ticketId);
      const isProblemTicket =
        ticket?.ticket_type === 'problem' || ticket?.number?.startsWith('PRB');

      if (ticket && isProblemTicket) {
        const affectedTickets = tickets.filter((item) =>
          ticket.affected_ticket_ids?.includes(item.id)
        );

        const nodes: GraphNode[] = [
          {
            id: ticket.id,
            label: ticket.number,
            type: 'problem',
            details: `Problem Investigation: ${ticket.short_description}`,
          },
          ...affectedTickets.map(
            (incident): GraphNode => ({
              id: incident.id,
              label: incident.number,
              type: 'root',
              details: `Incident: ${incident.short_description}`,
            })
          ),
        ];

        const edges: GraphEdge[] = affectedTickets.map((incident) => ({
          source: incident.id,
          target: ticket.id,
          confidence: 0.85,
          label: 'Escalated To',
        }));

        return { nodes, edges };
      }

      return { nodes: GRAPH_NODES, edges: GRAPH_EDGES };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!ticketId,
  });
};

export const useSubmitGraphFeedback = () => {
  return useMutation({
    mutationFn: async (_feedback: {
      ticketId: string;
      nodeId: string;
      rating: number;
      confidence: number;
      evidence: string;
    }) => {
      await delay();
      return { success: true };
    },
  });
};

export const useFlagGraphIncorrect = () => {
  return useMutation({
    mutationFn: async (_data: { ticketId: string; nodeId: string }) => {
      await delay();
      return { success: true };
    },
  });
};

// ---------------------------------------------------------------------------
// SETTINGS / PREFERENCES
// ---------------------------------------------------------------------------

export const useUserPreferences = () => {
  return useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: async () => {
      await delay();
      return userPreferences;
    },
    staleTime: Infinity,
  });
};

export const useUpdateUserPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: UserPreferences) => {
      await delay();
      userPreferences = { ...preferences };
      return userPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'preferences'] });
    },
  });
};

// ---------------------------------------------------------------------------
// UTILITY
// ---------------------------------------------------------------------------

export const exportTicketsAsCSV = async (ticketIds: string[]) => {
  const selected = tickets.filter((t) => ticketIds.includes(t.id));
  const header = 'Number,Description,Category,Priority,State,Opened At\n';
  const rows = selected
    .map(
      (t) =>
        `"${t.number}","${t.short_description}","${t.category}","${t.priority}","${t.state}","${t.opened_at}"`
    )
    .join('\n');
  return new Blob([header + rows], { type: 'text/csv' });
};
