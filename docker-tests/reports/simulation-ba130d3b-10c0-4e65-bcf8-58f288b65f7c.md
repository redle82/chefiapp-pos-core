# MEGA OPERATIONAL SIMULATOR - Relatório v2

## Configuração
- **Modo:** small
- **Seed:** 1769275238876
- **Duração Real:** 300.2s
- **Horas Simuladas:** 24h
- **Multiplicador:** 288.0x
- **Restaurantes:** 5

## Métricas Gerais

| Métrica | Valor |
|---------|-------|
| Pedidos Criados | 346 |
| Print Jobs | 758 |
| Eventos | 356 |
| Tarefas Criadas | 70 |
| Tarefas Completadas | 65 |
| Tarefas Escaladas | 27 |
| Tarefas Failed | 5 |

## Escalonamento (SLA + Hard-Blocking)

| Métrica | Valor |
|---------|-------|
| Escalações → Manager | 18 |
| Escalações → Owner | 9 |
| Bloqueios de Turno | 15 |
| Overrides de Turno | 3 |

## Offline (FASE 2B)

| Métrica | Valor |
|---------|-------|
| Eventos Offline | 10 |
| Janelas Ativadas | 10 |
| Pedidos Enfileirados | 35 |
| Pedidos Sincronizados | 35 |
| Pedidos Failed | 0 |
| Duplicatas Prevenidas | 0 |

## Pedidos por Fonte

| Fonte | Quantidade |
|-------|------------|
| Mobile | 134 |
| POS | 161 |
| QR Web | 51 |

## Distribuição por Hora

| Hora | Pedidos |
|------|---------|
| 0:00 | 0 |
| 1:00 | 0 |
| 2:00 | 0 |
| 3:00 | 0 |
| 4:00 | 0 |
| 5:00 | 0 |
| 6:00 | 0 |
| 7:00 | 0 |
| 8:00 | 0 |
| 9:00 | 0 |
| 10:00 | 16 |
| 11:00 | 32 |
| 12:00 | 33 |
| 13:00 | 27 |
| 14:00 | 37 |
| 15:00 | 25 |
| 16:00 | 27 |
| 17:00 | 29 |
| 18:00 | 32 |
| 19:00 | 30 |
| 20:00 | 35 |
| 21:00 | 17 |
| 22:00 | 6 |
| 23:00 | 0 |

## Log de Escalações

| Hora | Restaurante | Tarefa | De → Para | Atraso |
|------|-------------|--------|-----------|--------|
| 10:08 | Test Restaurant 1 | Verificar caixa inicial | manager (L0) → owner (L1) | 2min |
| 10:08 | Test Restaurant 1 | Verificar equipamentos | manager (L0) → owner (L1) | 2min |
| 10:08 | Test Restaurant 3 | Verificar caixa inicial | manager (L0) → owner (L1) | 2min |
| 10:08 | Test Restaurant 3 | Verificar equipamentos | manager (L0) → owner (L1) | 2min |
| 10:13 | Test Restaurant 1 | Verificar estoque crítico | kitchen (L0) → manager (L1) | 4min |
| 10:13 | Test Restaurant 1 | Verificar caixa inicial | owner (L1) → owner (L2) | 6min |
| 10:13 | Test Restaurant 3 | Verificar estoque crítico | kitchen (L0) → manager (L1) | 4min |
| 10:13 | Test Restaurant 3 | Verificar caixa inicial | owner (L1) → owner (L2) | 6min |
| 10:13 | Test Restaurant 3 | Verificar equipamentos | owner (L1) → owner (L2) | 6min |
| 10:13 | Test Restaurant 4 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 6min |
| 10:13 | Test Restaurant 4 | Verificar estoque crítico | kitchen (L0) → manager (L1) | 4min |
| 10:13 | Test Restaurant 4 | Verificar equipamentos | manager (L0) → owner (L1) | 6min |
| 10:18 | Test Restaurant 1 | Verificar estoque crítico | manager (L1) → owner (L2) | 9min |
| 10:18 | Test Restaurant 4 | Verificar temperatura das câma | manager (L1) → owner (L2) | 11min |
| 11:07 | Test Restaurant 2 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 2min |
| 11:07 | Test Restaurant 2 | Verificar caixa inicial | manager (L0) → owner (L1) | 2min |
| 11:07 | Test Restaurant 2 | Verificar equipamentos | manager (L0) → owner (L1) | 2min |
| 11:07 | Test Restaurant 5 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 2min |
| 11:07 | Test Restaurant 5 | Verificar equipamentos | manager (L0) → owner (L1) | 2min |
| 11:12 | Test Restaurant 2 | Verificar estoque crítico | kitchen (L0) → manager (L1) | 4min |

*... e mais 7 escalações*

## Validação

| Assert | Resultado |
|--------|-----------|
| Orphan Items | ✅ 0 |
| Pedidos Criados | ✅ 346 |
| Eventos | ✅ 356 |
| Tarefas Criadas | ✅ 70 |
| Tarefas Completadas | ✅ 65 |
| Tarefas Escaladas | 27 |
| Tarefas Failed | ⚠️ 5 |
| Offline Sync Failed | ✅ 0 |
| Duplicatas Prevenidas | ✅ 0 |

## Log Offline

| Hora | Restaurante | Evento | Detalhes |
|------|-------------|--------|----------|
| 13:01 | Test Restaurant 1 | OFFLINE_START | Lunch peak - queda de rede |
| 13:01 | Test Restaurant 2 | OFFLINE_START | Lunch peak - queda de rede |
| 13:01 | Test Restaurant 3 | OFFLINE_START | Lunch peak - queda de rede |
| 13:01 | Test Restaurant 4 | OFFLINE_START | Lunch peak - queda de rede |
| 13:01 | Test Restaurant 5 | OFFLINE_START | Lunch peak - queda de rede |
| 13:30 | Test Restaurant 1 | ONLINE_RESTORED | 4 actions |
| 13:30 | Test Restaurant 2 | ONLINE_RESTORED | 2 actions |
| 13:30 | Test Restaurant 3 | ONLINE_RESTORED | 3 actions |
| 13:30 | Test Restaurant 4 | ONLINE_RESTORED | 3 actions |
| 13:30 | Test Restaurant 5 | ONLINE_RESTORED | 4 actions |
| 20:30 | Test Restaurant 1 | OFFLINE_START | Dinner peak - instabilidade |
| 20:30 | Test Restaurant 3 | OFFLINE_START | Dinner peak - instabilidade |
| 20:30 | Test Restaurant 4 | OFFLINE_START | Dinner peak - instabilidade |
| 20:30 | Test Restaurant 5 | OFFLINE_START | Dinner peak - instabilidade |
| 20:39 | Test Restaurant 2 | OFFLINE_START | Dinner peak - instabilidade |

## Status: ✅ PASSED

---
*FASE 2A: SLA + Escalonamento + Hard-Blocking*
*FASE 2B: Offline Agressivo Durante Picos*
*Gerado em 2026-01-24T17:25:39.126Z*
