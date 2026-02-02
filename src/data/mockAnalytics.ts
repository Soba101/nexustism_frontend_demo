import { MOCK_TICKETS } from './mockTickets';
import type {
  AnalyticsDuplicates,
  AnalyticsIsolation,
  AnalyticsModelAccuracy,
  AnalyticsSystems,
  AnalyticsProblemTickets,
  AnalyticsTeamWorkflow,
  AnalyticsPredictions,
  AnalyticsRootCauses,
  AnalyticsPeriod,
  TicketPriority,
} from '@/types';

const periodDays = (period: AnalyticsPeriod) =>
  period === '7d' ? 7 : period === '30d' ? 30 : 90;

const getDateSeries = (period: AnalyticsPeriod) => {
  const days = periodDays(period);
  const base = new Date();
  return Array.from({ length: days }, (_, idx) => {
    const date = new Date(base);
    date.setDate(base.getDate() - (days - 1 - idx));
    return date.toISOString().slice(0, 10);
  });
};

const safeDivide = (value: number, total: number) => (total > 0 ? value / total : 0);

export const getMockMetrics = (period: AnalyticsPeriod) => {
  const days = periodDays(period);
  const scale = days / 30;
  return {
    totalTickets: Math.round(MOCK_TICKETS.length * scale),
    resolvedTickets: Math.round(
      MOCK_TICKETS.filter((t) => t.state === 'Resolved' || t.state === 'Closed').length * scale
    ),
    avgResolutionTime: 4.2,
    adoptionRate: 78,
  };
};

export const getMockVolume = (period: AnalyticsPeriod) => {
  const days = periodDays(period);
  const data: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().slice(0, 10),
      count: Math.floor(Math.random() * 8) + 2,
    });
  }
  return data;
};

export const getMockTeamPerformance = (period: AnalyticsPeriod) => {
  const groups = [...new Set(MOCK_TICKETS.map((t) => t.assigned_group))];
  const scale = periodDays(period) / 30;
  return groups.slice(0, 6).map((name) => {
    const tickets = MOCK_TICKETS.filter((t) => t.assigned_group === name);
    return {
      name,
      resolved: Math.round(tickets.filter((t) => t.state === 'Resolved' || t.state === 'Closed').length * scale) || 1,
      inProgress: tickets.filter((t) => t.state === 'In Progress').length,
      new: tickets.filter((t) => t.state === 'New').length,
    };
  });
};

export const getMockHeatmap = (_period: AnalyticsPeriod) => {
  const cells: { day: number; hour: number; count: number }[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const isWorkHours = hour >= 8 && hour <= 18;
      const isWeekday = day >= 1 && day <= 5;
      const base = isWorkHours && isWeekday ? 6 : isWorkHours || isWeekday ? 3 : 1;
      cells.push({ day, hour, count: Math.floor(Math.random() * base) + (isWorkHours && isWeekday ? 2 : 0) });
    }
  }
  return cells;
};

export const getMockPriorityBreakdown = (_period: AnalyticsPeriod) => {
  const counts: Record<string, number> = {};
  for (const t of MOCK_TICKETS) {
    counts[t.priority] = (counts[t.priority] || 0) + 1;
  }
  return counts;
};

export const getMockSLACompliance = (_period: AnalyticsPeriod) => ({
  overall: 87,
  byPriority: {
    Critical: 72,
    High: 81,
    Medium: 92,
    Low: 97,
  },
});

// ---------------------------------------------------------------------------
// Advanced analytics mocks
// ---------------------------------------------------------------------------

export const getMockDuplicates = (period: AnalyticsPeriod): AnalyticsDuplicates => {
  const totalTickets = MOCK_TICKETS.length;
  const relatedTickets = MOCK_TICKETS.filter((t) => (t.related_ids?.length ?? 0) > 0);
  const duplicateCount = relatedTickets.length;
  const clusterCount = Math.max(1, Math.round(duplicateCount / 3));
  const avgClusterSize = clusterCount > 0 ? duplicateCount / clusterCount : 0;

  const trend = getDateSeries(period).map((date, idx, arr) => {
    const base = safeDivide(duplicateCount, totalTickets);
    const variance = Math.sin((idx / Math.max(1, arr.length - 1)) * Math.PI) * 0.04;
    return { date, duplicate_rate: Math.max(0, Math.min(1, base + variance)) };
  });

  const themes = Object.values(
    relatedTickets.reduce((acc, ticket) => {
      const key = `${ticket.category}-Recurring`;
      if (!acc[key]) {
        acc[key] = { theme: 'Recurring ' + ticket.category, category: ticket.category, count: 0 };
      }
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { theme: string; category: string; count: number }>)
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    period,
    cluster_count: clusterCount,
    duplicate_rate: safeDivide(duplicateCount, totalTickets),
    avg_cluster_size: Math.round(avgClusterSize * 10) / 10,
    trend,
    top_themes: themes.length > 0 ? themes : [
      { theme: 'VPN Connectivity', category: 'Network', count: 5 },
      { theme: 'Email Delivery Delays', category: 'Software', count: 3 },
    ],
  };
};

export const getMockIsolation = (period: AnalyticsPeriod): AnalyticsIsolation => {
  const totalTickets = MOCK_TICKETS.length;
  const isolatedTickets = MOCK_TICKETS.filter((t) => (t.related_ids?.length ?? 0) === 0);

  const byPriority = (['Critical', 'High', 'Medium', 'Low'] as TicketPriority[]).map((priority) => ({
    priority,
    count: isolatedTickets.filter((t) => t.priority === priority).length,
  }));

  const byCategory = Object.entries(
    isolatedTickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, count]) => ({ category, count }));

  const trend = getDateSeries(period).map((date, idx, arr) => {
    const base = safeDivide(isolatedTickets.length, totalTickets);
    const variance = Math.cos((idx / Math.max(1, arr.length - 1)) * Math.PI) * 0.03;
    return { date, isolation_rate: Math.max(0, Math.min(1, base + variance)) };
  });

  return {
    period,
    isolated_count: isolatedTickets.length,
    isolation_rate: safeDivide(isolatedTickets.length, totalTickets),
    by_priority: byPriority,
    by_category: byCategory,
    trend,
  };
};

