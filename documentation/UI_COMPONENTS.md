# UI Components Guide

## Overview

This document describes all UI components in the FWS Health Monitor frontend, their purpose, and how to use them.

## Component Hierarchy

```
App.tsx (Root with routing)
  ├─ LoginPage
  ├─ ProtectedRoute
  │   ├─ HealthStatusPage
  │   └─ ManageEndpointsPage
  └─ Common components (reusable)
```

## Global Components

### App.tsx

**Purpose**: Root application component with routing setup

**Location**: `src/App.tsx`

**Functionality**:
- Defines all routes
- Sets up protected routes
- Main entry point for app

**Routes**:
- `/` → Redirect to `/system/health`
- `/login` → LoginPage
- `/system/health` → HealthStatusPage (protected)
- `/system/manage-endpoints` → ManageEndpointsPage (protected)

**Code Structure**:
```typescript
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" component={() => <Navigate href="/system/health" />} />
        <Route path="/login" component={LoginPage} />
        <Route 
          path="/system/health" 
          component={() => <ProtectedRoute component={HealthStatusPage} />} 
        />
        <Route 
          path="/system/manage-endpoints" 
          component={() => <ProtectedRoute component={ManageEndpointsPage} />} 
        />
      </Routes>
    </Router>
  );
}
```

---

## Page Components

### LoginPage.tsx

**Purpose**: User authentication page

**Location**: `src/components/pages/LoginPage.tsx`

**Features**:
- Username and password input form
- Form validation
- JWT token generation and storage
- Automatic redirect to dashboard on success
- Error message display

**State Management**:
- Uses uncontrolled inputs with refs
- No signals for form data

**Authentication Flow**:
```
User enters credentials
    ↓
Form submission (onsubmit)
    ↓
POST /api/auth/login
    ↓
Response: { access_token, user }
    ↓
setJwtToken(access_token)  [persists to storage]
setUser(user)
    ↓
window.location.href = '/system/health'
```

**Key Methods**:
- `handleLogin()` - Submits credentials to API
- `setJwtToken()` - Persists token to localStorage and sessionStorage
- `setUser()` - Stores user object in state

**Example Usage**:
- Direct navigation to `/login` takes user to this page
- Can't access protected routes without login

---

### HealthStatusPage.tsx

**Purpose**: Dashboard showing overall system health

**Location**: `src/components/pages/HealthStatusPage.tsx`

**Features**:
- Displays all endpoint groups
- Shows health status per group
- Summary statistics
- Navigation to manage endpoints
- Logout functionality

**State Management**:
```typescript
// Signals
const [groups, setGroups] = createSignal<EndpointGroup[]>([]);
const [endpoints, setEndpoints] = createSignal<Endpoint[]>([]);
const [healthStatus, setHealthStatus] = createSignal<Record<string, string>>({});
```

**Layout**:
```
┌─────────────────────────────────────────┐
│  FWS Health Monitor                     │
│  Dashboard showing endpoint health      │
├─────────────────────────────────────────┤
│  Manage Endpoints    Logout              │
├─────────────────────────────────────────┤
│                                         │
│  Group: Production APIs                 │
│  ├─ API Status       ✓ Healthy         │
│  ├─ Database Health  ✗ Unhealthy       │
│  └─ Cache Service    ✓ Healthy         │
│                                         │
│  Group: Staging APIs                    │
│  └─ Status Endpoint  ✓ Healthy         │
│                                         │
└─────────────────────────────────────────┘
```

**Key Methods**:
- `onMount()` - Loads groups and endpoints on page load
- `handleLogout()` - Clears auth and redirects to login
- `handleManageEndpoints()` - Navigates to management page

**Event Handlers**:
```typescript
// Logout uses form pattern
<form onsubmit={(e) => {
  e.preventDefault();
  handleLogout();
}}>
  <button type="submit">Logout</button>
</form>
```

---

### ManageEndpointsPage.tsx

**Purpose**: CRUD interface for endpoint groups and endpoints

