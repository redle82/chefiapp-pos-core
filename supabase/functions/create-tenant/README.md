# ⚠️ CORE SYSTEM: Birth Engine (create-tenant)

**DO NOT MODIFY THIS FUNCTION WITHOUT STRICT REVIEW.**

This function is responsible for the atomic creation of a new Tenant (Restaurante + Owner + Data). It is the single source of truth for "Birth" in the system.

## The Ritual (Flow)

1.  **Identity**: Creates Supabase Auth User (`admin.createUser`).
2.  **Tenant**: Creates `gm_restaurants` record with normalized slug.
    *   *Constraint*: Slug must be unique. Code adds 6-char UUID hash.
3.  **Permissions**: Creates `profiles` and `restaurant_members` (Owner role).
4.  **Seed**: Creates default `menu_categories` and `menu_items` (Demo Data).
5.  **Pulse**: Inserts initial `empire_pulses` (Type: BIRTH).

## Safety Protocols (Rollback)

If any step fails, the system attempts a **Full Rollback** to prevent "Zombie Tenants" or "Ghost Users".

- **If Restaurant creation fails**: User is deleted immediately.
- **If Profile/Member creation fails**: Restaurant is deleted AND User is deleted.

## Error Codes

- **409 Conflict**: `OWNER_ALREADY_EXISTS` - User tried to signup with existing email. Frontend determines redirect to Login.
- **400 Bad Request**: Validation missing or fatal system error.

## Maintenance

- To update Seed Data: Modify step 5.
- To update Default Plan: Modify `gm_restaurants.insert({ plan: ... })`.
