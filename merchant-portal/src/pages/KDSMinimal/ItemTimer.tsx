/**
 * ITEM TIMER — Timer por Item (não por pedido)
 * 
 * REGRAS:
 * - Timer calcula tempo baseado no prep_time_seconds do item
 * - Status baseado em desvio relativo, não tempo absoluto
 * - Verde: dentro do tempo esperado
 * - Amarelo: +10-25% acima do tempo
 * - Vermelho: +25% ou mais acima
 * 
 * O pedido herda o estado do item mais crítico.
 */

import { useEffect, useState } from 'react';
import type { CoreOrderItem } from '../../infra/docker-core/types';

interface ItemTimerProps {
  item: CoreOrderItem;
}

type TimerState = 'normal' | 'attention' | 'delay' | 'ready';

interface ItemTimerResult {
  elapsedSeconds: number;
  expectedSeconds: number;
  delaySeconds: number;
  delayRatio: number; // 0.0 = no prazo, 0.1 = 10% atrasado, 0.25 = 25% atrasado
  state: TimerState;
  displayText: string;
}

export function ItemTimer({ item }: ItemTimerProps) {
  const [result, setResult] = useState<ItemTimerResult | null>(null);

  useEffect(() => {
    const calculateTimer = () => {
      const createdMs = item.created_at
        ? new Date(item.created_at).getTime()
        : NaN;
      if (!Number.isFinite(createdMs)) {
        setResult({
          elapsedSeconds: 0,
          expectedSeconds: item.prep_time_seconds || 300,
          delaySeconds: 0,
          delayRatio: 0,
          state: "normal",
          displayText: "—",
        });
        return;
      }
      const created = new Date(createdMs);
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

      // Prep time do item (snapshot no momento do pedido)
      const expectedSeconds = item.prep_time_seconds || 300; // 5 min padrão se não houver

      const delaySeconds = elapsedSeconds - expectedSeconds;
      const delayRatio = expectedSeconds > 0 ? delaySeconds / expectedSeconds : 0;

      // Determinar estado baseado em desvio relativo
      let state: TimerState;
      let displayText: string;

      if (delayRatio < 0) {
        // Ainda dentro do tempo esperado
        state = 'normal';
        const remainingSeconds = -delaySeconds;
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        displayText = remainingMinutes > 0 ? `${remainingMinutes} min` : `${remainingSeconds}s`;
      } else if (delayRatio < 0.1) {
        // Até 10% atrasado (margem de tolerância)
        state = 'normal';
        displayText = `${Math.floor(elapsedSeconds / 60)} min`;
      } else if (delayRatio < 0.25) {
        // 10-25% atrasado (atenção)
        state = 'attention';
        displayText = `+${Math.floor(delaySeconds / 60)} min`;
      } else {
        // +25% ou mais atrasado (crítico)
        state = 'delay';
        displayText = `+${Math.floor(delaySeconds / 60)} min`;
      }

      setResult({
        elapsedSeconds,
        expectedSeconds,
        delaySeconds,
        delayRatio,
        state,
        displayText,
      });
    };

    // Calcular imediatamente
    calculateTimer();

    // Atualizar a cada 5 segundos
    const interval = setInterval(calculateTimer, 5000);

    return () => clearInterval(interval);
  }, [item.created_at, item.prep_time_seconds]);

  if (!result) {
    return <span style={{ fontSize: '18px', color: '#666' }}>…</span>;
  }

  // Cores baseadas no estado
  const stateColors: Record<TimerState, string> = {
    normal: '#22c55e',    // Verde
    attention: '#eab308', // Amarelo
    delay: '#ef4444',     // Vermelho
    ready: '#6b7280',     // Cinza (item pronto)
  };

  return (
    <span
      style={{
        fontSize: '18px',
        color: stateColors[result.state],
        marginLeft: '8px',
        fontWeight: result.state === 'delay' ? 'bold' : 600,
      }}
    >
      {result.displayText}
    </span>
  );
}
