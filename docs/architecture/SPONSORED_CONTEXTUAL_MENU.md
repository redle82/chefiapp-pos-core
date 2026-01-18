# Sponsored Contextual Menu

## Philosophy

**"Patrocínio não é banner. Patrocínio é amplificação contextual de produtos reais."**

Brand sponsorships enhance existing menu items with real customer value, displayed transparently only in customer-facing channels.

## Core Principles

1. **Contextual, Not Intrusive**: Sponsored items blend naturally
2. **Value-First**: Every sponsorship provides customer benefit
3. **Transparency**: Clear "Oferta Patrocinada" labeling
4. **Sovereignty**: Owner retains full control
5. **Non-Blocking**: Never hides non-sponsored products

## Channel Strategy

### ✅ Where Sponsorships Appear

- **Web Menu** (public page)
- **QR Menu** (table-side ordering)
- **Waiter Mini Web** (staff recommendations)

### ❌ Where They Don't Appear

- **TPV** (operational speed)
- **KDS** (kitchen clarity)
- **Owner Dashboard** (operational focus)

## Data Model

### Sponsorship Structure

```typescript
{
  brand_name: "Coca-Cola",
  campaign_id: "summer-2026",
  incentive_display: "15% desconto",
  incentive_value: { type: "percentage", value: 15 },
  visibility_rules: {
    channels: ["web", "qr"],
    time_slots: ["lunch", "afternoon"],
    date_range: ["2026-06-01", "2026-08-31"]
  },
  score_boost: 8,
  owner_approved: true
}
```

### Visibility Rules

- **Channels**: `web`, `qr`, `waiter`
- **Time Slots**: `morning`, `lunch`, `afternoon`, `night`
- **Days**: 0-6 (Sunday-Saturday)
- **Date Range**: ISO date strings
- **Min Order Value**: Cart threshold (cents)

## Integration with Dynamic Menu

### Score Boost

Sponsorships add subtle boost to `dynamic_score`:

```typescript
finalScore = baseScore + (score_boost × priority_factor)
// Default: +5 to +10 points
// High priority (>5): ×1.2 multiplier
```

### Contextual Amplification

- Café sponsorship at 9 AM: Base 90 + Boost 8 = **98**
- Same café at 8 PM: Base 20 + Boost 8 = **28**

Context always wins over sponsorship.

## Event Tracking

### Event Types

1. **Impression**: Product shown with sponsorship badge
2. **Click**: User clicks sponsored product
3. **Conversion**: Product added to cart
4. **Sale**: Order completed with product

### Metrics

- **CTR** (Click-Through Rate): clicks / impressions
- **Conversion Rate**: conversions / clicks
- **Revenue**: Total sales from sponsored products

## Usage

### Service API

```typescript
import { SponsorshipService } from '@/core/menu/SponsoredMenu';

// Get active sponsorships
const context = {
  channel: 'web',
  hour: 14,
  day: 1, // Monday
  date: new Date()
};
const sponsorships = await SponsorshipService.getActiveSponsorships(
  restaurantId,
  context
);

// Track impression
await SponsorshipService.trackEvent(
  sponsorshipId,
  'impression',
  { product_id, channel: 'web', session_id }
);

// Get campaign metrics
const metrics = await SponsorshipService.getCampaignMetrics(restaurantId);
```

### Integrated with Dynamic Menu

```typescript
import { DynamicMenuService } from '@/core/menu/DynamicMenu';

// Automatically includes sponsorship boosts
const menu = await DynamicMenuService.getDynamicMenu(restaurantId);

// Products with sponsorships have extra fields:
menu.contextual.forEach(product => {
  if (product.sponsorship) {
    console.log(`Sponsored: ${product.sponsorship.incentive_display}`);
  }
});
```

## UI Components

### Sponsored Badge

```tsx
{product.sponsorship && (
  <SponsorshipBadge>
    <Label>Oferta Patrocinada</Label>
    <Incentive>{product.sponsorship.incentive_display}</Incentive>
  </SponsorshipBadge>
)}
```

### Price Display

```tsx
{product.sponsorship ? (
  <PriceWithDiscount
    original={product.price_cents}
    sponsored={product.sponsorship.sponsored_price_cents}
  />
) : (
  <Price value={product.price_cents} />
)}
```

## Owner Controls

### Approval Workflow

1. Brand creates campaign (admin portal)
2. Owner receives notification
3. Owner reviews and approves/rejects
4. Approved campaigns go live immediately

### Dashboard Actions

- **Approve/Reject**: Explicit consent required
- **Pause**: Temporarily disable campaign
- **View Metrics**: Impressions, clicks, revenue
- **Settings**: Max boost, allowed channels

## Ethical Safeguards

### Hard Rules

1. **No Deception**: Always labeled "Oferta Patrocinada"
2. **No Blocking**: Non-sponsored products always visible
3. **No Manipulation**: Score boost capped at 20 points
4. **Owner Veto**: Can disable any campaign
5. **Quality Gate**: Owner approval required

### Score Limits

- Default boost: 5 points
- Maximum boost: 20 points
- Never overrides manual favorites
- Never reverses time context

## Business Model

### Revenue Streams

1. **CPM** (Cost Per Mille): Per 1000 impressions
2. **CPC** (Cost Per Click): Per click
3. **Revenue Share**: % of incremental sales
4. **Campaign Fee**: Flat activation cost

### Restaurant Benefits

- Share of sponsorship revenue
- Premium features unlocked
- Exclusive brand deals

## Example Campaign

**Coca-Cola Summer 2026**

```json
{
  "brand": "Coca-Cola",
  "campaign": "Verão Refrescante",
  "products": ["Coca-Cola 33cl"],
  "incentive": "15% desconto",
  "visibility": {
    "channels": ["web", "qr"],
    "time_slots": ["lunch", "afternoon"],
    "dates": ["2026-06-01", "2026-08-31"]
  },
  "boost": 8
}
```

**Result**: Coca-Cola appears with 15% discount in web/QR menus during lunch/afternoon in summer, gets +8 score boost.

## Future Enhancements

1. **A/B Testing**: Compare campaign variants
2. **Geo-Targeting**: City/region-specific offers
3. **Customer Segments**: Personalized offers
4. **Brand Portal**: Self-service campaign management
