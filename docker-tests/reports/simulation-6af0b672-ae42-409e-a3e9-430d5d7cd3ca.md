# MEGA OPERATIONAL SIMULATOR - Relatório v2

## Configuração
- **Modo:** small
- **Seed:** 1769277710571
- **Duração Real:** 180.9s
- **Horas Simuladas:** 24h
- **Multiplicador:** 480.0x
- **Restaurantes:** 20

## Métricas Gerais

| Métrica | Valor |
|---------|-------|
| Pedidos Criados | 595 |
| Print Jobs | 1335 |
| Eventos | 625 |
| Tarefas Criadas | 210 |
| Tarefas Completadas | 201 |
| Tarefas Escaladas | 105 |
| Tarefas Failed | 9 |

## Escalonamento (SLA + Hard-Blocking)

| Métrica | Valor |
|---------|-------|
| Escalações → Manager | 76 |
| Escalações → Owner | 29 |
| Bloqueios de Turno | 45 |
| Overrides de Turno | 8 |

## Offline (FASE 2B)

| Métrica | Valor |
|---------|-------|
| Eventos Offline | 39 |
| Janelas Ativadas | 39 |
| Pedidos Enfileirados | 51 |
| Pedidos Sincronizados | 51 |
| Pedidos Failed | 0 |
| Duplicatas Prevenidas | 0 |

## Pedidos por Fonte

| Fonte | Quantidade |
|-------|------------|
| Mobile | 242 |
| POS | 255 |
| QR Web | 98 |

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
| 10:00 | 41 |
| 11:00 | 43 |
| 12:00 | 51 |
| 13:00 | 56 |
| 14:00 | 47 |
| 15:00 | 52 |
| 16:00 | 55 |
| 17:00 | 48 |
| 18:00 | 57 |
| 19:00 | 43 |
| 20:00 | 57 |
| 21:00 | 28 |
| 22:00 | 17 |
| 23:00 | 0 |

## Log de Escalações

| Hora | Restaurante | Tarefa | De → Para | Atraso |
|------|-------------|--------|-----------|--------|
| 10:11 | Test Restaurant 1 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 6min |
| 10:11 | Test Restaurant 1 | Verificar estoque crítico | kitchen (L0) → manager (L1) | 4min |
| 10:11 | Test Restaurant 1 | Verificar caixa inicial | manager (L0) → owner (L1) | 6min |
| 10:11 | Test Restaurant 1 | Verificar equipamentos | manager (L0) → owner (L1) | 6min |
| 10:11 | Test Restaurant 3 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 6min |
| 10:11 | Test Restaurant 3 | Verificar equipamentos | manager (L0) → owner (L1) | 6min |
| 10:11 | Test Restaurant 5 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 6min |
| 10:11 | Test Restaurant 5 | Verificar estoque crítico | kitchen (L0) → manager (L1) | 4min |
| 10:11 | Test Restaurant 5 | Verificar caixa inicial | manager (L0) → owner (L1) | 6min |
| 10:11 | Test Restaurant 5 | Verificar equipamentos | manager (L0) → owner (L1) | 6min |
| 10:11 | Restaurant 7 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 6min |
| 10:11 | Restaurant 7 | Verificar estoque crítico | kitchen (L0) → manager (L1) | 4min |
| 10:11 | Restaurant 7 | Verificar equipamentos | manager (L0) → owner (L1) | 6min |
| 10:11 | Restaurant 9 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 6min |
| 10:11 | Restaurant 9 | Verificar estoque crítico | kitchen (L0) → manager (L1) | 4min |
| 10:11 | Restaurant 9 | Verificar equipamentos | manager (L0) → owner (L1) | 6min |
| 10:11 | Restaurant 11 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 6min |
| 10:11 | Restaurant 11 | Verificar estoque crítico | kitchen (L0) → manager (L1) | 4min |
| 10:11 | Restaurant 11 | Verificar equipamentos | manager (L0) → owner (L1) | 6min |
| 10:11 | Restaurant 13 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 6min |

*... e mais 85 escalações*

## Validação

| Assert | Resultado |
|--------|-----------|
| Orphan Items | ✅ 0 |
| Pedidos Criados | ✅ 595 |
| Eventos | ✅ 625 |
| Tarefas Criadas | ✅ 210 |
| Tarefas Completadas | ✅ 201 |
| Tarefas Escaladas | 105 |
| Tarefas Failed | ⚠️ 9 |
| Offline Sync Failed | ✅ 0 |
| Duplicatas Prevenidas | ✅ 0 |

## Log Offline

| Hora | Restaurante | Evento | Detalhes |
|------|-------------|--------|----------|
| 13:04 | Test Restaurant 1 | OFFLINE_START | Lunch peak - queda de rede |
| 13:04 | Test Restaurant 3 | OFFLINE_START | Lunch peak - queda de rede |
| 13:04 | Test Restaurant 5 | OFFLINE_START | Lunch peak - queda de rede |
| 13:04 | Restaurant 9 | OFFLINE_START | Lunch peak - queda de rede |
| 13:04 | Restaurant 12 | OFFLINE_START | Lunch peak - queda de rede |
| 13:04 | Restaurant 13 | OFFLINE_START | Lunch peak - queda de rede |
| 13:04 | Restaurant 14 | OFFLINE_START | Lunch peak - queda de rede |
| 13:04 | Restaurant 16 | OFFLINE_START | Lunch peak - queda de rede |
| 13:04 | Restaurant 17 | OFFLINE_START | Lunch peak - queda de rede |
| 13:04 | Restaurant 18 | OFFLINE_START | Lunch peak - queda de rede |
| 13:04 | Restaurant 20 | OFFLINE_START | Lunch peak - queda de rede |
| 13:13 | Test Restaurant 2 | OFFLINE_START | Lunch peak - queda de rede |
| 13:13 | Test Restaurant 4 | OFFLINE_START | Lunch peak - queda de rede |
| 13:13 | Restaurant 6 | OFFLINE_START | Lunch peak - queda de rede |
| 13:13 | Restaurant 7 | OFFLINE_START | Lunch peak - queda de rede |

## Status: ✅ PASSED

---
*FASE 2A: SLA + Escalonamento + Hard-Blocking*
*FASE 2B: Offline Agressivo Durante Picos*
*Gerado em 2026-01-24T18:04:51.488Z*
