# System Architecture

## Overview

FWS Health Monitor is built as a monorepo using Turbo, with clear separation between backend (NestJS) and frontend (Solid.js) applications. The system follows a client-server architecture with JWT-based authentication.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (User)                          │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Solid.js Frontend UI                       │
│  (Port 3401, Vite Dev Server)                              │
│                                                              │
│  ├─ LoginPage (Authentication)                             │
│  ├─ HealthStatusPage (Dashboard)                           │
│  ├─ ManageEndpointsPage (CRUD Operations)                  │
│  └─ AuthService (State Management)                         │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ REST API Calls
                             │ JWT Authorization
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                NestJS Backend API                           │
│  (Port 3400, Express Adapter)                              │
│                                                              │
│  ├─ Auth Controller & Service                              │
│  │  └─ Login endpoint, JWT generation                      │
│  │                                                           │
│  ├─ Endpoint Groups Controller & Service                   │
│  │  └─ CRUD operations on endpoint groups                  │
│  │  └─ Reorder, toggle active status                       │
│  │                                                           │
│  ├─ Endpoints Controller & Service                         │
│  │  └─ CRUD operations on endpoints                        │
│  │  └─ Reorder endpoints                                   │
│  │                                                           │
│  ├─ Health Check Controller & Service                      │
│  │  └─ Perform health checks                               │
│  │  └─ Store results                                       │
│  │                                                           │
│  └─ Intervals Module                                       │
│     └─ Scheduled health checks                             │
│                                                              │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ Mongoose ODM
                             │ MongoDB Protocol
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  MongoDB Atlas Database                     │
│                                                              │
│  ├─ users collection                                       │
│  ├─ endpoint_groups collection                             │
│  ├─ endpoints collection                                   │
│  └─ health_check_results collection                        │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend (Solid.js)

**Technology Stack:**
- Solid.js 1.8.13 (Reactive UI framework)
- TypeScript 5.3.3
- Vite 5.4.21 (Development server)
- @solidjs/router 0.14.0 (Routing)

**Key Components:**

1. **App.tsx** - Root component with routing
   - Sets up route definitions
   - Configures ProtectedRoute wrapper
   - Handles navigation

2. **ProtectedRoute.tsx** - Authentication guard
   - Checks if user is authenticated
   - Redirects to login if not authenticated
   - Uses Solid.js Show component for conditional rendering

3. **LoginPage.tsx** - User authentication
   - Form submission for credentials
   - JWT token management
   - User object persistence
   - Redirect to dashboard on successful login

4. **HealthStatusPage.tsx** - Dashboard
   - Displays system health overview
   - Shows endpoint status summaries
   - Logout functionality

5. **ManageEndpointsPage.tsx** - Endpoint management
   - Create/read/update/delete endpoint groups
   - Create/read/update/delete endpoints
   - Reorder groups and endpoints
   - Toggle group active status
   - Form-based UI with uncontrolled inputs

**Authentication Flow:**
```
User Input → LoginPage.tsx
    ↓
POST /api/auth/login
    ↓
API Response (JWT + User)
    ↓
setJwtToken() & setUser() → authService signals
    ↓
Token persisted to localStorage & sessionStorage
    ↓
Redirect to /system/health
```

**State Management:**
- Uses Solid.js signals (createSignal) at module scope
- Auth state shared across components via useAuth() hook
- No Redux/external state manager needed
- Signals are reactive - changes automatically trigger re-renders

### Backend (NestJS)

**Technology Stack:**
- NestJS 11.1.28 (TypeScript framework)
- Express 4.x (HTTP adapter)
- Mongoose 8.16.5 (MongoDB ODM)
- jsonwebtoken 9.0.0 (JWT generation)
- bcrypt 5.1.1 (Password hashing)

**Module Structure:**

