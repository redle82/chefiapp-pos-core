# TESTE C — Concorrência + Tempo

**Objetivo:** Validar que o Core mantém consistência e performance ao longo do tempo, mesmo com pedidos abertos por períodos longos.

---

## 🎯 O Que Este Teste Valida

### 1. Performance ao Longo do Tempo
- Pedidos abertos por períodos longos (30s, 2min, 10min) não degradam performance
- Latência de operações permanece estável mesmo após esperas longas
- Nenhuma degradação de memória ou locks

### 2. Reabertura Após Espera
- Mesas podem ser reabertas corretamente após pedidos fechados
- Constraint `idx_one_open_order_per_table` libera corretamente
- Nenhuma mesa fica "travada" após esperas longas

### 3. Consistência de Estado
- Estado do pedido permanece consistente mesmo após esperas longas
- Nenhum pedido "zumbi" ou estado inconsistente
- Transações não ficam penduradas

---

## 📋 Checklist de Validação

### ✅ Critérios de Sucesso

- [ ] **100% dos ciclos completados com sucesso**
- [ ] **0 degradações de performance** (latência < 3x baseline)
- [ ] **0 inconsistências de estado**
- [ ] **Latência média < 50ms** para todas as operações
- [ ] **Latência máxima < 200ms** mesmo após esperas longas
- [ ] **Nenhum erro de constraint ou lock**

### ⚠️ Critérios de Falha

- [ ] Qualquer ciclo falha
- [ ] Latência > 3x baseline após espera
- [ ] Estado inconsistente detectado
- [ ] Erros de constraint ou lock
- [ ] Degradação progressiva de performance

---

## 🔧 Como Executar

### Execução Básica

```bash
./scripts/run-concurrency-time-test.sh
```

### Execução Customizada

```bash
# 50 ciclos, esperas de 30s, 2min e 10min, 10 mesas
./scripts/run-concurrency-time-test.sh \
  --cycles=50 \
  --wait-times=30,120,600 \
  --tables=10
```

### Execução Direta (TypeScript)

```bash
npx ts-node scripts/test-concurrency-time.ts \
  --cycles=50 \
  --wait-times=30,120,600 \
  --tables=10
```

---

## 📊 O Que Observar

### Durante a Execução

1. **Latência Baseline**
   - Medida no início do teste
   - Usada como referência para detectar degradação

2. **Ciclos de Teste**
   - Cada ciclo: abrir → esperar → fechar → reabrir
   - Latência medida em cada etapa
   - Estado verificado após espera

3. **Performance por Tempo de Espera**
   - Latência agrupada por tempo de espera
   - Detecta se esperas longas causam degradação

### Após a Execução

1. **Relatório JSON**
   - Salvo em `test-results/concurrency-time-test-*.json`
   - Contém métricas detalhadas por ciclo

2. **Métricas Principais**
   - Total de ciclos vs. ciclos bem-sucedidos
   - Degradações de performance detectadas
   - Inconsistências de estado
   - Latência média e máxima por operação
   - Latência agrupada por tempo de espera

---

## 🔍 Interpretação dos Resultados

### ✅ Teste Passou

**Significa:**
- Core mantém performance estável mesmo com esperas longas
- Estado permanece consistente
- Nenhuma degradação detectada
- Sistema está pronto para operação em produção

**Próximo passo:**
- Avançar para TESTE E (Offline)
- Ou corrigir Realtime e re-executar TESTE D

### ❌ Teste Falhou

**Possíveis causas:**

1. **Degradação de Performance**
   - Latência aumentou muito após esperas
   - Possível problema de locks ou memória
   - **Ação:** Verificar logs do PostgreSQL, analisar locks

2. **Inconsistência de Estado**
   - Pedido mudou de estado durante espera
   - Possível problema de transação ou constraint
   - **Ação:** Verificar logs, analisar estado do banco

3. **Falhas de Ciclo**
   - Alguns ciclos falharam
   - Possível problema de constraint ou RPC
   - **Ação:** Verificar erros específicos no relatório JSON

---

## 📈 Métricas Esperadas

### Latência (Local/Docker)

| Operação | Esperado | Aceitável | Crítico |
|----------|----------|-----------|---------|
| Abrir pedido | < 20ms | < 50ms | > 100ms |
| Fechar pedido | < 10ms | < 30ms | > 50ms |
| Reabrir pedido | < 20ms | < 50ms | > 100ms |

### Performance por Tempo de Espera

| Espera | Latência Esperada | Degradação Aceitável |
|--------|-------------------|----------------------|
| 30s | < 20ms | < 3x baseline |
| 2min | < 20ms | < 3x baseline |
| 10min | < 30ms | < 3x baseline |

---

## 🚨 Troubleshooting

### Problema: Degradação de Performance

**Sintoma:** Latência aumenta após esperas longas

**Possíveis causas:**
- Locks no PostgreSQL não liberados
- Conexões do pool não sendo reutilizadas
- Memória do PostgreSQL esgotada

**Solução:**
1. Verificar locks: `SELECT * FROM pg_locks WHERE NOT granted;`
2. Verificar conexões: `SELECT count(*) FROM pg_stat_activity;`
3. Verificar memória: `docker stats chefiapp-core-postgres`

### Problema: Inconsistência de Estado

**Sintoma:** Pedido muda de estado durante espera

**Possíveis causas:**
- Transação não commitada
- Constraint violada silenciosamente
- Problema de isolamento de transação

**Solução:**
1. Verificar estado do pedido: `SELECT * FROM gm_orders WHERE id = '...';`
2. Verificar logs do PostgreSQL
3. Verificar se há outras conexões modificando o pedido

### Problema: Falhas de Ciclo

**Sintoma:** Alguns ciclos falham com erro de constraint

**Possíveis causas:**
- Constraint não liberada após fechamento
- Race condition entre ciclos
- Problema de timing

**Solução:**
1. Verificar se pedido foi fechado: `SELECT status FROM gm_orders WHERE id = '...';`
2. Verificar constraint: `SELECT * FROM pg_indexes WHERE indexname = 'idx_one_open_order_per_table';`
3. Aumentar delay entre ciclos se necessário

---

## 📝 Notas Importantes

1. **Tempo de Execução**
   - Este teste pode levar tempo significativo (depende dos tempos de espera)
   - 50 ciclos com esperas de 30s, 2min, 10min ≈ 20-30 minutos

2. **Recursos**
   - Teste usa múltiplas conexões ao banco
   - Verifique se há recursos suficientes (CPU, memória)

3. **Ambiente**
   - Teste deve rodar contra Docker Core limpo
   - Não deve haver outras operações concorrentes

---

## ✅ Critérios de Aprovação Final

O TESTE C é considerado **aprovado** quando:

1. ✅ 100% dos ciclos completados com sucesso
2. ✅ 0 degradações de performance
3. ✅ 0 inconsistências de estado
4. ✅ Latência média < 50ms
5. ✅ Latência máxima < 200ms mesmo após esperas longas

**Se todos os critérios forem atendidos:**
- Core está validado para operação de longo prazo
- Pode avançar para TESTE E (Offline)
- Sistema está pronto para produção

---

_Última atualização: 2026-01-25_
