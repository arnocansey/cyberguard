# Deployment Guide

## Production Environment Files
- `backend/.env.production.example`
- `frontend/.env.production.example`

## Build and Run
```bash
docker compose up --build -d
```

## Backend Deployment Checklist
1. Set secure JWT secrets and DB SSL URL.
2. Run `npm ci` in backend.
3. Run `npx prisma migrate deploy`.
4. Run `npm run seed` (optional for initial bootstrap only).
5. Start backend with process manager/container.

## Frontend Deployment Checklist
1. Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL`.
2. Run `npm ci && npm run build`.
3. Serve via `npm start` behind Nginx.

## CI/CD
GitHub Actions file: `.github/workflows/ci.yml`.
- Backend tests
- Frontend build
- Prisma schema validation

## Security Controls
- Enforce HTTPS at reverse proxy
- Restrict CORS to production domain
- Set `ENFORCE_CSRF=true`
- Set `TRUST_PROXY=true` when behind proxy
