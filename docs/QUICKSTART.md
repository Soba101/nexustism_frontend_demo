# Quick Start Guide - ITSM Nexus Frontend

## 🚀 In 5 Minutes

### 1. Install & Run
```bash
cd "c:\Users\donov\Documents\itsm project\nexustism_frontend_new"
npm install  # Already done
npm run dev  # Start dev server on port 3001
```

### 2. Configure Supabase
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

Get anon key from Docker Supabase dashboard.

### 3. Test Login
- URL: http://localhost:3001
- Email: test@example.com
- Password: password

---

## 📚 Documentation Map

| Document | Purpose | When to Read |
|----------|---------|--------------|
| `IMPLEMENTATION_STATUS.md` | Phase completion overview | Start here |
| `SUPABASE_SETUP.md` | Docker & environment setup | Setting up local environment |
| `IMPLEMENTATION_COMPLETE.md` | Architecture & decisions | Understanding design |
| `MIGRATION_PATTERNS.md` | How to integrate pages | Ready to build features |
| `FILE_STRUCTURE.md` | Project file organization | Need to find code |
| `backend_requirements.md` | API specifications | Building backend |

---

## 🎯 What's Ready Now

✅ **Authentication System**
- Supabase sign in/up
- Session management
- Token auto-refresh
- 30-minute timeout

✅ **State Management**
- Zustand for auth
- React Query for data
- localStorage for preferences

✅ **API Layer**
- 25+ typed hooks
- Error handling
- Cache management

✅ **Developer Experience**
- Full TypeScript
- Hot reload (Turbopack)
- Zero build errors

---

## ⏳ What's Next

### Immediate (This sprint):
1. Start Docker Supabase
2. Create test user
3. Implement `GET /api/tickets` endpoint
4. Migrate SearchPage to use `useTickets()`

### Following week:
1. Implement analytics endpoints
2. Integrate all charts with real data
3. Add loading/error states

### Following 2 weeks:
1. Implement causal graph API
2. Add real-time WebSocket updates
3. Production deployment

---

## 🔍 How to Find Things

### "I need to see the auth code"
→ `src/stores/authStore.ts` (Zustand store logic)
→ `src/lib/supabase.ts` (Supabase client setup)
→ `src/features/auth/LoginPage.tsx` (UI implementation)

### "I need to add a new API hook"
→ Edit `src/services/api.ts`
→ Follow pattern of existing hooks
→ Test with `useQuery()` hook

### "I need to use an API hook in a page"
→ See examples in `MIGRATION_PATTERNS.md`
→ Import hook from `@/services/api`
→ Handle `isLoading` and `error` states

### "I need to understand the architecture"
→ Read `IMPLEMENTATION_COMPLETE.md`
→ View diagrams in State Flow section
→ See dependency graph in `FILE_STRUCTURE.md`

---

## 🧪 Development Workflow

### 1. Make a Change
```bash
# Edit a file in src/
nano src/features/search/SearchPage.tsx
```

### 2. See It Live
Browser auto-reloads with Turbopack (next.js turbo engine)
- No need to restart server
- Errors show in browser console

### 3. Build for Production
```bash
npm run build    # Check for errors
npm start        # Run production build
```

### 4. TypeScript Check
```bash
npx tsc --noEmit    # Check types without compiling
```

---

## 🐛 Troubleshooting

### "Port 3000/3001 already in use"
```bash
# Kill Node process
Get-Process -Name node | Stop-Process -Force

# Or use different port
PORT=3002 npm run dev
```

### "Supabase environment variables missing"
- Create `.env.local` file in project root
- Add three NEXT_PUBLIC_* variables
- Restart dev server: `npm run dev`

### "Can't login"
- Check Supabase is running: `docker ps`
- Verify user exists in Supabase dashboard
- Check `.env.local` has correct URL
- Look at browser console for errors

### "API returns 404"
- Backend server not running (should be on :8001)
- Endpoint not implemented yet
- Check `backend_requirements.md` for spec

### "TypeScript errors after my changes"
```bash
# Rebuild to see all errors
npm run build

# Or check specific file
npx tsc src/features/search/SearchPage.tsx --noEmit
```

---

## 📊 Commands Reference

