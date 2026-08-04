# Development Guide

## Project Overview

FWS Health Monitor is organized as a Turbo monorepo with two main applications:
- **apps/health-monitor** - NestJS backend API
- **apps/health_monitor_ui** - Solid.js frontend

This guide covers development practices, patterns, and conventions used throughout the project.

## Development Environment Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- MongoDB (local or Atlas)
- VS Code (recommended)

### First-Time Setup

```bash
# Clone repository
git clone <repo-url>
cd fws-health-monitor

# Install dependencies
pnpm install

# Copy environment files
cp apps/health-monitor/.env.example apps/health-monitor/.env
cp apps/health_monitor_ui/.env.example apps/health_monitor_ui/.env

# Start development servers
# Terminal 1: Backend
cd apps/health-monitor && pnpm dev

# Terminal 2: Frontend
cd apps/health_monitor_ui && pnpm dev
```

## Frontend Development (Solid.js)

### Project Structure

```
apps/health_monitor_ui/
├── src/
│   ├── components/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── HealthStatusPage.tsx
│   │   │   └── ManageEndpointsPage.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── common/
│   ├── services/
│   │   └── authService.ts
│   ├── styles/
│   │   └── index.css
│   ├── App.tsx
│   └── main.tsx
├── vite.config.ts
├── package.json
└── tsconfig.json
```

### Key Patterns

#### 1. Form Handling - The Proven Pattern

**CRITICAL**: Only use form submission pattern with `onsubmit`:

```typescript
// ✅ CORRECT - Form pattern
<form
  onsubmit={(e) => {
    e.preventDefault();
    handleSubmit();
  }}
>
  <input ref={inputRef} type="text" />
  <button type="submit">Submit</button>
</form>

// ❌ WRONG - Button onClick doesn't work reliably
<input ref={inputRef} type="text" />
<button onClick={handleSubmit}>Submit</button>

// ❌ WRONG - Show components for toggles cause issues
<Show when={showForm()}>
  <form>...</form>
</Show>
```

**Why?** Solid.js event binding quirks make form onsubmit the only reliable pattern.

#### 2. Uncontrolled Inputs with Refs

```typescript
// ✅ CORRECT - Uncontrolled with ref
let nameRef: HTMLInputElement | undefined;

const handleSubmit = () => {
  const value = nameRef?.value || '';
  // Use value...
};

return (
  <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
    <input ref={nameRef} type="text" placeholder="Name" />
  </form>
);

// ❌ WRONG - Signal-bound inputs have reactivity issues
const [name, setName] = createSignal('');

return (
  <input value={name()} onInput={(e) => setName(e.currentTarget.value)} />
);
```

**Why?** Signals in Solid.js can cause unexpected re-renders with form inputs.

#### 3. Authentication State Management

```typescript
// authService.ts - Module-scoped signals (CORRECT)
const [isAuth, setIsAuth] = createSignal(false);
const [user, setUserState] = createSignal<User | null>(null);
const [token, setTokenState] = createSignal<string | null>(null);

export function useAuth() {
  return {
    isAuthenticated: isAuth,
    user,
    login: async (username, password) => {
      // Call API, set tokens
      setJwtToken(token); // Persists to localStorage AND sessionStorage
    },
    logout: () => {
      clearAuth(); // Clears both storages
    }
  };
}

// Component usage
const auth = useAuth();
const isLoggedIn = auth.isAuthenticated(); // Call as function
```

**Critical**: Use `setJwtToken()` not just `jwtToken = token`. It persists to storage.

#### 4. Conditional Rendering

```typescript
// ✅ CORRECT - Inline style toggle
<div style={{ "display": showForm() ? "block" : "none" }}>
  Form content...
</div>

// ✅ ACCEPTABLE - Show component for async data
<Show when={data()} fallback={<div>Loading...</div>}>
  {(data) => <div>{data.name}</div>}
</Show>

// ❌ WRONG - Show for toggles
<Show when={editMode()}>
  <form>...</form>
</Show>
```

