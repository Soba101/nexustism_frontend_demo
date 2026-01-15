# Migration Guide: From Mock Data to API Hooks

This document shows exact code patterns for migrating each page from MOCK_TICKETS to API hooks.

---

## SearchPage.tsx Migration

### ❌ BEFORE (Current - Using MOCK_TICKETS):
```tsx
import { MOCK_TICKETS } from '@/data/mockTickets';

export const SearchPage = ({ onSelectIncident, setIsMobileOpen, addToast }) => {
  const [filteredIncidents, setFilteredIncidents] = useState(MOCK_TICKETS);
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    // Manual filtering logic
    const results = MOCK_TICKETS.filter(t => 
      t.short_description.includes(searchQuery)
    );
    setFilteredIncidents(results);
  }, [searchQuery]);
  
  return (
    // Render filteredIncidents
  );
};
```

### ✅ AFTER (Using React Query):
```tsx
import { useTickets } from '@/services/api';

export const SearchPage = ({ onSelectIncident, setIsMobileOpen, addToast }) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // API call with filters
  const { data, isLoading, error } = useTickets({
    search: searchQuery,
    category: selectedCategory,
    priority: selectedPriorities,
    page: currentPage,
    limit: 10
  });
  
  if (isLoading) {
    return <div className="p-8">Loading tickets...</div>;
  }
  
  if (error) {
    return (
      <div className="p-8 text-red-600">
        Failed to load tickets: {error.message}
      </div>
    );
  }
  
  return (
    <div>
      {/* Render data.tickets instead of filteredIncidents */}
      {data?.tickets.map(ticket => (
        <div key={ticket.id} onClick={() => onSelectIncident(ticket)}>
          {ticket.number}
        </div>
      ))}
      
      {/* Update pagination counter */}
      <p>Showing {(currentPage - 1) * 10 + 1} - {Math.min(currentPage * 10, data?.total)} of {data?.total}</p>
    </div>
  );
};
```

---

## AnalyticsPage.tsx Migration

### ❌ BEFORE (Hardcoded values):
```tsx
const AnalyticsPage = ({ addToast }) => {
  const totalTickets = 1284;  // Hardcoded
  const avgResolution = '2.5 hours';  // Hardcoded
  const slaCompliance = 84;  // Hardcoded
  
  return (
    <div>
      <Card>
        <CardContent>
          <h3>{totalTickets}</h3>
          <p>Total Tickets</p>
        </CardContent>
      </Card>
    </div>
  );
};
```

### ✅ AFTER (Using API hooks):
```tsx
import { 
  useAnalyticsMetrics, 
  useAnalyticsVolume, 
  useAnalyticsTeamPerformance,
  useAnalyticsHeatmap,
  useAnalyticsPriorityBreakdown,
  useAnalyticsSLACompliance
} from '@/services/api';

const AnalyticsPage = ({ addToast }) => {
  const period = periodSelector; // From state
  
  const { data: metrics, isLoading } = useAnalyticsMetrics(period);
  const { data: volume } = useAnalyticsVolume(period);
  const { data: teams } = useAnalyticsTeamPerformance();
  const { data: slaData } = useAnalyticsSLACompliance();
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div>
      <Card>
        <CardContent>
          <h3>{metrics?.totalTickets}</h3>
          <p>Total Tickets</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent>
          <h3>{metrics?.avgResolutionTime}</h3>
          <p>Avg Resolution Time</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent>
          <h3>{slaData?.overall}%</h3>
          <p>SLA Compliance</p>
        </CardContent>
      </Card>
      
      <LineChart data={volume} />
    </div>
  );
};
```

---

## DashboardPage.tsx Migration

### ✅ Simple Pattern for Recent Tickets:
```tsx
import { useTickets, useAnalyticsMetrics } from '@/services/api';

export const DashboardPage = ({ addToast }) => {
  // Get recent tickets
  const { data: ticketsData } = useTickets({ limit: 5 });
  
  // Get KPI metrics
  const { data: metrics } = useAnalyticsMetrics('30d');
  
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <h3>{metrics?.totalTickets || 0}</h3>
            <p>Total Tickets</p>
            <p className="text-sm text-green-600">↑ 12%</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Tickets Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {ticketsData?.tickets.map(ticket => (
            <div key={ticket.id} className="flex justify-between p-2 border-b">
              <span>{ticket.number}</span>
              <span>{ticket.short_description}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## RootCauseAnalysisPage.tsx Migration

### Current State (Already partially integrated):
```tsx
import { useCausalGraph, useSubmitGraphFeedback, useFlagGraphIncorrect } from '@/services/api';

