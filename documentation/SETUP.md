# Setup & Installation Guide

## Prerequisites

Before setting up FWS Health Monitor, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
  - Download from https://nodejs.org/
  - Verify: `node --version`

- **pnpm**: v8.0.0 or higher (package manager)
  - Install globally: `npm install -g pnpm`
  - Verify: `pnpm --version`

- **Git**: For version control
  - Download from https://git-scm.com/
  - Verify: `git --version`

- **MongoDB Atlas Account**
  - Sign up at https://www.mongodb.com/cloud/atlas
  - Create a cluster
  - Get connection string

## Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fws-health-monitor
```

### 2. Install Dependencies

```bash
pnpm install
```

This command:
- Installs all dependencies for the root workspace
- Installs dependencies for apps/health-monitor (backend)
- Installs dependencies for apps/health_monitor_ui (frontend)
- Uses pnpm's workspaces feature for efficient dependency management

### 3. Environment Configuration

Create `.env` files in the applications that need them.

**Backend (.env in `apps/health-monitor/`):**

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fws-health-monitor?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=24h

# Server
PORT=3400
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3401

# Optional: Health Check Interval
HEALTH_CHECK_INTERVAL=300000  # 5 minutes in milliseconds
```

**Frontend (.env in `apps/health_monitor_ui/`):**

```env
# API Configuration
VITE_API_URL=http://localhost:3400/api
VITE_NODE_ENV=development
```

### 4. MongoDB Setup

#### Option A: MongoDB Atlas (Recommended for Production)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a new account or sign in
3. Create a new cluster
4. Set up IP whitelist (add your IP or 0.0.0.0/0 for development)
5. Create database user with username and password
6. Get connection string from "Connect" button
7. Replace in `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/fws-health-monitor?retryWrites=true&w=majority
   ```

#### Option B: Local MongoDB (For Local Development)

```bash
# Install MongoDB locally
# macOS (Homebrew):
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# MongoDB runs on localhost:27017
# Update .env:
MONGODB_URI=mongodb://localhost:27017/fws-health-monitor
```

### 5. Database Initialization

The database collections will be created automatically when the backend starts. Mongoose will:
- Create collections based on defined schemas
- Create indexes automatically
- Validate documents against schemas

**Optional: Seed Initial Data**

To create an initial admin user, you can modify `main.ts` temporarily or use MongoDB Compass to insert:

```json
{
  "username": "admin",
  "email": "admin@example.com",
  "passwordHash": "$2b$10$..." // bcrypt hash of "password123"
}
```

## Running the Application

### Terminal Setup

You'll need 3 terminals open:

**Terminal 1: Backend API**
```bash
cd apps/health-monitor
pnpm dev
```

Expected output:
```
[Nest] 12345  - 08/04/2026, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 08/04/2026, 10:30:01 AM     LOG [InstanceLoader] DatabaseModule dependencies initialized +10ms
[Nest] 12345  - 08/04/2026, 10:30:02 AM     LOG [RoutesResolver] AppController {/api}:
[Nest] 12345  - 08/04/2026, 10:30:02 AM     LOG [RoutesResolver] AuthController {/api/auth}:
[Nest] 12345  - 08/04/2026, 10:30:02 AM     LOG [NestApplication] Nest application successfully started
```

The API will be available at: `http://localhost:3400/api`

**Terminal 2: Frontend UI**
```bash
cd apps/health_monitor_ui
pnpm dev
```

Expected output:
```
VITE v5.4.21 ready in xxx ms

➜  local:   http://localhost:5173/
➜  press h to show help

HMRWS connection ready
```

The UI will be available at: `http://localhost:3401`

**Terminal 3: Monitoring (Optional)**
```bash
cd fws-health-monitor
pnpm dev  # Runs all dev tasks in parallel via Turbo
```

### Step-by-Step Startup

1. **Start MongoDB** (if using local)
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   # Run "MongoDB Community Server" service
   ```

2. **Start Backend API** (Terminal 1)
   ```bash
   cd apps/health-monitor
   pnpm dev
   ```
   - Wait for "Nest application successfully started"
   - Verify at: http://localhost:3400/api/health (should return 200)

3. **Start Frontend UI** (Terminal 2)
   ```bash
   cd apps/health_monitor_ui
   pnpm dev
   ```
   - Wait for "ready in xxx ms"
   - Verify at: http://localhost:3401

4. **Open Browser**
   - Navigate to http://localhost:3401
   - You should see the login page

## Initial Login

Default credentials (if database seeded):
- **Username**: admin
- **Password**: password123

If no default user exists, you'll need to create one through the database or API.

## Verification

### Verify Backend is Running

```bash
# Check API health endpoint
curl http://localhost:3400/api/health

