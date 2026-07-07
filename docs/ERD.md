# ER Diagram (Mermaid)

```mermaid
erDiagram
  User ||--o{ RefreshToken : has
  User ||--o{ Incident : assigned
  User ||--o{ IncidentNote : writes
  User ||--o{ AuditLog : performs
  Log ||--o{ Threat : triggers
  Threat ||--o{ Alert : emits
  Alert ||--o| Incident : escalates
  Incident ||--o{ IncidentNote : includes
  Incident ||--o| Report : generates
```

## Normalization
- 1NF: Atomic values and no repeating groups.
- 2NF: Non-key attributes depend on full primary keys.
- 3NF: No transitive dependency between non-key attributes.

## Indexing Strategy
- Frequent filters indexed: `User.email`, `Log(source, createdAt)`, `Log.ipAddress`, `Threat(type, severity, createdAt)`, `Incident(status, createdAt)`.
