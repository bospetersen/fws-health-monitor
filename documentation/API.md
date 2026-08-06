# API Reference

## Base URL

```
http://localhost:3400/api
```

## Authentication

All endpoints (except `/auth/login`) require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

**Token Duration**: 24 hours

**Example:**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  http://localhost:3400/api/endpoint-groups
```

## Response Format

All responses follow a standard JSON format:

**Success Response (2xx):**
```json
{
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

**Error Response (4xx, 5xx):**
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "BadRequest"
}
```

## API Endpoints

---

## Authentication

### POST /api/auth/login

Authenticate user and receive JWT token.

**Request:**
```bash
curl -X POST http://localhost:3400/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

**Notes:**
- Token must be used in `Authorization: Bearer <token>` header for all other requests
- Token expires after 24 hours
- Password is validated against bcrypt hash in database

---

## Endpoint Groups

### POST /api/endpoint-groups

Create a new endpoint group.

**Request:**
```bash
curl -X POST http://localhost:3400/api/endpoint-groups \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production APIs",
    "sortOrder": 1,
    "active": true
  }'
```

**Request Body:**
```json
{
  "name": "string (required, 1-100 chars)",
  "sortOrder": "number (required, min: 1)",
  "active": "boolean (required)"
}
```

**Success Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Production APIs",
  "sortOrder": 1,
  "active": true,
  "createdAt": "2026-08-04T10:30:00.000Z",
  "updatedAt": "2026-08-04T10:30:00.000Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": ["name must be a string"],
  "error": "BadRequest"
}
```

---

### GET /api/endpoint-groups

Get all endpoint groups.

**Request:**
```bash
curl -X GET http://localhost:3400/api/endpoint-groups \
  -H "Authorization: Bearer <token>"
```

**Query Parameters:**
```
(none)
```

**Success Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Production APIs",
    "sortOrder": 1,
    "active": true,
    "createdAt": "2026-08-04T10:30:00.000Z",
    "updatedAt": "2026-08-04T10:30:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Staging APIs",
    "sortOrder": 2,
    "active": false,
    "createdAt": "2026-08-04T10:35:00.000Z",
    "updatedAt": "2026-08-04T10:35:00.000Z"
  }
]
```

---

### PUT /api/endpoint-groups/{id}/toggle-active

Toggle the active status of an endpoint group.

**Request:**
```bash
curl -X PUT http://localhost:3400/api/endpoint-groups/507f1f77bcf86cd799439012/toggle-active \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**URL Parameters:**
```
id: string (required) - Group ID to toggle
```

**Success Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Production APIs",
  "sortOrder": 1,
  "active": false,
  "createdAt": "2026-08-04T10:30:00.000Z",
  "updatedAt": "2026-08-04T10:40:00.000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Endpoint group not found",
  "error": "NotFound"
}
```

---

### DELETE /api/endpoint-groups/{id}

Delete an endpoint group (and associated endpoints).

**Request:**
```bash
curl -X DELETE http://localhost:3400/api/endpoint-groups/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer <token>"
```

**URL Parameters:**
```
id: string (required) - Group ID to delete
```

**Success Response (200 OK):**
```json
{
  "message": "Endpoint group deleted successfully",
  "deletedCount": 1
}
```

**Error Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Endpoint group not found",
  "error": "NotFound"
}
```

**Notes:**
- Deletes the group and all associated endpoints
- This is a destructive operation

---

### POST /api/endpoint-groups/reorder

Reorder endpoint groups.

**Request:**
```bash
curl -X POST http://localhost:3400/api/endpoint-groups/reorder \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "groupIds": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
  }'
