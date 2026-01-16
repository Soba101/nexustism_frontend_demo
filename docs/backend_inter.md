# Backend Integration Plan - ITSM Nexus

## Overview

Integration plan for connecting ITSM Nexus frontend to Supabase backend with demo/prod dataset separation.

## Architecture

### Dataset Separation Strategy

- Two Roles: `demo` and `prod`
- User Mapping: One-to-one (demo users -> demo data, prod users -> prod data)
- Data Isolation: Strictly isolated, no cross-dataset queries or analytics
- User Management: Pre-created by admin (no self-registration)
- Role Status: Not currently enforced; `user_metadata.role` exists but is not validated against requests

### Backend Components

- Frontend: Next.js 16 + React 19 (port 3001 or dev server)
- Backend API: FastAPI service on port 8001
  - Search endpoints: `/search/hybrid`, `/search/causal`
  - Health/utility: `/health`, `/embeddings/count`
  - REST endpoints: `/api/tickets`, `/api/analytics`, `/api/causal-graph`, etc.
- ServiceNow Pipeline: Existing pipeline that creates/reads/updates tickets in Supabase
  - Production data synced from ServiceNow `incidents` table
  - Writes should route through backend to normalize schema and trigger pipeline
- Supabase: Local Docker instance
  - Kong Gateway: http://localhost:8000
  - Supabase Studio: http://localhost:3000
  - Database: PostgreSQL with pgvector + two datasets (`incidents` prod, `servicenow_demo` demo)

## Supabase Configuration

### Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9...
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

### Database Schema (Audited)

#### Production Table: `incidents`

- `id` (integer, PK)
- `number` (text)
- `short_description` (text)
- `description` (text)
- `service` (text)
- `service_offering` (text)
- `category` (text)
- `subcategory` (text)
- `assignment_group` (text)
- `state` (text)
- `priority` (text)
- `opened_at` (timestamp)
- `resolved_at` (timestamp)
- `embedding` (vector, 768-dim)
- `processed_text` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `fts` (tsvector)

Row count: 10,000+ (production ServiceNow data)

#### Demo Table: `servicenow_demo`

- `sys_id` (text, PK)
- `incident_number` (text)
- `short_description` (text)
- `description` (text)
- `state` (text)
- `priority` (text)
- `impact` (text)
- `urgency` (text)
- `caller_id` (text)
- `assigned_to` (text)
- `assignment_group` (text)
- `category` (text)
- `subcategory` (text)
- `sys_created_on` (timestamp)
- `sys_updated_on` (timestamp)
- `sys_created_by` (text)
- `sys_updated_by` (text)
- `opened_at` (timestamp)
- `resolved_at` (timestamp)
- `closed_at` (timestamp)
- `close_code` (text)
- `close_notes` (text)
- `resolution_code` (text)
- `resolution_notes` (text)
- `work_notes` (text)
- `comments` (text)
- `business_service` (text)
- `cmdb_ci` (text)
- `raw` (jsonb)
- `embedding` (vector, 768-dim)

Row count: ~50-100 demo records

#### Other Tables

- `source` (unknown)
- `audit_log` (audit trail)

#### RPC Functions

- `hybrid_search_incidents` (hybrid search)
- `match_incidents` (vector similarity)

### RLS Policies

Not audited yet. Plan is to enforce role-based access by JWT role claim.

## Authentication Flow

### User Metadata Structure

