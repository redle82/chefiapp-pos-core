# Menu Kernel Logic (The Value OS)

> [!IMPORTANT]
> **Definition**: The Menu is not a UI artifact. It is the Central Infrastructure of Value.
> **Kernel Role**: Interprets the static data (Core) to generate financial & operational truth.

## 1. The Architecture
**MENU = CORE + KERNEL + DOCUMENTS**

### A. MENU CORE (The Source of Truth)
*Data Layer - Immutable Facts*
- **Item Definition**: ID, Name, Kitchen Name.
- **Financial Baseline**: Base Price, Currency, Tax Profile ID, Cost Center ID.
- **Availability**: Is Active? (Global switch).

### B. MENU KERNEL (The Logic Engine)
*Logic Layer - Interprets the Core*
The Kernel answers questions. It never stores state, it only computes it.

#### 1. Price Resolution
`Kernel.resolvePrice(item, context)`
- **Input**: Item, Context (Time, Channel, Customer Type)
- **Logic**: Base Price + Modifiers + dynamic rules (future)
- **Output**: Final Transaction Price

#### 2. Fiscal Resolution
`Kernel.resolveTax(item, price)`
- **Input**: Item, Final Price
- **Logic**: Lookup `gm_tax_profiles` -> Extract Tax Amount from Gross Price (reverse calc)
- **Output**: { net: 10.00, tax: 2.30, rate: 23% }

#### 3. Operational Integrity
`Kernel.validateOrder(item)`
- **Check 1**: Is item active?
- **Check 2**: Is tax profile valid?
- **Check 3**: Is cost center defined?
- **Result**: PASS / BLOCK

### C. MENU DOCUMENTS (The Projections)
*Presentation Layer - Derived Views*
The Menu generates these documents. They are read-only snapshots.
- **Web Menu**: Formatted for UX, images loaded.
- **QR Payload**: Lightweight JSON for rapid mobile load.
- **TPV Grid**: Optimized for touch targets, grouped by high-frequency sales.
- **Fiscal/SAFT**: Strict tax categorization for export.

### D. CONNECTIVITY LAYER (The Network)
*Integration Layer - Defined in `040_menu_connectivity_layer.sql`*
- **Inventory Link**: `gm_menu_recipes` connects Menu Item -> Inventory Item.
- **Channel Map**: `gm_external_channel_maps` translates Menu Item -> Uber/Glovo.

---

## 2. Hard Rules (Immutable)
1.  **Single Source**: There is only one `menu_items` table. No "TPV Menu" vs "Web Menu" tables.
2.  **Price is Gross**: To simplify operation, stored prices are always "Consumer Facing" (Gross). The Kernel extracts tax backward.
3.  **Deletion Protection**: Items with linked `market_ledger` or `event_store` entries cannot be hard-deleted, only archived (`is_active = false`).
4.  **Consumption Rule**: A sale event ALWAYS triggers a recipe consumption check.

## 3. Data Dictionary (Kernel Extensions)

### `gm_inventory_items`
The physical resource consumed.
- `id`: UUID
- `unit`: 'un', 'kg', 'lt'
- `current_stock`: Numeric
- `min_stock`: Numeric (Alert Threshold)

### `gm_menu_recipes`
The link between commercial value (Menu) and physical cost (Inventory).
- `menu_item_id` -> `inventory_item_id`
- `quantity`: Amount consumed per unit sold.

### `gm_external_channel_maps`
The distribution adapter.
- `channel_type`: 'UBEREATS', 'GLOVO'
- `external_id`: The ID on the third-party system.
- `price_override`: If defined, supersedes `base_price` for that channel.

### `gm_tax_profiles`
Defines the fiscal personality of an item.

- `id`: UUID
- `code`: External Fiscal Code (e.g., 'NOR', 'INT')
- `rate`: Percentage (e.g., 23.00)
- `name`: Human label (e.g., "Taxa Normal 23%")

### `gm_cost_centers`
Defines the production destination and reporting bucket.
- `id`: UUID
- `type`: 'KITCHEN' | 'BAR' | 'COUNTER'
- `name`: Human label (e.g., "Bar da Esplanada")