```bash
npm run dev         # Start dev server (port 3001)
npm run build       # Production build
npm start           # Run production server
npm run lint        # ESLint check
npm run type-check  # TypeScript check

# Database commands (if using Supabase)
docker-compose up -d    # Start local Supabase
docker-compose down     # Stop Supabase
```

---

## 🔗 Key Imports Cheat Sheet

```typescript
// Authentication
import { useAuthStore, useInitializeAuth } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

// Data Fetching
import { useTickets, useAnalyticsMetrics, useTicketTimeline } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';

// UI Components
import { Button, Card, Badge } from '@/components/ui/wrappers';
import { Sidebar, PageWrapper, ToastContainer } from '@/components/layout';

// Types
import type { Ticket, User, GraphNode } from '@/types';
```

---

## 💡 Pro Tips

1. **Use React DevTools**
   - Install React DevTools browser extension
   - Inspect Zustand store: Open DevTools → Components tab
   - Inspect React Query cache: Install TanStack DevTools

2. **Use Network Tab**
   - See API calls: DevTools → Network tab
   - Filter by "Fetch/XHR"
   - Check request headers and response data

3. **Use Console**
   - Log auth state: `useAuthStore.getState()`
   - Log cache: `queryClient.getQueryData(['tickets'])`
   - Test functions: `useTickets.getState()`

4. **Hot Module Reload**
   - Save file → Browser updates instantly
   - No need to refresh manually
   - Only full page refresh if you break imports

5. **Use TypeScript**
   - Hover over variables to see type
   - Use autocomplete (Ctrl+Space)
   - Errors show in editor before build

---

## 📞 Common Tasks

### Add a new page
1. Create `src/features/{feature}/{Feature}Page.tsx`
2. Add to Sidebar navItems in `src/components/layout/Sidebar.tsx`
3. Import in `src/app/page.tsx`
4. Add conditional render: `{activePage === 'feature' && <FeaturePage />}`

### Add a new API hook
1. Add function in `src/services/api.ts`
2. Use `useQuery()` or `useMutation()` from React Query
3. Export function
4. Use in component: `const { data, error, isLoading } = useMyHook()`

### Update auth logic
1. Edit `src/stores/authStore.ts`
2. Add new action or modify existing one
3. Use in component: `const { logout } = useAuthStore()`

### Style a component
1. Use Tailwind classes: `className="flex gap-4 p-4"`
2. Dark mode: Add `dark:` prefix: `dark:bg-slate-900`
3. Responsive: Use `md:`, `lg:` prefixes: `md:flex-row`

---

## 🚀 First Feature Integration Checklist

When backend API is ready, integrate first endpoint:

- [ ] Backend endpoint implemented and tested
- [ ] Created API hook in `src/services/api.ts`
- [ ] Tested hook with curl: `curl http://localhost:8001/api/...`
- [ ] Import hook in page component
- [ ] Replace MOCK_TICKETS with API data
- [ ] Handle loading state with spinner
- [ ] Handle error state with message
- [ ] Test on different screen sizes
- [ ] Run build: `npm run build`
- [ ] Test in production: `npm start`

---

## 📈 Monitoring

### Dev Server Health
```bash
# Should see this when dev server is running:
✓ Ready in 1214ms
○ Compiling / ...
 GET / 200 in 5.0s (compile: 4.8s, render: 246ms)
```

### Build Health
```bash
# Should see when build succeeds:
Route (app)
└ ○ / 

✓ (Static)  prerendered as static content
```

### Production Health
```bash
# Run production build
npm run build
npm start

# Should see:
▲ Next.js x.x.x
- Local:        http://localhost:3000
```

---

## 🎓 Learning Resources

- **Next.js Docs:** https://nextjs.org/docs
- **React Query:** https://tanstack.com/query
- **Zustand:** https://github.com/pmndrs/zustand
- **Supabase:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **TypeScript:** https://www.typescriptlang.org/docs

---

**Last Updated:** January 15, 2026  
**Ready to Code:** ✅ Yes  
**Need Backend:** ✅ Yes (API endpoints)

---

## 🆘 Still Stuck?

1. Check `SUPABASE_SETUP.md` for environment issues
2. Check `MIGRATION_PATTERNS.md` for code examples
3. Check browser console for JavaScript errors
4. Check terminal for Node.js errors
5. Look at similar components for patterns
6. See `FILE_STRUCTURE.md` to understand organization

**Happy coding! 🚀**
