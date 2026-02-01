import React, { createContext, useContext, useEffect, useState } from "react";

export interface Customer {
  id: string;
  name: string;
  phone: string;
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
    console.warn(
      "[CORE TODO][Loyalty] searchCustomerByPhone ainda não está ligado ao Core. Retornando null.",
      { phone, restaurantId },
    );
    return null;
  };

  const createCustomer = async (
    name: string,
    phone: string,
    restaurantId: string,
  ): Promise<Customer> => {
    console.warn(
      "[CORE TODO][Loyalty] createCustomer ainda não está ligado ao Core. Retornando cliente dummy.",
      { name, phone, restaurantId },
    );

    const now = new Date().toISOString();
    return {
      id: "CORETODO-LOYALTY-CUSTOMER",
      name,
      phone,
      points_balance: 0,
      visit_count: 0,
      last_visit_at: now,
      total_spend_cents: 0,
    };
  };

  // Realtime Updates for Active Customer (desativado em PURE DOCKER FASE 1)
  useEffect(() => {
    if (!activeCustomer) return;

    console.warn(
      "[CORE TODO][Loyalty] Realtime de gm_customers desativado na FASE 1. Nenhuma subscription será aberta.",
      { customerId: activeCustomer.id },
    );

    // No-op: manter apenas a dependência para futura implementação.
    return () => {
      // noop
    };
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
