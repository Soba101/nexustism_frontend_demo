# PRD: Advanced Ticket Intelligence Analytics

## 1. Overview

Enhance the existing Analytics page with AI/ML-driven insights covering ticket relationships, duplicate detection, model performance, and operational health. These modules transform raw ticket data into actionable intelligence for IT service managers.

---

## 2. Goals

- Surface hidden patterns in ticket data (duplicates, clusters, isolated incidents)
- Provide visibility into AI model accuracy and effectiveness
- Identify the most problematic systems and recurring failure points
- Enable data-driven decisions on staffing, prioritization, and process improvement

---

## 3. Proposed Analytics Modules

### 3.1 Similar & Duplicate Ticket Analysis

| Metric | Description |
|--------|-------------|
| Duplicate Cluster Count | Number of detected duplicate groups (via problem candidate algorithm) |
| Duplicate Rate | % of incoming tickets that are duplicates of existing ones |
| Average Cluster Size | Mean number of tickets per duplicate group |
| Top Duplicate Themes | Most common duplicate topics by category + description similarity |
| Duplicate Trend | Duplicate detection rate over time (7d / 30d / 90d) |

**Visualizations:**

- Trend line chart of duplicate rate over time
- Bar chart of top 10 duplicate themes
- KPI cards for cluster count, duplicate rate, avg cluster size

---

### 3.2 Problem Ticket Metrics

| Metric | Description |
|--------|-------------|
| Problem Tickets Created | Count and trend over time |
| Escalation Rate | % of incidents escalated to problem tickets |
| Avg Incidents per Problem | Mean `affected_ticket_ids.length` per problem ticket |
| Problem Category Breakdown | Distribution across Configuration, Capacity, Known Error, etc. |
| Time to Problem Creation | Average time from first incident to problem ticket creation |
| Open vs Resolved Problems | Problem ticket lifecycle state over time |

**Visualizations:**

- Donut chart for problem category breakdown
- Stacked bar chart for open vs resolved problems over time
- KPI cards for escalation rate, avg incidents per problem

---

### 3.3 Isolated Ticket Analysis

| Metric | Description |
|--------|-------------|
| Isolated Ticket Count | Tickets with `related_ids.length === 0` |
| Isolation Rate | % of total tickets that are isolated |
| Isolated by Priority | Breakdown showing if critical tickets are going unlinked |
| Isolated by Category/System | Which systems produce the most isolated tickets |
| Isolation Trend | Rate over time (decreasing = model improving) |

**Visualizations:**

- Trend line of isolation rate over time
- Horizontal bar chart of isolation by category
- Priority breakdown donut chart for isolated tickets

---

### 3.4 Model Accuracy & AI Performance

| Metric | Description |
|--------|-------------|
| Similarity Score Distribution | Histogram of `similarity_score` values across all tickets |
| High-Confidence Matches | % of related ticket pairs with score > 80 |
| Query Expansion Effectiveness | Semantic search hit rate with vs without expansion |
| Graph Feedback Stats | Positive vs negative feedback on causal graphs |
| False Positive Rate | % of flagged-as-incorrect graph relationships |

**Visualizations:**

- Histogram of similarity score distribution
- Gauge chart for high-confidence match rate
- Stacked bar of positive vs negative graph feedback over time
- KPI cards for false positive rate, high-confidence %

---

### 3.5 Most Problematic Systems

| Metric | Description |
|--------|-------------|
| Tickets by Category | Ranked bar chart of ticket volume per category |
| Critical Ticket Concentration | Categories with highest critical ticket percentage |
| Repeat Offenders | Systems with the most recurring problem tickets |
| Resolution Time by System | Which systems take longest to resolve |
| SLA Breach by System | SLA compliance broken down by category / assigned group |

**Visualizations:**

- Ranked horizontal bar chart of ticket volume by system
- Heatmap of system vs priority level
- Table with system name, ticket count, critical %, avg resolution time, SLA compliance

---

### 3.6 Operational Intelligence