```
src/
├── main.ts                    # Application bootstrap
├── app.module.ts              # Root module
├── app.controller.ts          # Root routes
├── app.service.ts             # Root service
│
├── auth/                      # Authentication module
│   ├── auth.controller.ts     # POST /api/auth/login
│   ├── auth.service.ts        # JWT generation, password validation
│   └── jwt.strategy.ts        # JWT authentication guard
│
├── endpoint-groups/           # Endpoint groups module
│   ├── endpoint-groups.controller.ts
│   │   ├── POST /api/endpoint-groups (create)
│   │   ├── GET /api/endpoint-groups (list)
│   │   ├── PUT /api/endpoint-groups/{id}/toggle-active (toggle)
│   │   ├── DELETE /api/endpoint-groups/{id} (delete)
│   │   └── POST /api/endpoint-groups/reorder (reorder)
│   ├── endpoint-groups.service.ts
│   ├── endpoint-groups.module.ts
│   ├── schemas/
│   │   └── endpoint-group.schema.ts
│   └── dto/
│       └── create-endpoint-group.dto.ts
│
├── endpoints/                 # Endpoints module
│   ├── endpoints.controller.ts
│   │   ├── POST /api/endpoints (create)
│   │   ├── GET /api/endpoints (list)
│   │   ├── DELETE /api/endpoints/{id} (delete)
│   │   └── PUT /api/endpoints/reorder (reorder)
│   ├── endpoints.service.ts
│   ├── endpoints.module.ts
│   ├── schemas/
│   │   └── endpoint.schema.ts
│   └── dto/
│       └── create-endpoint.dto.ts
│
├── health-check/              # Health checking module
│   ├── health-check.controller.ts
│   ├── health-check.service.ts
│   ├── health-check.scheduler.ts (Cron jobs)
│   ├── health-check.module.ts
│   ├── schemas/
│   │   └── health-check-result.schema.ts
│   └── dto/
│       └── create-health-check-result.dto.ts
│
└── database/                  # Database module
    └── database.module.ts     # MongoDB connection
```

**API Endpoints:**

**Authentication:**
- `POST /api/auth/login` - Login with username/password → JWT token

**Endpoint Groups:**
- `POST /api/endpoint-groups` - Create new group
- `GET /api/endpoint-groups` - List all groups
- `PUT /api/endpoint-groups/{id}/toggle-active` - Toggle active status
- `DELETE /api/endpoint-groups/{id}` - Delete group
- `POST /api/endpoint-groups/reorder` - Reorder groups

**Endpoints:**
- `POST /api/endpoints` - Create new endpoint
- `GET /api/endpoints` - List all endpoints
- `DELETE /api/endpoints/{id}` - Delete endpoint
- `PUT /api/endpoints/reorder` - Reorder endpoints

**Health Checks:**
- `GET /api/health-check/:endpointId` - Check single endpoint
- `GET /api/health-check/results/:endpointId` - Get endpoint history

### Database (MongoDB)

**Collections:**

1. **users**
   ```typescript
   {
     _id: ObjectId,
     username: String,
     email: String,
     passwordHash: String,
     createdAt: Date,
     updatedAt: Date
   }
   ```

2. **endpoint_groups**
   ```typescript
   {
     _id: ObjectId,
     name: String,
     sortOrder: Number,
     active: Boolean,
     createdAt: Date,
     updatedAt: Date
   }
   ```

3. **endpoints**
   ```typescript
   {
     _id: ObjectId,
     name: String,
     url: String,
     description: String,
     groupId: ObjectId (ref: endpoint_groups),
     sortOrder: Number,
     active: Boolean,
     createdAt: Date,
     updatedAt: Date
   }
   ```

4. **health_check_results**
   ```typescript
   {
     _id: ObjectId,
     endpointId: ObjectId (ref: endpoints),
     status: String (healthy|unhealthy),
     statusCode: Number,
     responseTime: Number,
     errorMessage: String,
     checkedAt: Date,
     createdAt: Date
   }
   ```

## Data Flow

### Creating an Endpoint Group

```
User (ManageEndpointsPage)
  │
  ├─ Fills in group name
  │
  ├─ Clicks "Create Group" button
  │
  └─ Form submission → handleAddGroup()
       │
       ├─ POST /api/endpoint-groups
       │   {
       │     name: "Production APIs",
       │     sortOrder: nextOrder,
       │     active: true
       │   }
       │
       └─ NestJS API
            │
            ├─ EndpointGroupsController
            │
            ├─ EndpointGroupsService
            │  └─ Creates document with Mongoose
            │
            ├─ MongoDB
            │  └─ Stores in endpoint_groups collection
            │
            └─ Response: { _id, name, sortOrder, active }
                 │
                 └─ Updates groups signal in frontend
                      │
                      └─ UI re-renders with new group
```

### Creating an Endpoint

