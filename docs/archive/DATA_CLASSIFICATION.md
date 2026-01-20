# DATA CLASSIFICATION — ChefIApp

> ⚠️ **INTERNAL DOCUMENT** — Not for public distribution.

**Version**: 1.0.0
**Date**: 2025-12-25

---

## 📊 CLASSIFICATION MATRIX

| Data Type | Storage Location | Sync Behavior | Sensitivity | Retention |
| :--- | :--- | :--- | :--- | :--- |
| **User Email** | Cloud | Session | 🔴 High | Account lifetime |
| **User Session Token** | Local + Cloud | Session | 🔴 High | 24h expiry |
| **Restaurant Profile** | Cloud | On-demand | 🟡 Medium | Account lifetime |
| **Menu Items** | Cloud | On-demand | 🟢 Low | Account lifetime |
| **Orders (Active)** | Local + Cloud | Realtime | 🟡 Medium | 90 days |
| **Orders (Archived)** | Cloud | On-demand | 🟢 Low | 2 years |
| **Staff Tasks** | Local only (Preview) | None | 🟢 Low | Session only |
| **Payment Tokens** | Stripe (external) | Never stored locally | 🔴 High | Via Stripe |
| **Audit Logs** | Cloud | Append-only | 🔴 High | 7 years |

---

## 🔐 SENSITIVITY LEVELS

### 🔴 HIGH
- Encrypted at rest and in transit.
- Access requires authentication.
- Logged for audit purposes.

### 🟡 MEDIUM
- Encrypted in transit.
- May be cached locally.
- Sync-protected.

### 🟢 LOW
- Publicly visible or non-sensitive.
- May be cached aggressively.

---

## 🌐 DATA FLOW

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Client    │──────▶│   API       │──────▶│  Database   │
│ (IndexedDB) │◀──────│ (Node.js)   │◀──────│ (Postgres)  │
└─────────────┘       └─────────────┘       └─────────────┘
       │                     │
       ▼                     ▼
┌─────────────┐       ┌─────────────┐
│  Offline Q  │       │   Stripe    │
│  (Local)    │       │  (External) │
└─────────────┘       └─────────────┘
```

---

## 📱 LOCAL STORAGE (IndexedDB)

| Store | Purpose | Encrypted | Max Size |
| :--- | :--- | :--- | :--- |
| `offline_queue` | Pending sync operations | No (ephemeral) | 10MB |
| `orders_cache` | Recent orders | No | 50MB |
| `session` | Auth state | Yes (via token) | 1KB |

---

## ☁️ CLOUD STORAGE (PostgreSQL)

| Table | Contains | Encrypted | Backup |
| :--- | :--- | :--- | :--- |
| `users` | Email, auth tokens | Yes | Daily |
| `companies` | Business info | No | Daily |
| `restaurants` | Restaurant profiles | No | Daily |
| `orders` | Order history | No | Daily |
| `event_store` | Audit trail | No | Daily |

---

## 🗑️ DATA DELETION

### User Request
1. User contacts support.
2. All personal data anonymized within 30 days.
3. Audit logs retained (anonymized).

### Automatic
- Session tokens: 24h.
- Offline queue: On successful sync.
- Order cache: 90 days.

---

*Goldmonkey Empire*
*Sistema Operacional para Restauração*
