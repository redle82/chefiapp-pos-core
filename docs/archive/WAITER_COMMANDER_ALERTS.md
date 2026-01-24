# Sistema de Alertas — Especificação Técnica

**Componente**: `AlertSystem`  
**Princípio**: Visual + Sonoro, Prioridades, Deduplicação, Nunca Spam.

---

## 🎯 FUNCIONALIDADES

### Prioridades
- **P0 (URGENTE)**: Vermelho, beep 800Hz, 200ms
  - Mesa chamando 3x+
  - Reclamação
  - Atraso crítico
- **P1 (ALTA)**: Laranja, beep 600Hz, 150ms
  - Cozinha pronta
  - Conta solicitada
- **P2 (MÉDIA)**: Azul, beep 400Hz, 100ms
  - Novo pedido
  - Atualização de status
- **P3 (BAIXA)**: Cinza, beep 300Hz, 50ms
  - Lembrete de rotina

### Deduplicação
- 3 chamados da mesma mesa = 1 alerta P0
- Agrupamento por prioridade
- Badge "+N" para múltiplos

### Feedback
- **Visual**: Badge colorido, animação piscante (P0)
- **Sonoro**: Beep curto (Web Audio API)
- **Tátil**: Vibração (quando disponível)

### Ações
- **Atender**: Marca como lido, remove alerta
- **Snooze**: Adia 2/5 minutos
- **Auto-dismiss**: Após X minutos (configurável)

---

## 📐 UI/UX

### Posicionamento
- Fixo no topo direito
- Abaixo do mini-mapa
- z-index: 1000
- Max-width: 320px

### Design
- Card com borda colorida (por prioridade)
- Background semi-transparente
- Sombra para destaque
- Animação piscante (apenas P0)

### Interação
- Botão "Atender" (principal)
- Botão "2min" (snooze)
- Botão "✓" (fechar)

---

## 🔧 IMPLEMENTAÇÃO

### Hook: `useWaiterCalls`
- Deduplica chamados
- Agrupa por mesa
- Ordena por prioridade + tempo

### Componente: `AlertSystem`
- Renderiza alertas por prioridade
- Toca beeps (Web Audio API)
- Gerencia estado (lido/não lido)

### Integração
- Conectado ao `TablePanel`
- Recebe alertas em tempo real
- Atualiza badges na `BottomNavBar`

---

## 🎵 SISTEMA DE SONS

### Web Audio API
```typescript
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();

oscillator.frequency.value = 800; // Hz (P0)
oscillator.type = 'sine';
gainNode.gain.exponentialRampToValueAtTime(0.01, duration);
```

### Frequências por Prioridade
- P0: 800Hz (agudo, urgente)
- P1: 600Hz (médio-alto)
- P2: 400Hz (médio)
- P3: 300Hz (baixo, discreto)

---

## 📊 MÉTRICAS

### Monitoramento
- Tempo médio de resposta (alerta → ação)
- Taxa de snooze
- Alertas não lidos
- Prioridade mais comum

### Otimizações
- Evitar spam (máx 1 beep por alerta)
- Cache de beeps (não repetir)
- Throttle de notificações

---

**ChefIApp — O dedo trabalha. A cabeça respira.**

