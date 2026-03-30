# ITSM Nexus Frontend

AI-powered IT Service Management dashboard with semantic search, root cause analysis via causal graph visualization, and analytics for IT support operations.

## Tech Stack

- **Next.js 16** (App Router with React Server Components)
- **React 19** with experimental React Compiler
- **TypeScript** (strict mode)
- **Tailwind CSS v4** with shadcn/ui components
- **React Query** (TanStack Query v5) for server state
- **Zustand** for auth state
- **Cytoscape.js** for graph visualizations
- **Recharts** for analytics charts
- **Supabase JS** client for database access

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
npm install
```

Create `.env.local` from the example:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

### Demo Showcase Mode

To lock the frontend to the demo dataset for a UI showcase build:

```env
NEXT_PUBLIC_FORCE_DATASET_MODE=demo
NEXT_PUBLIC_DEMO_EMAIL=demo@nexus.com
```

With `NEXT_PUBLIC_FORCE_DATASET_MODE=demo`, the app stays on the isolated demo dataset even if auth metadata is missing or inconsistent. Production-only controls such as ServiceNow sync and problem ticket creation are disabled in this mode.

### Development

```bash
npm run dev        # Start dev server on http://localhost:3000
```

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start development server |
| `npm run build` | Production build with TypeScript validation |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `ANALYZE=true npm run build` | Bundle analysis |

## Project Structure

```text
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main application entry
│   └── globals.css              # Global Tailwind styles
├── src/
│   ├── types/                   # TypeScript type definitions
│   ├── config/                  # Branding & feature flags
│   ├── data/                    # Static helpers (no mock data)
│   ├── utils/                   # Helper functions
│   ├── services/                # React Query hooks & API client
│   ├── stores/                  # Zustand stores (auth only)
│   ├── components/
│   │   ├── layout/              # Sidebar
│   │   └── charts/              # Recharts wrappers
│   └── features/
│       ├── auth/                # Login page
│       ├── search/              # Semantic search
│       ├── tickets/             # Ticket detail view
│       ├── root-cause/          # Causal graph visualization
│       ├── analytics/           # Analytics dashboard
│       └── settings/            # User preferences
└── components/ui/               # shadcn/ui components
```

## Features

- **Semantic Search** -- Hybrid vector + full-text search with metadata filtering
- **Root Cause Analysis** -- Interactive force-directed causal graph powered by Cytoscape.js
- **Analytics Dashboard** -- Ticket trends, resolution metrics, and category breakdowns
- **Settings** -- Theme toggle, user preferences, export options

## State Management

React Query handles all server state (tickets, search results, analytics). Zustand is used only for authentication state. Do not use Zustand for data caching.

```typescript
// Server state
const { data, isLoading } = useTickets();

// Auth state only
const { user, login, logout } = useAuthStore();
```

## Styling

- Tailwind v4 with CSS variables for theming
- Dark mode via `dark:` class prefix
- shadcn/ui "new-york" style with neutral base color
- Mobile-first responsive design (`md:` breakpoint at 768px)

## Adding a New Page

1. Create component in `src/features/{name}/{Name}Page.tsx`
2. Export from `src/features/{name}/index.ts`
3. Import in `app/page.tsx`
4. Add navigation item to `Sidebar` navItems array
5. Add conditional render based on `activePage` state

## Adding shadcn/ui Components

```bash
npx shadcn@latest add {component-name}
```

## Path Aliases

```text
@/* -> ./*   (project root)
```

Example: `import type { Ticket } from '@/src/types'`
