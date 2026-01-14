# Backend Integration Requirements

This document tracks all features requiring backend API integration. Frontend UIs are implemented with localStorage/mock data simulation where possible.

**Last Updated:** January 14, 2026  
**Status Legend:** 🔴 Critical | 🟡 Important | 🟢 Enhancement

---

## 1. Dashboard Feature

### 🔴 Real-time Metrics API
**Frontend Component:** `src/features/analytics/AnalyticsPage.tsx`  
**Current State:** Hardcoded KPI values (1,284 tickets, 2.5h resolution, 84% adoption)  
**Required Endpoint:** `GET /api/metrics/summary?period=7d|30d|90d`  
**Expected Response:**
```json
{
  "totalTickets": 1284,
  "averageResolutionTime": 150,
  "adoptionRate": 84.2,
  "slaCompliance": 85.7,
  "period": "7d"
}
```
**Priority:** 🔴 Critical - Core dashboard functionality

### 🟡 Ticket Volume Trend Data
**Frontend Component:** `src/components/charts/Charts.tsx` (SimpleLineChart)  
**Current State:** Mock data with hardcoded daily ticket counts  
**Required Endpoint:** `GET /api/metrics/volume-trend?period=7d|30d|90d`  
**Expected Response:**
```json
{
  "data": [
    {"date": "2026-01-07", "count": 142},
    {"date": "2026-01-08", "count": 156}
  ]
}
```
**Priority:** 🟡 Important - Supports trend analysis

### 🟢 Team Performance Metrics
**Frontend Component:** `src/components/charts/AdvancedCharts.tsx` (StackedBarChart)  
**Current State:** Mock data for 4 teams with resolved/in-progress/new counts  
**Required Endpoint:** `GET /api/metrics/team-performance?period=7d|30d|90d`  
**Expected Response:**
```json
{
  "teams": [
    {
      "name": "Network Ops",
      "resolved": 45,
      "inProgress": 12,
      "new": 8
    }
  ]
}
```
**Priority:** 🟢 Enhancement - Management insights

---

## 2. Search Feature

### 🔴 Semantic Search API
**Frontend Component:** `src/features/search/SearchPage.tsx`  
**Current State:** Substring matching only on `short_description` and `number` fields  
**Required Endpoint:** `POST /api/search/semantic`  
**Request Body:**
```json
{
  "query": "VPN connection issues",
  "filters": {
    "categories": ["Network"],
    "status": ["New", "In Progress"],
    "priority": ["High", "Critical"],
    "dateRange": {
      "start": "2026-01-01",
      "end": "2026-01-14"
    },
    "assignedGroup": "Network Ops"
  },
  "options": {
    "queryExpansion": true,
    "smartReranking": true,
    "minConfidence": 60
  },
  "pagination": {
    "page": 1,
    "limit": 10
  }
}
```
**Expected Response:**
```json
{
  "results": [
    {
      "ticket": { /* Full ticket object */ },
      "similarityScore": 95,
      "matchedFields": ["short_description", "description"],
      "highlightedText": "VPN <mark>connection</mark> <mark>issues</mark>"
    }
  ],
  "totalResults": 47,
  "page": 1,
  "totalPages": 5
}
```
**Priority:** 🔴 Critical - Core search functionality (currently using basic substring matching)

### 🟡 Search Suggestions API
**Frontend Component:** `src/features/search/SearchPage.tsx` (typeahead)  
**Current State:** 9 hardcoded suggestions  
**Required Endpoint:** `GET /api/search/suggestions?query=vpn&limit=10`  
**Expected Response:**
```json
{
  "suggestions": [
    {
      "term": "VPN Connection Issues",
      "category": "Network",
      "count": 47,
      "type": "query"
    },
    {
      "term": "INC0010234",
      "category": null,
      "count": 1,
      "type": "ticket"
    }
  ]
}
```
**Priority:** 🟡 Important - Improves search UX (currently hardcoded)

