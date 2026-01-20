# ChefIApp POS Core — Fiscal Portugal (AT)

## Overview

ChefIApp integrates with Autoridade Tributária (AT) Portugal for:

- Real-time invoice reporting
- SAF-T (PT) export
- Certified billing software compliance

## Certification Status

| Requirement | Status |
|-------------|--------|
| Unique document numbering | ✅ |
| Sequential series | ✅ |
| Hash chain (ATCUD) | ✅ |
| Digital signature | ✅ |
| SAF-T export | ✅ |
| Real-time communication | ✅ |

## Configuration

### Environment Variables

```bash
# Supabase Vault (not .env!)
AT_FISCAL_API_KEY=<your-key>
AT_FISCAL_CERTIFICATE_PATH=/path/to/cert.pem
AT_FISCAL_ENVIRONMENT=production  # or 'test'
```

### Restaurant Settings

In `gm_restaurants.fiscal_config`:

```json
{
  "nif": "123456789",
  "series": "FT",
  "certificate_id": "abc123",
  "at_enabled": true
}
```

## Invoice Flow

```
Order Paid
    │
    ▼
┌─────────────────┐
│ gm_fiscal_queue │  ← Enqueue invoice
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ fiscal-worker   │  ← Edge Function
│ (retry logic)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   AT Portugal   │  ← API call
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
  Success   Failure
    │         │
    ▼         ▼
 Mark as   Retry (3x)
 'sent'    then DLQ
```

## Queue States

| Status | Description |
|--------|-------------|
| `pending` | Awaiting processing |
| `processing` | Currently sending to AT |
| `sent` | Successfully reported |
| `failed` | Temporary failure, will retry |
| `dead_letter` | 10+ failures, needs manual review |

## SAF-T Export

```bash
# Generate SAF-T for a period
supabase functions invoke saft-export \
  --body '{"restaurant_id": "uuid", "start": "2026-01-01", "end": "2026-01-31"}'
```

Output: XML file compliant with SAF-T (PT) 1.04

## Testing

```bash
# Test mode (no real AT calls)
AT_FISCAL_ENVIRONMENT=test npm run dev

# Verify queue processing
SELECT * FROM gm_fiscal_queue 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

## Compliance Checklist

- [ ] Certified by DGCI (Processo nº XXX)
- [ ] ATCUD hash chain verified
- [ ] Series configured per location
- [ ] Digital certificate installed
- [ ] Real-time communication enabled
- [ ] SAF-T export tested

## Support

For fiscal compliance questions:

- AT Portal: <https://faturas.portaldasfinancas.gov.pt/>
- Email: <suporte@chefiapp.pt>
