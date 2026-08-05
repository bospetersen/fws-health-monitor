# FWS Health Monitor

Comprehensive health monitoring service for FWS infrastructure with real-time dashboard. Monitors endpoint availability, response times, and maintains complete audit logs in MongoDB Atlas.

## Features

### Backend
- 🏥 Real-time endpoint health checks (5-minute intervals)
- 📊 Complete audit history stored in MongoDB Atlas
- ⚙️ Dynamic check interval configuration via API
- 🔌 Full REST API for management
- 📈 Response time tracking and statistics
- 🎯 Scalable Turbo monorepo structure

### Frontend Dashboard
- 📊 Live health status dashboard with green/red status badges
- 🎯 Endpoint grouping and organization
- 🔄 Manual refresh and auto-refresh every 5 minutes
- 🔐 JWT authentication with secure session management
- 📱 Responsive full-width layout
- 🎨 Clean, modern UI with Solid.js

## Tech Stack

### Backend
- **Framework**: NestJS 11+
- **Database**: MongoDB Atlas
- **ORM**: Mongoose
- **Authentication**: JWT
- **Runtime**: Node.js 18+

### Frontend
- **Framework**: Solid.js 1.9.14
- **Build Tool**: Vite 5.4.21
- **Styling**: CSS Modules
- **Router**: @solidjs/router
- **API Client**: Fetch API

### DevOps
- **Package Manager**: pnpm 8+
- **Monorepo**: Turbo
- **Proxy**: Vite proxy to backend

## Project Structure

```
fws-health-monitor/
├── apps/
│   ├── health-monitor/                 # Backend NestJS API
│   │   ├── src/
│   │   │   ├── health-check/          # Health check service & scheduler
│   │   │   ├── intervals/             # Check interval management
│   │   │   ├── database/              # MongoDB configuration
│   │   │   ├── app.module.ts
│   │   │   ├── app.controller.ts
│   │   │   └── main.ts
│   │   ├── package.json
│   │   └── README.md
│   └── health_monitor_ui/              # Frontend Solid.js Dashboard
│       ├── src/
│       │   ├── pages/                 # Page components
│       │   │   └── HealthStatusPage.tsx
│       │   ├── components/            # Reusable components
│       │   ├── services/              # API & auth services
│       │   ├── styles/                # CSS modules
│       │   └── App.tsx
│       ├── vite.config.ts
│       └── package.json
├── docs/                                # Documentation
│   ├── HEALTH_STATUS_PAGE_SETUP.md    # Frontend setup guide
│   └── (additional guides)
├── turbo.json
├── pnpm-workspace.yaml
├── README.md
└── SETUP.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- MongoDB Atlas account

### Installation

```bash
# Install dependencies
pnpm install

# Configure environment variables
cp apps/health-monitor/.env.example apps/health-monitor/.env
```

### Environment Variables

See `apps/health-monitor/.env.example` for all required variables:

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/health-monitor
PORT=3400
NODE_ENV=development
CHECK_INTERVAL=300000
```

### Development

```bash
# Start all apps (backend on 3400, frontend on 3401)
pnpm dev

# Start specific app
cd apps/health-monitor && pnpm dev              # Backend only
cd apps/health_monitor_ui && pnpm dev           # Frontend only
```

**Access:**
- Frontend Dashboard: http://localhost:3401
- Backend API: http://localhost:3400
- API Docs (Swagger): http://localhost:3400/api

### Production Build

```bash
# Build all apps
pnpm build

# Build specific app
cd apps/health-monitor && pnpm build
cd apps/health_monitor_ui && pnpm build

# Start backend
cd apps/health-monitor && pnpm start:prod

# Serve frontend (requires separate server or CDN)
cd apps/health_monitor_ui && pnpm start
```

## API Endpoints

### Health Checks

- `GET /api/health-check` - Get recent health check results
- `POST /api/health-check/manual` - Trigger manual health check for all endpoints

### Endpoints Management

- `GET /api/endpoints` - List all monitored endpoints
- `POST /api/endpoints` - Add new endpoint to monitor
- `PUT /api/endpoints/:id` - Update endpoint
- `DELETE /api/endpoints/:id` - Remove endpoint from monitoring
- `POST /api/endpoints/:id/toggle` - Toggle endpoint active status

### Endpoint Groups

- `GET /api/endpoint-groups` - List all groups
- `POST /api/endpoint-groups` - Create group
- `PUT /api/endpoint-groups/:id` - Update group
- `DELETE /api/endpoint-groups/:id` - Delete group

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/verify` - Verify JWT token

### Status

- `GET /health` - Service health check

## Deployment

### Frontend
Deploy `apps/health_monitor_ui/dist/` to static hosting (GitHub Pages, Netlify, Vercel, S3+CloudFront)

### Backend
Deploy `apps/health-monitor/` to Docker, Kubernetes, VM, or cloud provider (AWS, Google Cloud, Azure)

See [SETUP.md](./SETUP.md#deployment) for detailed deployment instructions.

## Documentation

### Getting Started
- [SETUP.md](./SETUP.md) - Complete setup guide for both backend and frontend
- [README.md](./README.md) - Project overview and features

### Detailed Guides
- [docs/HEALTH_STATUS_PAGE_SETUP.md](./docs/HEALTH_STATUS_PAGE_SETUP.md) - Frontend dashboard implementation, data flow, and badge patterns
- [docs/FRONTEND_SETUP.md](./docs/FRONTEND_SETUP.md) - Frontend architecture, Solid.js patterns, styling, and development workflow
- [apps/health-monitor/README.md](./apps/health-monitor/README.md) - Backend NestJS API documentation

## License

UNLICENSED
