/**
 * FinancialEngine - Engine Financeiro
 *
 * Gerencia fluxo de caixa, margens, custos, desperdício e previsões.
 * DOCKER MODE: não usa Supabase; retorna dados mock (lista vazia, saldo zero)
 * para a página /financial carregar sem erro.
 */

import { BackendType, getBackendType } from "../infra/backendAdapter";
import { supabase } from "../supabase";

export type TransactionType = "income" | "expense" | "transfer";
export type TransactionCategory =
  | "sales"
  | "purchase"
  | "payroll"
  | "rent"
  | "utilities"
  | "other";

export interface CashFlowTransaction {
  id: string;
  restaurantId: string;
  transactionDate: Date;
  transactionType: TransactionType;
  category: TransactionCategory;
  amount: number;
  description?: string;
  relatedOrderId?: string;
  relatedPurchaseOrderId?: string;
  createdAt: Date;
}

export interface ProductMargin {
  id: string;
  restaurantId: string;
  productId?: string;
  periodStart: Date;
  periodEnd: Date;
  totalSales: number;
  totalCost: number;
  marginAmount: number;
  marginPercentage: number;
  unitsSold: number;
  unitsWasted: number;
}

export interface DishCost {
  id: string;
  restaurantId: string;
  dishId?: string;
  ingredientCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  sellingPrice?: number;
  marginAmount: number;
  marginPercentage: number;
  calculatedAt: Date;
}

export type LossType = "waste" | "spoilage" | "theft" | "error" | "other";
export type LossCategory =
  | "operational"
  | "storage"
  | "preparation"
  | "service";

export interface WasteAndLoss {
  id: string;
  restaurantId: string;
  ingredientId?: string;
  productId?: string;
  lossType: LossType;
  category: LossCategory;
  quantity: number;
  unit: string;
  unitCost: number;
  totalLoss: number;
  reason?: string;
  reportedBy?: string;
  reportedAt: Date;
}

export type ForecastType =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export interface FinancialForecast {
  id: string;
  restaurantId: string;
  forecastDate: Date;
  forecastType: ForecastType;
  forecastedIncome: number;
  forecastedExpenses: number;
  forecastedProfit: number;
  confidenceLevel: number;
  methodology?: string;
  createdAt: Date;
}

