/**
 * AppStaffOperationalContext — CORE_APPSTAFF_CONTRACT
 *
 * Contexto operacional obrigatório do terminal AppStaff.
 * Inicializado no boot; governado pelo Core (lê estado, executa ações, envia eventos).
 * Não calcula regras, não decide prioridade, não altera preços.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useAppStaff } from './AppStaffContext';

// ---------------------------------------------------------------------------
// Tipos (contrato CORE_APPSTAFF_CONTRACT)
// ---------------------------------------------------------------------------

export type AppStaffRole = 'staff' | 'gerente' | 'dono';
export type AppStaffStation = 'salão' | 'bar' | 'cozinha';
export type SystemMode = 'live' | 'demo' | 'offline';

export interface AppStaffOperationalState {
  staffId: string | null;
  role: AppStaffRole;
  activeShift: string | null;
  activeStation: AppStaffStation | null;
  systemMode: SystemMode;
}

const STORAGE_KEY = 'appstaff_operational_context';

// Mapeamento StaffRole (AppStaffContext) → AppStaffRole (contrato)
function mapToContractRole(role: string): AppStaffRole {
  if (role === 'owner' || role === 'admin') return 'dono';
  if (role === 'manager' || role === 'chef' || role === 'supervisor') return 'gerente';
  return 'staff';
}

// Mapeamento por vista/papel → estação sugerida
function defaultStation(role: string): AppStaffStation {
  if (role === 'bartender') return 'bar';
  if (role === 'cook' || role === 'chef') return 'cozinha';
  return 'salão';
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const defaultState: AppStaffOperationalState = {
  staffId: null,
  role: 'staff',
  activeShift: null,
  activeStation: 'salão',
  systemMode: 'demo',
};

type AppStaffOperationalContextValue = AppStaffOperationalState & {
  setActiveStation: (station: AppStaffStation | null) => void;
  setSystemMode: (mode: SystemMode) => void;
  isReady: boolean;
};

const AppStaffOperationalContext = createContext<AppStaffOperationalContextValue | undefined>(undefined);

export function AppStaffOperationalProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const appStaff = useAppStaff?.();
  const user = session?.user ?? null;

  const [state, setState] = useState<AppStaffOperationalState>(defaultState);
  const [isReady, setIsReady] = useState(false);

  const staffId = user?.id ?? null;
  const role: AppStaffRole = appStaff ? mapToContractRole(appStaff.activeRole) : 'staff';
  const activeShift = appStaff?.shiftId ?? null;
  const activeStation = state.activeStation ?? (appStaff ? defaultStation(appStaff.activeRole) : 'salão');
  const systemMode = state.systemMode;

  const setActiveStation = useCallback((station: AppStaffStation | null) => {
    setState((prev) => ({ ...prev, activeStation: station ?? prev.activeStation }));
  }, []);

  const setSystemMode = useCallback((mode: SystemMode) => {
    setState((prev) => ({ ...prev, systemMode: mode }));
  }, []);

  // Boot: carregar estado persistido (activeStation, systemMode)
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!mounted || !raw) {
          setIsReady(true);
          return;
        }
        try {
          const parsed = JSON.parse(raw) as Partial<AppStaffOperationalState>;
          setState((prev) => ({
            ...prev,
            activeStation: parsed.activeStation ?? prev.activeStation,
            systemMode: parsed.systemMode ?? prev.systemMode,
          }));
        } catch {
          // ignore
        }
        setIsReady(true);
      })
      .catch(() => setIsReady(true));
    return () => { mounted = false; };
  }, []);

  // Persistir activeStation e systemMode
  useEffect(() => {
    if (!isReady) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ activeStation: state.activeStation, systemMode: state.systemMode })
    );
  }, [isReady, state.activeStation, state.systemMode]);

  const value: AppStaffOperationalContextValue = {
    staffId,
    role,
    activeShift,
    activeStation,
    systemMode,
    setActiveStation,
    setSystemMode,
    isReady,
  };

  return (
    <AppStaffOperationalContext.Provider value={value}>
      {children}
    </AppStaffOperationalContext.Provider>
  );
}

export function useAppStaffContext(): AppStaffOperationalContextValue {
  const ctx = useContext(AppStaffOperationalContext);
  if (!ctx) {
    throw new Error('useAppStaffContext must be used within AppStaffOperationalProvider');
  }
  return ctx;
}