export const RootCauseAnalysisPage = ({ 
  setActivePage, 
  addToast, 
  targetTicket 
}) => {
  // Fetch causal graph for selected ticket
  const { data: graphData, isLoading } = useCausalGraph(targetTicket?.id);
  
  // Submit feedback to backend
  const { mutate: submitFeedback } = useSubmitGraphFeedback();
  
  // Flag incorrect relationships
  const { mutate: flagIncorrect } = useFlagGraphIncorrect();
  
  const handleSubmitValidation = async () => {
    submitFeedback({
      ticketId: targetTicket?.id,
      nodeId: selectedNode.id,
      rating: validation.rating,
      confidence: validation.confidence,
      evidence: validation.evidence
    }, {
      onSuccess: () => {
        addToast('Feedback submitted for model retraining', 'success');
        setValidation({ rating: 0, confidence: 50, evidence: '' });
      }
    });
  };
  
  return (
    <div>
      {/* Header with target ticket info */}
      {targetTicket && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h2>Root Cause Analysis: {targetTicket.number}</h2>
          <p>{targetTicket.short_description}</p>
        </div>
      )}
      
      {/* Graph Canvas */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <GraphCanvas 
          nodes={graphData?.nodes || []}
          edges={graphData?.edges || []}
          // ... other props
        />
      )}
    </div>
  );
};
```

---

## TicketDetailPanel.tsx Migration

### ❌ BEFORE (Static timeline):
```tsx
const [timelineEvents] = useState([
  {
    timestamp: '2026-01-10T11:00:00Z',
    action: 'Opened',
    actor: 'John Smith',
    details: 'Ticket created'
  },
  {
    timestamp: '2026-01-10T12:30:00Z',
    action: 'Assignment Changed',
    actor: 'Auto-assigned',
    details: 'Assigned to Network Ops'
  }
]);
```

### ✅ AFTER (API data):
```tsx
import { useTicketTimeline, useTicketAuditLog, useTicket } from '@/services/api';

export const TicketDetailPanel = ({ ticket }) => {
  const { data: timeline } = useTicketTimeline(ticket?.id);
  const { data: auditLog } = useTicketAuditLog(ticket?.id);
  
  return (
    <Tabs defaultValue="overview">
      <TabsContent value="timeline">
        {timeline?.map((event) => (
          <div key={event.id} className="flex gap-4 p-4 border-b">
            <div className="font-mono text-sm">
              {new Date(event.timestamp).toLocaleString()}
            </div>
            <div>
              <p className="font-medium">{event.action}</p>
              <p className="text-sm text-slate-600">{event.details}</p>
            </div>
          </div>
        ))}
      </TabsContent>
      
      <TabsContent value="audit">
        {auditLog?.map((entry) => (
          <div key={entry.id} className="text-sm p-2 border-b">
            {entry.field}: {entry.old_value} → {entry.new_value}
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
};
```

---

## Important: Cache Invalidation Patterns

### After Updating a Ticket:
```tsx
import { useUpdateTicket } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';

const UpdateButton = ({ ticketId }) => {
  const queryClient = useQueryClient();
  const { mutate } = useUpdateTicket();
  
  const handleUpdate = () => {
    mutate({
      ticketId,
      data: { state: 'Resolved' }
    }, {
      onSuccess: () => {
        // Invalidates these caches automatically:
        // - ['tickets'] → forces refetch of list
        // - ['ticket', ticketId] → forces refetch of detail
        addToast('Ticket updated', 'success');
      }
    });
  };
  
  return <Button onClick={handleUpdate}>Resolve</Button>;
};
```

### Manual Cache Invalidation:
```tsx
const queryClient = useQueryClient();

const handleBulkUpdate = async () => {
  // ... update logic ...
  
  // Manually invalidate specific caches
  await queryClient.invalidateQueries({ queryKey: ['tickets'] });
  await queryClient.invalidateQueries({ queryKey: ['analytics', 'metrics'] });
};
```

---

## Error Handling Pattern

Every page should handle errors:

```tsx
const { data, isLoading, error } = useTickets({...});

if (isLoading) {
  return <LoadingSkeletons />;
}

if (error) {
  return (
    <ErrorState 
      title="Failed to load tickets"
      message={error.message}
      onRetry={() => queryClient.invalidateQueries({ queryKey: ['tickets'] })}
    />
  );
}

return (
  <div>
    {data?.tickets.length === 0 ? (
      <EmptyState message="No tickets found" />
    ) : (
      data?.tickets.map(ticket => <TicketRow key={ticket.id} ticket={ticket} />)
    )}
  </div>
);
```

---

## Migration Checklist

- [ ] Remove `import { MOCK_TICKETS }` from page
- [ ] Import API hooks: `import { useTickets, ... } from '@/services/api'`
- [ ] Replace local state with hook data
- [ ] Add loading state handling
- [ ] Add error state handling
- [ ] Update JSX to use `data?.property` instead of local state
- [ ] Remove manual filtering logic (backend handles it)
- [ ] Test with actual backend API
- [ ] Verify pagination works with API
- [ ] Verify sorting works with API
- [ ] Check cache invalidation on mutations

---

**Last Updated:** January 15, 2026  
**Ready for Integration:** ✅ Yes
