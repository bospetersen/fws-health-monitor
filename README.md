# FWS Health Monitor

Independent health monitoring service for FWS system infrastructure. Monitors endpoint availability, response times, and maintains a complete audit log in MongoDB Atlas.

## Features

- 🏥 Real-time endpoint health checks
- 📊 Complete history stored in MongoDB Atlas
- ⚙️ Dynamic check interval configuration
- 🔌 Full REST API for management
- 📈 Response time tracking
- 🎯 Scalable Turbo monorepo structure

## Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB Atlas
- **Node Runtime**: Node 18+
- **Package Manager**: pnpm
- **Build Tool**: Turbo

## Project Structure

```
fws-health-monitor/
├── apps/
│   └── health-monitor/          # Main monitoring service
│       ├── src/
│       │   ├── health-check/    # Health check logic
│       │   ├── intervals/       # Check interval management
│       │   ├── database/        # Database configuration
│       │   └── main.ts
│       └── package.json
├── packages/                     # Shared utilities (for future use)
├── turbo.json                    # Turbo configuration
├── pnpm-workspace.yaml           # Workspace configuration
└── package.json
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
# Start all apps in watch mode
pnpm dev

# Start health-monitor app specifically
cd apps/health-monitor && pnpm dev
```

### Production Build

```bash
# Build all apps
pnpm build

# Start health-monitor
cd apps/health-monitor && pnpm start:prod
```

## API Endpoints

### Health Checks

- `GET /health-checks` - Get recent health check results
- `GET /health-checks/:endpointId` - Get specific endpoint results
- `POST /health-checks/manual` - Trigger manual health check

### Endpoints Management

- `GET /endpoints` - List all monitored endpoints
- `POST /endpoints` - Add new endpoint to monitor
- `PUT /endpoints/:id` - Update endpoint
- `DELETE /endpoints/:id` - Remove endpoint from monitoring

### Intervals Management

- `GET /intervals` - Get current check interval
- `POST /intervals` - Set new check interval
- `GET /intervals/history` - Get interval change history

### Status

- `GET /status` - Get service status and stats
- `GET /health` - Health check endpoint

## Deployment

The service can be deployed to:
- Docker container
- Kubernetes cluster
- Virtual machine
- Cloud provider (AWS, Google Cloud, Azure, etc.)

Configure via environment variables for different environments.

## Documentation

See `docs/` folder for detailed documentation on:
- API reference
- Database schema
- Monitoring best practices
- Deployment guides

## License

UNLICENSED
