# FieldMate Database Design (Chapter 4)

## Storage technology
FieldMate uses **IndexedDB** (`FieldMateDB`, version 2) in the browser for offline-first storage. This satisfies the database systems development requirement for a structured, normalized data layer.

## Entity-Relationship overview

```
┌─────────────┐       ┌──────────────────┐
│    users    │       │     settings     │
│─────────────│       │──────────────────│
│ email (PK)  │       │ key (PK)         │
│ name        │       │ value            │
│ passwordHash│       └──────────────────┘
│ county      │              │
│ createdAt   │              │ activeUser → users.email
└─────────────┘              │
                             │
┌─────────────┐       ┌──────┴───────────┐
│   weather   │       │    diagnoses     │
│─────────────│       │──────────────────│
│ location(PK)│       │ id (PK)          │
│ temp, etc.  │       │ cropType         │
└─────────────┘       │ diseaseName      │
                      │ confidence       │
                      │ imageUrl         │
                      │ recommendation*  │
                      │ timestamp        │
                      │ syncStatus       │
                      │ analysisMode     │
                      └──────────────────┘
```

## Normalization (3NF)

| Store | 3NF justification |
|-------|---------------------|
| **users** | Farmer identity stored once. Email is the primary key. No duplicate user rows per diagnosis. |
| **settings** | Key-value store avoids repeating language, API key, voice prefs on every record. |
| **diagnoses** | Each scan is one fact record. User link is via `settings.activeUser`, not duplicated user name/email on every diagnosis. |
| **weather** | Weather telemetry keyed by location; not embedded in diagnoses. |

*Embedded `recommendation` JSON is a denormalized snapshot of advice at scan time (intentional for offline PDF/history integrity).

## CRUD operations

| Entity | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| users | Register | Login, getUserByEmail | Update profile (Settings) | — |
| diagnoses | Scan leaf | History, Results | — | History delete, Clear all |
| settings | saveSetting | getSetting | updateSettings | — |
| weather | saveWeather (cache) | getCachedWeather | — | — |

## Security
- Passwords: salted SHA-256 hash (`FieldMate-UasinGishu-2025` + password) before storage.
- Validation: email format, name length 2–80, password minimum 8 characters.

## Files
- `src/services/db.ts` — schema and CRUD
- `src/services/auth.ts` — authentication
- `src/types/index.ts` — TypeScript entity definitions
