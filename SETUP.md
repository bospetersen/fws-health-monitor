# FWS Health Monitor - Complete Setup Guide

Comprehensive health monitoring service with real-time dashboard. Includes NestJS backend API and Solid.js frontend dashboard.

## Project Structure

```
fws-health-monitor/
├── apps/
│   ├── health-monitor/                    # Backend NestJS API (port 3400)
│   │   ├── src/
│   │   │   ├── health-check/             # Health check scheduler & service
│   │   │   ├── intervals/                # Check interval management
│   │   │   ├── database/                 # MongoDB configuration
│   │   │   ├── auth/                     # JWT authentication
│   │   │   ├── app.module.ts
│   │   │   ├── app.controller.ts
│   │   │   └── main.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env.example
│   │   └── README.md
│   └── health_monitor_ui/                # Frontend Solid.js Dashboard (port 3401)
│       ├── src/
│       │   ├── pages/
│       │   │   └── HealthStatusPage.tsx  # Main dashboard page
│       │   ├── components/               # Reusable UI components
│       │   ├── services/
│       │   │   ├── authService.ts        # Authentication & JWT
│       │   │   └── apiService.ts         # API communication
│       │   ├── styles/                   # CSS modules
│       │   └── App.tsx
│       ├── vite.config.ts
│       ├── index.html
│       ├── package.json
│       └── tsconfig.json
├── docs/                                  # Documentation
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/bospetersen/fws-health-monitor.git /home/bosp/Dokumenter/Projects/fws-health-monitor
cd /home/bosp/Dokumenter/Projects/fws-health-monitor

# Install all dependencies (backend + frontend)
pnpm install
```

### 2. Configure MongoDB Atlas

1. Create MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a cluster and database named `health-monitor`
3. Create a database user with appropriate permissions
4. Get your connection string (will be `mongodb+srv://username:password@cluster...`)
5. Whitelist your IP address in Network Access

### 3. Configure Backend Environment

```bash
cd apps/health-monitor
cp .env.example .env
```

Edit `apps/health-monitor/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/health-monitor?retryWrites=true&w=majority
PORT=3400
NODE_ENV=development
CHECK_INTERVAL=300000
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRATION=24h
```

### 4. Configure Frontend Environment

```bash
cd apps/health_monitor_ui
cp .env.example .env
```

Edit `apps/health_monitor_ui/.env`:
```env
VITE_API_URL=http://localhost:3400/api
VITE_APP_NAME=Health Monitor
```

### 5. Start Both Services

From the root directory, start both backend and frontend simultaneously:

```bash
# Terminal from root directory
pnpm dev
```

This will:
- Start Backend API on: http://localhost:3400
- Start Frontend Dashboard on: http://localhost:3401
- Enable Vite proxy for API calls

**Access the Dashboard:**
Open http://localhost:3401 in your browser

**API Documentation:**
Open http://localhost:3400/api for Swagger UI

## Individual Development

If you want to run apps separately:

```bash
# Terminal 1: Backend only
cd apps/health-monitor
pnpm dev

# Terminal 2: Frontend only
cd apps/health_monitor_ui
pnpm dev
```

## Adding Endpoints to Monitor

After the services are running, add endpoints through the dashboard:

