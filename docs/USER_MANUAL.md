# User Manual

This manual explains how to use the CyberGuard platform as an Admin or Security Analyst.

## 1. Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- AI service running on `http://localhost:8000`
- Database migrated and seeded

## 2. Login and Roles
### 2.1 Default accounts
- Admin: `admin@cyber.local` / `ChangeMe123!`
- Analyst: `analyst@cyber.local` / `ChangeMe123!`

### 2.2 Role behavior
- `ADMIN`: full access including `/admin` and enterprise governance endpoints.
- `SECURITY_ANALYST`: operational SOC workflows without admin-only controls.

## 3. Tenant Usage
### 3.1 Set active tenant in browser
Open browser console and run:
```js
localStorage.setItem("tenantId", "default")
```
You can switch tenant by changing the value and refreshing.

### 3.2 Verify tenant enforcement
Call:
- `GET /api/auth/me`

You will receive:
- token tenant id
- effective tenant id
- tenant metadata (override, source)

## 4. Core Workflows

## 4.1 Upload logs
1. Go to `Logs`.
2. Select `.log` or `.txt` file.
3. Choose source (`apache`, `nginx`, `firewall`).
4. Click `Upload`.

Expected result:
- Logs stored
- Threats generated (if detected)
- Alerts created
- Detection summary displayed

## 4.2 Clear logs for fresh testing
1. Go to `Logs`.
2. Click `Clear all logs`.
3. Confirm in modal.

Warning:
- This removes logs and related generated objects for active tenant context.

## 4.3 Monitor threats
1. Go to `Threats`.
2. Review type, severity, confidence, linked alert.
3. Use `Open in incidents` to begin incident response.
4. Use `Ask Copilot` for one-click context-guided triage.

## 4.4 Incident management
1. Go to `Incidents`.
2. Create incident from alert.
3. Assign analyst.
4. Add investigation notes and status updates.
5. Close incident with resolution.

On close:
- Report PDF is generated and linked.

## 4.5 Reports
1. Go to `Reports`.
2. Download incident-linked reports.

## 4.6 Search / Events Explorer
1. Go to `Search`.
2. Enter query and time range.
3. Run search with server-side pagination/sorting.
4. Export CSV when needed.

Macro examples:
- `macro=auth_failures`
- `macro=web_attacks`
- `macro=suspicious_posts`

## 4.7 Dashboard
- Use query-driven panels and monitoring charts.
- Combine metrics and trend visualizations for SOC monitoring.

## 4.8 Admin Panel
(ADMIN role only)
- User management and role changes
- Alert triage queue
- Correlation rule management
- Audit trail viewer
- CSV exports

## 5. SOC Copilot Chatbot
### 5.1 Open chatbot
- Click floating `SOC Copilot` button.

### 5.2 Ask questions
- Examples:
  - `How do I triage this alert?`
  - `Give me SQL injection containment steps.`

### 5.3 Streaming behavior
- If socket is live, responses stream chunk-by-chunk.
- If not, fallback REST response is used.
- Live/Fallback badge is shown in chat header.

### 5.4 One-click contextual prompts
- `Threats` and `Admin` pages have `Ask Copilot` actions that open chat with alert context.

## 6. Enterprise APIs (Operational Use)
The following endpoints are available for advanced workflows:

### 6.1 SOAR
- `GET /api/enterprise/soar/playbooks`
- `POST /api/enterprise/soar/run`

### 6.2 Threat Intel
- `GET /api/enterprise/threat-intel/iocs`
- `POST /api/enterprise/threat-intel/iocs`
- `GET /api/enterprise/threat-intel/matches`

### 6.3 UEBA
- `GET /api/enterprise/ueba/anomalies`

### 6.4 Assets
- `GET /api/enterprise/assets`
- `POST /api/enterprise/assets`

### 6.5 Compliance
- `GET /api/enterprise/compliance/overview`

### 6.6 Report Scheduling
- `GET /api/enterprise/report-schedules`
- `POST /api/enterprise/report-schedules`

### 6.7 ML Lifecycle
- `POST /api/enterprise/ml/feedback`
- `GET /api/enterprise/ml/drift`

### 6.8 Detection Versioning
- `GET /api/enterprise/detection/rules/:ruleId/versions`
- `POST /api/enterprise/detection/rules/:ruleId/versions`

## 7. Verification Endpoints
- Backend live: `GET /health/live`
- Backend ready: `GET /health/ready`
- Backend metrics: `GET /metrics`
- API docs: `/api-docs`
- Auth profile and tenant verification: `GET /api/auth/me`

## 8. Common Troubleshooting
### 8.1 `Missing token`
Cause:
- Request sent without `Authorization: Bearer <accessToken>`.
Fix:
- Log in again and retry with valid access token.

### 8.2 `Forbidden` on admin page
Cause:
- Non-admin role.
Fix:
- Use admin account.

### 8.3 `ENOTFOUND ai-service`
Cause:
- AI service URL/network not reachable.
Fix:
- Ensure `AI_SERVICE_URL` in backend env points to running AI service.

### 8.4 Prisma/DB connection errors
Cause:
- Invalid DB URL or DB unavailable.
Fix:
- Verify `DATABASE_URL`, database status, network access.

### 8.5 Theme looks inconsistent
Fix:
- Hard refresh the browser and clear stale local storage if needed.

## 9. Recommended Daily SOC Routine
1. Check dashboard for spikes and high-severity counts.
2. Review threat queue and triage new alerts.
3. Convert critical alerts into incidents.
4. Use Copilot for treatment guidance and next-step planning.
5. Close resolved incidents with documentation and report generation.
6. Review audit logs and unresolved queue before end of shift.

## 10. Scheduler, Auto-Scan, and Escalation
### 10.1 Scheduled log scanning
- Background scheduler runs on cron expressions.
- Auto-threat scan checks unclassified logs and sends them to AI.

### 10.2 Auto-threat detection every X minutes
Configure in `backend/.env`:
- `AUTO_THREAT_SCAN_ENABLED=true`
- `AUTO_THREAT_SCAN_CRON=*/5 * * * *`
- `AUTO_THREAT_SCAN_BATCH_SIZE=200`

### 10.3 Cron job processing
- Scheduler tick interval: `SCHEDULER_TICK_SECONDS`.
- Tasks executed by cron:
  - `SEARCH_JOB_CRON`
  - `AUTO_THREAT_SCAN_CRON`
  - `ALERT_ESCALATION_CRON`

### 10.4 Alert escalation system
- Unacknowledged NEW alerts can be auto-escalated after threshold minutes.
- Config:
  - `ALERT_ESCALATION_MINUTES=15`
  - `ALERT_ESCALATION_SEVERITIES=HIGH,CRITICAL`
  - `ALERT_ESCALATION_TARGET_SEVERITY=CRITICAL`
- Escalations create audit trail entries (`alert.escalated`).

### 10.5 Admin controls
Admin panel includes Scheduler controls:
- View scheduler task status and last run
- Run one task or all tasks on demand
- Endpoint: `GET /api/admin/scheduler`
- Endpoint: `POST /api/admin/scheduler/run`