export const getMockModelAccuracy = (period: AnalyticsPeriod): AnalyticsModelAccuracy => {
  const buckets = [
    { label: '0-20', min: 0, max: 19 },
    { label: '20-40', min: 20, max: 39 },
    { label: '40-60', min: 40, max: 59 },
    { label: '60-80', min: 60, max: 79 },
    { label: '80-100', min: 80, max: 100 },
  ];

  const histogram = buckets.map((bucket) => ({
    bucket: bucket.label,
    count: MOCK_TICKETS.filter(
      (t) => t.similarity_score >= bucket.min && t.similarity_score <= bucket.max
    ).length,
  }));

  const highConfidence = MOCK_TICKETS.filter((t) => t.similarity_score >= 80).length;
  const total = MOCK_TICKETS.length;

  const trend = getDateSeries(period).filter((_, idx) => idx % 4 === 0);
  const graphFeedback = trend.map((date, idx) => ({
    date,
    positive: 12 + idx * 2,
    negative: 3 + (idx % 2),
  }));

  return {
    period,
    similarity_histogram: histogram,
    high_confidence_rate: safeDivide(highConfidence, total),
    query_expansion_hit_rate: {
      with_expansion: 0.68,
      without_expansion: 0.49,
    },
    graph_feedback: graphFeedback,
    false_positive_rate: 0.08,
  };
};

export const getMockSystems = (period: AnalyticsPeriod): AnalyticsSystems => {
  const byCategory = Object.values(
    MOCK_TICKETS.reduce((acc, ticket) => {
      if (!acc[ticket.category]) {
        acc[ticket.category] = {
          system: ticket.category,
          tickets: [],
        };
      }
      acc[ticket.category].tickets.push(ticket);
      return acc;
    }, {} as Record<string, { system: string; tickets: typeof MOCK_TICKETS }>)
  );

  const systems = byCategory.map((item) => {
    const total = item.tickets.length;
    const critical = item.tickets.filter((t) => t.priority === 'Critical').length;
    const resolutionHours = item.tickets
      .filter((t) => t.resolved_at)
      .map((t) => {
        const opened = new Date(t.opened_at).getTime();
        const resolved = new Date(t.resolved_at ?? t.opened_at).getTime();
        return Math.max(0.5, (resolved - opened) / (1000 * 60 * 60));
      });

    const avgResolution = resolutionHours.length
      ? resolutionHours.reduce((sum, value) => sum + value, 0) / resolutionHours.length
      : 4.2;

    const problemCount = item.tickets.filter((t) => t.ticket_type === 'problem').length;

    return {
      system: item.system,
      ticket_count: total,
      critical_pct: safeDivide(critical, total),
      avg_resolution_hours: Math.round(avgResolution * 10) / 10,
      sla_compliance_pct: Math.max(70, 95 - critical * 4),
      problem_ticket_count: problemCount,
    };
  });

  return { period, systems };
};

