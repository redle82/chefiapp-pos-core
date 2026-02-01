# TESTE E — Offline / Replay

**Objetivo:** Validar que o Core aceita e processa corretamente pedidos criados durante períodos offline, garantindo replay consistente quando a conexão é restaurada.

---

## 🎯 O Que Este Teste Valida

### 1. Replay de Pedidos Offline
- Pedidos criados durante offline são processados corretamente quando conexão volta
- Nenhum pedido é perdido durante replay
- Ordem de replay é respeitada (FIFO)
- Constraint é respeitada mesmo após replay

### 2. Consistência Pós-Replay
- Estado final é consistente após replay
- Nenhum pedido duplicado
- Nenhum pedido órfão
- Constraint funciona corretamente após replay

### 3. Idempotência
- Replay múltiplo não cria duplicatas
- Replay parcial (alguns sucessos, alguns falhas) não corrompe estado
- Replay pode ser interrompido e retomado sem problemas

---

## 📋 Checklist de Validação

### ✅ Critérios de Sucesso

- [ ] **100% dos pedidos offline são replayados**
- [ ] **0 pedidos perdidos** durante replay
- [ ] **0 duplicações** após replay
- [ ] **Ordem correta** (FIFO respeitado)
- [ ] **Constraint respeitada** (mesa com pedido aberto não aceita novo)
- [ ] **Estado consistente** após replay completo
- [ ] **Idempotência** (replay múltiplo não cria duplicatas)

### ⚠️ Critérios de Falha

- [ ] Qualquer pedido offline não é replayado
- [ ] Duplicação detectada após replay
- [ ] Ordem incorreta (pedido mais recente processado antes de mais antigo)
- [ ] Constraint violada após replay
- [ ] Estado inconsistente detectado
- [ ] Replay múltiplo cria duplicatas

---

## 🔧 Como Executar

### Execução Básica

```bash
./scripts/run-offline-replay-test.sh
```

### Execução Customizada

```bash
# 20 pedidos offline, 3 períodos de queda
./scripts/run-offline-replay-test.sh \
  --offline-orders=20 \
  --network-drops=3 \
  --drop-duration=10
```

---

## 📊 O Que Observar

### Durante a Execução

1. **Fase Offline**
   - Pedidos criados e armazenados localmente
   - Nenhum pedido enviado ao Core
   - Fila local cresce

2. **Fase Replay**
   - Conexão restaurada
   - Pedidos processados em ordem (FIFO)
   - Cada pedido validado individualmente

3. **Fase Validação**
   - Estado final verificado
   - Duplicações verificadas
   - Consistência verificada

### Após a Execução

1. **Relatório JSON**
   - `test-results/offline-replay-test-*.json`
   - Métricas detalhadas por fase

2. **Métricas Principais**
   - Total de pedidos offline vs. replayados
   - Pedidos perdidos
   - Duplicações
   - Ordem correta
   - Latência de replay

---

## 🔍 Interpretação dos Resultados

### ✅ Teste Passou

**Significa:**
- Core aceita replay de pedidos offline corretamente
- Nenhum pedido é perdido
- Estado permanece consistente
- Sistema está pronto para operação offline em produção

**Próximo passo:**
- Core está completamente validado
- Sistema pronto para produção
- Todos os testes críticos passaram

### ❌ Teste Falhou

**Possíveis causas:**

1. **Pedidos Perdidos**
   - Replay não processou todos os pedidos
   - Possível problema de fila ou ordem
   - **Ação:** Verificar lógica de replay, verificar ordem FIFO

2. **Duplicações**
   - Replay criou pedidos duplicados
   - Possível problema de idempotência
   - **Ação:** Verificar lógica de idempotência, verificar sync_metadata

3. **Ordem Incorreta**
   - Pedidos processados fora de ordem
   - Possível problema de fila
   - **Ação:** Verificar implementação FIFO

4. **Constraint Violada**
   - Replay violou constraint de mesa
   - Possível problema de timing ou estado
   - **Ação:** Verificar lógica de constraint, verificar estado de mesas

---

## 📈 Métricas Esperadas

### Replay (Local/Docker)

| Métrica | Esperado | Aceitável | Crítico |
|---------|----------|-----------|---------|
| Taxa de sucesso | 100% | 100% | < 100% |
| Pedidos perdidos | 0 | 0 | > 0 |
| Duplicações | 0 | 0 | > 0 |
| Latência replay | < 50ms/pedido | < 100ms/pedido | > 200ms/pedido |

---

## 🚨 Troubleshooting

### Problema: Pedidos Perdidos

**Sintoma:** Alguns pedidos offline não são replayados

**Possíveis causas:**
- Fila local não persiste corretamente
- Replay interrompido antes de completar
- Erro durante replay não tratado

**Solução:**
1. Verificar persistência da fila local
2. Verificar logs de replay
3. Verificar tratamento de erros

### Problema: Duplicações

**Sintoma:** Pedidos duplicados após replay

**Possíveis causas:**
- Replay executado múltiplas vezes
- Idempotência não funciona
- sync_metadata não usado corretamente

**Solução:**
1. Verificar lógica de idempotência no RPC
2. Verificar uso de sync_metadata
3. Verificar se replay é idempotente

### Problema: Ordem Incorreta

**Sintoma:** Pedidos processados fora de ordem

**Possíveis causas:**
- Fila não é FIFO
- Processamento paralelo sem controle de ordem
- Race condition durante replay

**Solução:**
1. Verificar implementação FIFO
2. Verificar processamento sequencial
3. Verificar controle de concorrência

---

## 📝 Notas Importantes

1. **Simulação de Offline**
   - Teste simula offline bloqueando conexão ao banco
   - Pedidos são criados localmente (em memória/fila simulada)
   - Replay acontece quando conexão é restaurada

2. **Idempotência**
   - Teste valida que replay múltiplo não cria duplicatas
   - Usa sync_metadata para garantir idempotência

3. **Ordem FIFO**
   - Teste valida que pedidos são processados em ordem
   - Primeiro pedido offline deve ser primeiro a ser replayado

---

## ✅ Critérios de Aprovação Final

O TESTE E é considerado **aprovado** quando:

1. ✅ 100% dos pedidos offline são replayados
2. ✅ 0 pedidos perdidos
3. ✅ 0 duplicações
4. ✅ Ordem correta (FIFO)
5. ✅ Constraint respeitada
6. ✅ Estado consistente
7. ✅ Idempotência funcionando

**Se todos os critérios forem atendidos:**
- Core está completamente validado
- Sistema está pronto para produção
- Todos os testes críticos passaram

---

_Última atualização: 2026-01-25_
