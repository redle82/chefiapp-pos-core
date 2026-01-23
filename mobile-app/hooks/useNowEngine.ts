/**
 * Hook para usar o NOW ENGINE no AppStaff
 */

import { useEffect, useState } from 'react';
import { nowEngine, NowAction } from '@/services/NowEngine';
import { useAppStaff } from '@/context/AppStaffContext';
import { useRestaurant } from '@/context/RestaurantContext';

export function useNowEngine() {
  const { operationalContext, activeRole } = useAppStaff();
  const { activeRestaurant } = useRestaurant();
  const [nowAction, setNowAction] = useState<NowAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState<number>(0); // ERRO-008 Fix

  // Usar restaurante ativo do RestaurantContext (multi-tenant) ou fallback para businessId
  const restaurantId = activeRestaurant?.id || operationalContext.businessId;

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    // Iniciar NOW ENGINE com restaurante ativo
    nowEngine.start(restaurantId, activeRole);

    // Escutar ações
    const listener = async (action: NowAction | null) => {
      setNowAction(action);
      setLoading(false);
      // ERRO-008 Fix: Atualizar contador de ações pendentes sempre que ação mudar
      const count = await nowEngine.getPendingActionsCount();
      setPendingCount(count);
    };

    nowEngine.subscribe(listener);
    
    // ERRO-008 Fix: Buscar contador inicial
    nowEngine.getPendingActionsCount().then(setPendingCount);
    
    // ERRO-008 Fix: Atualizar contador a cada 10s para manter sincronizado
    const countInterval = setInterval(async () => {
      const count = await nowEngine.getPendingActionsCount();
      setPendingCount(count);
    }, 10000);

    // Atualizar role quando mudar
    nowEngine.setRole(activeRole);

    return () => {
      clearInterval(countInterval);
      nowEngine.unsubscribe(listener);
      nowEngine.stop();
    };
  }, [restaurantId, activeRole]);

  const completeAction = async (actionId: string) => {
    await nowEngine.completeAction(actionId);
    // Ação será atualizada automaticamente via listener
  };

  return {
    nowAction,
    loading,
    completeAction,
    pendingCount // ERRO-008 Fix
  };
}
