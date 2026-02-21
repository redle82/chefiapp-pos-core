/**
 * ORDER TIMER — AppStaff Local
 * 
 * FASE 3.3: Limpeza de Imports Cruzados
 * 
 * Versão local do OrderTimer para AppStaff.
 * Não depende de KDSMinimal.
 */

import { useEffect, useState } from 'react';

interface OrderTimerProps {
  createdAt: string; // ISO string do Core
}

type TimerState = 'normal' | 'attention' | 'delay';

export function OrderTimer({ createdAt }: OrderTimerProps) {
  const [minutes, setMinutes] = useState(0);
  const [state, setState] = useState<TimerState>('normal');

  useEffect(() => {
    // Calcular minutos decorridos e estado
    const calculateMinutes = () => {
      const created = new Date(createdAt);
      const now = new Date();
      const diffMs = now.getTime() - created.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      setMinutes(diffMinutes);

      // Determinar estado visual baseado no tempo
      if (diffMinutes < 5) {
        setState('normal');
      } else if (diffMinutes < 15) {
        setState('attention');
      } else {
        setState('delay');
      }
    };

    // Calcular imediatamente
    calculateMinutes();

    // Atualizar a cada minuto
    const interval = setInterval(calculateMinutes, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, [createdAt]);

  // Cores baseadas no estado
  const stateColors: Record<TimerState, string> = {
    normal: '#22c55e',    // Verde
    attention: '#eab308', // Amarelo
    delay: '#ef4444',     // Vermelho
  };

  return (
    <span
      style={{
        fontSize: '14px',
        color: stateColors[state],
        marginLeft: '8px',
        fontWeight: state === 'delay' ? 'bold' : 'normal',
      }}
    >
      {minutes} min
    </span>
  );
}
