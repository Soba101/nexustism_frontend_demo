# Backend Integration Plan - ITSM Nexus

## Overview

Integration plan for connecting ITSM Nexus frontend to Supabase backend with demo/prod dataset separation.

## Architecture

### Dataset Separation Strategy

- **Two Roles**: `demo` and `prod`
- **User Mapping**: One-to-one (demo users → demo data, prod users → prod data)
- **Data Isolation**: Strictly isolated, no cross-dataset queries or analytics
- **User Management**: Pre-created by admin (no self-registration)
- **Role Status**: ⚠️ **Not currently implemented** - `user_metadata.role` exists but not enforced; plan includes hook for future role-based access

### Backend Components

- **Frontend**: Next.js 16 + React 19 (port 3001 or dev server)
- **Backend API**: Existing FastAPI service on port 8001 (search/causal analysis focused)
  - **Search endpoints**: `/search/hybrid`, `/search/causal`
  - **Health/utility**: `/health`, `/embeddings/count`
  - **TODO**: REST CRUD endpoints for `/api/tickets`, `/api/analytics`, etc. (need to be built or extended)
- **ServiceNow Pipeline**: Existing pipeline that creates/reads/updates tickets in Supabase
  - Production data synced from ServiceNow → `incidents` table
  - All CRUD operations must route through backend to normalize schema and trigger pipeline
- **Supabase**: Local Docker instance
  - Kong Gateway: <http://localhost:8000>
  - Supabase Studio: <http://localhost:3000>
  - Database: PostgreSQL with pgvector extension + two datasets (`incidents` prod, `servicenow_demo` demo)

## Supabase Configuration

### Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9...
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

### Database Schema (To Be Audited)

Expected structure (pending audit):

#### Demo Schema (`public_demo` or table prefix)

- `tickets` - Demo incident data
- `graph_nodes` - Causal graph nodes
- `graph_edges` - Causal relationships
- `user_preferences` - User settings
- `feedback_search` - Search feedback
- `feedback_causal` - Graph validation feedback

#### Production Schema (`public_prod` or table prefix)

- Same table structure as demo
- Contains 10,633+ real ServiceNow incidents
- Production analytics data

### Row-Level Security (RLS) Policies

```sql
-- Demo users can only access demo data
CREATE POLICY "demo_users_demo_data" ON public_demo.tickets
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'demo');

-- Prod users can only access prod data  
CREATE POLICY "prod_users_prod_data" ON public_prod.tickets
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'prod');
```

## Authentication Flow

### User Metadata Structure

```json
{
  "email": "admin@admin.com",
  "user_metadata": {
    "role": "demo", // or "prod"
    "full_name": "Demo Admin",
    "team": "Support Analyst"
  }
}
```

### Login Flow

1. User enters credentials in `LoginPage.tsx`
2. `useAuthStore.login()` calls Supabase `signIn()`
3. Extract `user.role` from `user_metadata`
4. Auto-set `datasetMode = user.role === 'demo' ? 'demo' : 'prod'`
5. Store in Zustand: `{ user, datasetMode, sessionTimeout }`
6. All API calls include dataset context

## API Integration

### Recommended Approach: Backend API Layer (Option 2)

**Why not direct Supabase?**
- ServiceNow pipeline requires backend mediation (create/read/update flows through service)
- Schema normalization needed (`incidents` vs `servicenow_demo` have different field names)
- Role-based access control (when implemented) must be enforced server-side, not client-side
- Keeps Supabase credentials server-side (secure)
- Frontend unaware of data source changes (mock → Supabase → ServiceNow)

**Architecture:**
- Frontend always calls backend API `/api/*` endpoints (do NOT query Supabase directly)
- Backend owns data source routing:
  - `demo` dataset → `servicenow_demo` table or mock fallback
  - `prod` dataset → `incidents` table + ServiceNow pipeline for creates/updates
- Backend normalizes schemas to unified `Ticket` shape before returning to frontend
- React Query hooks in frontend remain unchanged; they're data-source agnostic

### Request Flow

```
Component (SearchPage)
  ↓
React Query Hook (useTickets)
  ↓
API Service (src/services/api.ts) → adds X-Dataset header
  ↓
Backend API (localhost:8001/api/tickets)
  ↓
Backend determines dataset (demo|prod) from X-Dataset header or JWT role
  ↓
Query Supabase (incidents or servicenow_demo table)
  ↓
Call ServiceNow pipeline if WRITE operation (create/update)
  ↓
Normalize schema fields (id, number, etc.)
  ↓
Return unified Ticket JSON → Cache → Render
```

