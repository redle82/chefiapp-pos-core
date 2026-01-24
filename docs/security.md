# ChefIApp POS Core — Security

## Authentication

- **Provider**: Supabase Auth (Magic Link + Password)
- **Session**: JWT stored in localStorage, refreshed automatically
- **Multi-Tenant**: User → `restaurant_members` → Restaurant

## Row Level Security (RLS)

All tables have RLS enabled. Policies enforce:

```sql
-- Example: Orders only visible to restaurant members
CREATE POLICY "read_orders" ON gm_orders FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM restaurant_members
    WHERE restaurant_id = gm_orders.restaurant_id
  )
);
```

### Critical Tables with RLS

| Table | Read | Insert | Update | Delete |
|-------|------|--------|--------|--------|
| `gm_orders` | Members | Members | Members | — |
| `gm_payments` | Members | Members | — | — |
| `gm_fiscal_queue` | Members | System | System | — |
| `daily_closings` | Members | Members | — | — |

## Secrets Management

| Secret | Location | Access |
|--------|----------|--------|
| Supabase Keys | `.env.local` / Vercel | Frontend |
| Stripe Secret | Supabase Vault | Edge Functions |
| AT Fiscal Key | Supabase Vault | Edge Functions |

**Never commit secrets to git.**

## API Security

### Edge Functions

```typescript
// Always verify auth
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) {
  return new Response('Unauthorized', { status: 401 });
}
```

### DbWriteGate

All writes go through `DbWriteGate` which:

- Validates tenant context
- Logs audit trail
- Enforces business rules

## Sensitive Data

### Sanitization

- **Diff summaries**: Never send full code to external LLMs
- **Logs**: Mask card numbers, emails in error logs
- **Fiscal**: Encrypt NIF before storage

### GDPR Compliance

- Customer data deletion via `delete_customer_data` RPC
- Export via `export_customer_data` RPC
- Consent tracked in `gm_profiles.consent_given_at`

## Incident Response

1. Disable compromised API keys immediately
2. Rotate Supabase + Stripe secrets
3. Check `app_logs` for unauthorized access
4. Notify affected users if data breach