### 🟢 Search History Persistence
**Frontend Component:** `src/features/search/SearchPage.tsx`  
**Current State:** Not implemented  
**Required Endpoints:**
- `GET /api/users/{userId}/search-history?limit=20`
- `POST /api/users/{userId}/search-history` (body: `{query, timestamp}`)
**Priority:** 🟢 Enhancement - Power user feature

---

## 3. Root Cause Analysis Feature

### 🔴 Causal Graph Generation API
**Frontend Component:** `src/features/root-cause/RootCauseAnalysisPage.tsx`  
**Current State:** Static graph with 5 nodes, 4 edges from `mockTickets.ts`  
**Required Endpoint:** `POST /api/analysis/causal-graph`  
**Request Body:**
```json
{
  "ticketId": "INC0010001",
  "depth": 2,
  "minConfidence": 60
}
```
**Expected Response:**
```json
{
  "nodes": [
    {
      "id": "INC0010001",
      "label": "INC0010001",
      "type": "root",
      "category": "Network",
      "priority": "Critical",
      "details": "VPN connection failure - Global outage",
      "x": 400,
      "y": 300
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "INC0010001",
      "target": "INC0010002",
      "confidence": 87,
      "label": "caused by"
    }
  ],
  "clusters": [
    {
      "id": "c1",
      "label": "Network Infrastructure",
      "color": "#3b82f6",
      "nodeIds": ["INC0010001", "INC0010002"]
    }
  ]
}
```
**Priority:** 🔴 Critical - Core RCA functionality (ML-based two-stage pipeline: MPNet + MiniLM per PRD)

### 🟡 Node Detail Panel Data
**Frontend Component:** `src/features/root-cause/components/NodeDetailPanel.tsx`  
**Current State:** Shows basic ticket info from mock data  
**Required Endpoint:** `GET /api/tickets/{ticketId}/details`  
**Expected Response:**
```json
{
  "ticket": { /* Full ticket */ },
  "timeline": [
    {"timestamp": "2026-01-10T09:15:00Z", "event": "Ticket created", "user": "System"},
    {"timestamp": "2026-01-10T09:20:00Z", "event": "Assigned to Network Ops", "user": "Auto-Assignment"}
  ],
  "relatedTickets": [
    {"id": "INC0010002", "relationship": "caused_by", "confidence": 87}
  ],
  "auditLog": [
    {"timestamp": "2026-01-10T09:15:00Z", "field": "status", "oldValue": "New", "newValue": "In Progress", "user": "john.doe"}
  ]
}
```
**Priority:** 🟡 Important - Contextual information for investigation

---

## 4. Settings Feature

### 🔴 User Profile Management
**Frontend Component:** `src/features/settings/SettingsPage.tsx`  
**Current State:** localStorage simulation (name, email, avatar stored locally)  
**Required Endpoints:**
- `GET /api/users/{userId}/profile`
- `PUT /api/users/{userId}/profile` (body: `{name, email, avatar}`)
- `POST /api/users/{userId}/avatar` (multipart/form-data)
**Expected Response (GET):**
```json
{
  "id": "user-123",
  "name": "John Doe",
  "email": "john.doe@company.com",
  "avatar": "https://cdn.example.com/avatars/user-123.jpg",
  "role": "analyst",
  "createdAt": "2025-06-15T10:00:00Z"
}
```
**Priority:** 🔴 Critical - User account management

### 🔴 Password Change
**Frontend Component:** `src/features/settings/SettingsPage.tsx`  
**Current State:** Not implemented (requires backend auth)  
**Required Endpoint:** `POST /api/users/{userId}/change-password`  
**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```
**Expected Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```
**Priority:** 🔴 Critical - Security requirement

