import React, { createContext, useContext, useEffect, useState } from "react";
import { getDockerCoreFetchClient } from "../infra/dockerCoreFetchClient";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  points_balance: number;
  visit_count: number;
  last_visit_at: string;
  total_spend_cents: number;
}

interface LoyaltyContextType {
  activeCustomer: Customer | null;
  setActiveCustomer: (customer: Customer | null) => void;
  searchCustomerByPhone: (
    phone: string,
    restaurantId: string,
  ) => Promise<Customer | null>;
  createCustomer: (
    name: string,
    phone: string,
    restaurantId: string,
  ) => Promise<Customer>;
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const LoyaltyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  const searchCustomerByPhone = async (phone: string, restaurantId: string) => {
    try {
      const core = getDockerCoreFetchClient();
      const { data, error } = await core
        .from("gm_customers")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("phone", phone)
        .maybeSingle();

      if (error || !data) return null;

      const row = data as Record<string, any>;
      return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email || undefined,
        points_balance: row.points_balance ?? 0,
        visit_count: row.visit_count ?? 0,
        last_visit_at:
          row.last_visit_at || row.created_at || new Date().toISOString(),
        total_spend_cents: row.total_spend_cents ?? 0,
      } as Customer;
    } catch (err) {
      console.error("[LoyaltyContext] searchCustomerByPhone failed", err);
      return null;
    }
  };

  const createCustomer = async (
    name: string,
    phone: string,
    restaurantId: string,
  ): Promise<Customer> => {
    try {
      const core = getDockerCoreFetchClient();
      const { data, error } = await core
        .from("gm_customers")
        .insert({
          restaurant_id: restaurantId,
          name,
          phone,
          points_balance: 0,
          total_spend_cents: 0,
          visit_count: 0,
        })
        .select("*")
        .single();

      if (error || !data) {
        console.error("[LoyaltyContext] createCustomer error", error);
        throw new Error(error?.message || "Erro ao criar cliente");
      }

      const row = data as Record<string, any>;
      return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email || undefined,
        points_balance: row.points_balance ?? 0,
        visit_count: row.visit_count ?? 0,
        last_visit_at:
          row.last_visit_at || row.created_at || new Date().toISOString(),
        total_spend_cents: row.total_spend_cents ?? 0,
      };
    } catch (err) {
      console.error("[LoyaltyContext] createCustomer failed", err);
      throw err;
    }
  };

  // Realtime polling for active customer (lightweight — refetch on interval)
  useEffect(() => {
    if (!activeCustomer) return;

    // Poll every 30s to keep customer data fresh
    const interval = setInterval(async () => {
      try {
        const core = getDockerCoreFetchClient();
        const { data } = await core
          .from("gm_customers")
          .select("*")
          .eq("id", activeCustomer.id)
          .maybeSingle();

        if (data) {
          const row = data as Record<string, any>;
          setActiveCustomer({
            id: row.id,
            name: row.name,
            phone: row.phone,
            email: row.email || undefined,
            points_balance: row.points_balance ?? 0,
            visit_count: row.visit_count ?? 0,
            last_visit_at: row.last_visit_at || row.created_at,
            total_spend_cents: row.total_spend_cents ?? 0,
          });
        }
      } catch {
        // Silent fail — next poll will retry
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [activeCustomer?.id]);

  return (
    <LoyaltyContext.Provider
      value={{
        activeCustomer,
        setActiveCustomer,
        searchCustomerByPhone,
        createCustomer,
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
};

export const useLoyalty = () => {
  const context = useContext(LoyaltyContext);
  if (context === undefined) {
    throw new Error("useLoyalty must be used within a LoyaltyProvider");
  }
  return context;
};
