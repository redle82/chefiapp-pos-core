// @ts-nocheck
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      gm_restaurants: {
        Row: {
          id: string;
          name: string;
          owner_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string | null;
          created_at?: string;
        };
      };
      gm_products: {
        Row: {
          id: string;
          restaurant_id: string | null;
          category: string | null;
          name: string;
          description: string | null;
          price_cents: number;
          available: boolean | null;
          visibility: Json | null;
          track_stock: boolean | null;
          stock_quantity: number | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id?: string | null;
          category?: string | null;
          name: string;
          description?: string | null;
          price_cents?: number;
          available?: boolean | null;
          visibility?: Json | null;
          track_stock?: boolean | null;
          stock_quantity?: number | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string | null;
          category?: string | null;
          name?: string;
          description?: string | null;
          price_cents?: number;
          available?: boolean | null;
          visibility?: Json | null;
          track_stock?: boolean | null;
          stock_quantity?: number | null;
          image_url?: string | null;
          created_at?: string;
        };
      };
      gm_orders: {
        Row: {
          id: string;
          restaurant_id: string | null;
          table_id: string | null;
          table_number: string | null;
          status:
            | "OPEN"
            | "PREPARING"
            | "IN_PREP"
            | "READY"
            | "CLOSED"
            | "CANCELLED";
          total_amount: number;
          customer_id: string | null;
          user_id: string | null;
          shift_id: string | null;
          notes: string | null;
          waiter_name: string | null;
          payment_status:
            | "PENDING"
            | "PAID"
            | "PARTIALLY_PAID"
            | "FAILED"
            | "REFUNDED"
            | null;
          payment_method: "cash" | "card" | "pix" | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id?: string | null;
          table_id?: string | null;
          table_number?: string | null;
          status?:
            | "OPEN"
            | "PREPARING"
            | "IN_PREP"
            | "READY"
            | "CLOSED"
            | "CANCELLED";
          total_amount?: number;
          customer_id?: string | null;
          user_id?: string | null;
          shift_id?: string | null;
          notes?: string | null;
          waiter_name?: string | null;
          payment_status?:
            | "PENDING"
            | "PAID"
            | "PARTIALLY_PAID"
            | "FAILED"
            | "REFUNDED"
            | null;
          payment_method?: "cash" | "card" | "pix" | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string | null;
          table_id?: string | null;
          table_number?: string | null;
          status?:
            | "OPEN"
            | "PREPARING"
            | "IN_PREP"
            | "READY"
            | "CLOSED"
            | "CANCELLED";
          total_amount?: number;
          customer_id?: string | null;
          user_id?: string | null;
          shift_id?: string | null;
          notes?: string | null;
          waiter_name?: string | null;
          payment_status?:
            | "PENDING"
            | "PAID"
            | "PARTIALLY_PAID"
            | "FAILED"
            | "REFUNDED"
            | null;
          payment_method?: "cash" | "card" | "pix" | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      gm_order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          unit_price: number;
          total_price: number;
          quantity: number | null;
          notes: string | null;
          category_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          unit_price?: number;
          total_price?: number;
          quantity?: number | null;
          notes?: string | null;
          category_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          unit_price?: number;
          total_price?: number;
          quantity?: number | null;
          notes?: string | null;
          category_name?: string | null;
          created_at?: string;
        };
      };
      gm_customers: {
        Row: {
          id: string;
          restaurant_id: string;
          phone: string;
          name: string | null;
          total_visits: number | null;
          total_spend: number | null;
          last_visit: string | null;
          loyalty_points: number;
          loyalty_tier: "bronze" | "silver" | "gold" | "platinum";
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          phone: string;
          name?: string | null;
          total_visits?: number | null;
          total_spend?: number | null;
          last_visit?: string | null;
          loyalty_points?: number;
          loyalty_tier?: "bronze" | "silver" | "gold" | "platinum";
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          phone?: string;
          name?: string | null;
          total_visits?: number | null;
          total_spend?: number | null;
          last_visit?: string | null;
          loyalty_points?: number;
          loyalty_tier?: "bronze" | "silver" | "gold" | "platinum";
          created_at?: string;
        };
      };
      gm_shifts: {
        Row: {
          id: string;
          user_id: string | null;
          restaurant_id: string | null;
          started_at: string;
          ended_at: string | null;
          cash_start: number | null;
          cash_end: number | null;
          opening_float: number | null;
          closing_cash_actual: number | null;
          cash_difference: number | null;
          status: "open" | "closed" | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          restaurant_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          cash_start?: number | null;
          cash_end?: number | null;
          opening_float?: number | null;
          closing_cash_actual?: number | null;
          cash_difference?: number | null;
          status?: "open" | "closed" | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          restaurant_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          cash_start?: number | null;
          cash_end?: number | null;
          opening_float?: number | null;
          closing_cash_actual?: number | null;
          cash_difference?: number | null;
          status?: "open" | "closed" | null;
        };
      };
      gm_financial_sessions: {
        Row: {
          id: string;
          user_id: string | null;
          restaurant_id: string | null;
          started_at: string;
          closed_at: string | null;
          starting_float: number | null;
          closing_cash_actual: number | null;
          cash_difference: number | null;
          status: "open" | "closed" | "verified" | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          restaurant_id?: string | null;
          started_at?: string;
          closed_at?: string | null;
          starting_float?: number | null;
          closing_cash_actual?: number | null;
          cash_difference?: number | null;
          status?: "open" | "closed" | "verified" | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          restaurant_id?: string | null;
          started_at?: string;
          closed_at?: string | null;
          starting_float?: number | null;
          closing_cash_actual?: number | null;
          cash_difference?: number | null;
          status?: "open" | "closed" | "verified" | null;
          notes?: string | null;
        };
      };
      gm_inventory_items: {
        Row: {
          id: string;
          restaurant_id: string | null;
          name: string;
          stock_quantity: number;
          unit: string;
          cost_per_unit: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id?: string | null;
          name: string;
          stock_quantity?: number;
          unit: string;
          cost_per_unit?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string | null;
          name?: string;
          stock_quantity?: number;
          unit?: string;
          cost_per_unit?: number | null;
          created_at?: string;
        };
      };
      gm_recipes: {
        Row: {
          id: string;
          menu_item_id: string | null;
          inventory_item_id: string | null;
          quantity_required: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id?: string | null;
          inventory_item_id?: string | null;
          quantity_required: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          menu_item_id?: string | null;
          inventory_item_id?: string | null;
          quantity_required?: number;
          created_at?: string;
        };
      };
      gm_safety_controls: {
        Row: {
          id: string;
          restaurant_id: string;
          category: "temperature" | "hygiene" | "maintenance" | "safety";
          target: string;
          type: "numeric" | "boolean" | "photo";
          validation_rules: Json;
          frequency: "daily" | "shift_start" | "shift_end" | "weekly";
          role_required: "manager" | "chef" | "any";
          is_active: boolean;
          created_at: string;
          orchestration: Json;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          category: "temperature" | "hygiene" | "maintenance" | "safety";
          target: string;
          type: "numeric" | "boolean" | "photo";
          validation_rules?: Json;
          frequency?: "daily" | "shift_start" | "shift_end" | "weekly";
          role_required?: "manager" | "chef" | "any";
          is_active?: boolean;
          created_at?: string;
          orchestration?: Json;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          category?: "temperature" | "hygiene" | "maintenance" | "safety";
          target?: string;
          type?: "numeric" | "boolean" | "photo";
          validation_rules?: Json;
          frequency?: "daily" | "shift_start" | "shift_end" | "weekly";
          role_required?: "manager" | "chef" | "any";
          is_active?: boolean;
          created_at?: string;
          orchestration?: Json;
        };
      };
      gm_safety_logs: {
        Row: {
          id: string;
          restaurant_id: string;
          control_id: string;
          shift_id: string | null;
          user_id: string | null;
          value_numeric: number | null;
          value_boolean: boolean | null;
          value_text: string | null;
          status: "ok" | "warning" | "critical";
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          control_id: string;
          shift_id?: string | null;
          user_id?: string | null;
          value_numeric?: number | null;
          value_boolean?: boolean | null;
          value_text?: string | null;
          status: "ok" | "warning" | "critical";
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          control_id?: string;
          shift_id?: string | null;
          user_id?: string | null;
          value_numeric?: number | null;
          value_boolean?: boolean | null;
          value_text?: string | null;
          status?: "ok" | "warning" | "critical";
          created_at?: string;
        };
      };
      gm_calendar_events: {
        Row: {
          id: string;
          restaurant_id: string;
          title: string;
          description: string | null;
          category:
            | "maintenance"
            | "audit"
            | "inspection"
            | "special_service"
            | "incident";
          start_at: string;
          end_at: string | null;
          is_all_day: boolean | null;
          recurrence: "none" | "daily" | "weekly" | "monthly" | "yearly" | null;
          parent_event_id: string | null;
          assigned_role: string | null;
          is_blocker: boolean | null;
          status: "planned" | "completed" | "missed" | "cancelled" | null;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          title: string;
          description?: string | null;
          category?:
            | "maintenance"
            | "audit"
            | "inspection"
            | "special_service"
            | "incident";
          start_at: string;
          end_at?: string | null;
          is_all_day?: boolean | null;
          recurrence?:
            | "none"
            | "daily"
            | "weekly"
            | "monthly"
            | "yearly"
            | null;
          parent_event_id?: string | null;
          assigned_role?: string | null;
          is_blocker?: boolean | null;
          status?: "planned" | "completed" | "missed" | "cancelled" | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          title?: string;
          description?: string | null;
          category?:
            | "maintenance"
            | "audit"
            | "inspection"
            | "special_service"
            | "incident";
          start_at?: string;
          end_at?: string | null;
          is_all_day?: boolean | null;
          recurrence?:
            | "none"
            | "daily"
            | "weekly"
            | "monthly"
            | "yearly"
            | null;
          parent_event_id?: string | null;
          assigned_role?: string | null;
          is_blocker?: boolean | null;
          status?: "planned" | "completed" | "missed" | "cancelled" | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          restaurant_id: string;
          user_id: string | null;
          name: string;
          email: string | null;
          role: "owner" | "manager" | "worker";
          position: "kitchen" | "waiter" | "cleaning" | "cashier" | "manager";
          pin: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          user_id?: string | null;
          name: string;
          email?: string | null;
          role?: "owner" | "manager" | "worker";
          position?: "kitchen" | "waiter" | "cleaning" | "cashier" | "manager";
          pin?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          user_id?: string | null;
          name?: string;
          email?: string | null;
          role?: "owner" | "manager" | "worker";
          position?: "kitchen" | "waiter" | "cleaning" | "cashier" | "manager";
          pin?: string | null;
          active?: boolean;
          created_at?: string;
        };
      };
      gm_daily_safety_stats: {
        Row: {
          id: string;
          restaurant_id: string;
          date: string;
          total_checks_required: number | null;
          total_checks_completed: number | null;
          critical_failures: number | null;
          score: number | null;
          is_perfect_day: boolean | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          date: string;
          total_checks_required?: number | null;
          total_checks_completed?: number | null;
          critical_failures?: number | null;
          score?: number | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          date?: string;
          total_checks_required?: number | null;
          total_checks_completed?: number | null;
          critical_failures?: number | null;
          score?: number | null;
        };
      };
    };
    Views: {
      [_: string]: {
        Row: {
          [key: string]: Json;
        };
      };
    };
    Functions: {
      [_: string]: {
        Args: {
          [key: string]: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_: string]: string;
    };
  };
}
