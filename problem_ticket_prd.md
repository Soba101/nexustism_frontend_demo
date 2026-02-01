# PRD: Create Problem Ticket Feature

## Overview

Enable users to create **Problem Tickets** (PRB records) from the SearchPage's Problem Candidates sidebar. A problem ticket groups related incident tickets into a formal investigation, links them bidirectionally, and visualizes the relationships in the causal graph.

**User Flow:** Problem Candidates sidebar auto-detects ticket clusters → User clicks "Create Problem" on a cluster → Modal opens with those tickets already pre-selected → User fills problem details → Problem ticket created and linked → Navigate to RCA graph.

---

## Problem Statement

The SearchPage already detects clusters of 2+ similar tickets and displays them in the **Problem Candidates** sidebar panel (`SearchPage.tsx` lines 212-283). Each candidate contains a pre-computed `tickets: Ticket[]` array grouped by either `related_ids` overlap or normalized summary text similarity.

However, users cannot act on these candidates — clicking one just opens the first ticket's detail panel. There is no way to promote a detected cluster into a formal Problem record that groups these incidents for coordinated investigation.

---

## Goals

1. Allow users to create Problem Tickets from detected candidate clusters
2. Bidirectionally link problem tickets to their affected incident tickets
3. Visualize problem-incident relationships in the causal graph
4. Distinguish problem tickets visually throughout the UI (search, detail panel, dashboard)

## Non-Goals

- Problem lifecycle workflow (investigation → root cause found → resolved)
- Known Error Database integration
- Auto-linking of new incidents to existing problems
- Problem ticket templates
- Backend API implementation (mock data only for demo)

---

## Existing Architecture Context

### Current Data Model

```typescript
interface Ticket {
  id: string;
  number: string;               // TKT001052 format
  short_description: string;
  description: string;
  category: string;
  priority: TicketPriority;     // Critical | High | Medium | Low
  state: TicketState;           // New | In Progress | Resolved | Closed
  opened_at: string;
  resolved_at?: string;
  assigned_group: string;
  similarity_score: number;     // 0-100
  related_ids: string[];        // Bidirectional ticket links
}

interface GraphNode {
  id: string;
  label: string;
  type: 'root' | 'cause' | 'change' | 'related' | 'problem';
  details: string;
}

interface GraphEdge {
  source: string;
  target: string;
  confidence: number;           // 0-1
  label: string;
}
```

### Existing Problem Candidates Detection (SearchPage lines 212-283)

The SearchPage already computes `problemCandidates` via `useMemo`. Each candidate is a **pre-computed cluster** with its tickets already identified:

```typescript
// Candidate shape (already exists in SearchPage)
Array<{
  count: number;           // Number of tickets in cluster
  summary: string;         // Representative description
  tickets: Ticket[];       // THE ACTUAL TICKET OBJECTS — already grouped
  source: 'related' | 'summary';
}>
```

**Detection strategies:**

- **Strategy 1 — Related IDs**: Takes a ticket + all tickets in its `related_ids` → groups them (e.g., TKT001052 has `related_ids: ['3', '4']` → cluster of 3 tickets)
- **Strategy 2 — Summary Similarity**: Normalizes `short_description` text and groups by `category + normalized_summary`

Returns top 5 candidates sorted by count. **The tickets are already selected by the algorithm** — the "Create Problem" flow should pass `candidate.tickets` directly as pre-selected tickets, not require the user to manually pick them.

