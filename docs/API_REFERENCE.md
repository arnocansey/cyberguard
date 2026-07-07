# API Structure

## Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/refresh` (rotates refresh token)
- POST `/api/auth/logout`
- POST `/api/auth/2fa/setup`
- POST `/api/auth/2fa/verify`
- POST `/api/auth/2fa/disable`
- POST `/api/auth/sessions/revoke-all`

## Logs
- POST `/api/logs/upload`
- GET `/api/logs`
- GET `/api/logs/:id`

## Threats
- GET `/api/threats`
- GET `/api/threats/stats`

## Alerts (Triage Queue)
- GET `/api/alerts` (query: `status`, `severity`, `assignedToId`, `page`, `pageSize`, `sortBy`, `sortOrder`)
- PATCH `/api/alerts/:id`

## Incidents
- POST `/api/incidents`
- PATCH `/api/incidents/:id`
- GET `/api/incidents`

## Reports
- GET `/api/reports`
- GET `/api/reports/:id/download`

## Admin
- GET `/api/admin/summary`
- GET `/api/admin/users` (query: `search`, `role`, `page`, `pageSize`)
- PATCH `/api/admin/users/:id/role`
- GET `/api/admin/audit-logs` (query: `search`, `page`, `pageSize`)
- GET `/api/admin/scheduler` (scheduler/cron status)
- POST `/api/admin/scheduler/run` (body: `{ task: "search_jobs" | "auto_threat_scan" | "alert_escalation" | "all" }`)

## Search / Events Explorer
- GET `/api/search/events` (query: `query`, `from`, `to`, `severity`, `page`, `pageSize`, `sortBy`, `sortOrder`)
- GET `/api/search/events/export` (CSV)
- GET `/api/search/saved-searches`
- POST `/api/search/saved-searches`
- GET `/api/search/saved-searches/:id/run`
- DELETE `/api/search/saved-searches/:id`
- GET `/api/search/jobs`
- POST `/api/search/jobs`
- PATCH `/api/search/jobs/:id`
- GET `/api/search/alert-rules`
- POST `/api/search/alert-rules`
- POST `/api/search/incidents/bulk`

## Correlation Rules
- GET `/api/correlation-rules`
- POST `/api/correlation-rules`
- PATCH `/api/correlation-rules/:id`
- DELETE `/api/correlation-rules/:id`
- GET `/api/correlation-rules/:id/simulate`

## Dashboard Panels / Layouts
- GET `/api/dashboard/panels`
- POST `/api/dashboard/panels`
- PATCH `/api/dashboard/panels/:id`
- POST `/api/dashboard/panels/reorder`
- GET `/api/dashboard/panels/:id/data`
- GET `/api/dashboard/layouts` (query: `teamKey`)
- POST `/api/dashboard/layouts`
- POST `/api/dashboard/layouts/:id/apply`

## Ops
- GET `/health` (db + ai aggregated health)
- Scheduled search jobs run in backend worker every 60s and emit alerts when threshold is exceeded.

See Swagger at `/api-docs` for request/response examples and status codes.
