# Database Schema

## Overview

FWS Health Monitor uses MongoDB as its primary database, with Mongoose as the ODM (Object Document Mapper). This document describes all collections, their schemas, indexes, and relationships.

## Collections

### 1. users

Stores user account information.

**Schema:**
```typescript
{
  _id: ObjectId (Auto-generated),
  username: String (unique, required),
  email: String (unique, required),
  passwordHash: String (required, bcrypt-hashed),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
```
- Primary: _id (default)
- Unique: username
- Unique: email
```

**Example Document:**
```json
{
  "_id": { "$oid": "507f1f77bcf86cd799439011" },
  "username": "admin",
  "email": "admin@example.com",
  "passwordHash": "$2b$10$abcdefg...",
  "createdAt": { "$date": "2026-08-04T10:00:00.000Z" },
  "updatedAt": { "$date": "2026-08-04T10:00:00.000Z" }
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Unique identifier (auto-generated) |
| username | String | Unique username for login |
| email | String | Unique email address |
| passwordHash | String | Bcrypt hash of password (never stored plaintext) |
| createdAt | Date | Account creation timestamp |
| updatedAt | Date | Last update timestamp |

**Constraints:**
- Username must be unique and 3-50 characters
- Email must be unique and valid format
- Password hash uses bcrypt with 10 salt rounds

---

### 2. endpoint_groups

Groups for organizing endpoints.

**Schema:**
```typescript
{
  _id: ObjectId (Auto-generated),
  name: String (required),
  sortOrder: Number (required),
  active: Boolean (required, default: true),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
```
- Primary: _id (default)
- Regular: sortOrder (for sorting)
- Regular: active (for filtering)
```

**Example Document:**
```json
{
  "_id": { "$oid": "507f1f77bcf86cd799439012" },
  "name": "Production APIs",
  "sortOrder": 1,
  "active": true,
  "createdAt": { "$date": "2026-08-04T10:30:00.000Z" },
  "updatedAt": { "$date": "2026-08-04T10:30:00.000Z" }
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Unique identifier |
| name | String | Display name of group |
| sortOrder | Number | Position in UI (1 = first) |
| active | Boolean | Whether group is monitored |
| createdAt | Date | Creation timestamp |
| updatedAt | Date | Last update timestamp |

**Constraints:**
- Name must be 1-100 characters
- sortOrder must be positive integer
- active defaults to true

---

### 3. endpoints

Individual endpoints to monitor.

**Schema:**
```typescript
{
  _id: ObjectId (Auto-generated),
  name: String (required),
  url: String (required, valid URL),
  description: String (optional),
  groupId: ObjectId (required, ref: endpoint_groups),
  sortOrder: Number (required),
  active: Boolean (required, default: true),
  lastHealthStatus: String (optional, "healthy" | "unhealthy"),
  lastCheckedAt: Date (optional),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
```
- Primary: _id (default)
- Foreign: groupId (references endpoint_groups)
- Regular: groupId + sortOrder (for fetching group's endpoints)
- Regular: active (for filtering)
```

**Example Document:**
```json
{
  "_id": { "$oid": "507f1f77bcf86cd799439014" },
  "name": "API Status",
  "url": "https://api.example.com/status",
  "description": "Main API health check",
  "groupId": { "$oid": "507f1f77bcf86cd799439012" },
  "sortOrder": 1,
  "active": true,
  "lastHealthStatus": "healthy",
  "lastCheckedAt": { "$date": "2026-08-04T11:00:00.000Z" },
  "createdAt": { "$date": "2026-08-04T10:45:00.000Z" },
  "updatedAt": { "$date": "2026-08-04T11:00:00.000Z" }
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Unique identifier |
| name | String | Display name |
| url | String | Endpoint URL to monitor |
| description | String | Optional notes about endpoint |
| groupId | ObjectId | Reference to endpoint_groups |
| sortOrder | Number | Position within group |
| active | Boolean | Whether endpoint is monitored |
| lastHealthStatus | String | Last known status ("healthy"/"unhealthy") |
| lastCheckedAt | Date | Timestamp of last health check |
| createdAt | Date | Creation timestamp |
| updatedAt | Date | Last update timestamp |

**Constraints:**
- name: 1-100 characters
- url: Valid HTTP(S) URL
- groupId: Must reference existing endpoint_groups document
- sortOrder: Positive integer
- active: Defaults to true

---

### 4. health_check_results

Historical health check results.

**Schema:**
```typescript
{
  _id: ObjectId (Auto-generated),
  endpointId: ObjectId (required, ref: endpoints),
  status: String (required, "healthy" | "unhealthy"),
  statusCode: Number (required),
  responseTime: Number (required, milliseconds),
  errorMessage: String (optional),
  failureReason: String (optional),
  checkedAt: Date (required),
  createdAt: Date (auto)
}
```

**Indexes:**
```
- Primary: _id (default)
- Foreign: endpointId (references endpoints)
- Compound: endpointId + checkedAt (for time-range queries)
- TTL (optional): expires after 30 days
```

**Example Documents:**

**Healthy Result:**
```json
{
  "_id": { "$oid": "507f1f77bcf86cd799439016" },
  "endpointId": { "$oid": "507f1f77bcf86cd799439014" },
  "status": "healthy",
  "statusCode": 200,
  "responseTime": 145,
  "errorMessage": null,
  "failureReason": null,
  "checkedAt": { "$date": "2026-08-04T11:00:00.000Z" },
  "createdAt": { "$date": "2026-08-04T11:00:01.000Z" }
}
```

**Unhealthy Result:**
```json
{
  "_id": { "$oid": "507f1f77bcf86cd799439017" },
  "endpointId": { "$oid": "507f1f77bcf86cd799439014" },
  "status": "unhealthy",
  "statusCode": 503,
  "responseTime": 5000,
  "errorMessage": "Service Unavailable",
  "failureReason": "HTTP 503 received",
  "checkedAt": { "$date": "2026-08-04T11:05:00.000Z" },
  "createdAt": { "$date": "2026-08-04T11:05:02.000Z" }
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Unique result identifier |
| endpointId | ObjectId | Reference to endpoints |
| status | String | "healthy" or "unhealthy" |
| statusCode | Number | HTTP status code (200, 503, etc.) |
| responseTime | Number | Response time in milliseconds |
| errorMessage | String | Error description from endpoint |
| failureReason | String | Reason for failure (TIMEOUT, DNS_FAIL, etc.) |
| checkedAt | Date | When check was performed |
| createdAt | Date | When result was stored |

**Constraints:**
- status: Must be "healthy" or "unhealthy"
- statusCode: Valid HTTP status code (0-599)
- responseTime: >= 0 milliseconds
- endpointId: Must reference existing endpoints document

---

## Relationships

### Endpoint Groups → Endpoints

**Type**: One-to-Many

```
endpoint_groups
    ↓ 1
    ├─── ∞ endpoints
         │
         ├─ _id: "group-1"
         ├─ groupId: "group-1" ← Foreign Key
         └─ ...
```

**On Delete Group**: 
- Should cascade delete associated endpoints
- Deletes health_check_results for those endpoints

### Endpoints → Health Check Results

**Type**: One-to-Many

```
endpoints
    ↓ 1
    ├─── ∞ health_check_results
         │
         ├─ _id: "endpoint-1"
         ├─ endpointId: "endpoint-1" ← Foreign Key
         └─ ...
```

**On Delete Endpoint**:
- Should cascade delete associated health_check_results

## Query Examples

### Find All Groups

```javascript
db.endpoint_groups.find({})
  .sort({ sortOrder: 1 })
```

### Find All Endpoints in a Group

```javascript
db.endpoints.find({ groupId: ObjectId("507f1f77bcf86cd799439012") })
  .sort({ sortOrder: 1 })
```

### Find Active Endpoints

```javascript
db.endpoints.find({ active: true })
```

### Get Latest Health Check for Each Endpoint

```javascript
db.health_check_results.aggregate([
  {
    $sort: { endpointId: 1, checkedAt: -1 }
  },
  {
    $group: {
      _id: "$endpointId",
      latestCheck: { $first: "$$ROOT" }
    }
  }
])
```

### Get Health Check History for Endpoint (Last 7 Days)

```javascript
db.health_check_results.find({
  endpointId: ObjectId("507f1f77bcf86cd799439014"),
  checkedAt: {
    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }
})
.sort({ checkedAt: -1 })
.limit(100)
```

### Find Unhealthy Endpoints

```javascript
db.endpoints.aggregate([
  {
    $match: { active: true }
  },
  {
    $match: { lastHealthStatus: "unhealthy" }
  },
  {
    $sort: { lastCheckedAt: -1 }
  }
])
```

### Get Group Stats

```javascript
db.endpoints.aggregate([
  {
    $group: {
      _id: "$groupId",
      totalEndpoints: { $sum: 1 },
      activeEndpoints: {
        $sum: { $cond: ["$active", 1, 0] }
      },
      healthyEndpoints: {
        $sum: { $cond: [{ $eq: ["$lastHealthStatus", "healthy"] }, 1, 0] }
      }
    }
  }
])
```

## Data Migration

### Adding New Field to Endpoint

```javascript
db.endpoints.updateMany(
  {},
  {
    $set: {
      newField: defaultValue
    }
  }
)
```

### Cleanup Old Health Check Results

```javascript
db.health_check_results.deleteMany({
  createdAt: {
    $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  }
})
```

## Backup & Recovery

### Backup Database

```bash
# MongoDB Atlas automatic backups (enabled by default)
# Manual backup via mongoexport:
mongoexport --uri="mongodb+srv://user:pass@cluster.mongodb.net/fws-health-monitor" \
  --collection=endpoint_groups \
  --out=backup_groups.json

mongoexport --uri="mongodb+srv://user:pass@cluster.mongodb.net/fws-health-monitor" \
  --collection=endpoints \
  --out=backup_endpoints.json
```

### Restore Database

```bash
# Via mongoimport:
mongoimport --uri="mongodb+srv://user:pass@cluster.mongodb.net/fws-health-monitor" \
  --collection=endpoint_groups \
  --file=backup_groups.json \
  --upsert
```

## Performance Optimization

### Index Strategy

**Current Indexes:**
```javascript
// endpoint_groups
db.endpoint_groups.createIndex({ sortOrder: 1 })
db.endpoint_groups.createIndex({ active: 1 })

// endpoints
db.endpoints.createIndex({ groupId: 1, sortOrder: 1 })
db.endpoints.createIndex({ active: 1 })
db.endpoints.createIndex({ lastCheckedAt: -1 })

// health_check_results
db.health_check_results.createIndex({ endpointId: 1, checkedAt: -1 })
db.health_check_results.createIndex({ checkedAt: -1 })
```

### Query Optimization Tips

1. **Always filter by indexed fields first**
   ```javascript
   // Good - filters by indexed groupId first
   db.endpoints.find({ groupId: groupId, active: true })
   
   // Less efficient - scans all documents
   db.endpoints.find({ active: true, groupId: groupId })
   ```

2. **Use aggregation pipeline for complex queries**
   ```javascript
   db.endpoints.aggregate([
     { $match: { active: true } },
     { $group: { _id: "$groupId", count: { $sum: 1 } } },
     { $sort: { count: -1 } }
   ])
   ```

3. **Limit results when possible**
   ```javascript
   db.health_check_results.find({ endpointId: id })
     .sort({ checkedAt: -1 })
     .limit(100)  // Don't fetch entire history
   ```

## Storage Estimates

Based on typical usage:

| Collection | Est. Doc Size | Est. Daily Docs | 30-Day Growth |
|------------|--------------|-----------------|---------------|
| users | 200 bytes | 1-5 | 30-150 |
| endpoint_groups | 300 bytes | 0-1 | 0-30 |
| endpoints | 500 bytes | 1-10 | 30-300 |
| health_check_results | 400 bytes | 1000-5000 | 30-150 MB |

**Total 30-day estimate**: ~50-200 MB (depends on health check frequency)

**Recommendation**: Set TTL index on health_check_results to auto-delete after 90 days

---

**Last Updated**: 2026-08-05
