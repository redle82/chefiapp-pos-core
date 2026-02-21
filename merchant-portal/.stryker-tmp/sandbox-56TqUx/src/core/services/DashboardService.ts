/** @deprecated Use core RPCs + hooks (useDailyMetrics/useStockAlerts). */
// @ts-nocheck

export interface DailyMetrics {
  totalSalesCents: number;
  totalOrders: number;
  avgTicketCents: number;
  totalCostCents: number; // NEW
  salesByHour: { hour: number; totalCents: number }[];
}

// ... (interfaces)
export interface LowStockItem {
  id: string;
  name: string;
  stockLevel: number;
  minStockLevel: number;
}

/** @deprecated Legacy mock-only service. Use core RPC hooks instead. */
export class DashboardService {
  /**
   * Get Daily Metrics for Dashboard
   *
   * Calls RPC `get_daily_metrics` which aggregates data at SQL level.
   */
  static async getDailyMetrics(_restaurantId: string): Promise<DailyMetrics> {
    // PURE DOCKER / DEV_STABLE:
    // - Módulo `dashboard` está marcado como dataSource: "mock".
    // - As métricas abaixo são um cenário estático, suficiente para trial/UX.
    return {
      totalSalesCents: 1545000, // 15,450.00
      totalOrders: 42,
      avgTicketCents: 3678, // 36.78
      totalCostCents: 450000,
      salesByHour: [
        { hour: 11, totalCents: 120000 },
        { hour: 12, totalCents: 450000 },
        { hour: 13, totalCents: 890000 },
      ],
    };
  }

  /**
   * Get Low Stock Items
   * Calls RPC `get_low_stock_items`
   */
  static async getLowStockItems(
    _restaurantId: string,
  ): Promise<LowStockItem[]> {
    // PURE DOCKER / DEV_STABLE:
    // Lista estática de itens com baixo estoque, apenas para narrativa visual.
    return [
      { id: "1", name: "Leite Integral", stockLevel: 2, minStockLevel: 10 },
      { id: "2", name: "Limão Siciliano", stockLevel: 0, minStockLevel: 5 },
      { id: "3", name: "Whisky Black Label", stockLevel: 1, minStockLevel: 3 },
    ];
  }

  /**
   * Restock Item
   * Calls RPC `restock_item`
   */
  static async restockItem(
    _itemId: string,
    _quantity: number,
  ): Promise<boolean> {
    // Em modo mock, apenas sinaliza sucesso.
    return true;
  }
  /**
   * Get Shift Forecast (AI Simulation)
   * Returns hourly predicted sales vs actual sales.
   */
  static async getShiftForecast(
    restaurantId: string,
  ): Promise<{ hour: number; expected: number; actual: number }[]> {
    // AI ENGINE MOCK (Simulating a Bell Curve for Lunch 12-14 and Dinner 19-21)
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return hours.map((hour) => {
      let expected = 1000; // Base baseline (10 EUR)

      // Lunch Rush Simulation (Peak @ 13h)
      if (hour >= 11 && hour <= 15) {
        expected += 5000 * Math.exp(-Math.pow(hour - 13, 2) / 2);
      }

      // Dinner Rush Simulation (Peak @ 20h)
      if (hour >= 18 && hour <= 23) {
        expected += 12000 * Math.exp(-Math.pow(hour - 20, 2) / 3);
      }

      // Add some randomness noise
      expected = Math.floor(expected + Math.random() * 1000);

      return {
        hour,
        expected,
        actual: 0, // Will be merged with real metrics in the UI or Service
      };
    });
  }
}
