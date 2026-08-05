# Frontend Setup & Architecture Guide

Comprehensive guide to the Health Monitor UI built with Solid.js, Vite, and CSS Modules.

## Technology Stack

- **Framework**: Solid.js 1.9.14
  - Signal-based reactive system
  - No virtual DOM - direct DOM updates
  - Fine-grained reactivity
  - JSX preservation mode
- **Build Tool**: Vite 5.4.21
  - Fast dev server with HMR
  - Proxy configuration for API
  - Optimized production builds
- **Styling**: CSS Modules
  - Scoped component styles
  - No style conflicts
  - Built-in by Vite
- **Routing**: @solidjs/router
  - Client-side navigation
  - Route guards with authentication
- **API Client**: Fetch API with custom service layer

## Project Structure

```
apps/health_monitor_ui/
├── src/
│   ├── pages/
│   │   └── HealthStatusPage.tsx        # Main dashboard page
│   ├── components/                     # Reusable UI components
│   ├── services/
│   │   ├── authService.ts              # Authentication & JWT management
│   │   └── apiService.ts               # HTTP API communication
│   ├── styles/
│   │   ├── pageLayout.module.css       # Page and dashboard styles
│   │   └── [component].module.css      # Component-specific styles
│   ├── App.tsx                         # Root component with routing
│   └── main.tsx                        # Entry point
├── vite.config.ts                      # Vite configuration with API proxy
├── index.html                          # HTML template
├── package.json                        # Dependencies
└── tsconfig.json                       # TypeScript configuration
```

## Getting Started

### Installation

```bash
cd apps/health_monitor_ui
pnpm install
```

### Configuration

Create `.env` file:
```env
VITE_API_URL=http://localhost:3400/api
VITE_APP_NAME=Health Monitor
```

### Development Server

```bash
pnpm dev
```

Server starts on: `http://localhost:3401`

Features:
- Hot Module Replacement (HMR)
- Vite proxy automatically routes `/api` requests to backend
- CSS Modules with scoped names

### Production Build

```bash
pnpm build
```

Output: `dist/` folder with optimized static files

## Authentication Flow

### JWT Token Management

The `authService.ts` handles all authentication:

```typescript
// Login
const result = await loginUser(email, password);
if (result.access_token) {
  setJwtToken(result.access_token);  // Stores in localStorage + sessionStorage
}

// Get stored token
const token = getAuthToken();

// Verify session
const isValid = await verifySession();

// Logout
logoutUser();  // Clears token storage
```

**Critical Pattern:** Always use `setJwtToken()` not direct assignment:
```typescript
// ✅ CORRECT - Persists to localStorage AND sessionStorage
setJwtToken(token);

// ❌ WRONG - Only in memory, lost on reload
jwtToken = token;
```

### Token Persistence

Tokens are stored in:
1. **localStorage** - Persists across browser sessions
2. **sessionStorage** - Cleared when tab closes
3. **Memory (signal)** - For current session state

This dual storage ensures:
- Token survives page reload
- Token survives dev server restart
- Token clears when browser closes (security)

### API Request Headers

All authenticated requests include:
```typescript
headers: {
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json'
}
```

## Solid.js Patterns

### 1. Signals (State Management)

```typescript
const [endpointStatus, setEndpointStatus] = createSignal<Record<string, EndpointStatus>>({});

// Access value - triggers reactivity tracking
const status = endpointStatus();

// Update value
setEndpointStatus({...newStatus});
```

**Key Pattern:** Use spread operator `{...obj}` when updating objects so Solid.js detects the change.

### 2. Memos (Derived Values)

```typescript
// Wrap derived values in createMemo for proper reactivity
const status = createMemo(() => endpointStatus()[endpoint._id]);

// Access as function
<Show when={status()?.status === 'online'}>
  <span>Running</span>
</Show>
```

### 3. Effects (Side Effects)

```typescript
createEffect(() => {
  // Runs when dependencies change
  checkEndpointHealth();
  
  // Cleanup on unmount
  onCleanup(() => clearInterval(interval));
});
```

### 4. Conditional Rendering

```typescript
// Show/Hide component
<Show when={isLoading()}>
  <span>Loading...</span>
</Show>

// Ternary in JSX (Solid.js optimized)
{status()?.status === 'online' ? (
  <span class={styles.runningBadge}>Running</span>
) : (
  <span class={styles.offlineBadge}>Offline</span>
)}
```

