# Health Status Page Setup & Badge Implementation

## Overview

The **Health Status Page** is a real-time dashboard that displays the health status of monitored endpoints. It fetches endpoint data from the database and performs periodic health checks via the NestJS backend API, displaying results with visual status badges (Running/Offline).

## Architecture & Data Flow

### System Components

```
Frontend (Solid.js)
  ↓ HTTP GET
Backend (NestJS) /api/endpoints → Endpoints from MongoDB
  ↓ HTTP GET
Backend (NestJS) /api/endpoint-groups → Groups from MongoDB
  ↓ HTTP POST /api/health-check/manual
Backend Health Check Service → Pings each endpoint URL
  ↓ HTTP Response with health check results
Frontend Signal Update → endpointStatus Record populated
  ↓ Solid.js Reactivity
Browser Re-render → Status badges display "Running" or "Offline"
```

### Data Models

**Endpoint (from DB):**
```javascript
{
  _id: string,
  name: string,
  url: string,
  active: boolean,
  description: string,
  groupId: string,
  sortOrder: number
}
```

**Health Check Result (from API):**
```javascript
{
  id: string,                    // endpoint._id
  name: string,
  url: string,
  status: "online" | "offline",  // Critical field for badges
  responseTime: number,
  statusCode: number,
  checkedAt: ISO8601 timestamp
}
```

**endpointStatus Signal (Record):**
```javascript
{
  "endpoint-id-1": { status: "online", responseTime: 245, ... },
  "endpoint-id-2": { status: "offline", responseTime: 0, ... },
  ...
}
```

## Implementation Details

### 1. Data Loading (HealthStatusPage.tsx)

```typescript
const loadData = async () => {
  // Fetch endpoint groups
  const groupsRes = await fetch('/api/endpoint-groups', { ... });
  const groupsData = await groupsRes.json();
  setGroups(groupsData);

  // Fetch all endpoints
  const endpointsRes = await fetch('/api/endpoints', { ... });
  const endpointsData = await endpointsRes.json();
  setEndpoints(endpointsData);
};
```

Runs on component mount via `createEffect(() => { loadData(); })`.

### 2. Health Check Execution

```typescript
const checkEndpointHealth = async () => {
  setIsLoading(true);
  const response = await fetch('/api/health-check/manual', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, ... },
    body: JSON.stringify({ endpointIds: endpoints.map(e => e._id) })
  });
  
  const results = await response.json(); // Array of health check results
  
  // CRITICAL: Build a Record object, NOT a Map
  const statusObj: Record<string, EndpointStatus> = {};
  results.forEach((result) => {
    statusObj[result.id] = result;
  });
  
  // Trigger reactivity with spread operator
  setEndpointStatus({...statusObj});
  setIsLoading(false);
};
```

**Why Record instead of Map?** Solid.js doesn't automatically track mutations on Map objects. Using a plain `Record<string, EndpointStatus>` (JavaScript object) ensures Solid's reactivity system properly detects signal updates.

### 3. Badge Implementation (The Critical Part)

#### Problem Encountered

Initially, status badges always displayed dashes (`—`) instead of "Running"/"Offline", despite the API returning correct data and the signal containing all results.

**Root Cause:** Used `Map<string, EndpointStatus>` which Solid.js doesn't track properly for mutations. Signal updates weren't triggering re-renders.

#### Solution: Three-Part Pattern

**Part 1: Signal Creation**
```typescript
const [endpointStatus, setEndpointStatus] = createSignal<Record<string, EndpointStatus>>({});
```

**Part 2: Derived Memo in Table Row**
```typescript
const status = createMemo(() => endpointStatus()[endpoint._id]);
const isOffline = () => status()?.status === 'offline';
```

The `createMemo` wrapper ensures Solid.js properly tracks the derived value. When `endpointStatus` signal updates, the memo re-evaluates.

**Part 3: JSX Rendering**
```jsx
<div class={styles.statusBadge}>
  {status()?.status === 'online' ? (
    <span class={styles.runningBadge}>Running</span>
  ) : status()?.status === 'offline' ? (
    <span class={styles.offlineBadge}>Offline</span>
  ) : (
    <span class={styles.statusUnknown}>—</span>
  )}
</div>
```

