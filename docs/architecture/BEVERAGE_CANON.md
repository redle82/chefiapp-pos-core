# Universal Beverage Canon

## Philosophy

**"Comida é local. Bebida é universal. O menu nunca nasce vazio."**

The Universal Beverage Canon ensures that no restaurant starts with an empty menu. While food varies by culture and locality, beverages follow predictable patterns by country.

## Architecture

### Universal Categories (Immutable)

Seven beverage categories exist across all countries:

- **Água** (Water)
- **Refrigerantes** (Soft Drinks)
- **Sucos** (Juices)
- **Cervejas** (Beers)
- **Vinhos** (Wines)
- **Bebidas Quentes** (Hot Drinks)
- **Destilados** (Spirits)

These categories cannot be deleted, only activated/deactivated.

### Country-Specific Templates

Each country has a versioned canon (e.g., `ES v1.0.0`) containing common beverages:

- **Spain (ES)**: 32 items (Coca-Cola 33cl, Café Solo, Caña, etc.)
- **Default**: 14 generic items (fallback)

### Beverage Properties

```typescript
{
  name: "Coca-Cola 33cl",
  category: "refrigerantes",
  volume: "33cl",
  system_provided: true,      // Protected from deletion
  default_visibility: false,  // Requires activation
  price_cents: null,          // Owner must set
  canon_id: "ES:refrigerantes:coca-cola-33cl"
}
```

## Lifecycle

### 1. Genesis (Automatic)

During tenant creation (`GenesisKernel.initializeSovereign`):

1. Country detected from `draft.countryCode`
2. Universal categories inserted
3. Country-specific beverages injected (inactive state)

### 2. Activation (Manual)

Owner activates beverages during onboarding:

- Set prices
- Toggle visibility
- Edit names (creates custom copy)
- Bulk activate/deactivate

### 3. Operation

- **TPV**: Shows only `available=true` products
- **KDS**: Ignores beverages (no kitchen routing)
- **Deletion**: Canon items protected by RLS policy

## Governance Rules

### Canon Items (`system_provided=true`)

- ✅ Can be deactivated (`available=false`)
- ✅ Can have price updated
- ✅ Can be copied to create custom variant
- ❌ Cannot be deleted
- ❌ Cannot change category (must be beverage category)

### Custom Items (`system_provided=false`)

- ✅ Full edit permissions
- ✅ Can be deleted freely

### Reality Check

Menu passes "Sustenance" check if:

- **Total products > 0** (active OR inactive)
- Canon injection counts toward completion

## Extending the Canon

### Adding a New Country

1. Create `merchant-portal/src/core/menu/BeverageCanon/countries/{CODE}.ts`
2. Define canon items following schema
3. Add switch case to `getBeverageCanon()`
4. Update `getAvailableCountries()`

Example:

```typescript
// BR.ts (Brazil)
export const BR_BEVERAGE_CANON: CountryBeverageCanon = {
    country: 'BR',
    version: '1.0.0',
    items: [
        { name: 'Guaraná Antarctica', category: 'refrigerantes', ... },
        // ...
    ]
};
```

### Updating Existing Canon

- Increment version number
- Add new items (non-breaking)
- Deprecate items gracefully (don't remove)

## Database Schema

### New Columns (`gm_products`)

```sql
system_provided BOOLEAN DEFAULT FALSE  -- Canon protection flag
canon_id TEXT                          -- Links to template
default_visibility BOOLEAN DEFAULT TRUE -- Initial state
```

### RLS Policy

```sql
-- Prevent deletion of canon items
CREATE POLICY "Users can delete only custom products"
ON gm_products FOR DELETE
USING (system_provided = FALSE);
```

## Integration Points

### Genesis Flow

```
initializeSovereign()
  └─> bootstrapBeverageCanon()
      ├─> Insert categories
      └─> Insert canon items (inactive)
```

### Onboarding UX

Step 6: "Ativar Bebidas Base"

- Grid view by category
- Price input per item
- Bulk activate toggle

### TPV Filter

```typescript
.eq('available', true) // Only shows activated items
```

## Migration for Existing Tenants

**Option A**: Retroactive Bootstrap

```sql
-- Run canon bootstrap for existing tenants
SELECT bootstrap_canon_for_tenant(id) 
FROM gm_restaurants 
WHERE created_at < '2026-01-18';
```

**Option B**: Flag-Based

- Add `canon_bootstrapped` column
- Only bootstrap if `false`
- Gradually migrate tenants

**Recommendation**: Option B (safer for production)

## Performance

- **Canon Size**: ~32 items × 7 categories = ~224 DB rows per tenant
- **Injection Time**: ~2-3 seconds (sequential inserts via DbWriteGate)
- **Non-Blocking**: Genesis continues if canon fails

## Future Enhancements

1. **Smart Activation**: Suggest beverages based on `businessType`
2. **Regional Variants**: City-level canons (e.g., Madrid vs Barcelona)
3. **Seasonal Updates**: Summer/winter beverage rotation
4. **AI Pricing**: Suggest prices based on location/competitors
