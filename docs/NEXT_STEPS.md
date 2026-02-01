# Próximos Passos - ChefIApp

**Data:** 2026-01-25
**Status Atual:** ✅ Realtime corrigido, sistema funcional

---

## 🎯 Situação Atual

### ✅ Concluído Hoje

1. **Localização do Banco de Dados** - Documentado

   - Docker Core rodando na porta `54320`
   - Postgres: ✅ Healthy
   - PostgREST: ✅ Running
   - **Realtime: ✅ Running** (CORRIGIDO!)

2. **Correção do Realtime** - ✅ Resolvido

   - Atualizada versão: `v2.25.35` → `v2.34.47`
   - Criado schema `_realtime` no banco
   - Ajustada configuração de variáveis
   - Container rodando corretamente

3. **KDS Perfeito** - Fases 1-4 concluídas

   - Fase 1: Hierarquia Visual ✅
   - Fase 2: Origem Clara ✅
   - Fase 3: Tempo Visível ✅
   - Fase 4: Ação Óbvia ✅
   - Fase 5: Zero Ruído ⏳ (Pendente)

4. **Fluxo Web/QR Mesa** - Implementado
   - Página pública funcionando
   - QR Codes para mesas
   - Origem `QR_MESA` integrada

---

## 🚀 Próximos Passos (Prioridade)

### 1. 🟢 VALIDAÇÃO: Testar Realtime no KDS

**Status:** Realtime corrigido, precisa validação

**Tarefas:**

- [ ] Abrir KDS no navegador
- [ ] Criar pedido via TPV ou Web
- [ ] Verificar se KDS atualiza automaticamente (sem refresh)
- [ ] Testar mudança de status (NOVO → EM PREPARO → PRONTO)
- [ ] Validar sincronização em tempo real

**Tempo estimado:** 15-30 minutos

---

### 2. 🟡 IMPORTANTE: Finalizar KDS Fase 5 - Zero Ruído

**Status:** Fases 1-4 concluídas, Fase 5 pendente

**Objetivo:** Remover informações desnecessárias, simplificar layout

**Tarefas:**

- [ ] Revisar informações exibidas no KDS
- [ ] Remover ruído desnecessário
- [ ] Simplificar layout
- [ ] Validar com usuários

**Tempo estimado:** 2-3 horas

---

### 3. 🟢 VALIDAÇÃO: Testar Fluxo Completo Web/QR Mesa

**Status:** Implementado, precisa validação end-to-end

**Tarefas:**

- [ ] Testar criação de pedido via QR Mesa
- [ ] Verificar origem `QR_MESA` no KDS
- [ ] Validar constraint `one_open_order_per_table`
- [ ] Testar bloqueio de pedido duplicado
- [ ] Validar em diferentes navegadores/dispositivos

**Tempo estimado:** 1-2 horas

---

### 4. 🟢 MELHORIAS: Observabilidade e Monitoramento

**Objetivo:** Dashboard de observabilidade para acompanhar sistema

**Tarefas:**

- [ ] Criar dashboard de métricas
- [ ] Monitorar pedidos em tempo real
- [ ] Alertas para problemas críticos
- [ ] Logs estruturados

**Tempo estimado:** 4-6 horas

---

### 5. 🟢 PILOTO: Preparar Restaurante Piloto

**Objetivo:** Validar sistema em ambiente real

**Tarefas:**

- [ ] Configurar restaurante piloto
- [ ] Preparar dados de teste
- [ ] Treinar equipe
- [ ] Executar piloto de 7 dias
- [ ] Coletar feedback e métricas

**Tempo estimado:** 1 semana

---

## 📋 Checklist Rápido

### Agora (Prioridade Alta)

- [x] ✅ Corrigir Realtime
- [x] ✅ Validar que KDS recebe atualizações via Realtime (configurado)
- [x] ✅ Finalizar KDS Fase 5 (Zero Ruído)
- [x] ✅ Validar fluxo Web/QR Mesa (19 testes passaram)
- [x] ✅ Guias de teste manual criados
- [ ] 🟢 Teste manual: Validar Realtime no KDS (criar pedido e ver atualização)
- [ ] 🟢 Teste manual: Validar origem QR_MESA no KDS

### Esta Semana

- [x] ✅ KDS Fase 5 (Zero Ruído) - CONCLUÍDA
- [x] ✅ Fluxo Web/QR Mesa - Validado (19 testes passaram)
- [x] ✅ Documentação completa criada
- [ ] 🟢 Executar testes manuais seguindo guias criados

### Próximas Semanas

- [ ] 🟢 Dashboard de observabilidade
- [ ] 🟢 Preparar piloto
- [ ] 🟢 Executar piloto

---

## 🔧 Comandos Úteis

### Verificar Status do Core

```bash
cd docker-core
docker compose -f docker-compose.core.yml ps
```

### Ver Logs do Realtime

```bash
docker logs chefiapp-core-realtime -f
```

### Reiniciar Realtime

```bash
cd docker-core
docker compose -f docker-compose.core.yml restart realtime
```

### Testar Conectividade

```bash
# Postgres
docker exec chefiapp-core-postgres pg_isready -U postgres

# PostgREST
curl http://localhost:3001

# Realtime (deve retornar "Not Found" mas significa que está rodando)
curl http://localhost:4000/
```

---

## 📊 Status dos Serviços

| Serviço       | Container                 | Porta   | Status     |
| ------------- | ------------------------- | ------- | ---------- |
| **Postgres**  | `chefiapp-core-postgres`  | `54320` | ✅ Healthy |
| **PostgREST** | `chefiapp-core-postgrest` | `3001`  | ✅ Running |
| **Realtime**  | `chefiapp-core-realtime`  | `4000`  | ✅ Running |

---

## 🎯 Objetivo Final

**Sistema 100% funcional com:**

- ✅ Core validado e estável
- ✅ Realtime funcionando
- ✅ KDS perfeito (todas as fases)
- ✅ Fluxo Web/QR Mesa funcionando
- ✅ Sincronização em tempo real
- ✅ Pronto para piloto real

---

**Última atualização:** 2026-01-25
