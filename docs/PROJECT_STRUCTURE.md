# Project Structure

## Backend
- `src/config` (env, prisma, logger, swagger)
- `src/controllers`
- `src/services`
- `src/routes`
- `src/middleware` (auth, audit, request-context, validation, error)
- `src/utils`
- `scripts` (db backup/restore)
- `tests` (jest + supertest)
- `prisma/schema.prisma`

## Frontend
- `app/login`
- `app/register`
- `app/dashboard`
- `app/logs`
- `app/threats`
- `app/incidents`
- `app/reports`
- `app/admin`
- `components`
- `lib`
- `tests` (RTL + Playwright)

## AI Microservice
- `app/main.py`
- `app/model.py`
- `models/`

## DevOps
- `docker-compose.yml`
- `infra/nginx/nginx.conf`
- `.github/workflows/ci.yml`