**Location**: `src/components/pages/ManageEndpointsPage.tsx`

**Features**:
- View all endpoint groups
- Create new groups
- Create endpoints in groups
- Delete groups and endpoints
- Reorder groups and endpoints
- Toggle group active status
- Edit mode toggle

**State Management**:
```typescript
// Signals
const [editMode, setEditMode] = createSignal(false);
const [groups, setGroups] = createSignal<EndpointGroup[]>([]);
const [endpoints, setEndpoints] = createSignal<Endpoint[]>([]);
const [selectedGroupId, setSelectedGroupId] = createSignal<string | null>(null);
const [error, setError] = createSignal<string | null>(null);

// Input refs (uncontrolled)
let groupNameInputRef: HTMLInputElement | undefined;
let nameInputRef: HTMLInputElement | undefined;
let urlInputRef: HTMLInputElement | undefined;
let descInputRef: HTMLInputElement | undefined;
```

**Layout Structure**:

```
Edit Mode Button    Logout Button
│
├─ Add New Group Section (always visible in edit mode)
│  ├─ Group name input
│  ├─ Create Group button
│  └─ Clear button
│
├─ Add Endpoints Section (always visible in edit mode)
│  ├─ Group selector dropdown
│  ├─ Endpoint name input
│  ├─ URL input
│  ├─ Description input
│  ├─ Add Endpoint button
│  └─ Cancel button
│
└─ Groups List (view mode)
   ├─ Production APIs
   │  ├─ Endpoint 1 (name, URL, actions)
   │  └─ Endpoint 2
   │
   └─ Staging APIs
      └─ Endpoint 3
```

**Key Methods**:

**Group Management**:
- `handleAddGroup()` - POST new group
- `handleToggleGroup(id)` - Toggle active status
- `handleDeleteGroup(id)` - Delete group
- `moveGroup(id, direction)` - Reorder groups

**Endpoint Management**:
- `handleAddEndpoint()` - POST new endpoint
- `handleDeleteEndpoint(id)` - Delete endpoint
- `moveEndpoint(id, direction)` - Reorder endpoint

**Form Handling**:
- `clearForm()` - Reset all input refs

**Event Handlers**:

```typescript
// Create Group - Form pattern
<form onsubmit={(e) => {
  e.preventDefault();
  handleAddGroup();
}}>
  <input ref={groupNameInputRef} placeholder="Group name" />
  <button type="submit">Create Group</button>
</form>

// Group Selector - Select element
<select 
  value={selectedGroupId() || ''} 
  onchange={(e) => setSelectedGroupId(e.currentTarget.value || null)}
>
  <option value="">-- Select a group --</option>
  <For each={groups()}>
    {(group) => <option value={group._id}>{group.name}</option>}
  </For>
</select>

// Create Endpoint - Form pattern
<form onsubmit={(e) => {
  e.preventDefault();
  handleAddEndpoint();
}}>
  {/* inputs */}
  <button type="submit">Add Endpoint</button>
</form>

// Delete action - Form pattern
<form onsubmit={(e) => {
  e.preventDefault();
  handleDeleteEndpoint(endpoint._id);
}}>
  <button type="submit">Delete</button>
</form>
```

---

### ProtectedRoute.tsx

**Purpose**: Route guard component for authentication

**Location**: `src/components/ProtectedRoute.tsx`

**Functionality**:
- Checks if user is authenticated
- Redirects unauthenticated users to login
- Uses Solid.js Show component for conditional rendering

**Code**:
```typescript
import { Show } from 'solid-js';
import { Navigate } from '@solidjs/router';
import { useAuth } from '../services/authService';

export default function ProtectedRoute(props: { component: any }) {
  const auth = useAuth();
  
  return (
    <Show 
      when={auth.isAuthenticated()} 
      fallback={<Navigate href="/login" />}
    >
      <props.component />
    </Show>
  );
}
```

**Usage**:
```typescript
// In App.tsx
<Route 
  path="/system/health" 
  component={() => <ProtectedRoute component={HealthStatusPage} />}
/>
```

---

