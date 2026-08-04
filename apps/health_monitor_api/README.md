# Health Monitor Service

Dedicated health monitoring service for FWS infrastructure. Monitors endpoint availability, tracks response times, and maintains a complete audit trail in MongoDB Atlas.

## Features

- ✅ Real-time endpoint health checks
- 📊 Complete history logged to MongoDB
- ⚙️ Dynamically configurable check intervals
- 📈 Response time and uptime tracking
- 🔌 Full REST API for management and querying
- 🎯 Runs independently from monitored services

## API Reference

### Health Check Endpoints

**Trigger Manual Check**
```
POST /health-check/manual
```

**Get Recent Checks**
```
GET /health-check/recent?limit=100
```

**Get Checks for Specific Endpoint**
```
GET /health-check/endpoints/:endpointId?limit=50
```

**Get Endpoint Statistics**
```
GET /health-check/endpoints/:endpointId/stats
```

### Endpoints Management

**List All Monitored Endpoints**
```
GET /endpoints
```

**Get Specific Endpoint**
```
GET /endpoints/:id
```

**Add New Endpoint**
```
POST /endpoints
Content-Type: application/json

{
  "name": "My API",
  "url": "https://api.example.com",
  "active": true,
  "type": "api",
  "description": "Production API endpoint"
}
```

**Update Endpoint**
```
PUT /endpoints/:id
Content-Type: application/json

{
  "active": false,
  "description": "Updated description"
}
```

**Delete Endpoint**
```
DELETE /endpoints/:id
```

### Interval Management

**Get Current Check Interval**
```
GET /intervals
```

**Set New Check Interval**
```
POST /intervals
Content-Type: application/json

{
  "interval": 600000,
  "description": "Check every 10 minutes",
  "setBy": "admin"
}
```

**Get Interval Change History**
```
GET /intervals/history?limit=50
```

### Status Endpoints

**Service Status**
```
GET /status
```

**Health Check**
```
GET /health
```

## Database Schema

### Endpoints Collection
```typescript
{
  name: string;
  url: string;
  active: boolean;
  type: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Health Check Results Collection
```typescript
{
  endpointId: ObjectId;
  endpointName: string;
  url: string;
  status: 'online' | 'offline';
  responseTime: number;
  statusCode: number;
  errorMessage: string;
  checkedAt: Date;
  createdAt: Date;
}
```

### Check Intervals Collection
```typescript
{
  interval: number; // milliseconds
  description: string;
  setAt: Date;
  setBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- pnpm 8+
- MongoDB Atlas account

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure MongoDB Atlas connection in `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/health-monitor?retryWrites=true&w=majority
```

4. Set desired check interval (default: 5 minutes = 300000ms):
```env
CHECK_INTERVAL=300000
```

### Development

Start the service in watch mode:
```bash
pnpm dev
```

Access Swagger UI: http://localhost:3400/api

### Production

Build:
```bash
pnpm build
```

Run:
```bash
pnpm start:prod
```

## Initial Endpoints

When you first set up the service, you'll want to add endpoints to monitor. You can do this via the API:

```bash
curl -X POST http://localhost:3400/endpoints \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Portal",
    "url": "https://localhost:5176",
    "type": "login",
    "active": true
  }'
```

Or add multiple endpoints programmatically to seed the database.

## Monitoring & Observability

- All health checks are logged to MongoDB with full history
- Check intervals changes are tracked
- Statistics are available per endpoint (uptime, avg response time)
- Real-time status via manual check endpoint

## Notes

- Checks run automatically at configured intervals
- First check runs immediately on service startup
- Timeout per endpoint: 2000ms
- Minimum interval: 10 seconds
- All checks are stored in MongoDB for historical analysis
