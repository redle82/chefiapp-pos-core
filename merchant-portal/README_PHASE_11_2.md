# ORDER → INVENTORY Integration (Phase 11.2)

**Status:** ✅ Ready for QA

The Metabolic Loop is now closed. Orders placed in the TPV automatically deplete inventory based on recipes, and low stock triggers Hunger Signals in the Manager Dashboard.

## 🧪 Manual Testing Instructions

### 1. Setup
1.  Ensure you have the latest code and dependencies (`npm install`).
2.  Start the merchant portal: `npm run dev`.
3.  Navigate to `http://localhost:5173/app/tpv` (or wherever your local TPV runs).

### 2. Verify Consumption (Order → Consumption)
1.  **Check Stock:** Go to Inventory (`/app/inventory`) and check the stock of **"Mozzarella Fresca"**. Note the value (e.g., 5000g).
2.  **Place Order:** Go to TPV. Select **"Pizza Margherita"** (which uses 100g Mozzarella). Place the order.
3.  **Verify:** Return to Inventory. The stock should now be **4900g**.
    *   *Note: This happens via the `INVENTORY_CONSUMED` event in the background.*

### 3. Verify Hunger Signals (Stock → Alert)
1.  **Trigger Low Stock:** Using the Inventory Edit/Adjust UI (or by placing massive orders), reduce the stock of **"Ketchup Heinz (Bag 3kg)"** to **1 unit**.
2.  **Check Dashboard:** Go to **Manager Dashboard** (`/app/staff` or `/app/dashboard`).
3.  **Verify Alert:** You should see a **"Metabolic Hunger"** card alerting about low Ketchup stock ("Panic Buy" or "Urgent").

## 🛠 Tech Notes
- **Events:** Uses `INVENTORY_CONSUMED`, `RESTOCKED`, `ADJUSTED`.
- **Hydration:** `InventoryContext` reconstructs state from the immutable `GlobalEventStore`.
- **Test:** Run `npm test` in `merchant-portal` to verify logic (Recipes, HungerEngine, CoreExecutor).
