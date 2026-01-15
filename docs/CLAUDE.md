# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ITSM Nexus** is an AI-powered ticket management admin dashboard for IT Service Management. It provides semantic similarity search, root cause analysis via causal graph visualization, and analytics dashboards for IT support operations.

The application is built with:
- **Next.js 16.1** (App Router with React Server Components)
- **React 19.2** with experimental React Compiler enabled
- **TypeScript** (strict mode)
- **Tailwind CSS v4** with shadcn/ui components
- **Cytoscape.js** for advanced graph visualizations
- **Recharts** for analytics charts

This is a frontend-only implementation currently using mock data. The backend API integration is planned for future implementation.

## Commands

### Development
```bash
npm run dev        # Start dev server on http://localhost:3000
```

### Production
```bash
npm run build      # Build for production
npm start          # Start production server
```

### Linting
```bash
npm run lint       # Run ESLint (currently minimal configuration)
```

## Architecture

### Directory Structure

```
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main application entry (monolithic component)
│   └── globals.css              # Global Tailwind styles
├── src/                          # Application source (modular structure)
│   ├── types/                   # TypeScript type definitions
│   ├── config/                  # Configuration (branding, feature flags)
│   ├── data/                    # Mock data (tickets, graph nodes/edges)
│   ├── utils/                   # Helper functions
│   ├── components/
│   │   ├── layout/              # Sidebar component
│   │   └── charts/              # Recharts wrapper components
│   └── features/                # Feature-based modules
│       ├── auth/                # Login page
│       ├── search/              # Search page
│       ├── analytics/           # Analytics dashboard
│       └── settings/            # Settings page
└── components/ui/               # shadcn/ui components
```

### Key Architectural Patterns

**Client-Side State Management**: The app uses React's built-in state management (`useState`, `useEffect`) without external state management libraries. All state is managed in `app/page.tsx` which acts as the root orchestrator.

**Feature Isolation**: While `app/page.tsx` is monolithic and contains the `AnalyzePage` and `IncidentDetailPanel` components, most features are extracted into `src/features/` for modularity:
- `SearchPage`: Ticket search with filtering and pagination
- `AnalyticsPage`: Dashboard with metrics and charts
- `SettingsPage`: User preferences and theme toggle
- `LoginPage`: Authentication UI (mock implementation)

**Generic Naming Convention**: The codebase uses generic "Ticket" terminology (defined in `src/types/index.ts`) instead of ServiceNow-specific "Incident" naming to support future ticket system implementations. Legacy "Incident" references remain in `app/page.tsx` for backwards compatibility.

**Component Library Strategy**: The app uses shadcn/ui components from `components/ui/` but wraps them with custom abstractions in `app/page.tsx` (e.g., `Badge`, `Button`, `Progress`) to provide app-specific defaults and variant mappings.

**Mock Data Architecture**: All data comes from `src/data/mockTickets.ts` which exports:
- `MOCK_TICKETS`: Array of ticket objects with similarity scores
- `GRAPH_NODES`: Nodes for causal analysis visualization
- `GRAPH_EDGES`: Edges with confidence scores
- `GRAPH_CLUSTERS`: Visual groupings for graph layout

### Two-Stage ML Pipeline (Planned Backend)

The UI is designed around a two-stage ML architecture described in `prd.txt`:

1. **Stage 1 - Similarity Search**: Fast semantic search using MPNet embeddings (768-dimensional vectors) to find top 10-50 similar tickets from a corpus of 10,633+ historical tickets
2. **Stage 2 - Causal Classification**: Cross-encoder model analyzes similarity candidates to determine causality relationships with confidence scores (0-100%)

The frontend simulates this with pre-computed similarity scores in mock data.

### Graph Visualization Physics Engine