export class FinancialEngine {
  /**
   * Registrar transação de fluxo de caixa
   */
  async recordTransaction(transaction: {
    restaurantId: string;
    transactionDate: Date;
    transactionType: TransactionType;
    category: TransactionCategory;
    amount: number;
    description?: string;
    relatedOrderId?: string;
    relatedPurchaseOrderId?: string;
  }): Promise<string> {
    if (getBackendType() === BackendType.docker) {
      return crypto.randomUUID();
    }
    const { data, error } = await supabase
      .from("cash_flow")
      .insert({
        restaurant_id: transaction.restaurantId,
        transaction_date: transaction.transactionDate
          .toISOString()
          .split("T")[0],
        transaction_type: transaction.transactionType,
        category: transaction.category,
        amount: transaction.amount,
        description: transaction.description || null,
        related_order_id: transaction.relatedOrderId || null,
        related_purchase_order_id: transaction.relatedPurchaseOrderId || null,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Listar transações
   */
  async listTransactions(
    restaurantId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      type?: TransactionType[];
      category?: TransactionCategory[];
      limit?: number;
    },
  ): Promise<CashFlowTransaction[]> {
    if (getBackendType() === BackendType.docker) {
      return [];
    }
    let query = supabase
      .from("cash_flow")
      .select("*")
      .eq("restaurant_id", restaurantId);

    if (filters?.startDate) {
      query = query.gte(
        "transaction_date",
        filters.startDate.toISOString().split("T")[0],
      );
    }

    if (filters?.endDate) {
      query = query.lte(
        "transaction_date",
        filters.endDate.toISOString().split("T")[0],
      );
    }

    if (filters?.type && filters.type.length > 0) {
      query = query.in("transaction_type", filters.type);
    }

    if (filters?.category && filters.category.length > 0) {
      query = query.in("category", filters.category);
    }

    query = query.order("transaction_date", { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(this.mapToTransaction);
  }

  /**
   * Calcular saldo de caixa
   */
  async calculateCashBalance(
    restaurantId: string,
    asOfDate?: Date,
  ): Promise<{ income: number; expenses: number; balance: number }> {
    if (getBackendType() === BackendType.docker) {
      return { income: 0, expenses: 0, balance: 0 };
    }
    const dateFilter = asOfDate ? asOfDate.toISOString().split("T")[0] : null;

    let query = supabase
      .from("cash_flow")
      .select("transaction_type, amount")
      .eq("restaurant_id", restaurantId);

    if (dateFilter) {
      query = query.lte("transaction_date", dateFilter);
    }

    const { data, error } = await query;

    if (error) throw error;

    let income = 0;
    let expenses = 0;

    (data || []).forEach((row: any) => {
      if (row.transaction_type === "income") {
        income += parseFloat(row.amount || 0);
      } else if (row.transaction_type === "expense") {
        expenses += parseFloat(row.amount || 0);
      }
    });

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }

  /**
   * Calcular margem por produto
   */
  async calculateProductMargin(
    restaurantId: string,
    productId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<ProductMargin> {
    if (getBackendType() === BackendType.docker) {
      return {
        id: crypto.randomUUID(),
        restaurantId,
        productId,
        periodStart,
        periodEnd,
        totalSales: 0,
        totalCost: 0,
        marginAmount: 0,
        marginPercentage: 0,
        unitsSold: 0,
        unitsWasted: 0,
      };
    }
    const { data, error } = await (await import("../infra/coreOrSupabaseRpc")).invokeRpc("calculate_product_margin", {
      p_restaurant_id: restaurantId,
      p_product_id: productId,
      p_period_start: periodStart.toISOString().split("T")[0],
      p_period_end: periodEnd.toISOString().split("T")[0],
    });

    if (error) throw new Error(error.message);

    // Buscar margem salva
    const { data: marginData, error: marginError } = await supabase
      .from("product_margins")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("product_id", productId)
      .eq("period_start", periodStart.toISOString().split("T")[0])
      .eq("period_end", periodEnd.toISOString().split("T")[0])
      .single();

    if (marginError) throw marginError;
    return this.mapToProductMargin(marginData);
  }

  /**
   * Listar margens de produtos
   */
  async listProductMargins(
    restaurantId: string,
    filters?: {
      periodStart?: Date;
      periodEnd?: Date;
      limit?: number;
    },
  ): Promise<ProductMargin[]> {
    if (getBackendType() === BackendType.docker) {
      return [];
    }
    let query = supabase
      .from("product_margins")
      .select("*")
      .eq("restaurant_id", restaurantId);

    if (filters?.periodStart) {
      query = query.gte(
        "period_start",
        filters.periodStart.toISOString().split("T")[0],
      );
    }

    if (filters?.periodEnd) {
      query = query.lte(
        "period_end",
        filters.periodEnd.toISOString().split("T")[0],
      );
    }

    query = query.order("period_start", { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(this.mapToProductMargin);
  }

  /**
   * Registrar desperdício/perda
   */
  async recordWasteAndLoss(loss: {
    restaurantId: string;
    ingredientId?: string;
    productId?: string;
    lossType: LossType;
    category: LossCategory;
    quantity: number;
    unit: string;
    unitCost: number;
    reason?: string;
    reportedBy?: string;
  }): Promise<string> {
    if (getBackendType() === BackendType.docker) {
      return crypto.randomUUID();
    }
    const totalLoss = loss.quantity * loss.unitCost;

    const { data, error } = await supabase
      .from("waste_and_losses")
      .insert({
        restaurant_id: loss.restaurantId,
        ingredient_id: loss.ingredientId || null,
        product_id: loss.productId || null,
        loss_type: loss.lossType,
        category: loss.category,
        quantity: loss.quantity,
        unit: loss.unit,
        unit_cost: loss.unitCost,
        total_loss: totalLoss,
        reason: loss.reason || null,
        reported_by: loss.reportedBy || null,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Listar desperdícios/perdas
   */
  async listWasteAndLosses(
    restaurantId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      lossType?: LossType[];
      limit?: number;
    },
  ): Promise<WasteAndLoss[]> {
    if (getBackendType() === BackendType.docker) {
      return [];
    }
    let query = supabase
      .from("waste_and_losses")
      .select("*")
      .eq("restaurant_id", restaurantId);

    if (filters?.startDate) {
      query = query.gte("reported_at", filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte("reported_at", filters.endDate.toISOString());
    }

    if (filters?.lossType && filters.lossType.length > 0) {
      query = query.in("loss_type", filters.lossType);
    }

    query = query.order("reported_at", { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(this.mapToWasteAndLoss);
  }

  /**
   * Calcular total de desperdício/perdas
   */
  async calculateTotalWasteAndLosses(
    restaurantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    if (getBackendType() === BackendType.docker) {
      return 0;
    }
    let query = supabase
      .from("waste_and_losses")
      .select("total_loss")
      .eq("restaurant_id", restaurantId);

    if (startDate) {
      query = query.gte("reported_at", startDate.toISOString());
    }

    if (endDate) {
      query = query.lte("reported_at", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).reduce(
      (sum, row) => sum + parseFloat(row.total_loss || 0),
      0,
    );
  }

  private mapToTransaction(row: any): CashFlowTransaction {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      transactionDate: new Date(row.transaction_date),
      transactionType: row.transaction_type,
      category: row.category,
      amount: parseFloat(row.amount || 0),
      description: row.description,
      relatedOrderId: row.related_order_id,
      relatedPurchaseOrderId: row.related_purchase_order_id,
      createdAt: new Date(row.created_at),
    };
  }

  private mapToProductMargin(row: any): ProductMargin {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      productId: row.product_id,
      periodStart: new Date(row.period_start),
      periodEnd: new Date(row.period_end),
      totalSales: parseFloat(row.total_sales || 0),
      totalCost: parseFloat(row.total_cost || 0),
      marginAmount: parseFloat(row.margin_amount || 0),
      marginPercentage: parseFloat(row.margin_percentage || 0),
      unitsSold: row.units_sold || 0,
      unitsWasted: row.units_wasted || 0,
    };
  }

  private mapToWasteAndLoss(row: any): WasteAndLoss {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      ingredientId: row.ingredient_id,
      productId: row.product_id,
      lossType: row.loss_type,
      category: row.category,
      quantity: parseFloat(row.quantity || 0),
      unit: row.unit,
      unitCost: parseFloat(row.unit_cost || 0),
      totalLoss: parseFloat(row.total_loss || 0),
      reason: row.reason,
      reportedBy: row.reported_by,
      reportedAt: new Date(row.reported_at),
    };
  }
}

export const financialEngine = new FinancialEngine();
