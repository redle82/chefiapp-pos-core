# Dynamic Contextual Menu

## Overview

The **Dynamic Contextual Menu** is an intelligent product prioritization system that automatically reorders menu items based on:

- **Time of day** (morning coffee, lunch specials, evening drinks)
- **Historical patterns** (what sells when)
- **Recent activity** (click tracking with exponential decay)
- **Manual favorites** (owner-pinned items)

## Philosophy

> **"É mais fácil eliminar do que adicionar."**

The menu starts complete and self-organizes through usage. Products are never hidden, only intelligently reordered to reduce friction.

## Architecture

### 3-Layer Menu Structure

```
┌─────────────────────────────────────┐
│  1️⃣ CONTEXTUAL (Auto-Sorted)       │
│     Top 12 products by score        │
│     - Café Solo (9 AM → score 92)   │
│     - Cerveza (8 PM → score 88)     │
├─────────────────────────────────────┤
│  ⭐ FAVORITES (Manual Pins)         │
│     Owner-selected always-visible   │
│     - Menu del Día                  │
│     - Tapa Especial                 │
├─────────────────────────────────────┤
│  📂 FULL CATALOG (All Categories)  │
│     Traditional category navigation │
│     └─ Bebidas → Cafés → Vinos     │
└─────────────────────────────────────┘
```

### Scoring System

Each product receives a **dynamic_score** calculated from 4 components:

```typescript
score = (time_match × 0.4) + 
        (recent_frequency × 0.3) + 
        (click_recency × 0.2) + 
        (favorite_bonus × 0.1)
```

#### Component Details

1. **Time Match (40%)**: Historical orders at current hour ± 1
   - Café: 90 at 9 AM, 20 at 8 PM
   - Cerveza: 20 at 9 AM, 90 at 8 PM

2. **Recent Frequency (30%)**: Orders in last 7 days
   - 1 order = 10 points
   - 10+ orders = 100 points

3. **Click Recency (20%)**: Exponential decay
   - Just clicked = 100 points
   - 30 min ago = 50 points
   - 2 hours ago = 0 points

4 **Favorite Bonus (10%)**: Manual pin

- Pinned = 100 points
- Not pinned = 0 points

### Fallback Scores

For products with no historical data:

| Time Slot | Quentes | Cervejas | Vinhos | Refrigerantes |
|-----------|---------|----------|--------|---------------|
| Morning   | 90      | 10       | 10     | 30            |
| Lunch     | 40      | 40       | 60     | 50            |
| Afternoon | 60      | 20       | 30     | 50            |
| Night     | 30      | 90       | 70     | 40            |

## Usage

### React Hook (TPV/MiniPOS)

```typescript
import { useDynamicMenu } from '@/core/menu/DynamicMenu';

function TPV({ restaurantId }) {
  const { menu, loading, trackClick } = useDynamicMenu({
    restaurantId,
    mode: 'tpv',
    contextualLimit: 12
  });

  if (loading) return <Spinner />;

  return (
    <div>
      {/* Contextual Section */}
      <section>
        <h3>Recomendados Agora</h3>
        {menu.contextual.map(product => (
          <ProductCard 
            key={product.id}
            product={product}
            onClick={() => trackClick(product.id)}
          />
        ))}
      </section>

      {/* Favorites */}
      {menu.favorites.length > 0 && (
        <section>
          <h3>Favoritos</h3>
          {menu.favorites.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      )}

      {/* Full Catalog */}
      <CategoryGrid categories={menu.fullCatalog} />
    </div>
  );
}
```

### Service API

```typescript
import { DynamicMenuService } from '@/core/menu/DynamicMenu';

// Get menu
const menu = await DynamicMenuService.getDynamicMenu(restaurantId, {
  contextualLimit: 8,
  currentHour: 14 // Override for testing
});

// Track click (updates recency score)
await DynamicMenuService.trackClick(restaurantId, productId);

// Pin favorite
await DynamicMenuService.toggleFavorite(restaurantId, productId, true);

// Reset all learning
await DynamicMenuService.resetDynamics(restaurantId);
```

## Database Schema

### `product_dynamics` Table

```sql
CREATE TABLE product_dynamics (
    id UUID PRIMARY KEY,
    restaurant_id UUID REFERENCES gm_restaurants(id),
    product_id UUID REFERENCES gm_products(id),
    
    -- Manual
    is_favorite BOOLEAN DEFAULT FALSE,
    favorite_order INTEGER,
    
    -- Auto-Learning
    hour_stats JSONB,           -- {"09": 12, "14": 45}
    last_ordered_at TIMESTAMPTZ,
    last_clicked_at TIMESTAMPTZ,
    recent_order_count INTEGER,
    
    -- Cache
    cached_score FLOAT,
    score_updated_at TIMESTAMPTZ
);
```

### Automatic Updates

Orders automatically update `hour_stats` via trigger:

```sql
CREATE TRIGGER trigger_update_product_dynamics
    AFTER INSERT ON gm_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_product_dynamics_on_order();
```

## Owner Controls

### Settings (per restaurant)

```json
{
  "dynamic_menu_enabled": true,
  "score_weights": {
    "time_match": 0.4,
    "recent_frequency": 0.3,
    "click_recency": 0.2,
    "favorite_bonus": 0.1
  },
  "time_slots": {
    "morning": [6, 11],
    "lunch": [12, 16],
    "afternoon": [17, 19],
    "night": [20, 23]
  }
}
```

### Actions

- **Enable/Disable**: Turn dynamic sorting on/off
- **Adjust Weights**: Fine-tune score components
- **Pin Favorites**: Manually promote products
- **Reset Learning**: Clear all historical data

## Performance

- **Score Refresh**: Every 5 minutes (cached)
- **Click Tracking**: Immediate (optimistic UI update)
- **Auto-Refresh**: React hook polls every 5 min
- **Indexes**: Composite indexes on score + favorites

## Integration Points

### TPV

- Shows top 12 contextual items
- Prioritizes speed (beverages, quick items)
- Large touch targets

### MiniPOS (Waiter App)

- Shows top 8 contextual items
- Balanced between food and drinks
- Compact layout

### Menu Management

- Settings UI in owner dashboard
- Analytics: "What's selling when?"
- Favorite manager with drag-and-drop

## Future Enhancements

1. **Weather Integration**: Boost cold drinks on hot days
2. **Event Detection**: Auto-adapt during rushes
3. **Cross-Restaurant Learning**: Anonymous pattern sharing
4. **Voice Commands**: "Show me lunch items"
5. **A/B Testing**: Compare scoring algorithms

## Migration Notes

- Existing restaurants start with empty `product_dynamics`
- Fallback scores ensure immediate functionality
- Learning improves over 7-14 days of usage
- No breaking changes to existing menu code
