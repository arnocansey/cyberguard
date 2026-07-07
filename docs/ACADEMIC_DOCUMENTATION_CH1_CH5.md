# Abstract
This project presents an AI-powered cybersecurity SaaS platform for centralized log ingestion, threat detection, and incident response. It combines modern web technologies with machine learning to detect and classify attacks in near real-time.

# Chapter 1: Introduction
## Background
Organizations face increasing attack volume and need automated SOC workflows.
## Problem Statement
Existing manual workflows delay threat response and increase mean-time-to-remediate.
## Objectives
- Build scalable detection pipeline
- Provide real-time alerting
- Standardize incident handling and reporting

# Chapter 2: Literature Review
- SIEM platforms centralize telemetry but can be costly and complex.
- ML-assisted detection improves anomaly recognition beyond static rules.
- Modern SOC architectures use microservices and streaming alerts.

# Chapter 3: Methodology
## Architecture
- Next.js frontend dashboard
- Node.js API backend with Prisma/PostgreSQL
- Python microservice for ML inference
- Socket.io for real-time alerts
## Data Flow
1. Upload logs
2. Parse into structured records
3. Send features to AI service
4. Persist threat predictions and generate alerts
5. Escalate to incidents and reports

# Chapter 4: System Design
## ER Model
See `docs/ERD.md`.
## Flowchart (Text)
Log Upload -> Parsing -> AI Classification -> Threat Storage -> Alert Broadcast -> Incident Response -> Report Generation
## Security Design
JWT + refresh tokens, RBAC, helmet, rate limiting, CSRF, validation, audit logs.

# Chapter 5: Testing, Results, and Future Work
## Testing Strategy
Unit, integration, API contract, and load tests.
## Expected Results
Reduced detection latency and consistent incident closure workflow.
## Future Improvements
- Online model retraining
- Threat intel feed integration
- Multi-region deployment
- Advanced UEBA and MITRE ATT&CK mapping

# References
- NIST SP 800-61 Incident Handling Guide
- OWASP ASVS
- Splunk and IBM QRadar official documentation
