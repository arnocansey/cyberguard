# Database Operations

## Backup
```bash
cd backend
npm run backup
```

Creates SQL dump under `backend/backups/`.

## Restore
```bash
cd backend
npm run restore -- backups/backup-YYYY-MM-DD.sql
```

## Migration Strategy
- Local: `npx prisma migrate dev`
- CI/CD/Prod: `npx prisma migrate deploy`
- Validate schema: `npx prisma validate`

## Recovery Plan
1. Detect incident and put API in maintenance mode.
2. Restore latest verified backup to standby database.
3. Run integrity checks on critical tables (`users`, `incidents`, `threats`).
4. Switch application `DATABASE_URL` to recovered instance.
5. Replay missed logs from object storage queue if available.
