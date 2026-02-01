# Teste Massivo Simultâneo - Guia Completo

**Objetivo:** Validar Core sob carga real com múltiplos pedidos simultâneos.

---

## 🎯 O Que Este Teste Valida

1. **Concorrência Real**
   - Múltiplos pedidos simultâneos
   - Constraint `idx_one_open_order_per_table` sob pressão
   - Latência sob carga

2. **Robustez do RPC**
   - `create_order_atomic` funciona sob carga
   - Transações atômicas preservadas
   - Erros tratados corretamente

3. **Integridade de Dados**
   - Nenhum pedido perdido
   - Nenhuma constraint violada
   - Consistência preservada

---

## 🚀 Quick Start

### Executar Teste Básico

```bash
./scripts/run-massive-concurrent-test.sh
```

Isso executa:
- 50 pedidos
- Concorrência de 10
- Restaurante piloto

### Executar Teste Customizado

```bash
./scripts/run-massive-concurrent-test.sh --orders=100 --concurrency=20
```

---

## 📊 Resultados Esperados

### ✅ Teste Passou

```
✅ Sucesso: 48/50 (96.0%)
❌ Falhas: 2
🔒 Violações de Constraint: 2

LATÊNCIA:
- Média: 245ms
- P95: 512ms
- Máxima: 890ms

THROUGHPUT: 12.5 pedidos/segundo
```

**Interpretação:**
- Core aguenta carga real
- Constraint funciona (2 falhas esperadas por concorrência)
- Latência aceitável

---

### ⚠️ Teste Passou com Warnings

```
✅ Sucesso: 45/50 (90.0%)
❌ Falhas: 5
🔒 Violações de Constraint: 5

LATÊNCIA:
- Média: 680ms
- P95: 1200ms
- Máxima: 2100ms
```

**Interpretação:**
- Core funciona, mas sob pressão
- Aceitável para piloto inicial
- Monitorar em produção

---

### ❌ Teste Falhou

```
✅ Sucesso: 30/50 (60.0%)
❌ Falhas: 20
🔒 Violações de Constraint: 15

LATÊNCIA:
- Média: 2500ms
- P95: 5000ms
```

**Interpretação:**
- Bug real ou ambiente mal configurado
- Investigar antes de continuar

---

## 🔍 Troubleshooting

### Erro: "No products found"

**Causa:** Restaurante piloto não tem produtos

**Solução:**
```bash
cd docker-core
docker compose -f docker-compose.core.yml exec postgres \
  psql -U postgres -d chefiapp_core \
  -c "SELECT COUNT(*) FROM gm_products WHERE restaurant_id = '00000000-0000-0000-0000-000000000100';"
```

Se retornar 0, execute:
```bash
cd docker-core
docker compose -f docker-compose.core.yml down -v
docker compose -f docker-compose.core.yml up -d
```

---

### Erro: "Connection refused"

**Causa:** PostgREST não está rodando

**Solução:**
```bash
cd docker-core
docker compose -f docker-compose.core.yml ps postgrest
docker compose -f docker-compose.core.yml logs postgrest
```

---

### Taxa de Sucesso Baixa (< 90%)

**Possíveis Causas:**
1. Constraint sendo violada (bug real)
2. Concorrência muito alta para ambiente
3. Postgres sob carga

**Ação:**
- Reduzir concurrency: `--concurrency=5`
- Verificar logs do Postgres
- Validar constraint manualmente

---

## 📈 Próximos Passos Após Teste

### Se Teste Passou

1. ✅ Avançar para piloto real
2. ✅ Documentar resultados
3. ✅ Configurar monitoramento

### Se Teste Falhou

1. ❌ Investigar causa raiz
2. ❌ Corrigir antes de continuar
3. ❌ Re-executar teste

---

*"Teste massivo não é sobre perfeição. É sobre descobrir limites reais."*
