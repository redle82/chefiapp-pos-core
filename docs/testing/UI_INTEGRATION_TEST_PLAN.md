# ChefIApp - Plano de Testes UI + Backend

**Data:** 2026-01-24  
**Versão:** 1.0.0  
**Dependência:** v1.3.0-stress-validated

---

## Objetivo

Validar a integração entre as interfaces (Mobile, Web) e o backend validado, garantindo que a UX funciona corretamente com dados reais.

---

## Pré-requisitos

### Backend

```bash
cd docker-tests
make start
# Verificar: http://localhost:54398 responde
```

### Frontends

```bash
# Ativar ambiente de stress
./scripts/start-stress-env.sh

# Ou manualmente:
cp mobile-app/.env.stress-local mobile-app/.env
cp merchant-portal/.env.stress-local merchant-portal/.env.local
```

---

## FASE B2: Primeira Conexão (Read-Only)

### Objetivo
Ver dados reais do harness na UI, sem interação.

### Mobile App (Expo)

| # | Teste | Esperado | Status |
|---|-------|----------|--------|
| 1 | App inicia | Tela de login aparece | ☐ |
| 2 | Badge de ambiente | "🧪 STRESS LOCAL" visível | ☐ |
| 3 | Lista restaurantes | Mostra 10+ restaurantes | ☐ |
| 4 | Lista staff | Mostra funcionários | ☐ |
| 5 | Lista mesas | Mostra 10 mesas | ☐ |
| 6 | Lista produtos | Mostra 20 produtos | ☐ |

### Merchant Portal (Web)

| # | Teste | Esperado | Status |
|---|-------|----------|--------|
| 1 | Site carrega | Dashboard aparece | ☐ |
| 2 | Badge de ambiente | "🧪 STRESS LOCAL" visível | ☐ |
| 3 | Lista pedidos | Mostra pedidos existentes | ☐ |
| 4 | Lista produtos | Catálogo carrega | ☐ |
| 5 | Lista mesas | Status das mesas | ☐ |

---

## FASE B3: Fluxos Humanos Básicos

### 3.1 Fluxo do Garçom (Mobile)

| Step | Ação | Verificação |
|------|------|-------------|
| 1 | Abrir mesa | Mesa muda status para "open" |
| 2 | Criar pedido | Pedido aparece com status "OPEN" |
| 3 | Adicionar item | Item aparece na lista |
| 4 | Adicionar mais itens | Total atualiza |
| 5 | Enviar pedido | Status muda para enviado |
| 6 | Verificar no banco | `SELECT * FROM gm_orders WHERE...` |

### 3.2 Fluxo da Cozinha (KDS)

| Step | Ação | Verificação |
|------|------|-------------|
| 1 | Pedido aparece | Item com status "pending" |
| 2 | Bump item | Status muda para "ready" |
| 3 | Todos items ready | Pedido muda para "READY" |
| 4 | Realtime | Garçom vê atualização |

### 3.3 Fluxo do Gerente (Web)

| Step | Ação | Verificação |
|------|------|-------------|
| 1 | Ver dashboard | Métricas carregam |
| 2 | Ver pedidos | Lista atualizada |
| 3 | Ver tarefas | Tarefas por status |
| 4 | Filtrar por data | Filtro funciona |

---

## FASE B4: Testes de Erro Humano

### Cenários de Stress de UX

| Cenário | Como testar | Esperado |
|---------|-------------|----------|
| Double-click | Clicar 2x em "Enviar Pedido" | Apenas 1 pedido criado |
| Rede lenta | Throttle network | Loading state + retry |
| Tela fechada | Fechar no meio da operação | Estado consistente |
| Refresh | F5 durante operação | Dados não duplicados |
| App suspenso | Minimizar app no mobile | Reconecta ao voltar |
| Token expirado | Aguardar timeout | Redirect para login |

### Verificação Pós-Erro

```sql
-- Verificar duplicações
SELECT table_number, COUNT(*) 
FROM gm_orders 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY table_number
HAVING COUNT(*) > 1;

-- Verificar orphans
SELECT COUNT(*) FROM gm_order_items oi
LEFT JOIN gm_orders o ON o.id = oi.order_id
WHERE o.id IS NULL;
```

---

## FASE B5: Regressão Automática

### Antes de cada PR

```bash
cd docker-tests
make chaos-test
```

### Critério de Merge

| Check | Obrigatório |
|-------|-------------|
| Chaos tests 9/9 | ✅ |
| Zero orphan items | ✅ |
| Lint pass | ✅ |
| Build pass | ✅ |

---

## Checklist Final

### Setup
- [ ] Backend rodando (`make start`)
- [ ] Seed executado (10+ restaurantes)
- [ ] .env configurado para stress-local
- [ ] Badge de ambiente visível

### Mobile
- [ ] App conecta ao backend local
- [ ] Dados carregam corretamente
- [ ] Fluxo de pedido funciona
- [ ] Nenhuma duplicação

### Web
- [ ] Portal conecta ao backend local
- [ ] Dashboard carrega
- [ ] Filtros funcionam
- [ ] Realtime atualiza

### Integridade
- [ ] Zero orphan items
- [ ] Zero pedidos duplicados
- [ ] Chaos test passa

---

## Comandos Úteis

```bash
# Iniciar ambiente completo
./scripts/start-stress-env.sh

# Verificar backend
curl http://localhost:54398/rest/v1/gm_restaurants

# Verificar banco
docker compose exec postgres psql -U postgres -d chefiapp_test

# Rodar chaos test
cd docker-tests && make chaos-test

# Ver logs
cd docker-tests && make logs
```

---

*Plano de testes gerado para ChefIApp v1.3.0-stress-validated*
