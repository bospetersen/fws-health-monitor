# FWS Health Monitor - Setup Guide

Complete independent health monitoring service for FWS infrastructure.

## Project Structure

```
fws-health-monitor/
├── apps/
│   └── health-monitor/
│       ├── src/
│       │   ├── health-check/         # Health checking logic
│       │   ├── intervals/            # Check interval management
│       │   ├── database/             # MongoDB configuration
│       │   ├── app.module.ts         # Main app module
│       │   ├── app.controller.ts
│       │   ├── app.service.ts
│       │   └── main.ts               # Entry point
│       ├── package.json
│       ├── tsconfig.json
│       ├── .env.example
│       └── README.md
├── packages/                          # Shared packages (for future)
├── turbo.json                         # Turbo config
├── pnpm-workspace.yaml                # Workspace config
└── README.md
```

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/bospetersen/fws-health-monitor.git /home/bosp/Dokumenter/Projects/fws-health-monitor
cd /home/bosp/Dokumenter/Projects/fws-health-monitor

# Install dependencies
pnpm install
```

### 2. Configure MongoDB Atlas

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a cluster and database named `health-monitor`
3. Create a user for the database with appropriate permissions
4. Get your connection string

### 3. Configure Environment

```bash
cd apps/health-monitor
cp .env.example .env
```

Edit `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/health-monitor?retryWrites=true&w=majority
PORT=3400
CHECK_INTERVAL=300000
NODE_ENV=development
SHOW_SWAGGER_UI=true
```

### 4. Start Development

```bash
# From root directory
pnpm dev

# Or from apps/health-monitor directory
pnpm dev
```

Service will start on `http://localhost:3400`

### 5. Add Initial Endpoints

Use the API to add endpoints you want to monitor:

```bash
curl -X POST http://localhost:3400/endpoints \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Portal",
    "url": "https://localhost:5176",
    "active": true,
    "type": "login"
  }'
```

Endpoints to add (from your current setup):
- Admin Portal: https://localhost:5176
- Colorworks App: https://localhost:5173
- Developer Portal: https://localhost:5174
- App Store: https://localhost:5175
- Collaboration Platform: https://localhost:3000
- Colorworks API: http://localhost:3330/api
- Collaboration API: http://localhost:3002/api
- Developer API: http://localhost:3003/api
- Global Authenticator API: https://localhost:3301/api

### 6. Access Swagger UI

Open: http://localhost:3400/api

## Key Features

### Dynamic Check Intervals
- Set via API: `POST /intervals`
- Minimum: 10 seconds
- Automatically updates scheduler

### MongoDB History
- Every check stored with full details
- Response time tracked
- Status codes logged
- Error messages captured

### Statistics Per Endpoint
- Uptime percentage
- Average response time
- Total checks count
- Online/offline counts

## API Quick Reference

### Manual Check
```
POST http://localhost:3400/health-check/manual
```

### Get Recent Results
```
GET http://localhost:3400/health-check/recent?limit=100
```

### List Endpoints
```
GET http://localhost:3400/endpoints
```

### Add Endpoint
```
POST http://localhost:3400/endpoints
```

### Get Current Interval
```
GET http://localhost:3400/intervals
```

### Set New Interval
```
POST http://localhost:3400/intervals
Content-Type: application/json

{
  "interval": 600000,
  "description": "Check every 10 minutes"
}
```

## Database Management

Access MongoDB Atlas:
1. Log into MongoDB Atlas console
2. Go to Health Monitor cluster
3. Browse Collections tab to see:
   - `endpoints` - Monitored services
   - `healthcheckresults` - Check history
   - `checkintervals` - Interval change log

## Deployment

For production:
1. Build: `pnpm build`
2. Deploy to Docker/Kubernetes/VM
3. Configure MongoDB Atlas connection
4. Start with: `pnpm start:prod`

## Next Steps

Once monitoring is running:
- [ ] Create frontend dashboard to visualize health data
- [ ] Implement alert notifications (email, Slack, etc.)
- [ ] Set up automatic recovery actions
- [ ] Add performance trending
- [ ] Create reporting system

## Troubleshooting

**Connection refused to MongoDB?**
- Verify MongoDB Atlas IP whitelist includes your server
- Check connection string in .env

**Endpoints not checking?**
- Make sure endpoints collection has data
- Check logs for errors
- Manually trigger: `POST /health-check/manual`

**Service not starting?**
- Check Node version: `node --version` (need 18+)
- Verify pnpm: `pnpm --version` (need 8+)
- Check port 3400 is available

## Support

For issues, check:
- Application logs
- MongoDB Atlas logs
- Swagger documentation at http://localhost:3400/api
