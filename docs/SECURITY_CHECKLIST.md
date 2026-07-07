# Security Checklist

- [x] Passwords hashed with bcrypt
- [x] JWT access + refresh token flow
- [x] Refresh token rotation
- [x] Logout and revoke-all sessions
- [x] 2FA-ready TOTP endpoints
- [x] RBAC middleware
- [x] Helmet headers
- [x] CORS allowlist
- [x] Global rate limiter
- [x] Input validation (Joi)
- [x] XSS mitigation (`xss-clean`)
- [x] HPP mitigation
- [x] CSRF middleware support
- [x] SQL injection risk reduced through Prisma ORM
- [x] Audit logging for critical routes
- [x] Request ID propagation
- [x] Structured logging (`pino`)
- [x] Secure env variable templates
- [x] API docs via Swagger

## Recommended Next Hardening
- Add secret rotation and KMS integration
- Encrypt sensitive DB columns at rest
- Add WAF and IDS upstream
- Add brute-force lockout policy on auth endpoints
- Add signed API keys for service-to-service traffic
- Add SIEM export sink (Splunk/ELK)