### API Request Format

```typescript
// Preferred: Header-based dataset routing
GET http://localhost:8001/api/tickets?limit=10
Headers: {
  'Authorization': 'Bearer <jwt>',
  'X-Dataset': 'demo'  // or 'prod'
}

// Alternative: Query parameter (fallback if header not supported)
GET http://localhost:8001/api/tickets?dataset=demo&limit=10
Headers: {
  'Authorization': 'Bearer <jwt>'
}
```

### Backend API Endpoints (Need to Implement/Extend)

**Current Status:** Backend only has `/search/*` endpoints; CRUD endpoints missing.

**Required Endpoints:**
- `GET /api/tickets` - List tickets with filters (dataset-aware)
- `GET /api/tickets/:id` - Single ticket details
- `POST /api/tickets` - Create ticket (routes to ServiceNow pipeline for prod)
- `PATCH /api/tickets/:id` - Update ticket (routes to ServiceNow pipeline for prod)
- `GET /api/analytics/metrics` - KPI metrics (dataset-aware)
- `GET /api/analytics/team-performance` - Team stats
- `POST /api/search/hybrid` - Already exists; add dataset routing
- `POST /api/search/causal` - Already exists; add dataset routing
- `GET /api/graph/causal-analysis` - Root cause graph
- `POST /api/feedback/graph` - Graph validation feedback
- `GET /api/user/preferences` - User settings
- `PUT /api/user/preferences` - Update settings
- `POST /api/export/csv` - Export data

## Frontend Changes Required

### 1. Auth Store (`src/stores/authStore.ts`)

```typescript
export interface AuthStore {
  user: AuthUser | null;
  datasetMode: 'demo' | 'prod'; // NEW
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

// In login():
const { data, error } = await signIn(email, password);
const role = data.user?.user_metadata?.role || 'prod';
set({ 
  user: convertedUser, 
  datasetMode: role === 'demo' ? 'demo' : 'prod' // NEW
});
```

### 2. API Service (`src/services/api.ts`)

```typescript
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const { user, datasetMode } = useAuthStore.getState();
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${session?.access_token}`,
    'X-Dataset': datasetMode, // NEW
  };
  
  return fetch(`${API_BASE_URL}${url}`, { ...options, headers });
};
```

### 3. React Query Cache Keys

```typescript
// Before
export const useTickets = (filters) => {
  return useQuery({
    queryKey: ['tickets', filters],
    // ...
  });
};

