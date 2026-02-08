# MEGA OPERATIONAL SIMULATOR - Relatório v2

## Configuração
- **Modo:** small
- **Seed:** 1769277915961
- **Duração Real:** 180.1s
- **Horas Simuladas:** 24h
- **Multiplicador:** 480.0x
- **Restaurantes:** 20

## Métricas Gerais

| Métrica | Valor |
|---------|-------|
| Pedidos Criados | 614 |
| Print Jobs | 1375 |
| Eventos | 644 |
| Tarefas Criadas | 210 |
| Tarefas Completadas | 195 |
| Tarefas Escaladas | 109 |
| Tarefas Failed | 15 |

## Escalonamento (SLA + Hard-Blocking)

| Métrica | Valor |
|---------|-------|
| Escalações → Manager | 80 |
| Escalações → Owner | 29 |
| Bloqueios de Turno | 45 |
| Overrides de Turno | 11 |

## Offline (FASE 2B)

| Métrica | Valor |
|---------|-------|
| Eventos Offline | 39 |
| Janelas Ativadas | 39 |
| Pedidos Enfileirados | 50 |
| Pedidos Sincronizados | 50 |
| Pedidos Failed | 0 |
| Duplicatas Prevenidas | 0 |

## Pedidos por Fonte

| Fonte | Quantidade |
|-------|------------|
| Mobile | 272 |
| POS | 260 |
| QR Web | 82 |

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
| 10:00 | 38 |
| 11:00 | 54 |
| 12:00 | 41 |
| 13:00 | 58 |
| 14:00 | 49 |
| 15:00 | 52 |
| 16:00 | 48 |
| 17:00 | 65 |
| 18:00 | 49 |
| 19:00 | 52 |
| 20:00 | 57 |
| 21:00 | 36 |
| 22:00 | 15 |
| 23:00 | 0 |

## Log de Escalações

| Hora | Restaurante | Tarefa | De → Para | Atraso |
|------|-------------|--------|-----------|--------|
| 10:10 | Test Restaurant 1 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 5min |
| 10:10 | Test Restaurant 1 | Verificar estoque crítico | kitchen (L0) → manager (L1) | 3min |
| 10:10 | Test Restaurant 1 | Verificar equipamentos | manager (L0) → owner (L1) | 5min |
| 10:10 | Test Restaurant 3 | Verificar caixa inicial | manager (L0) → owner (L1) | 5min |
| 10:10 | Test Restaurant 3 | Verificar equipamentos | manager (L0) → owner (L1) | 5min |
| 10:10 | Test Restaurant 5 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 5min |
| 10:10 | Test Restaurant 5 | Verificar estoque crítico | kitchen (L0) → manager (L1) | 3min |
| 10:10 | Test Restaurant 5 | Verificar caixa inicial | manager (L0) → owner (L1) | 5min |
| 10:10 | Test Restaurant 5 | Verificar equipamentos | manager (L0) → owner (L1) | 5min |
| 10:10 | Restaurant 7 | Verificar estoque crítico | kitchen (L0) → manager (L1) | 3min |
| 10:10 | Restaurant 7 | Verificar caixa inicial | manager (L0) → owner (L1) | 5min |
| 10:10 | Restaurant 7 | Verificar equipamentos | manager (L0) → owner (L1) | 5min |
| 10:10 | Restaurant 9 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 5min |
| 10:10 | Restaurant 9 | Verificar estoque crítico | kitchen (L0) → manager (L1) | 3min |
| 10:10 | Restaurant 9 | Verificar caixa inicial | manager (L0) → owner (L1) | 5min |
| 10:10 | Restaurant 9 | Verificar equipamentos | manager (L0) → owner (L1) | 5min |
| 10:10 | Restaurant 11 | Verificar estoque crítico | kitchen (L0) → manager (L1) | 3min |
| 10:10 | Restaurant 11 | Verificar caixa inicial | manager (L0) → owner (L1) | 5min |
| 10:10 | Restaurant 11 | Verificar equipamentos | manager (L0) → owner (L1) | 5min |
| 10:11 | Restaurant 13 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 5min |

*... e mais 89 escalações*

## Validação

| Assert | Resultado |
|--------|-----------|
| Orphan Items | ✅ 0 |
| Pedidos Criados | ✅ 614 |
| Eventos | ✅ 644 |
| Tarefas Criadas | ✅ 210 |
| Tarefas Completadas | ✅ 195 |
| Tarefas Escaladas | 109 |
| Tarefas Failed | ⚠️ 15 |
| Offline Sync Failed | ✅ 0 |
| Duplicatas Prevenidas | ✅ 0 |

## Log Offline

| Hora | Restaurante | Evento | Detalhes |
|------|-------------|--------|----------|
| 13:02 | Test Restaurant 1 | OFFLINE_START | Lunch peak - queda de rede |
| 13:02 | Test Restaurant 3 | OFFLINE_START | Lunch peak - queda de rede |
| 13:02 | Test Restaurant 4 | OFFLINE_START | Lunch peak - queda de rede |
| 13:02 | Restaurant 8 | OFFLINE_START | Lunch peak - queda de rede |
| 13:02 | Restaurant 9 | OFFLINE_START | Lunch peak - queda de rede |
| 13:02 | Restaurant 10 | OFFLINE_START | Lunch peak - queda de rede |
| 13:02 | Restaurant 11 | OFFLINE_START | Lunch peak - queda de rede |
| 13:02 | Restaurant 15 | OFFLINE_START | Lunch peak - queda de rede |
| 13:02 | Restaurant 17 | OFFLINE_START | Lunch peak - queda de rede |
| 13:02 | Restaurant 20 | OFFLINE_START | Lunch peak - queda de rede |
| 13:10 | Test Restaurant 2 | OFFLINE_START | Lunch peak - queda de rede |
| 13:10 | Test Restaurant 5 | OFFLINE_START | Lunch peak - queda de rede |
| 13:10 | Restaurant 7 | OFFLINE_START | Lunch peak - queda de rede |
| 13:10 | Restaurant 13 | OFFLINE_START | Lunch peak - queda de rede |
| 13:10 | Restaurant 14 | OFFLINE_START | Lunch peak - queda de rede |

## Status: ✅ PASSED

---
*FASE 2A: SLA + Escalonamento + Hard-Blocking*
*FASE 2B: Offline Agressivo Durante Picos*
*Gerado em 2026-01-24T18:08:16.120Z*