## Service Components

### authService.ts

**Purpose**: Centralized authentication state management

**Location**: `src/services/authService.ts`

**Key Features**:
- JWT token persistence
- User state management
- Authentication flow
- Token initialization on app load

**Exported Functions**:

```typescript
// Get auth state (call anywhere)
const auth = useAuth();

// Access signals
const isLoggedIn = auth.isAuthenticated();  // boolean
const currentUser = auth.user();             // User | null
const token = auth.token();                  // string | null

// Auth methods
auth.login(username, password)               // async
auth.logout()                                // void
```

**Internal Functions**:

```typescript
/**
 * Sets JWT token and persists to storage
 * @param token JWT token string
 */
function setJwtToken(token: string): void {
  localStorage.setItem('jwtToken', token);
  sessionStorage.setItem('jwtToken', token);
  setTokenState(token);
}

/**
 * Clears all auth data
 */
function clearAuth(): void {
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('user');
  sessionStorage.removeItem('jwtToken');
  sessionStorage.removeItem('user');
  setIsAuth(false);
  setUserState(null);
  setTokenState(null);
}

/**
 * Restores auth state from storage
 */
function initializeAuth(): void {
  const token = localStorage.getItem('jwtToken');
  const user = localStorage.getItem('user');
  if (token && user) {
    setTokenState(token);
    setUserState(JSON.parse(user));
    setIsAuth(true);
  }
}
```

**Data Structures**:

```typescript
interface User {
  _id: string;
  username: string;
  email: string;
}

interface LoginResponse {
  access_token: string;
  user: User;
}
```

---

## Styling Guidelines

### Inline Styles Pattern

Always use quoted CSS property names:

```typescript
// ✅ CORRECT
style={{
  "padding": "8px",
  "margin-bottom": "10px",
  "background-color": "#4CAF50",
  "border-radius": "4px",
  "font-size": "14px"
}}

// ❌ WRONG
style={{
  padding: "8px",
  marginBottom: "10px",
  backgroundColor: "#4CAF50"
}}
```

### Color Scheme