### 🟡 User Preferences Persistence
**Frontend Component:** `src/features/settings/SettingsPage.tsx`  
**Current State:** localStorage (theme, language, timezone, dateFormat, defaultPage, itemsPerPage, etc.)  
**Required Endpoints:**
- `GET /api/users/{userId}/preferences`
- `PUT /api/users/{userId}/preferences` (body: preferences object)
**Expected Response (GET):**
```json
{
  "theme": "dark",
  "language": "en",
  "timezone": "America/New_York",
  "dateFormat": "MM/DD/YYYY",
  "defaultPage": "search",
  "itemsPerPage": 10,
  "notifications": {
    "showToasts": true,
    "emailAlerts": true,
    "desktopNotifications": false
  },
  "accessibility": {
    "fontSize": 16,
    "reduceMotion": false,
    "highContrast": false
  }
}
```
**Priority:** 🟡 Important - User experience personalization (currently using localStorage)

### 🟡 Session Management
**Frontend Component:** `src/features/settings/SettingsPage.tsx`  
**Current State:** Not implemented  
**Required Endpoints:**
- `GET /api/users/{userId}/sessions`
- `DELETE /api/users/{userId}/sessions/{sessionId}`
- `DELETE /api/users/{userId}/sessions` (logout all)
**Expected Response (GET):**
```json
{
  "sessions": [
    {
      "id": "sess-abc123",
      "device": "Chrome on Windows",
      "ip": "192.168.1.100",
      "location": "New York, US",
      "lastActive": "2026-01-14T15:30:00Z",
      "current": true
    }
  ]
}
```
**Priority:** 🟡 Important - Security feature

### 🟢 Two-Factor Authentication (2FA)
**Frontend Component:** `src/features/settings/SettingsPage.tsx`  
**Current State:** Not implemented  
**Required Endpoints:**
- `POST /api/users/{userId}/2fa/setup` (returns QR code + secret)
- `POST /api/users/{userId}/2fa/verify` (body: `{code}`)
- `DELETE /api/users/{userId}/2fa/disable`
**Priority:** 🟢 Enhancement - Advanced security

### 🟢 Data Export
**Frontend Component:** `src/features/settings/SettingsPage.tsx`  
**Current State:** Client-side JSON export from localStorage  
**Required Endpoint:** `GET /api/users/{userId}/data-export` (returns downloadable archive)  
**Priority:** 🟢 Enhancement - GDPR compliance (partial client-side implementation exists)

---

## 5. Authentication Feature

### 🔴 Login/Logout API
**Frontend Component:** `src/features/auth/LoginPage.tsx`  
**Current State:** Mock authentication (hardcoded admin@nexus.ai / admin123)  
**Required Endpoints:**
- `POST /api/auth/login` (body: `{email, password}`)
- `POST /api/auth/logout`
- `POST /api/auth/refresh-token`
**Expected Response (Login):**
```json
{
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "john.doe@company.com",
    "role": "analyst",
    "avatar": "https://cdn.example.com/avatars/user-123.jpg"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```
**Priority:** 🔴 Critical - Core authentication (currently mock)

### 🟢 SSO Integration (Admin Feature)
**Frontend Component:** `src/features/settings/SettingsPage.tsx`  
**Current State:** Not implemented  
**Required Endpoints:**
- `POST /api/admin/sso/configure` (SAML/OAuth configuration)
- `GET /api/admin/sso/providers`
**Priority:** 🟢 Enhancement - Enterprise requirement

---

## 6. Notifications & Integrations

### 🟡 Email Alerts Configuration
**Frontend Component:** `src/features/settings/SettingsPage.tsx`  
**Current State:** UI toggles exist, no backend  
**Required Endpoint:** `PUT /api/users/{userId}/notification-settings`  
**Request Body:**
```json
{
  "emailAlerts": true,
  "alertRules": [
    {
      "trigger": "ticket_assigned_to_me",
      "enabled": true
    },
    {
      "trigger": "high_priority_ticket",
      "enabled": true
    }
  ]
}
```
**Priority:** 🟡 Important - Workflow automation

### 🟢 Third-Party Integrations (Slack, Teams, JIRA)
**Frontend Component:** `src/features/settings/SettingsPage.tsx`  
**Current State:** Not implemented  
**Required Endpoints:**
- `POST /api/integrations/slack/connect` (OAuth flow)
- `GET /api/integrations/status`
- `DELETE /api/integrations/{provider}/disconnect`
**Priority:** 🟢 Enhancement - Team collaboration

