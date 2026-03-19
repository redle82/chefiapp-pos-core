import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { UserRole } from "../../../core/context/ContextTypes";
import { ContextEngineProvider } from "../../../core/context/ContextEngine";
import { dockerCoreClient } from "../../../infra/docker-core/connection";

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
  /** True when no operator is selected at all (initial state or after expiry). */
  isLocked: boolean;
  /** True when operator session is locked (tier 2) — operator preserved, PIN needed. */
  isSessionLocked: boolean;
  unlock: (op: Operator) => void;
  /** Clears operator entirely (tier 3 / full expiry). */
  lock: () => void;
  /** Locks session without clearing operator (tier 2 — PIN to re-enter). */
  lockSession: () => void;
  /** Verifies PIN and unlocks the session. Returns true on success. */
  unlockSession: (pin?: string) => Promise<boolean>;
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

export function OperatorProvider({ children, restaurantId }: OperatorProviderProps) {
  const [operator, setOperator] = useState<Operator | null>(null);
  const [sessionLocked, setSessionLocked] = useState(false);

  // Cache PIN on staff fetch so we don't need a round-trip every unlock attempt.
  // Falls back to DB check if cache is empty.
  const pinCacheRef = useRef<Map<string, string | null>>(new Map());

  const isLocked = operator === null;
  const isSessionLocked = sessionLocked && operator !== null;

  const unlock = useCallback((op: Operator) => {
    setOperator(op);
    setSessionLocked(false);
  }, []);

  const lock = useCallback(() => {
    setOperator(null);
    setSessionLocked(false);
    pinCacheRef.current.clear();
  }, []);

  const lockSession = useCallback(() => {
    if (operator !== null) {
      setSessionLocked(true);
    }
  }, [operator]);

  const unlockSession = useCallback(
    async (pin?: string): Promise<boolean> => {
      if (!operator) return false;

      // Check if operator has a PIN
      let storedPin = pinCacheRef.current.get(operator.id);

      // If not in cache, fetch from DB
      if (storedPin === undefined) {
        try {
          const { data } = await dockerCoreClient
            .from("gm_staff")
            .select("pin")
            .eq("id", operator.id)
            .eq("restaurant_id", restaurantId)
            .single();

          storedPin = (data as { pin: string | null } | null)?.pin ?? null;
          pinCacheRef.current.set(operator.id, storedPin);
        } catch {
          // DB error — fall through to allow unlock if no PIN configured
          storedPin = null;
        }
      }

      // No PIN configured — unlock immediately
      if (!storedPin) {
        setSessionLocked(false);
        return true;
      }

      // Verify PIN
      if (pin === storedPin) {
        setSessionLocked(false);
        return true;
      }

      return false;
    },
    [operator, restaurantId],
  );

  const value = useMemo<OperatorContextValue>(
    () => ({ operator, isLocked, isSessionLocked, unlock, lock, lockSession, unlockSession }),
    [operator, isLocked, isSessionLocked, unlock, lock, lockSession, unlockSession],
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
