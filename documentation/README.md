# FWS Health Monitor Documentation

Welcome to the FWS Health Monitor system documentation. This guide will help you understand how the system is built, how to set it up, and how to use it effectively.

## Quick Overview

FWS Health Monitor is a comprehensive health monitoring system that allows you to:
- Create and manage endpoint groups for organizing monitoring targets
- Add endpoints (URLs) to groups for monitoring
- Automatically check health status of endpoints
- View real-time health status dashboard
- Manage system configuration through an intuitive UI

## System Architecture

The system is built using a **monorepo structure** with:
- **Backend**: NestJS API (TypeScript) on port 3400
- **Frontend**: Solid.js UI (TypeScript/JSX) on port 3401
- **Database**: MongoDB Atlas with Mongoose ODM
- **Build Tool**: Turbo for monorepo management
- **Package Manager**: pnpm for workspace dependency management

## Documentation Contents

1. **[System Architecture](./ARCHITECTURE.md)** - Deep dive into how components interact
2. **[Setup & Installation](./SETUP.md)** - How to get the system running
3. **[API Reference](./API.md)** - Complete endpoint documentation
4. **[UI Components](./UI_COMPONENTS.md)** - Frontend component guide
5. **[Database Schema](./DATABASE_SCHEMA.md)** - Data models and relationships
6. **[Development Guide](./DEVELOPMENT_GUIDE.md)** - Patterns and best practices

## Key Features

### Authentication
- JWT-based authentication with 24-hour token expiration
- Secure password hashing with bcrypt
- Token persistence in localStorage and sessionStorage

### Endpoint Management
- Create and organize endpoints into groups
- Edit endpoint configurations (name, URL, description)
- Delete endpoints and groups
- Reorder endpoints and groups
- Toggle group active/inactive status

### Health Monitoring
- Automated health checks on configured endpoints
- Status tracking (healthy/unhealthy)
- Historical health check results
- Real-time status dashboard

### User Interface
- Clean, intuitive dashboard
- Responsive design
- Form-based interactions
- Real-time updates

## Project Structure

```
fws-health-monitor/
├── apps/
│   ├── health-monitor/          # NestJS Backend API
│   │   ├── src/
│   │   │   ├── app.controller.ts
│   │   │   ├── app.module.ts
│   │   │   ├── database/
│   │   │   ├── health-check/
│   │   │   ├── intervals/
│   │   │   └── main.ts
│   │   └── package.json
│   └── health_monitor_ui/       # Solid.js Frontend
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/
│       │   ├── pages/
│       │   ├── services/
│       │   └── styles/
│       └── package.json
├── documentation/                # System documentation
├── package.json                  # Root workspace config
└── pnpm-workspace.yaml          # Workspace definition
```

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- MongoDB Atlas account

### Running the System

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start the API** (in one terminal)
   ```bash
   cd apps/health-monitor
   pnpm dev
   ```

3. **Start the UI** (in another terminal)
   ```bash
   cd apps/health_monitor_ui
   pnpm dev
   ```

4. **Access the application**
   - UI: http://localhost:3401
   - API: http://localhost:3400/api

## First Steps

1. Open http://localhost:3401 in your browser
2. Log in with your credentials
3. Navigate to "Manage Endpoints"
4. Create your first endpoint group (e.g., "Production APIs")
5. Add endpoints to the group
6. View health status on the dashboard

## Troubleshooting

### Common Issues

**API not starting**
- Check MongoDB connection string in `.env`
- Ensure MongoDB Atlas network access includes your IP

**UI not connecting to API**
- Verify API is running on port 3400
- Check CORS settings in NestJS configuration
- Clear browser cache and localStorage

**Authentication issues**
- Clear browser cookies and localStorage
- Check token expiration (24 hours)
- Verify password requirements

## Support & Development

For more detailed information, see:
- [Development Guide](./DEVELOPMENT_GUIDE.md) - Development patterns and conventions
- [API Reference](./API.md) - Complete API documentation
- [System Architecture](./ARCHITECTURE.md) - Technical deep dive

---

**Last Updated**: 2026-08-05
**Version**: 1.0.0