---

## 7. Analytics & Reporting

### 🟡 SLA Compliance Data
**Frontend Component:** `src/components/charts/AdvancedCharts.tsx` (GaugeChart)  
**Current State:** Hardcoded 85.7% value  
**Required Endpoint:** `GET /api/metrics/sla-compliance?period=7d|30d|90d`  
**Expected Response:**
```json
{
  "compliance": 85.7,
  "threshold": 90,
  "violations": 12,
  "totalTickets": 142
}
```
**Priority:** 🟡 Important - Management reporting

### 🟢 Heatmap Data (24×7 Ticket Distribution)
**Frontend Component:** `src/components/charts/AdvancedCharts.tsx` (Heatmap)  
**Current State:** Random mock data for 24 hours × 7 days  
**Required Endpoint:** `GET /api/metrics/heatmap?period=7d|30d|90d`  
**Expected Response:**
```json
{
  "data": [
    {"day": "Mon", "hour": 0, "count": 3},
    {"day": "Mon", "hour": 1, "count": 1}
  ]
}
```
**Priority:** 🟢 Enhancement - Capacity planning insights

---

## Implementation Priority

### Phase 1: Core Functionality (Backend MVP)
1. **Authentication API** (`POST /api/auth/login`, `POST /api/auth/logout`)
2. **Semantic Search API** (`POST /api/search/semantic`)
3. **Causal Graph API** (`POST /api/analysis/causal-graph`)
4. **Real-time Metrics API** (`GET /api/metrics/summary`)
5. **User Profile API** (`GET/PUT /api/users/{userId}/profile`)

### Phase 2: Enhanced Features
1. **Search Suggestions API** (`GET /api/search/suggestions`)
2. **Ticket Details API** (`GET /api/tickets/{ticketId}/details`)
3. **User Preferences API** (`GET/PUT /api/users/{userId}/preferences`)
4. **Password Change API** (`POST /api/users/{userId}/change-password`)
5. **Notification Settings API** (`PUT /api/users/{userId}/notification-settings`)

### Phase 3: Advanced Features
1. **Session Management API** (GET/DELETE `/api/users/{userId}/sessions`)
2. **2FA Setup API** (`POST /api/users/{userId}/2fa/setup`)
3. **Team Performance Metrics** (`GET /api/metrics/team-performance`)
4. **SLA Compliance Metrics** (`GET /api/metrics/sla-compliance`)
5. **Third-Party Integrations** (Slack, Teams, JIRA OAuth flows)

---

## Frontend Readiness Status

| Feature | Frontend Complete | Backend Required | Temporary Solution |
|---------|------------------|------------------|-------------------|
| Login/Logout | ✅ | Yes | Hardcoded credentials |
| Semantic Search | ✅ | Yes | Substring matching |
| Causal Graph | ✅ | Yes | Static mock graph |
| Dashboard Metrics | ✅ | Yes | Hardcoded KPIs |
| User Profile | ✅ | Yes | localStorage |
| Theme Settings | ✅ | No | Client-side only |
| Search Filters | ✅ | Partial | Client-side filtering |
| Analytics Charts | ✅ | Yes | Mock data |
| Password Change | ❌ | Yes | Not implemented |
| Session Management | ❌ | Yes | Not implemented |
| 2FA | ❌ | Yes | Not implemented |
| Integrations | ❌ | Yes | Not implemented |

---

## Notes

- All endpoints assume base URL: `http://localhost:8001/api` (per PRD.txt)
- Authentication uses JWT tokens in Authorization header: `Bearer <token>`
- Error responses follow format: `{error: string, code: string, details?: any}`
- All timestamps in ISO 8601 format (UTC)
- Pagination follows pattern: `{page, limit, totalResults, totalPages}`
- Frontend gracefully degrades to mock data when backend unavailable