**Critical Detail:** Call `status()` as a function (reactive access), not `status` directly.

### 4. Styling (pageLayout.module.css)

**Badge Containers:**
```css
.statusBadge {
  display: flex;
  align-items: center;
  justify-content: center;
}

.runningBadge {
  background-color: #4caf50;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.offlineBadge {
  background-color: #f44336;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.statusUnknown {
  color: #999;
  font-size: 16px;
}
```

**Status Cell Padding:**
```css
.statusCell {
  padding: 12px 16px 12px 10px;
  text-align: left;
  width: 100px;
}

.linksTable th:first-child {
  padding: 12px 16px 12px 10px;
}
```

The 10px left padding prevents badges from expanding the entire cell width.

## Auto-Refresh Mechanism

```typescript
createEffect(() => {
  checkEndpointHealth(); // Initial check on mount
  
  const interval = setInterval(() => {
    checkEndpointHealth(); // Refresh every 5 minutes
  }, 5 * 60 * 1000);
  
  onCleanup(() => clearInterval(interval));
});
```

## Key Learnings

### 1. Solid.js Reactivity Requirements

- **Use Plain Objects:** Records/objects track better than Map in Solid signals
- **Use createMemo:** Wrap derived values (like `endpointStatus()[id]`) in `createMemo` for proper tracking
- **Trigger Updates:** Use spread operator when setting signals: `setEndpointStatus({...obj})`
- **Call as Functions:** Access memoized values with `()`: `status()`, not `status`

### 2. Data Ordering

When displaying endpoints in groups, sort by the `sortOrder` field from the database to maintain consistent UI order across sessions.

### 3. Error Handling

- Show `—` (unknown) badge when `endpointStatus()[id]` is undefined
- This handles initial load state before first health check completes
- Prevents console errors from accessing undefined properties

### 4. Authentication

All API requests require JWT token in Authorization header:
```typescript
headers: {
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json'
}
```

## Component Dependencies

**Imports:**
```typescript
import { createSignal, createEffect, createMemo, For, Show, onCleanup } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../services/authService';
import { getAuthToken } from '../services/authService';
import styles from './pageLayout.module.css';
```

**API Endpoints:**
- `GET /api/endpoint-groups` → Fetch all groups
- `GET /api/endpoints` → Fetch all endpoints
- `POST /api/health-check/manual` → Trigger health checks
- `POST /api/endpoints/{id}/toggle` → Toggle endpoint active status
- `DELETE /api/endpoints/{id}` → Delete endpoint
- `PUT /api/endpoints/{id}` → Update endpoint
- `POST /api/endpoints` → Create endpoint

## Troubleshooting

### Badges Show "—" Even After Health Checks

**Check:**
1. Verify API returns results with matching IDs
2. Confirm signal update includes all results: `console.log(endpointStatus())`
3. Ensure `createMemo` wrapper is present in JSX
4. Verify signal access uses `status()` as function

### Health Check Button Doesn't Work

**Check:**
1. Verify vite-plugin-solid version is 2.11.14+ (earlier versions had onClick bug)
2. Check browser console for fetch errors
3. Confirm JWT token is present: `getAuthToken()` should return non-empty string

### Rows Don't Update When New Health Check Results Arrive

**Check:**
1. Confirm using `Record<string, EndpointStatus>`, not `Map`
2. Verify spread operator: `setEndpointStatus({...statusObj})`
3. Add temporary `console.log` in `checkEndpointHealth` to verify API response structure

## File Locations

- **Component:** `/apps/health-monitor/src/pages/HealthStatusPage.tsx`
- **Styles:** `/apps/health-monitor/src/styles/pageLayout.module.css`
- **Services:** `/apps/health-monitor/src/services/authService.ts`
- **Backend Health Check:** `/apps/health-monitor/src/health-check/health-check.service.ts`

## Summary

The Health Status Page demonstrates essential Solid.js patterns for real-time data display:
1. **Plain objects** over Map for signal reactivity
2. **createMemo** for derived values
3. **Proper update triggering** with spread operators
4. **Function calls** to access reactive values in JSX

The badge implementation specifically required fixing the Solid.js reactivity model rather than changing UI logic—a common pitfall when transitioning from other frameworks.
