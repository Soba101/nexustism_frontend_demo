# Supabase + React Query Setup Guide

## Environment Setup

### 1. Docker Supabase Configuration
```bash
# Install Docker (if not already installed)
# Then create docker-compose.yml in your project root

docker-compose up -d
```

Get your Supabase credentials from Docker and add to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

### 2. Create Supabase Test User

Login to Supabase at `http://localhost:54321` and create a user:
- **Email:** test@example.com
- **Password:** password

### 3. Install Dependencies ✅
Done! Packages installed:
- `@supabase/supabase-js` - Supabase authentication
- `@tanstack/react-query` - Server state management
- `zustand` - Client state management

---

## Architecture Overview

### State Management Strategy

```
┌─────────────────────────────────────────────┐
│           Application State                  │
├─────────────────────────────────────────────┤
│                                              │
│  Client State (Zustand)          Server State (React Query)
│  ├─ Auth (user, token)           ├─ Tickets
│  ├─ UI (theme, sidebar)          ├─ Analytics
│  └─ Session timeout              ├─ Search results
│                                  └─ Causal graphs
│
└─────────────────────────────────────────────┘
```

### File Structure

```
src/
├─ lib/
│  └─ supabase.ts           # Supabase client + auth functions
├─ stores/
│  └─ authStore.ts          # Zustand auth store
├─ providers/
│  └─ QueryProvider.tsx     # React Query provider wrapper
├─ services/
│  └─ api.ts               # API hooks (useTickets, useAnalytics, etc.)
├─ features/
│  └─ auth/
│     └─ LoginPage.tsx     # Updated to use auth store
```

---

## Implementation Checklist

### Phase 1: Authentication ✅
- [x] Supabase client initialized
- [x] Auth store with Zustand created
- [x] Session timeout management (30 minutes)
- [x] Auto-refresh token support
- [x] Error handling with user feedback
- [x] LoginPage updated to use Supabase
- [x] App component uses auth state
- [x] Logout functionality integrated

### Phase 2: React Query Setup ✅
- [x] QueryProvider created and wrapped in layout
- [x] API service layer with typed hooks created
- [x] Error handling middleware
- [x] Loading state management
- [x] Cache invalidation patterns

### Phase 3: API Integration (Next Steps)

**Ready to integrate backend endpoints:**

1. **Search Page** - Replace MOCK_TICKETS with `useTickets()` hook
2. **Analytics Page** - Use `useAnalyticsMetrics()`, `useAnalyticsVolume()`, etc.
3. **RCA Page** - Use `useCausalGraph()` hook
4. **Dashboard Page** - Use metric hooks
5. **Ticket Detail Panel** - Use `useTicket()`, `useTicketTimeline()`, `useTicketAuditLog()`

---

## Code Examples

### Using API Hooks

```tsx
import { useTickets, useAnalyticsMetrics } from '@/services/api';

export function MyComponent() {
  // Fetch tickets with filters
  const { data, isLoading, error } = useTickets({
    category: 'Network',
    priority: 'High',
    limit: 10
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.tickets.map(ticket => (
        <div key={ticket.id}>{ticket.number}</div>
      ))}
    </div>
  );
}
```

### Using Auth Store

```tsx
import { useAuthStore } from '@/stores/authStore';

export function MyComponent() {
  const { user, logout, isLoading } = useAuthStore();

  return (
    <div>
      <h1>Welcome, {user?.email}</h1>
      <button onClick={logout} disabled={isLoading}>
        Logout
      </button>
    </div>
  );
}
```

---

## Backend API Endpoints Required

### Authentication
- `POST /api/auth/login` - Verify credentials (handled by Supabase)
- `POST /api/auth/logout` - Revoke token

### Tickets
- `GET /api/tickets?category=...&priority=...&search=...&page=1&limit=10`
- `GET /api/tickets/{id}`
- `GET /api/tickets/{id}/timeline`
- `GET /api/tickets/{id}/audit`
- `PATCH /api/tickets/{id}` - Update ticket

### Analytics
- `GET /api/analytics/metrics?period=30d`
- `GET /api/analytics/volume?period=30d`
- `GET /api/analytics/team-performance`
- `GET /api/analytics/heatmap?period=30d`
- `GET /api/analytics/priority-breakdown`
- `GET /api/analytics/sla-compliance`

### Search
- `GET /api/search/suggestions?q=...`
- `GET /api/search/semantic?q=...&expand=true&rerank=true`

### Causal Graph
- `GET /api/causal-graph/{ticketId}`
- `POST /api/feedback/graph`
- `POST /api/feedback/graph/flag-incorrect`

### See [backend_requirements.md](../docs/backend_requirements.md) for full specifications

---

## Key Features Implemented

### 1. Auto-Refresh Token
Supabase automatically refreshes tokens before expiration.

### 2. Session Timeout
User is logged out after 30 minutes of inactivity. Update in `authStore.ts`:
```tsx
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
```

### 3. Optimistic Updates
React Query supports optimistic updates:
```tsx
const { mutate } = useUpdateTicket();
mutate({
  ticketId: '123',
  data: { state: 'Resolved' }
});
```

### 4. Cache Invalidation
Automatically invalidates related cache:
```tsx
// When mutation succeeds, invalidates ['tickets'] cache
queryClient.invalidateQueries({ queryKey: ['tickets'] });
```

### 5. Error Boundaries
Wrapped in ErrorBoundary component for graceful failures.

---

## Testing Locally

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Start Docker Supabase
```bash
docker-compose up -d
```

### 3. Test Login
- Navigate to `http://localhost:3000`
- Login with: `test@example.com` / `password`
- Should be redirected to dashboard

### 4. Test Session Timeout
- Login successfully
- Wait 30 minutes or update `SESSION_TIMEOUT_MS` to shorter duration for testing
- Should be logged out and redirected to login page

### 5. Verify API Calls
- Open browser DevTools Network tab
- Look for requests to `http://localhost:8001/api/*`
- Should return data once backend is running

---

## Next Steps

1. **Backend Development**: Set up API endpoints listed above
2. **Page Integration**: Replace MOCK_TICKETS with API hooks one page at a time
3. **Error Handling**: Add error boundaries and user-friendly error messages
4. **Loading States**: Add skeleton loaders for better UX
5. **Real-Time Updates**: Implement WebSocket connections for live updates

---

## Troubleshooting

### "Supabase environment variables missing"
- Check `.env.local` file exists and has correct values
- Restart dev server after adding env variables

### "localhost:54321 not reachable"
- Ensure Docker is running: `docker ps`
- Check Supabase container is running: `docker logs supabase`

### "No token in request"
- User not authenticated
- Check if session exists in localStorage: `localStorage.getItem('sb-auth-token')`

### "Token expired"
- Should auto-refresh in Supabase client
- Check browser console for errors

---

**Setup Date:** January 15, 2026  
**Status:** ✅ Authentication & React Query Ready for Integration