### 5. List Rendering

```typescript
<For each={endpoints()}>
  {(endpoint) => (
    <div class={styles.endpointRow}>
      {endpoint.name}
    </div>
  )}
</For>
```

**Important:** Don't use `.map()` in JSX - use `<For>` component for proper reactivity and performance.

## CSS Modules

### Naming Convention

```css
/* pageLayout.module.css */
.pageContent {
  width: 100%;
  margin: 0;
  padding: 0 20px;
}

.statusCell {
  padding: 12px 16px 12px 10px;
  text-align: left;
}

.runningBadge {
  background-color: #4caf50;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
```

### Import & Usage

```typescript
import styles from './pageLayout.module.css';

export default () => (
  <div class={styles.pageContent}>
    <span class={styles.runningBadge}>Running</span>
  </div>
);
```

### Inline Styles in Solid.js

**Important:** Use quoted CSS property names, NOT camelCase:

```typescript
// ✅ CORRECT - Quoted CSS property names
<div style={{"margin-left": "10px", "border-radius": "4px"}}>

// ❌ WRONG - camelCase doesn't work in Solid.js
<div style={{marginLeft: "10px", borderRadius: "4px"}}>
```

## Health Status Page Implementation

### Data Flow

```
Component Mount
  ↓
loadData() → Fetch /api/endpoints + /api/endpoint-groups
  ↓
Render groups and endpoints
  ↓
checkEndpointHealth() → POST /api/health-check/manual
  ↓
Update endpointStatus signal with results
  ↓
Solid.js reactivity triggers re-renders
  ↓
Status badges display green/red based on status
```

### Key Functions

**loadData()**
- Fetches endpoint groups and endpoints
- Runs on component mount
- Populates endpoints signal

**checkEndpointHealth()**
- POSTs to `/api/health-check/manual`
- Updates `endpointStatus` Record signal
- Called on mount and every 5 minutes

**getStatusForEndpoint(endpointId)**
- Returns `endpointStatus()[endpointId]`
- Wrapped in createMemo for reactivity

**handleCopyUrl(url)**
- Copies URL to clipboard
- Shows "✓ Copied" feedback for 2 seconds

### Signal Structure

```typescript
// Endpoints from database
const [endpoints, setEndpoints] = createSignal<Endpoint[]>([]);

// Endpoint groups for organization
const [groups, setGroups] = createSignal<EndpointGroup[]>([]);

// Health check results - MUST be Record, not Map
const [endpointStatus, setEndpointStatus] = createSignal<
  Record<string, EndpointStatus>
>({});

// UI state
const [isLoading, setIsLoading] = createSignal(false);
const [copiedUrl, setCopiedUrl] = createSignal<string | null>(null);
const [hoveredEndpointId, setHoveredEndpointId] = createSignal<string | null>(null);
```

### Critical Fix: Record vs Map

**Why Record instead of Map?**

Solid.js tracks plain object mutations, but NOT Map mutations:

```typescript
// ❌ WRONG - Map mutations not tracked by Solid.js
const statusMap = new Map();
statusMap.set('id', {status: 'online'});
setEndpointStatus(statusMap);  // No re-render!

// ✅ CORRECT - Object mutations tracked
const statusObj = {};
statusObj['id'] = {status: 'online'};
setEndpointStatus({...statusObj});  // Triggers re-render!
```

Always use:
1. Plain object (Record type)
2. Spread operator when updating: `{...obj}`
3. Wrapped lookups in createMemo

## API Integration

### Environment-Based URLs

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3400/api';

// Use in fetch calls
const response = await fetch(`${API_URL}/endpoints`);
```

### API Endpoints Used

**Dashboard:**
- `GET /api/endpoint-groups` → All groups with sorting
- `GET /api/endpoints` → All endpoints
- `POST /api/health-check/manual` → Trigger health checks
- `POST /api/endpoints/:id/toggle` → Enable/disable endpoint
- `DELETE /api/endpoints/:id` → Delete endpoint
- `PUT /api/endpoints/:id` → Update endpoint

**Authentication:**
- `POST /api/auth/login` → User login
- `POST /api/auth/signup` → User registration
- `GET /api/auth/verify` → Verify token validity

## Styling Standards

### Font Sizes

- **Body text**: 16px minimum (accessibility standard)
- **Secondary text** (timestamps, labels): 12-14px
- **Headers**: 18-24px
- **Badges**: 12px

### Color Palette

- **Running (Online)**: `#4caf50` (green)
- **Offline**: `#f44336` (red)
- **Unknown/Loading**: `#999` (gray)
- **Background (offline rows)**: `#ffebee` (light red)

