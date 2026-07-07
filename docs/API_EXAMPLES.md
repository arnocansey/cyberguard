# API Request/Response Examples

## POST /api/auth/login
Request:
```json
{ "email": "admin@cyber.local", "password": "ChangeMe123!" }
```
Response `200`:
```json
{ "accessToken": "...", "refreshToken": "...", "user": { "id": "...", "email": "admin@cyber.local", "role": "ADMIN" } }
```

## POST /api/logs/upload
Form-data:
- `file`: uploaded .log file
- `source`: apache | nginx | firewall
Response `201`:
```json
{ "processed": 120, "threats": [{ "threat": {"id":"..."}, "alert": {"id":"..."} }] }
```

## GET /api/threats/stats
Response `200`:
```json
{ "totalLogs": 1200, "totalThreats": 128, "threatCategories": [], "topAttackerIps": [], "riskScore": 10.67 }
```

## PATCH /api/incidents/:id
Request:
```json
{ "status": "CLOSED", "resolution": "IP blocked at firewall", "note": "Mitigated and verified" }
```
Response `200`: updated incident object with report reference after closure.

## Status Codes
- `200` success retrieval/update
- `201` resource created
- `400` validation failure
- `401` unauthorized
- `403` forbidden
- `404` missing resource
- `409` conflict (duplicate email)
- `500` internal error