| Metric | Description |
|--------|-------------|
| MTBF (Mean Time Between Failures) | Average time between incidents per system |
| MTTR (Mean Time to Repair) | Average resolution time by system and team |
| Incident Recurrence Rate | % of tickets reopened or recurring within 30 days |
| Cascade Detection | Incidents that triggered related incidents via causal graph |

**Visualizations:**

- Bar chart comparing MTBF across top systems
- Line chart of MTTR trend over time
- KPI card for recurrence rate

---

### 3.7 Team & Workflow Analytics

| Metric | Description |
|--------|-------------|
| Assignment Group Load | Ticket volume and active backlog per team |
| First-Touch Resolution Rate | % of tickets resolved without reassignment |
| Escalation Paths | Most common assignment group transfer chains |
| Response Time Distribution | Time from ticket creation to first assignment |

**Visualizations:**

- Stacked bar chart of team load (new / in progress / backlog)
- Sankey diagram of escalation paths between teams
- Histogram of response time distribution

---

### 3.8 Predictive & Trend Analytics

| Metric | Description |
|--------|-------------|
| Ticket Volume Forecast | Simple trend projection for next 7 days |
| Emerging Issue Detection | New clusters forming -- spike in similar tickets not yet linked to a problem |
| Seasonal Patterns | Day-of-week and time-of-day patterns (extends existing heatmap) |

**Visualizations:**

- Line chart with forecast projection overlay
- Alert cards for emerging issue clusters
- Enhanced heatmap with seasonal overlay

---

### 3.9 Root Cause Intelligence

| Metric | Description |
|--------|-------------|
| Root Cause Coverage | % of problem tickets with `root_cause_summary` filled |
| Top Root Causes | Ranked list from root cause summaries |
| Causal Graph Depth | Average depth / complexity of causal graphs |
| Change-Related Incidents | % of incidents linked to change records in causal graph |

**Visualizations:**

- Word cloud or ranked bar chart of top root causes
- KPI cards for coverage %, change-related %
- Histogram of causal graph depth

---

## 4. Data Sources

### Existing (client-side aggregation)

- `useTickets` -- ticket list with `related_ids`, `similarity_score`, `ticket_type`, `problem_category`, `affected_ticket_ids`
- `useAnalyticsMetrics` -- total/resolved counts, resolution time, SLA
- `useAnalyticsTeamPerformance` -- team breakdown
- `useRelatedTickets` -- per-ticket similarity data
- `useSubmitGraphFeedback` / `useFlagGraphIncorrect` -- model feedback signals

### New API Endpoints Needed

| Endpoint | Purpose |
|----------|---------|
| `GET /analytics/duplicates?period=` | Duplicate cluster stats, themes, trend |
| `GET /analytics/isolation?period=` | Isolated ticket metrics by priority/category |
| `GET /analytics/model-accuracy?period=` | Similarity distribution, feedback stats |
| `GET /analytics/systems?period=` | Per-system breakdown (volume, critical %, MTTR, SLA) |
| `GET /analytics/problem-tickets?period=` | Problem ticket counts, categories, escalation rate |
| `GET /analytics/team-workflow?period=` | Team load, first-touch rate, escalation paths |
| `GET /analytics/predictions?period=` | Volume forecast, emerging clusters |
| `GET /analytics/root-causes?period=` | Root cause coverage, top causes, graph depth |

---

## 5. Implementation Approach

### UI Structure

Add **tabbed navigation** within the existing AnalyticsPage:

| Tab | Modules |
|-----|---------|
| Overview | Existing metrics (KPIs, SLA, volume trend, priority, heatmap) |
| Ticket Intelligence | 3.1 Duplicates + 3.3 Isolated + 3.2 Problem Tickets |
| AI Performance | 3.4 Model Accuracy + 3.9 Root Cause Intelligence |
| Systems & Teams | 3.5 Problematic Systems + 3.7 Team Workflow + 3.6 Ops Intelligence |
| Predictions | 3.8 Predictive & Trend Analytics |