Currently, clicking a candidate just calls `onSelectIncident(candidate.tickets[0])` (opens first ticket's detail panel). The `candidate.tickets` array is available but unused for problem creation.

### Existing Graph Visualization

The `'problem'` node type already exists in `GraphNode.type` and is rendered in `GraphCanvas.tsx` with:

- Red background (`#ef4444`)
- AlertTriangle icon
- 24px radius

Mock data includes `PRB000120` as an existing problem node connected via "Escalated To" edges.

### Available UI Components

- `Dialog` (shadcn/ui Radix-based) + `Modal` wrapper
- `Button`, `Badge`, `Card`, `Input`, `Select`, `Checkbox`, `Tabs`, `Table`

---

## Data Model Changes

### Extended Ticket Interface

Add optional fields to `src/types/index.ts` (backward compatible):

```typescript
export type TicketType = 'incident' | 'problem';

export type ProblemCategory =
  | 'Configuration'
  | 'Capacity'
  | 'Change Management'
  | 'Known Error'
  | 'Third Party'
  | 'Unknown';

export interface Ticket {
  // ... all existing fields unchanged ...

  // New optional fields for problem tickets
  ticket_type?: TicketType;             // Defaults to 'incident' if undefined
  problem_category?: ProblemCategory;   // Root cause classification
  affected_ticket_ids?: string[];       // Linked incident IDs (problem tickets only)
  root_cause_summary?: string;          // Brief root cause description
}
```

### New Form Type

```typescript
export interface CreateProblemTicketForm {
  short_description: string;
  description: string;
  problem_category: ProblemCategory;
  priority: TicketPriority;
  assigned_group: string;
  affected_ticket_ids: string[];
  root_cause_summary: string;
}
```

### Problem Ticket Number Format

Problem tickets use `PRB` prefix: `PRB000001`, `PRB000002`, etc.

---

## New Mock API Hooks

### `useCreateProblemTicket()`

Mutation that:

1. Generates next PRB number
2. Creates ticket with `ticket_type: 'problem'` and `affected_ticket_ids`
3. Updates each affected incident's `related_ids` to include the new problem ticket ID
4. Invalidates `['tickets']` and `['causal-graph']` query caches

### `useAffectedTickets(problemId: string)`

Query that returns all incident tickets linked to a problem ticket via `affected_ticket_ids`.

### Updated `useCausalGraph(ticketId)`

When the target ticket is a problem ticket:

- Create a `'problem'` node at center
- Create `'root'`-type nodes for each affected incident
- Create edges from each incident to the problem node with label "Escalated To"

---

## UI Components

### CreateProblemTicketDialog

**Location:** `src/features/problems/CreateProblemTicketDialog.tsx`

**Props:**

```typescript
interface CreateProblemTicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedTickets: Ticket[];
  onSuccess: (problemTicket: Ticket) => void;
  addToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}
```

**Two-step modal form:**

The dialog receives `preselectedTickets` directly from the Problem Candidate's `candidate.tickets` array. These tickets are **already grouped by the detection algorithm** — the user is not picking tickets from scratch.

#### Step 1: Confirm Tickets & Fill Details

- **Pre-selected tickets panel** (read-only list, all checked by default) showing ticket number, priority badge, short description
- User can uncheck tickets to exclude them (min 2 must remain)
- Ticket count: "3 of 3 included"
- **Problem details form** below the ticket list:
  - Short Description (pre-filled from `candidate.summary`)
  - Description (textarea)
  - Problem Category (dropdown)
  - Priority (auto-suggested from highest priority in cluster)
  - Assigned Group (pre-filled from most common `assigned_group` in cluster)
  - Root Cause Summary (optional textarea)

```
┌──────────────────────────────────────────────────┐
│  Create Problem Ticket                       [X] │
├──────────────────────────────────────────────────┤
│  Step 1 of 2 — Tickets & Details                 │
│  ● ○                                             │
│                                                  │
│  Affected Tickets (from candidate cluster)       │
│  ☑ TKT001052  High   VPN connection failing...   │
│  ☑ TKT000985  Med    Singapore VPN Gateway...    │
│  ☑ TKT000821  High   Unable to connect to VPN   │
│  3 of 3 included                                 │
│  ─────────────────────────────────────────────── │
│  Short Description                               │
│  ┌────────────────────────────────────────┐      │
│  │ VPN connection failing for remote u... │ ←prefill│
│  └────────────────────────────────────────┘      │
│                                                  │
│  Description                                     │
│  ┌────────────────────────────────────────┐      │
│  │                                        │      │
│  └────────────────────────────────────────┘      │
│                                                  │
│  Category            Priority                    │
│  [Unknown ▼]         [High ▼] ← auto from cluster│
│                                                  │
│  Assigned Group                                  │
│  ┌────────────────────────────────────────┐      │
│  │ Network Operations              │ ←prefill│
│  └────────────────────────────────────────┘      │
│                                                  │
│  Root Cause Summary (optional)                   │
│  ┌────────────────────────────────────────┐      │
│  │                                        │      │
│  └────────────────────────────────────────┘      │
│                                                  │
│                          [Cancel]  [Next →]      │
└──────────────────────────────────────────────────┘
```

**Pre-fill logic:**

- `short_description` ← `candidate.summary`
- `priority` ← highest priority found in `candidate.tickets`
- `assigned_group` ← most common `assigned_group` in `candidate.tickets`

#### Step 2: Review & Confirm

- Summary card: PRB number preview, description, category, priority
- Linked tickets list with count
- "Create & Analyze" button → creates ticket + navigates to RCA page
- "Create" button → creates ticket, stays on search page

```
┌──────────────────────────────────────────────────┐
│  Create Problem Ticket                       [X] │
├──────────────────────────────────────────────────┤
│  Step 2 of 2 — Review & Confirm                 │
│  ○ ●                                             │
│                                                  │
│  ┌────────────────────────────────────────┐      │
│  │ PRB000125           High  Third Party  │      │
│  │                                        │      │
│  │ Recurring VPN connectivity issues      │      │
│  │ in Singapore office                    │      │
│  │                                        │      │
│  │ Linked Incidents: 3                    │      │
│  │  • TKT001052 — VPN connection fail    │      │
│  │  • TKT000985 — Singapore VPN Gate     │      │
│  │  • TKT000821 — Unable to connect      │      │
│  └────────────────────────────────────────┘      │
│                                                  │
│         [← Back]  [Create]  [Create & Analyze]   │
└──────────────────────────────────────────────────┘
```

### AffectedIncidentsTab

**Location:** `src/features/tickets/components/AffectedIncidentsTab.tsx`

New tab in TicketDetailPanel for problem tickets. Shows linked incidents using `useAffectedTickets(problemId)` with same UI pattern as `RelatedTicketsTab`.

### Problem Badge in Ticket Renders

Anywhere a ticket is displayed (search results, dashboard, detail panel), show a purple "PROBLEM" badge when `ticket.ticket_type === 'problem'`.

---

## Integration Points

### SearchPage (`src/features/search/SearchPage.tsx`)

1. Add state: `createProblemDialogOpen: boolean`, `selectedCandidateTickets: Ticket[]`
2. Add "Create Problem" button to each candidate card in Problem Candidates panel (lines 556-581)
3. Button click → set `selectedCandidateTickets` from candidate, open dialog
4. Dialog `onSuccess` → toast + optionally navigate to RCA page
5. New prop: `onNavigateToRCA: (ticket: Ticket) => void`

### Root Page (`src/app/page.tsx`)

Pass `onNavigateToRCA` callback to SearchPage:

```typescript
const handleNavigateToRCA = (ticket: Ticket) => {
  setSelectedTicketForAnalysis(ticket);
  setActivePage('analyze');
};
```

### TicketDetailPanel (`src/features/tickets/TicketDetailPanel.tsx`)

- Purple "PROBLEM" badge in header when `ticket.ticket_type === 'problem'`
- Show `problem_category` and `root_cause_summary` in Overview tab
- Add "Affected Incidents" tab (only visible for problem tickets)

### RootCauseAnalysisPage (`src/features/root-cause/RootCauseAnalysisPage.tsx`)

- When `targetTicket?.ticket_type === 'problem'`, show investigation header
- Graph already supports `'problem'` node type visually

---

## Mock Data Additions

### Example Problem Ticket (`src/data/mockTickets.ts`)

```typescript
{
  id: '26',
  number: 'PRB000120',
  short_description: 'Recurring VPN connectivity issues in Singapore office',
  description: 'Multiple incidents over past 3 weeks...',
  category: 'Problem Investigation',
  priority: 'High',
  state: 'In Progress',
  opened_at: '2026-01-08T10:00:00Z',
  assigned_group: 'Network Engineering',
  similarity_score: 100,
  related_ids: ['1', '3', '4'],
  ticket_type: 'problem',
  problem_category: 'Third Party',
  affected_ticket_ids: ['1', '3', '4'],
  root_cause_summary: 'ISP peering instability causing intermittent packet loss',
}
```

Update affected tickets (`id: '1', '3', '4'`) to include `'26'` in their `related_ids`.

---

## File Inventory

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/types/index.ts` | Add TicketType, ProblemCategory, extend Ticket, add CreateProblemTicketForm |
| Modify | `src/data/mockTickets.ts` | Add example problem ticket, update related_ids on linked incidents |
| Modify | `src/services/mockApi.ts` | Add useCreateProblemTicket, useAffectedTickets, update useCausalGraph |
| Modify | `src/services/index.ts` | Re-export new hooks |
| Create | `src/features/problems/CreateProblemTicketDialog.tsx` | 3-step modal form |
| Create | `src/features/problems/index.ts` | Barrel export |
| Modify | `src/features/search/SearchPage.tsx` | Add dialog integration + "Create Problem" buttons on candidates |
| Modify | `src/app/page.tsx` | Add onNavigateToRCA prop to SearchPage |
| Modify | `src/features/tickets/TicketDetailPanel.tsx` | Problem badge + problem fields in Overview + Affected tab |
| Create | `src/features/tickets/components/AffectedIncidentsTab.tsx` | List affected incidents for problem tickets |
| Modify | `src/features/root-cause/RootCauseAnalysisPage.tsx` | Problem investigation header |

---

## Validation Rules

- Minimum 2 affected tickets required
- Short description: required, min 10 characters
- Description: required, min 20 characters
- Problem category: required
- Priority: required
- Assigned group: required

---

## Acceptance Criteria

1. Problem Candidates panel shows "Create Problem" button on each candidate with 2+ tickets
2. Clicking "Create Problem" opens a 3-step modal pre-populated with the candidate's tickets
3. User can add/remove tickets from the selection (min 2)
4. Form validates required fields before allowing creation
5. On submit, a PRB-prefixed ticket is created and appears in search results
6. Affected incidents' `related_ids` are updated to include the new problem ticket
7. "Create & Analyze" navigates to RCA page with the problem ticket as target
8. RCA graph shows problem node connected to affected incidents
9. Problem tickets display purple "PROBLEM" badge in search results and detail panel
10. Detail panel shows problem-specific fields (category, root cause summary) and Affected Incidents tab
11. `npm run build` passes with no type errors