export const getMockProblemTickets = (period: AnalyticsPeriod): AnalyticsProblemTickets => {
  const problemTickets = MOCK_TICKETS.filter(
    (t) => t.ticket_type === 'problem' || t.number.startsWith('PRB')
  );
  const incidentTickets = MOCK_TICKETS.filter((t) => t.ticket_type !== 'problem');

  const byCategory = problemTickets.reduce((acc, ticket) => {
    const category = ticket.problem_category ?? 'Unknown';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const lifecycleTrend = getDateSeries(period).filter((_, idx) => idx % 5 === 0);
  const trend = lifecycleTrend.map((date, idx) => ({
    date,
    open: Math.max(0, 4 - idx),
    resolved: Math.min(3, idx),
  }));

  const timeToCreation = problemTickets
    .map((ticket) => {
      const related = ticket.affected_ticket_ids ?? [];
      const earliest = related
        .map((id) => MOCK_TICKETS.find((t) => t.id === id))
        .filter(Boolean)
        .map((t) => new Date(t!.opened_at).getTime());
      if (!earliest.length) return 24;
      const minOpened = Math.min(...earliest);
      const created = new Date(ticket.opened_at).getTime();
      return Math.max(1, (created - minOpened) / (1000 * 60 * 60));
    })
    .filter((value) => Number.isFinite(value));

  const avgTimeToCreation = timeToCreation.length
    ? timeToCreation.reduce((sum, value) => sum + value, 0) / timeToCreation.length
    : 24;

  return {
    period,
    problem_count: problemTickets.length,
    escalation_rate: safeDivide(problemTickets.length, incidentTickets.length),
    avg_incidents_per_problem: problemTickets.length
      ? problemTickets.reduce((sum, t) => sum + (t.affected_ticket_ids?.length ?? 0), 0) /
        problemTickets.length
      : 0,
    by_category: Object.entries(byCategory).map(([category, count]) => ({
      category: category as AnalyticsProblemTickets['by_category'][number]['category'],
      count,
    })),
    lifecycle_trend: trend,
    time_to_creation_hours: Math.round(avgTimeToCreation * 10) / 10,
  };
};

export const getMockTeamWorkflow = (period: AnalyticsPeriod): AnalyticsTeamWorkflow => {
  const groups = [...new Set(MOCK_TICKETS.map((t) => t.assigned_group))].slice(0, 6);

  const teamLoad = groups.map((group) => {
    const teamTickets = MOCK_TICKETS.filter((t) => t.assigned_group === group);
    const newCount = teamTickets.filter((t) => t.state === 'New').length;
    const inProgress = teamTickets.filter((t) => t.state === 'In Progress').length;
    const backlog = Math.max(0, Math.round(teamTickets.length * 0.15));
    return { team: group, new: newCount, in_progress: inProgress, backlog };
  });

  const paths = groups.slice(0, 4);
  const escalationPaths = paths.flatMap((from, idx) => {
    const to = paths[(idx + 1) % paths.length];
    return { from, to, count: 3 + idx };
  });

  const responseBuckets = ['0-15m', '15-30m', '30-60m', '1-4h', '4-24h'];
  const responseHistogram = responseBuckets.map((bucket, idx) => ({
    bucket,
    count: 6 + idx * 3,
  }));

  return {
    period,
    team_load: teamLoad,
    first_touch_rate: 0.67,
    escalation_paths: escalationPaths,
    response_time_histogram: responseHistogram,
  };
};

export const getMockPredictions = (period: AnalyticsPeriod): AnalyticsPredictions => {
  const baseVolume = getMockVolume(period);
  const average = baseVolume.reduce((sum, value) => sum + value.count, 0) / Math.max(1, baseVolume.length);
  const forecast = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date();
    date.setDate(date.getDate() + idx + 1);
    return {
      date: date.toISOString().slice(0, 10),
      predicted: Math.max(2, Math.round(average + (idx % 3) * 2)),
    };
  });

  const emergingClusters = [
    { theme: 'VPN Connectivity', count: 4, system: 'Network' },
    { theme: 'Email Delivery Delay', count: 3, system: 'Software' },
    { theme: 'Database Timeouts', count: 2, system: 'Database' },
  ];

  const seasonal = getMockHeatmap(period).map((cell) => ({
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][cell.day],
    hour: cell.hour,
    count: cell.count,
  }));

  return {
    period,
    forecast,
    emerging_clusters: emergingClusters,
    seasonal_patterns: seasonal,
  };
};

export const getMockRootCauses = (period: AnalyticsPeriod): AnalyticsRootCauses => {
  const problemTickets = MOCK_TICKETS.filter((t) => t.ticket_type === 'problem');
  const withRootCause = problemTickets.filter((t) => t.root_cause_summary);
  const coverage = safeDivide(withRootCause.length, Math.max(1, problemTickets.length));

  const rootCauseCounts = withRootCause.reduce((acc, ticket) => {
    const cause = ticket.root_cause_summary ?? 'Unknown';
    acc[cause] = (acc[cause] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topRootCauses = Object.entries(rootCauseCounts).map(([cause, count]) => ({
    cause,
    count,
  }));

  const depthHistogram = [1, 2, 3, 4, 5].map((depth, idx) => ({
    depth,
    count: 4 - Math.min(idx, 3),
  }));

  return {
    period,
    coverage_pct: Math.round(coverage * 100) / 100,
    top_root_causes: topRootCauses.length
      ? topRootCauses
      : [
          { cause: 'ISP peering instability', count: 3 },
          { cause: 'Expired certificates', count: 2 },
        ],
    graph_depth_histogram: depthHistogram,
    change_related_pct: 0.21,
  };
};