### New React Query Hooks

```
useAnalyticsDuplicates(period)
useAnalyticsIsolation(period)
useAnalyticsModelAccuracy(period)
useAnalyticsSystemBreakdown(period)
useAnalyticsProblemTickets(period)
useAnalyticsTeamWorkflow(period)
useAnalyticsPredictions(period)
useAnalyticsRootCauses(period)
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/features/analytics/AnalyticsPage.tsx` | Add tab navigation, new chart sections |
| `src/services/api.ts` | Add new analytics hooks |
| `src/services/mockApi.ts` | Add mock data generators for new endpoints |
| `src/types/index.ts` | Add response types for new analytics data |

### Chart Library

Reuse **Recharts** (already installed) for all visualizations.

---

## 6. Success Metrics

- Duplicate detection surfaces clusters that were previously invisible
- Isolation rate trends downward as AI model improves linking accuracy
- Model accuracy dashboard gives confidence scores that ops teams can act on
- "Most problematic system" view drives targeted remediation efforts
- Problem ticket analytics reduce mean time to problem identification

---

## 7. Out of Scope (Future)

- Automated problem ticket creation from duplicate clusters
- ML-based ticket auto-classification
- Real-time streaming analytics
- Custom dashboard builder / drag-and-drop widgets
- External integration (PagerDuty, Slack, Jira) analytics

---

## 8. Personas & User Stories

**Personas**

- IT Service Manager: owns operational KPIs and staffing decisions
- Problem Manager: creates problem tickets and drives RCA
- Team Lead: manages backlog, escalation, and response performance
- Service Desk Analyst: triages incidents and links related work
- Platform/SRE: monitors systemic risk and recurring failures

**Top User Stories**

- As a Service Manager, I want to see duplicate and isolated rates over time so I can measure AI linking quality.
- As a Problem Manager, I want to find emerging clusters so I can open problems earlier.
- As a Team Lead, I want to see my team's load and reassignment paths to reduce handoffs.
- As a Service Desk Analyst, I want to drill into duplicate themes to link tickets quickly.
- As a Platform/SRE, I want to see MTTR/MTBF by system to prioritize fixes.

---

## 9. Functional Requirements

**Global**

- Global time period selector (7d / 30d / 90d / custom range).
- Global filters: category, system, priority, assignment group, site/region.
- All charts support hover tooltips and click-to-drill into ticket lists.
- Export: CSV for tables, PNG for charts.
- KPI cards show current value + delta vs previous period.
- Loading, error, and empty states for each module.

**Module-Specific**

- Duplicate clusters table view (optional) listing theme, size, top system.
- Problem tickets: link to problem record list with filters pre-applied.
- Model performance: toggle between "All tickets" and "Only linked tickets".
- Systems: sortable table with multi-column sort and search.
- Team workflow: Sankey supports hover to show top transfer paths.

---

## 10. Non-Functional Requirements

- Performance: first paint under 2.5s on cached data; charts render under 1s after data loads.
- Data freshness: metrics updated at least every 60 minutes.
- Accessibility: keyboard-navigable tabs, color contrast >= 4.5:1, chart alternatives via data tables.
- Security: metrics respect existing RBAC and tenancy boundaries.
- Reliability: partial failures should not block other modules from rendering.

---

## 11. Data Definitions & Calculations

- Duplicate Cluster Count = count(distinct duplicate_cluster_id).
- Duplicate Rate = duplicate_ticket_count / total_ticket_count.
- Average Cluster Size = duplicate_ticket_count / duplicate_cluster_count.
- Isolated Ticket Count = count(tickets where related_ids.length == 0).
- Isolation Rate = isolated_ticket_count / total_ticket_count.
- Escalation Rate = problem_ticket_count / incident_ticket_count.
- Avg Incidents per Problem = avg(affected_ticket_ids.length).
- MTTR = avg(resolution_time_hours).
- MTBF = avg(time_between_incidents_hours by system).
- High-Confidence Matches = count(similarity_score >= 0.80) / count(similarity_score not null).
- False Positive Rate = incorrect_graph_edges / total_graph_edges_flagged.

