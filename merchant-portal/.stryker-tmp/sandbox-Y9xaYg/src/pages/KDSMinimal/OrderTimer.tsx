/**
 * ORDER TIMER — FASE 4 + FASE 5
 * 
 * Componente que calcula e exibe tempo decorrido desde criação do pedido.
 * FASE 5: Aplica estados visuais baseados no tempo.
 * 
 * REGRAS:
 * - Calcular tempo a partir do Core (created_at)
 * - Exibir em minutos
 * - Atualizar a cada minuto
 * - Sem drift (usar timestamp do Core como fonte de verdade)
 * - Estados visuais:
 *   - Normal: < 5 min (verde)
 *   - Atenção: 5-15 min (amarelo)
 *   - Atraso: > 15 min (vermelho)
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
      
      // Forçar atualização mesmo se o valor não mudou (para garantir re-render)
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

    // Atualizar a cada 5 segundos para feedback visual mais responsivo
    // (mesmo sem realtime, o timer deve atualizar visualmente)
    const interval = setInterval(calculateMinutes, 5000); // 5 segundos (mais frequente)

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
