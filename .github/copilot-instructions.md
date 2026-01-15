# AI Agent Instructions for ITSM Nexus Frontend

## Project Context
**ITSM Nexus** is an AI-powered IT Service Management dashboard with semantic ticket search, root cause analysis via causal graphs, and analytics. Frontend-only (mock data). Single-page app using React 19 + Next.js 16 with Tailwind CSS.

## Architecture Overview

### Folder Structure
```
src/
  app/              # Next.js App Router - Main page.tsx orchestrates all state
  components/
    ui/             # shadcn/ui components (Button, Card, Badge, etc.)
    layout/         # Sidebar, navigation wrappers
    charts/         # Recharts wrapper components
  features/         # Feature modules (auth, search, analytics, settings, tickets, root-cause)
  types/           # Central TypeScript definitions (Ticket, User, GraphNode, etc.)
  data/            # Mock data: MOCK_TICKETS, GRAPH_NODES, GRAPH_EDGES, GRAPH_CLUSTERS
  config/          # Branding, feature flags
  utils/           # Helpers (exportToCSV, formatDate, etc.)
  lib/             # Utilities (cn() from class-variance-authority)
```

### Critical Design Pattern: Root State Management
**All state lives in `src/app/page.tsx`** (`App` component). This single component manages:
- `activePage` - Navigation state ('search'|'analyze'|'dashboard'|'settings')
- `user` - Login state + authentication gating
- `isMobileOpen` - Mobile sidebar toggle
- `selectedIncident` - Detail panel state
- `theme` - Dark/light mode
- `toasts` - Notification queue

**Why**: Simplifies prop drilling for cross-feature state like theme, user, and toast notifications. Extracted features (SearchPage, AnalyticsPage, etc.) are presentational and receive props/callbacks.

### Data Flow
1. **Mock Data Source**: `src/data/mockTickets.ts` exports `MOCK_TICKETS`, `GRAPH_NODES`, `GRAPH_EDGES`, `GRAPH_CLUSTERS`
2. **Search Flow**: SearchPage filters MOCK_TICKETS → renders results → clicks trigger `onSelectIncident` callback → detail panel updates in root state
3. **Analytics**: AnalyticsPage reads mock metrics, renders Recharts components
4. **Graph Simulation**: AnalyzePage in page.tsx runs custom force-directed layout on requestAnimationFrame (cluster gravity, node repulsion, link forces)

### Extracted Features vs. Monolithic Page
- **Extracted** (in `src/features/`): SearchPage, AnalyticsPage, SettingsPage, LoginPage, auth wrappers
- **Monolithic** (in `src/app/page.tsx`): AnalyzePage (graph), IncidentDetailPanel (detail tabs), root state, navigation logic
- **Future**: Extract AnalyzePage and IncidentDetailPanel when component complexity warrants it

## Build & Development Workflow

### Commands
```bash
npm run dev      # Start Turbopack dev server (watches src/)
npm run build    # Next.js production build (validates TypeScript)
npm run lint     # ESLint (minimal config currently)
npm start        # Start production server
```

### Path Resolution
`tsconfig.json` defines: `"@/*": ["./src/*"]`
- `@/types` → `src/types`
- `@/components/ui/button` → `src/components/ui/button`
- `@/features/search` → `src/features/search`

### Import Statement Template
```typescript
import { SearchPage } from '@/features/search';
import { Button } from '@/components/ui/button';
import type { Ticket } from '@/types';
import { MOCK_TICKETS } from '@/data/mockTickets';
```

## Styling & Component Library

### Tailwind CSS v4 + shadcn/ui
- **Dark mode**: Applied via className on root `<div>` (`className={theme}` where theme = 'light'|'dark')
- **Color scheme**: Slate neutrals, Blue primary, with Tailwind dark: prefix for dark mode
- **Responsive**: Mobile-first; md: breakpoint at 768px
- **shadcn/ui location**: `src/components/ui/` (installed via `npx shadcn@latest add {component}`)

### Button Component Pattern
shadcn Button doesn't support `icon` prop. Render icons as children:
```typescript
// ✅ Correct
<Button variant="outline" size="sm" onClick={handleClick}>
  <ChevronLeft className="w-4 h-4 mr-2" />
  Previous
</Button>

// ❌ Wrong
<Button icon={ChevronLeft} onClick={handleClick}>Previous</Button>
```