// After
export const useTickets = (filters) => {
  const { datasetMode } = useAuthStore();
  return useQuery({
    queryKey: ['tickets', datasetMode, filters], // Include dataset
    // ...
  });
};
```

### 4. Settings Page (`src/features/settings/SettingsPage.tsx`)

```tsx
export const SettingsPage = ({ theme, setTheme, onLogout }) => {
  const { user, datasetMode } = useAuthStore();
  
  return (
    <div>
      {/* Existing settings */}
      
      {/* NEW: Dataset Indicator */}
      <Card>
        <CardHeader>
          <CardTitle>Dataset Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Dataset</p>
              <p className="text-sm text-slate-500">
                {datasetMode === 'demo' ? 'Demo Dataset' : 'Production Dataset'}
              </p>
            </div>
            <Badge variant={datasetMode === 'demo' ? 'secondary' : 'default'}>
              {datasetMode.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Logged in as: {user?.email}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 5. Root App State (`src/app/page.tsx`)

```typescript
function App() {
  const { user, datasetMode, restoreSession } = useAuthStore();
  
  // datasetMode automatically derived from user.role
  // No manual toggle needed
  
  return (
    <QueryProvider>
      {!user ? (
        <LoginPage />
      ) : (
        <div>
          <Sidebar activePage={activePage} setActivePage={setActivePage} />
          {/* Pass datasetMode to features if needed */}
        </div>
      )}
    </QueryProvider>
  );
}
```

## Implementation Steps

### Phase 1: Database Audit (Current Step)

- [ ] Connect to Supabase Studio (<http://localhost:3000>)
- [ ] Document existing schemas/tables
- [ ] Check demo vs. prod data separation
- [ ] Verify user accounts and roles in Auth tab
- [ ] Confirm RLS policies exist
- [ ] Document row counts and sample data

### Phase 2: Frontend Integration

- [ ] Update `authStore.ts` to extract and store `datasetMode`
- [ ] Modify `api.ts` to include dataset in requests
- [ ] Update all React Query hooks to include `datasetMode` in cache keys
- [ ] Add dataset indicator to Settings page
- [ ] Test login with demo user (verify demo data loads)
- [ ] Test login with prod user (verify prod data loads)

### Phase 3: Backend Verification

- [ ] Verify backend API (port 8001) handles dataset routing
- [ ] Test API endpoints with `X-Dataset` header
- [ ] Confirm RLS policies block cross-dataset access
- [ ] Test all features: Search, Analytics, Root Cause, Settings

### Phase 4: Testing & Validation

- [ ] End-to-end test: Demo user workflow
- [ ] End-to-end test: Prod user workflow
- [ ] Verify data isolation (no leakage)
- [ ] Test logout → login with different role
- [ ] Performance test with production dataset (10k+ tickets)

## Current Status

### ✅ Completed

- Supabase Docker instance running
- Frontend authentication working
- Demo user created: `admin@admin.com`
- Environment variables configured
- Backend API exists on port 8001

### 🔄 In Progress

- Database schema audit (next step)
- Dataset routing implementation

### ⏳ Pending

- Auth store updates
- API service modifications
- React Query cache key updates
- Settings page UI additions
- End-to-end testing

## Database Audit Findings

### Schemas

- **Single `public` schema** (not separated by `public_demo` and `public_prod`)
- Dataset separation achieved via **separate tables**: `incidents` (prod) and `servicenow_demo` (demo)

### Tables

#### Production Table: `incidents`

**Columns:**

- `id` (integer, PK)
- `number` (text) - ServiceNow ticket number (e.g., "INC0045677")
- `short_description` (text) - Brief summary (truncated in DB)
- `description` (text) - Full incident details
- `service` (text) - Service category (e.g., "Mulesoft/EAI")
- `service_offering` (text) - Sub-service
- `category` (text) - Main category (e.g., "Application/Software")
- `subcategory` (text) - Sub-category (e.g., "Job failure")
- `assignment_group` (text) - Assigned team (e.g., "PISCAP L2 Mulesoft/SOA")
- `state` (text) - Ticket state (e.g., "Closed", "New")
- `priority` (text) - Priority level (e.g., "4 - Low", "3 - Moderate")
- `opened_at` (timestamp) - Creation date
- `resolved_at` (timestamp) - Resolution date
- `embedding` (vector) - **768-dimensional pgvector embedding** for semantic search
- `processed_text` (text) - Preprocessed text for search
- `created_at` (timestamp) - DB record creation
- `updated_at` (timestamp) - DB record update
- `fts` (tsvector) - Full-text search index

**Row Count:** 10,000+ records (production ServiceNow data)

**Sample Record:**

- `number`: "INC0045677"
- `category`: "Application/Software"  
- `priority`: "4 - Low"
- `state`: "Closed"
- `assignment_group`: "PISCAP L2 Mulesoft/SOA"
- `embedding`: 768-dimensional vector (MPNet model output)

#### Demo Table: `servicenow_demo`

**Columns:**

- `sys_id` (text, PK) - ServiceNow GUID
- `incident_number` (text) - Demo ticket number (e.g., "INC0010046")
- `short_description` (text) - Brief summary
- `description` (text) - Full description
- `state` (text) - Ticket state ("New", "In Progress", etc.)
- `priority` (text) - Priority ("3 - Moderate", etc.)
- `impact` (text) - Impact level ("1 - High", etc.)
- `urgency` (text) - Urgency level ("3 - Low", etc.)
- `caller_id` (text) - Reporter name
- `assigned_to` (text) - Assignee name
- `assignment_group` (text) - Assigned team
- `category` (text) - Category ("Inquiry / Help", etc.)
- `subcategory` (text) - Sub-category
- `sys_created_on` (timestamp) - Created date
- `sys_updated_on` (timestamp) - Updated date
- `sys_created_by` (text) - Creator username
- `sys_updated_by` (text) - Last updater
- `opened_at` (timestamp) - Opened timestamp
- `resolved_at` (timestamp) - Resolved timestamp
- `closed_at` (timestamp) - Closed timestamp
- `close_code` (text) - Close code
- `close_notes` (text) - Close notes
- `resolution_code` (text) - Resolution code
- `resolution_notes` (text) - Resolution notes
- `work_notes` (text) - Internal notes
- `comments` (text) - Public comments
- `business_service` (text) - Business service
- `cmdb_ci` (text) - Configuration item
- `raw` (jsonb) - Raw ServiceNow JSON response
- `embedding` (vector) - **768-dimensional pgvector embedding**

**Row Count:** 50-100 demo records (estimated)

**Sample Record:**

- `incident_number`: "INC0010046"
- `short_description`: "Access Rights Restriction"
- `category`: "Inquiry / Help"
- `priority`: "3 - Moderate"
- `state`: "New"
- `caller_id`: "Melinda Carleton"
- `embedding`: 768-dimensional vector

#### Other Tables

- `source` - Unknown structure (appears in API schema)
- `audit_log` - Audit trail (columns: id, table_name, operation, record_id, changed_by, changed_at, old_data, new_data)

#### RPC Functions

- `hybrid_search_incidents` - Semantic + FTS hybrid search
- `match_incidents` - Vector similarity search

### User Accounts

**Verified:**

- `admin@admin.com` (created, role TBD - need to check user_metadata)

**Missing:**

- No demo vs. prod role metadata found yet (need to query Supabase Auth directly)

### RLS Policies

**Status:** Not audited yet

- Need to check Supabase Studio → Database → RLS section
- Assumption: RLS policies route based on JWT `role` claim

### Data Structure Differences

#### Key Differences Between `incidents` vs. `servicenow_demo`

| Field | `incidents` (Prod) | `servicenow_demo` (Demo) | Notes |
|-------|-------------------|-------------------------|-------|
| **ID** | `id` (integer) | `sys_id` (text GUID) | Different primary key types |
| **Ticket Number** | `number` | `incident_number` | Same concept, different names |
| **Impact/Urgency** | ❌ Not present | ✅ `impact`, `urgency` | Demo has more ServiceNow fields |
| **Caller Info** | ❌ Not present | ✅ `caller_id` | Demo tracks reporter |
| **Raw JSON** | ❌ Not present | ✅ `raw` (jsonb) | Demo preserves original data |
| **Service Fields** | ✅ `service`, `service_offering` | ❌ `business_service` | Different service models |
| **Embedding** | ✅ 768-dim vector | ✅ 768-dim vector | Both support semantic search |

### Data Samples

#### Production (`incidents`) Sample

```json
{
  "id": 4710,
  "number": "INC0045677",
  "short_description": "Dear Team Error occurred while processing the EDI transaction...",
  "category": "Application/Software",
  "subcategory": "Job failure",
  "priority": "4 - Low",
  "state": "Closed",
  "assignment_group": "PISCAP L2 Mulesoft/SOA",
  "service": "Mulesoft/EAI",
  "embedding": "[0.0028617098,-0.052869648,...]" // 768 dimensions
}
```

#### Demo (`servicenow_demo`) Sample

```json
{
  "sys_id": "003d252b0f7cb210b7006dd530d1b299",
  "incident_number": "INC0010046",
  "short_description": "Access Rights Restriction",
  "description": "Merchant reported being unable to e-sign...",
  "category": "Inquiry / Help",
  "priority": "3 - Moderate",
  "impact": "1 - High",
  "urgency": "3 - Low",
  "state": "New",
  "caller_id": "Melinda Carleton",
  "assignment_group": "Incident Management",
  "embedding": "[0.0014301051,0.00263926,...]" // 768 dimensions
}
```

## Notes & Decisions

### Decision Log

1. **Dataset Separation**: Using separate tables (`incidents` vs `servicenow_demo`) NOT separate schemas
2. **Role Naming**: Using `demo` and `prod` (not `production`) for brevity
3. **User Creation**: Pre-created by admin to control access
4. **Dataset Toggle**: Read-only indicator (auto-routed by role), not user-selectable
5. **Integration Approach**: ✅ **Backend API Layer (Option 2)** - Recommended
   - Frontend always calls backend `/api/*` endpoints (NOT Supabase directly)
   - Backend owns data source routing and ServiceNow pipeline mediation
   - Keeps sensitive logic and credentials server-side
   - Schema normalization handled by backend before response

### ServiceNow Pipeline Integration

**Current State:**
- ✅ ServiceNow pipeline exists for creating/reading/updating tickets
- ✅ Production data synced to `incidents` table
- ✅ Backend API (port 8001) operational with search endpoints

**Integration Points:**
- **Create**: Frontend → POST `/api/tickets` → Backend routes to ServiceNow pipeline → writes to `incidents` table
- **Read**: Frontend → GET `/api/tickets` → Backend queries `incidents` (prod) or `servicenow_demo` (demo) → normalizes schema → returns
- **Update**: Frontend → PATCH `/api/tickets/:id` → Backend routes to ServiceNow pipeline → updates `incidents` table
- **Search**: Frontend → POST `/api/search/hybrid` or `/search/causal` → Backend leverages existing ML pipeline (no ServiceNow call needed)

**Schema Normalization Responsibility:**
Backend must normalize:
- `incidents.id` (int) → `Ticket.id` (string)
- `servicenow_demo.sys_id` → `Ticket.id` (string)
- `incidents.number` → `Ticket.number`
- `servicenow_demo.incident_number` → `Ticket.number`
- Optional fields (impact, urgency, caller_id, service, service_offering) mapped to null if not available

### Role-Based Access Control (Future)

**Current Status:** ⚠️ **Not implemented**
- `user_metadata.role` field exists but not enforced
- `admin@admin.com` has role metadata but no authorization gates in place
- No RLS policies active yet

**Future Implementation:**
1. Activate Supabase RLS policies on `incidents` and `servicenow_demo` tables
2. Backend validates `role` claim in JWT token from Supabase Auth
3. Only allow demo role to query `servicenow_demo`; only prod role to query `incidents`
4. Enforce in both backend code and RLS policies (defense in depth)
5. Demo users cannot create/update (read-only for demo dataset)

**Placeholder for roles:**
```typescript
// In authStore.ts - ready for role extraction
const role = user.user_metadata?.role || 'prod'; // Defaults to prod if missing
```

### Critical Schema Incompatibilities

#### Problem: Different Column Names

- Prod uses `number`, Demo uses `incident_number`
- Prod uses `id` (integer), Demo uses `sys_id` (text GUID)
- Demo has `impact`/`urgency`, Prod does not
- Demo has `caller_id`, Prod does not
- Prod has `service`/`service_offering`, Demo has `business_service`

#### Solution: Backend API Normalization

Backend API (port 8001) must:

1. Query correct table based on dataset mode
2. Normalize column names to unified schema
3. Return consistent JSON structure to frontend

**Example API Response (normalized):**

```json
{
  "id": "4710",  // or "003d252b0f7cb210b7006dd530d1b299"
  "number": "INC0045677",  // mapped from 'number' or 'incident_number'
  "short_description": "...",
  "description": "...",
  "category": "Application/Software",
  "priority": "4 - Low",
  "state": "Closed",
  "assignment_group": "...",
  // Optional fields (null if not available)
  "service": "Mulesoft/EAI",  // from prod.service or demo.business_service
  "impact": null,  // only from demo
  "urgency": null,  // only from demo
  "caller_id": null,  // only from demo
  "opened_at": "2025-10-30T21:44:01+00:00",
  "resolved_at": null
}
```

### Known Limitations

- No self-registration (users must be pre-created)
- No cross-dataset analytics for admins
- No role switching without logout/re-login
- Dataset mode tied to user account (not session preference)
- **Schema mismatch** between prod and demo tables requires backend normalization
- **Roles not yet enforced** - plan leaves hook for future implementation
- **CRUD endpoints not yet built** - only search endpoints exist; `/api/tickets`, `/api/analytics` endpoints need to be implemented
- Demo dataset is read-only (cannot create/update); all writes go to prod via ServiceNow pipeline

### Future Enhancements (Out of Scope)

- Multi-role support (analyst, admin, viewer)
- Cross-dataset reporting for admins
- User management UI for creating demo/prod accounts
- Audit logs for dataset access
- Schema migration to unify `incidents` and `servicenow_demo` structures
- Demo write capability (currently read-only for testing)

## References

- Frontend Architecture: `.github/copilot-instructions.md`
- API Hooks: `src/services/api.ts`
- Auth Store: `src/stores/authStore.ts`
- Type Definitions: `src/types/index.ts`
- Mock Data Structure: `src/data/mockTickets.ts`
- Supabase Setup: `docs/SUPABASE_SETUP.md`

---

## Summary & Next Steps

### ✅ Database Audit & Architecture Complete

**Key Findings:**

1. **Two separate tables**: `incidents` (prod, 10k+ records) and `servicenow_demo` (demo, ~50-100 records)
2. **Schema mismatch**: Different column names between prod and demo tables
3. **pgvector enabled**: Both tables have 768-dimensional embeddings for semantic search
4. **Backend API exists**: Port 8001 has search endpoints; CRUD endpoints need to be built
5. **User accounts**: `admin@admin.com` created (roles not yet enforced)
6. **ServiceNow Pipeline**: Exists for creating/reading/updating tickets in prod
7. **Recommended Approach**: **Backend API Layer** - All frontend calls go through `/api/*` endpoints

### 🔄 Phase 2: Frontend Integration (Ready to Start)

**Immediate Tasks:**

1. ✅ Update `authStore.ts` to extract and store `datasetMode` from `user_metadata.role`
2. ✅ Modify `api.ts` to include `X-Dataset` header in all requests
3. ✅ Update all React Query hooks to include `datasetMode` in cache keys
4. ✅ Add dataset indicator (read-only) to Settings page
5. ✅ Test login with demo user (verify demo data loads)
6. ✅ Test login with prod user (verify prod data loads)

**Backend API Requirements (Port 8001):**

- ✅ Search endpoints already implemented (`/search/hybrid`, `/search/causal`)
- ❌ **NEED TO BUILD**: CRUD endpoints (`/api/tickets`, `/api/tickets/:id`, `/api/analytics/*`)
- ❌ **NEED TO IMPLEMENT**: Dataset routing logic (check `X-Dataset` header, query correct table)
- ❌ **NEED TO IMPLEMENT**: Schema normalization (map field names from `incidents`/`servicenow_demo` to unified `Ticket` shape)
- ✅ **NEED TO INTEGRATE**: ServiceNow pipeline for create/update operations on prod dataset

**Frontend Type Alignment:**

Check if `src/types/index.ts` `Ticket` interface matches normalized API response. Expected fields:

```typescript
interface Ticket {
  id: string;  // Unified ID (int or GUID as string)
  number: string;  // Unified ticket number
  short_description: string;
  description: string;
  category: string;
  priority: string;  // "4 - Low", "3 - Moderate", etc.
  state: string;  // "New", "Closed", etc.
  assignment_group: string;
  opened_at: string;  // ISO timestamp
  resolved_at?: string;  // Optional
  // Demo-only fields (null for prod)
  impact?: string;
  urgency?: string;
  caller_id?: string;
  // Prod-only fields (null for demo)
  service?: string;
  service_offering?: string;
  // AI/Search fields
  similarity_score?: number;
  related_ids?: string[];
}
```

### 🎯 Action Items (In Priority Order)

**Phase 2A: Frontend Setup (2 hours)**
1. Update `authStore.ts` to extract `user.metadata.role` → `datasetMode`
2. Update `api.ts` to add `X-Dataset: datasetMode` header to requests
3. Update React Query cache keys to include `datasetMode`
4. Add dataset indicator to Settings page
5. Test basic login flow with mock data

**Phase 2B: Backend Endpoint Implementation (4+ hours - YOUR TEAM)**
1. Build `/api/tickets` GET endpoint (dataset-aware)
2. Build `/api/tickets/:id` GET endpoint
3. Build `/api/tickets` POST endpoint (routes to ServiceNow for prod)
4. Build `/api/tickets/:id` PATCH endpoint (routes to ServiceNow for prod)
5. Build `/api/analytics/metrics` endpoint
6. Implement schema normalization layer (map `incidents`/`servicenow_demo` fields to `Ticket`)
7. Test dataset routing with `X-Dataset` header

**Phase 2C: Integration Testing (1.5 hours)**
1. Login with demo user → verify demo data loads via `/api/tickets`
2. Login with prod user → verify prod data loads via `/api/tickets`
3. Create/Update test: prod user creates ticket → verify ServiceNow pipeline triggered
4. Verify schema normalization: fields properly mapped
5. Check all features: Search, Analytics, Root Cause with real data

**Estimated Total Time**: 7.5+ hours (2 frontend, 4+ backend, 1.5 testing)

### 📋 Questions to Resolve

1. **Backend CRUD endpoints**: Do they exist but need dataset routing added, or need to be built from scratch?
2. **ServiceNow pipeline details**: How are create/update calls made? What's the integration point for backend?
3. **Schema mapping**: Should normalization be in backend layer or separate utility module?
4. **Demo dataset**: Should demo be read-only (testing) or writable (also creating demo records)?
5. **Roles timeline**: When should role-based enforcement be added? Phase 2 or later?

---

**Ready to proceed with Phase 2A (Frontend)? Confirm:**
- Can you/your team build the backend CRUD endpoints in parallel?
- Any changes to the integration approach?
- Timeline for roles implementation?