```
User (ManageEndpointsPage)
  │
  ├─ Selects group from dropdown
  │
  ├─ Fills in endpoint details
  │  ├─ Name: "API Status"
  │  ├─ URL: "https://api.example.com/status"
  │  └─ Description: "Main API health check"
  │
  ├─ Clicks "Add Endpoint" button
  │
  └─ Form submission → handleAddEndpoint()
       │
       ├─ POST /api/endpoints
       │   {
       │     name: "API Status",
       │     url: "https://api.example.com/status",
       │     description: "Main API health check",
       │     groupId: "group-id-here",
       │     active: true
       │   }
       │
       └─ NestJS API
            │
            ├─ EndpointsController
            │
            ├─ EndpointsService
            │  └─ Creates document with Mongoose
            │
            ├─ MongoDB
            │  └─ Stores in endpoints collection
            │
            └─ Response: { _id, name, url, groupId, ... }
                 │
                 └─ Updates endpoints signal in frontend
                      │
                      └─ UI displays endpoint in group
```

### Checking Endpoint Health

```
Scheduler (health-check.scheduler.ts)
  │
  ├─ Runs on interval (configurable)
  │
  ├─ Gets all active endpoints
  │
  └─ For each endpoint:
       │
       ├─ Performs HTTP request to endpoint URL
       │
       ├─ Records result
       │  ├─ Status: healthy/unhealthy
       │  ├─ Response code
       │  ├─ Response time
       │  └─ Any errors
       │
       ├─ Stores in health_check_results collection
       │
       └─ Updates endpoint status
            │
            └─ Frontend can query latest results
```

## Authentication & Security

**JWT Token Flow:**

1. User submits credentials to LoginPage
2. POST /api/auth/login with username & password
3. Backend validates credentials against bcrypt hash
4. Backend generates JWT token (24-hour expiration)
5. Frontend stores token in:
   - localStorage (persistent)
   - sessionStorage (session-only)
6. Token included in Authorization header for all API requests
7. Backend verifies token with JWT guard
8. Token automatically cleared on logout

**Password Security:**

- Passwords hashed with bcrypt (10 salt rounds)
- Passwords never stored in plain text
- Password validation on login compares hash

## Request/Response Cycle

**Example: Login Request**

```
Frontend:
POST http://localhost:3400/api/auth/login
Content-Type: application/json
Body: { username: "admin", password: "password123" }

Backend:
1. AuthController receives request
2. AuthService validates credentials
3. Generate JWT token
4. Return response

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@example.com"
  }
}

Frontend:
1. Receive response
2. setJwtToken(access_token)
3. setUser(user)
4. Tokens persisted to storage
5. Navigate to /system/health
```

**Example: Create Endpoint Group Request**

```
Frontend:
POST http://localhost:3400/api/endpoint-groups
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
Body: {
  "name": "Production APIs",
  "sortOrder": 1,
  "active": true
}

Backend:
1. EndpointGroupsController receives request
2. JWT guard verifies token
3. ValidationPipe validates DTO
4. EndpointGroupsService creates document
5. MongoDB stores document

Response:
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Production APIs",
  "sortOrder": 1,
  "active": true,
  "createdAt": "2026-08-04T10:30:00Z",
  "updatedAt": "2026-08-04T10:30:00Z"
}

Frontend:
1. Receive response
2. Add to groups signal
3. UI updates to show new group
```

## Monorepo Structure (Turbo)

The project uses Turbo for:
- Optimized builds across packages
- Task caching to avoid redundant work
- Parallel execution of independent tasks
- Shared dependencies via pnpm workspaces

**Workspace Configuration:**
```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'

# turbo.json
{
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "outputs": ["dist/**", "build/**"],
      "cache": true
    }
  }
}
```

## Error Handling

**Frontend:**
- Try-catch blocks in async functions
- User-friendly error messages
- Errors displayed in UI alerts
- Console logging for debugging

**Backend:**
- Global exception filters
- Structured error responses
- HTTP status codes (400, 401, 403, 500)
- Validation errors from ValidationPipe

## Performance Considerations

1. **Frontend:**
   - Solid.js uses fine-grained reactivity (efficient re-renders)
   - Uncontrolled inputs avoid unnecessary updates
   - Signals only update when values change

2. **Backend:**
   - Mongoose indexes on frequently queried fields
   - Pagination for large result sets
   - Connection pooling with MongoDB

3. **Database:**
   - MongoDB Atlas auto-scaling
   - Indexes on _id, groupId, active status
   - TTL indexes on health check results (optional)

---

**Last Updated**: 2026-08-05
