# Checklist de Validação - Teste Massivo Simultâneo

**Objetivo:** Validar Core sob carga real com múltiplos pedidos simultâneos.

---

## ✅ Pré-requisitos

- [ ] Docker Core rodando (`docker compose ps`)
- [ ] Postgres saudável
- [ ] PostgREST respondendo (`curl http://localhost:3001`)
- [ ] Realtime funcionando (`curl http://localhost:4000/health`)
- [ ] Restaurante piloto configurado (1 restaurante, 10 mesas, 7 produtos)
- [ ] `.env` configurado com URL do Docker Core

---

## 🧪 Fase A1: Stress Lógico

### Executar Teste

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
npx ts-node scripts/massive-concurrent-test.ts --orders=50 --concurrency=10
```

### Critérios de Sucesso

- [ ] Taxa de sucesso >= 95%
- [ ] Constraint respeitada (0 violações de `idx_one_open_order_per_table`)
- [ ] Latência média < 500ms
- [ ] P95 Latency < 1000ms
- [ ] Throughput > 5 pedidos/segundo

### O Que Observar

**Sucesso:**
- ✅ Pedidos criados via RPC `create_order_atomic`
- ✅ Constraint bloqueia corretamente (mesa com pedido aberto)
- ✅ Latência consistente mesmo sob carga
- ✅ Nenhum pedido perdido

**Falhas Esperadas (e aceitáveis):**
- ⚠️ Alguns pedidos falham por constraint (esperado em teste de concorrência)
- ⚠️ Latência aumenta com carga (normal)

**Falhas Críticas (não aceitáveis):**
- ❌ Taxa de sucesso < 90%
- ❌ Constraint violada (mesa com 2+ pedidos abertos)
- ❌ Erros de conexão/banco
- ❌ Pedidos duplicados

---

## 🧪 Fase A2: Stress de Interfaces (Manual)

### Setup

1. Abrir 4 abas do navegador:
   - TPV: `http://localhost:5173/app/tpv?demo=true`
   - KDS: `http://localhost:5173/app/kds?demo=true`
   - Dashboard: `http://localhost:5173/app/dashboard?demo=true`
   - Mobile (simulado): Expo Dev Tools

### Teste Simultâneo

- [ ] Criar pedido no TPV
- [ ] Verificar: aparece no KDS?
- [ ] Verificar: aparece no Dashboard?
- [ ] Criar pedido via Web (se disponível)
- [ ] Verificar: aparece no KDS?
- [ ] Verificar: aparece no Dashboard?
- [ ] Tentar criar segundo pedido na mesma mesa
- [ ] Verificar: erro claro de constraint?

### Critérios de Sucesso

- [ ] Pedidos aparecem em tempo real no KDS
- [ ] Dashboard atualiza automaticamente
- [ ] Erros de constraint são claros
- [ ] Nenhum pedido "perdido" entre interfaces

---

## 🧪 Fase A3: Offline Brutal (Futuro)

### Setup

1. Desligar rede (ou bloquear PostgREST)
2. Criar pedidos offline
3. Reativar rede
4. Verificar replay

### Critérios de Sucesso

- [ ] Pedidos criados offline são enfileirados
- [ ] Replay funciona ao reconectar
- [ ] Nenhum pedido duplicado
- [ ] Ordem cronológica preservada

---

## 📊 Interpretação dos Resultados

### ✅ Teste Passou

**Significa:**
- Core aguenta carga real
- Constraints funcionam sob pressão
- Sistema está pronto para piloto

**Próximo passo:**
- Avançar para piloto real de 7 dias

---

### ⚠️ Teste Passou com Warnings

**Exemplos:**
- Taxa de sucesso 90-95% (aceitável)
- Algumas violações de constraint esperadas (concorrência)
- Latência P95 > 1000ms mas < 2000ms

**Significa:**
- Core funciona, mas pode melhorar
- Aceitável para piloto inicial

**Próximo passo:**
- Documentar warnings
- Avançar para piloto com monitoramento

---

### ❌ Teste Falhou

**Exemplos:**
- Taxa de sucesso < 90%
- Constraint violada (mesa com 2+ pedidos abertos)
- Erros de conexão/banco
- Pedidos duplicados

**Significa:**
- Bug real no Core ou ambiente
- Não avançar para piloto

**Próximo passo:**
- Investigar causa raiz
- Corrigir antes de continuar

---

## 🔍 Debugging

### Se Teste Falhar

1. **Verificar logs do Postgres:**
   ```bash
   docker compose -f docker-core/docker-compose.core.yml logs postgres | tail -50
   ```

2. **Verificar logs do PostgREST:**
   ```bash
   docker compose -f docker-core/docker-compose.core.yml logs postgrest | tail -50
   ```

3. **Verificar pedidos no banco:**
   ```bash
   docker compose -f docker-core/docker-compose.core.yml exec postgres \
     psql -U postgres -d chefiapp_core \
     -c "SELECT COUNT(*) FROM gm_orders WHERE restaurant_id = '00000000-0000-0000-0000-000000000100';"
   ```

4. **Verificar constraint:**
   ```bash
   docker compose -f docker-core/docker-compose.core.yml exec postgres \
     psql -U postgres -d chefiapp_core \
     -c "SELECT table_id, COUNT(*) as open_orders FROM gm_orders WHERE status = 'OPEN' GROUP BY table_id HAVING COUNT(*) > 1;"
   ```

---

*"Teste massivo não é sobre perfeição. É sobre descobrir limites reais."*
