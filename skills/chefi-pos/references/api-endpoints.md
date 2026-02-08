# ChefIApp POS CORE — API Endpoints Reference

## Base URLs

| Environment | URL                                            |
| ----------- | ---------------------------------------------- |
| Local Dev   | `http://localhost:4320`                        |
| PostgREST   | `http://localhost:3001`                        |
| Production  | `https://api.chefiapp.com` (quando disponível) |

## Authentication

### Request Magic Link

```http
POST /api/auth/request-magic-link
Content-Type: application/json

{"email": "user@example.com"}
```

**Response 200:**

```json
{
  "ok": true,
  "dev_token": "abc123...",
  "dev_link": "http://localhost:4320/api/auth/verify-magic-link?token=abc123..."
}
```

### Verify Magic Link

```http
GET /api/auth/verify-magic-link?token=<dev_token>
```

**Response 200:**

```json
{
  "ok": true,
  "email": "user@example.com",
  "restaurant_id": "00000000-0000-0000-0000-000000000001",
  "session_token": "abc123..."
}
```

After verification, include in all requests:

```
x-chefiapp-token: <session_token>
```

---

## Health

### System Health

```http
GET /health
GET /api/health
```

**Response 200:**

```json
{
  "status": "ok",
  "timestamp": "2026-02-07T00:00:00.000Z",
  "version": "1.0.0",
  "services": { "database": "up", "api": "up" }
}
```

**Response 503 (degraded):**

```json
{
  "status": "degraded",
  "timestamp": "...",
  "version": "1.0.0",
  "services": { "database": "down", "api": "up" },
  "reason": "DB_UNAVAILABLE"
}
```

---

## Orders

### Create Order

```http
POST /api/orders
x-chefiapp-token: <token>
Content-Type: application/json

{
  "tableId": "mesa-1",
  "items": [
    {
      "item_id": "item-1",
      "name": "X-Burger",
      "quantity": 2,
      "price_snapshot_cents": 1500
    }
  ],
  "restaurantId": "<uuid>",  // optional, from env if missing
  "companyId": "<uuid>"       // optional
}
```

**Response 201:**

```json
{
  "order_id": "550e8400-...",
  "state": "OPEN",
  "table_id": "mesa-1",
  "items": [...],
  "total_cents": 0
}
```

### Get Order

```http
GET /api/orders/<order_id>
x-chefiapp-token: <token>
```

### Update Order (OPEN only)

```http
PATCH /api/orders/<order_id>
x-chefiapp-token: <token>
Content-Type: application/json

{"items": [...]}
```

**Error 400 (if LOCKED/CLOSED):**

```json
{ "error": "ORDER_IMMUTABLE", "message": "Cannot modify order in locked state" }
```

### Lock Order (OPEN → LOCKED)

```http
POST /api/orders/<order_id>/lock
x-chefiapp-token: <token>
```

Calculates `total_cents = sum(quantity × price_snapshot_cents)` and makes order immutable.

### Close Order (LOCKED → CLOSED)

```http
POST /api/orders/<order_id>/close
x-chefiapp-token: <token>
```

Terminal state. Can also go directly from OPEN → CLOSED (skips LOCKED).

---

## Shift / Cash Register (via PostgREST)

### Open Cash Register

```http
POST http://localhost:3001/rpc/open_cash_register_atomic
Content-Type: application/json

{
  "p_restaurant_id": "<uuid>",
  "p_name": "Caixa Principal",
  "p_opened_by": "Operador TPV",
  "p_opening_balance_cents": 5000
}
```

### Check Active Shift

```http
GET http://localhost:3001/gm_cash_registers?restaurant_id=eq.<uuid>&status=eq.open
```

### Close Shift

```http
PATCH http://localhost:3001/gm_cash_registers?id=eq.<shift_id>
Content-Type: application/json

{"status": "closed", "closed_at": "2026-02-07T23:00:00Z"}
```

### Shift Logs

```http
GET http://localhost:3001/shift_logs?restaurant_id=eq.<uuid>&order=started_at.desc
```

---

## Menu

### List Menu Items

```http
GET http://localhost:3001/gm_menu_items?restaurant_id=eq.<uuid>&select=*
```

### Search by Category

```http
GET http://localhost:3001/gm_menu_items?restaurant_id=eq.<uuid>&category=eq.burgers
```

---

## Stock

### All Stock Items

```http
GET http://localhost:3001/gm_stock?restaurant_id=eq.<uuid>
```

### Low Stock Alert

```http
GET http://localhost:3001/gm_stock?restaurant_id=eq.<uuid>&current_stock=lt.min_stock
```

---

## Staff

### List Active Staff

```http
GET http://localhost:3001/gm_staff?restaurant_id=eq.<uuid>&status=eq.active
```

---

## Error Codes

| Code                       | HTTP | Description                       |
| -------------------------- | ---- | --------------------------------- |
| `SESSION_REQUIRED`         | 401  | Missing `x-chefiapp-token` header |
| `TOKEN_REQUIRED`           | 400  | Token parameter missing           |
| `TOKEN_INVALID_OR_EXPIRED` | 401  | Token expired or invalid          |
| `ORDER_NOT_FOUND`          | 404  | Order UUID doesn't exist          |
| `ORDER_IMMUTABLE`          | 400  | Order is LOCKED or CLOSED         |
| `INVALID_STATE_TRANSITION` | 400  | Cannot transition between states  |
| `ORDER_ALREADY_CLOSED`     | 400  | Order is in terminal CLOSED state |
| `INVALID_REQUEST`          | 400  | Malformed request body            |
| `INTERNAL_ERROR`           | 500  | Server error                      |

## PostgREST Query Patterns

PostgREST uses special query syntax:

| Operator | Meaning          | Example                       |
| -------- | ---------------- | ----------------------------- |
| `eq.`    | Equal            | `?state=eq.OPEN`              |
| `neq.`   | Not equal        | `?state=neq.CLOSED`           |
| `lt.`    | Less than        | `?current_stock=lt.10`        |
| `gt.`    | Greater than     | `?total_cents=gt.5000`        |
| `gte.`   | Greater or equal | `?created_at=gte.2026-02-07`  |
| `like.`  | Pattern match    | `?name=like.*burger*`         |
| `in.`    | In list          | `?state=in.(OPEN,LOCKED)`     |
| `order`  | Sort             | `?order=created_at.desc`      |
| `limit`  | Limit rows       | `?limit=10`                   |
| `select` | Choose columns   | `?select=id,name,total_cents` |
