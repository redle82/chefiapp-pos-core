import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { UserRole } from "../../../core/context/ContextTypes";
import { ContextEngineProvider } from "../../../core/context/ContextEngine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Operator {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
}

interface OperatorContextValue {
  operator: Operator | null;
  isLocked: boolean;
  unlock: (op: Operator) => void;
  lock: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const OperatorContext = createContext<OperatorContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface OperatorProviderProps {
  children: React.ReactNode;
  restaurantId: string;
}

export function OperatorProvider({ children, restaurantId: _restaurantId }: OperatorProviderProps) {
  const [operator, setOperator] = useState<Operator | null>(null);

  const isLocked = operator === null;

  const unlock = useCallback((op: Operator) => {
    setOperator(op);
  }, []);

  const lock = useCallback(() => {
    setOperator(null);
  }, []);

  const value = useMemo<OperatorContextValue>(
    () => ({ operator, isLocked, unlock, lock }),
    [operator, isLocked, unlock, lock],
  );

  return (
    <OperatorContext.Provider value={value}>
      <ContextEngineProvider userRole={operator?.role ?? "waiter"} hasTPV>
        {children}
      </ContextEngineProvider>
    </OperatorContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOperator(): OperatorContextValue {
  const ctx = useContext(OperatorContext);
  if (ctx === undefined) {
    throw new Error("useOperator must be used within an OperatorProvider");
  }
  return ctx;
}
