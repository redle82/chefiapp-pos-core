# TESTE D — Realtime + KDS

**Objetivo:** Validar que o Core sólido se manifesta corretamente na operação em tempo real.

**Status:** 🔴 Próximo passo crítico  
**Dependências:** Core validado (TESTE A + B ✅)

---

## 🎯 Objetivo do Teste

Este teste **não é sobre banco**. É sobre **confiança da cozinha**.

Validar que:
- Pedidos aparecem no KDS **uma única vez**
- Ordem correta (sem inversões)
- Sem "pedido ressuscitado" (reabertura não reemite eventos antigos)
- Sem duplicação
- Latência perceptiva aceitável (<300ms visual)
- Reabertura não reemite eventos antigos

---

## ✅ Checklist de Validação

### 1. Pedido aparece no KDS uma única vez
- [ ] Criar pedido via RPC
- [ ] Verificar que aparece no KDS **exatamente 1 vez**
- [ ] Não aparece novamente após refresh
- [ ] Não aparece após reconexão

### 2. Ordem correta
- [ ] Criar 3 pedidos em sequência rápida
- [ ] Verificar que aparecem no KDS na ordem correta
- [ ] Verificar que `created_at` corresponde à ordem visual

### 3. Sem "pedido ressuscitado"
- [ ] Criar pedido
- [ ] Fechar pedido
- [ ] Reabrir pedido na mesma mesa
- [ ] Verificar que **não** aparece como "novo" no KDS
- [ ] Verificar que aparece como "reaberto" ou não aparece (dependendo da regra de negócio)

### 4. Sem duplicação
- [ ] Criar pedido simultaneamente de múltiplas fontes (TPV + API + Mobile)
- [ ] Verificar que aparece **exatamente 1 vez** no KDS
- [ ] Verificar constraint `idx_one_open_order_per_table` funcionando

### 5. Latência perceptiva aceitável
- [ ] Criar pedido
- [ ] Medir tempo até aparecer no KDS
- [ ] Deve ser < 300ms (perceptivo)
- [ ] Ideal: < 100ms (imperceptível)

### 6. Reabertura não reemite eventos antigos
- [ ] Criar pedido (evento 1)
- [ ] Fechar pedido
- [ ] Criar novo pedido na mesma mesa (evento 2)
- [ ] Verificar que **só** o evento 2 aparece no KDS
- [ ] Verificar que evento 1 não "ressuscita"

---

## 🧪 Script de Teste Automatizado

### Pré-requisitos

1. **Docker Core rodando:**
   ```bash
   cd docker-core
   docker compose -f docker-compose.core.yml up -d
   ```

2. **Realtime funcionando:**
   ```bash
   # Verificar logs
   docker compose -f docker-compose.core.yml logs realtime
   
   # Deve mostrar: "Running" (não "Restarting")
   ```

3. **UI rodando (para KDS visual):**
   ```bash
   cd merchant-portal
   npm run dev
   # Abrir http://localhost:5173/app/kds?demo=true
   ```

### Executar Teste

```bash
./scripts/run-realtime-kds-test.sh
```

---

## 📊 Critérios de Sucesso

| Critério | Esperado | Tolerância |
|----------|----------|------------|
| Pedidos únicos | 100% | 0 duplicações |
| Ordem correta | 100% | 0 inversões |
| Sem ressuscitação | 100% | 0 eventos antigos |
| Latência visual | < 300ms | < 500ms aceitável |
| Reabertura limpa | 100% | 0 eventos órfãos |

**Status geral:** ✅ PASS se todos os critérios passarem

---

## 🔍 Pontos de Observação

### Durante o Teste

1. **Abrir DevTools no KDS:**
   - Network tab → verificar WebSocket connections
   - Console → verificar erros de Realtime
   - Verificar subscriptions ativas

2. **Observar comportamento visual:**
   - Pedido aparece suavemente ou "pula"?
   - Há flicker ou re-render desnecessário?
   - Ordem visual corresponde à ordem temporal?

3. **Testar edge cases:**
   - Criar pedido enquanto KDS está "dormindo" (tab inativa)
   - Criar pedido durante reconexão de rede
   - Criar múltiplos pedidos simultaneamente

---

## 🐛 Troubleshooting

### Problema: Pedido não aparece no KDS

**Possíveis causas:**
1. Realtime não está rodando
2. Subscription não está ativa
3. RLS bloqueando eventos
4. WebSocket desconectado

**Solução:**
```bash
# Verificar Realtime
docker compose -f docker-compose.core.yml logs realtime

# Verificar subscription no console do navegador
# Deve mostrar: "SUBSCRIBED" para channel "orders"
```

### Problema: Pedido aparece múltiplas vezes

**Possíveis causas:**
1. Múltiplas subscriptions ativas
2. Evento sendo emitido múltiplas vezes
3. Re-render desnecessário no frontend

**Solução:**
- Verificar que há apenas 1 subscription por pedido
- Verificar que `INSERT` no banco acontece apenas 1 vez
- Verificar que frontend não está re-subscribindo

### Problema: Latência alta (>500ms)

**Possíveis causas:**
1. Realtime com delay
2. Network lag
3. Frontend não otimizado

**Solução:**
- Verificar logs do Realtime
- Testar em rede local (sem internet)
- Verificar se há debounce/throttle desnecessário

---

## 📝 Relatório Esperado

Após executar o teste, você deve ter:

1. **Logs do teste:**
   - Quantos pedidos foram criados
   - Quantos apareceram no KDS
   - Latência média/máxima
   - Erros encontrados

2. **Observações visuais:**
   - Comportamento do KDS durante o teste
   - Problemas de UX (se houver)
   - Pontos de confusão

3. **Métricas:**
   - Taxa de sucesso (pedidos que apareceram / pedidos criados)
   - Latência média
   - Número de duplicações (deve ser 0)

---

## 🎯 Próximo Passo Após TESTE D

Se TESTE D passar:
- ✅ Core + Realtime validados
- ✅ Pronto para TESTE C (Concorrência + Tempo)
- ✅ Pronto para TESTE E (Offline)

Se TESTE D falhar:
- 🔍 Diagnosticar problema (Realtime vs Frontend)
- 🔧 Corrigir problema específico
- 🔄 Re-executar TESTE D

---

_Teste crítico para validação operacional do Core._