**Primary Colors**:
- Green (#4CAF50) - Healthy, success, create
- Red (#f44336) - Delete, error, unhealthy
- Blue (#2196F3) - Actions, reorder
- Gray (#999) - Disabled, secondary
- Dark Gray (#666) - Text
- Light Gray (#f5f5f5) - Backgrounds
- Very Light Gray (#ddd) - Borders
- Red bg (#ffebee) - Error message background

**Typography**:
- Base font size: 14px
- Inputs/buttons: 13-14px
- Headings: 16-20px (h1-h3)
- Minimum: 12px for secondary text

### Common Style Objects

```typescript
// Button styles
const buttonStyle = {
  "padding": "6px 12px",
  "background-color": "#4CAF50",
  "color": "white",
  "border": "none",
  "border-radius": "4px",
  "cursor": "pointer",
  "font-size": "13px"
};

// Input styles
const inputStyle = {
  "padding": "6px",
  "border": "1px solid #ddd",
  "border-radius": "4px",
  "width": "100%",
  "font-size": "13px"
};

// Error message
const errorStyle = {
  "color": "#d32f2f",
  "background-color": "#ffebee",
  "padding": "8px",
  "border-radius": "4px",
  "margin-bottom": "12px",
  "font-size": "14px"
};
```

---

## Form Patterns

### Create Group Form

```typescript
<form onsubmit={(e) => {
  e.preventDefault();
  const name = groupNameInputRef?.value || '';
  if (name.trim()) {
    handleAddGroup();
  }
}}>
  <input
    type="text"
    ref={groupNameInputRef}
    placeholder="Group name (e.g., Login Screens, API Documentation)"
    style={{ "padding": "6px", "border": "1px solid #ddd", "border-radius": "4px", "width": "100%" }}
  />
  <button type="submit">Create Group</button>
  <button type="button" onclick={() => {
    if (groupNameInputRef) groupNameInputRef.value = '';
  }}>
    Clear
  </button>
</form>
```

### Create Endpoint Form

```typescript
<form onsubmit={(e) => {
  e.preventDefault();
  handleAddEndpoint();
}}>
  <Show when={groups().length === 0}>
    <div style={errorStyle}>
      Please create a group first before adding endpoints
    </div>
  </Show>
  
  <select
    value={selectedGroupId() || ''}
    onchange={(e) => setSelectedGroupId(e.currentTarget.value || null)}
    disabled={groups().length === 0}
  >
    <option value="">-- Select a group --</option>
    <For each={groups()}>
      {(group) => <option value={group._id}>{group.name}</option>}
    </For>
  </select>
  
  <input ref={nameInputRef} type="text" placeholder="Endpoint name" />
  <input ref={urlInputRef} type="url" placeholder="URL (https://...)" />
  <input ref={descInputRef} type="text" placeholder="Description (optional)" />
  
  <button 
    type="submit"
    disabled={!selectedGroupId() || !nameInputRef?.value?.trim() || !urlInputRef?.value?.trim()}
  >
    Add Endpoint
  </button>
  <button type="button" onclick={clearForm}>Cancel</button>
</form>
```

---

## Common UI Patterns

### Displaying Lists

```typescript
<For each={items()}>
  {(item, index) => (
    <div key={item._id} style={{ "padding": "10px", "border-bottom": "1px solid #ddd" }}>
      <div>{item.name}</div>
      <div style={{ "font-size": "12px", "color": "#999" }}>
        #{index() + 1}
      </div>
    </div>
  )}
</For>
```

### Conditional Display

```typescript
// Option 1: Inline style (preferred for simple toggles)
<div style={{ "display": editMode() ? "block" : "none" }}>
  Content...
</div>

// Option 2: Show component (for async data)
<Show when={data()} fallback={<div>Loading...</div>}>
  {(data) => <div>{data.name}</div>}
</Show>
```

### Status Badges

```typescript
<span style={{
  "padding": "4px 8px",
  "background-color": status() === "healthy" ? "#4CAF50" : "#f44336",
  "color": "white",
  "border-radius": "4px",
  "font-size": "12px"
}}>
  {status() === "healthy" ? "Healthy" : "Unhealthy"}
</span>
```

---

## Component Communication

### Parent to Child

Pass data via component props:
```typescript
interface Props {
  group: EndpointGroup;
  onDelete: (id: string) => void;
}

export default function GroupItem(props: Props) {
  return (
    <div>
      <h3>{props.group.name}</h3>
      <button onclick={() => props.onDelete(props.group._id)}>
        Delete
      </button>
    </div>
  );
}
```

### Accessing Global State

Use service functions:
```typescript
const auth = useAuth();
const token = auth.token();  // Get current token
const user = auth.user();    // Get current user
```

---

## Error Handling in Components

### Try-Catch Pattern

```typescript
const handleSubmit = async () => {
  try {
    setError(null);
    const response = await fetch(...);
    if (!response.ok) {
      throw new Error(await response.text());
    }
    // Success handling
  } catch (err) {
    setError(err.message || 'Unknown error occurred');
  }
};
```

### Error Display

```typescript
<Show when={error()}>
  <div style={errorStyle}>{error()}</div>
</Show>
```

---

## Performance Tips

1. **Avoid unnecessary re-renders**
   - Use uncontrolled inputs
   - Use refs instead of signals for form data

2. **Batch state updates**
   - Group related state changes

3. **Efficient lists**
   - Always use `key` prop with For component
   - Don't create new data in render

4. **Code splitting**
   - Pages are lazy-loaded by router
   - Large components can be split

---

## Testing Components

### Manual Testing Checklist

- [ ] Can create endpoint group
- [ ] Can add endpoint to group
- [ ] Can delete endpoint
- [ ] Can delete group
- [ ] Can toggle edit mode
- [ ] Can logout
- [ ] Form validation works
- [ ] Error messages display
- [ ] Responsive on mobile
- [ ] No console errors

---

**Last Updated**: 2026-08-05
