# CyberGuard User Manual (Print Edition)

Version: 1.0  
Date: February 2026

## Table of Contents
1. Introduction
2. Access and Roles
3. Quick Start
4. Core Workflows
5. SOC Copilot
6. Enterprise Operations
7. Troubleshooting
8. Daily Operations Checklist

## 1. Introduction
CyberGuard is an AI-powered cybersecurity threat detection and incident response platform. It ingests logs, classifies threats, raises alerts, and supports full incident lifecycle management.

## 2. Access and Roles
Default demo users:
- Admin: `admin@cyber.local` / `ChangeMe123!`
- Security Analyst: `analyst@cyber.local` / `ChangeMe123!`

Role behavior:
- `ADMIN`: full access, including admin and governance features.
- `SECURITY_ANALYST`: SOC operational workflow access.

## 3. Quick Start
1. Start backend, frontend, and AI service.
2. Log in with role-appropriate credentials.
3. Upload sample logs from `Logs`.
4. Open `Threats` and begin triage.
5. Create incidents and close with resolution notes.

Screenshot Placeholder:
- `[SCREENSHOT: Login page]`
- `[SCREENSHOT: Dashboard overview]`

## 4. Core Workflows
### 4.1 Log Upload
1. Navigate to `Logs`.
2. Select log file and source type.
3. Submit upload.

Expected output:
- Parsed logs saved
- AI classification invoked
- Alerts created for actionable detections

Screenshot Placeholder:
- `[SCREENSHOT: Logs upload form]`

### 4.2 Threat Monitoring
1. Open `Threats`.
2. Review severity, confidence, and threat type.
3. Use one-click action to open incidents with preselected alert.

Screenshot Placeholder:
- `[SCREENSHOT: Threat list with actions]`

### 4.3 Incident Response
1. Open `Incidents`.
2. Create incident from selected alert.
3. Assign analyst, add notes, and update status.
4. Close incident to generate report.

Screenshot Placeholder:
- `[SCREENSHOT: Incident create and queue]`

### 4.4 Reports
1. Open `Reports`.
2. Download generated PDF incident reports.

Screenshot Placeholder:
- `[SCREENSHOT: Reports download table]`

## 5. SOC Copilot
SOC Copilot assists with triage and treatment guidance.

Capabilities:
- General incident response guidance
- Alert-context prompt launch from threat/admin pages
- Streaming responses when socket is available

Screenshot Placeholder:
- `[SCREENSHOT: Copilot panel open]`

## 6. Enterprise Operations
Available enterprise modules:
- SOAR playbooks
- Threat intelligence IOC matching
- UEBA anomaly insights
- Asset and compliance views
- Report scheduling
- ML feedback and drift monitoring

## 7. Troubleshooting
`Missing token`
- Ensure requests include `Authorization: Bearer <accessToken>`.

`Forbidden`
- Ensure account role is `ADMIN` for admin-only pages.

`ENOTFOUND ai-service`
- Verify `AI_SERVICE_URL` and AI service runtime.

## 8. Daily Operations Checklist
1. Review dashboard health and threat spikes.
2. Triage new alerts.
3. Create incidents for high/critical alerts.
4. Use Copilot guidance for containment and eradication.
5. Close incidents with clear resolution steps.
6. Review audit trails before shift close.