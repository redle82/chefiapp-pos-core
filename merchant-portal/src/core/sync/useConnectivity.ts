/**
 * useConnectivity — Hook para UI usar a fonte única ConnectivityService.
 * Regra: para estado operacional online/offline/degraded, usar apenas este hook ou ConnectivityService directo.
 */

import { useEffect, useState } from 'react';
import { ConnectivityService, type ConnectivityStatus } from './ConnectivityService';

export function useConnectivity(): ConnectivityStatus {
  const [status, setStatus] = useState<ConnectivityStatus>(() =>
    ConnectivityService.getConnectivity()
  );

  useEffect(() => {
    return ConnectivityService.subscribe(setStatus);
  }, []);

  return status;
}