Available Button variants: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'

## Feature-Specific Patterns

### Search Feature (src/features/search/SearchPage.tsx)
- **Typeahead**: Array of hardcoded suggestions (VPN, Printer, Outlook, etc.); filtered on substring match
- **Categories**: Hardcoded array; toggle with `selectedCategories` state
- **Pagination**: 5 items/page; currentPage and itemsPerPage state
- **Filters**: Date range, ticket state, assignment group (no actual filtering logic, UI only)
- **Props**: `onSelectIncident`, `setIsMobileOpen`, `addToast`

### Analytics Feature (src/features/analytics/AnalyticsPage.tsx)
- **Metrics Cards**: Hardcoded KPI data (1,284 tickets, 2.5h resolution time, 84% adoption)
- **Charts**: Uses custom Recharts wrappers (SimpleLineChart, DonutChart, AreaChart) from `src/components/charts/`
- **Export**: `exportToCSV()` helper; currently logs success toast
- **Props**: `addToast`

### Graph Visualization (src/app/page.tsx - AnalyzePage)
- **Physics Simulation**: Custom force-directed layout (NOT Cytoscape)
  - Cluster gravity: Pulls nodes toward cluster centers
  - Node repulsion: `10000 / distance^2` force
  - Link attraction: Based on edge confidence
  - Damping: 0.5 velocity damping for settling
  - Simulation pauses after 3 seconds of inactivity
- **Refs for Performance**: `nodesRef`, `animationRef` to avoid re-renders during physics
- **Data Structure**: GRAPH_NODES has x, y, vx, vy (velocity) for physics state

### Settings Feature (src/features/settings/SettingsPage.tsx)
- **Theme Toggle**: Updates `theme` state in root App component
- **Logout**: Calls `onLogout` callback which sets user to null
- **Props**: `theme`, `setTheme`, `onLogout`

## Important Implementation Details

### React Compiler
`reactCompiler: true` in `next.config.ts` auto-optimizes components. Avoid manual memo() patterns; compiler handles it.

### Dark Mode Implementation
```typescript
<div className={theme}>  {/* theme = 'light' or 'dark' */}
  <div className="bg-white dark:bg-slate-900">Content</div>
</div>
```

### Toast System
```typescript
const addToast = (msg: string, type: 'success' | 'info' | 'error') => {
  const id = Date.now();
  setToasts(prev => [...prev, { id, msg, type }]);
  setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 3000);
};
```

### Type Naming Convention
Use generic "Ticket" (not ServiceNow "Incident") for future ticket system portability. See `src/types/index.ts` for all type definitions.

## Adding Features

### Add a New Page
1. Create `src/features/{feature}/FeaturePage.tsx`
2. Export from `src/features/{feature}/index.ts`
3. Import in `src/app/page.tsx`
4. Add to Sidebar navItems array
5. Add conditional render in root App: `{activePage === 'feature' && <FeaturePage {...props} />}`

### Add a shadcn Component
```bash
cd src/components/ui
npx shadcn@latest add {component}
```

### Integrate Real API
1. Create `src/services/api.ts` with fetch functions
2. Replace `MOCK_TICKETS` imports with API calls
3. Add loading/error states
4. Backend expected on port 8001 (per PRD)

## Critical Files to Know
- `src/app/page.tsx` - Root orchestrator; all state, AnalyzePage, IncidentDetailPanel
- `src/data/mockTickets.ts` - All mock data (MOCK_TICKETS, GRAPH_*, clusters)
- `src/types/index.ts` - Type definitions (Ticket, User, GraphNode, etc.)
- `src/config/branding.ts` - Feature flags, branding constants
- `src/components/layout/Sidebar.tsx` - Navigation sidebar with mobile support
- `prd.txt` - Product requirements (two-stage ML pipeline, target users, roadmap)

## Validation Checklist
Before submitting code:
- [ ] `npm run build` passes (no TypeScript errors)
- [ ] All `@/` imports resolve correctly (check tsconfig paths)
- [ ] Button components render icons as children, not via `icon` prop
- [ ] Dark mode styles use `dark:` prefix
- [ ] Features use generic "Ticket" naming
- [ ] Props passed to extracted features match their interfaces