1. Open http://localhost:3401
2. Log in with your credentials
3. Navigate to create a new endpoint group or add endpoints to existing groups
4. Enter endpoint details:
   - Name: Descriptive name
   - URL: Full URL to monitor (e.g., https://localhost:5176)
   - Description: Optional details
5. Save endpoint
6. Click "Refresh Status" to start monitoring

**Example Endpoints:**
- Admin Portal: https://localhost:5176
- Colorworks App: https://localhost:5173
- Developer Portal: https://localhost:5174
- App Store: https://localhost:5175
- Collaboration Platform: https://localhost:3000
- Colorworks API: http://localhost:3330/api
- Collaboration API: http://localhost:3002/api
- Developer API: http://localhost:3003/api
- Global Authenticator API: https://localhost:3301/api

## Key Features

### Health Status Dashboard
- Real-time endpoint status with green/red badges
- Group-based organization
- Manual refresh + 5-minute auto-refresh
- Click to copy endpoint URLs
- Move endpoints between groups
- Toggle endpoints on/off

### Dynamic Check Intervals
- Backend scheduler runs every 5 minutes by default
- Configurable via environment variables
- Tracks response times and status codes

### MongoDB History
- Every check stored with full details
- Response time tracked
- Status codes logged
- Error messages captured

### Authentication
- JWT-based session management
- Persistent authentication across page reloads
- Secure token storage

## Deployment

### Frontend Deployment

The frontend (Solid.js) builds to a static site in `apps/health_monitor_ui/dist`:

```bash
cd apps/health_monitor_ui
pnpm build
```

Deploy the `dist` folder to:
- Static hosting (GitHub Pages, Netlify, Vercel)
- CDN (CloudFlare, AWS S3)
- Web server (nginx, Apache)

**Important:** Update `VITE_API_URL` environment variable to point to your production backend.

### Backend Deployment

Build and deploy the NestJS backend:

```bash
cd apps/health-monitor
pnpm build
pnpm start:prod
```

Deploy to:
- Docker container
- Kubernetes cluster
- Virtual machine
- Cloud provider (AWS, Google Cloud, Azure)

**Docker Example:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY apps/health-monitor .
RUN pnpm install --prod
CMD ["pnpm", "start:prod"]
```

## Production Environment Variables

### Backend (`apps/health-monitor/.env`)
```env
MONGODB_URI=mongodb+srv://username:password@prod-cluster.mongodb.net/health-monitor
PORT=3400
NODE_ENV=production
CHECK_INTERVAL=300000
JWT_SECRET=your-strong-secret-key-here
JWT_EXPIRATION=24h
```

### Frontend (`apps/health_monitor_ui/.env`)
```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=FWS Health Monitor
```

## Database Management

Access MongoDB Atlas:
1. Log into MongoDB Atlas console
2. Go to Health Monitor cluster
3. Browse Collections tab to see:
   - `endpoints` - Monitored services
   - `healthcheckresults` - Check history
   - `users` - User accounts (if auth enabled)
   - `endpointgroups` - Endpoint groups

Useful queries:
```javascript
// Find all endpoints
db.endpoints.find()

// Find recent health checks
db.healthcheckresults.find().sort({checkedAt: -1}).limit(100)

// Endpoints by group
db.endpoints.find({groupId: "group-id"})
```

## Troubleshooting

### MongoDB Connection Issues

**Error: "Connection refused"**
- Verify MongoDB Atlas IP whitelist includes your server
- Check connection string in `.env`
- Ensure cluster is running in MongoDB Atlas console

**Error: "Authentication failed"**
- Verify database username and password
- Check that user has correct permissions
- Ensure special characters in password are URL-encoded

### Frontend Issues

**Dashboard not loading?**
- Check browser console for errors (F12)
- Verify backend is running: `curl http://localhost:3400/health`
- Check VITE_API_URL in `.env` matches backend URL

**Authentication not working?**
- Clear browser cache and cookies
- Check JWT_SECRET matches between frontend login calls
- Verify localStorage is enabled in browser

### Backend Issues

**Endpoints not checking?**
- Ensure MongoDB has endpoint data: `db.endpoints.find()`
- Check health-check scheduler logs
- Manually trigger: `POST http://localhost:3400/api/health-check/manual`

**Service not starting?**
- Check Node version: `node --version` (need 18+)
- Verify pnpm: `pnpm --version` (need 8+)
- Check port 3400 is available: `lsof -i :3400`
- Review startup logs for errors

### Port Conflicts

If ports are already in use:
- Backend (3400): `lsof -i :3400`
- Frontend (3401): `lsof -i :3401`
- Change ports in `.env` and vite.config.ts

## Documentation

See `docs/` folder for:
- [HEALTH_STATUS_PAGE_SETUP.md](../docs/HEALTH_STATUS_PAGE_SETUP.md) - Frontend dashboard implementation
- [API endpoints and data flow](#)
- [Backend architecture](#)
- [Database schema](#)

## Next Steps

Once monitoring is operational:
1. [ ] Set up endpoint groups for organization
2. [ ] Configure alert notifications (email, Slack)
3. [ ] Monitor uptime trends
4. [ ] Set up automatic backups of MongoDB
5. [ ] Create recovery procedures
6. [ ] Document critical endpoints

## Support & Issues

For help:
1. Check logs: `tail -f apps/health-monitor/logs/*.log`
2. Review API docs: http://localhost:3400/api (Swagger UI)
3. Check MongoDB Atlas status and logs
4. Verify all environment variables are set correctly
5. Ensure all dependencies are installed: `pnpm install`