```

**Request Body:**
```json
{
  "groupIds": ["string (required)"] - Array of group IDs in desired order
}
```

**Success Response (200 OK):**
```json
{
  "message": "Groups reordered successfully",
  "groups": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Production APIs",
      "sortOrder": 1,
      "active": true
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Staging APIs",
      "sortOrder": 2,
      "active": false
    }
  ]
}
```

---

## Endpoints

### POST /api/endpoints

Create a new endpoint.

**Request:**
```bash
curl -X POST http://localhost:3400/api/endpoints \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Status",
    "url": "https://api.example.com/status",
    "description": "Main API health check",
    "groupId": "507f1f77bcf86cd799439012",
    "sortOrder": 1,
    "active": true
  }'
```

**Request Body:**
```json
{
  "name": "string (required, 1-100 chars)",
  "url": "string (required, valid URL)",
  "description": "string (optional)",
  "groupId": "string (required, valid group ID)",
  "sortOrder": "number (required, min: 1)",
  "active": "boolean (required)"
}
```

**Success Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "name": "API Status",
  "url": "https://api.example.com/status",
  "description": "Main API health check",
  "groupId": "507f1f77bcf86cd799439012",
  "sortOrder": 1,
  "active": true,
  "createdAt": "2026-08-04T10:45:00.000Z",
  "updatedAt": "2026-08-04T10:45:00.000Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": ["url must be a URL address"],
  "error": "BadRequest"
}
```

---

### GET /api/endpoints

Get all endpoints.

**Request:**
```bash
curl -X GET http://localhost:3400/api/endpoints \
  -H "Authorization: Bearer <token>"
```

**Query Parameters:**
```
groupId (optional): Filter by group ID
active (optional): Filter by active status (true/false)
```

**Example with Query:**
```bash
curl -X GET "http://localhost:3400/api/endpoints?groupId=507f1f77bcf86cd799439012&active=true" \
  -H "Authorization: Bearer <token>"
```

**Success Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439014",
    "name": "API Status",
    "url": "https://api.example.com/status",
    "description": "Main API health check",
    "groupId": "507f1f77bcf86cd799439012",
    "sortOrder": 1,
    "active": true,
    "createdAt": "2026-08-04T10:45:00.000Z",
    "updatedAt": "2026-08-04T10:45:00.000Z"
  }
]
```

---

### DELETE /api/endpoints/{id}

Delete an endpoint.

**Request:**
```bash
curl -X DELETE http://localhost:3400/api/endpoints/507f1f77bcf86cd799439014 \
  -H "Authorization: Bearer <token>"
```

**URL Parameters:**
```
id: string (required) - Endpoint ID to delete
```

**Success Response (200 OK):**
```json
{
  "message": "Endpoint deleted successfully",
  "deletedCount": 1
}
```

**Error Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Endpoint not found",
  "error": "NotFound"
}
```

---

### PUT /api/endpoints/reorder

Reorder endpoints. Used by drag-and-drop reordering on the Manage Endpoints page.

**Request:**
```bash
curl -X PUT http://localhost:3400/api/endpoints/reorder \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '[
    {"id": "507f1f77bcf86cd799439014", "sortOrder": 0},
    {"id": "507f1f77bcf86cd799439015", "sortOrder": 1}
  ]'
```

**Request Body:**
Array of endpoint reorder objects:
```json
[
  {
    "id": "string (required)",      - Endpoint MongoDB _id
    "sortOrder": "number (required)" - New sort order (0-based, incremental)
  }
]
```

**Example Flow**:
1. User drags endpoint from position 2 to position 0 within a group
2. Frontend recalculates sortOrder for affected endpoints: `[{id: "A", sortOrder: 0}, {id: "B", sortOrder: 1}, {id: "C", sortOrder: 2}]`
3. Sends PUT request with updated array
4. Loading spinner displays over the group during the API call
5. On success, frontend updates endpoint list

**Success Response (200 OK):**
```json
{
  "message": "Endpoints reordered successfully",
  "endpoints": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "API Status",
      "sortOrder": 0
    },
    {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Database Status",
      "sortOrder": 1
    }
  ]
}
```

---

## Health Checks

### GET /api/health-check/:endpointId

Perform a health check on an endpoint.