### Spacing

- **Container padding**: 20px left/right (full-width layout)
- **Status cell left padding**: 10px
- **Badge padding**: 6px vertical, 12px horizontal
- **Component gaps**: 12-16px

### Responsive Design

Current implementation uses:
- Full-width layout with fixed side padding
- Fixed column widths where needed (status: 100px)
- Overflow handling for long URLs

## Common Issues & Solutions

### Issue: Status badges always show "—"

**Cause:** Using Map instead of Record for endpointStatus signal
**Solution:** 
```typescript
// Change from Map to Record
const [endpointStatus, setEndpointStatus] = 
  createSignal<Record<string, EndpointStatus>>({});

// Update with spread operator
setEndpointStatus({...statusObj});

// Wrap lookups in createMemo
const status = createMemo(() => endpointStatus()[endpoint._id]);
```

### Issue: onClick handlers not working

**Cause:** vite-plugin-solid version < 2.0 (bug in 0.5.0)
**Solution:** Upgrade vite-plugin-solid to 2.11.14+

### Issue: Authentication lost on page reload

**Cause:** Using direct signal assignment instead of setJwtToken()
**Solution:**
```typescript
// Use setJwtToken for persistence
if (result.access_token) {
  setJwtToken(result.access_token);
}
```

### Issue: Styles not applying

**Cause:** CSS Modules not imported correctly
**Solution:**
```typescript
// Import CSS module
import styles from './MyComponent.module.css';

// Use in JSX
<div class={styles.myClass}>Content</div>
```

## Performance Optimization

### Memoization for Expensive Computations

```typescript
// Sort and filter only when dependencies change
const filteredEndpoints = createMemo(() => 
  endpoints()
    .filter(e => e.groupId === selectedGroup())
    .sort((a, b) => a.sortOrder - b.sortOrder)
);
```

### Conditional Effects

```typescript
// Only run when isLoading changes to false
createEffect(() => {
  if (!isLoading()) {
    console.log('Health check complete');
  }
});
```

### Resource Cleanup

```typescript
createEffect(() => {
  const interval = setInterval(() => {
    checkEndpointHealth();
  }, 5 * 60 * 1000);
  
  // Critical: Clean up interval on unmount
  onCleanup(() => clearInterval(interval));
});
```

## Development Workflow

### Running with Hot Reload

```bash
pnpm dev
```

- Saves files and see changes instantly (HMR)
- Preserves component state during reload
- API proxy handles backend calls

### Debugging

1. **Browser DevTools**: F12 or Ctrl+Shift+I
2. **Console**: Check for JavaScript errors
3. **Network Tab**: Inspect API requests/responses
4. **Application Tab**: Check localStorage/sessionStorage for JWT token

### Building for Production

```bash
pnpm build
```

Output goes to `dist/` folder:
- Minified JS bundle
- Optimized CSS
- Hashed filenames for cache busting

## Deployment

### Static Hosting (Recommended)

Deploy `dist/` folder to:
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static web server

### Environment Configuration

Update `.env` for production:
```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=FWS Health Monitor
```

### Server Configuration

For routing-based deployments, configure server to serve `index.html` for all routes (SPA routing).

**Nginx example:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Resources

- [Solid.js Documentation](https://docs.solidjs.com/)
- [Vite Documentation](https://vitejs.dev/)
- [@solidjs/router](https://docs.solidjs.com/guides/how-to-guides/routing)
- [CSS Modules](https://github.com/css-modules/css-modules)

## Related Documentation

- [Health Status Page Setup](./HEALTH_STATUS_PAGE_SETUP.md) - Data flow and badge implementation
- [Main Setup Guide](../SETUP.md) - Full project setup
- [Backend API](../apps/health-monitor/README.md) - API endpoint reference