---

## 12. API Response Schemas (Draft)

```ts
export interface AnalyticsDuplicates {
  period: string;
  cluster_count: number;
  duplicate_rate: number;
  avg_cluster_size: number;
  trend: Array<{ date: string; duplicate_rate: number }>;
  top_themes: Array<{ theme: string; category: string; count: number }>;
}

export interface AnalyticsIsolation {
  period: string;
  isolated_count: number;
  isolation_rate: number;
  by_priority: Array<{ priority: string; count: number }>;
  by_category: Array<{ category: string; count: number }>;
  trend: Array<{ date: string; isolation_rate: number }>;
}

export interface AnalyticsModelAccuracy {
  period: string;
  similarity_histogram: Array<{ bucket: string; count: number }>;
  high_confidence_rate: number;
  query_expansion_hit_rate: { with_expansion: number; without_expansion: number };
  graph_feedback: Array<{ date: string; positive: number; negative: number }>;
  false_positive_rate: number;
}

export interface AnalyticsSystems {
  period: string;
  systems: Array<{
    system: string;
    ticket_count: number;
    critical_pct: number;
    avg_resolution_hours: number;
    sla_compliance_pct: number;
    problem_ticket_count: number;
  }>;
}

export interface AnalyticsProblemTickets {
  period: string;
  problem_count: number;
  escalation_rate: number;
  avg_incidents_per_problem: number;
  by_category: Array<{ category: string; count: number }>;
  lifecycle_trend: Array<{ date: string; open: number; resolved: number }>;
  time_to_creation_hours: number;
}

export interface AnalyticsTeamWorkflow {
  period: string;
  team_load: Array<{ team: string; new: number; in_progress: number; backlog: number }>;
  first_touch_rate: number;
  escalation_paths: Array<{ from: string; to: string; count: number }>;
  response_time_histogram: Array<{ bucket: string; count: number }>;
}

export interface AnalyticsPredictions {
  period: string;
  forecast: Array<{ date: string; predicted: number; actual?: number }>;
  emerging_clusters: Array<{ theme: string; count: number; system?: string }>;
  seasonal_patterns: Array<{ day: string; hour: number; count: number }>;
}

export interface AnalyticsRootCauses {
  period: string;
  coverage_pct: number;
  top_root_causes: Array<{ cause: string; count: number }>;
  graph_depth_histogram: Array<{ depth: number; count: number }>;
  change_related_pct: number;
}
```

---

## 13. UX Notes

- Tabs persist selection in URL query params (e.g., `?tab=ai-performance`).
- Each tab uses a 2-column grid; KPI row at top, charts below.
- If a chart has <= 5 items, show labels directly; otherwise use tooltips.
- Long system names wrap in tables; provide search/filter for long lists.
- Provide "View tickets" action on all KPI cards where a ticket list is meaningful.

---

## 14. Edge Cases & Empty States

- No tickets in period: show zero-state with guidance to expand date range.
- Missing `similarity_score`: exclude from histogram and show count excluded.
- No problem tickets: show "No problems created in period" and hide trend line.
- Partial API failures: show module-level error, keep other modules visible.

---

## 15. Risks & Dependencies

- Data quality: incorrect categorization or missing links can skew metrics.
- Model drift: high-confidence rate may change after model updates.
- Performance: large datasets may require server-side aggregation.
- Dependency on graph feedback endpoints for accuracy metrics.

---

## 16. Rollout & Instrumentation

- Feature flag for new tabs, enable per tenant.
- Track module views, filter usage, and drilldown clicks.
- Log API response time and error rate per endpoint.

---

## 17. Open Questions

- What is the default period on first load (30d vs 90d)?
- Do we need tenant-specific baselines for duplicate/isolation rates?
- Should forecasts be simple (trend) or seasonal (day/hour)?
- Are "systems" based on category, CI, or assignment group?
