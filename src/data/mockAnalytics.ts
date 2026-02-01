import { MOCK_TICKETS } from './mockTickets';

const periodDays = (period: '7d' | '30d' | '90d') =>
  period === '7d' ? 7 : period === '30d' ? 30 : 90;

export const getMockMetrics = (period: '7d' | '30d' | '90d') => {
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

export const getMockVolume = (period: '7d' | '30d' | '90d') => {
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

export const getMockTeamPerformance = (period: '7d' | '30d' | '90d') => {
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

export const getMockHeatmap = (_period: '7d' | '30d' | '90d') => {
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

export const getMockPriorityBreakdown = (_period: '7d' | '30d' | '90d') => {
  const counts: Record<string, number> = {};
  for (const t of MOCK_TICKETS) {
    counts[t.priority] = (counts[t.priority] || 0) + 1;
  }
  return counts;
};

export const getMockSLACompliance = (_period: '7d' | '30d' | '90d') => ({
  overall: 87,
  byPriority: {
    Critical: 72,
    High: 81,
    Medium: 92,
    Low: 97,
  },
});