# Expected response:
# { "status": "ok" }
```

### Verify Frontend is Running

```bash
# Visit in browser
http://localhost:3401

# Should display login page
```

### Test API Connection

```bash
# Login via API
curl -X POST http://localhost:3400/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# Expected response:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIs...",
#   "user": {
#     "_id": "...",
#     "username": "admin",
#     "email": "admin@example.com"
#   }
# }
```

## Building for Production

### Build Backend

```bash
cd apps/health-monitor
pnpm build
```

Output: `dist/` directory ready for deployment

### Build Frontend

```bash
cd apps/health_monitor_ui
pnpm build
```

Output: `dist/` directory with optimized static files

### Build Everything with Turbo

```bash
cd fws-health-monitor
pnpm build
```

This builds all packages in the workspace with optimized caching.

## Common Issues & Troubleshooting

### Issue: "Cannot find module 'mongoose'"

**Solution**: Reinstall dependencies
```bash
pnpm install
cd apps/health-monitor
pnpm install
```

### Issue: "MongoDB connection refused"

**Solution**: 
1. Check MongoDB is running: `mongo --version`
2. Check connection string in `.env`
3. Verify MongoDB Atlas network whitelist includes your IP
4. Test connection: `mongo "mongodb+srv://username:password@cluster.mongodb.net/test"`

### Issue: "Port 3400 already in use"

**Solution**: 
```bash
# Kill process on port 3400
# macOS/Linux:
lsof -ti:3400 | xargs kill -9

# Windows:
netstat -ano | findstr :3400
taskkill /PID <PID> /F
```

### Issue: "CORS error in browser"

**Solution**:
1. Verify CORS_ORIGIN in backend `.env` includes frontend URL
2. Default is `http://localhost:3401`
3. Restart backend after changing

### Issue: "Token invalid or expired"

**Solution**:
1. Clear browser localStorage: `localStorage.clear()`
2. Clear sessionStorage: `sessionStorage.clear()`
3. Log in again
4. Tokens expire after 24 hours by default

### Issue: "Frontend shows 'No groups yet' but can't create"

**Solution**:
1. Check browser console for errors (F12)
2. Check backend console for API errors
3. Verify JWT token is valid: `localStorage.getItem('jwtToken')`
4. Try logging out and back in

## Development Tools

### Recommended IDE Extensions (VS Code)

```json
{
  "ms-python.vscode-pylance": "2026.3.1",
  "dbaeumer.vscode-eslint": "latest",
  "esbenp.prettier-vscode": "latest",
  "bradlc.vscode-tailwindcss": "latest"
}
```

### Database Management

**MongoDB Compass** (GUI for MongoDB):
- Download: https://www.mongodb.com/products/compass
- Connect to local or Atlas cluster
- View/edit data in collections
- Run aggregation pipelines

**MongoDB Atlas UI**:
- Built-in web interface
- View collections and documents
- Create indexes
- Monitor cluster performance

### API Testing

**Postman** (REST API Testing):
- Download: https://www.postman.com/downloads/
- Import API collection
- Test endpoints with authentication
- Debug request/response

**cURL** (Command Line):
```bash
# Login
curl -X POST http://localhost:3400/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# Create endpoint group (replace TOKEN)
curl -X POST http://localhost:3400/api/endpoint-groups \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Production","sortOrder":1,"active":true}'
```

## Environment Variables Reference

### Backend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| MONGODB_URI | Yes | - | MongoDB connection string |
| JWT_SECRET | Yes | - | Secret key for JWT signing |
| JWT_EXPIRATION | No | 24h | Token expiration time |
| PORT | No | 3400 | Server port |
| NODE_ENV | No | development | Environment (development/production) |
| CORS_ORIGIN | No | http://localhost:3401 | Frontend URL for CORS |
| HEALTH_CHECK_INTERVAL | No | 300000 | Milliseconds between health checks |

### Frontend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| VITE_API_URL | No | http://localhost:3400/api | Backend API URL |
| VITE_NODE_ENV | No | development | Environment for Vite |

## Next Steps

1. ✅ Setup complete!
2. Log in with default credentials
3. Create your first endpoint group
4. Add endpoints to monitor
5. View health status dashboard

For more information, see:
- [API Reference](./API.md)
- [Development Guide](./DEVELOPMENT_GUIDE.md)
- [Architecture Overview](./ARCHITECTURE.md)

---

**Last Updated**: 2026-08-05
