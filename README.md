# AI-Powered Cybersecurity Threat Detection & Incident Response Platform

Enterprise-grade SaaS-style cybersecurity platform with log ingestion, AI threat detection, real-time alerting, and incident response workflows.

## Tech Stack
- Frontend: Next.js, TailwindCSS, Recharts, Axios, React Router
- Backend: Node.js, Express.js, PostgreSQL, Prisma, JWT, bcrypt, Socket.io
- AI Service: Python, Flask, scikit-learn
- DevOps: Docker, Docker Compose, Nginx, Swagger, GitHub Actions

## Monorepo Structure
- `backend/`: REST API, auth, RBAC, logs/threats/incidents/reports modules
- `frontend/`: SOC dashboard and management pages
- `ai-service/`: ML inference microservice
- `infra/`: Nginx reverse proxy configuration
- `docs/`: architecture, ERD, testing, security, DB/deployment operations

## New Platform Ops Upgrades
- Role-scoped UI navigation (admin-only items hidden for analyst mode)
- Clear admin access-denied UX (no misleading zero metrics)
- Request/error/latency metrics endpoint (`/metrics`)
- AI timeout/retry metrics with readiness degradation threshold
- Health monitor script for readiness + timeout spike alerts
- Repeatable demo reset script and smoke workflow test suite
- CI gates: Prisma validate, smoke tests, security audit
- Production bootstrap script and scheduled backup helper

## Run with Docker
```bash
docker compose up --build
```

Endpoints:
- App: `http://localhost`
- Backend API: `http://localhost/api`
- Swagger: `http://localhost/api-docs`
- Backend Liveness: `http://localhost:5000/health/live`
- Backend Readiness: `http://localhost:5000/health/ready`
- Backend Metrics: `http://localhost:5000/metrics`
- AI Liveness: `http://localhost:8000/health/live`
- AI Readiness: `http://localhost:8000/health/ready`

## Local Development
1. Backend
```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run seed
npm run dev
```

2. AI Service
```bash
cd ai-service
python -m venv .venv
. .venv/Scripts/Activate.ps1
pip install -r requirements.txt
python -m app.main
```

3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Demo Reset
```bash
cd backend
npm run demo:reset
```
Resets demo data and reseeds:
- `admin@cyber.local` / `ChangeMe123!`
- `analyst@cyber.local` / `ChangeMe123!`

## Observability
Run one-time health check alert:
```bash
cd backend
set HEALTH_WATCH_ONCE=true&& npm run health:watch
```

Run continuous watcher:
```bash
cd backend
npm run health:watch
```

## Database Operations
```bash
cd backend
npm run backup
npm run restore -- backups/<file>.sql
```

Schedule nightly backup on Windows:
```powershell
cd backend
npm run backup:schedule
```

## Tests
Backend:
```bash
cd backend
npm test
npm run test:smoke
```

Frontend:
```bash
cd frontend
npm test
npm run test:e2e
```

## Production Bootstrap
```bash
cd backend
npm run prod:bootstrap
```

Optional seed during bootstrap:
```bash
cd backend
set RUN_SEED=true&& npm run prod:bootstrap
```

## Production Setup
- Use `backend/.env.production.example`
- Use `frontend/.env.production.example`
- Set strict CORS list in `CORS_ALLOWED_ORIGINS`
- Enable:
  - `ENFORCE_CSRF=true`
  - `CSRF_COOKIE_SECURE=true`
  - `TRUST_PROXY=true`
  - `REQUIRE_STRONG_SECRETS=true`
- Keep `AI_TIMEOUT_ALERT_THRESHOLD` tuned for your traffic profile

See `docs/DEPLOYMENT.md` and `.github/workflows/ci.yml`.

## Seed Credentials
- Admin: `admin@cyber.local` / `ChangeMe123!`
- Analyst: `analyst@cyber.local` / `ChangeMe123!`

## Documentation
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/ERD.md`
- `docs/API_REFERENCE.md`
- `docs/API_EXAMPLES.md`
- `docs/ACADEMIC_DOCUMENTATION_CH1_CH5.md`
- `docs/TESTING_STRATEGY.md`
- `docs/SECURITY_CHECKLIST.md`
- `docs/DB_OPERATIONS.md`
- `docs/DEPLOYMENT.md`
- `docs/IMPLEMENTATION_LOG.md`
- `docs/USER_MANUAL.md`
- `docs/USER_MANUAL_PRINT.md` (print-friendly markdown)
- `docs/USER_MANUAL_PRINT.html` (open in browser then Print to PDF)
## Scheduler and Escalation
New automation features are included:
- Scheduled log scanning
- Auto-threat detection every X minutes
- Cron-driven job processing
- Alert escalation for stale NEW alerts

Key backend env variables:
- `SCHEDULER_ENABLED`, `SCHEDULER_TICK_SECONDS`
- `SEARCH_JOB_CRON`
- `AUTO_THREAT_SCAN_ENABLED`, `AUTO_THREAT_SCAN_CRON`, `AUTO_THREAT_SCAN_BATCH_SIZE`
- `ALERT_ESCALATION_ENABLED`, `ALERT_ESCALATION_CRON`, `ALERT_ESCALATION_MINUTES`
- `ALERT_ESCALATION_SEVERITIES`, `ALERT_ESCALATION_TARGET_SEVERITY`, `ALERT_ESCALATION_MAX_PER_RUN`

Admin endpoints:
- `GET /api/admin/scheduler`
- `POST /api/admin/scheduler/run`