```json
{
  "email": "admin@admin.com",
  "user_metadata": {
    "role": "demo",
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

### Recommended Approach: Backend API Layer

Frontend always calls backend `/api/*` endpoints. Backend handles:
- Dataset routing by `X-Dataset` header (with query param fallback)
- Schema normalization
- ServiceNow pipeline integration for writes

### Request Flow

```
Component
  -> React Query hook
  -> API Service (adds X-Dataset header)
  -> Backend API (localhost:8001/api/*)
  -> Backend chooses dataset (demo/prod)
  -> Query Supabase table
  -> Normalize schema
  -> Return unified Ticket JSON
```

### API Request Format

```typescript
GET http://localhost:8001/api/tickets?limit=10
Headers: {
  'Authorization': 'Bearer <jwt>',
  'X-Dataset': 'demo'
}
```

## Backend API Endpoints (Need to Implement/Extend)

**Current Status (verified against `supabase/api_service_production.py`):**
Search + analytics + tickets are implemented and dataset-aware, but some endpoints are stubs or missing.

**Required Endpoints:**
- `GET /api/tickets` - List tickets with filters (dataset-aware) DONE
- `GET /api/tickets/:id` - Single ticket details DONE
- `POST /api/tickets` - Create ticket (routes to ServiceNow pipeline for prod) DONE (direct DB insert; pipeline integration still needed)
- `PATCH /api/tickets/:id` - Update ticket (routes to ServiceNow pipeline for prod) STUB (echo only; no persistence)
- `GET /api/tickets/:id/timeline` - Ticket timeline STUB (hardcoded)
- `GET /api/tickets/:id/audit` - Audit log STUB (hardcoded)
- `GET /api/analytics/metrics` - KPI metrics (dataset-aware) DONE (avg resolution time computed)
- `GET /api/analytics/volume` - Volume over time DONE
- `GET /api/analytics/team-performance` - Team stats DONE
- `GET /api/analytics/heatmap` - Creation heatmap DONE
- `GET /api/analytics/priority-breakdown` - Priority distribution DONE
- `GET /api/analytics/sla-compliance` - SLA compliance proxy DONE
- `POST /api/search/hybrid` - Dataset-aware DONE
- `POST /api/search/causal` - Dataset-aware DONE
- `GET /api/causal-graph/:ticketId` - Root cause graph DONE
- `POST /api/feedback/graph` - Graph validation feedback DONE (stores if table exists)
- `POST /api/feedback/graph/flag-incorrect` - Flag incorrect graph DONE (stores if table exists)
- `GET /api/user/preferences` - User settings DONE (fallback defaults if table missing)
- `PUT /api/user/preferences` - Update settings DONE (stores if table exists)
- `POST /api/export/csv` - Export data DONE

## Frontend Changes Required

### 1. Auth Store (`src/stores/authStore.ts`)

- Extract `user_metadata.role` on login/restore
- Persist `datasetMode` in state

### 2. API Service (`src/services/api.ts`)

- Send `X-Dataset` header on all API requests

### 3. React Query Cache Keys

- Include `datasetMode` in cache keys for data isolation

### 4. Settings Page (`src/features/settings/SettingsPage.tsx`)

- Dataset indicator shown in UI

## Implementation Steps

### Phase 1: Database Audit

- Connect to Supabase Studio
- Document schemas/tables
- Verify demo vs prod separation
- Check user accounts and roles
- Confirm RLS policies

### Phase 2: Frontend Integration

- Auth store updates (datasetMode)
- API service adds dataset header
- React Query cache keys include datasetMode
- Settings page dataset indicator
- Test login with demo/prod users

### Phase 3: Backend Verification

- Confirm dataset routing in backend
- Test endpoints with `X-Dataset`
- Confirm RLS policies block cross-dataset
- Test search, analytics, root cause, settings

### Phase 4: Testing & Validation

- End-to-end test demo user
- End-to-end test prod user
- Verify data isolation

## Current Status

### Completed

- Supabase Docker instance running
- Frontend authentication working
- Environment variables configured
- Backend API exists on port 8001
- Dataset routing implemented in backend
- API service sends `X-Dataset` header
- React Query keys include datasetMode

### In Progress

- Demo user setup (role metadata)
- Dataset authorization (JWT role vs X-Dataset)

### Pending

- Replace direct DB insert in POST `/api/tickets` with ServiceNow pipeline integration
- Implement ServiceNow pipeline integration for PATCH `/api/tickets/:id`
- Replace timeline/audit stubs with real data
- Create DB tables if feedback/preferences persistence is required

## Notes & Decisions

### Key Decisions

1. Dataset separation via tables (`incidents` vs `servicenow_demo`)
2. Role names: `demo` and `prod`
3. Dataset mode derived from `user_metadata.role` (no manual toggle)
4. Backend owns schema normalization
5. Demo dataset is read-only

### Known Limitations

- No self-registration
- Dataset authorization not enforced yet
- Demo write operations blocked in backend
- Timeline/audit endpoints are placeholders

## Remaining Work

- Create demo user account in Supabase with `user_metadata.role = 'demo'`
- Enable `REQUIRE_AUTH=true` to enforce JWT validation in production
- Create tables for persistence if needed: `feedback_graph`, `feedback_graph_flags`, `user_preferences`
- Replace placeholder timeline/audit and update stubs with real data
- Enforce dataset authorization using JWT role vs `X-Dataset` header
- Replace direct DB insert in POST `/api/tickets` with ServiceNow pipeline integration
