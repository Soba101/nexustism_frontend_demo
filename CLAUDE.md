# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Turbopack dev server on http://localhost:3000
npm run build            # Production build with TypeScript validation
npm run lint             # ESLint
npm start                # Production server
ANALYZE=true npm run build  # Bundle analysis
```

## Architecture

Next.js 16 App Router with React 19, TypeScript (strict), Tailwind CSS v4, and shadcn/ui.

### State Management

- **React Query** (`src/services/api.ts`): All server state — tickets, search results, analytics, preferences. Never use Zustand for data caching.
- **Zustand** (`src/stores/authStore.ts`): Auth state only — user, session timeout (30 min auto-logout), dataset mode (demo/prod).
- **Local state** in `app/page.tsx`: `activePage`, `selectedTicket`, `theme`, `toasts`, `isMobileOpen`.

### Routing

Client-side only via `activePage` string state in `app/page.tsx`. No file-based routing for features. Pages render conditionally:

```typescript
{activePage === 'search' && <SearchPage {...props} />}
```

### API Integration

`src/services/api.ts` exports 50+ React Query hooks. All go through `fetchAPI<T>()` which:

- Injects Supabase JWT auth token
- Sends `X-Dataset` header (demo/prod mode)
- Auto-signs out on 401
- Backend runs on port 8001

Key hooks: `useTickets`, `useSemanticSearch`, `useCausalSearch`, `useAnalyticsMetrics`, `useCausalGraph`, `useUserPreferences`.

### Feature Modules

Features live in `src/features/{name}/` with a page component and barrel export. Root `app/page.tsx` orchestrates all features and passes props/callbacks down.

## Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

```typescript
import { SearchPage } from '@/features/search';
import { Button } from '@/components/ui/button';
import type { Ticket } from '@/types';
```

## Styling

- Tailwind v4 with CSS variables for theming
- Dark mode via className on root div (`theme` state), use `dark:` prefix
- shadcn/ui "new-york" style, installed to `src/components/ui/`
- Add components: `npx shadcn@latest add {component}`
- Mobile-first responsive (`md:` at 768px)

## Key Files

| File | Role |
| ---- | ---- |
| `app/page.tsx` | Root orchestrator — all navigation state, theme, toasts, detail panel |
| `src/services/api.ts` | React Query hooks and `fetchAPI<T>` wrapper |
| `src/stores/authStore.ts` | Zustand auth store with Supabase integration |
| `src/types/index.ts` | Core type definitions (Ticket, User, GraphNode, etc.) |
| `src/lib/supabase.ts` | Supabase client initialization |
| `src/providers/QueryProvider.tsx` | QueryClient config (5 min staleTime, 10 min gcTime) |
| `src/config/branding.ts` | App name, terminology, feature flags |
| `src/components/layout/Sidebar.tsx` | Navigation sidebar with mobile drawer |

## Gotchas

1. **React Compiler is enabled** (`reactCompiler: true` in `next.config.ts`). Do not use manual `memo()`, `useMemo`, or `useCallback` for optimization — the compiler handles it.
2. **Button icons**: shadcn Button has no `icon` prop. Render icons as children: `<Button><Icon className="w-4 h-4 mr-2" />Label</Button>`.
3. **Type naming**: Use generic "Ticket" not "Incident" for portability. See `src/types/index.ts`.
4. **Search debounce**: SearchPage uses 300ms debounce on search input before triggering API calls.
5. **Dataset mode**: Auth store holds `datasetMode` ('demo'|'prod') which controls API routing via `X-Dataset` header.
6. **Environment**: `.env.local` must define `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_BASE_URL`. Never committed.

## Adding a New Page

1. Create `src/features/{name}/{Name}Page.tsx`
2. Export from `src/features/{name}/index.ts`
3. Import in `app/page.tsx`
4. Add to Sidebar `navItems` array
5. Add conditional render: `{activePage === 'name' && <NamePage {...props} />}`