The `AnalyzePage` component implements a custom force-directed graph layout in `app/page.tsx` using:
- **Cluster Gravity**: Pulls nodes toward their assigned cluster centers
- **Node Repulsion**: Pushes nodes apart to prevent overlap (10000/distance² force)
- **Link Attraction**: Pulls connected nodes together based on edge confidence
- **Friction/Damping**: 0.5 velocity damping for quick settling
- **Drag Interaction**: Nodes can be manually dragged; physics pauses after 3s

The simulation runs via `requestAnimationFrame` and uses refs (`nodesRef`, `animationRef`) to avoid unnecessary re-renders during physics calculations.

## Path Aliases

TypeScript paths are configured in `tsconfig.json`:
```typescript
"@/*": ["./*"]  // Maps @/ to project root
```

Usage examples:
- `@/src/types` → Core type definitions
- `@/components/ui/button` → shadcn/ui components
- `@/src/config/branding` → App configuration

## Styling Conventions

- **Tailwind v4** with CSS variables for theming
- **Dark mode**: Implemented via a `theme` state variable ('light' | 'dark') applied as a className to root div
- **Color palette**: Slate for neutrals, Blue for primary actions
- **Responsive design**: Mobile-first with `md:` breakpoint at 768px
- **shadcn/ui theme**: "new-york" style with neutral base color

## Important Implementation Details

### React Compiler
The project has `reactCompiler: true` enabled in `next.config.ts`. This experimental feature auto-optimizes components for performance. Be cautious when adding complex memo patterns as the compiler handles most optimizations.

### Page Navigation
Navigation is client-side via `activePage` state in `app/page.tsx`. Pages include:
- `search`: Ticket search interface
- `analyze`: Root cause analysis with interactive graph
- `dashboard`: Analytics and metrics
- `settings`: User preferences

The `Sidebar` component manages navigation state and includes mobile hamburger menu support.

### Theme Toggle
Theme switching is implemented in `SettingsPage`. The theme state lives in the root `App` component and is applied as a className wrapper. All Tailwind dark mode styles use the `dark:` prefix.

### Toast Notifications
Custom toast system in `app/page.tsx`:
- Toasts auto-dismiss after 3 seconds
- Types: 'success', 'info', 'error'
- Managed via `addToast(msg, type)` function passed down through props

### Feature Flags
Branding configuration in `src/config/branding.ts` includes feature flags:
```typescript
features: {
  enableRealtime: false,
  enableOAuth: false,
  enableExport: true,
  enableFeedback: true,
  enableAnalytics: true
}
```

These flags are available for future feature gating but not currently enforced in the UI.

## Common Development Tasks

### Adding a New Page
1. Create component in `src/features/{feature-name}/{FeatureName}Page.tsx`
2. Export from `src/features/{feature-name}/index.ts`
3. Import in `app/page.tsx`
4. Add navigation item to `Sidebar` navItems array
5. Add conditional render in root `App` component based on `activePage` state

### Adding shadcn/ui Components
```bash
npx shadcn@latest add {component-name}
```
Components are added to `components/ui/` and configured via `components.json`.

### Working with Types
Central type definitions live in `src/types/index.ts`. When adding new types:
- Use generic naming (e.g., `Ticket` not `Incident`)
- Export from the index file
- Import as `import type { Ticket } from '@/src/types'`

### Integrating Real API
When replacing mock data:
1. Replace imports of `MOCK_TICKETS` from `src/data/mockTickets.ts`
2. Add API client functions in a new `src/services/` directory
3. Update state initialization to fetch from API
4. Consider adding loading states and error boundaries
5. The backend is expected to run on port 8001 (per PRD)

## Product Context

This dashboard is designed as an **admin interface** for IT support engineers to:
- Search historical tickets using AI similarity matching
- Identify root causes through causal relationship graphs
- Monitor ticket trends and resolution metrics
- Provide feedback for ML model improvement

Target users include L1/L2 Support Engineers, L3 Technical Analysts, IT Service Managers, and ML Engineers maintaining the similarity models.

For detailed product requirements, see `prd.txt` which outlines the full two-stage ML pipeline, authentication model, feedback mechanisms, and phased delivery roadmap.
