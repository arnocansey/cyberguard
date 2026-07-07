# Testing Strategy

## 1. Unit Tests
- Auth service token lifecycle and 2FA verification
- Log parser variants (Apache/Nginx/firewall)
- AI feature extraction and prediction mapping

## 2. Integration Tests
- Upload log -> Threat -> Alert creation path
- Alert -> Incident -> Report generation path
- Auth register/login/refresh/logout rotation path

## 3. Security Tests
- JWT tampering
- RBAC access checks
- Rate limiting and CSRF enforcement
- Input fuzzing for validation and XSS payloads

## 4. Performance Tests
- Batch log ingestion throughput
- Socket alert fan-out latency

## 5. UI/E2E Tests
- Login/register/dashboard navigation
- Incident create/update/close workflow
- Report list and PDF download workflow

## Commands
Backend:
```bash
cd backend
npm test
```
Frontend:
```bash
cd frontend
npm test
npm run test:e2e
```