#### 5. Reactive Lists

```typescript
// ✅ CORRECT - Use For component
import { For } from 'solid-js';

<For each={items()}>
  {(item) => (
    <div key={item._id}>
      {item.name}
    </div>
  )}
</For>

// ✅ CORRECT - With index when needed
<For each={items()}>
  {(item, index) => (
    <div>
      {index() + 1}. {item.name}
    </div>
  )}
</For>
```

#### 6. Inline Styles - CSS Property Names

```typescript
// ✅ CORRECT - Quoted CSS property names
style={{ 
  "margin-left": "10px",
  "background-color": "#4CAF50",
  "border-radius": "4px"
}}

// ❌ WRONG - CamelCase properties
style={{
  marginLeft: "10px",
  backgroundColor: "#4CAF50"
}}
```

#### 7. Event Handlers in Forms

```typescript
// ✅ CORRECT - Form submission
<form onsubmit={(e) => {
  e.preventDefault();
  handleCreate();
}}>
  {/* fields */}
  <button type="submit">Create</button>
</form>

// ✅ CORRECT - Controlled select
<select value={groupId() || ''} onchange={(e) => setGroupId(e.currentTarget.value)}>
  <option value="">Select...</option>
</select>
```

### Common Tasks

#### Adding a New Page

1. Create component file: `src/components/pages/MyPage.tsx`
2. Add to router in `App.tsx`:
   ```typescript
   <Route path="/path" component={MyPage} />
   ```
3. Protect route if needed with `<ProtectedRoute>`

#### Calling Backend API

```typescript
import { useAuth } from '../services/authService';

export default function MyComponent() {
  const auth = useAuth();
  
  const handleCreate = async () => {
    try {
      const response = await fetch('http://localhost:3400/api/endpoint-groups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'My Group',
          sortOrder: 1,
          active: true
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        // Handle success
      } else {
        // Handle error
        console.error(data.message);
      }
    } catch (error) {
      console.error('API error:', error);
    }
  };
  
  return (
    <form onsubmit={(e) => { e.preventDefault(); handleCreate(); }}>
      {/* form fields */}
    </form>
  );
}
```

#### Displaying Errors to User

```typescript
const [error, setError] = createSignal<string | null>(null);

const handleSubmit = async () => {
  try {
    // API call...
    setError(null);
  } catch (err) {
    setError(err.message || 'Unknown error');
  }
};

return (
  <>
    <Show when={error()}>
      <div style={{
        "background-color": "#ffebee",
        "color": "#d32f2f",
        "padding": "12px",
        "border-radius": "4px",
        "margin-bottom": "12px"
      }}>
        {error()}
      </div>
    </Show>
    {/* rest of form */}
  </>
);
```

### Testing Frontend

```bash
# Run in dev mode with hot reload
cd apps/health_monitor_ui
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Backend Development (NestJS)

### Project Structure

```
apps/health-monitor/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── endpoint-groups/
│   │   ├── endpoint-groups.controller.ts
│   │   ├── endpoint-groups.service.ts
│   │   ├── endpoint-groups.module.ts
│   │   ├── dto/
│   │   │   └── create-endpoint-group.dto.ts
│   │   └── schemas/
│   │       └── endpoint-group.schema.ts
│   ├── endpoints/
│   ├── health-check/
│   ├── database/
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
├── nest-cli.json
├── package.json
└── tsconfig.json
```

### Key Patterns

#### 1. Creating a New Module

```typescript
// generate.controller.ts
import { Controller, Post, Body, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { MyService } from './my.service';
import { CreateMyDto } from './dto/create-my.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('my')
@UseGuards(JwtAuthGuard)
export class MyController {
  constructor(private readonly myService: MyService) {}

  @Post()
  create(@Body() createMyDto: CreateMyDto) {
    return this.myService.create(createMyDto);
  }

  @Get()
  findAll() {
    return this.myService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.myService.remove(id);
  }
}
```

#### 2. Creating a DTO

```typescript
// create-my.dto.ts
import { IsString, IsNumber, IsBoolean, Length } from 'class-validator';

export class CreateMyDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsNumber()
  sortOrder: number;

  @IsBoolean()
  active: boolean;
}
```

#### 3. Creating a Schema

```typescript
// my.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class My extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  sortOrder: number;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const MySchema = SchemaFactory.createForClass(My);