**Request:**
```bash
curl -X GET http://localhost:3400/api/health-check/507f1f77bcf86cd799439014 \
  -H "Authorization: Bearer <token>"
```

**URL Parameters:**
```
endpointId: string (required) - Endpoint ID to check
```

**Success Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439016",
  "endpointId": "507f1f77bcf86cd799439014",
  "status": "healthy",
  "statusCode": 200,
  "responseTime": 145,
  "errorMessage": null,
  "checkedAt": "2026-08-04T10:50:00.000Z"
}
```

**Error Response (5xx - Endpoint Down):**
```json
{
  "_id": "507f1f77bcf86cd799439017",
  "endpointId": "507f1f77bcf86cd799439014",
  "status": "unhealthy",
  "statusCode": 503,
  "responseTime": 5000,
  "errorMessage": "Service Unavailable",
  "checkedAt": "2026-08-04T10:51:00.000Z"
}
```

---

### GET /api/health-check/results/:endpointId

Get health check history for an endpoint.

**Request:**
```bash
curl -X GET http://localhost:3400/api/health-check/results/507f1f77bcf86cd799439014 \
  -H "Authorization: Bearer <token>"
```

**URL Parameters:**
```
endpointId: string (required) - Endpoint ID
```

**Query Parameters:**
```
limit (optional): Max results (default: 50)
skip (optional): Skip results for pagination
days (optional): Filter last N days
```

**Example with Query:**
```bash
curl -X GET "http://localhost:3400/api/health-check/results/507f1f77bcf86cd799439014?limit=10&days=7" \
  -H "Authorization: Bearer <token>"
```

**Success Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439016",
    "endpointId": "507f1f77bcf86cd799439014",
    "status": "healthy",
    "statusCode": 200,
    "responseTime": 145,
    "errorMessage": null,
    "checkedAt": "2026-08-04T10:50:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439017",
    "endpointId": "507f1f77bcf86cd799439014",
    "status": "healthy",
    "statusCode": 200,
    "responseTime": 152,
    "errorMessage": null,
    "checkedAt": "2026-08-04T10:55:00.000Z"
  }
]
```

---

## HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Token valid but insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource already exists |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | Database connection error |

## Error Codes

Common error messages and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid credentials | Wrong username/password | Verify credentials are correct |
| Token expired | JWT expired | Log in again to get new token |
| Endpoint group not found | ID doesn't exist | Verify group ID is correct |
| url must be a URL address | Invalid URL format | Use valid HTTP(S) URL |
| name must be a string | Wrong data type | Provide name as string |
| ECONNREFUSED | Backend not running | Start backend: `pnpm dev` |
| CORS error | Frontend not whitelisted | Add frontend URL to CORS_ORIGIN |

## Rate Limiting

Currently, no rate limiting is implemented. Production deployment should include:
- Per-user rate limits
- Per-IP rate limits
- Endpoint-specific limits

## Pagination

For endpoints that return lists (future enhancement):
- `limit`: Results per page (default: 50, max: 100)
- `skip`: Results to skip (default: 0)

## Sorting

For endpoints that return lists (future enhancement):
- `sortBy`: Field to sort by
- `sortOrder`: "asc" or "desc" (default: "asc")

## Examples

### Complete Workflow

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3400/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}' \
  | jq -r '.access_token')

# 2. Create endpoint group
GROUP=$(curl -s -X POST http://localhost:3400/api/endpoint-groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Production","sortOrder":1,"active":true}' \
  | jq -r '._id')

# 3. Create endpoint
ENDPOINT=$(curl -s -X POST http://localhost:3400/api/endpoints \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"API\",\"url\":\"https://api.example.com\",\"groupId\":\"$GROUP\",\"sortOrder\":1,\"active\":true}" \
  | jq -r '._id')

# 4. Check health
curl -s -X GET http://localhost:3400/api/health-check/$ENDPOINT \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# 5. Get results
curl -s -X GET http://localhost:3400/api/health-check/results/$ENDPOINT \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

---

**Last Updated**: 2026-08-05
