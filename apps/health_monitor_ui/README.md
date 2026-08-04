# Health Monitor UI

Solid.js frontend application for the FWS Health Monitoring System.

## Features

- Real-time health status monitoring
- Endpoint management
- Health check history and analytics
- Responsive design

## Getting Started

### Installation

```bash
cd apps/health_monitor_ui
pnpm install
```

### Development

Start the development server:

```bash
pnpm run dev
```

The UI will be available at `http://localhost:3001` and automatically proxies API calls to the backend on `http://localhost:3000`.

### Building

Build for production:

```bash
pnpm run build
```

### Linting

```bash
pnpm run lint
```

### Formatting

```bash
pnpm run format
```

## Project Structure

```
src/
├── App.tsx          # Main app component
├── App.css          # Main styles
└── index.tsx        # Entry point
```

## Technology Stack

- **Solid.js** - Reactive JavaScript library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **CSS** - Styling

## Integration with API

The development server proxies requests to `/api` to the health monitoring API running on `http://localhost:3000`.