// Add indexes
MySchema.index({ sortOrder: 1 });
MySchema.index({ active: 1 });
```

#### 4. Service Pattern

```typescript
// my.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { My } from './schemas/my.schema';
import { CreateMyDto } from './dto/create-my.dto';

@Injectable()
export class MyService {
  constructor(
    @InjectModel(My.name) private myModel: Model<My>,
  ) {}

  async create(createMyDto: CreateMyDto): Promise<My> {
    const created = new this.myModel(createMyDto);
    return created.save();
  }

  async findAll(): Promise<My[]> {
    return this.myModel.find().sort({ sortOrder: 1 }).exec();
  }

  async findById(id: string): Promise<My> {
    return this.myModel.findById(id).exec();
  }

  async update(id: string, updateMyDto: Partial<CreateMyDto>): Promise<My> {
    return this.myModel
      .findByIdAndUpdate(id, updateMyDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<{ deletedCount: number }> {
    const result = await this.myModel.deleteOne({ _id: id }).exec();
    return { deletedCount: result.deletedCount };
  }
}
```

#### 5. Registering a Module

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MyModule } from './my/my.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    MyModule,
    // other modules...
  ],
})
export class AppModule {}
```

### Error Handling

```typescript
// With proper HTTP status codes
import { HttpException, HttpStatus } from '@nestjs/common';

throw new HttpException(
  'Item not found',
  HttpStatus.NOT_FOUND,
);

throw new HttpException(
  'Invalid input',
  HttpStatus.BAD_REQUEST,
);

throw new HttpException(
  'Internal server error',
  HttpStatus.INTERNAL_SERVER_ERROR,
);
```

### Validation

NestJS includes `class-validator` globally via `ValidationPipe`:

```typescript
// Auto-validates all DTOs
@Post()
create(@Body() createMyDto: CreateMyDto) {
  // If validation fails, 400 error automatically returned
  return this.myService.create(createMyDto);
}
```

### Testing Backend

```bash
# Start in dev mode
cd apps/health-monitor
pnpm dev

# Build for production
pnpm build

# Run tests (if configured)
pnpm test
```

## Database Development

### Creating Migrations

While Mongoose doesn't use traditional migrations, to make schema changes:

1. **Update schema file** (`schemas/my.schema.ts`)
2. **Update DTO** (`dto/create-my.dto.ts`)
3. **Update service** (`my.service.ts`)
4. **Restart backend** - Mongoose validates on save

### Adding Indexes

```typescript
// In schema file
MySchema.index({ email: 1 }, { unique: true });
MySchema.index({ createdAt: -1 });
MySchema.index({ userId: 1, status: 1 });
```

### Querying with Mongoose

```typescript
// Find with filter
await model.find({ active: true }).sort({ sortOrder: 1 }).exec();

// Aggregation pipeline
await model.aggregate([
  { $match: { active: true } },
  { $group: { _id: "$category", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);

// Bulk operations
await model.updateMany(
  { status: 'old' },
  { status: 'archived' }
);
```

## Git Workflow

### Branch Naming

```
feature/feature-name          # New features
bugfix/bug-description         # Bug fixes
refactor/what-changed          # Code refactoring
docs/update-documentation      # Documentation updates
```

### Commit Messages

```
feat: Add endpoint group creation
fix: Correct JWT token expiration
docs: Update API documentation
refactor: Simplify form validation
```

### Before Pushing

1. Ensure backend compiles: `pnpm build` (backend)
2. Ensure frontend works: `pnpm build` (frontend)
3. Test locally: `pnpm dev` both apps
4. No console errors or warnings

## Debugging

### Frontend Debugging

1. **Chrome DevTools**
   - F12 → Console tab
   - Check for errors
   - Use `console.log()` for debugging

2. **VS Code Debugger**
   ```json
   {
     "type": "chrome",
     "request": "launch",
     "name": "Launch Chrome",
     "url": "http://localhost:3401",
     "webRoot": "${workspaceFolder}/apps/health_monitor_ui/src"
   }
   ```

3. **Check Storage**
   - F12 → Application → LocalStorage/SessionStorage
   - Verify JWT token is saved

### Backend Debugging

1. **Console Logs**
   ```typescript
   console.log('Debug info:', data);
   ```

2. **VS Code Debugger**
   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "NestJS Debug",
     "program": "${workspaceFolder}/apps/health-monitor/node_modules/.bin/nest",
     "args": ["start", "--debug", "--watch"],
     "console": "integratedTerminal"
   }
   ```

3. **MongoDB Queries**
   - Use MongoDB Compass to inspect collections
   - Verify data is saved correctly

### Common Issues

**Frontend not connecting to API**
- Check browser console (F12)
- Verify API is running on port 3400
- Check JWT token exists in localStorage
- Clear cache: Ctrl+Shift+Delete

**API not starting**
- Check MongoDB connection: `mongo "connection-string"`
- Verify environment variables: `echo $MONGODB_URI`
- Check for port conflicts: `lsof -i :3400`

**Token expires too quickly**
- Check JWT_EXPIRATION in .env (should be "24h")
- Restart backend after changing
- Clear browser storage and login again

## Performance Tips

### Frontend
- Avoid unnecessary re-renders by using proper Solid.js patterns
- Batch API calls when possible
- Use `Show` component for async data loading
- Minimize inline styles (predefine in CSS)

### Backend
- Add indexes for frequently queried fields
- Use lean queries when don't need full documents
- Implement pagination for large result sets
- Cache database connections

### Database
- Create indexes on foreign keys
- Regular backups to MongoDB Atlas
- Monitor slow queries in Atlas console
- Consider TTL indexes for temporary data

## Code Style

### TypeScript Configuration

Strict mode enabled in `tsconfig.json`:
- No implicit any
- Strict null checks
- Strict function types

### Naming Conventions

```typescript
// Classes: PascalCase
export class EndpointGroupsService {}

// Functions/variables: camelCase
export function handleSubmit() {}
const userName = 'admin';

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:3400/api';

// Private members: _camelCase or private keyword
private _internalState: string;
private internalState: string; // Preferred with 'private' keyword
```

### Import Organization

```typescript
// 1. External libraries
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

// 2. Local modules
import { MyService } from './my.service';
import { CreateMyDto } from './dto/create-my.dto';

// 3. Empty line
// 4. Relative imports
import { logger } from '../utils/logger';
```

## Documentation

### Code Comments

Use JSDoc for public functions:

```typescript
/**
 * Creates a new endpoint group
 * @param createGroupDto - Group data
 * @returns Created group document
 * @throws HttpException if validation fails
 */
async create(createGroupDto: CreateGroupDto): Promise<EndpointGroup> {
  // implementation
}
```

### API Documentation

Keep API.md updated with:
- Endpoint paths
- Request/response examples
- Status codes
- Error messages

## Deployment Considerations

### Environment Variables

Never commit `.env` files. Use `.env.example`:

```env
# .env.example
MONGODB_URI=<your-connection-string>
JWT_SECRET=<change-this>
PORT=3400
CORS_ORIGIN=http://localhost:3401
```

### Production Checklist

- [ ] All environment variables set
- [ ] Database backups enabled
- [ ] HTTPS enabled (use reverse proxy)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Monitoring/alerting set up

---

**Last Updated**: 2026-08-05
